import { Brain, Shield, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const threatIntelligence = [
  {
    title: 'Brute Force Attack Pattern',
    risk: 'High',
    count: 12,
    description: 'Multiple failed authentication attempts detected from 3 IP addresses',
    ips: ['192.168.1.45', '10.5.3.22', '172.16.8.90'],
  },
  {
    title: 'Port Scanning Activity',
    risk: 'Medium',
    count: 5,
    description: 'Sequential port probing detected from external network',
    ips: ['203.0.113.45'],
  },
  {
    title: 'Unusual Traffic Patterns',
    risk: 'Low',
    count: 8,
    description: 'Non-standard traffic volumes during off-hours',
    ips: ['192.168.100.15', '192.168.100.23'],
  },
];

const anomalies = [
  {
    type: 'Policy Drift',
    zone: 'DMZ',
    severity: 'medium',
    description: 'Firewall configuration has diverged from approved baseline',
    deviation: '12%',
    detected: '2 hours ago',
  },
  {
    type: 'Traffic Anomaly',
    zone: 'Internal',
    severity: 'low',
    description: 'Unexpected increase in ICMP traffic',
    deviation: '34%',
    detected: '45 minutes ago',
  },
];

const explainability = [
  {
    rule: 'FW-004',
    flagged: 'Redundant Rule',
    reason: 'Rule FW-004 and FW-006 both allow HTTPS traffic from the same source subnet. Rule FW-006 is more specific and makes FW-004 redundant.',
    recommendation: 'Consider removing FW-004 or merging the rules to reduce processing overhead.',
    confidence: 94,
  },
  {
    rule: 'Traffic Pattern',
    flagged: 'Brute Force Attempt',
    reason: 'IP 192.168.1.45 attempted SSH authentication 47 times in 5 minutes with varying credentials, matching known brute-force patterns.',
    recommendation: 'Implement rate limiting or block the source IP temporarily.',
    confidence: 98,
  },
];

export function AIInsightsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2>AI-Powered Security Insights</h2>
        <p className="text-sm text-muted-foreground mt-1">Machine learning analysis and threat intelligence</p>
      </div>

      {/* Threat Intelligence Cards */}
      <div>
        <h3 className="mb-4">Threat Intelligence Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          {threatIntelligence.map((threat, index) => {
            const riskColors = {
              High: 'border-destructive/30 bg-destructive/5',
              Medium: 'border-[#fbbf24]/30 bg-[#fbbf24]/5',
              Low: 'border-primary/30 bg-primary/5',
            };

            const riskBadgeColors = {
              High: 'bg-destructive/10 text-destructive border-destructive/30',
              Medium: 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30',
              Low: 'bg-primary/10 text-primary border-primary/30',
            };

            return (
              <div
                key={index}
                className={`rounded-lg border p-5 backdrop-blur-sm ${riskColors[threat.risk as keyof typeof riskColors]}`}
                style={{
                  background: 'rgba(20, 24, 40, 0.5)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{threat.title}</h4>
                    <p className="mt-2 text-3xl font-semibold">{threat.count}</p>
                    <span className={`mt-2 inline-block rounded border px-2 py-0.5 text-xs font-medium ${riskBadgeColors[threat.risk as keyof typeof riskBadgeColors]}`}>
                      {threat.risk} Risk
                    </span>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{threat.description}</p>
                <div className="mt-3 space-y-1">
                  {threat.ips.map((ip, idx) => (
                    <div key={idx} className="text-xs font-mono text-muted-foreground">
                      • {ip}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomaly Detection */}
      <div>
        <h3 className="mb-4">Anomaly Detection Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          {anomalies.map((anomaly, index) => {
            const severityColors = {
              high: 'border-destructive/30 bg-destructive/5',
              medium: 'border-[#fbbf24]/30 bg-[#fbbf24]/5',
              low: 'border-primary/30 bg-primary/5',
            };

            return (
              <div
                key={index}
                className={`rounded-lg border p-5 backdrop-blur-sm ${severityColors[anomaly.severity as keyof typeof severityColors]}`}
                style={{
                  background: 'rgba(20, 24, 40, 0.5)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{anomaly.type}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Zone: {anomaly.zone}</p>
                      </div>
                      <span className="text-lg font-semibold text-destructive">{anomaly.deviation}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{anomaly.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Detected {anomaly.detected}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Explainability */}
      <div>
        <h3 className="mb-4">AI Decision Explainability</h3>
        <div className="space-y-4">
          {explainability.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
              style={{
                background: 'rgba(20, 24, 40, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{item.rule}</h4>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm text-primary">{item.flagged}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Why was this flagged?</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Recommendation</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.recommendation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">AI Confidence</span>
                        <span className="text-xs font-medium text-primary">{item.confidence}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                    </div>
                    <button className="rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
                      Apply Fix
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
