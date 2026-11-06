import React from "react"

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: 32,
            margin: 24,
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 600,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f87171" }}>
            Something went wrong in this view
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </p>
          <div>
            <button
              onClick={this.handleReset}
              className="btn btn-secondary"
              style={{ fontSize: 13 }}
              aria-label="Try recovering view"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
