import { lazy, Suspense, memo, Component } from 'react';
import type { AppId } from '../types';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import StoreAppRenderer from './StoreAppRenderer';

/**
 * Error boundary that catches lazy-load failures and shows an error message.
 */
class AppErrorBoundary extends Component<
  { children: React.ReactNode; appId: string },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode; appId: string }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full flex-col gap-2 p-4">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
            Failed to load app
          </p>
          <p className="text-xs opacity-50 text-center" style={{ color: 'var(--theme-text)' }}>
            {this.state.error}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  'settings': lazy(() => import('./Settings')),
  'file-explorer': lazy(() => import('./FileExplorer')),
  'calendar': lazy(() => import('./Calendar')),
  'weather': lazy(() => import('./Weather')),
  'text-editor': lazy(() => import('./TextEditor')),
  'task-manager': lazy(() => import('./TaskManager')),
  'recycle-bin': lazy(() => import('./RecycleBin')),
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
      <AppErrorBoundary appId={appId}>
        <Suspense fallback={<LoadingFallback />}>
          <LazyComponent />
        </Suspense>
      </AppErrorBoundary>
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
