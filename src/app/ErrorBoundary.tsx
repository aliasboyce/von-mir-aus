import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Without this, any render error anywhere in the tree unmounts the
 * entire app, leaving a genuinely blank white screen with no way to
 * recover except a hard reload — which is exactly what "click Weiter,
 * then nothing shows up" looks like from the outside. This turns that
 * into a calm, recoverable message instead, and is a structural safety
 * net for the whole app, not just the tour.
 *
 * Deliberately plain inline styles, not the app's CSS custom properties
 * — if something is broken badly enough to reach here, the theme system
 * itself might be part of what's unhappy, so this stays as simple and
 * dependency-free as possible.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('App render error caught by ErrorBoundary:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            background: '#faf8f5',
            color: '#3a3530',
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Kurz nicht verfügbar</p>
          <p style={{ fontSize: 14, color: '#75706a', marginBottom: 24, maxWidth: 320, lineHeight: 1.5 }}>
            Da ist etwas schiefgelaufen. Deine gespeicherten Daten sind davon nicht betroffen. Ein Neustart hilft meistens.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 24px',
              borderRadius: 999,
              border: 'none',
              background: '#5C7ACB',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Zur Startseite
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
