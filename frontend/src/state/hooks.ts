import { useContext, useSyncExternalStore } from 'react';
import { PortalContext } from './context';
import type { PortalStore, StoreSnapshot } from './store';
import type { PortalData } from '@shared/domain/types';

export function usePortalStore(): PortalStore {
  const store = useContext(PortalContext);
  if (!store) throw new Error('usePortalStore must be used inside <PortalProvider>');
  return store;
}

export function usePortalSnapshot(): StoreSnapshot {
  const store = usePortalStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

/**
 * The loaded portal data. Safe to call anywhere under <PortalProvider> —
 * the provider doesn't render children until data is ready.
 * Derive values with selectors from domain/selectors (wrap in useMemo if costly).
 */
export function usePortal(): PortalData {
  const snap = usePortalSnapshot();
  if (!snap.data) throw new Error('Portal data not loaded');
  return snap.data;
}

/** Intent-level actions (invite, raiseAction, addSupplier…). Each returns a promise. */
export const usePortalActions = () => usePortalStore();
