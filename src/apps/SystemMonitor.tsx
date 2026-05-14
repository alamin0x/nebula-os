import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { CircularBuffer } from '../utils/circularBuffer';
import { useThemeStore } from '../stores/themeStore';
import { useWindowStore } from '../stores/windowStore';

/** Simulated metric data point */
interface MetricPoint {
  value: number;
  timestamp: number;
}

/**
 * Generates a new simulated value using a random walk from the previous value.
 * Clamps the result between 0 and 100.
 */
function simulateMetric(previous: number): number {
  const delta = (Math.random() - 0.5) * 20; // ±10 range
  return Math.max(0, Math.min(100, previous + delta));
}

/** SVG line graph for a metric's history */
const MetricGraph = memo(function MetricGraph({
  data,
  color,
  label,
  currentValue,
}: {
  data: number[];
  color: string;
  label: string;
  currentValue: number;
}) {
  const width = 240;
  const height = 80;
  const padding = 4;

  const points = data.map((value, index) => {
    const x = padding + (index / 29) * (width - padding * 2);
    const y = height - padding - (value / 100) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.length > 1 ? `M ${points.join(' L ')}` : '';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-accent uppercase tracking-wider opacity-70">
          {label}
        </span>
        <span
          className="text-sm font-bold font-accent transition-all duration-300 ease-out"
          style={{ color }}
        >
          {currentValue.toFixed(1)}%
        </span>
      </div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="rounded"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        {/* Grid lines */}
        {[25, 50, 75].map((pct) => (
          <line
            key={pct}
            x1={padding}
            y1={height - padding - (pct / 100) * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - (pct / 100) * (height - padding * 2)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        {/* Data line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 4px ${color})`,
              transition: 'all 300ms ease-out',
            }}
          />
        )}
        {/* Current value dot */}
        {data.length > 0 && (
          <circle
            cx={padding + ((data.length - 1) / 29) * (width - padding * 2)}
            cy={
              height -
              padding -
              (data[data.length - 1] / 100) * (height - padding * 2)
            }
            r="3"
            fill={color}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        )}
      </svg>
    </div>
  );
});

/** Animated bar indicator for network activity */
const NetworkBar = memo(function NetworkBar({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-accent uppercase tracking-wider opacity-70">
          {label}
        </span>
        <span
          className="text-xs font-bold font-accent transition-all duration-300 ease-out"
          style={{ color }}
        >
          {value.toFixed(0)} Mbps
        </span>
      </div>
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(100, value)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  );
});

/** Main SystemMonitor component */
const SystemMonitor = memo(function SystemMonitor() {
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const windowCount = useWindowStore((s) => s.windows.length);

  // Circular buffers for metric history
  const cpuBufferRef = useRef(new CircularBuffer<MetricPoint>(30));
  const memBufferRef = useRef(new CircularBuffer<MetricPoint>(30));
  const netBufferRef = useRef(new CircularBuffer<MetricPoint>(30));

  // Current values for display
  const [cpuData, setCpuData] = useState<number[]>([]);
  const [memData, setMemData] = useState<number[]>([]);
  const [netData, setNetData] = useState<number[]>([]);
  const [currentCpu, setCurrentCpu] = useState(45);
  const [currentMem, setCurrentMem] = useState(62);
  const [currentNet, setCurrentNet] = useState(30);

  // Clock state
  const [clock, setClock] = useState(new Date());

  // Update metrics every 2 seconds
  const updateMetrics = useCallback(() => {
    const now = Date.now();

    const newCpu = simulateMetric(currentCpu);
    const newMem = simulateMetric(currentMem);
    const newNet = simulateMetric(currentNet);

    cpuBufferRef.current.push({ value: newCpu, timestamp: now });
    memBufferRef.current.push({ value: newMem, timestamp: now });
    netBufferRef.current.push({ value: newNet, timestamp: now });

    setCurrentCpu(newCpu);
    setCurrentMem(newMem);
    setCurrentNet(newNet);
    setCpuData(cpuBufferRef.current.getAll().map((p) => p.value));
    setMemData(memBufferRef.current.getAll().map((p) => p.value));
    setNetData(netBufferRef.current.getAll().map((p) => p.value));
  }, [currentCpu, currentMem, currentNet]);

  // Use a ref-based approach for the interval to avoid stale closures
  const updateMetricsRef = useRef(updateMetrics);
  updateMetricsRef.current = updateMetrics;

  useEffect(() => {
    // Initial data point
    updateMetricsRef.current();

    const interval = setInterval(() => {
      updateMetricsRef.current();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Clock update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setClock(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatClock = useCallback((date: Date): string => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, []);

  return (
    <div
      className="h-full w-full p-4 overflow-y-auto flex flex-col gap-4 font-primary"
      style={{ color: 'var(--theme-text)' }}
    >
      {/* Header with clock and system info */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-accent font-bold tracking-wider uppercase">
          System Monitor
        </h2>
        <div
          className="text-2xl font-accent font-bold tracking-widest"
          style={{ color: 'var(--theme-primary)' }}
        >
          {formatClock(clock)}
        </div>
      </div>

      {/* System info bar */}
      <div
        className="flex items-center gap-4 px-3 py-2 rounded-lg text-xs"
        style={{ background: 'var(--theme-surface)' }}
      >
        <span className="opacity-70">Theme:</span>
        <span
          className="font-bold font-accent uppercase"
          style={{ color: 'var(--theme-primary)' }}
        >
          {activeTheme}
        </span>
        <span className="opacity-30">|</span>
        <span className="opacity-70">Open Windows:</span>
        <span
          className="font-bold font-accent"
          style={{ color: 'var(--theme-secondary)' }}
        >
          {windowCount}
        </span>
      </div>

      {/* CPU Graph */}
      <MetricGraph
        data={cpuData}
        color="var(--theme-primary)"
        label="CPU Usage"
        currentValue={currentCpu}
      />

      {/* Memory Graph */}
      <MetricGraph
        data={memData}
        color="var(--theme-accent)"
        label="Memory Usage"
        currentValue={currentMem}
      />

      {/* Network Activity - bar + sparkline */}
      <NetworkBar
        value={currentNet}
        color="var(--theme-secondary)"
        label="Network Activity"
      />
      <MetricGraph
        data={netData}
        color="var(--theme-secondary)"
        label="Network History"
        currentValue={currentNet}
      />
    </div>
  );
});

export default SystemMonitor;
