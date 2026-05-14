import { useState, useCallback, useRef, memo } from 'react';

const BOOKMARKS = [
  { title: 'Google', url: 'https://www.google.com/webhp?igu=1' },
  { title: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Main_Page' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'MDN', url: 'https://developer.mozilla.org' },
  { title: 'YouTube', url: 'https://www.youtube.com/embed' },
];

const DEFAULT_URL = 'https://www.google.com/webhp?igu=1';

/**
 * Browser — a working web browser using an iframe.
 * Features: URL bar, navigation (back/forward/refresh), bookmarks.
 * Note: Some sites block iframe embedding (X-Frame-Options), so not all URLs will load.
 * Google's "igu=1" parameter allows embedding in iframes.
 */
const Browser = memo(function Browser() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [inputValue, setInputValue] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([DEFAULT_URL]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = useCallback((newUrl: string) => {
    let finalUrl = newUrl.trim();
    
    // Add https:// if no protocol specified
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      // If it looks like a URL (has a dot), add https://
      if (finalUrl.includes('.')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        // Otherwise treat as a Google search
        finalUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(finalUrl)}`;
      }
    }

    setUrl(finalUrl);
    setInputValue(finalUrl);
    setIsLoading(true);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(finalUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    navigate(inputValue);
  }, [inputValue, navigate]);

  const handleBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setInputValue(history[newIndex]);
      setIsLoading(true);
    }
  }, [history, historyIndex]);

  const handleForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setInputValue(history[newIndex]);
      setIsLoading(true);
    }
  }, [history, historyIndex]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  }, [url]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--theme-surface)', background: 'rgba(0,0,0,0.3)' }}
      >
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30 transition-colors duration-200"
            style={{ color: 'var(--theme-text)' }}
            aria-label="Go back"
            title="Back"
          >
            ←
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 disabled:opacity-30 transition-colors duration-200"
            style={{ color: 'var(--theme-text)' }}
            aria-label="Go forward"
            title="Forward"
          >
            →
          </button>
          <button
            onClick={handleRefresh}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors duration-200"
            style={{ color: 'var(--theme-text)' }}
            aria-label="Refresh page"
            title="Refresh"
          >
            ↻
          </button>
        </div>

        {/* URL bar */}
        <form onSubmit={handleSubmit} className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md text-sm outline-none transition-colors duration-200"
            style={{
              backgroundColor: 'var(--theme-surface)',
              color: 'var(--theme-text)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            placeholder="Enter URL or search..."
            aria-label="URL address bar"
          />
        </form>
      </div>

      {/* Bookmarks bar */}
      <div
        className="flex items-center gap-1 px-3 py-1 border-b overflow-x-auto shrink-0"
        style={{ borderColor: 'var(--theme-surface)', background: 'rgba(0,0,0,0.2)' }}
      >
        {BOOKMARKS.map((bookmark) => (
          <button
            key={bookmark.url}
            onClick={() => navigate(bookmark.url)}
            className="px-2 py-0.5 rounded text-xs whitespace-nowrap hover:bg-white/10 transition-colors duration-200"
            style={{ color: 'var(--theme-text)', opacity: 0.8 }}
            title={bookmark.url}
          >
            {bookmark.title}
          </button>
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div
          className="h-0.5 w-full overflow-hidden shrink-0"
          style={{ backgroundColor: 'var(--theme-surface)' }}
        >
          <div
            className="h-full animate-pulse"
            style={{
              width: '40%',
              backgroundColor: 'var(--theme-primary)',
              animation: 'loading-bar 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Iframe content */}
      <div className="flex-1 relative min-h-0">
        <iframe
          ref={iframeRef}
          src={url}
          onLoad={handleIframeLoad}
          className="absolute inset-0 w-full h-full border-none"
          style={{ backgroundColor: '#fff' }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
          title="Browser content"
          aria-label="Web page content"
        />
      </div>

      {/* Loading bar animation */}
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
});

export default Browser;
