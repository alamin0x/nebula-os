import type { FileSystemNode } from '../types';

/**
 * Fake filesystem tree with directories and files.
 * Structure:
 * /home/
 *   welcome.txt
 *   notes.txt
 *   /projects/
 *     readme.md
 *     portfolio.json
 *   /documents/
 *     notes.txt
 *     todo.md
 *   /recordings/
 *   /system/
 *     config.sys
 */
export const fileSystem: FileSystemNode = {
  name: 'home',
  type: 'directory',
  children: [
    {
      name: 'welcome.txt',
      type: 'file',
      content: 'Welcome to Nebula OS!\n\nType "help" in the terminal to see available commands.\nExplore the filesystem with ls, cd, cat, and more.',
    },
    {
      name: 'notes.txt',
      type: 'file',
      content: 'Personal Notes\n==============\n- Finish terminal implementation\n- Add more wallpapers\n- Explore the secret room',
    },
    {
      name: 'projects',
      type: 'directory',
      children: [
        {
          name: 'readme.md',
          type: 'file',
          content: '# My Projects\n\nWelcome to my project directory.',
        },
        {
          name: 'portfolio.json',
          type: 'file',
          content: '{ "name": "Nebula OS", "version": "1.0.0" }',
        },
      ],
    },
    {
      name: 'documents',
      type: 'directory',
      children: [
        {
          name: 'notes.txt',
          type: 'file',
          content: 'Remember to finish the terminal implementation.',
        },
        {
          name: 'todo.md',
          type: 'file',
          content: '# TODO\n\n- [x] Build Nebula OS\n- [ ] Take over the world',
        },
      ],
    },
    {
      name: 'recordings',
      type: 'directory',
      children: [],
    },
    {
      name: 'system',
      type: 'directory',
      children: [
        {
          name: 'config.sys',
          type: 'file',
          content: 'NEBULA_VERSION=1.0.0\nTHEME=cyberpunk',
        },
      ],
    },
  ],
};

/**
 * Resolves a path array to a FileSystemNode.
 * Returns null if the path is invalid.
 */
export function resolveNode(path: string[]): FileSystemNode | null {
  let current: FileSystemNode = fileSystem;

  for (const segment of path) {
    if (current.type !== 'directory' || !current.children) {
      return null;
    }
    const child = current.children.find(
      (c) => c.name.toLowerCase() === segment.toLowerCase()
    );
    if (!child) {
      return null;
    }
    current = child;
  }

  return current;
}

/**
 * Lists the children names at a given path.
 * Returns null if the path is invalid or not a directory.
 */
export function listDirectory(path: string[]): string[] | null {
  const node = resolveNode(path);
  if (!node || node.type !== 'directory' || !node.children) {
    return null;
  }
  return node.children.map((c) => c.name);
}

/**
 * Resolves a target path relative to the current path.
 * Supports ".." for parent navigation and nested paths like "projects/readme.md".
 * Returns the new path array or null if invalid.
 */
export function resolvePath(currentPath: string[], target: string): string[] | null {
  // Handle absolute path (starting with / or ~)
  if (target === '/' || target === '~') {
    return [];
  }

  const segments = target.split('/').filter((s) => s !== '');
  const newPath = [...currentPath];

  for (const segment of segments) {
    if (segment === '..') {
      if (newPath.length > 0) {
        newPath.pop();
      }
      // Already at root, stay at root
    } else if (segment === '.') {
      // Stay in current directory
    } else {
      newPath.push(segment);
    }
  }

  // Validate the resolved path exists and is a directory
  const node = resolveNode(newPath);
  if (!node || node.type !== 'directory') {
    return null;
  }

  return newPath;
}

/**
 * Gets the content of a file at the given path.
 * Returns null if the path is invalid or not a file.
 */
export function getFileContent(currentPath: string[], fileName: string): string | null {
  const dirNode = resolveNode(currentPath);
  if (!dirNode || dirNode.type !== 'directory' || !dirNode.children) {
    return null;
  }

  const file = dirNode.children.find(
    (c) => c.name.toLowerCase() === fileName.toLowerCase() && c.type === 'file'
  );

  if (!file) {
    return null;
  }

  return file.content ?? '';
}

/**
 * Creates a new empty file in the directory at currentPath.
 * Returns true on success, false if the directory doesn't exist or file already exists.
 */
export function createFile(currentPath: string[], name: string): boolean {
  const dirNode = resolveNode(currentPath);
  if (!dirNode || dirNode.type !== 'directory' || !dirNode.children) {
    return false;
  }

  // Check if file already exists
  const existing = dirNode.children.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    return false;
  }

  dirNode.children.push({
    name,
    type: 'file',
    content: '',
  });

  return true;
}

/**
 * Creates a new directory in the directory at currentPath.
 * Returns true on success, false if the parent doesn't exist or directory already exists.
 */
export function createDirectory(currentPath: string[], name: string): boolean {
  const dirNode = resolveNode(currentPath);
  if (!dirNode || dirNode.type !== 'directory' || !dirNode.children) {
    return false;
  }

  // Check if directory already exists
  const existing = dirNode.children.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    return false;
  }

  dirNode.children.push({
    name,
    type: 'directory',
    children: [],
  });

  return true;
}
