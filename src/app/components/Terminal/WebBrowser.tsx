// import { useState } from 'react';
// import { X, Maximize2, Minimize2, RefreshCw, Globe, ExternalLink, AlertTriangle } from 'lucide-react';
// import { motion, AnimatePresence } from 'motion/react';

// interface WebBrowserProps {
//   onClose: () => void;
//   isExpanded: boolean;
//   onToggleExpand: () => void;
// }

// export function WebBrowser({ onClose, isExpanded, onToggleExpand }: WebBrowserProps) {
//   const [url, setUrl] = useState('https://www.wikipedia.org/');
//   const [inputUrl, setInputUrl] = useState(url);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isAlertOpen, setIsAlertOpen] = useState(true);

//   const handleLoadUrl = () => {
//     let targetUrl = inputUrl;
//     if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
//       targetUrl = 'https://' + targetUrl;
//     }
//     setUrl(targetUrl);
//     setInputUrl(targetUrl);
//     setIsLoading(true);
//     // Re-show alert when loading a new URL to warn about potential blocking
//     setIsAlertOpen(true);
//   };

//   const handleExternalOpen = () => {
//     window.open(url, '_blank', 'noopener,noreferrer');
//   };

//   return (
//     <motion.div 
//       className={`flex flex-col bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/50 rounded-lg shadow-2xl overflow-hidden`}
//       // Added resize capability via standard CSS
//       style={{ 
//         height: isExpanded ? 'calc(100vh - 80px)' : '500px', 
//         width: isExpanded ? '90%' : '600px',
//         resize: isExpanded ? 'none' : 'both', // Allow resizing only when not maximized
//         minWidth: '320px',
//         minHeight: '300px',
//       }}
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.3 }}
//       layout
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-purple-500/30 shrink-0">
//         <div className="flex items-center gap-2">
//           <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50">
//             <Globe className="w-4 h-4 text-purple-400" />
//           </div>
//           <span className="text-xs text-purple-400 font-mono">
//             WEB BROWSER
//           </span>
//         </div>
        
//         <div className="flex items-center gap-1">
//           <motion.button
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={onToggleExpand}
//             className="p-1.5 rounded hover:bg-purple-500/20 text-purple-400 transition-colors"
//             title={isExpanded ? "Minimize" : "Expand"}
//           >
//             {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
//           </motion.button>
//           <motion.button
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={onClose}
//             className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
//             title="Close"
//           >
//             <X className="w-4 h-4" />
//           </motion.button>
//         </div>
//       </div>

//       {/* URL Bar */}
//       <div className="flex items-center gap-2 px-4 py-2 bg-black/20 border-b border-purple-500/20 shrink-0">
//         <div className="flex-1 flex items-center gap-2 bg-black/40 rounded px-3 py-1.5 border border-purple-500/30 focus-within:border-purple-500/60 transition-colors">
//           <Globe className="w-4 h-4 text-gray-500" />
//           <input
//             type="text"
//             value={inputUrl}
//             onChange={(e) => setInputUrl(e.target.value)}
//             onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
//             className="flex-1 bg-transparent text-sm text-gray-300 outline-none font-mono"
//             placeholder="Enter URL..."
//           />
//         </div>
        
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={handleLoadUrl}
//           className="p-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
//           title="Refresh"
//         >
//           <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
//         </motion.button>

//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={handleExternalOpen}
//           className="p-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
//           title="Open in new Tab (Fixes blocked sites)"
//         >
//           <ExternalLink className="w-4 h-4" />
//         </motion.button>
//       </div>

//       {/* Browser Content */}
//       <div className="flex-1 overflow-hidden relative bg-white/5">
//         <iframe
//           src={url}
//           className="w-full h-full border-0 bg-white"
//           title="Web Browser"
//           onLoad={() => setIsLoading(false)}
//           referrerPolicy="no-referrer"
//           sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
//         />
        
//         {/* Dismissible Note overlay */}
//         <AnimatePresence>
//           {isAlertOpen && (
//             <motion.div 
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               className="absolute top-4 left-4 right-4 z-10"
//             >
//                <div className="bg-purple-900/95 backdrop-blur-md border border-purple-500/50 rounded-lg p-3 shadow-xl max-w-2xl mx-auto flex gap-3 relative">
//                 <div className="shrink-0 mt-0.5">
//                   <AlertTriangle className="w-5 h-5 text-yellow-400" />
//                 </div>
                
