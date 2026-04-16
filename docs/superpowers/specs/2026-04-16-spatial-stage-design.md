# Design Spec: Spatial Stage - Modern Interview Studio Redesign

**Topic:** UI Overhaul for Voice AI Interviewer
**Style:** Vercel-inspired, Clean, Minimalist, Dark Mode First
**Approach:** Spatial Stage (Immersive, Centered, Focused)

## 1. Vision
Transform the current "grid of boxes" UI into a premium, immersive "Spatial Stage". The interface should disappear, leaving only the AI's presence (the Aura) and essential controls. It should feel like a high-end voice interface (similar to Siri or ChatGPT Voice) but tailored for a professional interview.

## 2. Design Tokens (The "Vercel" Palette)
- **Background:** Deep Charcoal/Black (`#000000` or `#050505`)
- **Surface:** Subtle Elevated Grays (`#0A0A0A` / `#111111`)
- **Border:** Razor-thin borders (`#222222` or `1px solid rgba(255,255,255,0.1)`)
- **Accent:** Primary Orange (`#FF5701`) with soft glows
- **Typography:** DM Sans (already used) but with better hierarchy and spacing.

## 3. Layout Architecture (Approach A)
- **Center Stage:** A large, dynamic "Aura" visualizer in the center of the viewport.
- **Floating Dock:** A glassmorphic (blurred background) control bar at the bottom center.
    - Buttons: Mute/Unmute, Finish Answer (Done), End Interview.
- **Transcript Side-Drawer:** A collapsible right-side drawer for history.
    - Collapsed: Only a small icon.
    - Expanded: Translucent overlay with clean message bubbles.
- **Status Indicators:** Minimalist text or pulse in the top corner (e.g., "Live", "Connecting").

## 4. Components

### 4.1. Dynamic Aura Visualizer
- **Visuals:** Multi-layered SVG or Canvas rings with CSS blur filters.
- **Behavior:**
    - **Idle:** Soft, slow organic pulse.
    - **Listening:** Green-tinted aura, reacting to user volume.
    - **Speaking:** Orange-tinted aura, reacting to AI volume.
    - **Thinking:** Multi-color "shimmer" effect.

### 4.2. Floating Glass Dock
- **Style:** `backdrop-filter: blur(12px)`, subtle white/gray border, rounded-full.
- **Interactions:** Subtle scale on hover, tactile feel.

### 4.3. Collapsible Transcript
- **Transition:** Slide in from right.
- **Design:** Grouped by speaker, time-relative stamps.

## 5. Implementation Plan
1. **Tokens:** Update `index.css` with the new color variables.
2. **Visualizer:** Enhance `AudioVisualizer.tsx` to handle full-screen scaling and layered aura effects.
3. **InterviewPage:** Rebuild the layout from scratch using Tailwind's flex/absolute positioning.
4. **Dock:** Create the new control dock component.
5. **Transcript:** Refactor the transcript into a slide-out component.

## 6. Testing & Validation
- **Responsiveness:** Ensure the Aura scales and the dock stays centered on mobile.
- **Accessibility:** Maintain high contrast and clear focus states.
- **Performance:** Ensure the blur filters don't impact frame rates on lower-end devices.
