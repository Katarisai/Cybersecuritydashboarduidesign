/**
 * FirewallAI Backend Server
 * ===========================================
 * Provides:
 * - WebSocket terminal (PTY) sessions
 * - System stats streaming
 * - AI-powered firewall rule generation
 * - pfSense integration via SSH
 * ===========================================
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

// ===========================================
// Configuration from Environment Variables
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
};

// Validate required config
if (config.nodeEnv === 'production' && !process.env.PFSENSE_PASSWORD) {
  console.error('[ERROR] PFSENSE_PASSWORD must be set in production!');
  process.exit(1);
}

const ssh = new NodeSSH();

// Local Blocklist File (For Ubuntu Hosting Mode)
const LOCAL_BLOCKLIST_PATH = path.join(__dirname, 'ai_blocklist.txt');

// Ensure the file exists so pfSense doesn't get a 404
if (!fs.existsSync(LOCAL_BLOCKLIST_PATH)) {
  fs.writeFileSync(LOCAL_BLOCKLIST_PATH, "example.com\n");
}

// ===========================================
// Express App Setup
// ===========================================
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Blocklist hosting for pfBlockerNG
app.get('/ai.txt', (req, res) => {
  res.sendFile(LOCAL_BLOCKLIST_PATH);
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

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

    socket.emit('system-stats', { ip, cpu: load });
  }, 2000);

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

    // Send Terminal Output to Frontend
    ptyProcess.on('data', (data) => {
      socket.emit('terminal:data', data);
    });

    // Handle PTY exit
    ptyProcess.on('exit', (code) => {
      console.log(`[PTY] Process exited with code ${code}`);
      socket.emit('terminal:exit', { code });
    });
  } catch (err) {
    console.error('[PTY] Failed to spawn:', err.message);
    socket.emit('terminal:error', { message: err.message });
  }

  // Receive Input from Frontend
  socket.on('terminal:write', (data) => {
    if (ptyProcess) {
      ptyProcess.write(data);
    }
  });

  // Handle terminal resize
  socket.on('terminal:resize', ({ cols, rows }) => {
    if (ptyProcess) {
      try {
        ptyProcess.resize(cols, rows);
      } catch (e) {
        // Ignore resize errors
      }
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    clearInterval(statsInterval);
    if (ptyProcess) {
      ptyProcess.kill();
    }
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
  });
});

// ===========================================
// AI API - Generate Firewall Rule
// ===========================================
app.post('/api/generate-rule', async (req, res) => {
  const { prompt } = req.body;
  console.log(`[AI] Request: "${prompt}"`);

  try {
    const response = await axios.post(`${config.ollama.url}/api/generate`, {
      model: config.ollama.model,
      format: "json",
      prompt: `
            <|begin_of_text|><|start_header_id|>system<|end_header_id|>
            Extract security intent. JSON only.
            EXAMPLES:
            "Block YouTube" -> { "type": "domain", "target": "youtube.com" }
            "Block 1.2.3.4" -> { "type": "ip", "target": "1.2.3.4" }
            <|eot_id|><|start_header_id|>user<|end_header_id|>
            ${prompt}
            <|eot_id|><|start_header_id|>assistant<|end_header_id|>
            `,
      stream: false,
      options: { temperature: 0.1, num_ctx: 128 }
    });

    let rawText = response.data.response.trim();
    if (!rawText.endsWith('}')) rawText += "}";
    let ruleData = JSON.parse(rawText);

    if (ruleData.type === "domain" && !ruleData.target.includes(".")) {
      ruleData.target += ".com";
    }

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
  const { rule } = req.body;
  console.log(`[ACTION] ${rule.type} -> ${rule.target}`);

  try {
    await ssh.connect({
      host: config.pfsense.host,
      username: config.pfsense.user,
      password: config.pfsense.password,
    });

    let commands = [];
    let successMsg = "";

    if (rule.type === "ip") {
      // Apply block rule on BOTH WAN and LAN interfaces
      // This ensures traffic is blocked regardless of direction
      commands = [
        `easyrule block wan ${rule.target}`,
        `easyrule block lan ${rule.target}`,
        // Kill existing states for this IP so active connections (like ping) stop immediately
        // pfctl -k kills states matching the specified host
        `pfctl -k ${rule.target}`,
        // Also kill any states TO this IP (covers both directions)
        `pfctl -k 0.0.0.0/0 -k ${rule.target}`
      ];
      successMsg = `Firewall: Blocked IP ${rule.target} on WAN+LAN (states cleared)`;
    } else if (rule.type === "domain") {
      // Append to LOCAL file
      fs.appendFileSync(LOCAL_BLOCKLIST_PATH, `\n${rule.target}`);
      console.log(`[FILE] Added ${rule.target} to local blocklist`);

      // Tell pfSense to download from us and reload DNSBL
      commands = [
        `/usr/local/bin/php /usr/local/www/pfblockerng/pfblockerng.php update cron`
      ];
      successMsg = `DNSBL: Added ${rule.target} (Reloading pfSense...)`;
    }

    // Execute all commands
    for (const command of commands) {
      console.log(`[SSH] Executing: ${command}`);
      const result = await ssh.execCommand(command);
      if (result.stdout) console.log("[SSH OUTPUT]:", result.stdout);
      if (result.stderr) console.log("[SSH STDERR]:", result.stderr);
    }

    ssh.dispose();

    res.json({ success: true, message: successMsg });

  } catch (error) {
    console.error("[ERROR]:", error.message);
    res.status(500).json({ error: "Operation Failed", details: error.message });
  }
});

// ===========================================
// Start Server
// ===========================================
server.listen(config.port, config.host, () => {
  console.log('===========================================');
  console.log('  FirewallAI Backend Server');
  console.log('===========================================');
  console.log(`  URL:        http://${config.host}:${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Platform:   ${os.platform()}`);
  console.log(`  Blocklist:  http://localhost:${config.port}/ai.txt`);
  console.log(`  Health:     http://localhost:${config.port}/health`);
  console.log('===========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('[SERVER] Closed');
    process.exit(0);
  });
});