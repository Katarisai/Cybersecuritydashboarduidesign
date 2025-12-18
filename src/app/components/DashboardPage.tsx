import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Shield, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardPage() {
  const [activeThreats, setActiveThreats] = useState(12);
  const [logsPerSecond, setLogsPerSecond] = useState(2847);
  const [ruleCount, setRuleCount] = useState(342);
  const [riskLevel, setRiskLevel] = useState('Medium');
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
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const summaryCards = [
    {
      title: 'Active Threats',
      value: activeThreats.toString(),
      change: '+3 from last hour',
      icon: AlertTriangle,
      color: 'destructive',
    },
    {
      title: 'Logs per Second',
      value: logsPerSecond.toLocaleString(),
      change: 'Real-time metric',
      icon: Activity,
      color: 'primary',
    },
    {
      title: 'Firewall Rule Count',
      value: ruleCount.toString(),
      change: '12 optimized this week',
      icon: Shield,
      color: 'success',
    },
    {
      title: 'Anomaly Risk Level',
      value: riskLevel,
      change: 'Elevated from Low',
      icon: TrendingUp,
      color: 'warning',
    },
  ];

  return (
    <div className="space-y-6">
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
              className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
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
            <h3>Network Traffic Analysis</h3>
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
          <h3 className="mb-4">AI Security Insights</h3>
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
    </div>
  );
}
