#!/usr/bin/env python3
"""
UDP to Kafka Bridge - Enhanced Version
=======================================
Receives syslog messages from pfSense/Suricata via UDP
and routes them to appropriate Kafka topics based on content.

Features:
- Multi-topic routing based on log type
- Message validation and enrichment
- Snappy compression for Kafka
- Graceful error handling
- Connection retry logic
"""

import socket
import json
import re
import time
import signal
import sys
from datetime import datetime
from kafka import KafkaProducer
from kafka.errors import KafkaError, NoBrokersAvailable

# ===========================================
# Configuration
# ===========================================
UDP_HOST = '0.0.0.0'
UDP_PORT = 514  # Standard syslog port
KAFKA_BOOTSTRAP = 'localhost:9092'

# Topic routing configuration
TOPIC_ROUTING = {
    'filterlog': 'firewall-logs',        # pfSense firewall logs
    'suricata': 'suricata-alerts',        # Suricata IDS alerts
    'unbound': 'dns-queries',             # DNS resolver logs
    'named': 'dns-queries',               # BIND DNS logs
    'snort': 'suricata-alerts',           # Snort (if used)
    'default': 'firewall-logs'            # Fallback topic
}

# Regex patterns for log parsing
PFSENSE_FILTERLOG_PATTERN = re.compile(
    r'(?P<timestamp>\w+\s+\d+\s+\d+:\d+:\d+)\s+'
    r'(?P<hostname>\S+)\s+'
    r'filterlog\[\d+\]:\s+'
    r'(?P<rule>\d+),(?P<sub_rule>\d*),(?P<anchor>\S*),(?P<tracker>\d*),'
    r'(?P<interface>\w+),(?P<reason>\w+),(?P<action>\w+),'
    r'(?P<direction>\w+),(?P<ip_version>\d+),'
    r'(?P<rest>.*)'
)

SURICATA_EVE_PATTERN = re.compile(r'\{.*"event_type".*\}')

# ===========================================
# Global variables
# ===========================================
producer = None
running = True
stats = {
    'received': 0,
    'processed': 0,
    'errors': 0,
    'by_topic': {}
}

def signal_handler(sig, frame):
    """Handle graceful shutdown"""
    global running
    print("\n[BRIDGE] Shutting down gracefully...")
    running = False

def create_kafka_producer():
    """Create Kafka producer with retry logic"""
    max_retries = 5
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                compression_type='snappy',
                acks='all',
                retries=3,
                batch_size=16384,
                linger_ms=10,
                buffer_memory=33554432,  # 32MB
                max_request_size=1048576  # 1MB
            )
            print(f"[KAFKA] Connected to {KAFKA_BOOTSTRAP}")
            return producer
        except NoBrokersAvailable:
            print(f"[KAFKA] No brokers available (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise
    return None

def determine_topic(message):
    """Determine which Kafka topic based on message content"""
    message_lower = message.lower()
    
    for keyword, topic in TOPIC_ROUTING.items():
        if keyword in message_lower:
            return topic
    
    return TOPIC_ROUTING['default']

def parse_pfsense_log(raw_message):
    """Parse pfSense filterlog format into structured data"""
    match = PFSENSE_FILTERLOG_PATTERN.match(raw_message)
    
    if match:
        data = match.groupdict()
        rest = data.pop('rest', '').split(',')
        
        # Parse IP version specific fields
        if data['ip_version'] == '4':
            if len(rest) >= 12:
                data.update({
                    'tos': rest[0],
                    'ecn': rest[1],
                    'ttl': rest[2],
                    'id': rest[3],
                    'offset': rest[4],
                    'flags': rest[5],
                    'protocol_id': rest[6],
                    'protocol': rest[7],
                    'length': rest[8],
                    'src_ip': rest[9],
                    'dst_ip': rest[10],
                })
                # TCP/UDP additional fields
                if len(rest) >= 14:
                    data['src_port'] = rest[11]
                    data['dst_port'] = rest[12]
        
        return data
    
    return None

def parse_suricata_eve(raw_message):
    """Parse Suricata EVE JSON format"""
    match = SURICATA_EVE_PATTERN.search(raw_message)
    
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    
    return None

def enrich_message(data, source_ip, raw_message):
    """Add enrichment data to the parsed message"""
    enriched = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'source_collector': source_ip,
        'raw_message': raw_message[:1000] if len(raw_message) > 1000 else raw_message,
        'parsed': data if data else None,
        'enriched_at': datetime.utcnow().isoformat() + 'Z'
    }
    
    # Add severity classification
    if data:
        action = data.get('action', '').lower()
        if action in ['block', 'drop', 'reject']:
            enriched['severity'] = 'high'
        elif action in ['pass', 'allow']:
            enriched['severity'] = 'info'
        else:
            enriched['severity'] = 'medium'
    
    return enriched

