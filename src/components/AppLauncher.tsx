import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import type { AppId } from '../types';

interface LauncherApp {
  id: AppId;
  title: string;
  icon: string;
}

const BUILT_IN_APPS: LauncherApp[] = [
  { id: 'browser', title: 'Browser', icon: '🌐' },
  { id: 'notes', title: 'Notes', icon: '📝' },
  { id: 'ai-assistant', title: 'AI Assistant', icon: '🤖' },
  { id: 'music-player', title: 'Music Player', icon: '🎵' },
  { id: 'system-monitor', title: 'System Monitor', icon: '📊' },
  { id: 'terminal', title: 'Terminal', icon: '💻' },
  { id: 'app-store', title: 'App Store', icon: '🏪' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
  { id: 'file-explorer', title: 'File Explorer', icon: '📂' },
  { id: 'calendar', title: 'Calendar', icon: '📅' },
  { id: 'weather', title: 'Weather', icon: '🌤️' },
  { id: 'text-editor', title: 'Text Editor', icon: '✏️' },
  { id: 'task-manager', title: 'Task Manager', icon: '📋' },
];

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AppLauncher — full-screen overlay launcher (GNOME Activities style).
 * Shows a search bar and grid of all apps. Typing filters by name.
 * Clicking an app opens it and closes the launcher.
 */
const AppLauncher = memo(function AppLauncher({ isOpen, onClose }: AppLauncherProps) {
  const [search, setSearch] = useState('');
  const openWindow = useWindowStore((s) => s.openWindow);
  const installedApps = useInstalledAppsStore((s) => s.apps);
  const inputRef = useRef<HTMLInputElement>(null);

  const allApps: LauncherApp[] = [
    ...BUILT_IN_APPS,
    ...installedApps.map((a) => ({ id: a.id as AppId, title: a.name, icon: a.icon })),
  ];

  const filteredApps = search.trim()
    ? allApps.filter((app) => app.title.toLowerCase().includes(search.toLowerCase()))
    : allApps;

  const handleAppClick = useCallback((appId: AppId) => {
    openWindow(appId);
    onClose();
    setSearch('');
  }, [openWindow, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      setSearch('');
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus search input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1500] flex flex-col items-center pt-20"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
      data-testid="app-launcher"
    >
      <div
        className="w-full max-w-2xl px-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div
          className="rounded-xl px-4 py-3 mb-8 border"
          style={{
            backgroundColor: 'rgba(20, 20, 35, 0.8)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications..."
            className="w-full bg-transparent outline-none text-base"
            style={{
              color: 'var(--theme-text)',
              caretColor: 'var(--theme-primary)',
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* App grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:bg-white/10"
            >
              <span className="text-4xl" aria-hidden="true">{app.icon}</span>
              <span
                className="text-xs text-center leading-tight max-w-[80px] truncate"
                style={{ color: 'var(--theme-text)' }}
              >
                {app.title}
              </span>
            </button>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <p className="text-center text-sm opacity-50 mt-8" style={{ color: 'var(--theme-text)' }}>
            No applications found
          </p>
        )}
      </div>
    </div>
  );
});

export default AppLauncher;
