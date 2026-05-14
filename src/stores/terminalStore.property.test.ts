import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { parseCommand } from '../utils/commandParser';
import { useTerminalStore } from './terminalStore';
import { listDirectory, resolvePath } from '../utils/filesystem';

// Known commands that the parser recognizes
const KNOWN_COMMANDS = [
  'help', 'about', 'projects', 'notes', 'music',
  'clear', 'ls', 'cd', 'matrix', 'hack', 'theme', 'secret',
];

// Valid directories in the fake filesystem
const VALID_DIRS = ['projects', 'documents', 'system'];

// Feature: nebula-os, Property 12: Unrecognized input produces fallback response
// **Validates: Requirements 6.4, 9.8**
describe('Property 12: Unrecognized input produces fallback response', () => {
  /**
   * Generator for strings that are NOT recognized commands.
   * Filters out any string whose first whitespace-delimited token (lowercased)
   * matches a known command.
   */
  const nonCommandArb = fc
    .string({ minLength: 1, maxLength: 200 })
    .filter((s) => {
      const trimmed = s.trim();
      if (trimmed === '') return false;
      const firstToken = trimmed.split(/\s+/)[0].toLowerCase();
      return !KNOWN_COMMANDS.includes(firstToken);
    });

  it('any unrecognized input produces a "Command not found" message', () => {
    fc.assert(
      fc.property(nonCommandArb, (input) => {
        const result = parseCommand(input, []);

        // Output must follow the exact format
        const trimmed = input.trim();
        const expected = `Command not found: ${trimmed}. Type 'help' for available commands.`;
        expect(result.output).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('unrecognized input never triggers an action', () => {
    fc.assert(
      fc.property(nonCommandArb, (input) => {
        const result = parseCommand(input, []);
        expect(result.action).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it('any string input produces a CommandResult (never throws)', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 500 }), (input) => {
        // Should never throw, always returns a result
        const result = parseCommand(input, []);
        expect(result).toBeDefined();
        expect(typeof result.output).toBe('string');
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: nebula-os, Property 16: Terminal clear empties history
// **Validates: Requirements 9.5**
describe('Property 16: Terminal clear empties history', () => {
  beforeEach(() => {
    // Reset the store before each test
    useTerminalStore.setState({ history: [], currentPath: [] });
  });

  it('clear always empties history regardless of prior entries', () => {
    // Generate a random number of commands to execute before clearing
    const commandArb = fc.array(
      fc.constantFrom('help', 'about', 'projects', 'ls', 'unknowncmd', 'hello world'),
      { minLength: 0, maxLength: 20 },
    );

    fc.assert(
      fc.property(commandArb, (commands) => {
        // Reset store
        useTerminalStore.setState({ history: [], currentPath: [] });

        // Execute random commands to build up history
        for (const cmd of commands) {
          useTerminalStore.getState().executeCommand(cmd);
        }

        // Now clear
        useTerminalStore.getState().clear();

        // History must be empty
        expect(useTerminalStore.getState().history).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });

  it('executing "clear" command empties history', () => {
    const commandArb = fc.array(
      fc.constantFrom('help', 'about', 'projects', 'ls', 'foo'),
      { minLength: 1, maxLength: 15 },
    );

    fc.assert(
      fc.property(commandArb, (commands) => {
        // Reset store
        useTerminalStore.setState({ history: [], currentPath: [] });

        // Execute commands to build up history
        for (const cmd of commands) {
          useTerminalStore.getState().executeCommand(cmd);
        }

        // Execute clear command
        useTerminalStore.getState().executeCommand('clear');

        // History must be empty after clear command
        expect(useTerminalStore.getState().history).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: nebula-os, Property 17: Filesystem navigation correctness
// **Validates: Requirements 9.9**
describe('Property 17: Filesystem navigation correctness', () => {
  beforeEach(() => {
    useTerminalStore.setState({ history: [], currentPath: [] });
  });

  it('cd to a valid directory updates currentPath correctly', () => {
    const validDirArb = fc.constantFrom(...VALID_DIRS);

    fc.assert(
      fc.property(validDirArb, (dir) => {
        // Reset to root
        useTerminalStore.setState({ history: [], currentPath: [] });

        // Execute cd command
        useTerminalStore.getState().executeCommand(`cd ${dir}`);

        // currentPath should now contain the directory
        const state = useTerminalStore.getState();
        expect(state.currentPath).toEqual([dir]);
      }),
      { numRuns: 100 },
    );
  });

  it('ls at root returns exactly the top-level directory names', () => {
    const rootEntries = listDirectory([]);
    expect(rootEntries).not.toBeNull();

    // ls at root should list all top-level directories
    const result = parseCommand('ls', []);
    const listedNames = result.output.split('\n');
    expect(listedNames.sort()).toEqual(rootEntries!.sort());
  });

  it('ls at a valid subdirectory returns its children', () => {
    const validDirArb = fc.constantFrom(...VALID_DIRS);

    fc.assert(
      fc.property(validDirArb, (dir) => {
        const expectedEntries = listDirectory([dir]);
        expect(expectedEntries).not.toBeNull();

        const result = parseCommand('ls', [dir]);
        const listedNames = result.output.split('\n');
        expect(listedNames.sort()).toEqual(expectedEntries!.sort());
      }),
      { numRuns: 100 },
    );
  });

  it('cd ".." from a subdirectory never goes below root', () => {
    // Generate a sequence of cd operations: go into a dir, then cd .. multiple times
    const cdUpCountArb = fc.integer({ min: 1, max: 10 });
    const validDirArb = fc.constantFrom(...VALID_DIRS);

    fc.assert(
      fc.property(validDirArb, cdUpCountArb, (dir, upCount) => {
        // Start at root, cd into dir
        let currentPath = [dir];

        // cd .. multiple times
        for (let i = 0; i < upCount; i++) {
          const newPath = resolvePath(currentPath, '..');
          if (newPath !== null) {
            currentPath = newPath;
          }
        }

        // Path should never have negative length (below root)
        expect(currentPath.length).toBeGreaterThanOrEqual(0);
        // After enough ".." we should be at root
        expect(currentPath).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });

  it('cd to an invalid directory does not change path', () => {
    const invalidDirArb = fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => {
        // Filter out valid directory names and special paths
        const lower = s.toLowerCase();
        return (
          !VALID_DIRS.includes(lower) &&
          s !== '..' &&
          s !== '.' &&
          s !== '/' &&
          s !== '~' &&
          !s.includes('/')
        );
      });

    fc.assert(
      fc.property(invalidDirArb, (dir) => {
        // Reset to root
        useTerminalStore.setState({ history: [], currentPath: [] });

        // Try to cd to invalid directory
        useTerminalStore.getState().executeCommand(`cd ${dir}`);

        // Path should remain at root
        expect(useTerminalStore.getState().currentPath).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: nebula-os, Property 18: Case-insensitive command matching
// **Validates: Requirements 9.10**
describe('Property 18: Case-insensitive command matching', () => {
  /**
   * Generator that takes a known command and applies random casing.
   */
  const randomCaseArb = (cmd: string) =>
    fc.array(fc.boolean(), { minLength: cmd.length, maxLength: cmd.length }).map((bools) =>
      cmd
        .split('')
        .map((ch, i) => (bools[i] ? ch.toUpperCase() : ch.toLowerCase()))
        .join(''),
    );

  // Commands that produce deterministic output (no args needed, no side effects on path)
  const deterministicCommands = ['help', 'about', 'projects', 'notes', 'music', 'matrix', 'hack', 'secret'];

  it('any casing of a recognized command produces the same output as lowercase', () => {
    const commandArb = fc.constantFrom(...deterministicCommands).chain((cmd) =>
      randomCaseArb(cmd).map((casedCmd) => ({ original: cmd, cased: casedCmd })),
    );

    fc.assert(
      fc.property(commandArb, ({ original, cased }) => {
        const expectedResult = parseCommand(original, []);
        const actualResult = parseCommand(cased, []);

        expect(actualResult.output).toBe(expectedResult.output);
        expect(actualResult.action).toBe(expectedResult.action);
      }),
      { numRuns: 100 },
    );
  });

  it('ls command is case-insensitive', () => {
    fc.assert(
      fc.property(randomCaseArb('ls'), (casedLs) => {
        const expected = parseCommand('ls', []);
        const actual = parseCommand(casedLs, []);
        expect(actual.output).toBe(expected.output);
      }),
      { numRuns: 100 },
    );
  });

  it('cd command is case-insensitive', () => {
    const validDirArb = fc.constantFrom(...VALID_DIRS);

    fc.assert(
      fc.property(
        randomCaseArb('cd'),
        validDirArb,
        (casedCd, dir) => {
          const expected = parseCommand(`cd ${dir}`, []);
          const actual = parseCommand(`${casedCd} ${dir}`, []);
          expect(actual.newPath).toEqual(expected.newPath);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('theme command with random casing produces same result', () => {
    const themeArb = fc.constantFrom('cyberpunk', 'matrix', 'aurora');

    fc.assert(
      fc.property(
        randomCaseArb('theme'),
        themeArb,
        (casedTheme, themeName) => {
          const expected = parseCommand(`theme ${themeName}`, []);
          const actual = parseCommand(`${casedTheme} ${themeName}`, []);
          expect(actual.output).toBe(expected.output);
          expect(actual.action).toBe(expected.action);
          expect(actual.actionPayload).toBe(expected.actionPayload);
        },
      ),
      { numRuns: 100 },
    );
  });
});
