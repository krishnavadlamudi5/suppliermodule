import { applyCommand, nextId } from '../domain/commands';
import type { AssignmentRef, PortalCommand } from '../domain/commands';
import type {
  ActionStatus,
  AssessmentDraft,
  EvidenceStatus,
  PortalData,
  ProgrammeSettings,
  ReviewDecision,
  SupplierDraft,
} from '../domain/types';
import type { PortalRepository } from '../data/repository';

export type StoreStatus = 'loading' | 'ready' | 'error';

export interface StoreSnapshot {
  status: StoreStatus;
  data: PortalData | null;
  error: string | null;
}

/**
 * Holds portal data for the UI. Every change is applied optimistically, then
 * sent to the repository; if the repository rejects it, the change is rolled
 * back and the error re-thrown for the caller to show.
 */
export class PortalStore {
  private snapshot: StoreSnapshot = { status: 'loading', data: null, error: null };
  private listeners = new Set<() => void>();
  private repo: PortalRepository;

  constructor(repo: PortalRepository) {
    this.repo = repo;
    // Bind actions so screens can destructure them: const { invite } = usePortalActions()
    const self = this as unknown as Record<string, unknown>;
    for (const key of Object.getOwnPropertyNames(PortalStore.prototype)) {
      // Read the descriptor, not the property, so getters (like `data`) aren't invoked
      const fn = Object.getOwnPropertyDescriptor(PortalStore.prototype, key)?.value;
      if (key !== 'constructor' && typeof fn === 'function') self[key] = fn.bind(this);
    }
  }

  getSnapshot = () => this.snapshot;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(next: Partial<StoreSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach((l) => l());
  }

  async load() {
    this.set({ status: 'loading', error: null });
    try {
      this.set({ status: 'ready', data: await this.repo.load() });
    } catch (e) {
      this.set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  }

  private get data(): PortalData {
    if (!this.snapshot.data) throw new Error('Portal data not loaded');
    return this.snapshot.data;
  }

  async dispatch(command: PortalCommand): Promise<void> {
    const before = this.data;
    this.set({ data: applyCommand(before, command) });
    try {
      await this.repo.execute(command);
    } catch (e) {
      // Roll back only our change if nothing else has happened since
      if (this.snapshot.data && this.snapshot.data !== before) this.set({ data: before });
      throw e;
    }
  }

  /* ---------- Intent-level actions used by screens ---------- */

  invite(refs: AssignmentRef[]) {
    return this.dispatch({ type: 'inviteAssignments', refs });
  }

  /** Invite every never-invited assignment, optionally limited to one assessment or some suppliers. */
  inviteAllNotInvited(filter: { assessmentId?: string; supplierIds?: string[] } = {}) {
    const refs = this.data.assignments
      .filter(
        (a) =>
          a.status === 'not_invited' &&
          (!filter.assessmentId || a.assessmentId === filter.assessmentId) &&
          (!filter.supplierIds || filter.supplierIds.includes(a.supplierId)),
      )
      .map(({ assessmentId, supplierId }) => ({ assessmentId, supplierId }));
    return this.invite(refs).then(() => refs.length);
  }

  /** Add suppliers to an existing assessment (skips anyone already in it). */
  addToAssessment(assessmentId: string, supplierIds: string[], dueDate: string, invite = true) {
    return this.dispatch({ type: 'addToAssessment', assessmentId, supplierIds, dueDate, invite });
  }

  raiseAction(flagId: string) {
    const actionId = nextId(this.data.actions.map((a) => a.id), 'IA-', 2);
    return this.dispatch({ type: 'raiseAction', flagId, actionId }).then(() => actionId);
  }

  setEvidenceStatus(evidenceId: string, status: EvidenceStatus) {
    return this.dispatch({ type: 'setEvidenceStatus', evidenceId, status });
  }

  toggleReviewDecision(assessmentId: string, supplierId: string, questionCode: string, decision: ReviewDecision) {
    return this.dispatch({ type: 'toggleReviewDecision', assessmentId, supplierId, questionCode, decision });
  }

  sendMessage(assessmentId: string, supplierId: string, questionCode: string, text: string) {
    return this.dispatch({ type: 'sendMessage', assessmentId, supplierId, questionCode, text });
  }

  markReviewed(ref: AssignmentRef) {
    return this.dispatch({ type: 'completeReview', ref, outcome: 'reviewed' });
  }

  sendBack(ref: AssignmentRef) {
    return this.dispatch({ type: 'completeReview', ref, outcome: 'reopened' });
  }

  createAction(input: { supplierId: string; title: string; owner: string; dueDate: string }) {
    const actionId = nextId(this.data.actions.map((a) => a.id), 'IA-', 2);
    return this.dispatch({ type: 'createAction', actionId, ...input }).then(() => actionId);
  }

  moveAction(actionId: string, status: ActionStatus) {
    return this.dispatch({ type: 'moveAction', actionId, status });
  }

  addSupplier(draft: SupplierDraft) {
    const supplierId = nextId(this.data.suppliers.map((s) => s.id), 'SUP-', 3);
    return this.dispatch({ type: 'addSupplier', supplierId, draft }).then(() => supplierId);
  }

  launchAssessment(draft: AssessmentDraft) {
    const assessmentId = nextId(this.data.assessments.map((a) => a.id), 'A', 1);
    return this.dispatch({ type: 'launchAssessment', assessmentId, draft }).then(() => assessmentId);
  }

  markAllNotificationsRead() {
    return this.dispatch({ type: 'markAllNotificationsRead' });
  }

  updateSettings(patch: Partial<ProgrammeSettings>) {
    return this.dispatch({ type: 'updateSettings', patch });
  }

  updateOrg(name: string, contactEmail: string) {
    return this.dispatch({ type: 'updateOrg', name, contactEmail });
  }
}
