# Implementation Plan: Nebula OS

## Overview

Build a browser-based operating system experience using React, Vite, TailwindCSS, Zustand, react-rnd, and Framer Motion. The implementation proceeds from project scaffolding and core utilities, through state management and window system, to individual applications and polish layers. Each task builds incrementally so there is no orphaned code.

## Tasks

- [x] 1. Project scaffolding and core infrastructure
  - [x] 1.1 Initialize Vite + React + TypeScript project with TailwindCSS
    - Run `npm create vite@latest` with React-TS template
    - Install dependencies: `tailwindcss`, `zustand`, `react-rnd`, `framer-motion`, `fast-check`, `vitest`, `@testing-library/react`, `playwright`
    - Configure `tailwind.config.ts` with custom colors (cyberpunk palette), fonts (Space Grotesk, Orbitron)
    - Configure `vite.config.ts` with code splitting and test setup
    - Create directory structure: `src/components/`, `src/stores/`, `src/utils/`, `src/apps/`, `src/assets/`, `src/types/`
    - _Requirements: 11.3, 12.1, 12.2_

  - [x] 1.2 Define core TypeScript interfaces and types
    - Create `src/types/index.ts` with all interfaces: `WindowState`, `AppId`, `AppDefinition`, `Theme`, `ThemeName`, `Note`, `Track`, `FileSystemNode`, `TerminalEntry`
    - Create `src/types/stores.ts` with store interfaces: `WindowStore`, `ThemeStore`, `NotesStore`, `MusicStore`, `TerminalStore`
    - _Requirements: 4.1, 4.2, 5.3, 7.1, 9.9_

  - [x] 1.3 Create theme definitions and CSS custom properties
    - Create `src/utils/themes.ts` with cyberpunk, matrix, and aurora theme objects
    - Create base CSS with CSS custom properties mapped to theme colors
    - Add font-face declarations for Space Grotesk and Orbitron with `font-display: swap` and 3s timeout fallback
    - _Requirements: 10.3, 12.1, 12.2, 12.7_

  - [x] 1.4 Create utility functions (formatTime, clampPosition, extractTitle, circularBuffer, magneticEffect)
    - Create `src/utils/formatTime.ts` — `formatClock(date): string` and `formatDate(date): string`
    - Create `src/utils/clampPosition.ts` — ensures 50px title bar visibility within viewport
    - Create `src/utils/extractTitle.ts` — extracts first 50 chars of first line
    - Create `src/utils/circularBuffer.ts` — fixed-size FIFO buffer (max 30 entries)
    - Create `src/utils/magneticEffect.ts` — calculates icon offset (max 6px) toward cursor within 80px
    - _Requirements: 2.1, 4.9, 5.5, 8.1, 12.6_

  - [x] 1.5 Write property tests for utility functions
    - **Property 1: Clock formatting produces valid time strings**
    - **Property 8: Window position constraint keeps title bar visible**
    - **Property 10: Note title extraction**
    - **Property 15: Circular buffer invariant**
    - **Property 20: Magnetic dock icon offset constraint**
    - **Validates: Requirements 2.1, 4.9, 5.5, 8.1, 8.2, 8.3, 12.6**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. State management stores
  - [x] 3.1 Implement windowStore with Zustand
    - Create `src/stores/windowStore.ts`
    - Implement: `openWindow`, `closeWindow`, `minimizeWindow`, `maximizeWindow`, `restoreWindow`, `focusWindow`, `updatePosition`, `updateSize`
    - `openWindow` must check for existing window (no duplicates) and assign highest z-index
    - `maximizeWindow` must store previous bounds; `restoreWindow` must restore them
    - `updateSize` must enforce minimum 200×150px
    - `focusWindow` must assign z-index strictly greater than all others
    - _Requirements: 2.5, 4.1–4.9_

  - [x] 3.2 Write property tests for windowStore
    - **Property 2: No duplicate windows for the same application**
    - **Property 4: Minimum window size constraint**
    - **Property 5: Maximize/restore round-trip preserves bounds**
    - **Property 6: Close removes window from state**
    - **Property 7: Focused window gets highest z-index**
    - **Validates: Requirements 2.5, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8**

  - [x] 3.3 Implement themeStore with Zustand
    - Create `src/stores/themeStore.ts`
    - Implement `setTheme` that updates active theme and applies CSS custom properties to document root
    - Persist theme choice to localStorage under `nebula-theme`
    - Load saved theme on initialization
    - _Requirements: 10.3, 12.1_

  - [x] 3.4 Write property test for themeStore
    - **Property 19: Theme switching applies correct palette**
    - **Validates: Requirements 10.3**

  - [x] 3.5 Implement notesStore with Zustand
    - Create `src/stores/notesStore.ts`
    - Implement: `addNote`, `updateNote`, `deleteNote`, `setActiveNote`, `loadFromStorage`, `saveToStorage`
    - `addNote` defaults category to "Uncategorized" if not provided
    - `saveToStorage` wraps localStorage in try/catch, surfaces error state
    - `loadFromStorage` parses `nebula-notes` from localStorage
    - Debounced save (2s) on content update
    - _Requirements: 5.2, 5.3, 5.4, 5.7, 5.8, 5.9_

  - [x] 3.6 Write property tests for notesStore
    - **Property 9: Notes save/load round-trip**
    - **Property 11: Delete removes note from store and storage**
    - **Validates: Requirements 5.3, 5.4, 5.7**

  - [x] 3.7 Implement musicStore with Zustand
    - Create `src/stores/musicStore.ts`
    - Implement: `play`, `pause`, `next`, `previous`, `setVolume`
    - `next`/`previous` must wrap around playlist boundaries
    - `setVolume` must clamp to [0, 1]
    - Persist volume to localStorage under `nebula-music-volume`
    - _Requirements: 7.1, 7.2, 7.4, 7.6_

  - [x] 3.8 Write property tests for musicStore
    - **Property 13: Playlist index wrapping**
    - **Property 14: Volume clamping**
    - **Validates: Requirements 7.4, 7.6**

  - [x] 3.9 Implement terminalStore with Zustand
    - Create `src/stores/terminalStore.ts`
    - Implement: `executeCommand`, `clear`
    - Create `src/utils/commandParser.ts` with command registry (help, projects, about, music, clear, notes, ls, cd, matrix, hack, theme, secret)
    - Create `src/utils/filesystem.ts` with fake filesystem tree (3 directories, 5 files)
    - Case-insensitive command matching via `.toLowerCase()`
    - Unrecognized commands return "Command not found: [input]. Type 'help' for available commands."
    - _Requirements: 9.1–9.10_

  - [x] 3.10 Write property tests for terminalStore and command parser
    - **Property 12: Unrecognized input produces fallback response**
    - **Property 16: Terminal clear empties history**
    - **Property 17: Filesystem navigation correctness**
    - **Property 18: Case-insensitive command matching**
    - **Validates: Requirements 6.4, 9.5, 9.8, 9.9, 9.10**

