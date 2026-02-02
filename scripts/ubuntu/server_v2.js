/**
 * FirewallAI Backend Server - Enhanced Version
 * =============================================
 * Full implementation with:
 * - WebSocket terminal (PTY) sessions
 * - Real-time streaming from Kafka
 * - Elasticsearch integration for log queries
 * - AI-powered rule generation (Ollama + Groq)
 * - pfSense SSH integration
 * - Automated rule deployment with audit logging
 * =============================================
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const cors = require('cors');
const dgram = require('dgram');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('node-ssh');
const pty = require('node-pty');
const { Kafka } = require('kafkajs');

// ===========================================
// Configuration
// ===========================================
const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',

    // pfSense
    pfsense: {
        host: process.env.PFSENSE_HOST || '192.168.1.1',
        user: process.env.PFSENSE_USER || 'admin',
        password: process.env.PFSENSE_PASSWORD || 'pfsense',
    },

    // AI/Ollama
    ollama: {
        url: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    },

    // Kafka
    kafka: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        topics: {
            firewallLogs: 'firewall-logs',
            suricataAlerts: 'suricata-alerts',
            threatIntel: 'threat-intel',
            aiAnalysis: 'ai-analysis',
            automationAudit: 'automation-audit',
            realtimeMetrics: 'realtime-metrics'
        }
    },

    // Elasticsearch
    elasticsearch: {
        url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        indices: {
            firewallEvents: 'firewall-events',
            suricataAlerts: 'suricata-alerts',
            threatSessions: 'threat-sessions'
        }
    }
};

// SSH and Kafka clients
const ssh = new NodeSSH();
let kafkaConsumer = null;
let kafkaProducer = null;

// Local Blocklist File
const LOCAL_BLOCKLIST_PATH = path.join(__dirname, 'ai_blocklist.txt');
const AUDIT_LOG_PATH = path.join(__dirname, 'audit_log.json');

// Ensure files exist
if (!fs.existsSync(LOCAL_BLOCKLIST_PATH)) {
    fs.writeFileSync(LOCAL_BLOCKLIST_PATH, "example.com\n");
}
if (!fs.existsSync(AUDIT_LOG_PATH)) {
    fs.writeFileSync(AUDIT_LOG_PATH, "[]");
}

// Real-time stats
const realtimeStats = {
    eventsProcessed: 0,
    eventsPerSecond: 0,
    lastMinuteEvents: [],
    topSources: new Map(),
    topDestinations: new Map(),
    protocolDistribution: new Map(),
    actionDistribution: { block: 0, pass: 0, other: 0 },
    alerts: [],
    anomalies: []
};

// ===========================================
// Express App Setup
// ===========================================
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));  // Larger limit for context data

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        uptime: process.uptime(),
        kafka: kafkaConsumer ? 'connected' : 'disconnected',
        components: {
            kafka: !!kafkaConsumer,
            pfsense: true,
            ollama: true
        }
    });
});

// Blocklist hosting for pfBlockerNG
app.get('/ai.txt', (req, res) => {
    res.sendFile(LOCAL_BLOCKLIST_PATH);
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    pingTimeout: 60000,
    pingInterval: 25000
});

// ===========================================
// Kafka Integration
// ===========================================
async function initializeKafka() {
    console.log('[KAFKA] Initializing Kafka connection...');

    const kafka = new Kafka({
        clientId: 'firewallai-backend',
        brokers: config.kafka.brokers,
        retry: {
            initialRetryTime: 100,
            retries: 8
        }
    });

    // Producer for sending AI analysis results
    kafkaProducer = kafka.producer();
    await kafkaProducer.connect();
    console.log('[KAFKA] Producer connected');

    // Consumer for real-time updates
    kafkaConsumer = kafka.consumer({ groupId: 'firewallai-dashboard' });
    await kafkaConsumer.connect();

    // Subscribe to topics
    await kafkaConsumer.subscribe({
        topics: [
            config.kafka.topics.firewallLogs,
            config.kafka.topics.suricataAlerts,
            config.kafka.topics.realtimeMetrics
        ],
        fromBeginning: false
    });

    // Process messages
    await kafkaConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const value = JSON.parse(message.value.toString());
                processKafkaMessage(topic, value);
            } catch (e) {
                // Ignore parse errors
            }
        }
    });

    console.log('[KAFKA] Consumer running');
}

function processKafkaMessage(topic, data) {
    realtimeStats.eventsProcessed++;
    realtimeStats.lastMinuteEvents.push(Date.now());

    // Keep only last minute of events
    const oneMinuteAgo = Date.now() - 60000;
    realtimeStats.lastMinuteEvents = realtimeStats.lastMinuteEvents.filter(t => t > oneMinuteAgo);
    realtimeStats.eventsPerSecond = realtimeStats.lastMinuteEvents.length / 60;

    // Process based on topic
    if (topic === config.kafka.topics.firewallLogs) {
        const parsed = data.parsed || {};

        // Update source stats
        if (parsed.src_ip) {
            const count = (realtimeStats.topSources.get(parsed.src_ip) || 0) + 1;
            realtimeStats.topSources.set(parsed.src_ip, count);
        }

        // Update protocol stats
        if (parsed.protocol) {
            const count = (realtimeStats.protocolDistribution.get(parsed.protocol) || 0) + 1;
            realtimeStats.protocolDistribution.set(parsed.protocol, count);
        }

        // Update action stats
        const action = (parsed.action || '').toLowerCase();
        if (action === 'block' || action === 'drop' || action === 'reject') {
            realtimeStats.actionDistribution.block++;
        } else if (action === 'pass' || action === 'allow') {
            realtimeStats.actionDistribution.pass++;
        } else {
            realtimeStats.actionDistribution.other++;
        }
    }

    if (topic === config.kafka.topics.suricataAlerts) {
        // Store recent alerts
        realtimeStats.alerts.unshift({
            timestamp: new Date().toISOString(),
            ...data
        });
        realtimeStats.alerts = realtimeStats.alerts.slice(0, 100);  // Keep last 100

        // Emit to connected clients
        io.emit('suricata-alert', data);
    }
}

// ===========================================
// API Endpoints - Real-time Stats
// ===========================================
app.get('/api/stats/realtime', (req, res) => {
    // Convert Maps to objects for JSON
    const topSourcesArray = Array.from(realtimeStats.topSources.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count }));

    const protocolArray = Array.from(realtimeStats.protocolDistribution.entries())
        .map(([protocol, count]) => ({ protocol, count }));

    res.json({
        eventsProcessed: realtimeStats.eventsProcessed,
        eventsPerSecond: Math.round(realtimeStats.eventsPerSecond * 100) / 100,
        topSources: topSourcesArray,
        protocolDistribution: protocolArray,
        actionDistribution: realtimeStats.actionDistribution,
        recentAlerts: realtimeStats.alerts.slice(0, 10),
        anomalies: realtimeStats.anomalies.slice(0, 10)
    });
});

// ===========================================
// API Endpoints - Elasticsearch Queries
// ===========================================
app.get('/api/logs/search', async (req, res) => {
    const { query, from = 0, size = 50, startTime, endTime } = req.query;

    try {
        const searchBody = {
            query: {
                bool: {
                    must: query ? [{ query_string: { query } }] : [{ match_all: {} }],
                    filter: []
                }
            },
            sort: [{ '@timestamp': 'desc' }],
            from: parseInt(from),
            size: parseInt(size)
        };

        if (startTime || endTime) {
            searchBody.query.bool.filter.push({
                range: {
                    '@timestamp': {
                        ...(startTime && { gte: startTime }),
                        ...(endTime && { lte: endTime })
                    }
                }
            });
        }

        const response = await axios.post(
            `${config.elasticsearch.url}/${config.elasticsearch.indices.firewallEvents}-*/_search`,
            searchBody
        );

        res.json({
            total: response.data.hits.total.value,
            logs: response.data.hits.hits.map(hit => ({
                id: hit._id,
                ...hit._source
            }))
        });
    } catch (error) {
        console.error('[ES ERROR]:', error.message);
        // Return mock data if Elasticsearch is not available
        res.json({
            total: 0,
            logs: [],
            error: 'Elasticsearch not available'
        });
    }
});

app.get('/api/logs/aggregations', async (req, res) => {
    const { interval = '1h', startTime, endTime } = req.query;

    try {
        const aggBody = {
            size: 0,
            query: {
                range: {
                    '@timestamp': {
                        gte: startTime || 'now-24h',
                        lte: endTime || 'now'
                    }
                }
            },
            aggs: {
                events_over_time: {
                    date_histogram: {
                        field: '@timestamp',
                        fixed_interval: interval
                    },
                    aggs: {
                        by_action: {
                            terms: { field: 'action.keyword' }
                        }
                    }
                },
                top_sources: {
                    terms: { field: 'src_ip.keyword', size: 10 }
                },
                top_destinations: {
                    terms: { field: 'dst_ip.keyword', size: 10 }
                },
                protocols: {
                    terms: { field: 'protocol.keyword' }
                }
            }
        };

        const response = await axios.post(
            `${config.elasticsearch.url}/${config.elasticsearch.indices.firewallEvents}-*/_search`,
            aggBody
        );

        res.json(response.data.aggregations);
    } catch (error) {
        console.error('[ES AGG ERROR]:', error.message);
        res.json({ error: 'Elasticsearch not available' });
    }
});

// ===========================================
// API Endpoints - Threat Intelligence
// ===========================================
app.get('/api/threats/summary', async (req, res) => {
    try {
        // Query Elasticsearch for threat summary
        const response = await axios.post(
            `${config.elasticsearch.url}/${config.elasticsearch.indices.suricataAlerts}-*/_search`,
            {
                size: 0,
                query: { range: { '@timestamp': { gte: 'now-24h' } } },
                aggs: {
                    by_category: {
                        terms: { field: 'alert.category.keyword', size: 20 }
                    },
                    by_severity: {
                        terms: { field: 'alert.severity' }
                    },
                    top_attackers: {
                        terms: { field: 'src_ip.keyword', size: 10 }
                    },
                    timeline: {
                        date_histogram: { field: '@timestamp', fixed_interval: '1h' }
                    }
                }
            }
        );

        res.json({
            categories: response.data.aggregations.by_category.buckets,
            severities: response.data.aggregations.by_severity.buckets,
            topAttackers: response.data.aggregations.top_attackers.buckets,
            timeline: response.data.aggregations.timeline.buckets
        });
    } catch (error) {
        // Return real-time stats as fallback
        res.json({
            categories: [],
            severities: [],
            topAttackers: Array.from(realtimeStats.topSources.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([ip, count]) => ({ key: ip, doc_count: count })),
            timeline: [],
            source: 'realtime'
        });
    }
});

// ===========================================
// AI API - Generate Firewall Rule
// ===========================================
app.post('/api/generate-rule', async (req, res) => {
    const { prompt, contextData } = req.body;
    console.log(`[AI] Request: "${prompt}" ${contextData ? `(With ${contextData.length} chars of context)` : ''}`);

    const systemPrompt = `You are a cybersecurity expert API. 
