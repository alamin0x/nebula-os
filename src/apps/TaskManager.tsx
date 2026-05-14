import { useState, useEffect, useCallback, memo } from 'react';
import { useWindowStore } from '../stores/windowStore';

interface ProcessInfo {
  windowId: string;
  appId: string;
  title: string;
  cpu: number;
  memory: number;
}

function generateStats(): { cpu: number; memory: number } {
  return {
    cpu: Math.round(Math.random() * 30 * 10) / 10,
    memory: Math.round(Math.random() * 200 + 50),
  };
}

/**
 * TaskManager — shows open windows as "processes" with simulated stats.
 * Auto-refreshes every 2 seconds. Allows ending tasks (closing windows).
 */
const TaskManager = memo(function TaskManager() {
  const windows = useWindowStore((s) => s.windows);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);

  const refreshProcesses = useCallback(() => {
    const procs: ProcessInfo[] = windows.map((w) => ({
      windowId: w.id,
      appId: w.appId,
      title: w.title,
      ...generateStats(),
    }));
    setProcesses(procs);
  }, [windows]);

  useEffect(() => {
    refreshProcesses();
    const interval = setInterval(refreshProcesses, 2000);
    return () => clearInterval(interval);
  }, [refreshProcesses]);

  const handleEndTask = useCallback(
    (windowId: string) => {
      closeWindow(windowId);
    },
    [closeWindow]
  );

  const totalCpu = processes.reduce((sum, p) => sum + p.cpu, 0);
  const totalMemory = processes.reduce((sum, p) => sum + p.memory, 0);

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}
    >
      {/* Summary */}
      <div
        className="flex items-center gap-4 px-4 py-3 border-b"
        style={{ borderColor: 'var(--theme-surface)' }}
      >
        <span className="text-sm font-medium">
          Processes: {processes.length}
        </span>
        <span className="text-sm opacity-70">
          CPU: {totalCpu.toFixed(1)}%
        </span>
        <span className="text-sm opacity-70">
          Memory: {totalMemory.toFixed(0)} MB
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left text-xs opacity-60 border-b"
              style={{ borderColor: 'var(--theme-surface)' }}
            >
              <th className="px-4 py-2 font-medium">App</th>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium text-right">CPU %</th>
              <th className="px-4 py-2 font-medium text-right">Memory</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc) => (
              <tr
                key={proc.windowId}
                className="border-b hover:bg-[var(--theme-surface)] transition-colors"
                style={{ borderColor: 'var(--theme-surface)' }}
              >
                <td className="px-4 py-2">{proc.appId}</td>
                <td className="px-4 py-2 truncate max-w-[150px]">{proc.title}</td>
                <td className="px-4 py-2 text-right">{proc.cpu.toFixed(1)}%</td>
                <td className="px-4 py-2 text-right">{proc.memory} MB</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleEndTask(proc.windowId)}
                    className="px-2 py-0.5 rounded text-xs transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-background)' }}
                  >
                    End Task
                  </button>
                </td>
              </tr>
            ))}
            {processes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center opacity-50">
                  No running processes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 text-xs opacity-50 border-t"
        style={{ borderColor: 'var(--theme-surface)' }}
      >
        Auto-refreshes every 2s
      </div>
    </div>
  );
});

export default TaskManager;
