/**
 * Extracts the title from note content.
 * Returns the first 50 characters of the first line,
 * or the full first line if it's shorter than 50 characters.
 * Returns an empty string if content is empty.
 */
export function extractTitle(content: string): string {
  if (!content) return '';

  const firstLine = content.split('\n')[0];
  return firstLine.slice(0, 50);
}
