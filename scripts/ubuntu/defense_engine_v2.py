#!/usr/bin/env python3
"""
Defense Engine V2 - Real-time Analytics with Spark Structured Streaming
========================================================================
Implements the analytics layer from the research paper:
- Real-time log processing from Kafka
- Feature extraction and enrichment
- ML-based anomaly detection (Isolation Forest)
- Threat classification (Random Forest)
- LLM integration for natural language explanations

Requirements:
    pip install pyspark kafka-python scikit-learn requests pandas numpy
"""

import json
import time
import signal
import sys
import logging
from datetime import datetime, timedelta
from collections import defaultdict
import threading

# Spark imports
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, from_json, window, count, avg, sum as spark_sum,
    expr, lit, when, struct, to_json, current_timestamp,
    udf, explode, split, regexp_extract
)
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType,
    TimestampType, FloatType, BooleanType, ArrayType, MapType
)

# ML imports
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

# HTTP for Ollama integration
import requests

# ===========================================
# Configuration
# ===========================================
KAFKA_BOOTSTRAP = 'localhost:9092'
OLLAMA_URL = 'http://localhost:11434'
OLLAMA_MODEL = 'gemma:7b'  # or 'llama3.2:3b'

# Anomaly detection thresholds
ANOMALY_THRESHOLD = -0.5  # Isolation Forest score threshold
THREAT_SCORE_HIGH = 0.8
THREAT_SCORE_MEDIUM = 0.5

# Sliding window configurations
WINDOW_DURATION = "5 minutes"
SLIDING_INTERVAL = "1 minute"

# ===========================================
# Logging Setup
# ===========================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('DefenseEngine')

# ===========================================
# Schema Definitions
# ===========================================
FIREWALL_LOG_SCHEMA = StructType([
    StructField("timestamp", StringType(), True),
    StructField("source_collector", StringType(), True),
    StructField("severity", StringType(), True),
    StructField("raw_message", StringType(), True),
    StructField("parsed", MapType(StringType(), StringType()), True),
    StructField("enriched_at", StringType(), True)
])

SURICATA_ALERT_SCHEMA = StructType([
    StructField("timestamp", StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("src_ip", StringType(), True),
    StructField("src_port", IntegerType(), True),
    StructField("dest_ip", StringType(), True),
    StructField("dest_port", IntegerType(), True),
    StructField("proto", StringType(), True),
    StructField("alert", StructType([
        StructField("signature", StringType(), True),
        StructField("signature_id", IntegerType(), True),
        StructField("severity", IntegerType(), True),
        StructField("category", StringType(), True)
    ]), True)
])

# ===========================================
# ML Model Manager
# ===========================================
class MLModelManager:
    """Manages ML models for threat detection"""
    
    def __init__(self):
        self.isolation_forest = None
        self.random_forest = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'packet_count', 'byte_count', 'unique_ports',
            'unique_ips', 'block_ratio', 'time_variance'
        ]
        self.is_trained = False
        
    def train_isolation_forest(self, training_data):
        """Train the Isolation Forest model for anomaly detection"""
        logger.info("Training Isolation Forest model...")
        
        self.isolation_forest = IsolationForest(
            n_estimators=100,
            contamination=0.1,  # Expect 10% anomalies
            random_state=42,
            n_jobs=-1
        )
        
        # Scale features
        scaled_data = self.scaler.fit_transform(training_data)
        self.isolation_forest.fit(scaled_data)
        
        logger.info("Isolation Forest training complete")
        self.is_trained = True
        
    def train_random_forest(self, features, labels):
        """Train Random Forest for threat classification"""
        logger.info("Training Random Forest classifier...")
        
        self.random_forest = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        scaled_features = self.scaler.transform(features)
        self.random_forest.fit(scaled_features, labels)
        
        logger.info("Random Forest training complete")
        
    def predict_anomaly(self, features):
        """Predict if a sample is an anomaly"""
        if not self.is_trained or self.isolation_forest is None:
            return 0.0, False
            
        scaled = self.scaler.transform([features])
        score = self.isolation_forest.decision_function(scaled)[0]
        is_anomaly = score < ANOMALY_THRESHOLD
        
        return score, is_anomaly
    
    def classify_threat(self, features):
        """Classify the type of threat"""
        if self.random_forest is None:
            return "unknown", 0.0
            
        scaled = self.scaler.transform([features])
        prediction = self.random_forest.predict(scaled)[0]
        probabilities = self.random_forest.predict_proba(scaled)[0]
        confidence = max(probabilities)
        
        return prediction, confidence

