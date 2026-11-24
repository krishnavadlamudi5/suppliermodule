/**
 * Pure business rules over PortalData — no React, no I/O.
 * Ported from the prototype so screens and tests share one definition.
 */
import { MATURITY, RISK_RULES, SUBMITTED_STATES } from './constants';
import type {
  Assessment,
  Assignment,
  ISODate,
  PortalData,
  RedFlag,
  Supplier,
  Thread,
  Tier,
} from './types';

export type RiskLevel = 'High' | 'Medium' | 'Low';

/* ---------------- Dates ---------------- */

/** A due date is overdue once the whole day has passed. */
export const isOverdue = (asOf: ISODate, due: ISODate | null | undefined) => !!due && due < asOf;

export function addDays(asOf: ISODate, n: number): ISODate {
  const d = new Date(`${asOf}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ---------------- Lookups ---------------- */

export const supplierById = (d: PortalData, id: string) => d.suppliers.find((s) => s.id === id);
export const assessmentById = (d: PortalData, id: string) => d.assessments.find((a) => a.id === id);
export const assignmentsFor = (d: PortalData, assessmentId: string) => d.assignments.filter((a) => a.assessmentId === assessmentId);
export const assignmentsOfSupplier = (d: PortalData, supplierId: string) => d.assignments.filter((a) => a.supplierId === supplierId);

export const answerKey = (assessmentId: string, supplierId: string, questionCode: string) => `${assessmentId}|${supplierId}|${questionCode}`;

export const threadFor = (d: PortalData, assessmentId: string, supplierId: string, code: string): Thread | undefined =>
  d.threads.find((t) => t.assessmentId === assessmentId && t.supplierId === supplierId && t.questionCode === code);

export const isSubmitted = (a: Assignment) => SUBMITTED_STATES.includes(a.status);

/**
 * The decision shown on an answer: the reviewer's own choice if they made one,
 * otherwise "flagged" when a red flag was raised on it, or "accepted" when the
 * whole response has already been reviewed.
 */
export function effectiveDecision(d: PortalData, assessmentId: string, supplierId: string, code: string): 'accepted' | 'flagged' | null {
  const explicit = d.reviewDecisions[answerKey(assessmentId, supplierId, code)];
  if (explicit === 'cleared') return null;
  if (explicit) return explicit;
  if (d.flags.some((f) => f.assessmentId === assessmentId && f.supplierId === supplierId && f.questionCode === code)) return 'flagged';
  if (d.assignments.some((a) => a.assessmentId === assessmentId && a.supplierId === supplierId && a.status === 'reviewed')) return 'accepted';
  return null;
}

/* ---------------- Scores, maturity, risk ---------------- */

/** Maturity level index (0 = Nascent … 4 = Transformative), or null if unscored. */
export function maturityIndex(score: number | null | undefined): number | null {
  if (score == null) return null;
  let idx = 0;
  MATURITY.forEach((m, i) => {
    if (score >= m.min) idx = i;
  });
  return idx;
}

export const maturityName = (score: number | null | undefined) => {
  const i = maturityIndex(score);
  return i == null ? null : MATURITY[i].name;
};

export const openFlags = (d: PortalData, supplierId: string): RedFlag[] =>
  d.flags.filter((f) => f.supplierId === supplierId && f.status !== 'Closed');

/**
 * High: any unresolved red flag, or score below 40.
 * Medium: compliance below 100%, or score 40–59.
 * Low: full compliance and score 60+.
 * null: not assessed yet.
 */
export function riskOf(d: PortalData, s: Supplier): RiskLevel | null {
  if (openFlags(d, s.id).length) return 'High';
  if (s.score == null) return null;
  if (s.score < RISK_RULES.highBelow) return 'High';
  if ((s.compliance != null && s.compliance < 100) || s.score < RISK_RULES.mediumBelow) return 'Medium';
  return 'Low';
}

export const scoredSuppliers = (d: PortalData) => d.suppliers.filter((s) => s.score != null);

/** Average of non-null values, or null if there are none. */
export function average(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/** Average score per area across suppliers (null where nobody is scored). */
export const areaAverages = (suppliers: Supplier[], areaCount = 7) =>
  Array.from({ length: areaCount }, (_, i) => average(suppliers.map((s) => s.areaScores?.[i] ?? null)));

/** Supplier counts per maturity level. */
export function maturityCounts(suppliers: Supplier[]): number[] {
  const c = [0, 0, 0, 0, 0];
  suppliers.forEach((s) => {
    const i = maturityIndex(s.score);
    if (i != null) c[i]++;
  });
  return c;
}

export function strongestAndWeakestArea(s: Supplier): { strongest: number; weakest: number } | null {
  if (!s.areaScores) return null;
  const vals = s.areaScores.map((v, i) => ({ v, i })).filter((x): x is { v: number; i: number } => x.v != null);
  if (!vals.length) return null;
  const strongest = vals.reduce((a, b) => (b.v > a.v ? b : a)).i;
  const weakest = vals.reduce((a, b) => (b.v < a.v ? b : a)).i;
  return { strongest, weakest };
}

/* ---------------- Programme status ---------------- */

/** Assignments in active, supplier-facing assessments (materiality excluded). */
export function activeAssignments(d: PortalData): Assignment[] {
  const active = new Set(d.assessments.filter((a) => a.status === 'Active' && a.type !== 'Materiality').map((a) => a.id));
  return d.assignments.filter((x) => active.has(x.assessmentId));
}

export interface Needs {
  /** Responses awaiting review */
  review: number;
  /** Suppliers with at least one overdue, unsubmitted assessment */
  overdue: number;
  /** Assignments never invited */
  notInvited: number;
  /** Red flags with no action yet */
  flags: number;
  /** Red flags not closed (incl. those with an action) */
  flagsAll: number;
  /** Documents waiting for verification */
  evidence: number;
  /** Threads where the supplier spoke last */
  questions: number;
}

export function needs(d: PortalData): Needs {
  const act = activeAssignments(d);
  return {
    review: act.filter((a) => a.status === 'submitted').length,
    overdue: new Set(
      act.filter((a) => a.status !== 'submitted' && a.status !== 'reviewed' && isOverdue(d.asOf, a.dueDate)).map((a) => a.supplierId),
    ).size,
    notInvited: act.filter((a) => a.status === 'not_invited').length,
    flags: d.flags.filter((f) => f.status === 'Open').length,
    flagsAll: d.flags.filter((f) => f.status !== 'Closed').length,
    evidence: d.evidence.filter((e) => e.status === 'Pending').length,
    questions: d.threads.filter((t) => t.messages.at(-1)?.from === 'supplier').length,
  };
}

/** Badge on the Reviews nav item. */
export function reviewInboxCount(d: PortalData): number {
  const n = needs(d);
  return n.review + n.evidence + n.questions + n.flags;
}

export interface FunnelStageData {
  name: string;
  tier1: number;
  tier2: number;
}

/** Added → Invited → Started → Submitted → Reviewed, split by tier. */
export function funnelStages(d: PortalData, list: Assignment[]): FunnelStageData[] {
  const invited = list.filter((a) => a.status !== 'not_invited');
  const started = invited.filter((a) => a.status !== 'invited');
  const submitted = started.filter(isSubmitted);
  const reviewed = submitted.filter((a) => a.status === 'reviewed');
  const split = (l: Assignment[]) => ({
    tier1: l.filter((a) => supplierById(d, a.supplierId)?.tier === 1).length,
    tier2: l.filter((a) => supplierById(d, a.supplierId)?.tier === 2).length,
  });
  return [
    { name: 'Added', ...split(list) },
    { name: 'Invited', ...split(invited) },
    { name: 'Started', ...split(started) },
    { name: 'Submitted', ...split(submitted) },
    { name: 'Reviewed', ...split(reviewed) },
  ];
}

/** The funnel step that loses the most suppliers. */
export function biggestDrop(stages: FunnelStageData[]): { name: string; lost: number } {
  let best = { name: '', lost: -1 };
  for (let i = 1; i < stages.length; i++) {
    const lost = stages[i - 1].tier1 + stages[i - 1].tier2 - (stages[i].tier1 + stages[i].tier2);
    if (lost > best.lost) best = { name: stages[i].name, lost };
  }
  return best;
}

export const onboardingAssignment = (d: PortalData, supplierId: string) =>
  d.assignments.find((a) => a.supplierId === supplierId && assessmentById(d, a.assessmentId)?.type === 'Onboarding');

/** Open flags + documents to verify + unfinished actions. */
export const openItemCount = (d: PortalData, supplierId: string) =>
  openFlags(d, supplierId).length +
  d.evidence.filter((e) => e.supplierId === supplierId && e.status === 'Pending').length +
  d.actions.filter((a) => a.supplierId === supplierId && a.status !== 'Closed').length;

export interface AssessmentProgress {
  total: number;
  submitted: number;
  reviewed: number;
  notInvited: number;
  averageScore: number | null;
  openFlags: number;
}

export function assessmentProgress(d: PortalData, a: Assessment): AssessmentProgress {
  if (a.type === 'Materiality') {
    return {
      total: d.survey.reduce((s, g) => s + g.invited, 0),
      submitted: d.survey.reduce((s, g) => s + g.responded, 0),
      reviewed: 0,
      notInvited: 0,
      averageScore: null,
      openFlags: 0,
    };
  }
  const list = assignmentsFor(d, a.id);
  const scored = list.filter((x) => x.status === 'submitted' || x.status === 'reviewed');
  return {
    total: list.length,
    submitted: list.filter(isSubmitted).length,
    reviewed: list.filter((x) => x.status === 'reviewed').length,
    notInvited: list.filter((x) => x.status === 'not_invited').length,
    averageScore: a.type === 'Annual ESG' ? average(scored.map((x) => supplierById(d, x.supplierId)?.score)) : null,
    openFlags: d.flags.filter((f) => f.assessmentId === a.id && f.status !== 'Closed').length,
  };
}

/** Engage-first list for the risk matrix: high spend and weak score, highest spend first. */
export const engageFirst = (d: PortalData, suppliers = scoredSuppliers(d)) =>
  suppliers
    .filter((s) => s.spend >= d.settings.highSpend && (s.score ?? 100) < RISK_RULES.engageBelow)
    .sort((a, b) => b.spend - a.spend);

/** Suggested tier for a new supplier: Tier 1 for high spend or a critical category. */
export const suggestTier = (d: PortalData, spend: number, category: string): Tier =>
  spend >= d.settings.tier1Spend || /chem|cast|polymer|pcb|batter/i.test(category) ? 1 : 2;

export const tierFilter = <T extends { supplierId?: string; tier?: Tier }>(d: PortalData, list: T[], tier: 'all' | Tier) =>
  tier === 'all' ? list : list.filter((x) => (x.tier ?? (x.supplierId ? supplierById(d, x.supplierId)?.tier : undefined)) === tier);
