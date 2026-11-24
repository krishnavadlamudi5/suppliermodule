import { describe, expect, it } from 'vitest';
import { createSampleData } from '@shared/fixtures/sampleData';
import { applyCommand, nextId } from '@shared/domain/commands';
import {
  activeAssignments,
  addDays,
  assessmentProgress,
  effectiveDecision,
  biggestDrop,
  engageFirst,
  funnelStages,
  isOverdue,
  maturityCounts,
  maturityName,
  needs,
  openItemCount,
  reviewInboxCount,
  riskOf,
  suggestTier,
  supplierById,
} from '@shared/domain/selectors';
import { PortalStore } from '../state/store';
import { createMockRepository } from '../data/mockRepository';
import type { PortalRepository } from '../data/repository';

const d = createSampleData();
const sup = (id: string) => supplierById(d, id)!;

describe('dates', () => {
  it('treats a due date as overdue only after the day has passed', () => {
    expect(isOverdue('2026-11-24', '2026-11-23')).toBe(true);
    expect(isOverdue('2026-11-24', '2026-11-24')).toBe(false);
    expect(isOverdue('2026-11-24', null)).toBe(false);
  });
  it('adds days across month ends', () => {
    expect(addDays('2026-11-24', 21)).toBe('2026-12-15');
  });
});

describe('risk and maturity (matches the prototype)', () => {
  it('rates risk from flags, score and compliance', () => {
    expect(riskOf(d, sup('SUP-003'))).toBe('High'); // open red flags
    expect(riskOf(d, sup('SUP-008'))).toBe('High'); // flag with an action is still unresolved
    expect(riskOf(d, sup('SUP-010'))).toBe('Medium'); // score 56
    expect(riskOf(d, sup('SUP-009'))).toBe('Low');
    expect(riskOf(d, sup('SUP-014'))).toBe('Low');
    expect(riskOf(d, sup('SUP-007'))).toBeNull(); // not assessed
  });

  it('maps scores to maturity levels', () => {
    expect(maturityName(59)).toBe('Nascent');
    expect(maturityName(60)).toBe('Emerging');
    expect(maturityName(83)).toBe('Progressive');
    expect(maturityName(null)).toBeNull();
    expect(maturityCounts(d.suppliers.filter((s) => s.tier === 1))).toEqual([3, 0, 1, 1, 0]);
    expect(maturityCounts(d.suppliers.filter((s) => s.tier === 2))).toEqual([1, 2, 0, 0, 0]);
  });

  it('lists high-spend, low-score suppliers to engage first', () => {
    expect(engageFirst(d).map((s) => s.id)).toEqual(['SUP-008', 'SUP-010']);
  });

  it('suggests Tier 1 for high spend or a critical category', () => {
    expect(suggestTier(d, 60, 'Wood')).toBe(1);
    expect(suggestTier(d, 10, 'Process chemicals')).toBe(1);
    expect(suggestTier(d, 10, 'Wood')).toBe(2);
  });
});

describe('programme status', () => {
  it('counts what needs attention', () => {
    expect(needs(d)).toEqual({ review: 3, overdue: 1, notInvited: 3, flags: 3, flagsAll: 6, evidence: 3, questions: 1 });
    expect(reviewInboxCount(d)).toBe(10);
  });

  it('builds the assessment funnel split by tier', () => {
    const stages = funnelStages(d, activeAssignments(d));
    expect(stages.map((s) => [s.name, s.tier1, s.tier2])).toEqual([
      ['Assigned', 11, 10],
      ['Invited', 10, 8],
      ['In progress', 10, 7],
      ['Submitted', 10, 7],
      ['Reviewed', 8, 5],
    ]);
    expect(biggestDrop(stages)).toEqual({ name: 'Reviewed', lost: 4 });
  });

  it('summarises an assessment', () => {
    const a3 = d.assessments.find((a) => a.id === 'A3')!;
    expect(assessmentProgress(d, a3)).toMatchObject({ total: 5, submitted: 5, reviewed: 3, notInvited: 0, openFlags: 3 });
  });

  it('counts open items per supplier', () => {
    expect(openItemCount(d, 'SUP-012')).toBe(4); // 2 flags + 1 document + 1 action
  });
});

