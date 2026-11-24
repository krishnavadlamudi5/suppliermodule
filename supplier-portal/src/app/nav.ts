import type { NavIconName } from '../components/icons/NavIcon';

export interface NavItem {
  key: string;
  label: string;
  icon: NavIconName;
  /** Show the review-inbox count badge */
  count?: boolean;
  /** Show a "New" tag */
  isNew?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  { title: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', icon: 'dashboard' }] },
  {
    title: 'Supplier Programme',
    items: [
      { key: 'suppliers', label: 'Supplier Register', icon: 'suppliers' },
      { key: 'assessments', label: 'ESG Assessments', icon: 'assessments' },
      { key: 'reviews', label: 'Review Queue', icon: 'reviews', count: true },
      { key: 'actions', label: 'Corrective Actions', icon: 'actions' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { key: 'risk', label: 'Risk & Performance', icon: 'risk' },
      { key: 'materiality', label: 'Double Materiality', icon: 'materiality' },
      { key: 'quality', label: 'Data Assurance', icon: 'quality' },
      { key: 'reports', label: 'Disclosures & Reports', icon: 'reports' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { key: 'questionnaires', label: 'Questionnaire Library', icon: 'questionnaires' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

/** Page titles for document.title, keyed by first path segment. */
export const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Supplier ESG Dashboard',
  suppliers: 'Supplier Register',
  assessments: 'ESG Assessments',
  reviews: 'Review Queue',
  response: 'Submission Review',
  actions: 'Corrective Actions',
  risk: 'Risk & Performance',
  materiality: 'Double Materiality',
  quality: 'Data Assurance',
  reports: 'Disclosures & Reports',
  questionnaires: 'Questionnaire Library',
  settings: 'Programme Settings',
  'design-system': 'Design system',
};
