import { listDirectory, resolvePath } from './filesystem';

/**
 * Result of parsing and executing a terminal command.
 */
export interface CommandResult {
  output: string;
  action?: 'clear' | 'open-notes' | 'play-music' | 'matrix' | 'hack' | 'theme' | 'secret';
  actionPayload?: string;
  newPath?: string[];
}

/**
 * Command registry mapping command names to their handlers.
 * All matching is case-insensitive.
 */
const commands: Record<string, (args: string[], currentPath: string[]) => CommandResult> = {
  help: () => ({
    output: [
      'Available commands:',
      '  help      - Show this help message',
      '  about     - Display biographical information',
      '  projects  - List portfolio projects',
      '  notes     - Open the Notes application',
      '  music     - Start music playback',
      '  clear     - Clear terminal output',
      '  ls        - List directory contents',
      '  cd [dir]  - Change directory',
      '  theme [name] - Switch theme (cyberpunk, matrix, aurora)',
      '  matrix    - Activate matrix rain',
      '  hack      - Run hack sequence',
      '  secret    - ???',
    ].join('\n'),
  }),

  about: () => ({
    output: [
      '╔══════════════════════════════════════╗',
      '║         NEBULA OS v1.0.0             ║',
      '╠══════════════════════════════════════╣',
      '║  A futuristic browser-based OS       ║',
      '║  Built with React + TypeScript       ║',
      '║  Powered by Vite + TailwindCSS       ║',
      '╚══════════════════════════════════════╝',
    ].join('\n'),
  }),

  projects: () => ({
    output: [
      '┌─────────────────────────────────────┐',
      '│ Portfolio Projects                   │',
      '├─────────────────────────────────────┤',
      '│ 1. Nebula OS - Browser-based OS     │',
      '│ 2. Quantum API - REST framework     │',
      '│ 3. Neural Net - ML visualizer       │',
      '│ 4. CyberChat - Real-time messaging  │',
      '│ 5. DataForge - Analytics dashboard  │',
      '└─────────────────────────────────────┘',
    ].join('\n'),
  }),

  notes: () => ({
    output: 'Opening Notes application...',
    action: 'open-notes',
  }),

  music: () => ({
    output: 'Starting music playback...',
    action: 'play-music',
  }),

  clear: () => ({
    output: '',
    action: 'clear',
  }),

  ls: (_args, currentPath) => {
    const entries = listDirectory(currentPath);
    if (!entries) {
      return { output: 'Error: Cannot list directory.' };
    }
    return { output: entries.join('\n') };
  },

  cd: (args, currentPath) => {
    if (args.length === 0) {
      // cd with no args goes to root
      return { output: '', newPath: [] };
    }

    const target = args.join(' ');
    const newPath = resolvePath(currentPath, target);

    if (newPath === null) {
      return { output: `cd: no such directory: ${target}` };
    }

    return { output: '', newPath };
  },

  matrix: () => ({
    output: 'Activating matrix rain...',
    action: 'matrix',
  }),

  hack: () => ({
    output: 'Initiating hack sequence...',
    action: 'hack',
  }),

  theme: (args) => {
    if (args.length === 0) {
      return { output: 'Usage: theme [cyberpunk|matrix|aurora]' };
    }
    const themeName = args[0].toLowerCase();
    const validThemes = ['cyberpunk', 'matrix', 'aurora'];
    if (!validThemes.includes(themeName)) {
      return { output: `Unknown theme: ${args[0]}. Available: cyberpunk, matrix, aurora` };
    }
    return {
      output: `Theme switched to ${themeName}.`,
      action: 'theme',
      actionPayload: themeName,
    };
  },

  secret: () => ({
    output: 'Access granted. Opening secret room...',
    action: 'secret',
  }),
};

/**
 * Parses and executes a command string.
 * Command matching is case-insensitive.
 * Returns a CommandResult with output and optional side-effect action.
 */
export function parseCommand(input: string, currentPath: string[]): CommandResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { output: '' };
  }

  const parts = trimmed.split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);

  const handler = Object.hasOwn(commands, commandName) ? commands[commandName] : undefined;
  if (handler) {
    return handler(args, currentPath);
  }

  return {
    output: `Command not found: ${trimmed}. Type 'help' for available commands.`,
  };
}
