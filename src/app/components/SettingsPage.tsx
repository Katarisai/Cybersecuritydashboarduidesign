import { useState } from 'react';
import { CheckCircle, XCircle, Database, Cpu, Zap, Settings as SettingsIcon } from 'lucide-react';

export function SettingsPage() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const [logFormat, setLogFormat] = useState('syslog');
  const [logRetention, setLogRetention] = useState('90');
  const [storageBackend, setStorageBackend] = useState('elasticsearch');
  const [threatDetection, setThreatDetection] = useState(true);
  const [ruleOptimization, setRuleOptimization] = useState(true);
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [autoResponse, setAutoResponse] = useState(false);
  const [automationLevel, setAutomationLevel] = useState(1);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const automationLevels = ['Off', 'Monitor', 'Suggest', 'Auto-apply'];
  const currentAutomationLevel = automationLevels[automationLevel];

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      alert('Connection test successful! pfSense is responding normally.');
    }, 2000);
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect from pfSense?')) {
      setConnectionStatus('disconnected');
      setTimeout(() => setConnectionStatus('connected'), 3000); // Auto-reconnect for demo
    }
  };

  const handleSaveConfiguration = () => {
    setSaveMessage('Configuration saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2>System Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure pfSense integration and AI models</p>
      </div>

      {saveMessage && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm text-success">{saveMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* pfSense Connection */}
          <div
            className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
            style={{
              background: 'rgba(20, 24, 40, 0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`rounded-lg p-2 ${
                connectionStatus === 'connected' ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
                <Database className={`h-5 w-5 ${
                  connectionStatus === 'connected' ? 'text-success' : 'text-destructive'
                }`} />
              </div>
              <h3>pfSense Connection Status</h3>
            </div>

            <div className="space-y-4">
              <div className={`flex items-center justify-between rounded-lg border p-4 ${
                connectionStatus === 'connected' 
                  ? 'border-success/30 bg-success/5' 
                  : 'border-destructive/30 bg-destructive/5'
              }`}>
                <div>
                  <p className="text-sm font-medium">Connection Status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {connectionStatus === 'connected' ? 'Last sync: 2 minutes ago' : 'Disconnected'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {connectionStatus === 'connected' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-sm font-medium text-success">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Disconnected</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Firewall Host</label>
                  <input
                    type="text"
                    value="192.168.1.1"
                    readOnly
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">API Port</label>
                  <input
                    type="text"
                    value="443"
                    readOnly
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Version</label>
                  <input
                    type="text"
                    value="pfSense 2.7.2-RELEASE"
                    readOnly
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleTestConnection}
                  disabled={isTesting || connectionStatus === 'disconnected'}
                  className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                <button 
                  onClick={handleDisconnect}
                  disabled={connectionStatus === 'disconnected'}
                  className="flex-1 rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Log Source Configuration */}
          <div
            className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
            style={{
              background: 'rgba(20, 24, 40, 0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <h3>Log Source Configuration</h3>
            </div>

            <div className="space-y-4">
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
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Log Retention (days)</label>
                <input
                  type="number"
                  value={logRetention}
                  onChange={(e) => setLogRetention(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
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
              </div>

              <button 
                onClick={handleSaveConfiguration}
                className="w-full rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Model Configuration */}
          <div
            className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
            style={{
              background: 'rgba(20, 24, 40, 0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <h3>AI Model Settings</h3>
            </div>

            <div className="space-y-4">
              {/* Model toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-4">
                  <div>
                    <p className="text-sm font-medium">Threat Detection Model</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Real-time threat analysis</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={threatDetection}
                      onChange={(e) => setThreatDetection(e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-4">
                  <div>
                    <p className="text-sm font-medium">Rule Optimization Engine</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Automated rule suggestions</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={ruleOptimization}
                      onChange={(e) => setRuleOptimization(e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-4">
                  <div>
                    <p className="text-sm font-medium">Anomaly Detection</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Behavioral analysis</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={anomalyDetection}
                      onChange={(e) => setAnomalyDetection(e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-4">
                  <div>
                    <p className="text-sm font-medium">Auto-Response System</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Automatic threat mitigation</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={autoResponse}
                      onChange={(e) => setAutoResponse(e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Automation Level */}
          <div
            className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
            style={{
              background: 'rgba(20, 24, 40, 0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3>Automation Level</h3>
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
                  {automationLevel === 1 && 'AI will monitor threats without taking action.'}
                  {automationLevel === 2 && 'AI will monitor threats and suggest actions. Manual approval required for rule changes.'}
                  {automationLevel === 3 && 'AI will automatically apply rule changes and respond to threats. Use with caution!'}
                </p>
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div
            className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
            style={{
              background: 'rgba(20, 24, 40, 0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h3 className="mb-4">System Resources</h3>
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
      </div>
    </div>
  );
}
