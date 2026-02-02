# FirewallAI Automation Scripts

This folder contains automation scripts for starting and stopping the FirewallAI system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Windows Machine                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Frontend (React + Vite)                                 │   │
│  │  http://localhost:5173                                   │   │
│  │  Directory: C:\Users\Administrator\Desktop\firewalldesign│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Ubuntu Server (192.168.1.101)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    InfluxDB     │  │     Grafana     │  │  Node Backend   │ │
│  │   Port: 8086    │  │   Port: 3000    │  │   Port: 3001    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  Backend Directory: ~/backend/server.js                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    pfSense Firewall (192.168.1.1)               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Telegraf → sends metrics to InfluxDB                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ubuntu Server Scripts

### Copy Scripts to Server
```bash
scp ubuntu_start.sh ubuntu_stop.sh ubuntu_status.sh ubuntu@192.168.1.101:~/
```

### Make Executable
```bash
ssh ubuntu@192.168.1.101 "chmod +x ~/ubuntu_start.sh ~/ubuntu_stop.sh ~/ubuntu_status.sh"
```

### Start All Services
```bash
ssh ubuntu@192.168.1.101 "./ubuntu_start.sh"
```
**Or on the server:**
```bash
./ubuntu_start.sh
```

### Stop All Services
```bash
ssh ubuntu@192.168.1.101 "./ubuntu_stop.sh"
```

### Check Status
```bash
ssh ubuntu@192.168.1.101 "./ubuntu_status.sh"
```

---

## Windows Scripts

### Start Frontend (Development Server)

**Option 1: Batch File**
Double-click `start_frontend.bat`

**Option 2: PowerShell**
```powershell
.\Start-Frontend.ps1
```

**Option 3: Manual**
```powershell
cd C:\Users\Administrator\Desktop\firewalldesign
npm run dev
```

### Start Full Stack
Double-click `start_fullstack.bat` - This will guide you through starting both Ubuntu services and Windows frontend.

---

## Quick Start (From Fresh Boot)

### Step 1: Start Ubuntu Services (via SSH from Windows)
```powershell
ssh ubuntu@192.168.1.101 "./ubuntu_start.sh"
```

### Step 2: Start Windows Frontend
```powershell
cd C:\Users\Administrator\Desktop\firewalldesign
npm run dev
```

### Step 3: Open Dashboard
Navigate to: http://localhost:5173

---

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Dashboard | http://localhost:5173 | admin / firewall123 |
| Grafana | http://192.168.1.101:3000 | admin / admin |
| InfluxDB | http://192.168.1.101:8086 | admin / influxdb123 |
| pfSense | https://192.168.1.1 | admin / pfsense |
| Backend API | http://192.168.1.101:3001 | - |

---

## Systemd Auto-Start (Optional)

To make Ubuntu services start automatically on boot:

### InfluxDB & Grafana (Already enabled)
```bash
sudo systemctl enable influxdb
sudo systemctl enable grafana-server
```

### Backend as Systemd Service
Create `/etc/systemd/system/firewall-backend.service`:
```ini
[Unit]
Description=FirewallAI Backend Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable firewall-backend
sudo systemctl start firewall-backend
```

---

## Troubleshooting

### Backend not starting?
Check logs:
```bash
cat ~/backend.log
```

### Grafana not embedding?
Check config:
```bash
grep "allow_embedding" /etc/grafana/grafana.ini
```
Should show: `allow_embedding = true`

### InfluxDB connection issues?
Check firewall:
```bash
sudo ufw status
sudo ufw allow 8086/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```
