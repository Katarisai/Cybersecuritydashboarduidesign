// import { useState, useEffect } from 'react';
// import { LoginPage } from './components/LoginPage';
// import { Sidebar } from './components/Sidebar';
// import { Header } from './components/Header';
// import { DashboardPage } from './components/DashboardPage';
// import { LogsPage } from './components/LogsPage';
// import { FirewallRulesPage } from './components/FirewallRulesPage';
// import { AnalyticsPage } from './components/AnalyticsPage';
// import { AIInsightsPage } from './components/AIInsightsPage';
// import { SettingsPage } from './components/SettingsPage';
// import { TerminalPage } from './components/Terminal/TerminalPage';
// export default function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [loginError, setLoginError] = useState('');
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [currentUser, setCurrentUser] = useState({ username: '', role: '' });

//   // Check for existing session on mount
//   useEffect(() => {
//     const savedSession = localStorage.getItem('firewallai_session');
//     if (savedSession) {
//       const session = JSON.parse(savedSession);
//       setIsAuthenticated(true);
//       setCurrentUser(session);
//     }
//   }, []);

//   const handleLogin = (username: string, password: string) => {
//     // Demo authentication - in production, this would be an API call
//     if (username === 'admin' && password === 'firewall123') {
//       const user = { username, role: 'Network Ops' };
//       setIsAuthenticated(true);
//       setCurrentUser(user);
//       setLoginError('');
//       // Save session
//       localStorage.setItem('firewallai_session', JSON.stringify(user));
//     } else {
//       setLoginError('Invalid username or password. Please try again.');
//     }
//   };

//   const handleLogout = () => {
//     setIsAuthenticated(false);
//     setCurrentUser({ username: '', role: '' });
//     localStorage.removeItem('firewallai_session');
//     setActiveTab('dashboard');
//   };

//   const renderPage = () => {
//     switch (activeTab) {
//       case 'dashboard':
//         return <DashboardPage />;
//       case 'terminal': // <--- This ID matches what is in Sidebar.tsx
//         return <TerminalPage />;
//       case 'logs':
//         return <LogsPage />;
//       case 'firewall':
//         return <FirewallRulesPage />;
//       case 'analytics':
//         return <AnalyticsPage />;
//       case 'ai-insights':
//         return <AIInsightsPage />;
//       case 'settings':
//         return <SettingsPage />;
//       default:
//         return <DashboardPage />;
//     }
//   };

//   if (!isAuthenticated) {
//     return <LoginPage onLogin={handleLogin} error={loginError} />;
//   }

//   return (
//     <div className="min-h-screen relative" style={{ fontFamily: 'var(--font-family)', background: 'var(--background)' }}>
//       {/* Background grid pattern */}
//       <div
//         className="fixed inset-0 pointer-events-none opacity-10"
//         style={{
//           backgroundImage: `
//             linear-gradient(rgba(0, 217, 255, 0.05) 1px, transparent 1px),
//             linear-gradient(90deg, rgba(0, 217, 255, 0.05) 1px, transparent 1px)
//           `,
//           backgroundSize: '50px 50px',
//         }}
//       />

//       <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
//       <Header currentUser={currentUser} onLogout={handleLogout} />

//       <main className="ml-64 mt-16 p-8 relative z-10">
//         <div className="mx-auto max-w-[1440px]">
//           {renderPage()}
//         </div>
//       </main>
//     </div>
//   );
// }

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
import { GrafanaPage } from './components/GrafanaPage';
import { TerminalPage } from './components/Terminal/TerminalPage';
import { TerminalSessionProvider } from './components/Terminal/TerminalSessionManager';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState({ username: '', role: '' });

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('firewallai_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setIsAuthenticated(true);
        setCurrentUser(session);
      } catch (e) {
        console.error("Session parse error", e);
      }
    }
  }, []);

  const handleLogin = (username: string, password: string) => {
    // Demo authentication
    if (username === 'admin' && password === 'firewall123') {
      const user = { username, role: 'Network Ops' };
      setIsAuthenticated(true);
      setCurrentUser(user);
      setLoginError('');
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

  // Render non-persistent pages (unmount on tab switch)
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'terminal':
        return <TerminalPage />;
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
      case 'grafana':
        // Grafana is rendered separately for persistence
        return null;
      default:
        return <DashboardPage />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  return (
    <TerminalSessionProvider>
      <div className="min-h-screen relative bg-background font-sans text-foreground overflow-hidden">
        {/* Background Grid Pattern */}
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

        {/* Sidebar (Fixed Left) */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Header (Fixed Top - Offset by Sidebar) */}
        <div className="fixed top-0 left-64 right-0 z-40">
          <Header currentUser={currentUser} onLogout={handleLogout} />
        </div>

        {/* Main Content (Pushed Right & Down) */}
        <main className="ml-64 pt-20 h-screen overflow-y-auto relative z-10 p-8">
          <div className="mx-auto max-w-[1600px] pb-10">
            {/* Persistent Grafana - always mounted, visibility controlled by CSS */}
            <div style={{ display: activeTab === 'grafana' ? 'block' : 'none' }}>
              <GrafanaPage />
            </div>

            {/* Other pages - conditional rendering */}
            {activeTab !== 'grafana' && renderPage()}
          </div>
        </main>
      </div>
    </TerminalSessionProvider>
  );
}
