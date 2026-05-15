import { memo, useCallback } from 'react';
import { useSettingsStore, WALLPAPER_OPTIONS } from '../stores/settingsStore';
import type { WallpaperOption, SettingsTab } from '../stores/settingsStore';

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'display', label: 'Display', icon: '🖥️' },
  { id: 'network', label: 'Network', icon: '📡' },
  { id: 'power', label: 'Power & Sleep', icon: '🔋' },
  { id: 'privacy', label: 'Privacy', icon: '🔒' },
];

/**
 * Settings app with sidebar navigation and content panels.
 */
const Settings = memo(function Settings() {
  const activeTab = useSettingsStore((s) => s.settingsActiveTab);
  const setActiveTab = useSettingsStore((s) => s.setSettingsActiveTab);

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden rounded-b-lg" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Sidebar */}
      <nav
        className="w-full md:w-48 shrink-0 border-b md:border-b-0 md:border-r flex flex-row md:flex-col py-1 md:py-2 overflow-x-auto md:overflow-x-visible"
        style={{ borderColor: 'var(--theme-surface)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-left transition-colors duration-150 whitespace-nowrap shrink-0"
            style={{
              color: activeTab === tab.id ? 'var(--theme-primary)' : 'var(--theme-text)',
              backgroundColor: activeTab === tab.id ? 'var(--theme-surface)' : 'transparent',
            }}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'account' && <AccountPanel />}
        {activeTab === 'display' && <DisplayPanel />}
        {activeTab === 'network' && <NetworkPanel />}
        {activeTab === 'power' && <PowerPanel />}
        {activeTab === 'privacy' && <PrivacyPanel />}
      </div>
    </div>
  );
});

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-primary)' }}>
      {children}
    </h2>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm" style={{ color: 'var(--theme-text)' }}>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? 'var(--theme-primary)' : 'var(--theme-surface)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </label>
  );
}

function AccountPanel() {
  return (
    <div>
      <SectionTitle>Account</SectionTitle>
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: 'var(--theme-surface)' }}
        >
          👤
        </div>
        <div>
          <p className="text-base font-medium" style={{ color: 'var(--theme-text)' }}>guest</p>
          <p className="text-xs opacity-60" style={{ color: 'var(--theme-text)' }}>Local Account</p>
        </div>
      </div>
      <div className="space-y-3">
        <InfoRow label="Username" value="guest" />
        <InfoRow label="OS Version" value="Nebula OS v1.0.0" />
        <InfoRow label="Build" value="2024.1.0-stable" />
        <InfoRow label="Shell" value="nebula-term" />
      </div>
    </div>
  );
}

function DisplayPanel() {
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const nightShift = useSettingsStore((s) => s.nightShift);
  const setWallpaper = useSettingsStore((s) => s.setWallpaper);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const setNightShift = useSettingsStore((s) => s.setNightShift);

  const handleWallpaperChange = useCallback((id: WallpaperOption) => {
    setWallpaper(id);
  }, [setWallpaper]);

  return (
    <div>
      <SectionTitle>Display</SectionTitle>

      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--theme-text)' }}>Wallpaper</h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {WALLPAPER_OPTIONS.map((wp) => (
          <button
            key={wp.id}
            onClick={() => handleWallpaperChange(wp.id)}
            className="rounded-lg overflow-hidden border-2 transition-all duration-200 p-0"
            style={{
              borderColor: wallpaper === wp.id ? 'var(--theme-primary)' : 'var(--theme-surface)',
            }}
          >
            <div
              className="w-full h-16 rounded-t-md"
              style={{
                background: wp.css || 'linear-gradient(135deg, #1a0533 0%, #0c0c2e 50%, #0d1b3e 100%)',
              }}
            />
            <p className="text-xs py-1.5 px-1 truncate" style={{ color: 'var(--theme-text)' }}>
              {wp.name}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <Toggle label="Dark Mode" checked={darkMode} onChange={setDarkMode} />
        <Toggle label="Night Shift" checked={nightShift} onChange={setNightShift} />
      </div>
    </div>
  );
}

function NetworkPanel() {
  return (
    <div>
      <SectionTitle>Network</SectionTitle>
      <div className="space-y-3">
        <InfoRow label="Status" value="Connected" />
        <InfoRow label="WiFi Network" value="NebulaNet-5G" />
        <InfoRow label="IP Address" value="192.168.1.42" />
        <InfoRow label="MAC Address" value="4A:3B:2C:1D:0E:FF" />
        <InfoRow label="Signal Strength" value="Excellent" />
        <InfoRow label="Download Speed" value="∞ Mbps" />
      </div>
    </div>
  );
}

function PowerPanel() {
  const screenTimeout = useSettingsStore((s) => s.screenTimeout);
  const sleepTimer = useSettingsStore((s) => s.sleepTimer);
  const batterySaver = useSettingsStore((s) => s.batterySaver);
  const setScreenTimeout = useSettingsStore((s) => s.setScreenTimeout);
  const setSleepTimer = useSettingsStore((s) => s.setSleepTimer);
  const setBatterySaver = useSettingsStore((s) => s.setBatterySaver);

  return (
    <div>
      <SectionTitle>Power & Sleep</SectionTitle>

      <div className="mb-4">
        <label className="text-sm block mb-2" style={{ color: 'var(--theme-text)' }}>
          Screen Timeout: {screenTimeout} min
        </label>
        <input
          type="range"
          min={1}
          max={60}
          value={screenTimeout}
          onChange={(e) => setScreenTimeout(Number(e.target.value))}
          className="w-full accent-[var(--theme-primary)]"
        />
      </div>

      <div className="mb-4">
        <label className="text-sm block mb-2" style={{ color: 'var(--theme-text)' }}>
          Sleep Timer: {sleepTimer} min
        </label>
        <input
          type="range"
          min={5}
          max={120}
          value={sleepTimer}
          onChange={(e) => setSleepTimer(Number(e.target.value))}
          className="w-full accent-[var(--theme-primary)]"
        />
      </div>

      <Toggle label="Battery Saver" checked={batterySaver} onChange={setBatterySaver} />
    </div>
  );
}

function PrivacyPanel() {
  const locationEnabled = useSettingsStore((s) => s.locationEnabled);
  const cameraEnabled = useSettingsStore((s) => s.cameraEnabled);
  const microphoneEnabled = useSettingsStore((s) => s.microphoneEnabled);
  const analyticsEnabled = useSettingsStore((s) => s.analyticsEnabled);
  const setLocationEnabled = useSettingsStore((s) => s.setLocationEnabled);
  const setCameraEnabled = useSettingsStore((s) => s.setCameraEnabled);
  const setMicrophoneEnabled = useSettingsStore((s) => s.setMicrophoneEnabled);
  const setAnalyticsEnabled = useSettingsStore((s) => s.setAnalyticsEnabled);

  return (
    <div>
      <SectionTitle>Privacy</SectionTitle>
      <div className="space-y-1">
        <Toggle label="Location Services" checked={locationEnabled} onChange={setLocationEnabled} />
        <Toggle label="Camera Access" checked={cameraEnabled} onChange={setCameraEnabled} />
        <Toggle label="Microphone Access" checked={microphoneEnabled} onChange={setMicrophoneEnabled} />
        <Toggle label="Analytics & Telemetry" checked={analyticsEnabled} onChange={setAnalyticsEnabled} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--theme-surface)' }}>
      <span className="text-sm opacity-70" style={{ color: 'var(--theme-text)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{value}</span>
    </div>
  );
}

export default Settings;
