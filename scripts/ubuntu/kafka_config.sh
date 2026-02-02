#!/bin/bash
# ===========================================
# Kafka Topic Configuration Script
# ===========================================
# Creates all required Kafka topics for the 
# Adaptive Network Defense System
# ===========================================

KAFKA_HOME="${KAFKA_HOME:-$HOME/downloads/kafka_2.13-3.9.0}"
BOOTSTRAP_SERVER="${KAFKA_BOOTSTRAP:-localhost:9092}"

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Kafka Topic Configuration - Cyber Defense System    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Function to create topic if it doesn't exist
create_topic() {
    local topic_name=$1
    local partitions=$2
    local replication=$3
    local retention_hours=${4:-168}  # Default 7 days
    
    echo "Creating topic: $topic_name"
    
    # Check if topic exists
    if $KAFKA_HOME/bin/kafka-topics.sh --bootstrap-server $BOOTSTRAP_SERVER --list 2>/dev/null | grep -q "^${topic_name}$"; then
        echo "  ✓ Topic already exists, updating configuration..."
        $KAFKA_HOME/bin/kafka-configs.sh --bootstrap-server $BOOTSTRAP_SERVER \
            --entity-type topics --entity-name $topic_name \
            --alter --add-config retention.ms=$((retention_hours * 3600000)) 2>/dev/null
    else
        $KAFKA_HOME/bin/kafka-topics.sh --create \
            --bootstrap-server $BOOTSTRAP_SERVER \
            --topic $topic_name \
            --partitions $partitions \
            --replication-factor $replication \
            --config retention.ms=$((retention_hours * 3600000)) \
            --config cleanup.policy=delete \
            --config compression.type=snappy
        
        if [ $? -eq 0 ]; then
            echo "  ✓ Created successfully"
        else
            echo "  ✗ Failed to create topic"
            return 1
        fi
    fi
}

# Wait for Kafka to be ready
echo "Waiting for Kafka broker to be ready..."
max_attempts=30
attempt=0
while ! $KAFKA_HOME/bin/kafka-topics.sh --bootstrap-server $BOOTSTRAP_SERVER --list >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "✗ Kafka not responding after $max_attempts attempts. Ensure Kafka is running."
        exit 1
    fi
    echo "  Attempt $attempt/$max_attempts..."
    sleep 2
done
echo "✓ Kafka is ready!"
echo ""

# ===========================================
# Create Topics
# ===========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Firewall Log Topics..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Main firewall logs - high volume, many partitions
create_topic "firewall-logs" 12 1 168

# Suricata IDS alerts - lower volume, fewer partitions
create_topic "suricata-alerts" 6 1 336  # 14 days retention

# DNS queries for DNSBL correlation
create_topic "dns-queries" 6 1 72  # 3 days retention

# Threat intelligence feed
create_topic "threat-intel" 3 1 720  # 30 days retention

# AI analysis results
create_topic "ai-analysis" 3 1 336  # 14 days retention

# Automated actions audit log
create_topic "automation-audit" 3 1 2160  # 90 days retention

# Real-time metrics for dashboard
create_topic "realtime-metrics" 3 1 24  # 1 day retention

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Topic Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
$KAFKA_HOME/bin/kafka-topics.sh --bootstrap-server $BOOTSTRAP_SERVER --list

echo ""
echo "✓ Kafka topic configuration complete!"
echo ""
echo "To view topic details:"
echo "  $KAFKA_HOME/bin/kafka-topics.sh --bootstrap-server $BOOTSTRAP_SERVER --describe"
