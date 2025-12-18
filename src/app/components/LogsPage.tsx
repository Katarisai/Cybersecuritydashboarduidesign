import { useState, useEffect } from 'react';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';

interface Log {
  timestamp: string;
  sourceIP: string;
  destination: string;
  protocol: string;
  action: string;
  severity: string;
}

const generateRandomLog = (): Log => {
  const sourceIPs = [
    '192.168.1.45', '172.16.0.23', '10.10.10.100', '192.168.50.12',
    '198.51.100.45', '203.0.113.22', '172.16.8.90', '10.5.3.15'
  ];
  const destinations = [
    '10.0.0.5:22', '10.0.0.8:443', '8.8.8.8:53', '10.0.0.12:3389',
    '10.0.0.8:80', '10.0.0.20:445', '1.1.1.1:53', '10.0.0.15:8080'
  ];
  const protocols = ['SSH', 'HTTPS', 'HTTP', 'DNS', 'RDP', 'SMB', 'FTP'];
  const actions = ['ALLOWED', 'BLOCKED'];
  const severities = ['low', 'medium', 'high'];

  const action = Math.random() > 0.7 ? 'BLOCKED' : 'ALLOWED';
  const severity = action === 'BLOCKED' 
    ? (Math.random() > 0.5 ? 'high' : 'medium')
    : 'low';

  return {
    timestamp: new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }),
    sourceIP: sourceIPs[Math.floor(Math.random() * sourceIPs.length)],
    destination: destinations[Math.floor(Math.random() * destinations.length)],
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    action,
    severity,
  };
};

export function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('hour');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Initialize with some logs
  useEffect(() => {
    const initialLogs = Array.from({ length: 15 }, () => generateRandomLog());
    setLogs(initialLogs);
  }, []);

  // Real-time log generation
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const newLog = generateRandomLog();
      setLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
      setLastUpdate(new Date());
    }, 2000); // New log every 2 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.sourceIP.includes(searchQuery) ||
      log.destination.includes(searchQuery) ||
      log.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Source IP', 'Destination', 'Protocol', 'Action', 'Severity'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.sourceIP,
        log.destination,
        log.protocol,
        log.action,
        log.severity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firewall-logs-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Logs & Big Data Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time firewall log stream</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
              autoRefresh 
                ? 'border-primary bg-primary/10 text-primary' 
                : 'border-border bg-card hover:bg-muted'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span className="text-sm">{autoRefresh ? 'Live' : 'Paused'}</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by IP, protocol, or action..."
              className="w-full rounded-lg border border-border bg-input-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        <select 
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="hour">Last Hour</option>
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* Logs table */}
      <div
        className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
        style={{
          background: 'rgba(20, 24, 40, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="border-b border-border bg-muted/20 backdrop-blur-sm">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Source IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Protocol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Severity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No logs match your filters
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const severityColors = {
                    high: 'bg-destructive/10 text-destructive border-destructive/30',
                    medium: 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30',
                    low: 'bg-success/10 text-success border-success/30',
                  };

                  const actionColors = {
                    BLOCKED: 'bg-destructive/10 text-destructive',
                    ALLOWED: 'bg-success/10 text-success',
                  };

                  return (
                    <tr key={`${log.timestamp}-${index}`} className="hover:bg-muted/10 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                        {log.timestamp}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono">
                        {log.sourceIP}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono">
                        {log.destination}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className="rounded border border-border bg-muted/20 px-2 py-1 text-xs">
                          {log.protocol}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${actionColors[log.action as keyof typeof actionColors]}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`rounded border px-2 py-1 text-xs font-medium uppercase ${severityColors[log.severity as keyof typeof severityColors]}`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing {filteredLogs.length} of {logs.length} total logs</p>
        <p>Updated {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)} seconds ago</p>
      </div>
    </div>
  );
}
