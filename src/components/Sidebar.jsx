import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Brain, LayoutDashboard, Briefcase, Heart, Users, Code2,
  Target, CheckCircle2, Clock, AlertCircle, AlertTriangle, Info,
} from 'lucide-react';

const CATEGORIES = [
  { label: 'All', icon: LayoutDashboard, color: 'text-indigo-500' },
  { label: 'Work', icon: Briefcase, color: 'text-blue-500' },
  { label: 'Meeting', icon: Users, color: 'text-amber-500' },
  { label: 'Development', icon: Code2, color: 'text-purple-500' },
];

const PRIORITIES = [
  { label: 'All', dot: 'bg-zinc-400', desc: '' },
  { label: 'P1', dot: 'bg-red-500', desc: 'High', icon: AlertCircle },
  { label: 'P2', dot: 'bg-orange-500', desc: 'Medium', icon: AlertTriangle },
  { label: 'P3', dot: 'bg-blue-500', desc: 'Low', icon: Info },
];

const STATUSES = [
  { label: 'all', display: 'All Tasks', icon: LayoutDashboard },
  { label: 'pending', display: 'Pending', icon: Clock },
  { label: 'completed', display: 'Completed', icon: CheckCircle2 },
];

function NavItem({ active, onClick, icon: Icon, color, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${active ? 'text-indigo-500' : color}`} />
        {label}
      </span>
      {count != null && (
        <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 min-w-[20px] text-center">
          {count}
        </span>
      )}
    </button>
  );
}

function SidebarContent({ activeCategory, setActiveCategory, activePriority, setActivePriority, activeStatus, setActiveStatus, stats, onClose }) {
  const catCount = { Work: stats.work, Health: stats.health, Meeting: stats.meeting, Development: stats.development };

  return (
    <div className="flex flex-col h-full p-5 gap-6 overflow-y-auto">
      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-foreground text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
          TaskAI
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3 border border-indigo-100 dark:border-indigo-900/50">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total</p>
        </div>
        <div className="rounded-xl bg-green-50 dark:bg-green-950/40 p-3 border border-green-100 dark:border-green-900/50">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Done</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Categories
        </p>
        <div className="space-y-0.5">
          {CATEGORIES.map(({ label, icon, color }) => (
            <NavItem
              key={label}
              active={activeCategory === label}
              onClick={() => { setActiveCategory(label); onClose?.(); }}
              icon={icon}
              color={color}
              label={label}
              count={label !== 'All' ? (catCount[label] ?? 0) : null}
              data-testid={`category-filter-${label.toLowerCase()}`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Priority
        </p>
        <div className="space-y-0.5">
          {PRIORITIES.map(({ label, dot, desc }) => (
            <button
              key={label}
              data-testid={`priority-filter-${label.toLowerCase()}`}
              onClick={() => { setActivePriority(label); onClose?.(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activePriority === label
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
              <span>{label === 'All' ? 'All Priorities' : `${label}`}</span>
              {desc && <span className="text-xs text-muted-foreground ml-auto">{desc}</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Status
        </p>
        <div className="space-y-0.5">
          {STATUSES.map(({ label, display, icon }) => (
            <NavItem
              key={label}
              active={activeStatus === label}
              onClick={() => { setActiveStatus(label); onClose?.(); }}
              icon={icon}
              color="text-muted-foreground"
              label={display}
              data-testid={`status-filter-${label}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {stats.pending} task{stats.pending !== 1 ? 's' : ''} pending
            </p>
          </div>
          {stats.total > 0 && (
            <>
              <div className="h-1.5 rounded-full bg-amber-200 dark:bg-amber-900/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.completed / stats.total) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {Math.round((stats.completed / stats.total) * 100)}% complete
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar(props) {
  const { isOpen, onClose } = props;

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-background/95 backdrop-blur-xl z-40 overflow-hidden">
        <SidebarContent {...props} />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed left-0 top-0 h-full w-72 bg-background border-r border-border z-50 md:hidden shadow-2xl"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            >
              <button
                data-testid="close-mobile-sidebar"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent {...props} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
