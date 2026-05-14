import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import NotesApp from './NotesApp';
import { useNotesStore } from '../stores/notesStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('NotesApp', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset the store state
    useNotesStore.setState({
      notes: [],
      activeNoteId: null,
      storageError: null,
    });
  });

  it('renders empty state when no notes exist', () => {
    render(<NotesApp />);
    expect(screen.getByText('Select a note or create a new one')).toBeInTheDocument();
    expect(screen.getByText('No notes yet. Click + to create one.')).toBeInTheDocument();
  });

  it('creates a new note when clicking the + button', () => {
    render(<NotesApp />);
    const createBtn = screen.getByTestId('notes-create-btn');
    fireEvent.click(createBtn);

    // After creating, the editor should appear
    expect(screen.getByTestId('notes-editor')).toBeInTheDocument();
  });

  it('displays note title extracted from content', () => {
    useNotesStore.setState({
      notes: [
        {
          id: 'note-1',
          content: 'My First Note\nSome content here',
          category: 'Uncategorized',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeNoteId: null,
      storageError: null,
    });

    render(<NotesApp />);
    expect(screen.getByText('My First Note')).toBeInTheDocument();
  });

  it('shows active note content in the editor', () => {
    const noteContent = 'Hello World\nThis is a test note';
    useNotesStore.setState({
      notes: [
        {
          id: 'note-1',
          content: noteContent,
          category: 'Uncategorized',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeNoteId: 'note-1',
      storageError: null,
    });

    render(<NotesApp />);
    const editor = screen.getByTestId('notes-editor') as HTMLTextAreaElement;
    expect(editor.value).toBe(noteContent);
  });

  it('groups notes by category', () => {
    useNotesStore.setState({
      notes: [
        {
          id: 'note-1',
          content: 'Work note',
          category: 'Work',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'note-2',
          content: 'Personal note',
          category: 'Personal',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeNoteId: null,
      storageError: null,
    });

    render(<NotesApp />);
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('selects a note when clicking on it in the sidebar', () => {
    useNotesStore.setState({
      notes: [
        {
          id: 'note-1',
          content: 'Click me',
          category: 'Uncategorized',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeNoteId: null,
      storageError: null,
    });

    render(<NotesApp />);
    fireEvent.click(screen.getByTestId('note-item-note-1'));

    const state = useNotesStore.getState();
    expect(state.activeNoteId).toBe('note-1');
  });

  it('deletes a note when clicking the delete button', () => {
    useNotesStore.setState({
      notes: [
        {
          id: 'note-1',
          content: 'Delete me',
          category: 'Uncategorized',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeNoteId: 'note-1',
      storageError: null,
    });

    render(<NotesApp />);
    fireEvent.click(screen.getByTestId('note-delete-note-1'));

    const state = useNotesStore.getState();
    expect(state.notes).toHaveLength(0);
    expect(state.activeNoteId).toBeNull();
  });

  it('displays storage error when present', () => {
    useNotesStore.setState({
      notes: [],
      activeNoteId: null,
      storageError: 'Failed to save notes to storage.',
    });

    render(<NotesApp />);
    expect(screen.getByTestId('notes-storage-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to save notes to storage.')).toBeInTheDocument();
  });

  it('updates note content when typing in the editor', () => {
    useNotesStore.setState({
      notes: [
        {
          id: 'note-1',
          content: 'Original',
          category: 'Uncategorized',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeNoteId: 'note-1',
      storageError: null,
    });

    render(<NotesApp />);
    const editor = screen.getByTestId('notes-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'Updated content' } });

    const state = useNotesStore.getState();
    const note = state.notes.find((n) => n.id === 'note-1');
    expect(note?.content).toBe('Updated content');
  });

  it('shows "Untitled" for notes with empty content', () => {
    useNotesStore.setState({
      notes: [
        {
          id: 'note-1',
          content: '',
          category: 'Uncategorized',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeNoteId: null,
      storageError: null,
    });

    render(<NotesApp />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });
});