def process_message(raw_message, source_ip):
    """Process a received syslog message"""
    global stats
    
    stats['received'] += 1
    
    try:
        # Determine topic routing
        topic = determine_topic(raw_message)
        
        # Try to parse the message
        parsed_data = None
        
        if 'filterlog' in raw_message.lower():
            parsed_data = parse_pfsense_log(raw_message)
        elif '{' in raw_message and 'event_type' in raw_message:
            parsed_data = parse_suricata_eve(raw_message)
        
        # Enrich the message
        enriched = enrich_message(parsed_data, source_ip, raw_message)
        
        # Send to Kafka
        future = producer.send(topic, value=enriched)
        future.add_callback(lambda metadata: None)
        future.add_errback(lambda exc: print(f"[ERROR] Kafka send failed: {exc}"))
        
        # Update stats
        stats['processed'] += 1
        stats['by_topic'][topic] = stats['by_topic'].get(topic, 0) + 1
        
    except Exception as e:
        stats['errors'] += 1
        print(f"[ERROR] Processing failed: {e}")

def print_stats():
    """Print processing statistics"""
    print(f"\n[STATS] Received: {stats['received']} | "
          f"Processed: {stats['processed']} | "
          f"Errors: {stats['errors']}")
    for topic, count in stats['by_topic'].items():
        print(f"        {topic}: {count}")

def main():
    global producer, running
    
    print("╔═══════════════════════════════════════════════════════╗")
    print("║   UDP to Kafka Bridge - Cyber Defense System          ║")
    print("╚═══════════════════════════════════════════════════════╝")
    print(f"Listening on UDP {UDP_HOST}:{UDP_PORT}")
    print(f"Forwarding to Kafka: {KAFKA_BOOTSTRAP}")
    print("")
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create Kafka producer
    try:
        producer = create_kafka_producer()
    except Exception as e:
        print(f"[FATAL] Could not connect to Kafka: {e}")
        sys.exit(1)
    
    # Create UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.settimeout(1.0)  # Allow periodic stat printing
    
    try:
        sock.bind((UDP_HOST, UDP_PORT))
        print(f"[UDP] Bound to {UDP_HOST}:{UDP_PORT}")
    except PermissionError:
        print(f"[ERROR] Port {UDP_PORT} requires root privileges!")
        print("Try: sudo python3 udp_to_kafka.py")
        sys.exit(1)
    
    last_stats_time = time.time()
    
    while running:
        try:
            data, addr = sock.recvfrom(65535)
            message = data.decode('utf-8', errors='replace').strip()
            
            if message:
                process_message(message, addr[0])
            
        except socket.timeout:
            # Print stats every 30 seconds
            if time.time() - last_stats_time >= 30:
                print_stats()
                last_stats_time = time.time()
        except Exception as e:
            print(f"[ERROR] {e}")
    
    # Cleanup
    print("\n[BRIDGE] Flushing Kafka producer...")
    producer.flush()
    producer.close()
    sock.close()
    print_stats()
    print("[BRIDGE] Shutdown complete.")

if __name__ == '__main__':
    main()
