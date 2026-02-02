import { useState, useEffect } from 'react';
import { BarChart3, ExternalLink, RefreshCw, Settings, AlertCircle, CheckCircle, Maximize2, Minimize2, Info, Globe } from 'lucide-react';

interface GrafanaConfig {
    url: string;
    dashboardId: string;
    orgId: string;
    theme: 'dark' | 'light';
    refreshInterval: number;
    kioskMode: boolean;
}

import { env } from '@/lib/env';

export function GrafanaPage() {
    const [config, setConfig] = useState<GrafanaConfig>({
        url: env.grafanaUrl,
        dashboardId: 'adx96f4/pfsense-cputest', // pfSense-CPUTest dashboard
        orgId: '1',
        theme: 'dark',
        refreshInterval: 5,
        kioskMode: true,
    });

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [embedUrl, setEmbedUrl] = useState('');
    const [error, setError] = useState('');
    const [iframeKey, setIframeKey] = useState(0);
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);

    // Pre-configured dashboard options - add your dashboard IDs here
    const dashboardPresets = [
        { id: 'adx96f4/pfsense-cputest', name: 'pfSense CPU Test', description: 'CPU Usage monitoring' },
        { id: '', name: 'Grafana Home', description: 'Default Grafana home' },
    ];

    // Load saved config
    useEffect(() => {
        const saved = localStorage.getItem('grafana_config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to load Grafana config');
            }
        }
    }, []);

    // Build embed URL
    useEffect(() => {
        let url = config.url;

        if (config.dashboardId) {
            url += `/d/${config.dashboardId}`;
        }

        const params = new URLSearchParams();
        params.set('orgId', config.orgId);
        params.set('theme', config.theme);
        params.set('refresh', `${config.refreshInterval}s`);

        if (config.kioskMode) {
            // Use 'tv' mode for cleanest embed (no sidebar, no top nav)
            params.set('kiosk', 'tv');
        }

        url += `?${params.toString()}`;
        setEmbedUrl(url);
    }, [config]);

    // Save config
    const saveConfig = () => {
        localStorage.setItem('grafana_config', JSON.stringify(config));
        setIframeKey(prev => prev + 1); // Force iframe reload
    };

    // Test connection
    const testConnection = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Simple reachability check
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            await fetch(`${config.url}/api/health`, {
                mode: 'no-cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            setIsConnected(true);
        } catch (err) {
            // In no-cors mode, we can't read the response but if it doesn't throw, it might be reachable
            if (config.url.startsWith('http')) {
                setIsConnected(true);
            } else {
                setError('Cannot reach Grafana. Check the URL.');
                setIsConnected(false);
            }
        }

        setIsLoading(false);
    };

    useEffect(() => {
        testConnection();
    }, [config.url]);

    const handleConfigChange = (field: keyof GrafanaConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const openExternal = () => {
        window.open(embedUrl, '_blank', 'noopener,noreferrer');
    };

    const reloadIframe = () => {
        setIframeKey(prev => prev + 1);
    };

    const handleIframeError = () => {
        setError('Iframe failed to load. This is usually due to Grafana security settings.');
        setShowTroubleshooting(true);
    };

    return (
        <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}>
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                            <BarChart3 className="h-6 w-6 text-orange-500" />
                        </div>
                        Grafana Monitoring
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Embedded Grafana dashboards for real-time pfSense infrastructure monitoring
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Connection Status */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isConnected
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                        }`}>
                        {isConnected ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        <span className="text-xs font-medium">
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>

                    <button
                        onClick={reloadIframe}
                        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                        title="Reload dashboard"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={() => setIsConfigOpen(!isConfigOpen)}
                        className={`p-2 rounded-lg border transition-colors ${isConfigOpen ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                            }`}
                        title="Configure Grafana"
                    >
                        <Settings className="h-4 w-4" />
                    </button>

                    <button
                        onClick={openExternal}
                        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                        title="Open in new tab"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="h-4 w-4" />
                        ) : (
                            <Maximize2 className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Troubleshooting Banner */}
            {showTroubleshooting && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-orange-500">Iframe Not Loading?</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                This usually means Grafana's security settings need to be updated. In your Ubuntu server, edit <code className="px-1 py-0.5 bg-black/30 rounded">/etc/grafana/grafana.ini</code>:
                            </p>
                            <pre className="mt-2 p-2 bg-black/30 rounded text-xs overflow-x-auto">
                                {`[security]
allow_embedding = true
cookie_samesite = disabled