- [x] 4. Checkpoint - Ensure all store tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Core desktop components
  - [x] 5.1 Implement App.tsx with boot/session routing
    - Check `sessionStorage` for `nebula-booted` flag
    - If not booted: render `BootScreen`; on complete set flag and transition to `Desktop`
    - If booted: render `Desktop` immediately
    - Wrap `BootScreen` in error boundary that skips to Desktop on failure
    - _Requirements: 1.4, 1.5, 1.6_

  - [x] 5.2 Implement BootScreen component
    - Sequential messages: "Initializing Nebula Core...", "Loading modules...", "Access granted." with 500–1000ms delays
    - Animated progress bar (0→100% over 2.5–3.5s) using CSS width transition
    - Glitch transition effect (≤500ms) on completion using Framer Motion
    - Set `sessionStorage` flag on complete
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 5.3 Implement Desktop layout component
    - Render `StatusBar`, `Dock`, `DesktopIcons`, `BackgroundRenderer`, `MouseGlow`, `WindowManager`
    - Responsive: full layout ≥1024px, bottom nav 768–1023px, full-screen cards <768px
    - _Requirements: 2.1–2.6, 13.1–13.5_

  - [x] 5.4 Implement StatusBar component
    - Real-time clock (HH:MM:SS) updated every 1s via `setInterval`
    - Current date in "weekday, month day" format
    - System indicators: active theme name, open window count
    - _Requirements: 2.1, 8.3_

  - [x] 5.5 Implement Dock component with magnetic hover effect
    - Vertical panel (left side) for ≥1024px; bottom bar for <1024px
    - One icon per app (Notes, AI Assistant, Music Player, System Monitor, Terminal)
    - Magnetic hover: shift icon ≤6px toward cursor within 80px, 200ms transition
    - Click: open app or bring existing window to foreground
    - Minimized window indicators
    - _Requirements: 2.2, 2.4, 2.5, 12.6, 13.2_

  - [x] 5.6 Implement BackgroundRenderer component
    - 3 semi-transparent blob elements with CSS keyframe animations (translate + scale)
    - Up to 50 particle elements with opacity animation
    - Pause on `visibilitychange` hidden, resume on visible
    - All elements: `pointer-events: none`, z-index below desktop layer
    - Only use transform and opacity for animations
    - _Requirements: 3.1–3.7, 11.1_

  - [x] 5.7 Write property test for BackgroundRenderer particle count
    - **Property 3: Particle count invariant**
    - **Validates: Requirements 3.3**

  - [x] 5.8 Implement MouseGlow component
    - Track cursor via `mousemove`
    - Render radial gradient (≤300px radius, ≤15% opacity)
    - Position via `transform: translate()`
    - _Requirements: 12.5_

