# AI-Powered Task Orchestrator — PRD

## Problem Statement
Build a frontend-only AI Task Orchestrator React app that uses the Gemini API to automatically categorize, prioritize, and suggest deadlines for user-provided task descriptions.

## Architecture
- **Frontend**: React.js + Tailwind CSS + Framer Motion
- **AI**: Google Gemini API (gemini-2.0-flash) via REST API
- **Persistence**: localStorage (no backend)
- **UI Components**: Shadcn UI components + Lucide React icons

## User Personas
- Students organizing academic and personal tasks
- Professionals managing workloads across multiple domains

## Core Requirements (Static)
1. AI auto-assigns: category (Work/Health/Meeting/Development), priority (P1/P2/P3), suggested deadline, short summary
2. Light/Dark theme toggle with persistence
3. Sidebar filters: by category, priority, status
4. LocalStorage persistence across page refreshes
5. Task CRUD: add, toggle complete, delete
6. Responsive: fixed sidebar on desktop, drawer on mobile
7. Framer Motion animations with staggered card reveals

## What's Been Implemented (Feb 2026)
- **App.js**: Main orchestrator with full state management, localStorage persistence, theme toggle
- **Sidebar.jsx**: Glassmorphism sidebar — category/priority/status filters, stats widget, progress bar
- **InputArea.jsx**: AI Brain text input with skeleton loading animation, Ctrl+Enter shortcut
- **TaskCard.jsx**: Minimalist ticket cards with category/priority badges, deadline, AI summary, toggle, delete
- **Header.jsx**: Sticky header with pending/completed counters, theme toggle, mobile hamburger
- **utils/gemini.js**: Direct Gemini REST API integration with JSON parsing and error handling
- **Design**: Manrope + Inter fonts, Indigo/Zinc palette, Soft Utility theme

## Prioritized Backlog

### P0 (Done)
- [x] Task input & AI analysis
- [x] Category/priority/deadline assignment
- [x] Light/dark toggle
- [x] LocalStorage persistence
- [x] Sidebar filters
- [x] Framer Motion animations
- [x] Firebase Google Sign-In Authentication
- [x] Firestore cloud storage (tasks per user, real-time sync)
- [x] Login page (two-column: features + Google sign-in card)
- [x] User avatar + dropdown menu in header (name, email, logout)
- [x] Theme toggle on both login page and main app
- [x] Firestore skeleton loading cards
- [x] Inline task title editing (click to edit, Enter/Escape/Save/Cancel)
- [x] Due-date countdown badge (Overdue / Due today / Xd left — color-coded)

### P1 (Next)
- [ ] Drag-and-drop task reordering
- [ ] Task editing (click to edit title)
- [ ] Due date countdown badge (e.g. "2 days left")
- [ ] Export tasks to JSON/CSV

### P2 (Future)
- [ ] Batch task input (multiple tasks at once)
- [ ] Task notes/description expansion
- [ ] Analytics view (category distribution chart)
- [ ] Keyboard shortcuts panel

## Tech Stack
- React 19, Tailwind CSS 3, Framer Motion 12
- @google/generative-ai (REST API)
- Sonner (toast notifications)
- Shadcn UI, Lucide React
