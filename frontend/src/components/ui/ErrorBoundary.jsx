import React from 'react';
import { AlertTriangle, RotateCw, Home, Bug } from 'lucide-react';
import { Button } from './Button';

/* ═══════════════════════════════════════════════════════════
   ErrorBoundary — komponent crash bolsa ak ekran deregine
   düşnükli ýalňyşlyk ekrany (AUDIT.md F23)
   ───────────────────────────────────────────────────────────
   <ErrorBoundary fallback={…} onError={(err, info) => report(err)}>
     <Route element />
   </ErrorBoundary>

   Class component bolmaly — React-de diňe şular `componentDidCatch`
   goldaýar.
   ═══════════════════════════════════════════════════════════ */

const MAX_STACK_LINES = 8;

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, key: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ info: errorInfo });

    // Daşarky hasabat (Sentry we ş.m.) — prop berilse
    try {
      this.props.onError?.(error, errorInfo);
    } catch {
      /* reporter-iň özi döwülse, UI-e täsir etmesin */
    }

    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, errorInfo?.componentStack);
  }

  /** Route üýtgände awtomatik arassalamak üçin `resetKey` prop-y */
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== undefined && props.resetKey !== state.lastResetKey) {
      return { error: null, info: null, lastResetKey: props.resetKey };
    }
    return null;
  }

  reset = () => this.setState((s) => ({ error: null, info: null, key: s.key + 1 }));

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback({ error, info, reset: this.reset })
        : this.props.fallback;
    }

    return (
      <ErrorFallback
        error={error}
        componentStack={info?.componentStack}
        onReset={this.reset}
        title={this.props.title}
        description={this.props.description}
      />
    );
  }
}

export function ErrorFallback({
  error, componentStack, onReset, title = 'Something went wrong', description, fullPage = false,
}) {
  const stack = String(componentStack || error?.stack || '')
    .split('\n')
    .filter(Boolean)
    .slice(0, MAX_STACK_LINES)
    .join('\n');

  return (
    <div
      className={fullPage ? 'flex-center' : ''}
      style={{
        minHeight: fullPage ? '100dvh' : 'auto',
        padding: fullPage ? 'var(--space-6)' : 0,
      }}
    >
      <div className="card" style={{ maxWidth: 560, width: '100%', padding: 'var(--space-8)', textAlign: 'center' }}>
        <span
          style={{
            display: 'grid', placeItems: 'center', width: 60, height: 60, margin: '0 auto var(--space-5)',
            borderRadius: 'var(--radius-xl)', background: 'var(--error-bg)',
            border: '1px solid var(--error-border)', color: 'var(--error-text)',
          }}
          aria-hidden="true"
        >
          <AlertTriangle size={27} />
        </span>

        <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: 'var(--space-2)' }}>{title}</h2>
        <p className="text-sm text-muted" style={{ maxWidth: '44ch', margin: '0 auto var(--space-6)' }}>
          {description || 'An unexpected error occurred while rendering this section. Your data is safe.'}
        </p>

        {error?.message && (
          <pre
            style={{
              textAlign: 'left', padding: 'var(--space-3)', marginBottom: 'var(--space-5)',
              fontSize: 'var(--font-2xs)', lineHeight: 1.5, color: 'var(--error-text)',
              background: 'var(--bg-sunken)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', overflowX: 'auto', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', maxHeight: 120,
            }}
          >
            {error.message}
          </pre>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" icon={RotateCw} onClick={onReset || (() => window.location.reload())}>
            Try again
          </Button>
          <Button variant="ghost" icon={Home} onClick={() => { window.location.href = '/'; }}>
            Go home
          </Button>
        </div>

        {import.meta.env?.DEV && stack && (
          <details style={{ marginTop: 'var(--space-6)', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontSize: 'var(--font-xs)', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bug size={13} /> Component stack (dev only)
            </summary>
            <pre
              style={{
                marginTop: 'var(--space-2)', padding: 'var(--space-3)', fontSize: 'var(--font-2xs)',
                color: 'var(--text-muted)', background: 'var(--bg-sunken)',
                borderRadius: 'var(--radius-md)', overflowX: 'auto', whiteSpace: 'pre-wrap',
              }}
            >
              {stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/** Route üýtgände boundary-ni arassalaýan helper wrapper */
export function RouteErrorBoundary({ children, pathname, onError }) {
  return (
    <ErrorBoundary resetKey={pathname} onError={onError} fullPage>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
