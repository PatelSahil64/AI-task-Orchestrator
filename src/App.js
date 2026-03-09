import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, Brain } from 'lucide-react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InputArea from './components/InputArea';
import TaskCard from './components/TaskCard';
import LoginPage from './components/LoginPage';
import { analyzeTask } from './utils/gemini';
import './App.css';

const THEME_KEY = 'ai-task-theme';
const API_KEY_STORAGE = 'gemini-api-key';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [apiKey, setApiKey] = useState(() =>
    localStorage.getItem(API_KEY_STORAGE) || process.env.REACT_APP_GEMINI_API_KEY || ''
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />;

  return (
    <MainApp
      user={user}
      theme={theme}
      setTheme={setTheme}
      apiKey={apiKey}
      setApiKey={setApiKey}
    />
  );
}

function MainApp({ user, theme, setTheme, apiKey, setApiKey }) {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePriority, setActivePriority] = useState('All');
  const [activeStatus, setActiveStatus] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time Firestore listener
  useEffect(() => {
    const colRef = collection(db, 'tasks', user.uid, 'items');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort newest first in JS (avoids needing Firestore composite index)
      list.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() || 0;
        const bt = b.createdAt?.toMillis?.() || 0;
        return bt - at;
      });
      setTasks(list);
      setTasksLoading(false);
    }, () => setTasksLoading(false));
    return unsubscribe;
  }, [user.uid]);

  const handleUpdateApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
    toast.success('API key updated');
  };

  const handleAddTask = async (text) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const ai = await analyzeTask(text, apiKey);
      await addDoc(collection(db, 'tasks', user.uid, 'items'), {
        title: text.trim(),
        category: ai.category,
        priority: ai.priority,
        suggestedDeadline: ai.suggestedDeadline,
        shortSummary: ai.shortSummary,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      toast.success(`Saved · ${ai.category} · ${ai.priority}`);
    } catch (e) {
      toast.error(e.message || 'AI analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggle = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      await updateDoc(doc(db, 'tasks', user.uid, 'items', id), {
        status: task.status === 'pending' ? 'completed' : 'pending',
      });
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', user.uid, 'items', id));
      toast.success('Task removed');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleEdit = async (id, newTitle) => {
    try {
      await updateDoc(doc(db, 'tasks', user.uid, 'items', id), { title: newTitle });
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const filtered = tasks.filter(t => {
    if (activeCategory !== 'All' && t.category !== activeCategory) return false;
    if (activePriority !== 'All' && t.priority !== activePriority) return false;
    if (activeStatus !== 'all' && t.status !== activeStatus) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    work: tasks.filter(t => t.category === 'Work').length,
    meeting: tasks.filter(t => t.category === 'Meeting').length,
    development: tasks.filter(t => t.category === 'Development').length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar
        activeCategory={activeCategory} setActiveCategory={setActiveCategory}
        activePriority={activePriority} setActivePriority={setActivePriority}
        activeStatus={activeStatus} setActiveStatus={setActiveStatus}
        stats={stats} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          stats={stats}
          onOpenSidebar={() => setSidebarOpen(true)}
          apiKey={apiKey}
          onUpdateApiKey={handleUpdateApiKey}
          user={user}
        />

        <main className="flex-1 p-6 md:p-10 space-y-8 max-w-5xl">
          <InputArea onAddTask={handleAddTask} isProcessing={isProcessing} />
          <TaskSection
            tasks={filtered}
            total={tasks.length}
            tasksLoading={tasksLoading}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </main>
      </div>
    </div>
  );
}

function TaskSection({ tasks, total, tasksLoading, onToggle, onDelete, onEdit }) {
  if (tasksLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3 animate-pulse">
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-muted" />
              <div className="h-6 w-16 rounded-full bg-muted" />
            </div>
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
        data-testid="empty-state"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/10">
          <ClipboardList className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          No tasks yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Type any task above and AI will automatically assign a category, priority, and a suggested deadline.
        </p>
      </motion.div>
    );
  }

  if (tasks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16" data-testid="no-match-state">
        <p className="text-muted-foreground text-sm">No tasks match the active filters</p>
      </motion.div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4" data-testid="task-count-label">
        Showing <span className="font-semibold text-foreground">{tasks.length}</span> task{tasks.length !== 1 ? 's' : ''}
      </p>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
        initial="hidden" animate="show"
        data-testid="task-grid"
      >
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
