import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import { Brain, Sparkles, Tag, Clock, ShieldCheck, Moon, Sun } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const features = [
  { icon: Sparkles, label: 'AI-Powered', desc: 'Gemini auto-categorizes every task', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/50' },
  { icon: Tag, label: 'Smart Labels', desc: 'Priority & deadlines set by AI', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/50' },
  { icon: Clock, label: 'Countdown', desc: 'Days left badge on each task', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/50' },
  { icon: ShieldCheck, label: 'Cloud Sync', desc: 'Tasks saved to your account', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/50' },
];

export default function LoginPage({ theme, onToggleTheme }) {
  const [loading, setLoading] = useState(false);
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;
  // NEW: State to track Admin vs User choice
  const [selectedRole, setSelectedRole] = useState('user'); 
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      
      const provider = new GoogleAuthProvider();
     provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.setCustomParameters({ prompt: 'select_account' });
     const result = await signInWithPopup(auth, provider);
      const user = result.user;
      

    
    if (selectedRole === 'admin'&& user.email !== ADMIN_EMAIL) {
      toast.error("Unauthorized: This email is not registered as Admin.");
      await auth.signOut();
      localStorage.removeItem('user-role');
      
      // Step 3: Stop the loading state and stay on the login page
      setLoading(false);
      return;
    }
    // This creates or updates the user document in your 'users' collection
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: selectedRole,
      lastLogin: serverTimestamp()
    }, { merge: true });
      
      // NEW: Save role to storage so App.js knows what permissions to give
      localStorage.setItem('user-role', selectedRole);
      
      toast.success(`Welcome to TaskAI!`);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {onToggleTheme && (
        <button
          data-testid="theme-toggle-btn"
          onClick={onToggleTheme}
          className="fixed top-4 right-4 p-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-all duration-200 z-10"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      )}
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="hidden md:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">TaskAI</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Task Orchestrator</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-foreground leading-tight mb-4">
            Let AI organize<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">your workflow</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Get started</h2>
              <p className="text-sm text-muted-foreground">Choose your role before signing in</p>
            </div>

            {/* NEW: Role Selection Buttons */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6 border border-border">
              {['user', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                    selectedRole === role 
                      ? 'bg-background text-indigo-500 shadow-sm border border-border' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-border bg-background hover:bg-accent font-semibold text-sm transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              )}
              {loading ? 'Signing in...' : `Continue as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
