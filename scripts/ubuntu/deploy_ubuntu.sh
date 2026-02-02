#!/bin/bash
# ===========================================
# Ubuntu Server Deployment Script
# ===========================================
# Deploys all components for the Cyber Defense System
# Run: bash deploy_ubuntu.sh
# ===========================================

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   CYBER DEFENSE SYSTEM - Ubuntu Deployment                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Configuration
INSTALL_DIR="$HOME/cyber-defense"
KAFKA_VERSION="3.9.0"
KAFKA_HOME="$HOME/downloads/kafka_2.13-$KAFKA_VERSION"
SPARK_VERSION="3.5.0"
SPARK_HOME="$HOME/downloads/spark-$SPARK_VERSION-bin-hadoop3"

# ===========================================
# Step 1: Create directory structure
# ===========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[1/8] Creating directory structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "$INSTALL_DIR"/{scripts,logs,models,data,config}
mkdir -p "$HOME/firewall-backend"
mkdir -p "$HOME/downloads"

# ===========================================
# Step 2: Install system dependencies
# ===========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[2/8] Installing system dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sudo apt update
sudo apt install -y \
    openjdk-11-jdk \
    python3 python3-pip python3-venv \
    nodejs npm \
    curl wget \
    screen tmux \
    net-tools

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64" >> ~/.bashrc

# ===========================================
# Step 3: Install Python packages
# ===========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[3/8] Installing Python packages..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pip3 install --upgrade pip
pip3 install \
    kafka-python \
    pyspark==$SPARK_VERSION \
    scikit-learn \
    pandas \
    numpy \
    requests \
    elasticsearch

# ===========================================
# Step 4: Download and configure Kafka
# ===========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[4/8] Configuring Apache Kafka..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "$KAFKA_HOME" ]; then
    echo "Downloading Kafka $KAFKA_VERSION..."
    cd "$HOME/downloads"
    wget -q "https://downloads.apache.org/kafka/$KAFKA_VERSION/kafka_2.13-$KAFKA_VERSION.tgz"
    tar -xzf "kafka_2.13-$KAFKA_VERSION.tgz"
    echo "Kafka installed to $KAFKA_HOME"
else
    echo "Kafka already installed at $KAFKA_HOME"
fi

# Configure Kafka for lower memory usage
cat > "$KAFKA_HOME/config/server-low-mem.properties" << 'EOF'
# Low memory configuration for development
broker.id=0
listeners=PLAINTEXT://localhost:9092
log.dirs=/tmp/kafka-logs
num.partitions=3
log.retention.hours=24
log.segment.bytes=1073741824
zookeeper.connect=localhost:2181
EOF

# ===========================================
# Step 5: Download Spark (for Structured Streaming)
# ===========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[5/8] Configuring Apache Spark..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "$SPARK_HOME" ]; then
    echo "Downloading Spark $SPARK_VERSION..."
    cd "$HOME/downloads"
    wget -q "https://downloads.apache.org/spark/spark-$SPARK_VERSION/spark-$SPARK_VERSION-bin-hadoop3.tgz"
    tar -xzf "spark-$SPARK_VERSION-bin-hadoop3.tgz"
    echo "Spark installed to $SPARK_HOME"
else
    echo "Spark already installed at $SPARK_HOME"
fi

# Add to PATH
echo "export SPARK_HOME=$SPARK_HOME" >> ~/.bashrc
echo "export PATH=\$PATH:\$SPARK_HOME/bin" >> ~/.bashrc

# ===========================================
# Step 6: Install Node.js backend dependencies
# ===========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[6/8] Installing Node.js backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$HOME/firewall-backend"

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "firewallai-backend",
  "version": "2.0.0",
  "description": "FirewallAI Backend Server with Kafka and Elasticsearch",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "kafkajs": "^2.2.4",
    "node-pty": "^1.0.0",
    "node-ssh": "^13.2.0",
    "socket.io": "^4.7.2"
  }
}
EOF
fi

npm install