- [x] 6. Window management system
  - [x] 6.1 Implement WindowManager component with react-rnd
    - Render all open (non-minimized) windows from windowStore
    - Each window wrapped in `<Rnd>` with drag (title bar handle) and resize (edges/corners)
    - Enforce min size 200×150px via react-rnd `minWidth`/`minHeight`
    - Clamp position on drag end using `clampPosition` utility
    - On focus (mousedown): call `focusWindow`
    - _Requirements: 4.1, 4.2, 4.7, 4.8, 4.9_

  - [x] 6.2 Implement Window chrome (title bar, controls, animations)
    - Title bar with app title and window control buttons (minimize, maximize, close)
    - Minimize: animate to dock (300ms) via Framer Motion, call `minimizeWindow`
    - Maximize/restore: animate expand/shrink (300ms), call `maximizeWindow`/`restoreWindow`
    - Close: call `closeWindow`
    - Glassmorphism surface: 10–20% opacity background, backdrop-blur ≤12px
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 12.4_

  - [x] 6.3 Implement responsive window behavior
    - ≥1024px: standard draggable/resizable windows
    - 768–1023px: windows open centered, still draggable
    - <768px: full-screen card mode, bottom tab bar for switching
    - Touch input support for <1024px
    - _Requirements: 13.1, 13.3, 13.4, 13.5_

