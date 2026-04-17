# Design Doc: Collapsible Transcript Drawer

## Goal
Create a collapsible, slide-out transcript drawer for the Spatial Stage interview experience.

## Architecture
- **Component:** `TranscriptDrawer`
- **Type:** React Functional Component
- **Props:**
  - `isOpen: boolean`: Controls visibility and slide animation.
  - `onClose: () => void`: Callback when the close button is clicked.
  - `transcripts: Array<{ speaker: string, text: string, timestamp?: string }>`: List of transcript items to display.

## UI/UX Design
- **Placement:** Fixed to the right side of the screen (`fixed right-0 top-0 h-screen`).
- **Styling:**
  - `glass-panel` class for background and blur effect.
  - `border-l` for visual separation from the main stage.
  - Width: Responsive (e.g., `w-80` to `w-96`).
- **Transitions:**
  - Slide in from right when `isOpen` is true (`translate-x-0`).
  - Slide out to right when `isOpen` is false (`translate-x-full`).
  - Smooth animation using Tailwind's `transition-transform duration-300 ease-in-out`.
- **Close Button:**
  - Positioned in the top-right corner.
  - Uses Lucide `X` icon.
  - Integrated with `onClose` prop.
- **Transcripts List:**
  - Scrollable container (`overflow-y-auto`).
  - Message bubbles grouped by speaker.
  - Clean styling with distinct alignments/colors for 'Interviewer' vs 'Candidate'.

## Components
- **`DrawerContainer`**: Main wrapper with glass effect and slide transition.
- **`DrawerHeader`**: Contains title "Transcript" and the Close button.
- **`TranscriptList`**: Maps over transcripts and renders message groups.
- **`MessageBubble`**: Individual message UI.

## Data Flow
1. Parent component passes `isOpen` state and `transcripts` data.
2. `TranscriptDrawer` renders the current transcript list.
3. User clicks close button -> `onClose` callback is triggered.
4. Parent updates state to close the drawer.

## Testing Strategy
- **Unit Tests:**
  - Render with different `isOpen` states.
  - Verify close button calls `onClose`.
  - Verify transcript list renders all items.
  - Check speaker grouping logic.

