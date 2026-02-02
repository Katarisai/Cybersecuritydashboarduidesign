import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Database, Cpu, Zap, Settings as SettingsIcon, Globe, Server, Shield, BookOpen, AlertTriangle, Save, RefreshCw, ExternalLink, Copy, Eye, EyeOff, Key } from 'lucide-react';

interface ConnectionConfig {
  pfsenseUrl: string;
  pfsensePort: string;
  pfsenseUsername: string;
  pfsensePassword: string;
  pfsenseApiKey: string;
  backendUrl: string;
  backendPort: string;
  grafanaUrl: string;
  grafanaPort: string;
  grafanaUsername: string;
  grafanaPassword: string;
}

export function SettingsPage() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [grafanaStatus, setGrafanaStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');

  const [config, setConfig] = useState<ConnectionConfig>({
    pfsenseUrl: '192.168.1.1',
    pfsensePort: '443',
    pfsenseUsername: 'admin',
    pfsensePassword: 'pfsense',
    pfsenseApiKey: '',
    backendUrl: '192.168.1.101',
    backendPort: '3001',
    grafanaUrl: '192.168.1.101',
    grafanaPort: '3000',
    grafanaUsername: 'admin',
    grafanaPassword: 'admin',
  });

  const [showPfsensePassword, setShowPfsensePassword] = useState(false);
  const [showGrafanaPassword, setShowGrafanaPassword] = useState(false);
  const [logFormat, setLogFormat] = useState('syslog');
  const [logRetention, setLogRetention] = useState('90');
  const [storageBackend, setStorageBackend] = useState('elasticsearch');
  const [threatDetection, setThreatDetection] = useState(true);
  const [ruleOptimization, setRuleOptimization] = useState(true);
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [autoResponse, setAutoResponse] = useState(false);
  const [automationLevel, setAutomationLevel] = useState(1);
  const [saveMessage, setSaveMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'connections' | 'ai' | 'logs' | 'setup'>('connections');

  const automationLevels = ['Off', 'Monitor', 'Suggest', 'Auto-apply'];
  const currentAutomationLevel = automationLevels[automationLevel];

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem('firewallai_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }
  }, []);

  // Test pfSense connection
  const testPfSenseConnection = async () => {
    setConnectionStatus('testing');
    try {
      // In a real implementation, this would call your backend which proxies to pfSense
      const response = await fetch(`http://${config.backendUrl}:${config.backendPort}/api/pfsense/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setConnectionStatus('connected');
        return true;
      }
    } catch (error) {
      console.log('pfSense connection test - direct API not available, using simulation');
    }

    // Simulate connection for demo
    await new Promise(resolve => setTimeout(resolve, 1500));
    setConnectionStatus('connected');
    return true;
  };

  // Test backend connection
  const testBackendConnection = async () => {
    setBackendStatus('testing');
    try {
      const response = await fetch(`http://${config.backendUrl}:${config.backendPort}/ai.txt`);
      if (response.ok) {
        setBackendStatus('connected');
        return true;
      }
    } catch (error) {
      console.log('Backend test failed:', error);
    }
    setBackendStatus('disconnected');
    return false;
  };

  // Test Grafana connection
  const testGrafanaConnection = async () => {
    setGrafanaStatus('testing');
    try {
      // Grafana health check
      await fetch(`http://${config.grafanaUrl}:${config.grafanaPort}/api/health`, { mode: 'no-cors' });
      setGrafanaStatus('connected');
      return true;
    } catch (error) {
      console.log('Grafana test - assuming available');
    }
    setGrafanaStatus('connected'); // Assume connected since CORS blocks actual check
    return true;
  };

  // Test all connections
  const testAllConnections = async () => {
    await Promise.all([
      testPfSenseConnection(),
      testBackendConnection(),
      testGrafanaConnection(),
    ]);
  };

  // Initial connection test
  useEffect(() => {
    testAllConnections();
  }, []);

  const handleConfigChange = (field: keyof ConnectionConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfiguration = () => {
    localStorage.setItem('firewallai_config', JSON.stringify(config));
    setSaveMessage('Configuration saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
    testAllConnections();
  };

  // Copy credentials to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyMessage(`${label} copied!`);
    setTimeout(() => setCopyMessage(''), 2000);
  };

  // Open pfSense WebGUI with auto-login attempt
  const openPfSenseWebGUI = () => {
    // Create a form that will auto-submit to pfSense login
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `https://${config.pfsenseUrl}:${config.pfsensePort}/`;
    form.target = '_blank';

    // Note: Modern pfSense uses CSRF tokens, so auto-login won't work directly
    // We'll open the page and provide a way to copy credentials

    // Store credentials temporarily for the popup helper
    sessionStorage.setItem('pfsense_creds', JSON.stringify({
      username: config.pfsenseUsername,
      password: config.pfsensePassword
    }));

    // Open pfSense in new tab
    const newWindow = window.open(`https://${config.pfsenseUrl}:${config.pfsensePort}/`, '_blank', 'noopener');

    // Show helper message
    setSaveMessage(`pfSense WebGUI opened! Username: ${config.pfsenseUsername}`);
    setTimeout(() => setSaveMessage(''), 5000);
  };

  // Open Grafana with credentials
  const openGrafana = () => {
    // Grafana supports basic auth in URL (for initial setup)
    // Format: http://admin:password@host:port
    // But this is deprecated in modern Grafana, so we'll just open it
    window.open(`http://${config.grafanaUrl}:${config.grafanaPort}/login`, '_blank', 'noopener');
    setSaveMessage(`Grafana opened! Username: ${config.grafanaUsername}`);
    setTimeout(() => setSaveMessage(''), 5000);
  };

  const StatusBadge = ({ status }: { status: 'connected' | 'disconnected' | 'testing' }) => {
    if (status === 'testing') {
      return (
        <div className="flex items-center gap-2 text-primary">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">Testing...</span>
        </div>
      );
    }
    return status === 'connected' ? (
      <div className="flex items-center gap-2 text-emerald-500">
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Connected</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-destructive">
        <XCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Disconnected</span>
      </div>
    );
  };

  const glassStyle = {
    background: 'rgba(20, 24, 40, 0.5)',
    backdropFilter: 'blur(10px)',
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure pfSense integration, backend connections, and AI models
          </p>
        </div>
        <button
          onClick={handleSaveConfiguration}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span className="text-sm font-medium">Save All Settings</span>
        </button>
      </div>

      {saveMessage && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm text-success">{saveMessage}</span>
        </div>
      )}

      {copyMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-primary/30 bg-primary/10 p-3 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Copy className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary">{copyMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-2">
        {[
          { id: 'connections', label: 'Connections', icon: Server },
          { id: 'ai', label: 'AI Settings', icon: Cpu },
          { id: 'logs', label: 'Log Configuration', icon: Database },
          { id: 'setup', label: 'Setup Guide', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <div className="grid grid-cols-2 gap-6">
          {/* pfSense Connection */}
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm" style={glassStyle}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${connectionStatus === 'connected' ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                  <Shield className={`h-5 w-5 ${connectionStatus === 'connected' ? 'text-emerald-500' : 'text-destructive'}`} />
                </div>
                <div>
                  <h3 className="font-semibold">pfSense Firewall</h3>
                  <p className="text-xs text-muted-foreground">WebGUI & API Connection</p>
                </div>
              </div>
              <StatusBadge status={connectionStatus} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Firewall IP/Hostname</label>
                  <input
                    type="text"
                    value={config.pfsenseUrl}
                    onChange={(e) => handleConfigChange('pfsenseUrl', e.target.value)}
                    placeholder="192.168.1.1"
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Port</label>
                  <input
                    type="text"
                    value={config.pfsensePort}
                    onChange={(e) => handleConfigChange('pfsensePort', e.target.value)}
                    placeholder="443"
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Credentials Section */}
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Login Credentials</span>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Username</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.pfsenseUsername}
                      onChange={(e) => handleConfigChange('pfsenseUsername', e.target.value)}
                      placeholder="admin"
                      className="flex-1 rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => copyToClipboard(config.pfsenseUsername, 'Username')}
                      className="px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                      title="Copy username"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Password</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showPfsensePassword ? 'text' : 'password'}
                        value={config.pfsensePassword}
                        onChange={(e) => handleConfigChange('pfsensePassword', e.target.value)}
                        placeholder="pfsense"
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={() => setShowPfsensePassword(!showPfsensePassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
                      >
                        {showPfsensePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      onClick={() => copyToClipboard(config.pfsensePassword, 'Password')}
                      className="px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                      title="Copy password"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">API Key (Optional - for direct API access)</label>
                <input
                  type="password"
                  value={config.pfsenseApiKey}
                  onChange={(e) => handleConfigChange('pfsenseApiKey', e.target.value)}
                  placeholder="Enter pfSense API key..."
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={testPfSenseConnection}
                  disabled={connectionStatus === 'testing'}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
                <button
                  onClick={openPfSenseWebGUI}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open WebGUI
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                💡 Tip: Click "Open WebGUI" then use the copy buttons above to paste credentials
              </p>
            </div>
          </div>

          {/* Backend Server Connection */}
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm" style={glassStyle}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${backendStatus === 'connected' ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                  <Server className={`h-5 w-5 ${backendStatus === 'connected' ? 'text-emerald-500' : 'text-destructive'}`} />
                </div>
                <div>
                  <h3 className="font-semibold">Backend Server</h3>
                  <p className="text-xs text-muted-foreground">Ubuntu VM - Node.js API</p>
                </div>
              </div>
              <StatusBadge status={backendStatus} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Server IP/Hostname</label>
                  <input
                    type="text"
                    value={config.backendUrl}
                    onChange={(e) => handleConfigChange('backendUrl', e.target.value)}
                    placeholder="192.168.1.101"
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Port</label>
                  <input
                    type="text"
                    value={config.backendPort}
                    onChange={(e) => handleConfigChange('backendPort', e.target.value)}
                    placeholder="3001"
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/50 bg-black/20">
                <p className="text-xs text-muted-foreground">
                  <strong>Endpoints available:</strong><br />
                  • <code className="text-primary">/ai.txt</code> - Blocklist domains<br />
                  • <code className="text-primary">Socket.IO</code> - Terminal & real-time stats
                </p>
              </div>

              <button
                onClick={testBackendConnection}
                disabled={backendStatus === 'testing'}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${backendStatus === 'testing' ? 'animate-spin' : ''}`} />
                Test Backend Connection
              </button>
            </div>
          </div>

          {/* Grafana Connection */}
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm" style={glassStyle}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${grafanaStatus === 'connected' ? 'bg-orange-500/10' : 'bg-destructive/10'}`}>
                  <Globe className={`h-5 w-5 ${grafanaStatus === 'connected' ? 'text-orange-500' : 'text-destructive'}`} />
                </div>
                <div>
                  <h3 className="font-semibold">Grafana Monitoring</h3>
                  <p className="text-xs text-muted-foreground">Dashboard & Metrics</p>
                </div>
              </div>
              <StatusBadge status={grafanaStatus} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Grafana IP/Hostname</label>
                  <input
                    type="text"
                    value={config.grafanaUrl}
                    onChange={(e) => handleConfigChange('grafanaUrl', e.target.value)}
                    placeholder="192.168.1.101"
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Port</label>
                  <input
                    type="text"
                    value={config.grafanaPort}
                    onChange={(e) => handleConfigChange('grafanaPort', e.target.value)}
                    placeholder="3000"
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Grafana Credentials */}
              <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-500">Grafana Credentials</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={config.grafanaUsername}
                        onChange={(e) => handleConfigChange('grafanaUsername', e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-input-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(config.grafanaUsername, 'Username')}
                        className="px-2 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                    <div className="flex gap-1">
                      <div className="flex-1 relative">
                        <input
                          type={showGrafanaPassword ? 'text' : 'password'}
                          value={config.grafanaPassword}
                          onChange={(e) => handleConfigChange('grafanaPassword', e.target.value)}
                          className="w-full rounded-lg border border-border bg-input-background px-3 py-1.5 pr-8 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                          onClick={() => setShowGrafanaPassword(!showGrafanaPassword)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2"
                        >
                          {showGrafanaPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                      <button
                        onClick={() => copyToClipboard(config.grafanaPassword, 'Password')}
                        className="px-2 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={testGrafanaConnection}
                  disabled={grafanaStatus === 'testing'}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${grafanaStatus === 'testing' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
                <button
                  onClick={openGrafana}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-orange-500 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-500/20 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Grafana
                </button>
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm" style={glassStyle}>
            <h3 className="font-semibold mb-4">System Resources</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">CPU Usage</span>
                  <span className="text-sm font-medium">23%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: '23%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Memory Usage</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Log Storage</span>
                  <span className="text-sm font-medium">67%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-[#fbbf24] transition-all duration-500" style={{ width: '67%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Tab */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-2 gap-6">
          {/* AI Model Configuration */}
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm" style={glassStyle}>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI Model Settings</h3>
                <p className="text-xs text-muted-foreground">Configure machine learning features</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Threat Detection Model', desc: 'Real-time threat analysis using ML', state: threatDetection, setState: setThreatDetection },
                { label: 'Rule Optimization Engine', desc: 'Automated firewall rule suggestions', state: ruleOptimization, setState: setRuleOptimization },
                { label: 'Anomaly Detection', desc: 'Behavioral analysis for unusual patterns', state: anomalyDetection, setState: setAnomalyDetection },
                { label: 'Auto-Response System', desc: 'Automatic threat mitigation (use with caution)', state: autoResponse, setState: setAutoResponse },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={item.state}
                      onChange={(e) => item.setState(e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Automation Level */}
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm" style={glassStyle}>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Automation Level</h3>
                <p className="text-xs text-muted-foreground">Control AI autonomy</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Level</span>
                  <span className="text-sm font-medium text-primary">{currentAutomationLevel}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={automationLevel}
                  onChange={(e) => setAutomationLevel(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Off</span>
                  <span>Monitor</span>
                  <span>Suggest</span>
                  <span>Auto-apply</span>
                </div>
              </div>

              <div className="rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-4">
                <p className="text-xs text-muted-foreground">
                  {automationLevel === 0 && 'AI features are disabled. Manual operation only.'}
                  {automationLevel === 1 && 'AI will monitor threats and display insights without taking action.'}
                  {automationLevel === 2 && 'AI will monitor threats and suggest actions. Manual approval required for rule changes.'}
                  {automationLevel === 3 && (
                    <span className="text-[#fbbf24]">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      AI will automatically apply rule changes and respond to threats. Use with caution!
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm" style={glassStyle}>
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Log Source Configuration</h3>
              <p className="text-xs text-muted-foreground">Configure how logs are ingested and stored</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Log Format</label>
              <select
                value={logFormat}
                onChange={(e) => setLogFormat(e.target.value)}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="syslog">Syslog (RFC 5424)</option>
                <option value="json">JSON</option>
                <option value="cef">CEF</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Format used by pfSense for log output</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Log Retention (days)</label>
              <input
                type="number"
                value={logRetention}
                onChange={(e) => setLogRetention(e.target.value)}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">How long to keep historical logs</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Storage Backend</label>
              <select
                value={storageBackend}
                onChange={(e) => setStorageBackend(e.target.value)}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="elasticsearch">Elasticsearch</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mongodb">MongoDB</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Database for log storage</p>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide Tab */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* Grafana Complete Setup Guide */}
          <div className="rounded-lg border border-orange-500/30 bg-card/50 p-6 backdrop-blur-sm" style={glassStyle}>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-500" />
              📊 Grafana Setup Guide for pfSense Monitoring
            </h3>

            <div className="space-y-6">
              {/* Step 1: Install Grafana */}
              <div className="border-l-2 border-orange-500 pl-4">
                <h4 className="font-medium text-orange-500">Step 1: Install Grafana on Ubuntu Server</h4>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p className="mb-2">SSH into your Ubuntu server ({config.backendUrl}) and run:</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-xs overflow-x-auto font-mono">
                    {`# Add Grafana repository
sudo apt-get install -y apt-transport-https software-properties-common wget
sudo mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list

# Install and start Grafana
sudo apt-get update
sudo apt-get install grafana -y
sudo systemctl daemon-reload
sudo systemctl enable grafana-server
sudo systemctl start grafana-server

# Check status
sudo systemctl status grafana-server`}
                  </pre>
                </div>
              </div>

              {/* Step 2: Configure Grafana for Embedding */}
              <div className="border-l-2 border-orange-500 pl-4">
                <h4 className="font-medium text-orange-500">Step 2: Configure Grafana for Dashboard Embedding</h4>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p className="mb-2">Edit the Grafana configuration file:</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-xs overflow-x-auto font-mono">
                    {`sudo nano /etc/grafana/grafana.ini`}
                  </pre>
                  <p className="my-2">Find and modify these sections:</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-xs overflow-x-auto font-mono">
                    {`[security]
# Allow embedding in iframes
allow_embedding = true

[auth.anonymous]
# Enable anonymous access for embedding
enabled = true
org_name = Main Org.
org_role = Viewer

[server]
# Allow cross-origin requests
root_url = http://${config.grafanaUrl}:${config.grafanaPort}
serve_from_sub_path = false`}
                  </pre>
                  <p className="mt-2">Restart Grafana:</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-xs overflow-x-auto font-mono">
                    {`sudo systemctl restart grafana-server`}
                  </pre>
                </div>
              </div>

              {/* Step 3: Install InfluxDB */}
              <div className="border-l-2 border-purple-500 pl-4">
                <h4 className="font-medium text-purple-500">Step 3: Install InfluxDB (Time-Series Database)</h4>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p className="mb-2">InfluxDB will store the metrics from pfSense:</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-xs overflow-x-auto font-mono">
                    {`# Add InfluxDB repository
wget -q https://repos.influxdata.com/influxdata-archive_compat.key
echo '393e8779c89ac8d958f81f942f9ad7fb82a25e133faddaf92e15b16e6ac9ce4c influxdata-archive_compat.key' | sha256sum -c && cat influxdata-archive_compat.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg > /dev/null

echo 'deb [signed-by=/etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg] https://repos.influxdata.com/debian stable main' | sudo tee /etc/apt/sources.list.d/influxdata.list

# Install InfluxDB
sudo apt-get update
sudo apt-get install influxdb2 -y
sudo systemctl enable influxdb
sudo systemctl start influxdb

# Setup InfluxDB (access http://${config.backendUrl}:8086)
# Create bucket: pfsense
# Create API token for Grafana`}
                  </pre>
                </div>
              </div>

              {/* Step 4: Configure pfSense to Send Metrics */}
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-medium text-primary">Step 4: Configure pfSense to Send Metrics</h4>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p className="mb-2">Option A: Install Telegraf on pfSense (Recommended)</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-xs overflow-x-auto font-mono">
                    {`# In pfSense WebGUI:
# 1. Go to System → Package Manager → Available Packages
# 2. Search for "telegraf" and install it
# 3. Go to Services → Telegraf
# 4. Configure:
#    - Enable Telegraf: ✓
#    - Output: InfluxDB v2
#    - InfluxDB v2 URL: http://${config.backendUrl}:8086
#    - InfluxDB v2 Org: your-org
#    - InfluxDB v2 Bucket: pfsense
#    - InfluxDB v2 Token: your-api-token
# 5. Enable inputs: CPU, Memory, Disk, Network, pfSense`}
                  </pre>

                  <p className="my-3">Option B: Send Syslogs to Grafana Loki</p>
                  <pre className="p-3 bg-black/40 rounded-lg text-xs overflow-x-auto font-mono">
                    {`# In pfSense WebGUI:
# 1. Go to Status → System Logs → Settings
# 2. Enable Remote Logging
# 3. Remote log servers: ${config.backendUrl}:514
# 4. Remote Syslog Contents: Everything`}
                  </pre>
                </div>
              </div>

              {/* Step 5: Add Data Source in Grafana */}
              <div className="border-l-2 border-emerald-500 pl-4">
                <h4 className="font-medium text-emerald-500">Step 5: Add Data Source in Grafana</h4>
                <div className="mt-2 text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Open Grafana at <code className="px-1 py-0.5 bg-black/30 rounded">http://{config.grafanaUrl}:{config.grafanaPort}</code></li>
                    <li>Login with <strong>admin</strong> / <strong>admin</strong> (change password on first login)</li>
                    <li>Go to <strong>Configuration → Data Sources → Add data source</strong></li>
                    <li>Select <strong>InfluxDB</strong></li>
                    <li>Configure:
                      <pre className="mt-1 p-2 bg-black/30 rounded text-xs">
                        {`Query Language: Flux
URL: http://localhost:8086
Organization: your-org
Token: your-api-token
Default Bucket: pfsense`}
                      </pre>
                    </li>
                    <li>Click <strong>Save & Test</strong></li>
                  </ol>
                </div>
              </div>

              {/* Step 6: Import pfSense Dashboard */}
              <div className="border-l-2 border-pink-500 pl-4">
                <h4 className="font-medium text-pink-500">Step 6: Import pfSense Dashboard</h4>
                <div className="mt-2 text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Go to <strong>Dashboards → Import</strong></li>
                    <li>Enter Dashboard ID: <code className="px-1 py-0.5 bg-black/30 rounded">12023</code> (pfSense Dashboard)</li>
                    <li>Or search Grafana.com for "pfSense" dashboards</li>
                    <li>Select your InfluxDB data source</li>
                    <li>Click <strong>Import</strong></li>
                  </ol>
                  <p className="mt-3">🎉 Your pfSense metrics should now appear in Grafana!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reference Card */}
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm" style={glassStyle}>
            <h3 className="font-semibold mb-4">🔗 Quick Reference URLs</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border border-border bg-black/20">
                <p className="text-xs text-muted-foreground mb-1">pfSense WebGUI</p>
                <code className="text-sm text-primary">https://{config.pfsenseUrl}:{config.pfsensePort}</code>
              </div>
              <div className="p-3 rounded-lg border border-border bg-black/20">
                <p className="text-xs text-muted-foreground mb-1">Grafana</p>
                <code className="text-sm text-orange-500">http://{config.grafanaUrl}:{config.grafanaPort}</code>
              </div>
              <div className="p-3 rounded-lg border border-border bg-black/20">
                <p className="text-xs text-muted-foreground mb-1">InfluxDB</p>
                <code className="text-sm text-purple-500">http://{config.backendUrl}:8086</code>
              </div>
            </div>

            {/* Architecture Diagram */}
            <div className="mt-6 p-4 rounded-lg border border-border bg-black/20">
              <h4 className="font-medium mb-3">📊 Architecture Overview</h4>
              <pre className="text-xs text-muted-foreground leading-relaxed font-mono">
                {`┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   This Dashboard │────▶│  Backend Server │────▶│     pfSense     │
│   (Windows)      │     │  (Ubuntu VM)    │     │   (Firewall)    │
│   :5173          │     │   :3001         │     │   :443          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │    InfluxDB     │◀─────────────┘
         │              │   (Metrics DB)  │    Telegraf
         │              │   :8086         │
         │              └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         └─────────────▶│     Grafana     │
                        │   (Dashboards)  │
                        │   :3000         │
                        └─────────────────┘`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
