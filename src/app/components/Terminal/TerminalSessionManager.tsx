import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Terminal UI state (for layout/positioning)
export interface TerminalUIState {
    id: string;
    type: 'powershell' | 'cmd' | 'bash';
    isMaximized: boolean;
    x: number;
    y: number;
    width: string;
    height: string;
}

// Terminal session data structure
interface TerminalSession {
    id: string;
    type: 'powershell' | 'cmd' | 'bash';
    socket: Socket;
    buffer: string[]; // Store output history for reconnection
    isConnected: boolean;
    createdAt: Date;
}

interface TerminalSessionContextType {
    // Session management
    sessions: Map<string, TerminalSession>;
    createSession: (id: string, type: 'powershell' | 'cmd' | 'bash') => TerminalSession;
    getSession: (id: string) => TerminalSession | undefined;
    closeSession: (id: string) => void;
    sendInput: (id: string, input: string) => void;
    subscribeToOutput: (id: string, callback: (data: string) => void) => () => void;

    // UI state management (persistent across tab switches)
    openTerminals: TerminalUIState[];
    addTerminal: (terminal: TerminalUIState) => void;
    removeTerminal: (id: string) => void;
    updateTerminal: (id: string, updates: Partial<TerminalUIState>) => void;
    setAllTerminals: (terminals: TerminalUIState[]) => void;
}

const TerminalSessionContext = createContext<TerminalSessionContextType | null>(null);

import { env } from '@/lib/env';

const BACKEND_URL = env.backendUrl;
const MAX_BUFFER_SIZE = 10000; // Max characters to store in history

export function TerminalSessionProvider({ children }: { children: React.ReactNode }) {
    const sessionsRef = useRef<Map<string, TerminalSession>>(new Map());
    const outputListenersRef = useRef<Map<string, Set<(data: string) => void>>>(new Map());
    // Buffer for pending input (when socket is still connecting)
    const pendingInputRef = useRef<Map<string, string[]>>(new Map());

    // Persistent UI state for terminals
    const [openTerminals, setOpenTerminals] = useState<TerminalUIState[]>([]);
    const [, forceUpdate] = useState(0);

    // Create a new terminal session
    const createSession = useCallback((id: string, type: 'powershell' | 'cmd' | 'bash'): TerminalSession => {
        // Return existing session if it exists and is connected
        const existing = sessionsRef.current.get(id);
        if (existing) {
            return existing;
        }

        console.log(`[SESSION] Creating new session for ${id}`);

        // Create new socket connection
        const socket = io(BACKEND_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        const session: TerminalSession = {
            id,
            type,
            socket,
            buffer: [],
            isConnected: false,
            createdAt: new Date(),
        };

        // Handle connection
        socket.on('connect', () => {
            session.isConnected = true;
            console.log(`[SESSION] Terminal ${id} connected`);

            // Flush any pending input that was queued while connecting
            const pending = pendingInputRef.current.get(id);
            if (pending && pending.length > 0) {
                console.log(`[SESSION] Flushing ${pending.length} pending inputs for ${id}`);
                pending.forEach(input => {
                    socket.emit('terminal:write', input);
                });
                pendingInputRef.current.delete(id);
            }

            forceUpdate(n => n + 1);
        });

        socket.on('disconnect', () => {
            session.isConnected = false;
            forceUpdate(n => n + 1);
            console.log(`[SESSION] Terminal ${id} disconnected`);
        });

        // Handle terminal output - store in buffer and notify listeners
        socket.on('terminal:data', (data: string) => {
            // Add to buffer (for reconnection/replay)
            session.buffer.push(data);

            // Trim buffer if too large
            const totalLength = session.buffer.join('').length;
            if (totalLength > MAX_BUFFER_SIZE) {
                while (session.buffer.length > 0 && session.buffer.join('').length > MAX_BUFFER_SIZE * 0.8) {
                    session.buffer.shift();
                }
            }

            // Notify all listeners
            const listeners = outputListenersRef.current.get(id);
            if (listeners) {
                listeners.forEach(callback => callback(data));
            }
        });

        socket.on('connect_error', (err) => {
            console.error(`[SESSION] Terminal ${id} connection error:`, err.message);
        });

        sessionsRef.current.set(id, session);
        forceUpdate(n => n + 1);

        return session;
    }, []);

    // Get an existing session
    const getSession = useCallback((id: string): TerminalSession | undefined => {
        return sessionsRef.current.get(id);
    }, []);

    // Close and cleanup a session
    const closeSession = useCallback((id: string) => {
        const session = sessionsRef.current.get(id);
        if (session) {
            console.log(`[SESSION] Closing terminal ${id}`);
            session.socket.disconnect();
            sessionsRef.current.delete(id);
            outputListenersRef.current.delete(id);
            forceUpdate(n => n + 1);
        }
    }, []);

    // Send input to a terminal (with buffering for connecting sockets)
    const sendInput = useCallback((id: string, input: string) => {
        const session = sessionsRef.current.get(id);
        if (!session) {
            console.warn(`[SESSION] No session found for ${id}`);
            return;
        }

        if (session.socket.connected) {
            // Socket is connected, send immediately
            session.socket.emit('terminal:write', input);
        } else {
            // Socket is still connecting, queue the input
            console.log(`[SESSION] Socket not connected yet, queuing input for ${id}`);
            if (!pendingInputRef.current.has(id)) {
                pendingInputRef.current.set(id, []);
            }
            pendingInputRef.current.get(id)!.push(input);
        }
    }, []);

    // Subscribe to terminal output
    const subscribeToOutput = useCallback((id: string, callback: (data: string) => void) => {
        if (!outputListenersRef.current.has(id)) {
            outputListenersRef.current.set(id, new Set());
        }
        outputListenersRef.current.get(id)!.add(callback);

        // Return unsubscribe function
        return () => {
            const listeners = outputListenersRef.current.get(id);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }, []);

    // UI State Management
    const addTerminal = useCallback((terminal: TerminalUIState) => {
        setOpenTerminals(prev => {
            // Don't add duplicates
            if (prev.some(t => t.id === terminal.id)) {
                return prev;
            }
            return [...prev, terminal];
        });
    }, []);

    const removeTerminal = useCallback((id: string) => {
        setOpenTerminals(prev => prev.filter(t => t.id !== id));
        // Also close the session
        closeSession(id);
    }, [closeSession]);

    const updateTerminal = useCallback((id: string, updates: Partial<TerminalUIState>) => {
        setOpenTerminals(prev =>
            prev.map(t => t.id === id ? { ...t, ...updates } : t)
        );
    }, []);

    const setAllTerminals = useCallback((terminals: TerminalUIState[]) => {
        setOpenTerminals(terminals);
    }, []);

    // Cleanup all sessions on unmount (page unload)
    useEffect(() => {
        const handleBeforeUnload = () => {
            sessionsRef.current.forEach((session) => {
                session.socket.disconnect();
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const value: TerminalSessionContextType = {
        sessions: sessionsRef.current,
        createSession,
        getSession,
        closeSession,
        sendInput,
        subscribeToOutput,
        // UI state
        openTerminals,
        addTerminal,
        removeTerminal,
        updateTerminal,
        setAllTerminals,
    };

    return (
        <TerminalSessionContext.Provider value={value}>
            {children}
        </TerminalSessionContext.Provider>
    );
}

// Hook to use terminal sessions
export function useTerminalSession() {
    const context = useContext(TerminalSessionContext);
    if (!context) {
        throw new Error('useTerminalSession must be used within TerminalSessionProvider');
    }
    return context;
}
