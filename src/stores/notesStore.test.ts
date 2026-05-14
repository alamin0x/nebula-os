import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useNotesStore } from './notesStore';

describe('notesStore', () => {
  beforeEach(() => {
    // Reset store state
    useNotesStore.setState({ notes: [], activeNoteId: null, storageError: null });
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addNote', () => {
    it('creates a note with the given category', () => {
      useNotesStore.getState().addNote('Work');
      const { notes } = useNotesStore.getState();
      expect(notes).toHaveLength(1);
      expect(notes[0].category).toBe('Work');
      expect(notes[0].content).toBe('');
      expect(notes[0].id).toBeDefined();
      expect(notes[0].createdAt).toBeGreaterThan(0);
      expect(notes[0].updatedAt).toBe(notes[0].createdAt);
    });

    it('defaults category to "Uncategorized" when not provided', () => {
      useNotesStore.getState().addNote();
      const { notes } = useNotesStore.getState();
      expect(notes[0].category).toBe('Uncategorized');
    });

    it('defaults category to "Uncategorized" when empty string is provided', () => {
      useNotesStore.getState().addNote('');
      const { notes } = useNotesStore.getState();
      expect(notes[0].category).toBe('Uncategorized');
    });

    it('sets the new note as active', () => {
      useNotesStore.getState().addNote();
      const { notes, activeNoteId } = useNotesStore.getState();
      expect(activeNoteId).toBe(notes[0].id);
    });

    it('saves to localStorage immediately', () => {
      useNotesStore.getState().addNote('Personal');
      const stored = JSON.parse(localStorage.getItem('nebula-notes')!);
      expect(stored).toHaveLength(1);
      expect(stored[0].category).toBe('Personal');
    });
  });

  describe('updateNote', () => {
    it('updates the content of an existing note', () => {
      useNotesStore.getState().addNote();
      const noteId = useNotesStore.getState().notes[0].id;
      useNotesStore.getState().updateNote(noteId, 'Hello world');
      const { notes } = useNotesStore.getState();
      expect(notes[0].content).toBe('Hello world');
    });

    it('updates the updatedAt timestamp', () => {
      useNotesStore.getState().addNote();
      const noteId = useNotesStore.getState().notes[0].id;
      const originalUpdatedAt = useNotesStore.getState().notes[0].updatedAt;

      vi.advanceTimersByTime(100);
      useNotesStore.getState().updateNote(noteId, 'New content');

      const { notes } = useNotesStore.getState();
      expect(notes[0].updatedAt).toBeGreaterThan(originalUpdatedAt);
    });

    it('debounces save to localStorage (2s)', () => {
      useNotesStore.getState().addNote();
      const noteId = useNotesStore.getState().notes[0].id;
      localStorage.clear(); // Clear the save from addNote

      useNotesStore.getState().updateNote(noteId, 'First update');
      expect(localStorage.getItem('nebula-notes')).toBeNull();

      vi.advanceTimersByTime(1000);
      useNotesStore.getState().updateNote(noteId, 'Second update');
      expect(localStorage.getItem('nebula-notes')).toBeNull();

      vi.advanceTimersByTime(2000);
      const stored = JSON.parse(localStorage.getItem('nebula-notes')!);
      expect(stored[0].content).toBe('Second update');
    });
  });

  describe('deleteNote', () => {
    it('removes the note from the store', () => {
      useNotesStore.getState().addNote();
      useNotesStore.getState().addNote();
      const noteId = useNotesStore.getState().notes[0].id;

      useNotesStore.getState().deleteNote(noteId);
      const { notes } = useNotesStore.getState();
      expect(notes).toHaveLength(1);
      expect(notes.find((n) => n.id === noteId)).toBeUndefined();
    });

    it('clears activeNoteId if the deleted note was active', () => {
      useNotesStore.getState().addNote();
      const noteId = useNotesStore.getState().notes[0].id;
      useNotesStore.getState().setActiveNote(noteId);

      useNotesStore.getState().deleteNote(noteId);
      expect(useNotesStore.getState().activeNoteId).toBeNull();
    });

    it('preserves activeNoteId if a different note was deleted', () => {
      useNotesStore.getState().addNote();
      useNotesStore.getState().addNote();
      const [first, second] = useNotesStore.getState().notes;
      useNotesStore.getState().setActiveNote(second.id);

      useNotesStore.getState().deleteNote(first.id);
      expect(useNotesStore.getState().activeNoteId).toBe(second.id);
    });

    it('saves to localStorage immediately', () => {
      useNotesStore.getState().addNote();
      const noteId = useNotesStore.getState().notes[0].id;

      useNotesStore.getState().deleteNote(noteId);
      const stored = JSON.parse(localStorage.getItem('nebula-notes')!);
      expect(stored).toHaveLength(0);
    });
  });

  describe('setActiveNote', () => {
    it('sets the active note id', () => {
      useNotesStore.getState().addNote();
      const noteId = useNotesStore.getState().notes[0].id;
      useNotesStore.getState().setActiveNote(noteId);
      expect(useNotesStore.getState().activeNoteId).toBe(noteId);
    });
  });

  describe('loadFromStorage', () => {
    it('loads notes from localStorage', () => {
      const mockNotes = [
        { id: '1', content: 'Test', category: 'Work', createdAt: 1000, updatedAt: 2000 },
      ];
      localStorage.setItem('nebula-notes', JSON.stringify(mockNotes));

      useNotesStore.getState().loadFromStorage();
      const { notes } = useNotesStore.getState();
      expect(notes).toHaveLength(1);
      expect(notes[0].content).toBe('Test');
      expect(notes[0].category).toBe('Work');
    });

    it('handles empty localStorage gracefully', () => {
      useNotesStore.getState().loadFromStorage();
      expect(useNotesStore.getState().notes).toHaveLength(0);
    });

    it('sets storageError on parse failure', () => {
      localStorage.setItem('nebula-notes', 'invalid json{{{');
      useNotesStore.getState().loadFromStorage();
      expect(useNotesStore.getState().storageError).toBe('Failed to load notes from storage.');
    });
  });

  describe('saveToStorage', () => {
    it('persists notes to localStorage', () => {
      useNotesStore.getState().addNote('Personal');
      useNotesStore.getState().updateNote(
        useNotesStore.getState().notes[0].id,
        'My note content'
      );
      vi.advanceTimersByTime(2000);

      const stored = JSON.parse(localStorage.getItem('nebula-notes')!);
      expect(stored[0].content).toBe('My note content');
      expect(stored[0].category).toBe('Personal');
    });

    it('sets storageError when localStorage throws', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      useNotesStore.setState({ notes: [{ id: '1', content: 'x', category: 'A', createdAt: 1, updatedAt: 1 }] });
      useNotesStore.getState().saveToStorage();

      expect(useNotesStore.getState().storageError).toBe('Failed to save notes to storage.');
      mockSetItem.mockRestore();
    });
  });
});
