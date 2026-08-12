import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { reportError } from '../lib/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional key whose change should reset the boundary (e.g. route pathname). */
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  /** Incremented on each retry to force-remount the child subtree. */
  retryKey: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  // When resetKey changes (e.g. navigation away then back), clear the error
  // state so the boundary can render children again for a fresh attempt.
  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState((s) => ({ hasError: false, error: null, retryKey: s.retryKey + 1 }));
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // Defer off the React render commit phase.
    reportError(error, {
      componentStack: info.componentStack ?? undefined,
      source: 'ErrorBoundary',
    });
  }

  private handleRetry = () => {
    // Force a fresh mount of the child subtree instead of merely clearing the
    // error flag — this avoids an instant re-throw of deterministic errors.
    this.setState((s) => ({ hasError: false, error: null, retryKey: s.retryKey + 1 }));
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
          <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">
              出错了 / Something went wrong
            </h2>
            <p className="text-secondary text-sm mb-6 break-words">
              {this.state.error?.message || '发生了一个意外错误 / An unexpected error occurred'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-semibold hover:shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="重试 / Try Again"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                重试 / Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="重新加载本页 / Reload Page"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                重新加载 / Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}
