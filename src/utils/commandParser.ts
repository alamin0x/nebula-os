import { listDirectory, resolvePath, getFileContent, createFile, createDirectory } from './filesystem';

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
      '',
      '  help          Show this help message',
      '  about         Display system information',
      '  neofetch      Display system info (ASCII art)',
      '  whoami        Print current user',
      '  pwd           Print working directory',
      '  ls            List directory contents',
      '  cd [dir]      Change directory',
      '  cat [file]    Read file contents',
      '  touch [file]  Create a new empty file',
      '  mkdir [dir]   Create a new directory',
      '  echo [text]   Display text',
      '  encrypt [f]   Encrypt a file (simulated)',
      '  decrypt [f]   Decrypt a file (simulated)',
      '  nep           Nebula Package Manager',
      '  notes         Open Notes application',
      '  music         Start music playback',
      '  projects      List portfolio projects',
      '  theme [name]  Switch theme (cyberpunk, matrix, aurora)',
      '  matrix        Activate matrix rain',
      '  hack          Run hack sequence',
      '  clear         Clear terminal output',
      '  secret        ???',
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

  neofetch: () => ({
    output: [
      '        .--.         guest@nebula',
      '       |o_o |        ─────────────────',
      '       |:_/ |        OS: Nebula OS v1.0.0',
      '      //   \\ \\       Kernel: React 18.x',
      '     (|     | )      Uptime: since page load',
      '    /\'\\_   _/`\\      Packages: 7 (built-in)',
      '    \\___)=(___/      Shell: nebula-term',
      '                     Resolution: ' + (typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '1920x1080'),
      '                     Theme: cyberpunk',
      '                     CPU: Browser Engine',
      '                     Memory: 256MB / 512MB',
    ].join('\n'),
  }),

  whoami: () => ({
    output: 'guest',
  }),

  pwd: (_args, currentPath) => ({
    output: currentPath.length === 0
      ? '/home/guest'
      : `/home/guest/${currentPath.join('/')}`,
  }),

  echo: (args) => ({
    output: args.join(' '),
  }),

  cat: (args, currentPath) => {
    if (args.length === 0) {
      return { output: 'Usage: cat [filename]' };
    }
    const fileName = args.join(' ');
    const content = getFileContent(currentPath, fileName);
    if (content === null) {
      return { output: `cat: ${fileName}: No such file or directory` };
    }
    return { output: content };
  },

  touch: (args, currentPath) => {
    if (args.length === 0) {
      return { output: 'Usage: touch [filename]' };
    }
    const fileName = args.join(' ');
    const success = createFile(currentPath, fileName);
    if (!success) {
      return { output: `touch: cannot create '${fileName}': File exists or invalid path` };
    }
    return { output: `Created file: ${fileName}` };
  },

  mkdir: (args, currentPath) => {
    if (args.length === 0) {
      return { output: 'Usage: mkdir [directory]' };
    }
    const dirName = args.join(' ');
    const success = createDirectory(currentPath, dirName);
    if (!success) {
      return { output: `mkdir: cannot create directory '${dirName}': Directory exists or invalid path` };
    }
    return { output: `Created directory: ${dirName}` };
  },

  encrypt: (args) => {
    if (args.length === 0) {
      return { output: 'Usage: encrypt [filename]' };
    }
    const fileName = args.join(' ');
    return {
      output: [
        `Encrypting ${fileName}...`,
        '[██████████████████████████████] 100%',
        `✓ File encrypted: ${fileName} → ${fileName}.enc`,
        '  Algorithm: AES-256-GCM',
        '  Key: ●●●●●●●●●●●●●●●●',
        '  Status: SECURED',
      ].join('\n'),
    };
  },

  decrypt: (args) => {
    if (args.length === 0) {
      return { output: 'Usage: decrypt [filename]' };
    }
    const fileName = args.join(' ');
    return {
      output: [
        `Decrypting ${fileName}...`,
        '[██████████████████████████████] 100%',
        `✓ File decrypted: ${fileName.replace('.enc', '')}`,
        '  Verification: PASSED',
        '  Integrity: OK',
        '  Status: UNLOCKED',
      ].join('\n'),
    };
  },

  nep: (args) => {
    if (args.length === 0) {
      return {
        output: [
          'nep - Nebula Package Manager v1.0.0',
          '',
          'Usage:',
          '  nep install [package]   Install a package',
          '  nep remove [package]    Remove a package',
          '  nep list                List installed packages',
          '  nep search [query]      Search for packages',
        ].join('\n'),
      };
    }

    const subcommand = args[0].toLowerCase();
    const pkg = args.slice(1).join(' ');

    switch (subcommand) {
      case 'install':
        if (!pkg) return { output: 'Usage: nep install [package]' };
        return {
          output: [
            `Resolving dependencies for ${pkg}...`,
            `Downloading ${pkg}@latest...`,
            '[██████████████████████████████] 100%',
            `✓ Successfully installed ${pkg}`,
          ].join('\n'),
        };
      case 'remove':
        if (!pkg) return { output: 'Usage: nep remove [package]' };
        return { output: `✓ Removed ${pkg}` };
      case 'list':
        return {
          output: [
            'Installed packages:',
            '  nebula-core@1.0.0',
            '  nebula-ui@1.0.0',
            '  nebula-terminal@1.0.0',
            '  nebula-fs@1.0.0',
          ].join('\n'),
        };
      case 'search':
        if (!pkg) return { output: 'Usage: nep search [query]' };
        return {
          output: [
            `Search results for "${pkg}":`,
            `  ${pkg}-core@2.1.0 - Core library`,
            `  ${pkg}-utils@1.3.0 - Utility functions`,
            `  ${pkg}-cli@0.9.0 - CLI tools`,
          ].join('\n'),
        };
      default:
        return { output: `nep: unknown command '${subcommand}'. Run 'nep' for usage.` };
    }
  },

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
