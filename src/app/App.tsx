import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './components/DashboardPage';
import { LogsPage } from './components/LogsPage';
import { FirewallRulesPage } from './components/FirewallRulesPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { AIInsightsPage } from './components/AIInsightsPage';
import { SettingsPage } from './components/SettingsPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState({ username: '', role: '' });

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('firewallai_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setIsAuthenticated(true);
      setCurrentUser(session);
    }
  }, []);

  const handleLogin = (username: string, password: string) => {
    // Demo authentication - in production, this would be an API call
    if (username === 'admin' && password === 'firewall123') {
      const user = { username, role: 'Network Ops' };
      setIsAuthenticated(true);
      setCurrentUser(user);
      setLoginError('');
      // Save session
      localStorage.setItem('firewallai_session', JSON.stringify(user));
    } else {
      setLoginError('Invalid username or password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser({ username: '', role: '' });
    localStorage.removeItem('firewallai_session');
    setActiveTab('dashboard');
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'logs':
        return <LogsPage />;
      case 'firewall':
        return <FirewallRulesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'ai-insights':
        return <AIInsightsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen relative" style={{ fontFamily: 'var(--font-family)', background: 'var(--background)' }}>
      {/* Background grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <Header currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="ml-64 mt-16 p-8 relative z-10">
        <div className="mx-auto max-w-[1440px]">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