Analyze the user's intent AND any provided LOG/JSON context. 
Output a VALID JSON object for a firewall rule based on the analysis.
NO markdown, NO explanations. ONLY JSON.

Output Format:
{
  "type": "ip" | "domain",
  "target": "string (ip address or domain)",
  "action": "block" | "allow",
  "interface": "wan" | "lan" | "both",
  "protocol": "tcp" | "udp" | "any",
  "port": "number or string (e.g. 80, 443, any)",
  "reason": "short explanation of why this rule was generated",
  "confidence": 0.0-1.0
}

Examples:
"Block youtube.com" -> {"type": "domain", "target": "youtube.com", "action": "block", "protocol": "any", "port": "any", "reason": "User request", "confidence": 1.0}
"Analyze logs" + [JSON data showing brute force from 1.2.3.4] -> {"type": "ip", "target": "1.2.3.4", "action": "block", "interface": "both", "protocol": "any", "port": "any", "reason": "Detected brute force attack in logs", "confidence": 0.95}`;

    const fullPrompt = contextData
        ? `CONTEXT DATA:\n${contextData}\n\nUSER REQUEST: ${prompt}`
        : prompt;

    try {
        const response = await axios.post(`${config.ollama.url}/api/generate`, {
            model: config.ollama.model,
            format: "json",
            prompt: `${systemPrompt}\n\nUser: ${fullPrompt}`,
            stream: false,
            options: { temperature: 0.1, num_ctx: 2048 }
        });

        let rawText = response.data.response.trim();

        // Try to extract JSON
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            rawText = jsonMatch[0];
        }

        let ruleData = JSON.parse(rawText);

        // AI correction logic
        if (ruleData.type === "domain" && !ruleData.target.includes(".")) {
            ruleData.target += ".com";
        }

        // Extract IP from prompt if AI missed it
        const ipMatch = prompt.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        if (ipMatch && ruleData.type !== "ip") {
            ruleData.type = "ip";
            ruleData.target = ipMatch[0];
        }

        res.json({ success: true, rule: ruleData });

    } catch (error) {
        console.error("[AI ERROR]:", error.message);
        res.status(500).json({ error: "AI Failed", details: error.message });
    }
});

// ===========================================
// API - Apply Firewall Rule to pfSense
// ===========================================
app.post('/api/apply-rule', async (req, res) => {
    const { rule, approved = false } = req.body;
    console.log(`[ACTION] ${rule.type} -> ${rule.target} (approved: ${approved})`);

    // Log to audit trail
    const auditEntry = {
        timestamp: new Date().toISOString(),
        rule,
        approved,
        status: 'pending'
    };

    try {
        // High confidence rules can be auto-applied, others need approval
        if (!approved && rule.confidence && rule.confidence < 0.9) {
            auditEntry.status = 'pending_approval';
            appendAuditLog(auditEntry);

            return res.json({
                success: false,
                requiresApproval: true,
                message: `Rule confidence (${Math.round(rule.confidence * 100)}%) below threshold. Manual approval required.`,
                auditId: auditEntry.timestamp
            });
        }

        await ssh.connect({
            host: config.pfsense.host,
            username: config.pfsense.user,
            password: config.pfsense.password,
        });

        let commands = [];
        let successMsg = "";

        if (rule.type === "ip") {
            const action = rule.action === 'block' ? 'block' : 'pass';
            const iface = (rule.interface || 'both').toLowerCase();

            if (iface === 'both') {
                commands.push(`easyrule ${action} wan ${rule.target}`);
                commands.push(`easyrule ${action} lan ${rule.target}`);
            } else {
                commands.push(`easyrule ${action} ${iface} ${rule.target}`);
            }

            if (action === 'block') {
                commands.push(`pfctl -k ${rule.target}`);
                commands.push(`pfctl -k 0.0.0.0/0 -k ${rule.target}`);
            }

            successMsg = `Firewall: ${action.toUpperCase()} IP ${rule.target} on ${iface === 'both' ? 'WAN+LAN' : iface.toUpperCase()}`;

        } else if (rule.type === "domain") {
            fs.appendFileSync(LOCAL_BLOCKLIST_PATH, `\n${rule.target}`);
            console.log(`[FILE] Added ${rule.target} to local blocklist`);

            commands.push(`/usr/local/bin/php /usr/local/www/pfblockerng/pfblockerng.php update cron`);
            successMsg = `DNSBL: Added ${rule.target} (Reloading pfSense...)`;
        }

        // Execute commands
        for (const command of commands) {
            console.log(`[SSH] Executing: ${command}`);
            const result = await ssh.execCommand(command);
            if (result.stdout) console.log("[SSH OUTPUT]:", result.stdout);
            if (result.stderr) console.log("[SSH STDERR]:", result.stderr);
        }

        ssh.dispose();

        auditEntry.status = 'applied';
        auditEntry.message = successMsg;
        appendAuditLog(auditEntry);

        // Publish to Kafka
        if (kafkaProducer) {
            await kafkaProducer.send({
                topic: config.kafka.topics.automationAudit,
                messages: [{ value: JSON.stringify(auditEntry) }]
            });
        }

        res.json({ success: true, message: successMsg });

    } catch (error) {
        console.error("[ERROR]:", error.message);
        auditEntry.status = 'failed';
        auditEntry.error = error.message;
        appendAuditLog(auditEntry);

        res.status(500).json({ error: "Operation Failed", details: error.message });
    }
});

// ===========================================
// API - Audit Log
// ===========================================
app.get('/api/audit-log', (req, res) => {
    try {
        const logs = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf8'));
        res.json(logs.slice(-100).reverse());  // Last 100, newest first
    } catch (error) {
        res.json([]);
    }
});

function appendAuditLog(entry) {
    try {
        let logs = [];
        if (fs.existsSync(AUDIT_LOG_PATH)) {
            logs = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf8'));
        }
        logs.push(entry);
        // Keep last 1000 entries
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }
        fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('[AUDIT] Failed to write audit log:', error);
    }
}

// ===========================================
// API - Pending Approvals
// ===========================================
app.get('/api/approvals/pending', (req, res) => {
    try {
        const logs = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf8'));
        const pending = logs.filter(l => l.status === 'pending_approval');
        res.json(pending);
    } catch (error) {
        res.json([]);
    }
});

app.post('/api/approvals/:timestamp/approve', async (req, res) => {
    const { timestamp } = req.params;

    try {
        let logs = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf8'));
        const entry = logs.find(l => l.timestamp === timestamp);

        if (!entry) {
            return res.status(404).json({ error: 'Approval not found' });
        }

        // Apply the rule with approved flag
        const applyResponse = await axios.post(
            `http://localhost:${config.port}/api/apply-rule`,
            { rule: entry.rule, approved: true }
        );

        res.json(applyResponse.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===========================================
// System Stats Helper
// ===========================================
function getLocalIp() {
    return new Promise((resolve) => {
        try {
            const socket = dgram.createSocket('udp4');
            socket.connect(80, '8.8.8.8', () => {
                const addr = socket.address().address;
                socket.close();
                resolve(addr);
            });
            socket.on('error', () => { resolve('127.0.0.1'); });
        } catch (e) { resolve('127.0.0.1'); }
    });
}

// ===========================================
// Socket.IO Connection Handler
// ===========================================
io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // System stats loop
    const statsInterval = setInterval(async () => {
        const cpus = os.cpus();
        const idle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        const total = cpus.reduce((acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b), 0);
        const load = 100 - Math.round((idle / total) * 100);
        const ip = await getLocalIp();

        socket.emit('system-stats', {
            ip,
            cpu: load,
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem()
            },
            eventsPerSecond: realtimeStats.eventsPerSecond,
            totalEvents: realtimeStats.eventsProcessed
        });
    }, 2000);

    // Real-time log streaming
    socket.on('subscribe-logs', () => {
        console.log(`[SOCKET] ${socket.id} subscribed to log stream`);
        socket.join('log-stream');
    });

    socket.on('unsubscribe-logs', () => {
        socket.leave('log-stream');
    });

    // Terminal PTY
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

    let ptyProcess;
    try {
        ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-256color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME || process.env.USERPROFILE || '/',
            env: { ...process.env, TERM: 'xterm-256color' }
        });

        console.log(`[PTY] Spawned ${shell} with PID ${ptyProcess.pid}`);

        ptyProcess.on('data', (data) => {
            socket.emit('terminal:data', data);
        });

        ptyProcess.on('exit', (code) => {
            console.log(`[PTY] Process exited with code ${code}`);
            socket.emit('terminal:exit', { code });
        });
    } catch (err) {
        console.error('[PTY] Failed to spawn:', err.message);
        socket.emit('terminal:error', { message: err.message });
    }

    socket.on('terminal:write', (data) => {
        if (ptyProcess) {
            ptyProcess.write(data);
        }
    });

    socket.on('terminal:resize', ({ cols, rows }) => {
        if (ptyProcess) {
            try {
                ptyProcess.resize(cols, rows);
            } catch (e) {
                // Ignore resize errors
            }
        }
    });

    socket.on('disconnect', () => {
        clearInterval(statsInterval);
        if (ptyProcess) {
            ptyProcess.kill();
        }
        console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
});

