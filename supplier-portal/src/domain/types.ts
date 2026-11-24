/** Domain model for the Supplier ESG portal. Dates are ISO strings (YYYY-MM-DD). */

export type ISODate = string;

/** Visual tone for a status (rendered by the Pill component). */
export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand';
export type Tier = 1 | 2;

export interface Supplier {
  id: string;
  name: string;
  tier: Tier;
  /** Products or services supplied */
  category: string;
  city: string;
  /** Annual spend, ₹ lakh */
  spend: number;
  contact: string;
  email: string;
  facility: string;
  /** ESG performance score 0–100 (null until a scored Annual ESG is submitted) */
  score: number | null;
  /** One score per scoring area (see AREAS); null entry = not scored for this tier */
  areaScores: (number | null)[] | null;
  previousScore: number | null;
  /** Data confidence, % */
  confidence: number | null;
  /** Basic compliance, % of checks passed */
  compliance: number | null;
  addedOn: ISODate;
}

export type AssessmentType = 'Onboarding' | 'Annual ESG' | 'Materiality' | 'Follow-up';
export type AssessmentStatus = 'Active' | 'Draft' | 'Closed';

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  /** null = not tier-specific (materiality, follow-up) */
  tier: Tier | null;
  period: string;
  dueDate: ISODate | null;
  status: AssessmentStatus;
  questionCount: number;
  startedOn: ISODate | null;
}

export type AssignmentStatus = 'not_invited' | 'invited' | 'in_progress' | 'submitted' | 'reviewed' | 'reopened';

/** One supplier's place in one assessment. */
export interface Assignment {
  assessmentId: string;
  supplierId: string;
  status: AssignmentStatus;
  dueDate: ISODate | null;
  answered: number;
  submittedOn: ISODate | null;
}

export type FlagCause =
  | 'Permit missing (CTO)'
  | 'Penalties, past 3 years'
  | 'Wages or working hours'
  | 'Child or forced labour'
  | 'Fatality';

export type FlagStatus = 'Open' | 'Action raised' | 'Closed';

export interface RedFlag {
  id: string;
  supplierId: string;
  assessmentId: string;
  questionCode: string;
  cause: FlagCause;
  text: string;
  status: FlagStatus;
  raisedOn: ISODate;
}

export type EvidenceStatus = 'Pending' | 'Accepted' | 'Rejected';

export interface Evidence {
  id: string;
  supplierId: string;
  assessmentId: string;
  questionCode: string;
  question: string;
  fileName: string;
  uploadedOn: ISODate;
  status: EvidenceStatus;
}

export interface Message {
  from: 'client' | 'supplier';
  author: string;
  text: string;
  sentOn: ISODate;
}

/** A Q&A thread on one answer. */
export interface Thread {
  assessmentId: string;
  supplierId: string;
  questionCode: string;
  messages: Message[];
}

export type ActionStatus = 'Open' | 'In progress' | 'Awaiting approval' | 'Closed';

export interface ImprovementAction {
  id: string;
  supplierId: string;
  flagId: string | null;
  title: string;
  owner: string;
  dueDate: ISODate;
  status: ActionStatus;
}

export interface MaterialityTopicRecord {
  n: number;
  title: string;
  impact: number;
  financial: number;
  /** Scoring area this topic drives (index into AREAS) */
  areaIndex: number;
}

export interface SurveyGroup {
  group: string;
  responded: number;
  invited: number;
}

export interface Question {
  code: string;
  section: string;
  areaIndex: number | null;
  text: string;
  answerType: string;
  evidenceRequired: boolean;
  redFlag: boolean;
  tiers: Tier[];
  template: AssessmentType;
}

export interface Facility {
  name: string;
  city: string;
  supplierCount: number;
}

export interface ProgrammeSettings {
  /** Default onboarding due date, days after invite */
  onboardingDays: number;
  /** Suggest Tier 1 at or above this spend (₹ lakh) */
  tier1Spend: number;
  reminderDays: number[];
  escalateAfterDays: number;
  /** High-spend threshold for the risk matrix (₹ lakh) */
  highSpend: number;
}

export interface Notification {
  id: string;
  title: string;
  detail: string;
  at: ISODate;
  /** In-app route */
  to: string;
  unread: boolean;
}

export type ReviewDecision = 'accepted' | 'flagged';

/** One of the five checks behind data confidence, averaged across suppliers. */
export interface QualityCheck {
  name: string;
  detail: string;
  /** Weight in the confidence score, % */
  weight: number;
  /** Average result across suppliers, % */
  average: number;
}

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  /** % of the framework's fields the programme data covers (null = not applicable) */
  coverage: number | null;
}

export interface PortalData {
  /** "Today" for the dataset — drives overdue checks and default due dates */
  asOf: ISODate;
  org: { name: string; programme: string; initials: string; contactEmail: string };
  user: { name: string; role: string; initials: string; email: string };
  programmeYears: string[];
  suppliers: Supplier[];
  assessments: Assessment[];
  assignments: Assignment[];
  flags: RedFlag[];
  evidence: Evidence[];
  threads: Thread[];
  actions: ImprovementAction[];
  topics: MaterialityTopicRecord[];
  survey: SurveyGroup[];
  questions: Question[];
  facilities: Facility[];
  settings: ProgrammeSettings;
  notifications: Notification[];
  qualityChecks: QualityCheck[];
  reports: ReportDefinition[];
  /** Reviewer decisions per answer, keyed by answerKey() */
  reviewDecisions: Record<string, ReviewDecision>;
  /** Last year's maturity counts per tier (Nascent → Transformative) */
  previousMaturity: Record<Tier, number[]>;
  /** Year-on-year change in average area score (one per area) */
  areaDeltas: number[];
}

/* ---------- Drafts for create flows ---------- */

export interface SupplierDraft {
  name: string;
  contact: string;
  mobile: string;
  email: string;
  spend: number;
  city: string;
  category: string;
  facility: string;
  tier: Tier;
  dueDate: ISODate;
  addToAnnual: boolean;
  inviteToMateriality: boolean;
  /** Send now, or schedule (invitation stays unsent) */
  sendNow: boolean;
}

export interface AssessmentDraft {
  type: AssessmentType;
  tier: Tier;
  period: string;
  title: string;
  dueDate: ISODate;
  supplierIds: string[];
}
