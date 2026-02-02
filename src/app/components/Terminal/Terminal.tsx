import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTerminalSession } from './TerminalSessionManager';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
    id: string;
    type: 'powershell' | 'cmd' | 'bash';
    onData?: (data: string) => void;
    isMaximized?: boolean;
    onClose?: () => void;
}

export function Terminal({ id, type, onData, onClose }: TerminalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const initializedRef = useRef(false);

    const { createSession, getSession, sendInput, subscribeToOutput, closeSession } = useTerminalSession();

    // Handle terminal close (exit command or X button)
    const handleClose = useCallback(() => {
        closeSession(id);
        onClose?.();
    }, [id, closeSession, onClose]);

    useEffect(() => {
        if (!containerRef.current) return;

        // Get or create session FIRST
        let session = getSession(id);
        const isNewSession = !session;
        if (!session) {
            session = createSession(id, type);
        }

        // Subscribe to output EARLY (before xterm setup)
        // This ensures we don't miss any data from the backend
        const outputCallback = (data: string) => {
            if (xtermRef.current) {
                xtermRef.current.write(data);
                onData?.(data);
            }
        };
        const unsubscribe = subscribeToOutput(id, outputCallback);

        // Only initialize xterm once
        if (!xtermRef.current) {
            const term = new XTerm({
                cursorBlink: true,
                fontFamily: '"Cascadia Code", "Fira Code", monospace',
                fontSize: 14,
                allowProposedApi: true,
                theme: {
                    background: '#0c0c0c',
                    foreground: '#cccccc',
                    cursor: '#ffffff',
                    cursorAccent: '#000000',
                    selectionBackground: '#3d3d3d',
                },
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.loadAddon(new WebLinksAddon());
            fitAddonRef.current = fitAddon;

            term.open(containerRef.current);
            xtermRef.current = term;

            // For persistent sessions, replay buffer immediately
            // For new sessions, show connecting message and set up delayed replay
            if (session.buffer.length > 0) {
                term.write(session.buffer.join(''));
            } else if (isNewSession) {
                term.writeln('\x1b[32m[SYSTEM] Connecting to backend...\x1b[0m');
            } else {
                term.writeln('\x1b[32m[SYSTEM] Terminal session started\x1b[0m');
            }

            // For new sessions, check for buffered data after a short delay
            // (in case data arrived between session creation and xterm setup)
            if (isNewSession) {
                setTimeout(() => {
                    if (session && session.buffer.length > 0 && xtermRef.current) {
                        // Clear the "connecting" message and show real output
                        xtermRef.current.clear();
                        xtermRef.current.write(session.buffer.join(''));
                    }
                }, 500);
            }

            // Fit after initial render and focus
            setTimeout(() => {
                try {
                    fitAddon.fit();
                    // Focus the terminal so it can receive input
                    term.focus();
                } catch (e) {
                    console.error('Initial fit error:', e);
                }
            }, 100);

            // Handle user input
            term.onData((input) => {
                sendInput(id, input);

                // Check for exit command
                if (input === 'exit\r' || input === 'exit\n') {
                    // Will be handled by backend closing the connection
                }
            });

            // Setup resize observer
            resizeObserverRef.current = new ResizeObserver(() => {
                requestAnimationFrame(() => {
                    try {
                        fitAddonRef.current?.fit();
                    } catch (e) {
                        // Ignore resize errors
                    }
                });
            });
            resizeObserverRef.current.observe(containerRef.current);

            initializedRef.current = true;
        }

        // Cleanup ONLY the subscription, NOT the terminal or session
        return () => {
            unsubscribe();
        };
    }, [id, type, createSession, getSession, sendInput, subscribeToOutput, onData]);

    // Cleanup xterm on unmount (but keep session alive)
    useEffect(() => {
        return () => {
            resizeObserverRef.current?.disconnect();
            // Don't dispose xterm here - we might be just switching tabs
            // The xterm instance will be recreated when coming back
            if (xtermRef.current) {
                xtermRef.current.dispose();
                xtermRef.current = null;
            }
            initializedRef.current = false;
        };
    }, []);

    // Focus the terminal when clicked
    const handleClick = useCallback(() => {
        if (xtermRef.current) {
            xtermRef.current.focus();
        }
    }, []);

    return (
        <div
            className="h-full w-full bg-[#0c0c0c] overflow-hidden relative"
            onClick={handleClick}
        >
            <div ref={containerRef} className="h-full w-full" />
        </div>
    );
}

// Export a version with close button
export function TerminalWithControls({
    id,
    type,
    title,
    onData,
    onClose,
    isMaximized
}: TerminalProps & { title?: string }) {
    return (
        <div className="h-full w-full flex flex-col bg-[#1e1e1e] rounded-lg overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#323232] border-b border-[#404040]">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <button
                            onClick={onClose}
                            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                            title="Close terminal"
                        />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm text-gray-400 ml-2">
                        {title || `${type} - ${id}`}
                    </span>
                </div>
                <div className="text-xs text-gray-500">
                    {isMaximized ? 'Maximized' : 'Normal'}
                </div>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 min-h-0">
                <Terminal id={id} type={type} onData={onData} onClose={onClose} />
            </div>
        </div>
    );
}