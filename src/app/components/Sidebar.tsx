import { LayoutDashboard, FileText, Shield, BarChart3, Brain, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'logs', label: 'Logs & Monitoring', icon: FileText },
  { id: 'firewall', label: 'Firewall Rules', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ai-insights', label: 'AI Insights', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside 
      className="fixed left-0 top-0 h-screen w-64 border-r border-sidebar-border"
      style={{ background: 'var(--sidebar)' }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-sidebar-foreground">FirewallAI</div>
              <div className="text-xs text-muted-foreground">pfSense Integration</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
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
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                {isActive && (
                  <div 
                    className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-primary"
                    style={{ boxShadow: '0 0 10px var(--primary)' }}
                  />
                )}
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground'}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-success/10 px-3 py-2.5 border border-success/20">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
            </div>
            <div>
              <div className="text-xs font-medium text-success">System Active</div>
              <div className="text-xs text-muted-foreground">pfSense Connected</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
