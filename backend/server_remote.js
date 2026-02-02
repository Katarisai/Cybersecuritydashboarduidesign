/**
 * FirewallAI Remote Backend Server (Ubuntu Optimized)
 * =================================================
 * Features:
 * - Ultra-fast AI generation using Groq API (Gemma/Llama3)
 * - Secure WebSocket Terminal (SSH wrapper)
 * - Remote pfSense Management
 * 
 * SETUP:
 * 1. Run "npm install groq-sdk node-pty node-ssh socket.io express cors dotenv" on Ubuntu
 * 2. Set GROQ_API_KEY in .env
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const cors = require('cors');
const { NodeSSH } = require('node-ssh');
const pty = require('node-pty');
const Groq = require('groq-sdk');

// Configuration
const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    host: '0.0.0.0', // Listen on all interfaces
    pfsense: {
        host: process.env.PFSENSE_HOST || '192.168.1.1',
        user: process.env.PFSENSE_USER || 'admin',
        password: process.env.PFSENSE_PASSWORD || 'pfsense',
    },
    ai: {
        apiKey: process.env.GROQ_API_KEY,
        // Using Llama 3.3 70b (Versatile) or Gemma 2 9b
        model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
    }
};

// Initialize Groq Client
const groq = config.ai.apiKey ? new Groq({ apiKey: config.ai.apiKey }) : null;

// SSH Client for pfSense
const ssh = new NodeSSH();

// Express App
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow connections from your Windows PC
        methods: ["GET", "POST"]
    }
});

// ===========================================
// Health Check
// ===========================================
app.get('/health', (req, res) => {
    res.json({ status: 'running', platform: os.platform(), ai_ready: !!groq });
});

// ===========================================
// AI Rule Generation (Groq/Gemma Optimized)
// ===========================================
app.post('/api/generate-rule', async (req, res) => {
    if (!groq) {
        return res.status(500).json({
            success: false,
            error: "Server missing GROQ_API_KEY. Please set it in .env file."
        });
    }

    const { prompt, contextData } = req.body;
    console.log(`[AI-FAST] Request: "${prompt}" ${contextData ? `(With ${contextData.length} chars of context)` : ''}`);

    const systemPrompt = `
    You are a cybersecurity expert API. 
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
      "reason": "short explanation of why this rule was generated based on the logs/request"
    }

    Examples:
    "Block youtube.com" -> {"type": "domain", "target": "youtube.com", "action": "block", "protocol": "any", "port": "any", "reason": "User request"}
    "Analyze logs" + [JSON data showing brute force from 1.2.3.4] -> {"type": "ip", "target": "1.2.3.4", "action": "block", "protocol": "any", "port": "any", "reason": "Detected brute force attack in logs"}
  `;

    // Combine prompt and context
    const fullUserMessage = contextData
        ? `CONTEXT DATA:\n${contextData}\n\nUSER REQUEST: ${prompt}`
        : prompt;


    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: fullUserMessage }
            ],
            model: config.ai.model,
            temperature: 0.1,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            response_format: { type: "json_object" } // Enforce JSON
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        const ruleData = JSON.parse(content);

        // AI correction logic
        if (ruleData.type === 'domain' && !ruleData.target.includes('.')) {
            ruleData.target += ".com";
        }

        res.json({ success: true, rule: ruleData });

    } catch (error) {
        console.error("[AI-FAST ERROR]:", error.message);
        res.status(500).json({ error: "AI Generation Failed", details: error.message });
    }
});

// ===========================================
// Apply Rule to pfSense
// ===========================================
app.post('/api/apply-rule', async (req, res) => {
    const { rule } = req.body;
    console.log(`[APPLY] Applying rule: ${JSON.stringify(rule)}`);

    try {
        // Connect to pfSense
        await ssh.connect({
            host: config.pfsense.host,
            username: config.pfsense.user,
            password: config.pfsense.password,
        });

        let commands = [];
        let successMsg = '';

        // Logic for pfSense commands
        if (rule.type === 'ip') {
            const action = rule.action === 'block' ? 'block' : 'pass';
            // Default to BOTH interfaces for maximum protection
            const iface = (rule.interface || 'both').toLowerCase();

            if (iface === 'both') {
                // Apply to BOTH WAN and LAN interfaces
                commands.push(`easyrule ${action} wan ${rule.target}`);
                commands.push(`easyrule ${action} lan ${rule.target}`);
            } else {
                // Apply to specific interface (wan or lan)
                commands.push(`easyrule ${action} ${iface} ${rule.target}`);
            }

            // Aggressive state killing: Kill ALL states to AND from the target
            // This ensures active connections like ping stop IMMEDIATELY
            if (action === 'block') {
                // Kill states FROM this IP (source)
                commands.push(`pfctl -k ${rule.target}`);
                // Kill states TO this IP (destination) 
                commands.push(`pfctl -k 0.0.0.0/0 -k ${rule.target}`);
                // Force kill using -K (uppercase) for more thorough cleanup
                commands.push(`pfctl -K ${rule.target}`);
            }

            successMsg = `Firewall: ${action.toUpperCase()} IP ${rule.target} on ${iface === 'both' ? 'WAN+LAN' : iface.toUpperCase()} (states cleared)`;

        } else if (rule.type === 'domain') {
            // Domain blocking using pfBlockerNG
            commands.push(`echo "${rule.target}" >> /var/db/pfblockerng/dnsbl/custom_list.txt`);
            commands.push(`/usr/local/bin/php /usr/local/www/pfblockerng/pfblockerng.php update cron`);
            successMsg = `DNSBL: Added ${rule.target} to blocklist (reloading...)`;
        }

        // Execute all commands sequentially
        for (const command of commands) {
            console.log(`[SSH] Executing: ${command}`);
            const result = await ssh.execCommand(command);
            if (result.stdout) console.log(`[SSH STDOUT]: ${result.stdout}`);
            if (result.stderr) console.log(`[SSH STDERR]: ${result.stderr}`);
        }

        ssh.dispose();

        res.json({ success: true, message: successMsg });

    } catch (error) {
        console.error("[SSH ERROR]:", error);
        res.status(500).json({ error: "Failed to apply rule", details: error.message });
    }
});

// ===========================================
// Terminal / PTY Session Manager
// ===========================================
// This handles the SSH-like web terminal
io.on('connection', (socket) => {
    console.log(`[TERM] Client connected: ${socket.id}`);

    // Spawn a shell (bash/zsh on Ubuntu)
    const shell = process.env.SHELL || 'bash';

    let ptyProcess = null;

    try {
        ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME,
            env: process.env
        });

        // Send data to client
        ptyProcess.on('data', (data) => {
            socket.emit('terminal:data', data);
        });

        // Receive input from client
        socket.on('terminal:write', (data) => {
            ptyProcess.write(data);
        });

        socket.on('terminal:resize', ({ cols, rows }) => {
            try { ptyProcess.resize(cols, rows); } catch (e) { }
        });

        socket.on('disconnect', () => {
            if (ptyProcess) ptyProcess.kill();
            console.log(`[TERM] Client disconnected: ${socket.id}`);
        });

    } catch (err) {
        console.error("[PTY ERROR]", err);
        socket.emit('terminal:data', '\r\n\x1b[31mError spawning terminal session.\r\n');
    }
});

// Start Server
server.listen(config.port, config.host, () => {
    console.log(`
  🚀 FirewallAI Remote Server Running
  ---------------------------------
  HOST: ${config.host}
  PORT: ${config.port}
  AI PROVIDER: Groq (Model: ${config.ai.model})
  PLATFORM: ${os.platform()}
  `);
});
