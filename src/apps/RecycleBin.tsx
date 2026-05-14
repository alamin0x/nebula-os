import { useCallback } from 'react';
import { useRecycleBinStore } from '../stores/recycleBinStore';
import { useDesktopStore } from '../stores/desktopStore';

/**
 * RecycleBin app — shows deleted desktop items with options to restore or permanently delete.
 */
export default function RecycleBin() {
  const items = useRecycleBinStore((s) => s.items);
  const restore = useRecycleBinStore((s) => s.restore);
  const emptyTrash = useRecycleBinStore((s) => s.emptyTrash);
  const showApp = useDesktopStore((s) => s.showApp);

  const handleRestore = useCallback(
    (id: string, appId: string) => {
      restore(id);
      showApp(appId);
    },
    [restore, showApp]
  );

  const handleEmptyTrash = useCallback(() => {
    emptyTrash();
  }, [emptyTrash]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div
      className="flex flex-col h-full w-full p-4 overflow-hidden"
      style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">🗑️ Recycle Bin</h1>
        {items.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            Empty Trash
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <span className="text-4xl mb-3">🗑️</span>
            <p className="text-sm">Trash is empty</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <span className="text-2xl" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs opacity-50">
                    Removed {formatDate(item.removedAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(item.id, item.appId)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    color: 'var(--theme-primary)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
