/**
 * Every change the portal can make, as plain data. The store applies a command
 * locally (optimistic update) and hands the same command to the repository,
 * which persists it (in memory today, over HTTP later).
 */
import { addDays, answerKey, assessmentById } from './selectors';
import type {
  ActionStatus,
  AssessmentDraft,
  EvidenceStatus,
  PortalData,
  ProgrammeSettings,
  ReviewDecision,
  SupplierDraft,
} from './types';

export interface AssignmentRef {
  assessmentId: string;
  supplierId: string;
}

export type PortalCommand =
  | { type: 'inviteAssignments'; refs: AssignmentRef[] }
  | { type: 'addToAssessment'; assessmentId: string; supplierIds: string[]; dueDate: string; invite: boolean }
  | { type: 'raiseAction'; flagId: string; actionId: string }
  | { type: 'setEvidenceStatus'; evidenceId: string; status: EvidenceStatus }
  | { type: 'toggleReviewDecision'; assessmentId: string; supplierId: string; questionCode: string; decision: ReviewDecision }
  | { type: 'sendMessage'; assessmentId: string; supplierId: string; questionCode: string; text: string }
  | { type: 'completeReview'; ref: AssignmentRef; outcome: 'reviewed' | 'reopened' }
  | { type: 'moveAction'; actionId: string; status: ActionStatus }
  | { type: 'createAction'; actionId: string; supplierId: string; title: string; owner: string; dueDate: string }
  | { type: 'addSupplier'; supplierId: string; draft: SupplierDraft }
  | { type: 'launchAssessment'; assessmentId: string; draft: AssessmentDraft }
  | { type: 'markAllNotificationsRead' }
  | { type: 'updateSettings'; patch: Partial<ProgrammeSettings> }
  | { type: 'updateOrg'; name: string; contactEmail: string };

const sameRef = (a: AssignmentRef, b: AssignmentRef) => a.assessmentId === b.assessmentId && a.supplierId === b.supplierId;

