import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WallpaperOption = 'nebula-default' | 'deep-space' | 'cyber-grid' | 'aurora-borealis' | 'midnight';

export interface WallpaperDef {
  id: WallpaperOption;
  name: string;
  css: string;
}

export const WALLPAPER_OPTIONS: WallpaperDef[] = [
  {
    id: 'nebula-default',
    name: 'Nebula Default',
    css: '', // Uses the animated BackgroundRenderer
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    css: 'linear-gradient(135deg, #0c0c2e 0%, #1a0533 40%, #0d1b3e 70%, #060618 100%)',
  },
  {
    id: 'cyber-grid',
    name: 'Cyber Grid',
    css: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)',
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    css: 'linear-gradient(135deg, #0a1628 0%, #0d3b2e 30%, #1a4a3a 50%, #0a2840 70%, #0c1445 100%)',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    css: 'linear-gradient(180deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)',
  },
];

export type SettingsTab = 'account' | 'display' | 'network' | 'power' | 'privacy';

export interface SettingsState {
  // Display
  wallpaper: WallpaperOption;
  darkMode: boolean;
  nightShift: boolean;

  // Privacy
  locationEnabled: boolean;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  analyticsEnabled: boolean;

  // Power & Sleep
  screenTimeout: number; // minutes
  sleepTimer: number; // minutes
  batterySaver: boolean;

  // Active tab for Settings app
  settingsActiveTab: SettingsTab;

  // Actions
  setWallpaper: (wallpaper: WallpaperOption) => void;
  setDarkMode: (enabled: boolean) => void;
  setNightShift: (enabled: boolean) => void;
  setLocationEnabled: (enabled: boolean) => void;
  setCameraEnabled: (enabled: boolean) => void;
  setMicrophoneEnabled: (enabled: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  setScreenTimeout: (minutes: number) => void;
  setSleepTimer: (minutes: number) => void;
  setBatterySaver: (enabled: boolean) => void;
  setSettingsActiveTab: (tab: SettingsTab) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      wallpaper: 'nebula-default',
      darkMode: true,
      nightShift: false,
      locationEnabled: false,
      cameraEnabled: true,
      microphoneEnabled: true,
      analyticsEnabled: false,
      screenTimeout: 15,
      sleepTimer: 30,
      batterySaver: false,
      settingsActiveTab: 'account',

      setWallpaper: (wallpaper) => set({ wallpaper }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setNightShift: (nightShift) => set({ nightShift }),
      setLocationEnabled: (locationEnabled) => set({ locationEnabled }),
      setCameraEnabled: (cameraEnabled) => set({ cameraEnabled }),
      setMicrophoneEnabled: (microphoneEnabled) => set({ microphoneEnabled }),
      setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),
      setScreenTimeout: (screenTimeout) => set({ screenTimeout }),
      setSleepTimer: (sleepTimer) => set({ sleepTimer }),
      setBatterySaver: (batterySaver) => set({ batterySaver }),
      setSettingsActiveTab: (settingsActiveTab) => set({ settingsActiveTab }),
    }),
    {
      name: 'nebula-settings',
    }
  )
);
