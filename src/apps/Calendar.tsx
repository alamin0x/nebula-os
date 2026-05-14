import { useState, useCallback, memo } from 'react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Calendar — monthly calendar view with navigation.
 * Highlights today with the theme primary color.
 */
const Calendar = memo(function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const isToday = useCallback(
    (day: number) => {
      return (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      );
    },
    [month, year, today]
  );

  const handlePrev = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const handleNext = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div
      className="flex flex-col h-full w-full p-4"
      style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="px-3 py-1 rounded transition-colors hover:bg-[var(--theme-surface)]"
          aria-label="Previous month"
        >
          ◀
        </button>
        <h2 className="text-lg font-semibold">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={handleNext}
          className="px-3 py-1 rounded transition-colors hover:bg-[var(--theme-surface)]"
          aria-label="Next month"
        >
          ▶
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium opacity-60 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`flex items-center justify-center rounded-lg text-sm transition-colors ${
              day !== null ? 'hover:bg-[var(--theme-surface)]' : ''
            }`}
            style={
              day !== null && isToday(day)
                ? {
                    backgroundColor: 'var(--theme-primary)',
                    color: 'var(--theme-background)',
                    fontWeight: 700,
                  }
                : undefined
            }
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
});

export default Calendar;
