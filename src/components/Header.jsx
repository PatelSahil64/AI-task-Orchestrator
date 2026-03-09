import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import {
  Moon, Sun, Menu, Brain, ListTodo, CheckCircle2, Zap,
  KeyRound, Eye, EyeOff, ExternalLink, LogOut, ChevronDown,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from './ui/dialog';

export default function Header({ theme, onToggleTheme, stats, onOpenSidebar, apiKey, onUpdateApiKey, user }) {
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSaveKey = () => {
    onUpdateApiKey(keyInput.trim());
    setKeyOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch {
      toast.error('Sign out failed');
    }
    setUserMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-6 md:px-10 py-4 flex items-center justify-between gap-4">

          {/* Left — Mobile hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              data-testid="mobile-sidebar-btn"
              onClick={onOpenSidebar}
              className="md:hidden p-2 rounded-xl hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>TaskAI</span>
            </div>
          </div>

          {/* Center — Title (desktop) */}
          <div className="hidden md:flex flex-col">
            <h1 className="text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              AI Task Orchestrator
            </h1>
            <p className="text-xs text-muted-foreground">Powered by Gemini · Auto-organizes your workflow</p>
          </div>

          {/* Right — Stats + controls */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:flex items-center gap-2">
              <div data-testid="header-pending-count" className="flex items-center gap-1.5 bg-secondary rounded-xl px-3 py-1.5 text-sm">
                <ListTodo className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-foreground">{stats.pending}</span>
                <span className="text-muted-foreground text-xs">pending</span>
              </div>
              <div data-testid="header-completed-count" className="flex items-center gap-1.5 bg-secondary rounded-xl px-3 py-1.5 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="font-semibold text-foreground">{stats.completed}</span>
                <span className="text-muted-foreground text-xs">done</span>
              </div>
            </div>

            {stats.total > 0 && (
              <div data-testid="ai-streak-badge" className="hidden lg:flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl px-3 py-1.5 text-xs font-semibold border border-indigo-100 dark:border-indigo-900/50">
                <Zap className="w-3 h-3" />
                {stats.total} tasks
              </div>
            )}

            {/* API Key button */}
            <button
              data-testid="api-key-settings-btn"
              onClick={() => { setKeyInput(apiKey || ''); setKeyOpen(true); }}
              title="Update Gemini API Key"
              className={`p-2.5 rounded-xl transition-all duration-200 active:scale-95 border ${
                !apiKey
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-500'
                  : 'bg-secondary hover:bg-accent border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Theme toggle */}
            <button
              data-testid="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl bg-secondary hover:bg-accent transition-all duration-200 active:scale-95 border border-border"
            >
              <motion.div key={theme} initial={{ rotate: -20, opacity: 0, scale: 0.8 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              </motion.div>
            </button>

            {/* User avatar menu */}
            {user && (
              <div className="relative">
                <button
                  data-testid="user-menu-btn"
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-accent transition-colors border border-border"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-7 h-7 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <button
                        data-testid="logout-btn"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* API Key Dialog */}
      <Dialog open={keyOpen} onOpenChange={setKeyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <KeyRound className="w-4 h-4 text-indigo-500" />
              Gemini API Key
            </DialogTitle>
            <DialogDescription>
              Your key is stored locally in your browser. Get a free key from Google AI Studio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <input
                data-testid="api-key-input"
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
              />
              <button onClick={() => setShowKey(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <p className="font-semibold">If you see API errors:</p>
              <p>Your key may be blocked if shared publicly. Generate a fresh key.</p>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                Get a free key at aistudio.google.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setKeyOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-accent text-muted-foreground transition-colors">
              Cancel
            </button>
            <button
              data-testid="save-api-key-btn"
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white transition-colors"
            >
              Save Key
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
