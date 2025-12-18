import { TrendingUp, TrendingDown, Activity, Shield } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const trafficTrendData = [
  { date: 'Mon', allowed: 45000, blocked: 1200 },
  { date: 'Tue', allowed: 52000, blocked: 1800 },
  { date: 'Wed', allowed: 48000, blocked: 2100 },
  { date: 'Thu', allowed: 61000, blocked: 1500 },
  { date: 'Fri', allowed: 55000, blocked: 2400 },
  { date: 'Sat', allowed: 38000, blocked: 900 },
  { date: 'Sun', allowed: 42000, blocked: 1100 },
];

const protocolData = [
  { name: 'HTTPS', value: 45, color: '#00d9ff' },
  { name: 'HTTP', value: 25, color: '#8b5cf6' },
  { name: 'SSH', value: 15, color: '#10b981' },
  { name: 'DNS', value: 10, color: '#fbbf24' },
  { name: 'Other', value: 5, color: '#ff3b57' },
];

const topBlockedIPs = [
  { ip: '192.168.1.45', attempts: 247, threat: 'Brute Force' },
  { ip: '203.0.113.22', attempts: 156, threat: 'Port Scan' },
  { ip: '172.16.8.90', attempts: 89, threat: 'Brute Force' },
  { ip: '10.5.3.15', attempts: 67, threat: 'DDoS' },
  { ip: '198.51.100.45', attempts: 43, threat: 'Malware C2' },
];

const performanceMetrics = [
  { title: 'Avg Response Time', value: '12ms', change: '-8%', trend: 'down', positive: true },
  { title: 'Throughput', value: '2.8 Gbps', change: '+15%', trend: 'up', positive: true },
  { title: 'Rule Processing', value: '342 rules', change: '-12', trend: 'down', positive: true },
  { title: 'Active Connections', value: '8,432', change: '+5%', trend: 'up', positive: false },
];

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2>Analytics Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Comprehensive firewall and network analytics</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => {
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          const trendColor = metric.positive 
            ? (metric.trend === 'up' ? 'text-success' : 'text-success')
            : (metric.trend === 'up' ? 'text-destructive' : 'text-success');

          return (
            <div
              key={index}
              className="rounded-lg border border-border bg-card/50 p-5 backdrop-blur-sm"
              style={{
                background: 'rgba(20, 24, 40, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
              <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                <span className="text-xs font-medium">{metric.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        {/* Traffic Trends */}
        <div
          className="col-span-2 rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
          style={{
            background: 'rgba(20, 24, 40, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h3 className="mb-4">Traffic Trends (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 217, 255, 0.1)" />
                <XAxis 
                  dataKey="date" 
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
                <Legend />
                <Bar dataKey="allowed" fill="#10b981" name="Allowed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="blocked" fill="#ff3b57" name="Blocked" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Distribution */}
        <div
          className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
          style={{
            background: 'rgba(20, 24, 40, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h3 className="mb-4">Protocol Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f35',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Blocked IPs */}
      <div
        className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
        style={{
          background: 'rgba(20, 24, 40, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <h3 className="mb-4">Top Blocked IP Addresses</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Block Attempts
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Threat Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topBlockedIPs.map((item, index) => (
                <tr key={index} className="hover:bg-muted/10 transition-colors">
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-mono">
                    {item.ip}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-[100px] rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-destructive"
                          style={{ width: `${Math.min((item.attempts / 250) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="font-medium">{item.attempts}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <span className="rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                      {item.threat}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <button className="rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted transition-colors">
                      Blacklist
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
