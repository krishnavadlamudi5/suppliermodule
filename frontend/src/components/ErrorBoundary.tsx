import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Result } from 'antd';
import { Button } from './Button/Button';

interface Props {
  children: ReactNode;
  /** "page" keeps the app frame and offers a way out; "app" replaces everything */
  scope?: 'page' | 'app';
}

interface State {
  error: Error | null;
}

/**
 * Catches a screen that crashes while rendering, so the user sees a clear
 * message instead of a blank app. Wrap each page (keyed by route) so moving
 * to another page clears the error.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const isPage = this.props.scope !== 'app';
    return (
      <Result
        status="error"
        title={isPage ? 'Something went wrong on this page' : 'Something went wrong'}
        subTitle="Your saved data is safe. Try reloading; if it keeps happening, tell the team what you clicked just before."
        extra={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload page
            </Button>
            {isPage && <Button onClick={() => (window.location.href = '/dashboard')}>Go to the dashboard</Button>}
          </div>
        }
      />
    );
  }
}
