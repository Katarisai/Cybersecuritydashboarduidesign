/**
 * Common type definitions for FirewallAI Dashboard
 */

// User types
export interface User {
    username: string;
    role: string;
    email?: string;
    avatar?: string;
}

// Terminal types
export interface TerminalSession {
    id: string;
    type: 'powershell' | 'cmd' | 'bash';
    isConnected: boolean;
    createdAt: Date;
}

// Firewall rule types
export interface FirewallRule {
    id: string;
    type: 'ip' | 'domain' | 'port';
    action: 'block' | 'allow';
    target: string;
    description?: string;
    createdAt: Date;
    enabled: boolean;
}

// System stats types
export interface SystemStats {
    cpu: number;
    memory: number;
    disk: number;
    network: {
        rx: number;
        tx: number;
    };
    uptime: number;
}

// Log entry types
export interface LogEntry {
    id: string;
    timestamp: Date;
    level: 'info' | 'warning' | 'error' | 'critical';
    source: string;
    message: string;
    details?: Record<string, unknown>;
}

// Network traffic types
export interface NetworkTraffic {
    timestamp: Date;
    sourceIp: string;
    destIp: string;
    port: number;
    protocol: 'tcp' | 'udp' | 'icmp';
    bytes: number;
    action: 'allow' | 'block';
}

// Dashboard widget types
export interface DashboardWidget {
    id: string;
    type: 'chart' | 'stat' | 'table' | 'alert';
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: Record<string, unknown>;
}

// API response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Grafana config types
export interface GrafanaConfig {
    url: string;
    dashboardId: string;
    orgId: string;
    theme: 'dark' | 'light';
    refreshInterval: number;
    kioskMode: boolean;
}

// AI rule generation types
export interface AIRuleRequest {
    prompt: string;
    context?: string;
}

export interface AIRuleResponse {
    success: boolean;
    rule?: {
        type: 'ip' | 'domain';
        target: string;
        action?: 'block' | 'allow';
    };
    error?: string;
}
