import { useState, useCallback } from 'react'
import BootScreen from './components/BootScreen'
import LockScreen from './components/LockScreen'
import BootErrorBoundary from './components/BootErrorBoundary'
import Desktop from './components/Desktop'
import AudioPersistence from './components/AudioPersistence'
import './App.css'

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