- [x] 7. Checkpoint - Ensure desktop and window system work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Application implementations
  - [x] 8.1 Implement NotesApp (lazy-loaded)
    - Wrap in `React.lazy()` + `Suspense`
    - Sidebar: note list grouped by category, title (first 50 chars), last-modified timestamp
    - Editor: textarea with debounced save (2s) to localStorage
    - Preview pane: markdown rendering (use `react-markdown` or `marked`)
    - Category assignment on creation (default "Uncategorized")
    - Delete action removes from store and localStorage
    - Error handling for storage failures
    - Max 100,000 characters per note
    - _Requirements: 5.1–5.9, 11.3, 11.5_

  - [x] 8.2 Implement AIAssistant (lazy-loaded)
    - Wrap in `React.lazy()` + `Suspense`
    - Chat interface: user messages right-aligned, assistant left-aligned
    - Typing animation (500–2000ms) before response display
    - Predefined responses for: greetings, help, about, commands
    - Command recognition: "open notes" → open Notes window, "play music" → start playback
    - Fallback response for unrecognized queries suggesting available commands
    - Glowing border animation (CSS box-shadow cycle through accent colors)
    - _Requirements: 6.1–6.6, 11.3, 11.5_

  - [x] 8.3 Implement MusicPlayer (lazy-loaded)
    - Wrap in `React.lazy()` + `Suspense`
    - Playlist of ≥3 lofi/ambient tracks with title and artist display
    - Play/pause with vinyl rotation animation (CSS transform rotate)
    - Waveform visualizer: Web Audio API AnalyserNode → canvas draw at 30fps+
    - Next/previous with playlist wrapping
    - Volume slider (0–100%) with immediate gain update
    - Blurred album background (backdrop-blur ≤12px)
    - Audio element persists outside window DOM for uninterrupted playback when minimized
    - _Requirements: 7.1–7.7, 11.3, 11.5_

  - [x] 8.4 Implement SystemMonitor (lazy-loaded)
    - Wrap in `React.lazy()` + `Suspense`
    - CPU/RAM graphs: circular buffer (30 points), updated every 2s, simulated random walk 0–100%
    - Neon-styled SVG line graphs with animated path transitions (300–500ms easing)
    - Real-time clock (24h, updated every 1s)
    - Weather display: fetch from OpenWeatherMap with 3s AbortController timeout
    - Fallback "Weather unavailable" with retry button on failure
    - Counter value transitions (300–500ms easing)
    - _Requirements: 8.1–8.6, 11.3, 11.5_

  - [x] 8.5 Implement Terminal (lazy-loaded)
    - Wrap in `React.lazy()` + `Suspense`
    - Command input with history navigation (up/down arrows)
    - Command registry: help, projects, about, music, clear, notes, ls, cd, matrix, hack, theme, secret
    - Animated typing output (20–50 chars/sec via requestAnimationFrame)
    - Fake filesystem navigation (ls, cd)
    - Case-insensitive matching
    - Error format: "Command not found: [input]. Type 'help' for available commands."
    - _Requirements: 9.1–9.10, 11.3, 11.5_

  - [x] 8.6 Write unit tests for application components
    - Test NotesApp markdown rendering for specific inputs
    - Test AIAssistant command recognition and fallback
    - Test MusicPlayer play/pause state transitions
    - Test Terminal command outputs (help, projects, about)
    - Test error state displays (storage failure, network failure)
    - _Requirements: 5.1, 6.2, 6.3, 6.4, 7.2, 9.1–9.4, 9.8_

- [x] 9. Checkpoint - Ensure all apps render and function
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Hidden features and easter eggs
  - [x] 10.1 Implement matrix rain overlay
    - Full-screen canvas overlay (z-index 1000) with falling green characters
    - Triggered by "matrix" command in Terminal
    - Runs until "exit" typed or Terminal closed
    - Allow interaction with windows beneath overlay (`pointer-events: none` on canvas, controls remain interactive)
    - _Requirements: 10.1, 10.5_

  - [x] 10.2 Implement hack sequence animation
    - Triggered by "hack" command in Terminal
    - Display ≥10 animated log entries over 5–15 seconds
    - End with "Access Granted" or "Connection Established"
    - Typing effect for each line
    - _Requirements: 10.2_

  - [x] 10.3 Implement theme switching via terminal command
    - "theme cyberpunk", "theme matrix", "theme aurora" commands
    - Call `themeStore.setTheme()` within 500ms
    - Visual feedback in terminal output
    - _Requirements: 10.3_

  - [x] 10.4 Implement secret room window
    - Triggered by "secret" command in Terminal
    - Opens a hidden window with unique interactive content
    - Not accessible through any other navigation path (no dock icon, no desktop icon)
    - At least one interactive element inside
    - _Requirements: 10.4_

