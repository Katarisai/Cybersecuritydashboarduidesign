/**
 * Environment configuration for FirewallAI Dashboard
 * Uses Vite's import.meta.env for type-safe environment variables
 */

interface EnvConfig {
    backendUrl: string;
    grafanaUrl: string;
    appName: string;
    isDev: boolean;
    isProd: boolean;
}

function getEnvConfig(): EnvConfig {
    return {
        backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://192.168.1.101:3001',
        grafanaUrl: import.meta.env.VITE_GRAFANA_URL || 'http://192.168.1.101:3000',
        appName: import.meta.env.VITE_APP_NAME || 'FirewallAI Dashboard',
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
    };
}

export const env = getEnvConfig();


