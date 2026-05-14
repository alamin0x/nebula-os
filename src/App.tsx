import { useState, useCallback } from 'react'
import BootScreen from './components/BootScreen'
import BootErrorBoundary from './components/BootErrorBoundary'
import Desktop from './components/Desktop'
import AudioPersistence from './components/AudioPersistence'
import './App.css'

function App() {
  const [booted, setBooted] = useState(() => {
    return sessionStorage.getItem('nebula-booted') === 'true'
  })

  const handleBootComplete = useCallback(() => {
    setBooted(true)
  }, [])

  if (booted) {
    return (
      <>
        <AudioPersistence />
        <Desktop />
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
