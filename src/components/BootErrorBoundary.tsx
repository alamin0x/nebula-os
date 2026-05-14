import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Error boundary that wraps the BootScreen.
 * If the boot sequence fails for any reason, it skips to the Desktop.
 */
export default class BootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch() {
    // Skip boot on failure - set the flag so we don't retry
    sessionStorage.setItem('nebula-booted', 'true')
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
