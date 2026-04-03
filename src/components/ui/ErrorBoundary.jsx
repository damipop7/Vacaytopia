import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production, send to your error monitoring service (e.g. Sentry)
    console.error('Vacaytopia Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6 text-center"
          style={{ background: 'var(--bg)' }}
        >
          <div className="max-w-md">
            <div className="text-5xl mb-5">🌊</div>
            <h1 className="font-display font-black text-2xl text-[#0D1B3E] mb-3">
              Something went wrong
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              An unexpected error occurred. Your data is safe. Try refreshing the page
              — if this keeps happening, contact support.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary text-sm"
              >
                Refresh Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
                className="btn-outline text-sm"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left bg-red-50 border border-red-200 rounded-card p-4">
                <summary className="text-xs font-bold text-red-700 cursor-pointer">Error details (dev only)</summary>
                <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
