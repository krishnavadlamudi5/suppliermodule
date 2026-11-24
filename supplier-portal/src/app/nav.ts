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
    title: 'Supplier programme',
    items: [
      { key: 'suppliers', label: 'Suppliers', icon: 'suppliers' },
      { key: 'assessments', label: 'Assessments', icon: 'assessments' },
      { key: 'reviews', label: 'Reviews', icon: 'reviews', count: true },
      { key: 'actions', label: 'Improvement actions', icon: 'actions' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { key: 'risk', label: 'Risk & performance', icon: 'risk' },
      { key: 'materiality', label: 'Materiality', icon: 'materiality', isNew: true },
      { key: 'quality', label: 'Data quality', icon: 'quality' },
      { key: 'reports', label: 'Reports & exports', icon: 'reports', isNew: true },
    ],
  },
  {
    title: 'Setup',
    items: [
      { key: 'questionnaires', label: 'Questionnaires', icon: 'questionnaires' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

/** Page titles for document.title, keyed by first path segment. */
export const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Supplier ESG Dashboard',
  suppliers: 'Suppliers',
  assessments: 'Assessments',
  reviews: 'Reviews',
  response: 'Review response',
  actions: 'Improvement actions',
  risk: 'Risk & performance',
  materiality: 'Materiality',
  quality: 'Data quality',
  reports: 'Reports & exports',
  questionnaires: 'Questionnaires',
  settings: 'Settings',
  'design-system': 'Design system',
};
