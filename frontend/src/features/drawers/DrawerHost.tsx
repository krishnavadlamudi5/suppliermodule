import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DrawerContext } from './DrawerContext';
import type { DrawerApi } from './DrawerContext';
import { AddSupplierDrawer } from './AddSupplierDrawer';
import { NewAssessmentDrawer } from './NewAssessmentDrawer';
import type { AssessmentDraft } from '@shared/domain/types';

/** Owns the app's create-flow panels so any screen can open them. */
export function DrawerHost({ children }: { children: ReactNode }) {
  const [addSupplier, setAddSupplier] = useState(false);
  const [assessPreset, setAssessPreset] = useState<Partial<AssessmentDraft> | null>(null);
  // Bump to remount a panel with fresh state each time it opens
  const [session, setSession] = useState(0);

  const api = useMemo<DrawerApi>(
    () => ({
      openAddSupplier: () => {
        setSession((n) => n + 1);
        setAddSupplier(true);
      },
      openNewAssessment: (preset = {}) => {
        setSession((n) => n + 1);
        setAssessPreset(preset);
      },
    }),
    [],
  );

  return (
    <DrawerContext.Provider value={api}>
      {children}
      <AddSupplierDrawer key={`s${session}`} open={addSupplier} onClose={() => setAddSupplier(false)} />
      <NewAssessmentDrawer key={`a${session}`} open={assessPreset != null} preset={assessPreset ?? {}} onClose={() => setAssessPreset(null)} />
    </DrawerContext.Provider>
  );
}
