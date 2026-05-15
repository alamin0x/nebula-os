import { useState, useCallback, useEffect } from 'react'
import BootScreen from './components/BootScreen'
import LockScreen from './components/LockScreen'
import BootErrorBoundary from './components/BootErrorBoundary'
import Desktop from './components/Desktop'
import AudioPersistence from './components/AudioPersistence'
import './App.css'

/** Schema version — increment when localStorage structure changes */
const SCHEMA_VERSION = '1.0.0';
const SCHEMA_KEY = 'nebula-schema-version';

/** Check and clear stale localStorage if schema version changed */
function checkSchemaVersion(): void {
  try {
    const stored = localStorage.getItem(SCHEMA_KEY);
    if (stored !== SCHEMA_VERSION) {
      // Clear all nebula-related localStorage keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nebula-') && key !== SCHEMA_KEY) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(SCHEMA_KEY, SCHEMA_VERSION);
    }
  } catch {
    // localStorage unavailable, skip
  }
}

type AppPhase = 'boot' | 'lock' | 'desktop'

function getInitialPhase(): AppPhase {
  const booted = sessionStorage.getItem('nebula-booted') === 'true'
  const unlocked = sessionStorage.getItem('nebula-unlocked') === 'true'

  if (!booted) return 'boot'
  if (!unlocked) return 'lock'
  return 'desktop'
}

function App() {
  const [phase, setPhase] = useState<AppPhase>(getInitialPhase)

  // Check schema version on mount
  useEffect(() => {
    checkSchemaVersion();
  }, []);

  const handleBootComplete = useCallback(() => {
    setPhase('lock')
  }, [])

  const handleUnlock = useCallback(() => {
    setPhase('desktop')
  }, [])

  if (phase === 'desktop') {
    return (
      <>
        <AudioPersistence />
        <Desktop />
      </>
    )
  }

  if (phase === 'lock') {
    return (
      <>
        <AudioPersistence />
        <LockScreen onUnlock={handleUnlock} />
      </>
    )
  }

  return (
    <BootErrorBoundary fallback={<Desktop />}>
      <AudioPersistence />
      <BootScreen onComplete={handleBootComplete} />
    </BootErrorBoundary>
  )
}

export default App
