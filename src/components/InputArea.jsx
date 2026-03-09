import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Loader2 } from 'lucide-react';

export default function InputArea({ onAddTask, isProcessing }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;
    onAddTask(text);
    setText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          What needs to be done?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Dump your raw thoughts — AI will categorize, prioritize, and set a deadline.
        </p>
      </div>

      <div
        className={`relative rounded-2xl border bg-card overflow-hidden transition-all duration-500 ${
          isProcessing
            ? 'border-indigo-400 dark:border-indigo-600 shadow-xl shadow-indigo-500/15 ai-pulse-border'
            : 'border-border hover:border-indigo-300 dark:hover:border-indigo-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:shadow-lg focus-within:shadow-indigo-500/10'
        }`}
      >
        {isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-indigo-500/5 animate-pulse pointer-events-none" />
        )}

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-2 transition-colors duration-300 ${isProcessing ? 'text-indigo-500' : 'text-muted-foreground'}`}>
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {isProcessing ? 'AI is thinking...' : 'AI Brain'}
              </span>
            </div>
          </div>

          {isProcessing ? (
            <div className="space-y-3 py-2">
              {[85, 65, 40].map((w, i) => (
                <div
                  key={i}
                  className="h-4 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/60 dark:to-purple-950/60 animate-pulse"
                  style={{ width: `${w}%`, animationDelay: `${i * 0.2}s` }}
                />
              ))}
              <p className="text-xs text-indigo-400 mt-4 animate-pulse">
                Analyzing task context, priority, and timeline...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <textarea
                data-testid="task-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Schedule a team meeting to review Q1 goals and discuss project blockers before the deadline..."
                rows={3}
                className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none leading-relaxed"
                style={{ fontFamily: 'Inter, sans-serif' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e);
                }}
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {text.length > 0
                    ? <span><span className="text-foreground font-medium">{text.length}</span> chars · Ctrl+Enter to submit</span>
                    : 'Press Ctrl+Enter or click the button'}
                </p>
                <button
                  data-testid="analyze-task-btn"
                  type="submit"
                  disabled={!text.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 active:scale-95 shadow-md shadow-indigo-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  Analyze with AI
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
