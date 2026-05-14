# 🌌 Nebula OS

A futuristic browser-based desktop operating system built with React, TypeScript, Vite, and TailwindCSS.

### 🔗 [Live Demo → nebula-os-sigma.vercel.app](https://nebula-os-sigma.vercel.app)

![Nebula OS](https://img.shields.io/badge/Nebula_OS-v1.0.0-8B5CF6?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

## ✨ Features

### 🖥️ Desktop Environment
- **Boot Sequence** — Animated ASCII art boot screen with progress bar and glitch transition
- **Window Management** — Draggable, resizable windows with minimize/maximize/close (powered by react-rnd)
- **Dock** — macOS-style app launcher with magnetic hover effect (icons shift toward cursor)
- **Desktop Icons** — Double-click to open apps, auto-arranged in columns
- **Status Bar** — Real-time clock, date, theme indicator, and window count
- **Mouse Glow** — Subtle radial gradient that follows your cursor
- **Animated Background** — Particle canvas + floating blobs with theme-reactive colors

### 🎨 Themes
Switch between 3 cyberpunk-inspired themes via the terminal:
- **Cyberpunk** (purple/cyan/pink) — default
- **Matrix** (green/dark) — hacker vibes
- **Aurora** (indigo/violet/cyan) — calm and elegant

### 📱 Built-in Apps
| App | Description |
|-----|-------------|
| 🌐 **Browser** | Working web browser with URL bar, bookmarks, and navigation |
| 📝 **Notes** | Note-taking app with categories, localStorage persistence |
| 🤖 **AI Assistant** | Chat interface with command recognition (opens apps, plays music) |
| 🎵 **Music Player** | Lo-fi music player with vinyl animation, volume control |
| 📊 **System Monitor** | Real-time CPU/Memory/Network graphs (simulated) |
| 💻 **Terminal** | Command-line with filesystem, theme switching, easter eggs |
| 🏪 **App Store** | Install/uninstall apps, import custom .nebula apps |
| 🔮 **Secret Room** | Hidden easter egg (type `secret` in terminal) |

### 🏪 App Store
- Browse and install apps from the built-in catalog
- **6 pre-built apps**: Calculator, Clock, Snake Game, Paint, Pomodoro Timer, Color Picker
- **Custom app import**: Paste JSON manifests or upload `.nebula` files
- Installed apps appear in the Dock and Desktop automatically
- Apps persist across page refreshes (localStorage)

### 🎮 Easter Eggs
Type these in the Terminal:
- `matrix` — Matrix rain animation overlay
- `hack` — Fake hacking sequence with typing effect
- `secret` — Opens the hidden Secret Room with a mini-game

### 📱 Responsive Design
- **Desktop (≥1024px)** — Full window management with drag/resize
- **Tablet (768-1024px)** — Centered windows, constrained to 80% viewport
- **Mobile (<768px)** — Full-screen card mode with tab bar for switching

### ⚡ Performance
- React.memo, useMemo, useCallback throughout
- Code splitting via React.lazy (each app is a separate chunk)
- CSS animations use only transform/opacity (GPU-accelerated)
- `@media (prefers-reduced-motion)` support
- Glassmorphism with `@supports` fallback for older browsers

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests (388 tests)
npm test

# Build for production
npm run build
```

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: TailwindCSS 4 + CSS Custom Properties
- **State Management**: Zustand
- **Window System**: react-rnd (drag & resize)
- **Animations**: Framer Motion + CSS Keyframes
- **Testing**: Vitest + React Testing Library + fast-check (property-based)
- **Fonts**: Space Grotesk + Orbitron

## 📁 Project Structure

```
src/
├── apps/           # Application components (Notes, Terminal, Browser, etc.)
├── components/     # UI components (Desktop, Dock, WindowManager, etc.)
├── stores/         # Zustand state stores
├── types/          # TypeScript interfaces and types
├── utils/          # Utility functions (formatTime, circularBuffer, etc.)
└── integration/    # Integration tests
```

## 🎯 Custom App Format (.nebula)

Create your own apps with a JSON manifest:

```json
{
  "id": "my-custom-app",
  "name": "My App",
  "icon": "⚡",
  "description": "A custom app for Nebula OS",
  "type": "html",
  "html": "<html><body><h1>Hello Nebula!</h1></body></html>"
}
```

Save as `.nebula` file and upload via the App Store, or paste the JSON directly.

**Supported types:**
- `"html"` — Inline HTML/CSS/JS rendered in a sandboxed iframe
- `"web"` — External URL loaded in an iframe

## 📄 License

MIT

---

*Built with ♥ and a lot of caffeine ☕*
