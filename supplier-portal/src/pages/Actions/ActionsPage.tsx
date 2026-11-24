import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, Input, Modal, Select } from 'antd';
import { MoreOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Button } from '../../components/Button/Button';
import { Pill } from '../../components/Pill/Pill';
import { FormField } from '../../components/blocks/Blocks';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useToast } from '../../components/useToast';
import { FLAG_CAUSE_LABEL } from '../../domain/constants';
import { usePortal, usePortalActions } from '../../state/hooks';
import { addDays, isOverdue, supplierById } from '../../domain/selectors';
import type { ActionStatus, ImprovementAction, PortalData } from '../../domain/types';
import { formatDateShort } from '../../lib/format';
import './ActionsPage.scss';

const COLUMNS: ActionStatus[] = ['Open', 'In progress', 'Awaiting approval', 'Closed'];

export default function ActionsPage() {
  const data = usePortal();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Improvement actions"
        subtitle="Raised from red flags and low scores; each one is tracked into next year's score"
        actions={
          <Button variant="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
            New action
          </Button>
        }
      />
      <div className="board">
        {COLUMNS.map((col) => {
          const items = data.actions.filter((a) => a.status === col);
          return (
            <section key={col} className="board__col" aria-label={`${col}, ${items.length}`}>
              <h2 className="board__title">
                {col}
                <span>{items.length}</span>
              </h2>
              {items.length ? items.map((a) => <ActionCard key={a.id} data={data} a={a} />) : <EmptyState>None</EmptyState>}
            </section>
          );
        })}
      </div>
      <NewActionModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function ActionCard({ data, a }: { data: PortalData; a: ImprovementAction }) {
  const { moveAction } = usePortalActions();
  const toast = useToast();
  const flag = a.flagId ? data.flags.find((f) => f.id === a.flagId) : null;
  const late = a.status !== 'Closed' && isOverdue(data.asOf, a.dueDate);
  const move = async (to: ActionStatus, msg: string) => {
    await moveAction(a.id, to);
    toast.success(msg);
  };

  return (
    <article className="action-card">
      <div className="action-card__head">
        <b>{a.title}</b>
        <Dropdown
          trigger={['click']}
          menu={{
            items: COLUMNS.filter((c) => c !== a.status).map((c) => ({ key: c, label: `Move to ${c}`, onClick: () => move(c, `Moved to ${c}`) })),
          }}
        >
          <button type="button" className="action-card__more" aria-label={`Move “${a.title}”`}>
            <MoreOutlined />
          </button>
        </Dropdown>
      </div>
      <div className="action-card__meta">
        <Link to={`/suppliers/${a.supplierId}`}>{supplierById(data, a.supplierId)?.name}</Link> · {a.owner}
      </div>
      <div className="action-card__meta" style={{ marginTop: 6 }}>
        {late && <Pill tone="error">Overdue</Pill>}
        <span>Due {formatDateShort(a.dueDate)}</span>
        {flag && <Pill tone="neutral">⚑ {FLAG_CAUSE_LABEL[flag.cause]}</Pill>}
      </div>
      {a.status === 'Awaiting approval' && (
        <div className="action-card__buttons">
          <Button size="sm" variant="accept" onClick={() => move('Closed', 'Action approved and closed')}>
            Approve & close
          </Button>
          <Button size="sm" onClick={() => move('In progress', 'Sent back to supplier')}>
            Send back
          </Button>
        </div>
      )}
    </article>
  );
}

function NewActionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = usePortal();
  const { createAction } = usePortalActions();
  const toast = useToast();
  const [supplierId, setSupplierId] = useState<string>();
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState(addDays(data.asOf, 30));
  const ok = !!supplierId && !!title.trim();

  const submit = async () => {
    if (!supplierId) return;
    await createAction({ supplierId, title, owner: owner || supplierById(data, supplierId)?.contact || '', dueDate: due });
    toast.success('Improvement action created');
    setSupplierId(undefined);
    setTitle('');
    setOwner('');
    onClose();
  };

  return (
    <Modal open={open} onCancel={onClose} title="New improvement action" okText="Create action" okButtonProps={{ disabled: !ok }} onOk={submit} destroyOnHidden>
      <FormField label="Supplier *" htmlFor="na-sup">
        <Select
          id="na-sup"
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          placeholder="Choose a supplier"
          value={supplierId}
          onChange={(v) => {
            setSupplierId(v);
            setOwner(supplierById(data, v)?.contact ?? '');
          }}
          options={data.suppliers.map((s) => ({ value: s.id, label: s.name }))}
        />
      </FormField>
      <FormField label="What needs to happen *" htmlFor="na-title">
        <Input id="na-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Publish a Scope 3 reduction plan" />
      </FormField>
      <div className="form-row">
        <FormField label="Owner at the supplier" htmlFor="na-owner">
          <Input id="na-owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
        </FormField>
        <FormField label="Due date" htmlFor="na-due">
          <Input id="na-due" type="date" min={data.asOf} value={due} onChange={(e) => setDue(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