describe('commands', () => {
  it('invites with the default onboarding due date', () => {
    const next = applyCommand(d, { type: 'inviteAssignments', refs: [{ assessmentId: 'A1', supplierId: 'SUP-007' }] });
    const a = next.assignments.find((x) => x.assessmentId === 'A1' && x.supplierId === 'SUP-007')!;
    expect(a.status).toBe('invited');
    expect(a.dueDate).toBe('2026-12-15');
    expect(needs(next).notInvited).toBe(2);
  });

  it('adds suppliers to an assessment without duplicating anyone', () => {
    const next = applyCommand(d, { type: 'addToAssessment', assessmentId: 'A3', supplierIds: ['SUP-008', 'SUP-007'], dueDate: '2026-12-15', invite: true });
    const a3 = next.assignments.filter((x) => x.assessmentId === 'A3');
    expect(a3).toHaveLength(6);
    expect(a3.at(-1)).toMatchObject({ supplierId: 'SUP-007', status: 'invited', dueDate: '2026-12-15' });
  });

  it('raises an improvement action from a red flag', () => {
    const next = applyCommand(d, { type: 'raiseAction', flagId: 'F1', actionId: 'IA-06' });
    expect(next.flags.find((f) => f.id === 'F1')!.status).toBe('Action raised');
    expect(next.actions.at(-1)).toMatchObject({ id: 'IA-06', supplierId: 'SUP-003', flagId: 'F1', status: 'Open', dueDate: '2026-12-24' });
    expect(needs(next).flags).toBe(2);
  });

  it('creates a standalone improvement action', () => {
    const next = applyCommand(d, { type: 'createAction', actionId: 'IA-06', supplierId: 'SUP-010', title: ' Publish a Scope 3 plan ', owner: 'K. Rao', dueDate: '2027-01-31' });
    expect(next.actions.at(-1)).toEqual({ id: 'IA-06', supplierId: 'SUP-010', flagId: null, title: 'Publish a Scope 3 plan', owner: 'K. Rao', dueDate: '2027-01-31', status: 'Open' });
  });

  it('toggles a review decision on and off', () => {
    const cmd = { type: 'toggleReviewDecision', assessmentId: 'A3', supplierId: 'SUP-010', questionCode: 'E-06', decision: 'accepted' } as const;
    const once = applyCommand(d, cmd);
    expect(effectiveDecision(once, 'A3', 'SUP-010', 'E-06')).toBe('accepted');
    expect(effectiveDecision(applyCommand(once, cmd), 'A3', 'SUP-010', 'E-06')).toBeNull();
  });

  it('can remove an automatic flag (red flag) and an automatic accept (reviewed response)', () => {
    // SUP-012 has a red flag on OB-05 in A3, so it starts flagged
    expect(effectiveDecision(d, 'A3', 'SUP-012', 'OB-05')).toBe('flagged');
    const unflag = applyCommand(d, { type: 'toggleReviewDecision', assessmentId: 'A3', supplierId: 'SUP-012', questionCode: 'OB-05', decision: 'flagged' });
    expect(effectiveDecision(unflag, 'A3', 'SUP-012', 'OB-05')).toBeNull();
    // A3/SUP-008 is already reviewed, so its answers start accepted
    expect(effectiveDecision(d, 'A3', 'SUP-008', 'E-01')).toBe('accepted');
    const unaccept = applyCommand(d, { type: 'toggleReviewDecision', assessmentId: 'A3', supplierId: 'SUP-008', questionCode: 'E-01', decision: 'accepted' });
    expect(effectiveDecision(unaccept, 'A3', 'SUP-008', 'E-01')).toBeNull();
  });

  it('answering a supplier question clears it from the inbox', () => {
    const next = applyCommand(d, { type: 'sendMessage', assessmentId: 'A3', supplierId: 'SUP-012', questionCode: 'OB-05', text: 'Yes, the receipt is fine.' });
    expect(needs(next).questions).toBe(0);
  });

  it('adds a supplier with a scheduled (not yet sent) invite', () => {
    const next = applyCommand(d, {
      type: 'addSupplier',
      supplierId: 'SUP-016',
      draft: { name: 'New Co', contact: 'A', mobile: '', email: 'a@new.example', spend: 10, city: '', category: 'Wood', facility: 'Pune Plant 1', tier: 2, dueDate: '2026-12-15', addToAnnual: false, inviteToMateriality: false, sendNow: false },
    });
    expect(next.suppliers.at(-1)).toMatchObject({ id: 'SUP-016', city: '—', score: null });
    expect(next.assignments.at(-1)).toMatchObject({ assessmentId: 'A2', supplierId: 'SUP-016', status: 'not_invited' });
  });

  it('updates programme settings and organisation details', () => {
    const next = applyCommand(applyCommand(d, { type: 'updateSettings', patch: { highSpend: 50 } }), { type: 'updateOrg', name: ' DCT Pune ', contactEmail: '' });
    expect(engageFirst(next).map((s) => s.id)).toEqual(['SUP-008', 'SUP-010', 'SUP-012']);
    expect(next.org).toMatchObject({ name: 'DCT Pune', contactEmail: d.org.contactEmail });
  });

  it('does not mutate the input', () => {
    const before = JSON.stringify(d);
    applyCommand(d, { type: 'markAllNotificationsRead' });
    expect(JSON.stringify(d)).toBe(before);
  });

  it('generates sequential ids', () => {
    expect(nextId(['SUP-007', 'SUP-015', 'SUP-003'], 'SUP-', 3)).toBe('SUP-016');
    expect(nextId(['A1', 'A7'], 'A', 1)).toBe('A8');
  });
});

