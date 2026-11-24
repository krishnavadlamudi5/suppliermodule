import type { Assignment, AssignmentStatus, PortalData } from '../domain/types';

/**
 * Sample dataset, ported from supplier-esg-portal-redesign.html.
 * Everything the UI shows comes from here via the repository — swap the
 * repository for an HTTP one and this file becomes test fixtures only.
 */

const assign = (
  assessmentId: string,
  supplierId: string,
  status: AssignmentStatus,
  dueDate: string | null,
  answered: number,
  submittedOn: string | null = null,
): Assignment => ({ assessmentId, supplierId, status, dueDate, answered, submittedOn });

export function createSampleData(): PortalData {
  return {
    asOf: '2026-11-24',
    org: { name: 'DCT, Pune', programme: 'Supplier ESG programme', initials: 'DP', contactEmail: 'prajal@bharatcarbon.earth' },
    user: { name: 'Prajal Sakhala', role: 'Client admin', initials: 'PS', email: 'prajal@bharatcarbon.earth' },
    programmeYears: ['2026', '2025'],

    suppliers: [
      { id: 'SUP-007', name: 'Amaraja Batteries', tier: 1, category: 'Primary cells & batteries', city: 'Bhusawal', spend: 180, contact: 'R. Kulkarni', email: 'esg@amaraja.example', facility: 'Pune Plant 1', score: null, areaScores: null, previousScore: null, confidence: null, compliance: null, addedOn: '2026-11-04' },
      { id: 'SUP-008', name: 'Kavya Castings', tier: 1, category: 'Metal castings', city: 'Kolhapur', spend: 240, contact: 'S. Patil', email: 'quality@kavya.example', facility: 'Pune Plant 1', score: 48, areaScores: [42, 30, 55, 50, 45, 58, 56], previousScore: 41, confidence: 62, compliance: 75, addedOn: '2025-08-12' },
      { id: 'SUP-009', name: 'Sharda Polymers', tier: 1, category: 'Medical-grade polymers', city: 'Vapi', spend: 320, contact: 'A. Shah', email: 'compliance@sharda.example', facility: 'Vapi Unit', score: 74, areaScores: [80, 62, 78, 70, 72, 76, 80], previousScore: 66, confidence: 84, compliance: 100, addedOn: '2025-08-12' },
      { id: 'SUP-010', name: 'Vertex Circuits', tier: 1, category: 'PCB assemblies', city: 'Bengaluru', spend: 150, contact: 'K. Rao', email: 'ehs@vertex.example', facility: 'Pune Plant 2', score: 56, areaScores: [50, 38, 60, 52, 64, 58, 70], previousScore: 58, confidence: 58, compliance: 100, addedOn: '2025-09-02' },
      { id: 'SUP-011', name: 'Orbit Medi-Plastics', tier: 1, category: 'Moulded components', city: 'Daman', spend: 95, contact: 'N. Desai', email: 'esg@orbitmp.example', facility: 'Vapi Unit', score: 83, areaScores: [86, 70, 84, 82, 80, 88, 90], previousScore: 79, confidence: 88, compliance: 100, addedOn: '2025-08-20' },
      { id: 'SUP-012', name: 'Saanvi Chemicals', tier: 1, category: 'Process chemicals', city: 'Ankleshwar', spend: 70, contact: 'P. Mehta', email: 'ehs@saanvi.example', facility: 'Vapi Unit', score: 38, areaScores: [30, 20, 35, 40, 42, 45, 54], previousScore: null, confidence: 46, compliance: 50, addedOn: '2026-03-15' },
      { id: 'SUP-003', name: 'Shubham', tier: 2, category: 'PM Services', city: 'Pune', spend: 12, contact: 'Shubham', email: 'shubham@bharatcarbon.earth', facility: 'Pune Plant 1', score: null, areaScores: null, previousScore: null, confidence: 45, compliance: 0, addedOn: '2026-10-27' },
      { id: 'SUP-004', name: 'Raj enterprises', tier: 2, category: 'Wood', city: 'Pune', spend: 8, contact: 'Raj', email: 'raj@example.com', facility: 'Pune Plant 1', score: null, areaScores: null, previousScore: null, confidence: null, compliance: null, addedOn: '2026-11-02' },
      { id: 'SUP-005', name: 'Alpha Technologies S', tier: 2, category: 'Biological materials', city: 'Ahmedabad', spend: 6, contact: 'Ashwasham', email: 'alpha@example.com', facility: 'Vapi Unit', score: null, areaScores: null, previousScore: null, confidence: null, compliance: null, addedOn: '2026-11-03' },
      { id: 'SUP-013', name: 'Nirmal Packaging', tier: 2, category: 'Corrugated packaging', city: 'Chakan', spend: 22, contact: 'V. Joshi', email: 'admin@nirmal.example', facility: 'Pune Plant 2', score: 66, areaScores: [62, null, 70, 74, 60, 64, 68], previousScore: 61, confidence: 72, compliance: 100, addedOn: '2025-10-01' },
      { id: 'SUP-014', name: 'Greenline Logistics', tier: 2, category: 'Inbound logistics', city: 'Pune', spend: 35, contact: 'M. Iyer', email: 'ops@greenline.example', facility: 'Pune Plant 1', score: 61, areaScores: [52, null, 64, 58, 66, 60, 66], previousScore: 63, confidence: 66, compliance: 100, addedOn: '2025-10-01' },
      { id: 'SUP-015', name: 'Deccan Forge Works', tier: 2, category: 'Forged parts', city: 'Satara', spend: 28, contact: 'G. More', email: 'plant@deccanforge.example', facility: 'Pune Plant 2', score: 44, areaScores: [40, null, 46, 42, 48, 30, 58], previousScore: 39, confidence: 55, compliance: 67, addedOn: '2025-10-01' },
    ],

    assessments: [
      { id: 'A1', title: 'Supplier Onboarding — Tier 1', type: 'Onboarding', tier: 1, period: '2026', dueDate: '2026-12-15', status: 'Active', questionCount: 10, startedOn: '2026-11-04' },
      { id: 'A2', title: 'Supplier Onboarding — Tier 2', type: 'Onboarding', tier: 2, period: '2026', dueDate: '2026-11-10', status: 'Active', questionCount: 5, startedOn: '2026-10-27' },
      { id: 'A3', title: 'Annual ESG Assessment — Tier 1', type: 'Annual ESG', tier: 1, period: '2026', dueDate: '2026-12-15', status: 'Active', questionCount: 50, startedOn: '2026-11-02' },
      { id: 'A4', title: 'Annual ESG Assessment — Tier 2', type: 'Annual ESG', tier: 2, period: '2026', dueDate: '2026-11-30', status: 'Active', questionCount: 25, startedOn: '2026-10-15' },
      { id: 'A5', title: 'Materiality Assessment', type: 'Materiality', tier: null, period: '2026', dueDate: '2026-12-20', status: 'Active', questionCount: 12, startedOn: '2026-11-10' },
      { id: 'A6', title: 'Follow-up review — Labour practices', type: 'Follow-up', tier: null, period: 'Q1 2027', dueDate: null, status: 'Draft', questionCount: 8, startedOn: null },
      { id: 'A7', title: 'Annual ESG Assessment — Tier 1', type: 'Annual ESG', tier: 1, period: '2025', dueDate: '2025-12-15', status: 'Closed', questionCount: 46, startedOn: '2025-10-20' },
    ],

    assignments: [
      assign('A1', 'SUP-007', 'not_invited', null, 0),
      assign('A1', 'SUP-008', 'reviewed', '2026-12-15', 10, '2026-11-12'),
      assign('A1', 'SUP-009', 'reviewed', '2026-12-15', 10, '2026-11-12'),
      assign('A1', 'SUP-010', 'reviewed', '2026-12-15', 10, '2026-11-12'),
      assign('A1', 'SUP-011', 'reviewed', '2026-12-15', 10, '2026-11-12'),
      assign('A1', 'SUP-012', 'reviewed', '2026-12-15', 10, '2026-11-12'),
      assign('A2', 'SUP-003', 'reopened', '2026-11-10', 5, '2026-10-27'),
      assign('A2', 'SUP-004', 'not_invited', null, 0),
      assign('A2', 'SUP-005', 'not_invited', null, 0),
      assign('A2', 'SUP-013', 'reviewed', '2026-11-10', 5, '2026-11-05'),
      assign('A2', 'SUP-014', 'reviewed', '2026-11-10', 5, '2026-11-05'),
      assign('A2', 'SUP-015', 'reviewed', '2026-11-10', 5, '2026-11-05'),
      assign('A3', 'SUP-008', 'reviewed', '2026-12-15', 50, '2026-11-14'),
      assign('A3', 'SUP-009', 'reviewed', '2026-12-15', 50, '2026-11-14'),
      assign('A3', 'SUP-010', 'submitted', '2026-12-15', 50, '2026-11-18'),
      assign('A3', 'SUP-011', 'reviewed', '2026-12-15', 50, '2026-11-14'),
      assign('A3', 'SUP-012', 'submitted', '2026-12-15', 47, '2026-11-20'),
      assign('A4', 'SUP-013', 'reviewed', '2026-11-30', 25, '2026-11-08'),
      assign('A4', 'SUP-014', 'submitted', '2026-11-30', 25, '2026-11-22'),
      assign('A4', 'SUP-015', 'reviewed', '2026-11-30', 25, '2026-11-08'),
      assign('A4', 'SUP-003', 'invited', '2026-11-30', 0),
      assign('A7', 'SUP-008', 'reviewed', '2025-12-15', 46, '2025-12-10'),
      assign('A7', 'SUP-009', 'reviewed', '2025-12-15', 46, '2025-12-10'),
      assign('A7', 'SUP-010', 'reviewed', '2025-12-15', 46, '2025-12-10'),
      assign('A7', 'SUP-011', 'reviewed', '2025-12-15', 46, '2025-12-10'),
    ],

    flags: [
      { id: 'F1', supplierId: 'SUP-003', assessmentId: 'A2', questionCode: 'OB-05', cause: 'Permit missing (CTO)', text: 'CTO document missing — supplier says it holds a valid CTO', status: 'Open', raisedOn: '2026-10-27' },
      { id: 'F2', supplierId: 'SUP-003', assessmentId: 'A2', questionCode: 'OB-08', cause: 'Penalties, past 3 years', text: 'Penalised for an ESG-related violation in the past 3 years', status: 'Open', raisedOn: '2026-10-27' },
      { id: 'F3', supplierId: 'SUP-008', assessmentId: 'A3', questionCode: 'OB-08', cause: 'Penalties, past 3 years', text: 'Pollution Control Board notice, 2025', status: 'Action raised', raisedOn: '2026-11-14' },
      { id: 'F4', supplierId: 'SUP-012', assessmentId: 'A3', questionCode: 'OB-05', cause: 'Permit missing (CTO)', text: 'CTO expired Aug 2026; renewal applied', status: 'Action raised', raisedOn: '2026-11-20' },
      { id: 'F5', supplierId: 'SUP-012', assessmentId: 'A3', questionCode: 'S-03', cause: 'Wages or working hours', text: 'Overtime above legal limit in 2 of 12 months', status: 'Open', raisedOn: '2026-11-20' },
      { id: 'F6', supplierId: 'SUP-015', assessmentId: 'A4', questionCode: 'S-03', cause: 'Wages or working hours', text: 'Contract workers paid below state minimum wage', status: 'Action raised', raisedOn: '2026-11-08' },
    ],

    evidence: [
      { id: 'E1', supplierId: 'SUP-010', assessmentId: 'A3', questionCode: 'E-06', question: 'Scope 1 and 2 GHG emissions', fileName: 'GHG inventory FY2025-26.pdf', uploadedOn: '2026-11-18', status: 'Pending' },
      { id: 'E2', supplierId: 'SUP-012', assessmentId: 'A3', questionCode: 'OB-05', question: 'Valid Consent to Operate', fileName: 'CTO renewal application.pdf', uploadedOn: '2026-11-20', status: 'Pending' },
      { id: 'E3', supplierId: 'SUP-014', assessmentId: 'A4', questionCode: 'E-02', question: 'Environmental management system', fileName: 'ISO 14001 certificate.pdf', uploadedOn: '2026-11-21', status: 'Pending' },
    ],

    threads: [
      {
        assessmentId: 'A3', supplierId: 'SUP-012', questionCode: 'OB-05',
        messages: [{ from: 'supplier', author: 'P. Mehta', text: 'Our CTO renewal is in process with GPCB. Can we upload the application receipt instead of the certificate?', sentOn: '2026-11-21' }],
      },
      {
        assessmentId: 'A3', supplierId: 'SUP-010', questionCode: 'E-06',
        messages: [{ from: 'client', author: 'Prajal', text: 'Please confirm whether the Scope 1 and 2 figures are verified by a third party.', sentOn: '2026-11-19' }],
      },
      {
        assessmentId: 'A4', supplierId: 'SUP-014', questionCode: 'E-07',
        messages: [
          { from: 'supplier', author: 'M. Iyer', text: 'Is Scope 3 applicable to logistics vendors?', sentOn: '2026-11-12' },
          { from: 'client', author: 'Prajal', text: 'Not for Tier 2. The question is hidden for your tier now.', sentOn: '2026-11-13' },
        ],
      },
    ],

    actions: [
      { id: 'IA-01', supplierId: 'SUP-003', flagId: 'F1', title: 'Upload a valid Consent to Operate', owner: 'Shubham', dueDate: '2026-12-10', status: 'Open' },
      { id: 'IA-02', supplierId: 'SUP-012', flagId: 'F4', title: 'Renew Consent to Operate with GPCB', owner: 'P. Mehta', dueDate: '2026-12-31', status: 'In progress' },
      { id: 'IA-03', supplierId: 'SUP-008', flagId: 'F3', title: 'Close the 2025 pollution notice and share proof', owner: 'S. Patil', dueDate: '2026-12-05', status: 'Awaiting approval' },
      { id: 'IA-04', supplierId: 'SUP-015', flagId: 'F6', title: 'Wage register audit for contract workers', owner: 'G. More', dueDate: '2026-11-15', status: 'Open' },
      { id: 'IA-05', supplierId: 'SUP-009', flagId: null, title: 'Set a science-based emissions target', owner: 'A. Shah', dueDate: '2026-10-30', status: 'Closed' },
    ],

    topics: [
      { n: 1, title: 'GHG emissions & energy', impact: 4.6, financial: 4.2, areaIndex: 0 },
      { n: 2, title: 'Product carbon & Scope 3', impact: 4.1, financial: 3.8, areaIndex: 1 },
      { n: 3, title: 'Water stewardship', impact: 3.9, financial: 3.0, areaIndex: 2 },
      { n: 4, title: 'Waste & circularity', impact: 3.6, financial: 3.2, areaIndex: 3 },
      { n: 5, title: 'Hazardous chemicals', impact: 3.7, financial: 4.1, areaIndex: 3 },
      { n: 6, title: 'Responsible minerals (3TG)', impact: 3.2, financial: 3.6, areaIndex: 4 },
      { n: 7, title: 'Labour rights & wages', impact: 4.3, financial: 3.7, areaIndex: 5 },
      { n: 8, title: 'Health & safety', impact: 4.4, financial: 4.0, areaIndex: 5 },
      { n: 9, title: 'Business ethics & anti-bribery', impact: 3.8, financial: 4.4, areaIndex: 6 },
      { n: 10, title: 'Data privacy', impact: 2.6, financial: 3.4, areaIndex: 6 },
      { n: 11, title: 'Biodiversity', impact: 2.4, financial: 1.9, areaIndex: 2 },
      { n: 12, title: 'Community engagement', impact: 2.8, financial: 2.2, areaIndex: 4 },
    ],

    survey: [
      { group: 'Internal teams', responded: 9, invited: 12 },
      { group: 'Suppliers (Tier 1)', responded: 5, invited: 6 },
      { group: 'Suppliers (Tier 2)', responded: 2, invited: 6 },
      { group: 'Customers', responded: 2, invited: 5 },
    ],

    questions: [
      { code: 'OB-01', section: 'General', areaIndex: null, text: 'Name of the company', answerType: 'Text', evidenceRequired: false, redFlag: false, tiers: [1, 2], template: 'Onboarding' },
      { code: 'OB-02', section: 'General', areaIndex: null, text: 'Full registered address (facility / plant)', answerType: 'Text', evidenceRequired: false, redFlag: false, tiers: [1, 2], template: 'Onboarding' },
      { code: 'OB-03', section: 'General', areaIndex: null, text: 'Products or services supplied', answerType: 'Text', evidenceRequired: false, redFlag: false, tiers: [1, 2], template: 'Onboarding' },
      { code: 'OB-05', section: 'General', areaIndex: null, text: 'Does your company hold a valid Consent to Operate (CTO) from the Pollution Control Board?', answerType: 'Single select + upload', evidenceRequired: true, redFlag: true, tiers: [1, 2], template: 'Onboarding' },
      { code: 'OB-07', section: 'General', areaIndex: null, text: 'Which certifications does your company hold?', answerType: 'Multi-select + upload', evidenceRequired: true, redFlag: false, tiers: [1], template: 'Onboarding' },
      { code: 'OB-08', section: 'General', areaIndex: 6, text: 'Has your company been penalised for any ESG-related regulatory violation in the past 3 years?', answerType: 'Single select + upload', evidenceRequired: false, redFlag: true, tiers: [1, 2], template: 'Onboarding' },
      { code: 'E-01', section: 'Environment', areaIndex: 0, text: 'Do you have a formal environment policy with quantitative targets?', answerType: 'Single select + upload', evidenceRequired: true, redFlag: false, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'E-02', section: 'Environment', areaIndex: 0, text: 'Is your environmental management system certified (ISO 14001 / 50001)?', answerType: 'Single select + upload', evidenceRequired: true, redFlag: false, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'E-04', section: 'Environment', areaIndex: 0, text: 'What share of your electricity comes from renewable sources?', answerType: 'Single select + data', evidenceRequired: false, redFlag: false, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'E-06', section: 'Environment', areaIndex: 0, text: 'Do you measure and report Scope 1 and 2 GHG emissions?', answerType: 'Single select + data + upload', evidenceRequired: true, redFlag: false, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'E-07', section: 'Environment', areaIndex: 1, text: 'How do you assess and manage Scope 3 value-chain emissions?', answerType: 'Single select', evidenceRequired: false, redFlag: false, tiers: [1], template: 'Annual ESG' },
      { code: 'E-12', section: 'Environment', areaIndex: 2, text: 'Do you track water withdrawal by source?', answerType: 'Single select + data', evidenceRequired: false, redFlag: false, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'E-16', section: 'Environment', areaIndex: 3, text: 'What share of your waste is diverted from landfill?', answerType: 'Single select + data', evidenceRequired: false, redFlag: false, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'P-02', section: 'Sustainable procurement', areaIndex: 4, text: 'Do you cascade a supplier code of conduct to your own suppliers?', answerType: 'Single select + upload', evidenceRequired: true, redFlag: false, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'S-03', section: 'Social', areaIndex: 5, text: 'Do you comply with minimum wage and working-hour laws for all workers, including contract workers?', answerType: 'Single select + upload', evidenceRequired: true, redFlag: true, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'S-14', section: 'Social', areaIndex: 5, text: 'Report your lost-time injury frequency rate and any fatalities', answerType: 'Data', evidenceRequired: false, redFlag: true, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'G-02', section: 'Governance', areaIndex: 6, text: 'Do you have an anti-bribery policy with annual training?', answerType: 'Single select + upload', evidenceRequired: true, redFlag: false, tiers: [1, 2], template: 'Annual ESG' },
      { code: 'G-05', section: 'Governance', areaIndex: 6, text: 'Do workers and communities have a grievance mechanism?', answerType: 'Single select', evidenceRequired: false, redFlag: false, tiers: [1, 2], template: 'Annual ESG' },
    ],

    facilities: [
      { name: 'Pune Plant 1', city: 'Pune', supplierCount: 5 },
      { name: 'Pune Plant 2', city: 'Pune', supplierCount: 3 },
      { name: 'Vapi Unit', city: 'Vapi', supplierCount: 4 },
    ],

    settings: { onboardingDays: 21, tier1Spend: 50, reminderDays: [7, 3, 1], escalateAfterDays: 7, highSpend: 100 },

    notifications: [
      { id: 'n1', title: 'Greenline Logistics submitted Annual ESG Assessment — Tier 2', detail: 'Ready for review', at: '2026-11-22', to: '/response/A4/SUP-014', unread: true },
      { id: 'n2', title: 'Saanvi Chemicals asked a question on “Valid Consent to Operate”', detail: 'Awaiting your reply', at: '2026-11-21', to: '/response/A3/SUP-012', unread: true },
      { id: 'n3', title: 'Vertex Circuits uploaded GHG inventory FY2025-26.pdf', detail: 'Evidence to verify', at: '2026-11-18', to: '/reviews/evidence', unread: true },
      { id: 'n4', title: 'Wage register audit is overdue', detail: 'Deccan Forge Works · due 15 Nov', at: '2026-11-16', to: '/actions', unread: false },
      { id: 'n5', title: 'Shubham submitted Supplier Onboarding — Tier 2', detail: '2 red flags raised', at: '2026-10-27', to: '/response/A2/SUP-003', unread: false },
    ],

    qualityChecks: [
      { name: 'Verification', detail: 'documents accepted', weight: 35, average: 58 },
      { name: 'Completeness', detail: 'documents and data given', weight: 20, average: 71 },
      { name: 'Traceability', detail: 'figures backed by a document', weight: 20, average: 66 },
      { name: 'Coverage', detail: 'questions answered', weight: 15, average: 96 },
      { name: 'Timeliness', detail: 'on time, in date', weight: 10, average: 88 },
    ],

    reports: [
      { id: 'brsr', title: 'BRSR — Principle 6 & value chain', description: 'Supplier environment data for your Business Responsibility and Sustainability Report.', coverage: 74 },
      { id: 'ecovadis', title: 'EcoVadis — Sustainable procurement', description: 'Supplier engagement evidence mapped to EcoVadis criteria.', coverage: 68 },
      { id: 'scope3', title: 'Scope 3 Category 1 — Purchased goods', description: 'Supplier-specific emissions allocated by your spend (Tier 1).', coverage: 52 },
      { id: 'custom', title: 'Custom export', description: 'Any assessment, any columns, as Excel or CSV.', coverage: null },
    ],

    reviewDecisions: {},
    previousMaturity: { 1: [2, 1, 1, 0, 0], 2: [2, 1, 0, 0, 0] },
    areaDeltas: [6, 4, 2, 3, -1, 5, 1],
  };
}
