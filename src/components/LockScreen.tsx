import { useState, useEffect, useCallback, memo } from 'react'
import { motion } from 'framer-motion'

interface LockScreenProps {
  onUnlock: () => void
}

const CORRECT_PASSWORD = 'nebula'

/**
 * LockScreen — shown after boot, requires password to unlock.
 * Glassmorphism styling with time/date display and shake animation on wrong password.
 */
export default memo(function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [time, setTime] = useState(new Date())

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (password === CORRECT_PASSWORD) {
        sessionStorage.setItem('nebula-unlocked', 'true')
        onUnlock()
      } else {
        setError(true)
        setShakeKey((k) => k + 1)
        setPassword('')
        setTimeout(() => setError(false), 2000)
      }
    },
    [password, onUnlock]
  )

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const formattedDate = time.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className="fixed inset-0 z-[900] flex flex-col items-center justify-center"
      style={{
        background:
          'linear-gradient(135deg, #0c0c2e 0%, #1a0533 40%, #0d1b3e 70%, #060618 100%)',
      }}
      data-testid="lock-screen"
    >
      {/* Time */}
      <p
        className="text-7xl font-light tracking-wide mb-2 select-none"
        style={{ color: 'var(--theme-text, #e0e0e0)' }}
      >
        {formattedTime}
      </p>

      {/* Date */}
      <p
        className="text-lg opacity-70 mb-12 select-none"
        style={{ color: 'var(--theme-text, #e0e0e0)' }}
      >
        {formattedDate}
      </p>

      {/* Glass card */}
      <motion.div
        key={shakeKey}
        animate={
          shakeKey > 0
            ? { x: [0, -10, 10, -6, 6, -2, 2, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4 px-10 py-8 rounded-2xl border"
        style={{
          backgroundColor: 'rgba(15, 15, 25, 0.6)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          👤
        </div>

        {/* Username */}
        <p
          className="text-base font-medium"
          style={{ color: 'var(--theme-text, #e0e0e0)' }}
        >
          guest
        </p>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-full">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-56 px-4 py-2 rounded-lg text-sm outline-none border transition-colors duration-200"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderColor: error
                ? '#ef4444'
                : 'rgba(255,255,255,0.15)',
              color: 'var(--theme-text, #e0e0e0)',
            }}
            data-testid="lock-screen-password"
          />
          <button
            type="submit"
            className="w-56 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            style={{
              backgroundColor: 'var(--theme-primary, #a855f7)',
              color: 'var(--theme-background, #0a0a0f)',
            }}
          >
            Unlock
          </button>
        </form>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-400">Incorrect password</p>
        )}
      </motion.div>
    </div>
  )
})
