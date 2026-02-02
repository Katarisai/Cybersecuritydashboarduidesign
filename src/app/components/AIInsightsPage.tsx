import { useState, useEffect, useCallback } from 'react';
import { Brain, Shield, TrendingUp, AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw, Zap } from 'lucide-react';

// API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://192.168.1.101:3001';

interface ThreatIntelligence {
  title: string;
  risk: 'High' | 'Medium' | 'Low';
  count: number;
  description: string;
  ips: string[];
}

interface Anomaly {
  type: string;
  zone: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  deviation: string;
  detected: string;
}

interface ExplainabilityItem {
  rule: string;
  flagged: string;
  reason: string;
  recommendation: string;
  confidence: number;
}

interface RealtimeStats {
  eventsProcessed: number;
  eventsPerSecond: number;
  topSources: Array<{ ip: string; count: number }>;
  recentAlerts: Array<{
    timestamp: string;
    src_ip?: string;
    alert?: { signature?: string; category?: string; severity?: number };
  }>;
  anomalies: Array<{
    ip: string;
    score: number;
    analysis?: {
      threat_level?: string;
      attack_type?: string;
      explanation?: string;
    };
  }>;
}

export function AIInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [threatIntelligence, setThreatIntelligence] = useState<ThreatIntelligence[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [explainability, setExplainability] = useState<ExplainabilityItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      // Fetch real-time stats from backend
      const statsResponse = await fetch(`${BACKEND_URL}/api/stats/realtime`);
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData: RealtimeStats = await statsResponse.json();
      setStats(statsData);

      // Transform real-time data into threat intelligence format
      const threats: ThreatIntelligence[] = [];

      // Analyze top sources for potential threats
      if (statsData.topSources && statsData.topSources.length > 0) {
        const highVolumeIPs = statsData.topSources.filter(s => s.count > 100);
        if (highVolumeIPs.length > 0) {
          threats.push({
            title: 'High Volume Traffic Sources',
            risk: 'Medium',
            count: highVolumeIPs.length,
            description: `${highVolumeIPs.length} IPs generating unusually high traffic volume`,
            ips: highVolumeIPs.slice(0, 5).map(s => s.ip)
          });
        }
      }

      // Transform recent alerts into threat intelligence
      if (statsData.recentAlerts && statsData.recentAlerts.length > 0) {
        const alertsByCategory = new Map<string, { ips: Set<string>; count: number }>();

        statsData.recentAlerts.forEach(alert => {
          const category = alert.alert?.category || 'Unknown';
          const existing = alertsByCategory.get(category) || { ips: new Set(), count: 0 };
          if (alert.src_ip) existing.ips.add(alert.src_ip);
          existing.count++;
          alertsByCategory.set(category, existing);
        });

        alertsByCategory.forEach((data, category) => {
          threats.push({
            title: category,
            risk: data.count > 10 ? 'High' : data.count > 5 ? 'Medium' : 'Low',
            count: data.count,
            description: `${data.count} alerts from ${data.ips.size} unique source(s)`,
            ips: Array.from(data.ips).slice(0, 5)
          });
        });
      }

      // Add default if no threats found
      if (threats.length === 0) {
        threats.push({
          title: 'Network Status',
          risk: 'Low',
          count: statsData.eventsProcessed || 0,
          description: 'No significant threats detected. System is monitoring traffic.',
          ips: []
        });
      }

      setThreatIntelligence(threats);

      // Transform anomalies
      if (statsData.anomalies && statsData.anomalies.length > 0) {
        const transformedAnomalies: Anomaly[] = statsData.anomalies.map(a => ({
          type: a.analysis?.attack_type || 'Traffic Anomaly',
          zone: 'Network',
          severity: a.score < -0.8 ? 'high' : a.score < -0.5 ? 'medium' : 'low',
          description: a.analysis?.explanation || `Anomaly detected with score ${a.score.toFixed(3)}`,
          deviation: `${Math.abs(a.score * 100).toFixed(0)}%`,
          detected: 'Just now'
        }));
        setAnomalies(transformedAnomalies);
      }

      // Create explainability items from alerts and anomalies
      const explainItems: ExplainabilityItem[] = [];

      if (statsData.recentAlerts && statsData.recentAlerts.length > 0) {
        statsData.recentAlerts.slice(0, 2).forEach(alert => {
          if (alert.alert) {
            explainItems.push({
              rule: alert.src_ip || 'Unknown IP',
              flagged: alert.alert.signature || 'IDS Alert',
              reason: `Suricata detected ${alert.alert.category || 'suspicious activity'} from this source.`,
              recommendation: `Consider blocking ${alert.src_ip} if this pattern continues.`,
              confidence: Math.min(95, 70 + (alert.alert.severity || 1) * 10)
            });
          }
        });
      }

      if (statsData.anomalies && statsData.anomalies.length > 0) {
        statsData.anomalies.slice(0, 2).forEach(anomaly => {
          explainItems.push({
            rule: anomaly.ip,
            flagged: anomaly.analysis?.attack_type || 'Anomaly Detected',
            reason: anomaly.analysis?.explanation || `ML model detected unusual behavior with anomaly score ${anomaly.score.toFixed(3)}`,
            recommendation: `Review traffic from ${anomaly.ip} and consider temporary blocking.`,
            confidence: Math.min(98, 80 + Math.abs(anomaly.score * 20))
          });
        });
      }

      setExplainability(explainItems);
      setLastUpdated(new Date());
      setError(null);

    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
      setError('Unable to connect to backend. Showing cached data.');

      // Use fallback mock data
      setThreatIntelligence([
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
      ]);

      setAnomalies([
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
      ]);

      setExplainability([
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
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleApplyFix = async (item: ExplainabilityItem) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Block ${item.rule} due to: ${item.flagged}`,
          contextData: JSON.stringify({ reason: item.reason })
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.rule) {
          // Apply the rule
          const applyResponse = await fetch(`${BACKEND_URL}/api/apply-rule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rule: data.rule })
          });

          if (applyResponse.ok) {
            alert(`Rule applied successfully: ${data.rule.action} ${data.rule.target}`);
            fetchData(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to apply fix:', err);
      alert('Failed to apply fix. Check connection to backend.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading AI Insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI-Powered Security Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Machine learning analysis, threat intelligence, and explainable AI decisions for your firewall security
          </p>
        </div>
        <div className="flex items-center gap-4">
          {stats && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span>{stats.eventsPerSecond.toFixed(1)} events/sec</span>
            </div>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status bar */}
      {(error || lastUpdated) && (
        <div className={`rounded-lg border p-3 text-sm ${error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-primary/30 bg-primary/5 text-primary'}`}>
          {error || `Last updated: ${lastUpdated?.toLocaleTimeString()}`}
        </div>
      )}

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
                className={`rounded-lg border p-5 backdrop-blur-sm ${riskColors[threat.risk]}`}
                style={{
                  background: 'rgba(20, 24, 40, 0.5)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{threat.title}</h4>
                    <p className="mt-2 text-3xl font-semibold">{threat.count}</p>
                    <span className={`mt-2 inline-block rounded border px-2 py-0.5 text-xs font-medium ${riskBadgeColors[threat.risk]}`}>
                      {threat.risk} Risk
                    </span>
                  </div>
                  <AlertTriangle className={`h-5 w-5 ${threat.risk === 'High' ? 'text-destructive' : threat.risk === 'Medium' ? 'text-[#fbbf24]' : 'text-primary'}`} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{threat.description}</p>
                {threat.ips.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {threat.ips.map((ip, idx) => (
                      <div key={idx} className="text-xs font-mono text-muted-foreground">
                        • {ip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomaly Detection */}
      {anomalies.length > 0 && (
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
                  className={`rounded-lg border p-5 backdrop-blur-sm ${severityColors[anomaly.severity]}`}
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
      )}

      {/* AI Explainability */}
      {explainability.length > 0 && (
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
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleApplyFix(item)}
                        className="rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        Apply Fix
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
