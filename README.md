# FirewallAI Dashboard

<div align="center">
  <h1>🔥 FirewallAI</h1>
  <p><strong>AI-Powered Cybersecurity Dashboard for pfSense</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-18.3-blue?style=flat-square&logo=react" alt="React">
    <img src="https://img.shields.io/badge/Vite-6.3-purple?style=flat-square&logo=vite" alt="Vite">
    <img src="https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/TailwindCSS-4.1-cyan?style=flat-square&logo=tailwindcss" alt="TailwindCSS">
  </p>
</div>

---

## 📋 Features

- **🖥️ Real-time Dashboard** - Monitor pfSense firewall status, network traffic, and system health
- **🤖 AI-Powered Rules** - Natural language firewall rule generation using Ollama/LLaMA
- **📊 Grafana Integration** - Embedded monitoring dashboards with persistent sessions
- **💻 Web Terminal** - SSH access to Ubuntu server with persistent sessions
- **📈 Analytics** - Traffic analysis and threat detection
- **⚙️ pfSense Integration** - Direct SSH control of firewall rules

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (with npm)
- **Ubuntu Server** 22.04+ (for backend)
- **pfSense** 2.7+ (firewall)
- **Ollama** (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Katarisai/Cybersecuritydashboarduidesign.git
   cd Cybersecuritydashboarduidesign
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Windows Launcher

For Windows users, simply run:
```powershell
.\FirewallAI-Launcher.ps1
```

## 📁 Project Structure

```
firewalldesign/
├── backend/                 # Node.js backend (runs on Ubuntu)
│   ├── server.js           # Main server (Terminal, AI, pfSense)
│   ├── package.json        # Backend dependencies
│   └── Dockerfile          # Docker build
├── docker/                  # Docker configurations
│   ├── nginx/              # Frontend nginx config
│   ├── grafana/            # Grafana provisioning
│   └── telegraf/           # Metrics collection
├── scripts/                 # Helper scripts
├── src/                     # React frontend source
│   ├── app/
│   │   ├── components/     # React components
│   │   └── App.tsx         # Main application
│   ├── styles/             # CSS/Tailwind styles
│   └── main.tsx            # Entry point
├── .env.example            # Environment template
├── docker-compose.yml      # Full stack deployment
├── package.json            # Frontend dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `http://192.168.1.101:3001` |
| `VITE_GRAFANA_URL` | Grafana URL | `http://192.168.1.101:3000` |
| `PFSENSE_HOST` | pfSense IP address | `192.168.1.1` |
| `PFSENSE_USER` | pfSense SSH username | `admin` |
| `PFSENSE_PASSWORD` | pfSense SSH password | - |
| `OLLAMA_URL` | Ollama API URL | `http://127.0.0.1:11434` |

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🔒 Security Notes

- **Never commit `.env` files** - use `.env.example` as a template
- **Change default passwords** in production
- **Use SSH keys** instead of passwords where possible
- **Enable HTTPS** for production deployments

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript checks |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Radix UI](https://www.radix-ui.com/) - Headless UI primitives
- [xterm.js](https://xtermjs.org/) - Terminal emulator
- [Recharts](https://recharts.org/) - Charts library
- [Ollama](https://ollama.ai/) - Local LLM inference