- [x] 11. Performance optimization and polish
  - [x] 11.1 Apply React.memo, useMemo, useCallback optimizations
    - Wrap all components that receive stable props in `React.memo()`
    - Memoize expensive computations (markdown parsing, filesystem traversal)
    - Use `useCallback` for event handlers passed as props
    - _Requirements: 11.2_

  - [x] 11.2 Add CSS `@supports` fallback for backdrop-filter
    - Check `CSS.supports('backdrop-filter', 'blur(1px)')`
    - If unsupported: apply solid `rgba()` backgrounds without blur
    - Ensure all backdrop-blur values ≤12px
    - _Requirements: 11.4, 11.9, 12.4_

  - [x] 11.3 Implement desktop icons component
    - Clickable icons with recognizable graphics and text labels
    - Click opens corresponding app or brings existing window to foreground
    - Zero CLS: fixed positioning, no layout shifts on widget updates
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [x] 11.4 Add responsive touch support and mobile layout
    - Touch input for all interactive elements below 1024px
    - Bottom tab bar for <768px full-screen card mode
    - Ensure all features remain accessible at all breakpoints
    - _Requirements: 13.3, 13.4, 13.5_

  - [x] 11.5 Add hover transitions and animation timing
    - Hover transitions: 200ms duration
    - Page transitions: 500ms
    - Modal animations: 300ms
    - All motion uses transform/opacity only (except color hover states)
    - _Requirements: 11.1, 12.3_

- [x] 12. Integration and wiring
  - [x] 12.1 Wire cross-app commands (Terminal → Music, Terminal → Notes, AI → apps)
    - Terminal "music" command triggers musicStore.play()
    - Terminal "notes" command opens Notes window via windowStore.openWindow('notes')
    - AI Assistant "open notes" / "play music" commands trigger corresponding actions
    - _Requirements: 6.3, 9.4, 9.6_

  - [x] 12.2 Wire app registry and lazy loading
    - Create `src/apps/registry.ts` with `AppDefinition` for each app
    - Each app uses `React.lazy(() => import('./apps/...'))` 
    - Suspense fallback with loading indicator
    - Verify all lazy-loaded chunks are generated in build
    - _Requirements: 11.3, 11.5_

  - [x] 12.3 Add audio persistence (music continues when minimized)
    - Audio element rendered at App level (outside window DOM)
    - MusicPlayer component controls audio via ref/store
    - Playback uninterrupted when window minimized or unfocused
    - Handle autoplay policy: "Click to enable audio" prompt on play() rejection
    - Track load failure: skip to next track, show error indicator
    - _Requirements: 7.7_

  - [x] 12.4 Write integration tests with Playwright
    - Test full boot sequence → Desktop render flow
    - Test window drag/resize interactions
    - Test cross-app commands (terminal → music, terminal → notes)
    - Test responsive layout at 1024px, 768px, and 375px breakpoints
    - Test theme switching end-to-end
    - _Requirements: 1.1–1.6, 4.1–4.9, 9.4, 9.6, 10.3, 13.1–13.3_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (20 properties total)
- Unit tests validate specific examples and edge cases
- All applications are lazy-loaded for performance
- Audio element lives outside window DOM to persist playback across minimize/close
- The tech stack is: React, Vite, TailwindCSS, Zustand, react-rnd, Framer Motion, fast-check, Vitest, Playwright

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4"] },
    { "id": 3, "tasks": ["1.5", "3.1", "3.3", "3.5", "3.7", "3.9"] },
    { "id": 4, "tasks": ["3.2", "3.4", "3.6", "3.8", "3.10"] },
    { "id": 5, "tasks": ["5.1", "5.4", "5.6", "5.8"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.5", "5.7"] },
    { "id": 7, "tasks": ["6.1", "6.2"] },
    { "id": 8, "tasks": ["6.3"] },
    { "id": 9, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 10, "tasks": ["8.6"] },
    { "id": 11, "tasks": ["10.1", "10.2", "10.3", "10.4"] },
    { "id": 12, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5"] },
    { "id": 13, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 14, "tasks": ["12.4"] }
  ]
}
```