/** Pure reducer: returns a new PortalData with the command applied. */
export function applyCommand(d: PortalData, cmd: PortalCommand): PortalData {
  switch (cmd.type) {
    case 'inviteAssignments': {
      const due = addDays(d.asOf, d.settings.onboardingDays);
      return {
        ...d,
        assignments: d.assignments.map((a) =>
          cmd.refs.some((r) => sameRef(r, a)) && a.status === 'not_invited' ? { ...a, status: 'invited', dueDate: a.dueDate ?? due } : a,
        ),
      };
    }

    case 'addToAssessment': {
      const existing = new Set(d.assignments.filter((a) => a.assessmentId === cmd.assessmentId).map((a) => a.supplierId));
      const added = cmd.supplierIds
        .filter((id) => !existing.has(id))
        .map((supplierId) => ({
          assessmentId: cmd.assessmentId,
          supplierId,
          status: (cmd.invite ? 'invited' : 'not_invited') as 'invited' | 'not_invited',
          dueDate: cmd.dueDate,
          answered: 0,
          submittedOn: null,
        }));
      return { ...d, assignments: [...d.assignments, ...added] };
    }

    case 'raiseAction': {
      const flag = d.flags.find((f) => f.id === cmd.flagId);
      if (!flag || flag.status !== 'Open') return d;
      const supplier = d.suppliers.find((s) => s.id === flag.supplierId);
      return {
        ...d,
        flags: d.flags.map((f) => (f.id === cmd.flagId ? { ...f, status: 'Action raised' } : f)),
        actions: [
          ...d.actions,
          {
            id: cmd.actionId,
            supplierId: flag.supplierId,
            flagId: flag.id,
            title: `Resolve: ${flag.text}`,
            owner: supplier?.contact ?? '—',
            dueDate: addDays(d.asOf, 30),
            status: 'Open',
          },
        ],
      };
    }

    case 'setEvidenceStatus':
      return { ...d, evidence: d.evidence.map((e) => (e.id === cmd.evidenceId ? { ...e, status: cmd.status } : e)) };

    case 'toggleReviewDecision': {
      const key = answerKey(cmd.assessmentId, cmd.supplierId, cmd.questionCode);
      const next = { ...d.reviewDecisions };
      if (next[key] === cmd.decision) delete next[key];
      else next[key] = cmd.decision;
      return { ...d, reviewDecisions: next };
    }

    case 'sendMessage': {
      const text = cmd.text.trim();
      if (!text) return d;
      const msg = { from: 'client' as const, author: d.user.name.split(' ')[0], text, sentOn: d.asOf };
      const exists = d.threads.some(
        (t) => t.assessmentId === cmd.assessmentId && t.supplierId === cmd.supplierId && t.questionCode === cmd.questionCode,
      );
      return {
        ...d,
        threads: exists
          ? d.threads.map((t) =>
              t.assessmentId === cmd.assessmentId && t.supplierId === cmd.supplierId && t.questionCode === cmd.questionCode
                ? { ...t, messages: [...t.messages, msg] }
                : t,
            )
          : [...d.threads, { assessmentId: cmd.assessmentId, supplierId: cmd.supplierId, questionCode: cmd.questionCode, messages: [msg] }],
      };
    }

    case 'completeReview':
      return { ...d, assignments: d.assignments.map((a) => (sameRef(a, cmd.ref) ? { ...a, status: cmd.outcome } : a)) };

    case 'createAction':
      return {
        ...d,
        actions: [
          ...d.actions,
          { id: cmd.actionId, supplierId: cmd.supplierId, flagId: null, title: cmd.title.trim(), owner: cmd.owner.trim() || '—', dueDate: cmd.dueDate, status: 'Open' },
        ],
      };

    case 'moveAction':
      return { ...d, actions: d.actions.map((a) => (a.id === cmd.actionId ? { ...a, status: cmd.status } : a)) };

    case 'addSupplier': {
      const s = cmd.draft;
      const onboarding = d.assessments.find((a) => a.type === 'Onboarding' && a.tier === s.tier && a.status === 'Active');
      const annual = d.assessments.find((a) => a.type === 'Annual ESG' && a.tier === s.tier && a.status === 'Active');
      const assignments = [...d.assignments];
      if (onboarding) {
        assignments.push({
          assessmentId: onboarding.id,
          supplierId: cmd.supplierId,
          // A scheduled invite hasn't gone out yet
          status: s.sendNow ? 'invited' : 'not_invited',
          dueDate: s.dueDate,
          answered: 0,
          submittedOn: null,
        });
      }
      if (s.addToAnnual && annual) {
        assignments.push({ assessmentId: annual.id, supplierId: cmd.supplierId, status: s.sendNow ? 'invited' : 'not_invited', dueDate: annual.dueDate, answered: 0, submittedOn: null });
      }
      return {
        ...d,
        suppliers: [
          ...d.suppliers,
          {
            id: cmd.supplierId,
            name: s.name.trim(),
            tier: s.tier,
            category: s.category.trim(),
            city: s.city.trim() || '—',
            spend: s.spend,
            contact: s.contact.trim(),
            email: s.email.trim(),
            facility: s.facility,
            score: null,
            areaScores: null,
            previousScore: null,
            confidence: null,
            compliance: null,
            addedOn: d.asOf,
          },
        ],
        assignments,
      };
    }

    case 'launchAssessment': {
      const a = cmd.draft;
      const isMat = a.type === 'Materiality';
      return {
        ...d,
        assessments: [
          ...d.assessments,
          {
            id: cmd.assessmentId,
            title: a.title.trim() || `${a.type} Assessment — ${isMat ? 'Stakeholders' : `Tier ${a.tier}`}`,
            type: a.type,
            tier: isMat || a.type === 'Follow-up' ? null : a.tier,
            period: a.period,
            dueDate: a.dueDate,
            status: 'Active',
            questionCount: a.type === 'Annual ESG' ? (a.tier === 1 ? 50 : 25) : a.type === 'Onboarding' ? (a.tier === 1 ? 10 : 5) : 12,
            startedOn: d.asOf,
          },
        ],
        assignments: isMat
          ? d.assignments
          : [
              ...d.assignments,
              ...a.supplierIds.map((supplierId) => ({
                assessmentId: cmd.assessmentId,
                supplierId,
                status: 'invited' as const,
                dueDate: a.dueDate,
                answered: 0,
                submittedOn: null,
              })),
            ],
      };
    }

    case 'markAllNotificationsRead':
      return { ...d, notifications: d.notifications.map((n) => ({ ...n, unread: false })) };

    case 'updateSettings':
      return { ...d, settings: { ...d.settings, ...cmd.patch } };

    case 'updateOrg':
      return { ...d, org: { ...d.org, name: cmd.name.trim() || d.org.name, contactEmail: cmd.contactEmail.trim() || d.org.contactEmail } };
  }
}

/** Next free id with a prefix, e.g. nextId(['SUP-015'], 'SUP-', 3) → 'SUP-016'. */
export function nextId(existing: string[], prefix: string, pad = 2): string {
  const max = existing
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

/** Used by drawers to warn about a near-duplicate assessment. */
export const findDuplicateAssessment = (d: PortalData, draft: AssessmentDraft) =>
  d.assessments.find(
    (x) =>
      x.type === draft.type &&
      x.tier === (draft.type === 'Materiality' ? null : draft.tier) &&
      x.period === draft.period &&
      x.status !== 'Closed',
  );

export { assessmentById };
