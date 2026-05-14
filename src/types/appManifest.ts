/**
 * App Manifest — defines a store app's metadata, type, and content.
 */
export interface AppManifest {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'web' | 'html';
  url?: string;   // required when type is 'web'
  html?: string;  // required when type is 'html'
}

/**
 * Validates an AppManifest object. Returns null if valid, or an error message string.
 */
export function validateManifest(manifest: unknown): string | null {
  if (!manifest || typeof manifest !== 'object') {
    return 'Manifest must be a JSON object.';
  }

  const m = manifest as Record<string, unknown>;

  if (!m.id || typeof m.id !== 'string') return 'Missing or invalid "id" field.';
  if (!m.name || typeof m.name !== 'string') return 'Missing or invalid "name" field.';
  if (!m.icon || typeof m.icon !== 'string') return 'Missing or invalid "icon" field.';
  if (!m.description || typeof m.description !== 'string') return 'Missing or invalid "description" field.';
  if (m.type !== 'web' && m.type !== 'html') return '"type" must be "web" or "html".';

  if (m.type === 'web' && (!m.url || typeof m.url !== 'string')) {
    return 'Web apps require a "url" field.';
  }
  if (m.type === 'html' && (!m.html || typeof m.html !== 'string')) {
    return 'HTML apps require an "html" field.';
  }

  // Check for collision with built-in app IDs
  const builtInIds = ['notes', 'ai-assistant', 'music-player', 'system-monitor', 'terminal', 'secret-room', 'browser', 'app-store'];
  if (builtInIds.includes(m.id as string)) {
    return `App ID "${m.id}" conflicts with a built-in app.`;
  }

  return null;
}
