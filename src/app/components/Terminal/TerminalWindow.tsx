import { X, Maximize2, Minimize2, Terminal as TerminalIcon } from 'lucide-react';
import { Terminal } from './Terminal';
import { motion } from 'motion/react';

interface TerminalWindowProps {
  id: string;
  type: 'powershell' | 'cmd' | 'bash';
  onClose: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

export function TerminalWindow({ id, type, onClose, isMaximized, onToggleMaximize }: TerminalWindowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        // Animate the size changes specifically
        width: isMaximized ? '100%' : '100%',
        height: isMaximized ? '100%' : '300px'
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        flex flex-col bg-black/90 backdrop-blur-md border border-gray-800 rounded-lg overflow-hidden shadow-2xl
        ${isMaximized ? 'absolute inset-0 z-50 rounded-none border-0' : 'relative h-[300px] w-full'}
      `}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-gray-900/95 border-b border-gray-800 shrink-0 select-none"
        onDoubleClick={onToggleMaximize}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className={`w-3.5 h-3.5 ${type === 'powershell' ? 'text-blue-400' :
            type === 'bash' ? 'text-green-400' : 'text-gray-400'
            }`} />
          <span className="text-xs font-mono text-gray-400 opacity-80 uppercase tracking-wider">
            {type} • {id.split('-')[1]}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleMaximize}
            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300 transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Content Area */}
      <div className="flex-1 bg-black/95 p-1 overflow-hidden relative">
        <Terminal id={id} type={type} isMaximized={isMaximized} onClose={onClose} />
      </div>
    </motion.div>
  );
}