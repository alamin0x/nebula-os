import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNotesStore } from '../stores/notesStore';
import { extractTitle } from '../utils/extractTitle';

/**
 * NotesApp — A note-taking application with sidebar, editor, and category support.
 * Uses notesStore for state management and persists to localStorage.
 * Exported as default for React.lazy() compatibility.
 */
const NotesApp = memo(function NotesApp() {
  const notes = useNotesStore((state) => state.notes);
  const activeNoteId = useNotesStore((state) => state.activeNoteId);
  const storageError = useNotesStore((state) => state.storageError);
  const addNote = useNotesStore((state) => state.addNote);
  const updateNote = useNotesStore((state) => state.updateNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const setActiveNote = useNotesStore((state) => state.setActiveNote);
  const loadFromStorage = useNotesStore((state) => state.loadFromStorage);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  const handleCreateNote = useCallback(() => {
    addNote();
  }, [addNote]);

  const handleDeleteNote = useCallback(
    (id: string) => {
      deleteNote(id);
    },
    [deleteNote]
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (activeNoteId) {
        const content = e.target.value;
        // Enforce max 100,000 characters
        if (content.length <= 100_000) {
          updateNote(activeNoteId, content);
        }
      }
    },
    [activeNoteId, updateNote]
  );

  const handleSelectNote = useCallback(
    (id: string) => {
      setActiveNote(id);
      setSidebarOpen(false); // Close sidebar on mobile after selecting
    },
    [setActiveNote]
  );

  // Group notes by category (memoized to avoid recomputation on every render)
  const groupedNotes = useMemo(() => {
    return notes.reduce<Record<string, typeof notes>>((acc, note) => {
      const cat = note.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(note);
      return acc;
    }, {});
  }, [notes]);

  return (
    <div className="flex h-full w-full relative" style={{ color: 'var(--theme-text)' }}>
      {/* Mobile sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center rounded-lg md:hidden"
        style={{ backgroundColor: 'var(--theme-surface)' }}
        aria-label="Toggle notes sidebar"
      >
        <span className="text-sm">☰</span>
      </button>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-10 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          absolute md:relative z-20 md:z-auto
          w-56 shrink-0 flex flex-col border-r border-white/10 overflow-hidden
          transition-transform duration-200 h-full
        `}
        style={{ background: 'rgba(0, 0, 0, 0.95)' }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
            Notes
          </span>
          <button
            onClick={handleCreateNote}
            className="w-6 h-6 flex items-center justify-center rounded text-sm hover:bg-white/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]/70"
            style={{ color: 'var(--theme-primary)' }}
            aria-label="Create new note"
            data-testid="notes-create-btn"
          >
            +
          </button>
        </div>

        {/* Note list grouped by category */}
        <div className="flex-1 overflow-y-auto">
          {Object.keys(groupedNotes).length === 0 && (
            <div className="px-3 py-4 text-xs opacity-50 text-center">
              No notes yet. Click + to create one.
            </div>
          )}
          {Object.entries(groupedNotes).map(([category, categoryNotes]) => (
            <div key={category}>
              <div
                className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-50"
                style={{ color: 'var(--theme-secondary)' }}
              >
                {category}
              </div>
              {categoryNotes.map((note) => {
                const title = extractTitle(note.content) || 'Untitled';
                const isActive = note.id === activeNoteId;
                return (
                  <div
                    key={note.id}
                    className={`group flex items-center px-3 py-2 cursor-pointer transition-colors duration-200 ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                    onClick={() => handleSelectNote(note.id)}
                    data-testid={`note-item-${note.id}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSelectNote(note.id);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{title}</div>
                      <div className="text-[10px] opacity-40 mt-0.5">
                        {new Date(note.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[10px] hover:bg-red-500/20 text-red-400 transition-opacity duration-200"
                      aria-label={`Delete note: ${title}`}
                      data-testid={`note-delete-${note.id}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Storage error banner */}
        {storageError && (
          <div
            className="px-3 py-2 text-xs border-b border-red-500/30"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}
            role="alert"
            data-testid="notes-storage-error"
          >
            {storageError}
          </div>
        )}

        {activeNote ? (
          <textarea
            className="flex-1 w-full resize-none p-4 text-sm leading-relaxed outline-none"
            style={{
              background: 'transparent',
              color: 'var(--theme-text)',
              fontFamily: 'var(--font-primary)',
            }}
            value={activeNote.content}
            onChange={handleContentChange}
            placeholder="Start writing..."
            maxLength={100_000}
            aria-label="Note editor"
            data-testid="notes-editor"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-40 text-sm">
            Select a note or create a new one
          </div>
        )}
      </div>
    </div>
  );
});

export default NotesApp;
