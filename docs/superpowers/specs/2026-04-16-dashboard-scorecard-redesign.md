# Design Spec: Dashboard & Scorecard Modernization

**Topic:** UI Overhaul for Dashboard and Scorecard Pages
**Style:** Vercel-inspired, Clean, Minimalist, Dark Mode First
**Approach:** Data-Driven Command Center & Cinematic Report

## 1. Vision
Extend the "Spatial Stage" aesthetic to the Dashboard and Scorecard pages. Replace the "grid of boxes" with a sophisticated, layered dark mode using refined typography, glassmorphism, and cinematic animations.

## 2. Dashboard: Data-Driven Command Center
- **Stats Section:** High-contrast minimalist cards with large typography and subtle glowing underlines for metrics.
- **History Section (Spacious Timeline):**
    - Each interview session presented as an elevated card.
    - Vertical timeline line connecting sessions by date.
    - Glassmorphic hover states.
    - Refined badges for role and interview type.
- **Empty State:** A cinematic "Get Started" call-to-action with a soft aura background.

## 3. Scorecard: Cinematic Report
- **Header:** A large, centered animated "Radial Score" with a primary orange aura.
    - Supporting metrics (JD Match) as smaller, minimalist gauges.
- **Summary:** Premium typography with wider tracking and increased line height for better readability.
- **Detailed Assessment (Static Bento Cards):**
    - A clean, asymmetric grid of feedback cards.
    - Each card uses a subtle border and background gradient.
    - "Replay" buttons as minimalist ghost buttons with orange accents.
- **Improvement & Tips:** Color-coded zones (Red/Green) but with very subtle, desaturated backgrounds to keep the minimal look.

## 4. Design Tokens (Additions)
- **Timeline Line:** `#222222` or `rgba(255,255,255,0.05)`
- **Bento Card Background:** `#0A0A0A`
- **Metric Highlight:** Orange Glow (`rgba(255, 87, 1, 0.2)`)

## 5. Implementation Plan
1. **Dashboard:** Refactor `DashboardPage.tsx` to implement the timeline layout and new stat cards.
2. **Scorecard:** Refactor `ScorecardPage.tsx` to implement the cinematic header and bento-style assessment grid.
3. **Refinement:** Ensure transitions between pages are seamless with fade-in-up animations.

## 6. Testing & Validation
- **Data Integrity:** Ensure all fetched data displays correctly in the new layouts.
- **Responsiveness:** Ensure the timeline and bento grid collapse gracefully on mobile.
- **Accessibility:** Maintain clear hierarchy and accessible color contrast.