// ===========================================
// Broadcast real-time events to subscribers
// ===========================================
setInterval(() => {
    if (realtimeStats.lastMinuteEvents.length > 0) {
        io.to('log-stream').emit('realtime-stats', {
            eventsPerSecond: realtimeStats.eventsPerSecond,
            totalEvents: realtimeStats.eventsProcessed,
            actionDistribution: realtimeStats.actionDistribution
        });
    }
}, 1000);

// ===========================================
// Start Server
// ===========================================
async function start() {
    // Try to initialize Kafka (non-blocking)
    try {
        await initializeKafka();
    } catch (error) {
        console.warn('[KAFKA] Could not connect:', error.message);
        console.warn('[KAFKA] Real-time streaming disabled. Using fallback mode.');
    }

    server.listen(config.port, config.host, () => {
        console.log('═══════════════════════════════════════════════════════');
        console.log('  FirewallAI Backend Server v2.0');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`  URL:         http://${config.host}:${config.port}`);
        console.log(`  Environment: ${config.nodeEnv}`);
        console.log(`  Platform:    ${os.platform()}`);
        console.log(`  Kafka:       ${kafkaConsumer ? 'Connected' : 'Disconnected'}`);
        console.log(`  Endpoints:`);
        console.log(`    Health:    http://localhost:${config.port}/health`);
        console.log(`    Blocklist: http://localhost:${config.port}/ai.txt`);
        console.log(`    Stats:     http://localhost:${config.port}/api/stats/realtime`);
        console.log(`    Audit:     http://localhost:${config.port}/api/audit-log`);
        console.log('═══════════════════════════════════════════════════════');
    });
}

start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[SERVER] Received SIGTERM, shutting down...');
    if (kafkaConsumer) await kafkaConsumer.disconnect();
    if (kafkaProducer) await kafkaProducer.disconnect();
    server.close(() => {
        console.log('[SERVER] Closed');
        process.exit(0);
    });
});
