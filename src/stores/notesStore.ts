import { create } from 'zustand';
import type { NotesStore } from '../types/stores';
import type { Note } from '../types/index';

const STORAGE_KEY = 'nebula-notes';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useNotesStore = create<NotesStore & { storageError: string | null }>((set, get) => ({
  notes: [],
  activeNoteId: null,
  storageError: null,

  addNote: (category?: string) => {
    const now = Date.now();
    const newNote: Note = {
      id: crypto.randomUUID(),
      content: '',
      category: category || 'Uncategorized',
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      notes: [...state.notes, newNote],
      activeNoteId: newNote.id,
      storageError: null,
    }));
    get().saveToStorage();
  },

  updateNote: (id: string, content: string) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, content, updatedAt: Date.now() }
          : note
      ),
      storageError: null,
    }));

    // Debounced save (2s)
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      get().saveToStorage();
      saveTimeout = null;
    }, 2000);
  },

  deleteNote: (id: string) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      storageError: null,
    }));
    get().saveToStorage();
  },

  setActiveNote: (id: string) => {
    set({ activeNoteId: id });
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const notes: Note[] = JSON.parse(raw);
        set({ notes, storageError: null });
      }
    } catch {
      set({ storageError: 'Failed to load notes from storage.' });
    }
  },

  saveToStorage: () => {
    try {
      const { notes } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      set({ storageError: null });
    } catch {
      set({ storageError: 'Failed to save notes to storage.' });
    }
  },
}));
