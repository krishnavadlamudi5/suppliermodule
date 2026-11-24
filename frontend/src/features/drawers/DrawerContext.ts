import { createContext, useContext } from 'react';
import type { AssessmentDraft } from '@shared/domain/types';

export interface DrawerApi {
  openAddSupplier: () => void;
  /** Opens New assessment, optionally pre-filled (type, tier, selected suppliers…) */
  openNewAssessment: (preset?: Partial<AssessmentDraft>) => void;
}

export const DrawerContext = createContext<DrawerApi | null>(null);

export function useDrawers(): DrawerApi {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('useDrawers must be used inside <DrawerHost>');
  return ctx;
}
