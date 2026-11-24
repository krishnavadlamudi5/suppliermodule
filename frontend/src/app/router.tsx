import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppLayout } from '../layout/AppLayout';

const DesignSystem = lazy(() => import('../pages/Foundation/FoundationPage'));
const Dashboard = lazy(() => import('../pages/Dashboard/DashboardPage'));
const Suppliers = lazy(() => import('../pages/Suppliers/SuppliersPage'));
const SupplierProfile = lazy(() => import('../pages/Suppliers/SupplierProfilePage'));
const Assessments = lazy(() => import('../pages/Assessments/AssessmentsPage'));
const AssessmentDetail = lazy(() => import('../pages/Assessments/AssessmentDetailPage'));
const Reviews = lazy(() => import('../pages/Reviews/ReviewsPage'));
const Response = lazy(() => import('../pages/Reviews/ResponsePage'));
const Actions = lazy(() => import('../pages/Actions/ActionsPage'));
const Risk = lazy(() => import('../pages/Risk/RiskPage'));
const Materiality = lazy(() => import('../pages/Materiality/MaterialityPage'));
const Quality = lazy(() => import('../pages/Quality/QualityPage'));
const Reports = lazy(() => import('../pages/Reports/ReportsPage'));
const Questionnaires = lazy(() => import('../pages/Questionnaires/QuestionnairesPage'));
const Settings = lazy(() => import('../pages/Settings/SettingsPage'));
const NotFound = lazy(() => import('../pages/NotFound/NotFoundPage'));

const page = (el: ReactNode) => (
  <Suspense
    fallback={
      <div className="page-loading">
        <Spin />
      </div>
    }
  >
    {el}
  </Suspense>
);

/**
 * Routes mirror the prototype's hash routes (#/suppliers/SUP-008/flags → /suppliers/SUP-008/flags).
 * Every page is lazy-loaded so each screen ships as its own chunk.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: page(<Dashboard />) },
      { path: 'suppliers', element: page(<Suppliers />) },
      { path: 'suppliers/:supplierId/:tab?', element: page(<SupplierProfile />) },
      { path: 'assessments/:tab?', element: page(<Assessments />) },
      { path: 'assessments/detail/:assessmentId/:tab?', element: page(<AssessmentDetail />) },
      { path: 'reviews/:tab?', element: page(<Reviews />) },
      { path: 'response/:assessmentId/:supplierId', element: page(<Response />) },
      { path: 'actions', element: page(<Actions />) },
      { path: 'risk/:tab?', element: page(<Risk />) },
      { path: 'materiality/:tab?', element: page(<Materiality />) },
      { path: 'quality', element: page(<Quality />) },
      { path: 'reports', element: page(<Reports />) },
      { path: 'questionnaires/:tab?', element: page(<Questionnaires />) },
      { path: 'settings/:tab?', element: page(<Settings />) },
      { path: 'design-system', element: page(<DesignSystem />) },
      { path: '*', element: page(<NotFound />) },
    ],
  },
]);
