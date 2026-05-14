import { lazy, Suspense, memo } from 'react';
import type { AppId } from '../types';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import StoreAppRenderer from './StoreAppRenderer';

/** Built-in app IDs that have lazy-loaded components */
const BUILT_IN_IDS = ['notes', 'ai-assistant', 'music-player', 'system-monitor', 'terminal', 'secret-room', 'browser', 'app-store'];

/**
 * Lazy-loaded app component map.
 * Each app is loaded on-demand via React.lazy() for code splitting.
 */
const appComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'notes': lazy(() => import('./NotesApp')),
  'ai-assistant': lazy(() => import('./AIAssistant')),
  'music-player': lazy(() => import('./MusicPlayer')),
  'system-monitor': lazy(() => import('./SystemMonitor')),
  'terminal': lazy(() => import('./Terminal')),
  'secret-room': lazy(() => import('./SecretRoom')),
  'browser': lazy(() => import('./Browser')),
  'app-store': lazy(() => import('./AppStore')),
};

/**
 * Loading fallback displayed while a lazy-loaded app chunk is being fetched.
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full w-full" data-testid="app-loading">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}
        />
        <span className="text-sm opacity-60" style={{ color: 'var(--theme-text)' }}>
          Loading...
        </span>
      </div>
    </div>
  );
}

interface AppRendererProps {
  appId: AppId;
}

/**
 * AppRenderer — resolves the lazy-loaded component for a given AppId
 * and wraps it in React.Suspense with a loading fallback.
 * For dynamic store apps (not built-in), renders via StoreAppRenderer.
 */
const AppRenderer = memo(function AppRenderer({ appId }: AppRendererProps) {
  const LazyComponent = appComponents[appId];
  const storeApp = useInstalledAppsStore((s) => s.apps.find((a) => a.id === appId));

  // Built-in app — use lazy-loaded component
  if (LazyComponent) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent />
      </Suspense>
    );
  }

  // Dynamic store app — render via iframe
  if (storeApp) {
    return <StoreAppRenderer manifest={storeApp} />;
  }

  return (
    <div className="flex items-center justify-center h-full w-full">
      <span className="text-sm opacity-50" style={{ color: 'var(--theme-text)' }}>
        Unknown application: {appId}
      </span>
    </div>
  );
});

export { appComponents, AppRenderer };
