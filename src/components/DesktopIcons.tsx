import { useCallback, memo } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import type { AppId } from '../types';

interface DesktopIcon {
  id: AppId;
  title: string;
  icon: string;
}

const BUILT_IN_DESKTOP_ICONS: DesktopIcon[] = [
  { id: 'browser', title: 'Browser', icon: '🌐' },
  { id: 'notes', title: 'Notes', icon: '📝' },
  { id: 'terminal', title: 'Terminal', icon: '💻' },
  { id: 'music-player', title: 'Music Player', icon: '🎵' },
  { id: 'system-monitor', title: 'System Monitor', icon: '📊' },
  { id: 'app-store', title: 'App Store', icon: '🏪' },
];

/**
 * DesktopIcons component — displays clickable app icons on the desktop surface.
 * Icons are arranged in a vertical grid and open the corresponding window on double-click.
 * Dynamically includes installed store apps.
 */
export const DesktopIcons = memo(function DesktopIcons() {
  const openWindow = useWindowStore((state) => state.openWindow);
  const installedApps = useInstalledAppsStore((state) => state.apps);

  const allIcons: DesktopIcon[] = [
    ...BUILT_IN_DESKTOP_ICONS,
    ...installedApps.map((a) => ({ id: a.id as AppId, title: a.name, icon: a.icon })),
  ];

  const handleDoubleClick = useCallback(
    (appId: AppId) => {
      openWindow(appId);
    },
    [openWindow]
  );

  return (
    <div
      className="absolute top-14 left-20 bottom-14 z-10 flex flex-col flex-wrap content-start gap-2 p-4 lg:left-20 max-lg:left-4"
      data-testid="desktop-icons"
    >
      {allIcons.map((app) => (
        <button
          key={app.id}
          onDoubleClick={() => handleDoubleClick(app.id)}
          className="
            flex flex-col items-center justify-center gap-1
            w-20 h-20 rounded-lg
            transition-all duration-200 ease-out
            hover:bg-[var(--theme-surface)]
            focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]
            cursor-pointer select-none
          "
          data-testid={`desktop-icon-${app.id}`}
          aria-label={`Open ${app.title}`}
          title={`Double-click to open ${app.title}`}
        >
          <span className="text-3xl" aria-hidden="true">
            {app.icon}
          </span>
          <span
            className="text-xs text-center leading-tight max-w-[72px] truncate"
            style={{ color: 'var(--theme-text)' }}
          >
            {app.title}
          </span>
        </button>
      ))}
    </div>
  );
});
