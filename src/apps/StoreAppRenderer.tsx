import { useState, useCallback, memo } from 'react';
import type { AppManifest } from '../types/appManifest';

interface StoreAppRendererProps {
  manifest: AppManifest;
}

/**
 * StoreAppRenderer — renders installed store apps in a sandboxed iframe.
 * - "web" type: sets iframe src to the manifest URL
 * - "html" type: uses srcdoc with the manifest's inline HTML
 */
const StoreAppRenderer = memo(function StoreAppRenderer({ manifest }: StoreAppRendererProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full flex-col gap-3" style={{ color: 'var(--theme-text)' }}>
        <span className="text-3xl">⚠️</span>
        <p className="text-sm opacity-70">Failed to load "{manifest.name}"</p>
        <p className="text-xs opacity-50">The app content could not be rendered.</p>
      </div>
    );
  }

  const iframeProps = manifest.type === 'web'
    ? { src: manifest.url }
    : { srcDoc: manifest.html };

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--theme-background)' }}>
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}
          />
        </div>
      )}
      <iframe
        {...iframeProps}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        title={manifest.name}
        onLoad={handleLoad}
        onError={handleError}
        style={{ backgroundColor: '#fff' }}
      />
    </div>
  );
});

export default StoreAppRenderer;
