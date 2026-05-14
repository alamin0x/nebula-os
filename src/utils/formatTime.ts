/**
 * Formats a Date object as a clock string in HH:MM:SS (24-hour) format.
 */
export function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a Date object as "weekday, month day" (e.g., "Monday, January 15").
 */
export function formatDate(date: Date): string {
  const weekdays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
  ];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekday = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();

  return `${weekday}, ${month} ${day}`;
}
