import { Bell, User, Shield, LogOut } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  currentUser: { username: string; role: string };
  onLogout: () => void;
}

export function Header({ currentUser, onLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="fixed left-64 right-0 top-0 z-10 h-16 border-b border-border bg-card/50 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-8">
        {/* Title */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Modern Firewall Architectures
          </h1>
          <p className="text-xs text-muted-foreground">
            Big Data, Logging, and Open-Source Innovation
          </p>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Status badge */}
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-1.5">
            <Shield className="h-4 w-4 text-success" />
            <span className="text-sm text-success">Active Protection</span>
          </div>

          {/* Notifications */}
          <button className="relative rounded-lg p-2 hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
            </span>
          </button>

          {/* User profile */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 hover:bg-muted transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{currentUser.username}</div>
                <div className="text-xs text-muted-foreground">{currentUser.role}</div>
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg"
                style={{
                  background: 'rgba(20, 24, 40, 0.95)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}