# ===========================================
# LLM Integration
# ===========================================
class GemmaAnalyzer:
    """LLM-based threat analysis using Ollama"""
    
    def __init__(self, url=OLLAMA_URL, model=OLLAMA_MODEL):
        self.url = url
        self.model = model
        self.available = self._check_availability()
        
    def _check_availability(self):
        """Check if Ollama is available"""
        try:
            response = requests.get(f"{self.url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                logger.info(f"Ollama available with {len(models)} models")
                return True
        except:
            logger.warning("Ollama not available - LLM analysis disabled")
        return False
    
    def analyze_session(self, session_data):
        """Analyze a suspicious session and generate explanation"""
        if not self.available:
            return None
            
        prompt = f"""Analyze this network security session and provide a threat assessment:

Session Data:
- Source IP: {session_data.get('src_ip', 'N/A')}
- Destination IP: {session_data.get('dst_ip', 'N/A')}
- Protocol: {session_data.get('protocol', 'N/A')}
- Packet Count: {session_data.get('packet_count', 0)}
- Blocked Packets: {session_data.get('blocked_count', 0)}
- Time Span: {session_data.get('time_span', 'N/A')}
- Anomaly Score: {session_data.get('anomaly_score', 'N/A')}

Provide:
1. Threat assessment (Critical/High/Medium/Low)
2. Attack type identification
3. Recommended action
4. Brief explanation

Respond in JSON format only:
{{"threat_level": "...", "attack_type": "...", "action": "...", "explanation": "..."}}
"""
        
        try:
            response = requests.post(
                f"{self.url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.1}
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json().get('response', '')
                # Try to parse JSON from response
                import re
                json_match = re.search(r'\{[^}]+\}', result)
                if json_match:
                    return json.loads(json_match.group())
                    
        except Exception as e:
            logger.error(f"LLM analysis error: {e}")
            
        return None
    
    def generate_rule_recommendation(self, threat_data):
        """Generate firewall rule recommendation from threat data"""
        if not self.available:
            return None
            
        prompt = f"""Based on this detected threat, generate a pfSense firewall rule:

Threat Data:
{json.dumps(threat_data, indent=2)}

Generate a JSON rule in this format:
{{"type": "ip|domain", "target": "...", "action": "block|allow", "interface": "wan|lan|both", "reason": "..."}}
"""
        
        try:
            response = requests.post(
                f"{self.url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.1}
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json().get('response', '')
                return json.loads(result)
                
        except Exception as e:
            logger.error(f"Rule generation error: {e}")
            
        return None

# ===========================================
# Threat Aggregator
# ===========================================
class ThreatAggregator:
    """Aggregates and tracks threats in sliding windows"""
    
    def __init__(self):
        self.ip_stats = defaultdict(lambda: {
            'packet_count': 0,
            'blocked_count': 0,
            'ports_accessed': set(),
            'first_seen': None,
            'last_seen': None,
            'protocols': set()
        })
        self.lock = threading.Lock()
        
    def update(self, log_data):
        """Update stats from a new log entry"""
        with self.lock:
            src_ip = log_data.get('src_ip')
            if not src_ip:
                return
                
            stats = self.ip_stats[src_ip]
            stats['packet_count'] += 1
            
            if log_data.get('action', '').lower() in ['block', 'drop', 'reject']:
                stats['blocked_count'] += 1
                
            if log_data.get('dst_port'):
                stats['ports_accessed'].add(log_data['dst_port'])
                
            if log_data.get('protocol'):
                stats['protocols'].add(log_data['protocol'])
                
            now = datetime.utcnow()
            if not stats['first_seen']:
                stats['first_seen'] = now
            stats['last_seen'] = now
            
    def get_features(self, ip):
        """Extract features for ML model input"""
        with self.lock:
            stats = self.ip_stats.get(ip)
            if not stats:
                return None
                
            time_span = (stats['last_seen'] - stats['first_seen']).total_seconds() if stats['first_seen'] else 0
            
            return [
                stats['packet_count'],
                stats['blocked_count'],
                len(stats['ports_accessed']),
                1,  # unique IPs (would need cross-reference)
                stats['blocked_count'] / max(stats['packet_count'], 1),
                time_span
            ]
            
    def get_session_data(self, ip):
        """Get session data for LLM analysis"""
        with self.lock:
            stats = self.ip_stats.get(ip)
            if not stats:
                return None
                
            return {
                'src_ip': ip,
                'packet_count': stats['packet_count'],
                'blocked_count': stats['blocked_count'],
                'unique_ports': len(stats['ports_accessed']),
                'protocols': list(stats['protocols']),
                'time_span': str(stats['last_seen'] - stats['first_seen']) if stats['first_seen'] else 'N/A'
            }
    
    def cleanup_old(self, max_age_minutes=30):
        """Remove old entries to prevent memory bloat"""
        with self.lock:
            cutoff = datetime.utcnow() - timedelta(minutes=max_age_minutes)
            to_remove = [
                ip for ip, stats in self.ip_stats.items()
                if stats['last_seen'] and stats['last_seen'] < cutoff
            ]
            for ip in to_remove:
                del self.ip_stats[ip]

# ===========================================
# Main Defense Engine
# ===========================================
class DefenseEngine:
    """Main orchestrator for the defense analytics pipeline"""
    
    def __init__(self):
        self.running = True
        self.ml_manager = MLModelManager()
        self.llm_analyzer = GemmaAnalyzer()
        self.threat_aggregator = ThreatAggregator()
        self.spark = None
        
    def initialize_spark(self):
        """Initialize Spark session"""
        logger.info("Initializing Spark session...")
        
        self.spark = SparkSession.builder \
            .appName("CyberDefenseEngine") \
            .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
            .config("spark.sql.streaming.checkpointLocation", "/tmp/spark_checkpoint") \
            .config("spark.driver.memory", "2g") \
            .config("spark.executor.memory", "2g") \
            .config("spark.sql.shuffle.partitions", "4") \
            .getOrCreate()
        
        self.spark.sparkContext.setLogLevel("WARN")
        logger.info("Spark session initialized")
        
    def process_firewall_stream(self):
        """Process firewall logs from Kafka"""
        logger.info("Starting firewall log stream processing...")
        
        # Read from Kafka
        df = self.spark \
            .readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP) \
            .option("subscribe", "firewall-logs") \
            .option("startingOffsets", "latest") \
            .load()
        
        # Parse JSON
        parsed = df.select(
            from_json(col("value").cast("string"), FIREWALL_LOG_SCHEMA).alias("data"),
            col("timestamp").alias("kafka_timestamp")
        ).select("data.*", "kafka_timestamp")
        
        # Windowed aggregation
        windowed = parsed \
            .withWatermark("kafka_timestamp", "10 minutes") \
            .groupBy(
                window(col("kafka_timestamp"), WINDOW_DURATION, SLIDING_INTERVAL),
                col("severity")
            ) \
            .agg(
                count("*").alias("event_count"),
                expr("collect_set(parsed['src_ip'])").alias("unique_sources")
            )
        
        # Write to console for monitoring
        query = windowed.writeStream \
            .outputMode("update") \
            .format("console") \
            .option("truncate", False) \
            .trigger(processingTime="30 seconds") \
            .start()
        
        return query
    
    def process_suricata_stream(self):
        """Process Suricata alerts from Kafka"""
        logger.info("Starting Suricata alert stream processing...")
        
        df = self.spark \
            .readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP) \
            .option("subscribe", "suricata-alerts") \
            .option("startingOffsets", "latest") \
            .load()
        
        # Parse Suricata EVE JSON
        parsed = df.select(
            from_json(col("value").cast("string"), SURICATA_ALERT_SCHEMA).alias("data"),
            col("timestamp").alias("kafka_timestamp")
        ).select("data.*", "kafka_timestamp")
        
        # Filter only alerts
        alerts = parsed.filter(col("event_type") == "alert")
        
        # Aggregate by source IP and alert category
        windowed_alerts = alerts \
            .withWatermark("kafka_timestamp", "5 minutes") \
            .groupBy(
                window(col("kafka_timestamp"), "5 minutes", "1 minute"),
                col("src_ip"),
                col("alert.category")
            ) \
            .agg(
                count("*").alias("alert_count"),
                expr("collect_list(alert.signature)").alias("signatures")
            )
        
        query = windowed_alerts.writeStream \
            .outputMode("update") \
            .format("console") \
            .trigger(processingTime="10 seconds") \
            .start()
        
        return query
    
    def run_ml_analysis(self):
        """Run periodic ML analysis on aggregated data"""
        logger.info("Starting ML analysis loop...")
        
        while self.running:
            try:
                # Cleanup old data
                self.threat_aggregator.cleanup_old()
                
                # Check top talkers for anomalies
                for ip, stats in list(self.threat_aggregator.ip_stats.items()):
                    if stats['packet_count'] < 10:
                        continue  # Skip low-volume IPs
                        
                    features = self.threat_aggregator.get_features(ip)
                    if features:
                        score, is_anomaly = self.ml_manager.predict_anomaly(features)
                        
                        if is_anomaly:
                            logger.warning(f"ANOMALY DETECTED: {ip} (score: {score:.3f})")
                            
                            # Get LLM analysis
                            session_data = self.threat_aggregator.get_session_data(ip)
                            session_data['anomaly_score'] = score
                            
                            llm_result = self.llm_analyzer.analyze_session(session_data)
                            if llm_result:
                                logger.info(f"LLM Analysis: {json.dumps(llm_result)}")
                                
                                # Generate rule recommendation
                                rule = self.llm_analyzer.generate_rule_recommendation({
                                    'ip': ip,
                                    'analysis': llm_result,
                                    'features': features
                                })
                                if rule:
                                    logger.info(f"Recommended Rule: {json.dumps(rule)}")
                
                time.sleep(30)  # Run every 30 seconds
                
            except Exception as e:
                logger.error(f"ML analysis error: {e}")
                time.sleep(10)
    
    def start(self):
        """Start the defense engine"""
        print("╔═══════════════════════════════════════════════════════════╗")
        print("║   CYBER DEFENSE ENGINE v2.0 - AI-Powered Analytics        ║")
        print("╚═══════════════════════════════════════════════════════════╝")
        print("")
        
        # Initialize Spark
        self.initialize_spark()
        
        # Generate synthetic training data for initial model
        logger.info("Initializing ML models with baseline data...")
        np.random.seed(42)
        training_data = np.random.randn(1000, 6) * [100, 10, 5, 10, 0.1, 60]
        training_data = np.abs(training_data)
        self.ml_manager.train_isolation_forest(training_data)
        
        # Start streaming queries
        queries = []
        
        try:
            fw_query = self.process_firewall_stream()
            queries.append(fw_query)
        except Exception as e:
            logger.warning(f"Could not start firewall stream: {e}")
        
        try:
            sur_query = self.process_suricata_stream()
            queries.append(sur_query)
        except Exception as e:
            logger.warning(f"Could not start Suricata stream: {e}")
        
        # Start ML analysis in background thread
        ml_thread = threading.Thread(target=self.run_ml_analysis, daemon=True)
        ml_thread.start()
        
        logger.info("Defense Engine running. Press Ctrl+C to stop.")
        
        # Wait for queries
        try:
            for query in queries:
                query.awaitTermination()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            self.running = False
            for query in queries:
                query.stop()
            if self.spark:
                self.spark.stop()

# ===========================================
# Entry Point
# ===========================================
def main():
    engine = DefenseEngine()
    
    def signal_handler(sig, frame):
        engine.running = False
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    engine.start()

if __name__ == '__main__':
    main()
