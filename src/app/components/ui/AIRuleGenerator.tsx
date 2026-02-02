import { useState } from 'react';
import { Bot, Shield, Send, CheckCircle, AlertTriangle, Loader2, Sparkles, Terminal } from 'lucide-react';
import { env } from '@/lib/env'; // Use our typed environment config

// Define the shape of the AI Rule
interface FirewallRule {
  type: 'ip' | 'domain';
  target: string;
  action: 'block' | 'allow';
  protocol: string;
  port: string;
  reason: string;
}

export function AIRuleGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generatedRule, setGeneratedRule] = useState<FirewallRule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });
  const [contextData, setContextData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25000) { // Limit to ~25KB to stay safe within token limits
      setStatus({ type: 'error', msg: 'File too large. Please upload logs under 25KB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setContextData(text);
      setFileName(file.name);
      setStatus({ type: 'success', msg: `Loaded context: ${file.name}` });
    };
    reader.readAsText(file);
  };

  // 1. Send Prompt to Backend
  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setStatus({ type: null, msg: '' });
    setGeneratedRule(null);

    try {
      const res = await fetch(`${env.backendUrl}/api/generate-rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          contextData // Send the file content if it exists
        })
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedRule(data.rule);
      } else {
        setStatus({ type: 'error', msg: 'AI failed to interpret request. Try being more specific.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: `Connection failed to ${env.backendUrl}. Is the Ubuntu server running?` });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Send Approved Rule to pfSense
  const handleApply = async () => {
    if (!generatedRule) return;
    setIsLoading(true);

    try {
      const res = await fetch(`${env.backendUrl}/api/apply-rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: generatedRule })
      });

      const data = await res.json();

      if (data.success) {
        setStatus({ type: 'success', msg: `Success: ${data.message}` });
        setGeneratedRule(null);
        setPrompt('');
      } else {
        setStatus({ type: 'error', msg: `Apply Error: ${data.details}` });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Network error applying rule.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
            <Bot className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              AI Security Architect
              <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20 font-mono">
                Running on Gemma 3
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Describe a security intent or upload a log JSON for analysis
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Sparkles className="h-4 w-4 text-primary/40" />
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Analyze the attached log and block the attacker..."
              className="w-full bg-background/50 border border-border/50 hover:border-primary/50 focus:border-primary rounded-lg pl-10 pr-24 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt}
              className="absolute right-1 top-1 bottom-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 rounded-md flex items-center gap-2 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  Generate <Send className="h-3 w-3" />
                </>
              )}
            </button>
          </div>

          {/* File Upload Context */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border hover:bg-secondary cursor-pointer transition-colors text-xs text-muted-foreground hover:text-foreground">
              <input
                type="file"
                accept=".json,.log,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <span className="font-medium">+ Upload Log (JSON)</span>
            </label>
            {fileName && (
              <span className="text-xs text-primary flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                <CheckCircle className="h-3 w-3" />
                Using context: {fileName}
                <button onClick={() => { setContextData(null); setFileName(null); }} className="ml-2 hover:text-destructive">x</button>
              </span>
            )}
          </div>
        </div>

        {/* Status Message */}
        {status.msg && (
          <div className={`p-3 rounded-lg text-sm border flex items-start gap-3 animate-in fade-in slide-in-from-top-1 ${status.type === 'success'
            ? 'bg-green-500/5 border-green-500/20 text-green-400'
            : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
            {status.type === 'success' ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertTriangle className="h-4 w-4 mt-0.5" />}
            <span className="leading-tight">{status.msg}</span>
          </div>
        )}

        {/* Result Preview Card */}
        {generatedRule && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-black/40 rounded-lg border border-primary/20 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Terminal className="h-3 w-3" />
                  Generated Policy Object
                </span>
                <span className="text-[10px] font-mono text-primary/70">{generatedRule.action.toUpperCase()}</span>
              </div>

              <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Type</div>
                  <div className="font-mono text-foreground bg-white/5 inline-block px-2 py-0.5 rounded border border-white/5">
                    {generatedRule.type}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Target</div>
                  <div className="font-mono text-foreground font-medium text-primary">
                    {generatedRule.target}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Protocol/Port</div>
                  <div className="font-mono text-foreground">
                    {generatedRule.protocol.toUpperCase()} : {generatedRule.port}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Reasoning</div>
                  <div className="text-muted-foreground italic text-xs leading-relaxed">
                    "{generatedRule.reason}"
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setGeneratedRule(null)}
                className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted/10 text-sm font-medium transition-colors text-muted-foreground"
              >
                Discard
              </button>
              <button
                onClick={handleApply}
                disabled={isLoading}
                className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-[0_0_15px_rgba(var(--primary),0.1)] hover:shadow-[0_0_20px_rgba(var(--primary),0.2)]"
              >
                <Shield className="h-4 w-4" />
                Apply Rule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}