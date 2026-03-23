# AI Mock Interviewer - UI/UX & Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the AI Mock Interviewer with a professional UI, role selection, and real-time audio visualization.

**Architecture:** Extend the existing React frontend with a role-selection homepage and an integrated audio visualizer. Update the FastAPI backend to support dynamic role configuration in the system prompt.

**Tech Stack:** React (Vite/TS), TailwindCSS, Web Audio API (AnalyzerNode).

---

### Task 1: Role Selection & Home Page

**Files:**
- Create: `frontend/src/pages/HomePage.tsx`
- Create: `frontend/src/components/RoleCard.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `backend/app/routers/interview.py` (to handle role configuration)

- [ ] **Step 1: Create RoleCard component**
(Include title, description, icon, and interview type badge)

- [ ] **Step 2: Build the Home Page UI**
(Grid of RoleCards for Software Engineer, Frontend, PM, etc.)

- [ ] **Step 3: Update App.tsx to include Home Page**
(Add routing logic for `home` -> `interview` -> `scorecard`)

- [ ] **Step 4: Update backend/app/routers/interview.py**
(Handle `role_id` in the `start` message and inject the correct configuration into the system prompt)

- [ ] **Step 5: Commit**

---

### Task 2: Audio Visualization Component

**Files:**
- Create: `frontend/src/components/AudioVisualizer.tsx`
- Modify: `frontend/src/pages/InterviewPage.tsx`
- Modify: `frontend/src/hooks/useAudioCapture.ts` (to expose AnalyzerNode)
- Modify: `frontend/src/hooks/useAudioPlayback.ts` (to expose AnalyzerNode)

- [ ] **Step 1: Update hooks to provide AnalyzerNode**
(Create and expose `AnalyserNode` in `useAudioCapture` and `useAudioPlayback`)

- [ ] **Step 2: Implement AudioVisualizer component**
(Draw a pulsing dot or waveform using the Canvas API or CSS based on frequency/amplitude data)

- [ ] **Step 3: Integrate AudioVisualizer into InterviewPage**
(Show visual feedback for both user input and AI output)

- [ ] **Step 4: Commit**

---

### Task 3: Professional Prompting & Persona Polish

**Files:**
- Modify: `backend/app/services/gemini_session.py` (to support dynamic prompts)
- Modify: `backend/app/routers/interview.py` (to inject role data)

- [ ] **Step 1: Implement the full INTERVIEWER_SYSTEM_PROMPT**
(Use the detailed prompt from the master spec)

- [ ] **Step 2: Add role-specific configurations**
(Define `ROLE_CONFIGS` in a new `backend/app/utils/prompts.py`)

- [ ] **Step 3: Commit**

---

### Task 4: UI/UX Refinements & States

**Files:**
- Modify: `frontend/src/pages/InterviewPage.tsx`
- Modify: `frontend/src/pages/ScorecardPage.tsx`

- [ ] **Step 1: Add interview states**
(Implement `connecting`, `active`, `ending` states with appropriate UI feedback)

- [ ] **Step 2: Add "End Interview" confirmation**
(Prevent accidental endings)

- [ ] **Step 3: Polish Scorecard UI**
(Add category scores, overall score circle, and per-answer breakdown)

- [ ] **Step 4: Commit**
