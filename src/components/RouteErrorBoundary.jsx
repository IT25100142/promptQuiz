import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Route error:', error, info)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-red-900 dark:text-red-200">Something went wrong</h1>
          <p className="mt-2 text-sm text-red-800 dark:text-red-300">{error.message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-xl bg-red-700 dark:bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 dark:hover:bg-red-500 transition-colors"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <Link
              to="/decks"
              className="rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
            >
              Back to Library
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
