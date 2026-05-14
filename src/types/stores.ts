import type { AppId, Note, Position, Size, TerminalEntry, ThemeName, Track, WindowState } from './index';

// Window store
export interface WindowStore {
  windows: WindowState[];
  activeWindowId: string | null;
  openWindow: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updatePosition: (id: string, position: Position) => void;
  updateSize: (id: string, size: Size) => void;
}

// Theme store
export interface ThemeStore {
  activeTheme: ThemeName;
  setTheme: (name: ThemeName) => void;
}

// Notes store
export interface NotesStore {
  notes: Note[];
  activeNoteId: string | null;
  addNote: (category?: string) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

// Music store
export interface MusicStore {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  progress: number;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  startProgressSimulation: () => void;
  stopProgressSimulation: () => void;
}

// Terminal store
export interface TerminalStore {
  history: TerminalEntry[];
  currentPath: string[];
  hackActive: boolean;
  matrixRainActive: boolean;
  executeCommand: (input: string) => void;
  clear: () => void;
  setHackActive: (active: boolean) => void;
  setMatrixRainActive: (active: boolean) => void;
}
