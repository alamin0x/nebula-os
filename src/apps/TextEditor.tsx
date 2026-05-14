import { useState, useCallback, useEffect, memo } from 'react';

const STORAGE_KEY = 'nebula-editor-files';

interface EditorFile {
  name: string;
  content: string;
}

function loadFiles(): EditorFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as EditorFile[];
    }
  } catch {
    // ignore parse errors
  }
  return [{ name: 'untitled.txt', content: '' }];
}

function saveFiles(files: EditorFile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

/**
 * TextEditor — simple text editor with localStorage persistence.
 * Toolbar: New, Save, file switcher. Status bar: line/char count.
 */
const TextEditor = memo(function TextEditor() {
  const [files, setFiles] = useState<EditorFile[]>(loadFiles);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeFile = files[activeIndex] || { name: 'untitled.txt', content: '' };

  // Sync files to localStorage whenever they change
  useEffect(() => {
    saveFiles(files);
  }, [files]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setFiles((prev) =>
        prev.map((f, i) => (i === activeIndex ? { ...f, content: newContent } : f))
      );
    },
    [activeIndex]
  );

  const handleNew = useCallback(() => {
    const name = `untitled-${Date.now().toString(36)}.txt`;
    setFiles((prev) => [...prev, { name, content: '' }]);
    setActiveIndex(files.length);
  }, [files.length]);

  const handleSave = useCallback(() => {
    saveFiles(files);
  }, [files]);

  const handleFileSwitch = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveIndex(Number(e.target.value));
  }, []);

  const lineCount = activeFile.content.split('\n').length;
  const charCount = activeFile.content.length;

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: 'var(--theme-surface)' }}
      >
        <button
          onClick={handleNew}
          className="px-2 py-1 rounded text-xs transition-colors hover:opacity-80"
          style={{ backgroundColor: 'var(--theme-surface)' }}
        >
          New
        </button>
        <button
          onClick={handleSave}
          className="px-2 py-1 rounded text-xs transition-colors hover:opacity-80"
          style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-background)' }}
        >
          Save
        </button>
        <select
          value={activeIndex}
          onChange={handleFileSwitch}
          className="ml-auto px-2 py-1 rounded text-xs bg-transparent border"
          style={{ borderColor: 'var(--theme-surface)', color: 'var(--theme-text)' }}
        >
          {files.map((f, i) => (
            <option key={i} value={i} style={{ backgroundColor: 'var(--theme-background)' }}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div
          className="py-3 px-2 text-right select-none overflow-hidden shrink-0"
          style={{
            backgroundColor: 'var(--theme-surface)',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            lineHeight: '1.5rem',
            opacity: 0.5,
            minWidth: '3rem',
          }}
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={activeFile.content}
          onChange={handleContentChange}
          className="flex-1 resize-none outline-none p-3 bg-transparent"
          style={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            lineHeight: '1.5rem',
            color: 'var(--theme-text)',
            caretColor: 'var(--theme-primary)',
          }}
          spellCheck={false}
          aria-label={`Editing ${activeFile.name}`}
        />
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-3 py-1 text-xs opacity-60 border-t"
        style={{ borderColor: 'var(--theme-surface)' }}
      >
        <span>{activeFile.name}</span>
        <span>
          {lineCount} lines · {charCount} chars
        </span>
      </div>
    </div>
  );
});

export default TextEditor;
