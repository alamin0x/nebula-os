import { useState, useEffect, memo } from 'react';

interface ForecastDay {
  day: string;
  temp: number;
  condition: string;
}

const CONDITIONS = [
  { emoji: '☀️', label: 'Sunny' },
  { emoji: '⛅', label: 'Partly Cloudy' },
  { emoji: '☁️', label: 'Cloudy' },
  { emoji: '🌧️', label: 'Rainy' },
  { emoji: '⛈️', label: 'Thunderstorm' },
  { emoji: '🌤️', label: 'Mostly Sunny' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateWeather() {
  const conditionIndex = randomInt(0, CONDITIONS.length - 1);
  const condition = CONDITIONS[conditionIndex];
  const temp = randomInt(15, 35);
  const humidity = randomInt(30, 85);
  const wind = randomInt(5, 30);

  const today = new Date();
  const forecast: ForecastDay[] = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    forecast.push({
      day: DAY_NAMES[d.getDay()],
      temp: randomInt(15, 35),
      condition: CONDITIONS[randomInt(0, CONDITIONS.length - 1)].emoji,
    });
  }

  return { temp, condition, humidity, wind, forecast };
}

/**
 * Weather — simulated weather display for "Nebula City".
 * Shows current conditions and a 5-day forecast.
 */
const Weather = memo(function Weather() {
  const [weather, setWeather] = useState(generateWeather);

  useEffect(() => {
    // Refresh weather every 60 seconds
    const interval = setInterval(() => {
      setWeather(generateWeather());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col h-full w-full p-5 gap-5"
      style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}
    >
      {/* Location */}
      <div className="text-center">
        <p className="text-sm opacity-60">📍 Nebula City</p>
      </div>

      {/* Current weather */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-6xl">{weather.condition.emoji}</span>
        <p className="text-4xl font-bold">{weather.temp}°C</p>
        <p className="text-sm opacity-70">{weather.condition.label}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex flex-col items-center gap-1">
          <span className="opacity-60">💧 Humidity</span>
          <span className="font-medium">{weather.humidity}%</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="opacity-60">💨 Wind</span>
          <span className="font-medium">{weather.wind} km/h</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" style={{ borderColor: 'var(--theme-surface)' }} />

      {/* 5-day forecast */}
      <div>
        <h3 className="text-sm font-medium opacity-70 mb-3">5-Day Forecast</h3>
        <div className="grid grid-cols-5 gap-2">
          {weather.forecast.map((day) => (
            <div
              key={day.day}
              className="flex flex-col items-center gap-1 p-2 rounded-lg"
              style={{ backgroundColor: 'var(--theme-surface)' }}
            >
              <span className="text-xs opacity-70">{day.day}</span>
              <span className="text-xl">{day.condition}</span>
              <span className="text-sm font-medium">{day.temp}°</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={() => setWeather(generateWeather())}
        className="self-center px-4 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
        style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-background)' }}
      >
        Refresh
      </button>
    </div>
  );
});

export default Weather;
