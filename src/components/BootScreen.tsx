import { useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BootScreenProps {
  onComplete: () => void
}

const BOOT_MESSAGES = [
  'Initializing Nebula Core...',
  'Loading modules...',
  'Access granted.',
]

const ASCII_ART = `
 ███╗   ██╗███████╗██████╗ ██╗   ██╗██╗      █████╗ 
 ████╗  ██║██╔════╝██╔══██╗██║   ██║██║     ██╔══██╗
 ██╔██╗ ██║█████╗  ██████╔╝██║   ██║██║     ███████║
 ██║╚██╗██║██╔══╝  ██╔══██╗██║   ██║██║     ██╔══██╗
 ██║ ╚████║███████╗██████╔╝╚██████╔╝███████╗██║  ██║
 ╚═╝  ╚═══╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝
              ██████╗ ███████╗
             ██╔═══██╗██╔════╝
             ██║   ██║███████╗
             ██║   ██║╚════██║
             ╚██████╔╝███████║
              ╚═════╝ ╚══════╝
`

const TOTAL_DURATION = 3000 // 3 seconds total boot time
const MESSAGE_DELAY = 700 // delay between messages (500-1000ms range)
const GLITCH_DURATION = 400 // ≤500ms glitch transition

export default memo(function BootScreen({ onComplete }: BootScreenProps) {
  const [progress, setProgress] = useState(0)
  const [visibleMessages, setVisibleMessages] = useState<string[]>([])
  const [isGlitching, setIsGlitching] = useState(false)

  const handleBootComplete = useCallback(() => {
    setIsGlitching(true)
    setTimeout(() => {
      sessionStorage.setItem('nebula-booted', 'true')
      onComplete()
    }, GLITCH_DURATION)
  }, [onComplete])

  // Progress bar animation
  useEffect(() => {
    const stepMs = 50
    const totalSteps = TOTAL_DURATION / stepMs
    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++
      const newProgress = Math.min((currentStep / totalSteps) * 100, 100)
      setProgress(newProgress)

      if (currentStep >= totalSteps) {
        clearInterval(interval)
        handleBootComplete()
      }
    }, stepMs)

    return () => clearInterval(interval)
  }, [handleBootComplete])

  // Sequential message display
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    BOOT_MESSAGES.forEach((message, index) => {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => [...prev, message])
      }, MESSAGE_DELAY * (index + 1))
      timers.push(timer)
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        className="h-full w-full bg-nebula-black flex flex-col items-center justify-center z-[1000] fixed inset-0"
        data-testid="boot-screen"
        animate={
          isGlitching
            ? {
                x: [0, -2, 2, -1, 1, 0],
                y: [0, 2, -2, 1, -1, 0],
                opacity: [1, 0.8, 0.6, 0.4, 0.2, 0],
              }
            : { x: 0, y: 0, opacity: 1 }
        }
        transition={
          isGlitching
            ? { duration: GLITCH_DURATION / 1000, ease: 'easeOut' }
            : undefined
        }
      >
        {/* ASCII Art */}
        <motion.pre
          className="text-nebula-purple font-mono text-[0.45rem] sm:text-xs md:text-sm leading-tight mb-8 select-none whitespace-pre"
          aria-label="NEBULA OS"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {ASCII_ART}
        </motion.pre>

        {/* Progress Bar */}
        <div className="w-64 sm:w-80 h-2 bg-nebula-surface rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-nebula-purple via-nebula-cyan to-nebula-pink rounded-full"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Boot Messages */}
        <div className="text-center space-y-1 min-h-[4rem]">
          {visibleMessages.map((message, index) => (
            <motion.p
              key={index}
              className="font-primary text-nebula-text text-sm"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {message}
            </motion.p>
          ))}
          {/* Blinking cursor indicator */}
          {!isGlitching && (
            <motion.span
              className="inline-block w-2 h-4 mt-2"
              style={{ backgroundColor: 'var(--theme-primary, #8B5CF6)' }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              aria-hidden="true"
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
});
