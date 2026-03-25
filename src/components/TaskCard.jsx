import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Trash2, Calendar, Sparkles, Pencil, Check, X as XIcon, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

const CATEGORY_STYLES = {
  Work: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40',
  Meeting: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
  Development: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
};

const PRIORITY_STYLES = {
  P1: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200/60 dark:border-red-800/40',
  P2: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40',
  P3: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40',
};

const PRIORITY_LABELS = { P1: 'High', P2: 'Medium', P3: 'Low' };
const PRIORITY_DOT = { P1: 'bg-red-500', P2: 'bg-orange-500', P3: 'bg-blue-500' };

function getDaysLeft(deadlineStr) {
  if (!deadlineStr || deadlineStr === 'TBD') return null;
  try {
    const deadline = new Date(deadlineStr);
    if (isNaN(deadline.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function CountdownBadge({ deadline }) {
  const days = getDaysLeft(deadline);
  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200/60 dark:border-red-800/40 rounded-full px-2 py-0.5">
        <AlertCircle className="w-3 h-3" />
        Overdue
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border border-orange-200/60 dark:border-orange-800/40 rounded-full px-2 py-0.5">
        <AlertTriangle className="w-3 h-3" />
        Due today
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/40 rounded-full px-2 py-0.5">
        <Clock className="w-3 h-3" />
        {days}d left
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border border-green-200/60 dark:border-green-800/40 rounded-full px-2 py-0.5">
      <Clock className="w-3 h-3" />
      {days}d left
    </span>
  );
}

export default function TaskCard({ task, onToggle, onDelete, onEdit, readOnly }) {
  const isCompleted = task.status === 'completed';
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const saveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== task.title && typeof onEdit === 'function') {
      onEdit(task.id, trimmed);
    } else {
      setEditText(task.title);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditText(task.title);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`group relative flex flex-col bg-card border rounded-xl p-5 transition-all duration-300 ${
        isCompleted
          ? 'border-border opacity-60'
          : 'border-border hover:border-indigo-200 dark:hover:border-indigo-700/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/8'
      }`}
    >
      {!readOnly && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!isCompleted && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-950/40"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap pr-14">
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${CATEGORY_STYLES[task.category] || 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'}`}>
          {task.category}
        </span>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${PRIORITY_STYLES[task.priority] || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority] || 'bg-zinc-400'}`} />
          {task.priority} · {PRIORITY_LABELS[task.priority] || task.priority}
        </span>
      </div>

      {isEditing ? (
        <div className="mb-3 pr-2">
          <textarea
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
              if (e.key === 'Escape') cancelEdit();
            }}
            rows={2}
            className="w-full resize-none text-sm font-medium bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <div className="flex items-center gap-2 mt-2">
            <button onClick={saveEdit} className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg px-3 py-1.5">
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={cancelEdit} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-accent rounded-lg px-3 py-1.5">
              <XIcon className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          onClick={() => !isCompleted && !readOnly && setIsEditing(true)}
          className={`text-sm font-medium leading-relaxed mb-2 ${
            isCompleted ? 'line-through text-muted-foreground' : 'text-foreground cursor-text'
          }`}
        >
          {task.title}
        </p>
      )}

      {task.originalRaw && !isCompleted && !isEditing && (
        <div className="flex items-start gap-1.5 mb-3">
          <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            Note: {task.originalRaw}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {task.suggestedDeadline && task.suggestedDeadline !== 'TBD' && (
            <>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {task.suggestedDeadline}
              </span>
              {!isCompleted && <CountdownBadge deadline={task.suggestedDeadline} />}
            </>
          )}
        </div>

        {!readOnly && (
          <button
            onClick={() => onToggle(task.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCompleted
              ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> Done</>
              : <><Circle className="w-4 h-4" /> Mark done</>
            }
          </button>
        )}
      </div>
    </motion.div>
  );
}
