import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, Brain } from 'lucide-react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { AuthProvider, useAuth } from './components/contexts/AuthContext';
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
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;
const storedRole = localStorage.getItem('user-role') || 'user';
  const isAdmin = storedRole === 'admin' && user.email === ADMIN_EMAIL;
  
  const [globalTasks, setGlobalTasks] = useState([]);
  const [privateTasks, setPrivateTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePriority, setActivePriority] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  

  useEffect(() => {
    const globalRef = collection(db, 'global_tasks');
    const unsubGlobal = onSnapshot(globalRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data(), isGlobal: true }));
      setGlobalTasks(list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    });

    const privateRef = collection(db, 'users', user.uid, 'personal_tasks');
    const unsubPrivate = onSnapshot(privateRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data(), isPrivate: true }));
      setPrivateTasks(list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      setTasksLoading(false);
    });

    return () => { unsubGlobal(); unsubPrivate(); };
  }, [user.uid]);

  // Combined tasks for stats and global logic
  const allTasks = [...globalTasks, ...privateTasks];

  const handleAddTask = async (text) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const ai = await analyzeTask(text, apiKey);
  const finalDeadline = (ai.suggestedDeadline && ai.suggestedDeadline !== 'TBD') 
  ? ai.suggestedDeadline 
  : null;
     const taskData = {
  title: ai.shortSummary || text.trim(),
  category: ai.category,
  priority: ai.priority,
  suggestedDeadline: finalDeadline, // This will be null in Firestore
  status: 'pending',
  createdAt: serverTimestamp(),
  userId: user.uid,
};
      if (isAdmin) {
        await addDoc(collection(db, 'global_tasks'), taskData);
        toast.success('Added to Global Board');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'personal_tasks'), taskData);
        toast.success('Added to your Private To-Do');
      }
    } catch (e) {
      toast.error('Processing Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async (id, actionType, isGlobal) => {
    if (!isAdmin && isGlobal) return;
    const path = isGlobal ? 'global_tasks' : `users/${user.uid}/personal_tasks`;
    const docRef = doc(db, path, id);

    try {
      if (actionType === 'delete') {
        await deleteDoc(docRef);
        toast.success('Task removed');
      }
      if (actionType === 'toggle') {
        const list = isGlobal ? globalTasks : privateTasks;
        const task = list.find(t => t.id === id);
        await updateDoc(docRef, { status: task.status === 'pending' ? 'completed' : 'pending' });
      }
    } catch { toast.error('Update failed'); }
  };

  const filteredGlobal = globalTasks.filter(t => {
    if (activeCategory !== 'All' && t.category !== activeCategory) return false;
    if (activePriority !== 'All' && t.priority !== activePriority) return false;
    return true;
  });

  const filteredPrivate = privateTasks.filter(t => {
    if (activeCategory !== 'All' && t.category !== activeCategory) return false;
    if (activePriority !== 'All' && t.priority !== activePriority) return false;
    return true;
  });

  const stats = {
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    work: allTasks.filter(t => t.category === 'Work').length,
    meeting: allTasks.filter(t => t.category === 'Meeting').length,
    development: allTasks.filter(t => t.category === 'Development').length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar 
        stats={stats} 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
        activePriority={activePriority}
        setActivePriority={setActivePriority}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header 
          user={user} 
          stats={stats} 
          onOpenSidebar={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          apiKey={apiKey}
          onUpdateApiKey={setApiKey}
        />

        <main className="flex-1 p-6 md:p-10 space-y-12 max-w-5xl">
          <InputArea onAddTask={handleAddTask} isProcessing={isProcessing} />

          {!isAdmin && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> My Private To-Do
              </h2>
              <TaskSection 
                tasks={filteredPrivate}
                tasksLoading={tasksLoading}
                total={privateTasks.length}
                onToggle={(id) => handleAction(id, 'toggle', false)}
                onDelete={(id) => handleAction(id, 'delete', false)}
              />
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Global Board (Shared)
            </h2>
            <TaskSection 
              tasks={filteredGlobal}
              tasksLoading={tasksLoading}
              total={globalTasks.length}
              onToggle={isAdmin ? (id) => handleAction(id, 'toggle', true) : null}
              onDelete={isAdmin ? (id) => handleAction(id, 'delete', true) : null}
              readOnly={!isAdmin}
            />
          </section>
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
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/10">
          <ClipboardList className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No tasks yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Type any task above and AI will automatically assign a category, priority, and a suggested deadline.
        </p>
      </motion.div>
    );
  }

  if (tasks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <p className="text-muted-foreground text-sm">No tasks match the active filters</p>
      </motion.div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Showing <span className="font-semibold text-foreground">{tasks.length}</span> tasks
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <TaskCard 
               key={task.id} 
               task={task} 
               onToggle={onToggle} 
               onDelete={onDelete} 
               onEdit={onEdit} 
               readOnly={!onToggle}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
