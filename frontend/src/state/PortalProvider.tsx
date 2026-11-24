import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { App, Spin, Result } from 'antd';
import { Button } from '../components/Button/Button';
import { PortalStore, SaveError } from './store';
import { PortalContext } from './context';
import { usePortalSnapshot } from './hooks';
import type { PortalRepository } from '../data/repository';

/** Creates the store, loads data once, and gates the app until it's ready. */
export function PortalProvider({ repository, children }: { repository: PortalRepository; children: ReactNode }) {
  const [store] = useState(() => new PortalStore(repository));

  const { message } = App.useApp();

  useEffect(() => {
    store.load();
  }, [store]);

  // One clear message when a change fails to save; the change has already been undone.
  useEffect(
    () =>
      store.onSaveError((m) =>
        message.error({ content: `Your last change wasn't saved and has been undone. ${m}`, duration: 6, key: 'save-error' }),
      ),
    [store, message],
  );

  // Callers may not catch SaveError; it's already been reported, so keep the console quiet.
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      if (e.reason instanceof SaveError) e.preventDefault();
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, []);

  return (
    <PortalContext.Provider value={store}>
      <LoadGate>{children}</LoadGate>
    </PortalContext.Provider>
  );
}

function LoadGate({ children }: { children: ReactNode }) {
  const snap = usePortalSnapshot();
  if (snap.status === 'loading' || !snap.data) {
    if (snap.status === 'error') return <LoadError message={snap.error} />;
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  return <>{children}</>;
}

function LoadError({ message }: { message: string | null }) {
  return (
    <Result
      status="error"
      title="Couldn't load the supplier programme"
      subTitle={message ?? 'Unknown error'}
      extra={
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try again
        </Button>
      }
    />
  );
}
