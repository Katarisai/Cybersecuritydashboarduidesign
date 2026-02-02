const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop', 'suricata_simulation.log');
const TARGET_SIZE_KB = 22; // Target ~22KB to be safe under 25KB limit
const ATTACKER_IP = "185.203.11.45"; // "Low and slow" attacker
const LOCAL_IP = "192.168.1.5";

const NORMAL_IPS = ["192.168.1.10", "192.168.1.15", "192.168.1.20", "8.8.8.8", "1.1.1.1"];
const USER_AGENTS = ["Mozilla/5.0", "Chrome/120.0", "Safari/537.36"];

const generateLogLine = (timestamp, source, dest, proto, msg) => {
    return `${timestamp} pfsense suricata[12345]: [1:2001219:18] ${msg} [Classification: Misc] [Priority: 3] {${proto}} ${source} -> ${dest}\n`;
};

let buffer = "";
let currentTime = new Date("2026-01-25T10:00:00");

// We will generate logs until we reach close to size limit
let counter = 0;
let attackPhase = 0;

console.log("Generating log file...");

while (Buffer.byteLength(buffer, 'utf8') < TARGET_SIZE_KB * 1024) {
    counter++;
    currentTime.setSeconds(currentTime.getSeconds() + Math.floor(Math.random() * 30) + 1);
    const ts = currentTime.toISOString().replace('T', ' ').substring(0, 19);

    // ATTACK PATTERN: Every ~40 normal logs, inject a small batch (Low & Slow)
    if (counter % 40 === 0) {
        attackPhase++;
        // Batch of 3 suspicious attempts
        buffer += generateLogLine(ts, ATTACKER_IP, LOCAL_IP, "TCP", "ET SCAN Potential SSH Scan");
        buffer += generateLogLine(ts, ATTACKER_IP, LOCAL_IP, "TCP", "ET WEB_SERVER SQL Injection Attempt SELECT FROM");
        buffer += generateLogLine(ts, ATTACKER_IP, LOCAL_IP, "TCP", "ET POLICY Suspicious User-Agent (Python-urllib)");
        continue;
    }

    // Normal Traffic Noise
    const src = NORMAL_IPS[Math.floor(Math.random() * NORMAL_IPS.length)];
    const dst = "192.168.1.1";
    buffer += generateLogLine(ts, src, dst, "UDP", "SURICATA UDPv4 invalid checksum");

    // Add some random HTTP noise
    if (Math.random() > 0.5) {
        const ts2 = currentTime.toISOString().replace('T', ' ').substring(0, 19);
        buffer += `${ts2} nginx: ${src} - - [${ts2}] "GET /dashboard/assets/style.css HTTP/1.1" 200 4520 "-" "${USER_AGENTS[0]}"\n`;
    }
}

fs.writeFileSync(OUTPUT_FILE, buffer);
console.log(`Generated ${OUTPUT_FILE} (${(Buffer.byteLength(buffer) / 1024).toFixed(2)} KB)`);
