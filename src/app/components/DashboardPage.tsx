import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Shield, TrendingUp, Ban, Clock, Globe, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BlockedDomain {
  domain: string;
  blockedAt: string;
  reason: string;
  attempts: number;
}

interface BlockEvent {
  domain: string;
  timestamp: string;
  sourceIP: string;
  action: string;
}

export function DashboardPage() {
  const [activeThreats, setActiveThreats] = useState(12);
  const [logsPerSecond, setLogsPerSecond] = useState(2847);
  const [ruleCount, setRuleCount] = useState(342);
  const [riskLevel, setRiskLevel] = useState('Medium');
  const [blockedDomains, setBlockedDomains] = useState<BlockedDomain[]>([]);
  const [blockEvents, setBlockEvents] = useState<BlockEvent[]>([]);
  const [isLoadingBlocklist, setIsLoadingBlocklist] = useState(true);
  const [backendUrl, setBackendUrl] = useState('http://192.168.1.101:3001');
  
  const [networkTrafficData, setNetworkTrafficData] = useState([
    { time: '00:00', packets: 4200 },
    { time: '04:00', packets: 2100 },
    { time: '08:00', packets: 7800 },
    { time: '12:00', packets: 9200 },
    { time: '16:00', packets: 8500 },
    { time: '20:00', packets: 6300 },
    { time: '23:59', packets: 5100 },
  ]);

  const [aiInsights, setAiInsights] = useState([
    {
      severity: 'high',
      title: 'Possible brute-force attack detected',
      description: 'Multiple failed SSH attempts from 192.168.1.45',
      time: '2 minutes ago',
    },
    {
      severity: 'medium',
      title: 'Rule consolidation suggested',
      description: '8 redundant firewall rules identified for optimization',
      time: '15 minutes ago',
    },
    {
      severity: 'low',
      title: 'Policy drift detected in DMZ zone',
      description: 'Configuration variance from baseline detected',
      time: '1 hour ago',
    },
  ]);

  // Fetch blocklist from backend
  const fetchBlocklist = async () => {
    setIsLoadingBlocklist(true);
    try {
      const response = await fetch(`${backendUrl}/ai.txt`);
      if (response.ok) {
        const text = await response.text();
        const domains = text.split('\n').filter(d => d.trim() !== '');
        const now = new Date();
        
        // Map domains to blocked domain objects
        const blockedList: BlockedDomain[] = domains.map((domain, index) => ({
          domain: domain.trim(),
          blockedAt: new Date(now.getTime() - Math.random() * 86400000 * 7).toLocaleString(),
          reason: ['Policy Violation', 'Malware', 'Phishing', 'Adult Content', 'Social Media'][index % 5],
          attempts: Math.floor(Math.random() * 500) + 10
        }));
        
        setBlockedDomains(blockedList);
      }
    } catch (error) {
      console.error('Failed to fetch blocklist:', error);
      // Fallback demo data
      setBlockedDomains([
        { domain: 'example.com', blockedAt: '2025-01-25 09:30:00', reason: 'Policy Violation', attempts: 156 },
        { domain: 'facebook.com', blockedAt: '2025-01-25 08:15:00', reason: 'Social Media', attempts: 342 },
        { domain: 'instagram.com', blockedAt: '2025-01-24 14:22:00', reason: 'Social Media', attempts: 289 },
        { domain: 'bing.com', blockedAt: '2025-01-23 11:45:00', reason: 'Policy Violation', attempts: 45 },
      ]);
    }
    setIsLoadingBlocklist(false);
  };

  // Generate simulated block events
  const generateBlockEvent = (): BlockEvent => {
    const domains = blockedDomains.length > 0 
      ? blockedDomains.map(d => d.domain)
      : ['facebook.com', 'instagram.com', 'example.com', 'bing.com'];
    const sourceIPs = ['192.168.1.45', '192.168.1.102', '192.168.1.78', '10.0.0.15', '172.16.0.23'];
    
    return {
      domain: domains[Math.floor(Math.random() * domains.length)],
      timestamp: new Date().toLocaleTimeString(),
      sourceIP: sourceIPs[Math.floor(Math.random() * sourceIPs.length)],
      action: 'BLOCKED'
    };
  };

  // Initial fetch
  useEffect(() => {
    fetchBlocklist();
  }, [backendUrl]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update logs per second with realistic fluctuation
      setLogsPerSecond(prev => {
        const change = Math.floor(Math.random() * 200) - 100;
        return Math.max(2000, Math.min(4000, prev + change));
      });

      // Randomly update active threats
      if (Math.random() > 0.7) {
        setActiveThreats(prev => Math.max(0, prev + (Math.random() > 0.5 ? 1 : -1)));
      }

      // Update network traffic data
      setNetworkTrafficData(prev => {
        const newData = [...prev];
        newData.shift();
        const lastValue = newData[newData.length - 1].packets;
        const change = Math.floor(Math.random() * 2000) - 1000;
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          packets: Math.max(1000, Math.min(12000, lastValue + change)),
        });
        return newData;
      });

      // Add new block event occasionally
      if (Math.random() > 0.6 && blockedDomains.length > 0) {
        setBlockEvents(prev => [generateBlockEvent(), ...prev.slice(0, 9)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [blockedDomains]);

  const summaryCards = [
    {
      title: 'Active Threats',
      value: activeThreats.toString(),
      change: '+3 from last hour',
      description: 'Real-time threat monitoring across all network segments',
      icon: AlertTriangle,
      color: 'destructive',
    },
    {
      title: 'Logs per Second',
      value: logsPerSecond.toLocaleString(),
      change: 'Real-time metric',
      description: 'Firewall log ingestion rate from pfSense',
      icon: Activity,
      color: 'primary',
    },
    {
      title: 'Firewall Rule Count',
      value: ruleCount.toString(),
      change: '12 optimized this week',
      description: 'Active rules synced from pfSense configuration',
      icon: Shield,
      color: 'success',
    },
    {
      title: 'Anomaly Risk Level',
      value: riskLevel,
      change: 'Elevated from Low',
      description: 'AI-calculated risk score based on traffic patterns',
      icon: TrendingUp,
      color: 'warning',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time pfSense firewall monitoring and threat intelligence
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-emerald-500 font-medium">Live</span>
          </div>
          <span>•</span>
          <span>Backend: {backendUrl}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const colorMap = {
            destructive: 'bg-destructive/10 text-destructive border-destructive/30',
            primary: 'bg-primary/10 text-primary border-primary/30',
            success: 'bg-success/10 text-success border-success/30',
            warning: 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30',
          };

          return (
            <div
              key={index}
              className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group"
              style={{
                background: 'rgba(20, 24, 40, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.change}</p>
                </div>
                <div className={`rounded-lg border p-2.5 ${colorMap[card.color as keyof typeof colorMap]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              {/* Tooltip on hover */}
              <div className="mt-3 pt-3 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Network Traffic Chart */}
        <div
          className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
          style={{
            background: 'rgba(20, 24, 40, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Network Traffic Analysis</h3>
              <p className="text-xs text-muted-foreground mt-1">Packets processed per time interval</p>
            </div>
            <span className="flex items-center gap-2 text-xs text-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
              </span>
              Live
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={networkTrafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 255, 0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#71788a"
                  tick={{ fill: '#71788a', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#71788a"
                  tick={{ fill: '#71788a', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f35',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e4e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="packets"
                  stroke="#00d9ff"
                  strokeWidth={2}
                  dot={{ fill: '#00d9ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Security Insights */}
        <div
          className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
          style={{
            background: 'rgba(20, 24, 40, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="mb-4">
            <h3 className="font-semibold">AI Security Insights</h3>
            <p className="text-xs text-muted-foreground mt-1">Machine learning-powered threat detection</p>
          </div>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => {
              const severityColors = {
                high: 'border-destructive/30 bg-destructive/5',
                medium: 'border-[#fbbf24]/30 bg-[#fbbf24]/5',
                low: 'border-primary/30 bg-primary/5',
              };

              const severityDots = {
                high: 'bg-destructive',
                medium: 'bg-[#fbbf24]',
                low: 'bg-primary',
              };

              return (
                <div
                  key={index}
                  className={`rounded-lg border p-4 transition-all hover:border-primary/50 ${
                    severityColors[insight.severity as keyof typeof severityColors]
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${severityDots[insight.severity as keyof typeof severityDots]}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{insight.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Blocked Domains Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Blocked Domains List */}
        <div
          className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
          style={{
            background: 'rgba(20, 24, 40, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Blocked Domains</h3>
                <p className="text-xs text-muted-foreground">Domains from blocklist (ai.txt)</p>
              </div>
            </div>
            <button 
              onClick={fetchBlocklist}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              title="Refresh blocklist"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBlocklist ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {isLoadingBlocklist ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {blockedDomains.map((blocked, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-black/20 hover:bg-black/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-mono font-medium">{blocked.domain}</p>
                      <p className="text-xs text-muted-foreground">{blocked.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-destructive">{blocked.attempts} blocks</p>
                    <p className="text-xs text-muted-foreground">{blocked.blockedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Block Events */}
        <div
          className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
          style={{
            background: 'rgba(20, 24, 40, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Recent Block Events</h3>
              <p className="text-xs text-muted-foreground">Live feed of blocked access attempts</p>
            </div>
          </div>
          
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {blockEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Waiting for block events...</p>
              </div>
            ) : (
              blockEvents.map((event, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 animate-in slide-in-from-top-2"
                >
                  <div className="flex items-center gap-3">
                    <Ban className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="text-sm font-mono">{event.domain}</p>
                      <p className="text-xs text-muted-foreground">from {event.sourceIP}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive font-medium">
                      {event.action}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{event.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