# ===========================================
# Step 7: Install Ollama for LLM inference
# ===========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[7/8] Installing Ollama..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
    echo "Ollama installed"
else
    echo "Ollama already installed"
fi

# Pull models in background
echo "Pulling AI models (this may take a while)..."
ollama pull gemma:7b &
ollama pull llama3.2:3b &

# ===========================================
# Step 8: Create systemd services
# ===========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[8/8] Creating service scripts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create master startup script
cat > "$HOME/start_defense_system.sh" << 'STARTSCRIPT'
#!/bin/bash
# Master startup script for Cyber Defense System

KAFKA_HOME="$HOME/downloads/kafka_2.13-3.9.0"
BACKEND_DIR="$HOME/firewall-backend"

echo "🚀 Starting Cyber Defense System..."

# 1. Start Zookeeper
echo "[1/5] Starting Zookeeper..."
if ! pgrep -f "QuorumPeerMain" > /dev/null; then
    nohup "$KAFKA_HOME/bin/zookeeper-server-start.sh" "$KAFKA_HOME/config/zookeeper.properties" > ~/logs/zookeeper.log 2>&1 &
    sleep 10
fi

# 2. Start Kafka
echo "[2/5] Starting Kafka..."
if ! pgrep -f "kafka.Kafka" > /dev/null; then
    export KAFKA_HEAP_OPTS="-Xmx512M -Xms256M"
    nohup "$KAFKA_HOME/bin/kafka-server-start.sh" "$KAFKA_HOME/config/server.properties" > ~/logs/kafka.log 2>&1 &
    sleep 15
fi

# 3. Configure Kafka topics
echo "[3/5] Configuring Kafka topics..."
bash ~/cyber-defense/scripts/kafka_config.sh

# 4. Start UDP Bridge
echo "[4/5] Starting UDP Bridge..."
sudo pkill -f "udp_to_kafka" 2>/dev/null || true
sudo nohup python3 ~/cyber-defense/scripts/udp_to_kafka_v2.py > ~/logs/bridge.log 2>&1 &

# 5. Start Backend Server
echo "[5/5] Starting Backend Server..."
pkill -f "node.*server" 2>/dev/null || true
cd "$BACKEND_DIR"
nohup node server.js > ~/logs/backend.log 2>&1 &

echo ""
echo "✅ All components started!"
echo ""
echo "Check status with: ~/status_defense_system.sh"
echo "View logs in: ~/logs/"
STARTSCRIPT

chmod +x "$HOME/start_defense_system.sh"

# Create status check script
cat > "$HOME/status_defense_system.sh" << 'STATUSSCRIPT'
#!/bin/bash
# Status check for Cyber Defense System

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   CYBER DEFENSE SYSTEM - Status                        ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo "  ✓ $2: RUNNING"
    else
        echo "  ✗ $2: STOPPED"
    fi
}

check_process "QuorumPeerMain" "Zookeeper"
check_process "kafka.Kafka" "Kafka"
check_process "udp_to_kafka" "UDP Bridge"
check_process "node.*server" "Backend Server"
check_process "defense_engine" "Defense Engine"

echo ""
echo "Ports:"
netstat -tlnp 2>/dev/null | grep -E ':(2181|9092|3001|514) ' | awk '{print "  " $4 " -> " $7}'

echo ""
echo "Recent logs:"
echo "  tail -f ~/logs/backend.log"
STATUSSCRIPT

chmod +x "$HOME/status_defense_system.sh"

# Create logs directory
mkdir -p "$HOME/logs"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   DEPLOYMENT COMPLETE!                                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Copy scripts to the correct locations:"
echo "     cp scripts/*.py ~/cyber-defense/scripts/"
echo "     cp scripts/server_v2.js ~/firewall-backend/server.js"
echo ""
echo "  2. Create .env file in ~/firewall-backend/"
echo ""
echo "  3. Start the system:"
echo "     ~/start_defense_system.sh"
echo ""
echo "  4. Check status:"
echo "     ~/status_defense_system.sh"
echo ""
