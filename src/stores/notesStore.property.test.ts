import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useNotesStore } from './notesStore';
import type { Note } from '../types/index';

// Generator for valid Note objects
const noteArb = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 0, maxLength: 1000 }),
  category: fc.string({ minLength: 1, maxLength: 50 }),
  createdAt: fc.integer({ min: 1, max: 4133980800000 }),
  updatedAt: fc.integer({ min: 1, max: 4133980800000 }),
});

// Generator for arrays of notes with unique IDs
const notesArrayArb = fc.uniqueArray(noteArb, {
  minLength: 1,
  maxLength: 20,
  comparator: (a, b) => a.id === b.id,
});

// Feature: nebula-os, Property 9: Notes save/load round-trip
// **Validates: Requirements 5.3, 5.4**
describe('Property 9: Notes save/load round-trip', () => {
  beforeEach(() => {
    useNotesStore.setState({ notes: [], activeNoteId: null, storageError: null });
    localStorage.clear();
  });

  it('saving notes to localStorage and loading them back produces an equivalent array', () => {
    fc.assert(
      fc.property(notesArrayArb, (notes: Note[]) => {
        // Set notes in the store
        useNotesStore.setState({ notes, storageError: null });

        // Save to localStorage
        useNotesStore.getState().saveToStorage();

        // Clear the store
        useNotesStore.setState({ notes: [], storageError: null });

        // Load from localStorage
        useNotesStore.getState().loadFromStorage();

        const loaded = useNotesStore.getState().notes;

        // All fields must be preserved
        expect(loaded.length).toBe(notes.length);
        for (let i = 0; i < notes.length; i++) {
          expect(loaded[i].id).toBe(notes[i].id);
          expect(loaded[i].content).toBe(notes[i].content);
          expect(loaded[i].category).toBe(notes[i].category);
          expect(loaded[i].createdAt).toBe(notes[i].createdAt);
          expect(loaded[i].updatedAt).toBe(notes[i].updatedAt);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('notes created without an explicit category have category "Uncategorized"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(undefined, '', undefined),
        (category) => {
          useNotesStore.setState({ notes: [], activeNoteId: null, storageError: null });
          localStorage.clear();

          // Add a note without a category (or with empty string)
          useNotesStore.getState().addNote(category as string | undefined);

          // Save and reload
          useNotesStore.getState().saveToStorage();
          useNotesStore.setState({ notes: [], storageError: null });
          useNotesStore.getState().loadFromStorage();

          const loaded = useNotesStore.getState().notes;
          expect(loaded.length).toBe(1);
          expect(loaded[0].category).toBe('Uncategorized');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('note content up to 100,000 characters survives round-trip', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100000 }),
        (content: string) => {
          useNotesStore.setState({ notes: [], activeNoteId: null, storageError: null });
          localStorage.clear();

          const note: Note = {
            id: 'test-note-1',
            content,
            category: 'Test',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          useNotesStore.setState({ notes: [note], storageError: null });
          useNotesStore.getState().saveToStorage();
          useNotesStore.setState({ notes: [], storageError: null });
          useNotesStore.getState().loadFromStorage();

          const loaded = useNotesStore.getState().notes;
          expect(loaded.length).toBe(1);
          expect(loaded[0].content).toBe(content);
        },
      ),
      { numRuns: 20 }, // Fewer runs due to large string generation
    );
  });
});

// Feature: nebula-os, Property 11: Delete removes note from store and storage
// **Validates: Requirements 5.7**
describe('Property 11: Delete removes note from store and storage', () => {
  beforeEach(() => {
    useNotesStore.setState({ notes: [], activeNoteId: null, storageError: null });
    localStorage.clear();
  });

  it('deleting a note removes exactly that note from the store', () => {
    fc.assert(
      fc.property(
        notesArrayArb,
        fc.nat(),
        (notes: Note[], indexSeed: number) => {
          // Pick a random note to delete
          const targetIndex = indexSeed % notes.length;
          const targetId = notes[targetIndex].id;

          // Set up the store with notes
          useNotesStore.setState({ notes: [...notes], activeNoteId: null, storageError: null });

          // Delete the target note
          useNotesStore.getState().deleteNote(targetId);

          const remaining = useNotesStore.getState().notes;

          // Count should decrease by exactly 1
          expect(remaining.length).toBe(notes.length - 1);

          // The deleted note should not be present
          expect(remaining.find((n) => n.id === targetId)).toBeUndefined();

          // All other notes should still be present and unchanged
          const otherNotes = notes.filter((n) => n.id !== targetId);
          for (const original of otherNotes) {
            const found = remaining.find((n) => n.id === original.id);
            expect(found).toBeDefined();
            expect(found!.content).toBe(original.content);
            expect(found!.category).toBe(original.category);
            expect(found!.createdAt).toBe(original.createdAt);
            expect(found!.updatedAt).toBe(original.updatedAt);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deleting a note removes it from localStorage', () => {
    fc.assert(
      fc.property(
        notesArrayArb,
        fc.nat(),
        (notes: Note[], indexSeed: number) => {
          const targetIndex = indexSeed % notes.length;
          const targetId = notes[targetIndex].id;

          // Set up the store and persist
          useNotesStore.setState({ notes: [...notes], activeNoteId: null, storageError: null });
          useNotesStore.getState().saveToStorage();

          // Delete the target note (this also saves to storage)
          useNotesStore.getState().deleteNote(targetId);

          // Verify localStorage no longer contains the deleted note
          const stored = JSON.parse(localStorage.getItem('nebula-notes')!);
          expect(stored.find((n: Note) => n.id === targetId)).toBeUndefined();
          expect(stored.length).toBe(notes.length - 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deleting a note preserves all other notes in localStorage', () => {
    fc.assert(
      fc.property(
        notesArrayArb,
        fc.nat(),
        (notes: Note[], indexSeed: number) => {
          const targetIndex = indexSeed % notes.length;
          const targetId = notes[targetIndex].id;

          // Set up the store and persist
          useNotesStore.setState({ notes: [...notes], activeNoteId: null, storageError: null });
          useNotesStore.getState().saveToStorage();

          // Delete the target note
          useNotesStore.getState().deleteNote(targetId);

          // Verify all other notes are preserved in localStorage
          const stored: Note[] = JSON.parse(localStorage.getItem('nebula-notes')!);
          const otherNotes = notes.filter((n) => n.id !== targetId);
          for (const original of otherNotes) {
            const found = stored.find((n) => n.id === original.id);
            expect(found).toBeDefined();
            expect(found!.content).toBe(original.content);
            expect(found!.category).toBe(original.category);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
