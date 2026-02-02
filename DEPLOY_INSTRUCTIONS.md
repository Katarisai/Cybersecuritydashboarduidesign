# FirewallAI Distributed Deployment Guide

This project is now architected to run in a distributed manner:
- **Frontend**: Windows PC (UI/UX)
- **Backend**: Ubuntu Server (AI Processing & Terminal/SSH)

## Step 1: Prepare the Ubuntu Server (Backend)

1. **Transfer Files**: Copy the entire `backend` folder from your Windows PC to your Ubuntu server.
   *Tip: You can use SCP or just zip it and copy it over.*

2. **Install Dependencies**:
   On the Ubuntu server, navigate to the `backend` folder and run:
   ```bash
   # Install system requirements for terminal emulation (node-pty)
   sudo apt update
   sudo apt install -y python3 make g++ build-essential

   # Install Node.js dependencies
   npm install groq-sdk node-pty node-ssh socket.io express cors dotenv
   ```

3. **Configure Environment**:
   Create a `.env` file inside the `backend` folder on Ubuntu:
   ```bash
   nano .env
   ```
   Paste the following content:
   ```env
   PORT=3001
   HOST=0.0.0.0
   
   # Get a FREE key from https://console.groq.com/keys
   GROQ_API_KEY=gsk_your_key_here_xxxxxxxxxxxxx
   AI_MODEL=llama-3.3-70b-versatile
   
   # pfSense Credentials (if applicable)
   PFSENSE_HOST=192.168.1.1
   PFSENSE_USER=admin
   PFSENSE_PASSWORD=pfsense
   ```

4. **Start the Server**:
   Run the NEW remote-optimized server script:
   ```bash
   node server_remote.js
   ```
   You should see: `🚀 FirewallAI Remote Server Running`

---

## Step 2: Configure the Windows PC (Frontend)

1. **Update Connection Settings**:
   The frontend needs to know where your Ubuntu server is.
   
   Open `.env.local` (or create it) in the root of the `firewalldesign` folder:
   ```env
   VITE_BACKEND_URL=http://<YOUR_UBUNTU_IP>:3001
   VITE_GRAFANA_URL=http://<YOUR_UBUNTU_IP>:3000
   VITE_APP_NAME=FirewallAI
   ```
   *Replace `<YOUR_UBUNTU_IP>` with the actual IP address of your server (e.g., 192.168.1.101).*

2. **Run the Frontend**:
   ```bash
   npm run dev
   ```

## Troubleshooting
- **Terminal not typing?**: Ensure `node-pty` compiled correctly on Ubuntu. If you see errors about `python` during `npm install`, install `python-is-python3`.
- **AI not working?**: Check the Ubuntu server logs. If it says "missing API Key", ensure you added the `GROQ_API_KEY` in the `.env` file.
