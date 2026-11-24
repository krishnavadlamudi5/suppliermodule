import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Card } from '../../components/Card/Card';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Button } from '../../components/Button/Button';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <>
      <PageHeader title="Page not found" />
      <Card>
        <EmptyState
          action={
            <Link to="/dashboard">
              <Button variant="primary">Go to the dashboard</Button>
            </Link>
          }
        >
          There's nothing at <code>{pathname}</code>. The link may be old, or the page may have moved.
        </EmptyState>
      </Card>
    </>
  );
}
