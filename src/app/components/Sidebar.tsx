import { LayoutDashboard, FileText, Shield, BarChart3, Brain, Settings, Terminal, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Security overview & blocked domains'
  },
  {
    id: 'terminal',
    label: 'Terminal Hub',
    icon: Terminal,
    description: 'PowerShell, CMD & secure browser'
  },
  {
    id: 'logs',
    label: 'Logs & Monitoring',
    icon: FileText,
    description: 'Real-time firewall log stream'
  },
  {
    id: 'firewall',
    label: 'Firewall Rules',
    icon: Shield,
    description: 'Manage pfSense firewall rules'
  },
  {
    id: 'grafana',
    label: 'Grafana',
    icon: Activity,
    description: 'Embedded monitoring dashboards'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Traffic trends & statistics'
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    icon: Brain,
    description: 'ML-powered threat detection'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Configure connections & AI'
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar z-50 shadow-xl"
      style={{ background: 'var(--sidebar, #0B1120)' }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">FirewallAI</div>
              <div className="text-xs text-muted-foreground">pfSense Integration</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
                title={item.description}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-primary"
                    style={{ boxShadow: '0 0 10px var(--primary)' }}
                  />
                )}
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium block">{item.label}</span>
                  {isActive && (
                    <span className="text-xs text-muted-foreground block mt-0.5 truncate">
                      {item.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Version & Status */}
        <div className="border-t border-border p-4 space-y-3">
          {/* System Status */}
          <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 px-3 py-2.5 border border-emerald-500/20">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-500">System Active</div>
              <div className="text-xs text-muted-foreground">pfSense Connected</div>
            </div>
          </div>

          {/* Version Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">FirewallAI Dashboard v1.0</p>
            <p className="text-xs text-muted-foreground/50">Built for pfSense 2.7+</p>
          </div>
        </div>
      </div>
    </aside>
  );
}