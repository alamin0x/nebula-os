import { useState, useCallback, memo } from 'react';
import { listDirectory, resolveNode, getFileContent } from '../utils/filesystem';
import type { FileSystemNode } from '../types';

/**
 * FileExplorer — visual file manager using the virtual filesystem.
 * Breadcrumb path at top, grid of folders/files, click to navigate or preview.
 */
const FileExplorer = memo(function FileExplorer() {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const entries = listDirectory(currentPath);
  const currentNode = resolveNode(currentPath);

  const handleNavigate = useCallback((name: string) => {
    const newPath = [...currentPath, name];
    const node = resolveNode(newPath);
    if (node && node.type === 'directory') {
      setCurrentPath(newPath);
      setPreviewContent(null);
    }
  }, [currentPath]);

  const handleFileClick = useCallback((name: string) => {
    const content = getFileContent(currentPath, name);
    if (content !== null) {
      setPreviewName(name);
      setPreviewContent(content);
    }
  }, [currentPath]);

  const handleBack = useCallback(() => {
    if (previewContent !== null) {
      setPreviewContent(null);
      return;
    }
    if (currentPath.length > 0) {
      setCurrentPath((prev) => prev.slice(0, -1));
    }
  }, [currentPath, previewContent]);

  const handleBreadcrumb = useCallback((index: number) => {
    setCurrentPath((prev) => prev.slice(0, index));
    setPreviewContent(null);
  }, []);

  const getChildNodes = useCallback((): FileSystemNode[] => {
    if (!currentNode || currentNode.type !== 'directory' || !currentNode.children) {
      return [];
    }
    return currentNode.children;
  }, [currentNode]);

  const childNodes = getChildNodes();

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--theme-surface)' }}>
        <button
          onClick={handleBack}
          disabled={currentPath.length === 0 && previewContent === null}
          className="px-2 py-1 rounded text-sm transition-colors disabled:opacity-30"
          style={{ backgroundColor: 'var(--theme-surface)' }}
          aria-label="Go back"
        >
          ← Back
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm overflow-x-auto min-w-0">
          <button
            onClick={() => handleBreadcrumb(0)}
            className="hover:underline opacity-70 hover:opacity-100 shrink-0"
          >
            ~/home
          </button>
          {currentPath.map((segment, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              <span className="opacity-40">/</span>
              <button
                onClick={() => handleBreadcrumb(i + 1)}
                className="hover:underline opacity-70 hover:opacity-100"
              >
                {segment}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {previewContent !== null ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium opacity-70">📄 {previewName}</h3>
            <pre
              className="text-sm whitespace-pre-wrap p-3 rounded-lg overflow-auto"
              style={{ backgroundColor: 'var(--theme-surface)' }}
            >
              {previewContent}
            </pre>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {childNodes.map((node) => (
              <button
                key={node.name}
                onClick={() =>
                  node.type === 'directory'
                    ? handleNavigate(node.name)
                    : handleFileClick(node.name)
                }
                className="flex flex-col items-center gap-1 p-3 rounded-lg transition-all hover:bg-[var(--theme-surface)] cursor-pointer"
              >
                <span className="text-3xl" aria-hidden="true">
                  {node.type === 'directory' ? '📁' : '📄'}
                </span>
                <span className="text-xs text-center leading-tight max-w-[80px] truncate">
                  {node.name}
                </span>
              </button>
            ))}
            {childNodes.length === 0 && entries !== null && (
              <p className="col-span-full text-sm opacity-50 text-center py-8">
                This folder is empty
              </p>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className="px-3 py-1 text-xs opacity-60 border-t"
        style={{ borderColor: 'var(--theme-surface)' }}
      >
        {entries ? `${entries.length} items` : 'Invalid path'}
      </div>
    </div>
  );
});

export default FileExplorer;