[auth.anonymous]
enabled = true
org_role = Viewer`}
                            </pre>
                            <p className="text-xs text-muted-foreground mt-2">
                                Then restart: <code className="px-1 py-0.5 bg-black/30 rounded">sudo systemctl restart grafana-server</code>
                            </p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => setShowTroubleshooting(false)}
                                    className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={reloadIframe}
                                    className="px-3 py-1.5 rounded-lg border border-orange-500 bg-orange-500/10 text-xs text-orange-500 hover:bg-orange-500/20 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Panel */}
            {isConfigOpen && (
                <div
                    className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
                    style={{
                        background: 'rgba(20, 24, 40, 0.5)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <h3 className="font-semibold mb-4">Grafana Configuration</h3>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Grafana URL</label>
                                <input
                                    type="text"
                                    value={config.url}
                                    onChange={(e) => handleConfigChange('url', e.target.value)}
                                    placeholder="http://192.168.1.101:3000"
                                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    The URL where your Grafana instance is running (must include http://)
                                </p>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Dashboard</label>
                                <select
                                    value={config.dashboardId}
                                    onChange={(e) => handleConfigChange('dashboardId', e.target.value)}
                                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    {dashboardPresets.map((preset) => (
                                        <option key={preset.id} value={preset.id}>
                                            {preset.name} - {preset.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Organization ID</label>
                                <input
                                    type="text"
                                    value={config.orgId}
                                    onChange={(e) => handleConfigChange('orgId', e.target.value)}
                                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Theme</label>
                                <select
                                    value={config.theme}
                                    onChange={(e) => handleConfigChange('theme', e.target.value)}
                                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Auto-Refresh (seconds)</label>
                                <input
                                    type="number"
                                    value={config.refreshInterval}
                                    onChange={(e) => handleConfigChange('refreshInterval', parseInt(e.target.value) || 5)}
                                    min={1}
                                    max={300}
                                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-4">
                                <div>
                                    <p className="text-sm font-medium">Kiosk Mode</p>
                                    <p className="text-xs text-muted-foreground">Hide Grafana navigation</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={config.kioskMode}
                                        onChange={(e) => handleConfigChange('kioskMode', e.target.checked)}
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={saveConfig}
                            className="flex-1 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                            Save & Reload
                        </button>
                        <button
                            onClick={() => setShowTroubleshooting(true)}
                            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                        >
                            Troubleshooting
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && !showTroubleshooting && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                    <button
                        onClick={() => setShowTroubleshooting(true)}
                        className="text-xs text-primary hover:underline"
                    >
                        Show troubleshooting
                    </button>
                </div>
            )}

            {/* Grafana Embed */}
            <div
                className={`rounded-lg border border-border bg-card/50 overflow-hidden ${isFullscreen ? 'flex-1' : ''
                    }`}
                style={{
                    background: 'rgba(20, 24, 40, 0.5)',
                    backdropFilter: 'blur(10px)',
                    height: isFullscreen ? 'calc(100vh - 200px)' : '550px',
                }}
            >
                {isConnected ? (
                    <iframe
                        key={iframeKey}
                        src={embedUrl}
                        className="w-full h-full border-0"
                        title="Grafana Dashboard"
                        onLoad={() => setIsLoading(false)}
                        onError={handleIframeError}
                        allow="fullscreen"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Globe className="h-16 w-16 mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-2">Grafana Not Connected</h3>
                        <p className="text-sm text-center max-w-md mb-4">
                            Configure your Grafana URL above. Make sure Grafana is running and accessible.
                        </p>
                        <button
                            onClick={() => setIsConfigOpen(true)}
                            className="px-4 py-2 rounded-lg border border-primary bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                            Configure Grafana
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Access Panel */}
            <div
                className="rounded-lg border border-border bg-card/50 p-4 backdrop-blur-sm"
                style={{
                    background: 'rgba(20, 24, 40, 0.5)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Direct Access</h4>
                    <span className="text-xs text-muted-foreground">Open in new tab for full Grafana experience</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    <button
                        onClick={() => window.open(`${config.url}/`, '_blank')}
                        className="p-3 rounded-lg border border-border bg-black/20 hover:border-primary/50 transition-all text-left"
                    >
                        <div className="text-lg mb-1">🏠</div>
                        <h5 className="text-sm font-medium">Home</h5>
                        <p className="text-xs text-muted-foreground">Grafana home</p>
                    </button>
                    <button
                        onClick={() => window.open(`${config.url}/dashboards`, '_blank')}
                        className="p-3 rounded-lg border border-border bg-black/20 hover:border-primary/50 transition-all text-left"
                    >
                        <div className="text-lg mb-1">📊</div>
                        <h5 className="text-sm font-medium">Dashboards</h5>
                        <p className="text-xs text-muted-foreground">All dashboards</p>
                    </button>
                    <button
                        onClick={() => window.open(`${config.url}/datasources`, '_blank')}
                        className="p-3 rounded-lg border border-border bg-black/20 hover:border-primary/50 transition-all text-left"
                    >
                        <div className="text-lg mb-1">🔌</div>
                        <h5 className="text-sm font-medium">Data Sources</h5>
                        <p className="text-xs text-muted-foreground">Configure sources</p>
                    </button>
                    <button
                        onClick={() => window.open(`${config.url}/dashboard/import`, '_blank')}
                        className="p-3 rounded-lg border border-border bg-black/20 hover:border-primary/50 transition-all text-left"
                    >
                        <div className="text-lg mb-1">📥</div>
                        <h5 className="text-sm font-medium">Import</h5>
                        <p className="text-xs text-muted-foreground">Import dashboard</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
