import type React from 'react';

// Helper types
export type Position = { x: number; y: number };
export type Size = { width: number; height: number };

// App registry
export type BuiltInAppId = 'notes' | 'ai-assistant' | 'music-player' | 'system-monitor' | 'terminal' | 'secret-room' | 'browser' | 'app-store' | 'settings' | 'file-explorer' | 'calendar' | 'weather' | 'text-editor' | 'task-manager' | 'recycle-bin';
export type AppId = BuiltInAppId | (string & {});

// Window state
export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  position: Position;
  size: Size;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  previousBounds?: { position: Position; size: Size };
}

// App definition
export interface AppDefinition {
  id: AppId;
  title: string;
  icon: React.ComponentType;
  component: React.LazyExoticComponent<React.ComponentType>;
  defaultSize: Size;
}

// Theme
export type ThemeName = 'cyberpunk' | 'matrix' | 'aurora';

export interface Theme {
  name: ThemeName;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
}

// Notes
export interface Note {
  id: string;
  content: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}

// Music
export interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  albumArt?: string;
}

// Terminal / Filesystem
export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileSystemNode[];
  content?: string;
}

export interface TerminalEntry {
  id: string;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: number;
}
