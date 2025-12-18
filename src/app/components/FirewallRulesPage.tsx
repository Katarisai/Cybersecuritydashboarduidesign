import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Lightbulb, Trash2, Plus } from 'lucide-react';

interface FirewallRule {
  id: string;
  source: string;
  destination: string;
  port: string;
  action: string;
  status: string;
  recommendation: string | null;
}

const initialRules: FirewallRule[] = [
  { id: 'FW-001', source: '192.168.1.0/24', destination: '10.0.0.5', port: '22', action: 'ALLOW', status: 'active', recommendation: null },
  { id: 'FW-002', source: 'ANY', destination: '10.0.0.8', port: '443', action: 'ALLOW', status: 'active', recommendation: null },
  { id: 'FW-003', source: '192.168.50.0/24', destination: '10.0.0.12', port: '3389', action: 'DENY', status: 'active', recommendation: null },
  { id: 'FW-004', source: '172.16.0.0/16', destination: 'ANY', port: '80,443', action: 'ALLOW', status: 'active', recommendation: 'redundant' },
  { id: 'FW-005', source: 'ANY', destination: '10.0.0.20', port: '445', action: 'DENY', status: 'active', recommendation: null },
  { id: 'FW-006', source: '172.16.0.0/16', destination: 'ANY', port: '443', action: 'ALLOW', status: 'active', recommendation: 'redundant' },
  { id: 'FW-007', source: '10.10.10.0/24', destination: 'ANY', port: '53', action: 'ALLOW', status: 'active', recommendation: null },
  { id: 'FW-008', source: 'ANY', destination: '10.0.0.99', port: '*', action: 'DENY', status: 'inactive', recommendation: 'risky' },
];

export function FirewallRulesPage() {
  const [rules, setRules] = useState<FirewallRule[]>(initialRules);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);

  const handleToggleStatus = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
        : rule
    ));
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const handleApplyOptimization = (type: string) => {
    if (type === 'consolidate') {
      // Remove redundant rules
      setRules(prev => prev.filter(rule => rule.recommendation !== 'redundant'));
      alert('Redundant rules have been consolidated!');
    }
  };

  const optimizationSuggestions = [
    {
      title: 'Consolidate redundant HTTPS rules',
      description: 'Rules FW-004 and FW-006 have overlapping permissions. Consider merging them.',
      impact: 'Reduces rule count by 1, improves processing speed',
      confidence: '94%',
      type: 'consolidate',
    },
    {
      title: 'Review overly permissive rule',
      description: 'Rule FW-008 blocks all traffic to sensitive server - verify if still needed',
      impact: 'Potential security improvement',
      confidence: '87%',
      type: 'review',
    },
  ];

  const redundantCount = rules.filter(r => r.recommendation === 'redundant').length;
  const inactiveCount = rules.filter(r => r.status === 'inactive').length;

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main rules table */}
      <div className="col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Firewall Rules</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage and optimize pfSense firewall rules</p>
          </div>
          <button 
            onClick={() => setShowAddRule(!showAddRule)}
            className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        </div>

        {showAddRule && (
          <div
            className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur-sm"
            style={{
              background: 'rgba(20, 24, 40, 0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h3 className="mb-4">Add New Firewall Rule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Source</label>
                <input
                  type="text"
                  placeholder="192.168.1.0/24"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Destination</label>
                <input
                  type="text"
                  placeholder="10.0.0.5"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Port</label>
                <input
                  type="text"
                  placeholder="80,443"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Action</label>
                <select className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="ALLOW">ALLOW</option>
                  <option value="DENY">DENY</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
                Create Rule
              </button>
              <button 
                onClick={() => setShowAddRule(false)}
                className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div
          className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
          style={{
            background: 'rgba(20, 24, 40, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Rule ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Port
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((rule) => {
                  const actionColors = {
                    ALLOW: 'bg-success/10 text-success',
                    DENY: 'bg-destructive/10 text-destructive',
                  };

                  return (
                    <tr 
                      key={rule.id}
                      onClick={() => setSelectedRule(rule.id)}
                      className={`hover:bg-muted/10 transition-colors cursor-pointer ${
                        rule.recommendation ? 'bg-[#fbbf24]/5' : ''
                      } ${selectedRule === rule.id ? 'bg-primary/5' : ''}`}
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-mono">
                        {rule.id}
                        {rule.recommendation && (
                          <span className="ml-2">
                            <AlertTriangle className="h-3 w-3 inline text-[#fbbf24]" />
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-mono text-muted-foreground">
                        {rule.source}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-mono text-muted-foreground">
                        {rule.destination}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-mono">
                        {rule.port}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${actionColors[rule.action as keyof typeof actionColors]}`}>
                          {rule.action}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(rule.id);
                          }}
                          className="flex items-center gap-1"
                        >
                          {rule.status === 'active' ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-success" />
                              <span className="text-xs text-success">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete rule ${rule.id}?`)) {
                              handleDeleteRule(rule.id);
                            }
                          }}
                          className="rounded p-1 hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Optimization Panel */}
      <div className="space-y-6">
        <div>
          <h3>AI Optimization</h3>
          <p className="text-sm text-muted-foreground mt-1">Suggested improvements</p>
        </div>

        <div className="space-y-4">
          {optimizationSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-card/50 p-4 backdrop-blur-sm"
              style={{
                background: 'rgba(20, 24, 40, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{suggestion.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{suggestion.description}</p>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Impact:</span>
                      <span className="text-xs">{suggestion.impact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <span className="text-xs text-primary">{suggestion.confidence}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => handleApplyOptimization(suggestion.type)}
                      className="flex-1 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      Apply
                    </button>
                    <button className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick stats */}
        <div
          className="rounded-lg border border-border bg-card/50 p-4 backdrop-blur-sm"
          style={{
            background: 'rgba(20, 24, 40, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h4 className="text-sm font-medium mb-3">Optimization Stats</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total rules</span>
              <span className="font-medium">{rules.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Redundant rules</span>
              <span className="font-medium text-[#fbbf24]">{redundantCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Inactive rules</span>
              <span className="font-medium">{inactiveCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Potential savings</span>
              <span className="font-medium text-success">{redundantCount} rules</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
