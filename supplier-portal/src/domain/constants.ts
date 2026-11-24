import type { AssignmentStatus, FlagCause, StatusTone } from './types';

/** The 7 scoring areas, in methodology order. Area scores are indexed by this list. */
export const AREAS = [
  'Carbon & Energy',
  'Scope 3',
  'Water',
  'Waste & Circularity',
  'Responsible Sourcing',
  'Labour, Health & Safety',
  'Ethics & Compliance',
] as const;

export const AREA_SHORT = ['Carbon', 'Scope 3', 'Water', 'Waste', 'Sourcing', 'Labour', 'Ethics'] as const;

export const AREA_DESCRIPTIONS = [
  'Scope 1 + 2 emissions, renewable electricity and climate targets',
  'Emissions allocated to your spend and primary-data coverage (Tier 1 only)',
  'Water withdrawal, permits, wastewater recycling or zero liquid discharge',
  'Waste diversion, hazardous waste and chemical handling',
  'Supplier code of conduct, due diligence and responsible minerals',
  'Wages, working hours, human rights, safety systems and injury rates',
  'Anti-bribery, penalties, data protection and grievance handling',
] as const;

/** Index of the Scope 3 area, which only Tier 1 suppliers are scored on. */
export const SCOPE3_AREA = 1;

export const MATURITY = [
  { name: 'Nascent', min: 0, definition: 'Little or no formal ESG approach' },
  { name: 'Emerging', min: 60, definition: 'Awareness exists; practices ad hoc' },
  { name: 'Developing', min: 70, definition: 'Formal processes, limited impact' },
  { name: 'Progressive', min: 80, definition: 'Strong practices, measurable outcomes' },
  { name: 'Transformative', min: 90, definition: 'ESG embedded in the core business' },
] as const;

/** Formal names for red-flag findings, as used in compliance reporting. */
export const FLAG_CAUSE_LABEL: Record<FlagCause, string> = {
  'Permit missing (CTO)': 'Missing Consent to Operate (CTO)',
  'Penalties, past 3 years': 'Regulatory penalties (past 3 years)',
  'Wages or working hours': 'Wage & working-hour non-compliance',
  'Child or forced labour': 'Child or forced labour',
  Fatality: 'Workplace fatality',
};

export const FLAG_CAUSES: FlagCause[] = [
  'Permit missing (CTO)',
  'Penalties, past 3 years',
  'Wages or working hours',
  'Child or forced labour',
  'Fatality',
];

/** Thresholds used by risk and charts. */
export const RISK_RULES = {
  highBelow: 40,
  mediumBelow: 60,
  /** Score below this in the risk matrix = engage first (with high spend) */
  engageBelow: 60,
  /** Materiality threshold on the 1–5 scale */
  materialAt: 3.5,
  /** ±points that count as improved / declined year on year */
  yoyBand: 5,
  /** Data-confidence bands */
  confidenceMedium: 60,
  confidenceHigh: 80,
} as const;

export const ASSIGNMENT_LABEL: Record<AssignmentStatus, string> = {
  not_invited: 'Not invited',
  invited: 'Invited',
  in_progress: 'In progress',
  submitted: 'Awaiting review',
  reviewed: 'Reviewed',
  reopened: 'Reopened',
};

export const ASSIGNMENT_TONE: Record<AssignmentStatus, StatusTone> = {
  not_invited: 'warning',
  invited: 'neutral',
  in_progress: 'info',
  submitted: 'brand',
  reviewed: 'success',
  reopened: 'error',
};

/** Statuses that mean the supplier has handed in answers. */
export const SUBMITTED_STATES: AssignmentStatus[] = ['submitted', 'reviewed', 'reopened'];