//                 <div className="flex-1 text-xs font-mono">
//                   <div className="font-bold text-purple-100 mb-1">Display Issues?</div>
//                   <div className="text-purple-200/80 leading-relaxed">
//                     Many sites (Google, YouTube) block embedded browsers. 
//                     If the screen is white, click <span className="inline-flex items-center px-1 py-0.5 rounded bg-blue-500/20 text-blue-300"><ExternalLink className="w-3 h-3 mr-1"/> Open in New Tab</span> above.
//                   </div>
//                 </div>

//                 <button 
//                   onClick={() => setIsAlertOpen(false)}
//                   className="absolute top-2 right-2 p-1 rounded-md hover:bg-purple-800 text-purple-400 hover:text-white transition-colors"
//                   title="Dismiss Alert"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* Status bar */}
//       <div className="flex items-center justify-between px-4 py-1 bg-black/40 border-t border-purple-500/30 text-xs font-mono shrink-0">
//         <div className="flex items-center gap-4">
//           <span className="text-green-400 flex items-center gap-1">
//             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//             SECURE
//           </span>
//           <span className="text-gray-500 truncate max-w-[200px] opacity-70">{url}</span>
//         </div>
        
//         {/* Resize Handle Visual Indicator (Bottom Right) */}
//         {!isExpanded && (
//           <div className="absolute bottom-0.5 right-0.5 w-3 h-3 cursor-nwse-resize opacity-50">
//             <svg viewBox="0 0 10 10" className="w-full h-full fill-gray-500">
//               <path d="M 10 0 L 10 10 L 0 10 Z" />
//             </svg>
//           </div>
//         )}
//       </div>
//     </motion.div>
//   );
// }

import { useState } from 'react';
import { X, Maximize2, Minimize2, RefreshCw, Globe, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WebBrowserProps {
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function WebBrowser({ onClose, isExpanded, onToggleExpand }: WebBrowserProps) {
  const [url, setUrl] = useState('https://www.wikipedia.org/');
  const [inputUrl, setInputUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(true);

  const handleLoadUrl = () => {
    let targetUrl = inputUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    setUrl(targetUrl);
    setInputUrl(targetUrl);
    setIsLoading(true);
    setIsAlertOpen(true);
  };

  const handleExternalOpen = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div 
      // EXPANDED FIX: Fixed positioning with specific top/bottom values keeps it between header/footer
      className={`flex flex-col bg-slate-900/90 backdrop-blur-md border border-purple-500/50 rounded-lg shadow-2xl overflow-hidden
        ${isExpanded ? 'fixed left-4 right-4 top-20 bottom-12 z-40' : 'fixed bottom-12 right-8 z-40'}
      `}
      drag={!isExpanded} // Only draggable when small
      dragMomentum={false}
      style={{ 
        width: isExpanded ? 'auto' : '600px',
        height: isExpanded ? 'auto' : '450px',
        resize: isExpanded ? 'none' : 'both',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-purple-500/30 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-purple-400 font-mono font-bold">SECURE BROWSER</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={onToggleExpand} className="p-1.5 hover:bg-purple-500/20 text-purple-400 rounded transition-colors">
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border-b border-purple-500/20">
        <div className="flex-1 flex items-center bg-black/50 rounded px-3 py-1 border border-purple-500/30 focus-within:border-purple-500/70">
           <input 
             className="flex-1 bg-transparent border-none outline-none text-sm text-gray-300 font-mono"
             value={inputUrl}
             onChange={(e) => setInputUrl(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
           />
        </div>
        <button onClick={handleLoadUrl} className="p-1.5 hover:bg-purple-500/20 rounded text-purple-400">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={handleExternalOpen} className="p-1.5 hover:bg-blue-500/20 rounded text-blue-400" title="Open External">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Iframe Content */}
      <div className="flex-1 relative bg-white">
        <iframe
          src={url}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />

        {/* Floating Alert */}
        <AnimatePresence>
          {isAlertOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 right-4 left-4"
            >
              <div className="bg-purple-900/90 text-purple-100 p-3 rounded-md border border-purple-500/50 shadow-lg text-xs font-mono flex items-start gap-3 relative">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                <div className="pr-6">
                  <p className="font-bold mb-1">Display Warning</p>
                  <p className="opacity-80">Many modern sites (Google, YouTube) block embedding. If you see a white screen, use the <ExternalLink className="w-3 h-3 inline"/> button above.</p>
                </div>
                <button onClick={() => setIsAlertOpen(false)} className="absolute top-2 right-2 p-1 hover:bg-black/20 rounded">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}