describe('store', () => {
  it('applies changes and keeps them after a reload from the repository', async () => {
    const repo = createMockRepository();
    const store = new PortalStore(repo);
    await store.load();
    const { raiseAction } = store; // actions are bound
    await raiseAction('F2');
    expect(needs(store.getSnapshot().data!).flags).toBe(2);
    await store.load();
    expect(needs(store.getSnapshot().data!).flags).toBe(2);
  });

  it('rolls back when the repository rejects a change', async () => {
    const failing: PortalRepository = {
      load: async () => createSampleData(),
      execute: async () => {
        throw new Error('Network down');
      },
    };
    const store = new PortalStore(failing);
    await store.load();
    const before = store.getSnapshot().data;
    await expect(store.markAllNotificationsRead()).rejects.toThrow('Network down');
    expect(store.getSnapshot().data).toBe(before);
  });
});

describe('UX audit additions', () => {
  it('closes an assessment', () => {
    const next = applyCommand(d, { type: 'closeAssessment', assessmentId: 'A4' });
    expect(next.assessments.find((a) => a.id === 'A4')?.status).toBe('Closed');
    expect(activeAssignments(next).some((x) => x.assessmentId === 'A4')).toBe(false);
  });

  it('edits supplier details, trimming text', () => {
    const next = applyCommand(d, { type: 'updateSupplier', supplierId: 'SUP-010', patch: { name: ' Vertex Circuits Ltd ', spend: 175, tier: 2 } });
    expect(supplierById(next, 'SUP-010')).toMatchObject({ name: 'Vertex Circuits Ltd', spend: 175, tier: 2, score: 56 });
  });

  it('accepts many answers at once without toggling existing decisions off', () => {
    const once = applyCommand(d, { type: 'setReviewDecisions', assessmentId: 'A3', supplierId: 'SUP-010', questionCodes: ['E-01', 'E-02'], decision: 'accepted' });
    const twice = applyCommand(once, { type: 'setReviewDecisions', assessmentId: 'A3', supplierId: 'SUP-010', questionCodes: ['E-01'], decision: 'accepted' });
    expect(twice.reviewDecisions['A3|SUP-010|E-01']).toBe('accepted');
    expect(twice.reviewDecisions['A3|SUP-010|E-02']).toBe('accepted');
  });

  it('marks a single notification read', () => {
    const next = applyCommand(d, { type: 'markNotificationRead', id: 'n2' });
    expect(next.notifications.filter((n) => n.unread).map((n) => n.id)).toEqual(['n1', 'n3']);
  });

  it('tracks saving and reports a failed save once', async () => {
    let release!: () => void;
    const repo: PortalRepository = {
      load: async () => createSampleData(),
      execute: () => new Promise<void>((_, reject) => (release = () => reject(new Error('Offline')))),
    };
    const store = new PortalStore(repo);
    await store.load();
    const seen: string[] = [];
    store.onSaveError((m) => seen.push(m));
    const pending = store.markNotificationRead('n1');
    expect(store.getSnapshot().saving).toBe(1);
    expect(store.getSnapshot().data?.notifications[0].unread).toBe(false); // optimistic
    release();
    await expect(pending).rejects.toThrow('Offline');
    expect(store.getSnapshot()).toMatchObject({ saving: 0, saveError: 'Offline' });
    expect(store.getSnapshot().data?.notifications[0].unread).toBe(true); // rolled back
    expect(seen).toEqual(['Offline']);
  });
});
