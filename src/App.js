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
        <Brain className="w-12 h-12 text-indigo-500 animate-pulse" />
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
  
  // --- FILTER STATES ---
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePriority, setActivePriority] = useState('All');
  const [activeStatus, setActiveStatus] = useState('all'); // ADDED: New status state
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubGlobal = onSnapshot(collection(db, 'global_tasks'), (snapshot) => {
      setGlobalTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data(), isGlobal: true })));
    });

    const unsubPrivate = onSnapshot(collection(db, 'users', user.uid, 'personal_tasks'), (snapshot) => {
      setPrivateTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data(), isPrivate: true })));
      setTasksLoading(false);
    });

    return () => { unsubGlobal(); unsubPrivate(); };
  }, [user.uid]);

  // --- STATS CALCULATION ---
  const allTasks = [...globalTasks, ...privateTasks];
  const stats = {
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    work: allTasks.filter(t => t.category === 'Work').length,
    meeting: allTasks.filter(t => t.category === 'Meeting').length,
    development: allTasks.filter(t => t.category === 'Development').length,
  };

  const handleAddTask = async (text) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const ai = await analyzeTask(text, apiKey);
      const taskData = {
        title: ai.shortSummary || text.trim(),
        category: ai.category || "General",
        priority: ai.priority || "P3",
        suggestedDeadline: ai.suggestedDeadline || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: user.uid,
      };
      const path = isAdmin ? 'global_tasks' : `users/${user.uid}/personal_tasks`;
      await addDoc(collection(db, path), taskData);
      toast.success('Task Added');
    } catch (e) {
      toast.error('Failed to add task');
    } finally {
      setIsProcessing(false);
    } 
  };

  const handleAction = async (id, actionType, isGlobal) => {
    const path = isGlobal ? 'global_tasks' : `users/${user.uid}/personal_tasks`;
    const docRef = doc(db, path, id);
    try {
      if (actionType === 'delete') await deleteDoc(docRef);
      if (actionType === 'toggle') {
        const list = isGlobal ? globalTasks : privateTasks;
        const task = list.find(t => t.id === id);
        await updateDoc(docRef, { status: task.status === 'pending' ? 'completed' : 'pending' });
      }
    } catch { toast.error('Update failed'); }
  };

  const handleUpdateTask = async (id, newTitle, isGlobal) => {
    const path = isGlobal ? 'global_tasks' : `users/${user.uid}/personal_tasks`;
    try {
      await updateDoc(doc(db, path, id), { title: newTitle });
      toast.success('Task Updated');
    } catch { toast.error('Edit failed'); }
  };

  // --- UPDATED FILTER LOGIC ---
  const filterFn = (t) => {
    const categoryMatch = activeCategory === 'All' || t.category === activeCategory;
    const priorityMatch = activePriority === 'All' || t.priority === activePriority;
    const statusMatch = activeStatus === 'all' || t.status === activeStatus;
    return categoryMatch && priorityMatch && statusMatch;
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar 
        stats={stats} 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
        activePriority={activePriority} 
        setActivePriority={setActivePriority} 
        activeStatus={activeStatus}      // ADDED: Pass to Sidebar
        setActiveStatus={setActiveStatus} // ADDED: Pass to Sidebar
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
                tasks={privateTasks.filter(filterFn)} 
                tasksLoading={tasksLoading} 
                onToggle={(id) => handleAction(id, 'toggle', false)} 
                onDelete={(id) => handleAction(id, 'delete', false)} 
                onEdit={(id, title) => handleUpdateTask(id, title, false)} 
              />
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Global Board (Shared)
            </h2>
            <TaskSection 
              tasks={globalTasks.filter(filterFn)} 
              tasksLoading={tasksLoading} 
              onToggle={isAdmin ? (id) => handleAction(id, 'toggle', true) : null} 
              onDelete={isAdmin ? (id) => handleAction(id, 'delete', true) : null} 
              onEdit={isAdmin ? (id, title) => handleUpdateTask(id, title, true) : null} 
              readOnly={!isAdmin} 
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function TaskSection({ tasks, tasksLoading, onToggle, onDelete, onEdit, readOnly }) {
  if (tasksLoading) return <div className="text-center py-10 text-muted-foreground animate-pulse">Loading tasks...</div>;
  
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-2xl">
        <ClipboardList className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No tasks found in this section.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onToggle={onToggle} 
            onDelete={onDelete} 
            onEdit={onEdit} 
            readOnly={readOnly} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
