import { useState, useEffect, useRef } from 'react';
import { Globe, Shield, LayoutGrid, Terminal as TerminalIcon, Cpu, Command, Activity } from 'lucide-react';
import { TerminalWindow } from './TerminalWindow';
import { WebBrowser } from './WebBrowser';
import { io } from 'socket.io-client';
import { Card, CardContent } from '../ui/card';
import { useTerminalSession, TerminalUIState } from './TerminalSessionManager';
import { env } from '@/lib/env';

export function TerminalPage() {
  // Use global terminal state from session manager
  const {
    openTerminals,
    addTerminal,
    removeTerminal,
    updateTerminal,
    setAllTerminals
  } = useTerminalSession();

  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isBrowserExpanded, setIsBrowserExpanded] = useState(false);
  const [stats, setStats] = useState({ cpu: '0', ip: 'Scanning...' });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- SMART GRID PLACEMENT (2 Per Row, No Overlap) ---
  const createTerminal = (type: 'powershell' | 'cmd' | 'bash') => {
    if (!containerRef.current) return;

    // 1. Calculate Sizes based on Container
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    const GAP = 20;
    const COLS = 2;
    const itemW = (containerW - (GAP * 3)) / COLS;
    const itemH = (containerH - (GAP * 3)) / 2;

    // 2. Find First Empty Slot
    let slot = 0;
    let foundSlot = false;
    let startX = 0;
    let startY = 0;

    while (!foundSlot) {
      const row = Math.floor(slot / COLS);
      const col = slot % COLS;

      const proposedX = GAP + (col * (itemW + GAP));
      const proposedY = GAP + (row * (itemH + GAP));

      // Check collision with existing terminals
      const isOccupied = openTerminals.some(t => {
        const dx = Math.abs(t.x - proposedX);
        const dy = Math.abs(t.y - proposedY);
        return dx < 50 && dy < 50;
      });

      if (!isOccupied) {
        startX = proposedX;
        startY = proposedY;
        foundSlot = true;
      } else {
        slot++;
      }
    }

    const newTerminal: TerminalUIState = {
      id: `term-${Date.now()}`,
      type,
      isMaximized: false,
      x: startX,
      y: startY,
      width: `${itemW}px`,
      height: `${itemH}px`
    };

    // Add to global state
    addTerminal(newTerminal);
  };

  const closeTerminal = (id: string) => {
    removeTerminal(id);
  };

  const toggleMaximize = (id: string) => {
    const terminal = openTerminals.find(t => t.id === id);
    if (terminal) {
      updateTerminal(id, { isMaximized: !terminal.isMaximized });
    }
  };

  // --- FORCE GRID RE-ARRANGE ---
  const arrangeGrid = () => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const GAP = 20;
    const COLS = 2;
    const itemW = (containerW - (GAP * 3)) / COLS;
    const itemH = (containerH - (GAP * 3)) / 2;

    const newLayout = openTerminals.map((t, index) => {
      const row = Math.floor(index / COLS);
      const col = index % COLS;
      return {
        ...t,
        isMaximized: false,
        x: GAP + (col * (itemW + GAP)),
        y: GAP + (row * (itemH + GAP)),
        width: `${itemW}px`,
        height: `${itemH}px`
      };
    });
    setAllTerminals(newLayout);
  };

  useEffect(() => {
    const socket = io(env.backendUrl);
    socket.on('system-stats', (data) => setStats(data));
    return () => { socket.disconnect(); };
  }, []);

  const glassStyle = {
    background: 'rgba(20, 24, 40, 0.5)',
    backdropFilter: 'blur(10px)',
  };

  return (
    <div className="space-y-6 h-[calc(100vh-2rem)] flex flex-col relative overflow-hidden">

      {/* 1. Header Section - NOW WITH 4 COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">

        {/* Status Card */}
        <div className="rounded-lg border border-border bg-card/50 p-6 transition-all" style={glassStyle}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Security Hub</h3>
              <p className="text-sm text-muted-foreground">Encrypted</p>
            </div>
          </div>
        </div>

        {/* IP Address Card */}
        <div className="rounded-lg border border-border bg-card/50 p-6 transition-all" style={glassStyle}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Network Node</h3>
              <p className="text-sm text-muted-foreground">{stats.ip}</p>
            </div>
          </div>
        </div>

        {/* CPU Load Card */}
        <div className="rounded-lg border border-border bg-card/50 p-6 transition-all" style={glassStyle}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium">System Load</h3>
              <p className="text-sm text-muted-foreground">{stats.cpu}% Usage</p>
            </div>
          </div>
        </div>

        {/* Active Sessions Card */}
        <div className="rounded-lg border border-border bg-card/50 p-6 transition-all" style={glassStyle}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Active Sessions</h3>
              <p className="text-sm text-muted-foreground">{openTerminals.length} Running</p>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Launcher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <LauncherItem
          title="PowerShell"
          desc="Local Admin Shell"
          icon={<TerminalIcon className="h-6 w-6 text-blue-400" />}
          onClick={() => createTerminal('powershell')}
        />
        <LauncherItem
          title="Command Prompt"
          desc="Legacy CMD Interface"
          icon={<Command className="h-6 w-6 text-gray-400" />}
          onClick={() => createTerminal('cmd')}
        />
        <LauncherItem
          title="Secure Browser"
          desc="Sandboxed Web Access"
          icon={<Globe className="h-6 w-6 text-purple-400" />}
          onClick={() => setIsBrowserOpen(true)}
        />
        <LauncherItem
          title="Grid Layout"
          desc="Auto-Arrange Windows"
          icon={<LayoutGrid className="h-6 w-6 text-orange-400" />}
          onClick={arrangeGrid}
        />
      </div>

      {/* 3. Window Area (Scrollable) */}
      <div ref={containerRef} className="flex-1 relative rounded-xl border border-border/50 bg-black/20 overflow-y-auto overflow-x-hidden">
        {openTerminals.length === 0 && !isBrowserOpen && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-mono text-sm pointer-events-none">
            Select a tool above to begin...
          </div>
        )}

        {openTerminals.map((term) => (
          <div
            key={term.id}
            className={term.isMaximized ? "absolute inset-0 z-50 transition-all duration-300" : "absolute z-30 transition-all duration-300"}
            style={!term.isMaximized ? {
              top: `${term.y}px`,
              left: `${term.x}px`,
              width: term.width,
              height: term.height,
            } : {}}
          >
            <TerminalWindow
              id={term.id}
              type={term.type}
              isMaximized={term.isMaximized}
              onClose={() => closeTerminal(term.id)}
              onToggleMaximize={() => toggleMaximize(term.id)}
            />
          </div>
        ))}

        {isBrowserOpen && (
          <WebBrowser
            isExpanded={isBrowserExpanded}
            onToggleExpand={() => setIsBrowserExpanded(!isBrowserExpanded)}
            onClose={() => setIsBrowserOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function LauncherItem({ title, desc, icon, onClick }: { title: string, desc: string, icon: any, onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:bg-white/5 transition-all hover:border-primary/50 group bg-card/50 backdrop-blur-sm border-border"
      onClick={onClick}
    >
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-3 rounded-md bg-background/50 border border-border group-hover:border-primary/30 transition-colors">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}