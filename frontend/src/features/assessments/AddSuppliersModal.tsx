import { useState } from 'react';
import { Checkbox, Input, Modal } from 'antd';
import { FormField } from '../../components/blocks/Blocks';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useToast } from '../../components/useToast';
import { usePortal, usePortalActions } from '../../state/hooks';
import { assignmentsFor, riskOf } from '@shared/domain/selectors';
import type { Assessment } from '@shared/domain/types';
import { formatInr } from '../../lib/format';

/** Add more suppliers to an existing assessment, each with the assessment's due date by default. */
export function AddSuppliersModal({ assessment, open, onClose }: { assessment: Assessment; open: boolean; onClose: () => void }) {
  const data = usePortal();
  const { addToAssessment } = usePortalActions();
  const toast = useToast();
  const [picked, setPicked] = useState<string[]>([]);
  const [due, setDue] = useState(assessment.dueDate ?? data.asOf);
  const [busy, setBusy] = useState(false);

  const inIt = new Set(assignmentsFor(data, assessment.id).map((a) => a.supplierId));
  const pool = data.suppliers.filter((s) => !inIt.has(s.id) && (assessment.tier == null || s.tier === assessment.tier));

  const submit = async () => {
    setBusy(true);
    try {
      await addToAssessment(assessment.id, picked, due);
      toast.success(`${picked.length} supplier${picked.length === 1 ? '' : 's'} added and invited`);
      setPicked([]);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Add suppliers to ${assessment.title}`}
      okText={picked.length ? `Add and invite ${picked.length}` : 'Add'}
      okButtonProps={{ disabled: !picked.length, loading: busy }}
      onOk={submit}
      destroyOnHidden
    >
      {pool.length ? (
        <>
          <FormField label={`Eligible suppliers (${assessment.tier ? `Tier ${assessment.tier}` : 'all tiers'}, not already in it)`}>
            {pool.map((s) => (
              <Checkbox key={s.id} className="check-row"
                  checked={picked.includes(s.id)}
                  onChange={(e) => setPicked((p) => (e.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id)))}>
<span>
                  <b>{s.name}</b>
                  <small>
                    {riskOf(data, s) ?? 'Not assessed'} risk · {formatInr(s.spend)}
                  </small>
                </span>
</Checkbox>
            ))}
          </FormField>
          <FormField label="Due date for these suppliers" htmlFor="add-due">
            <Input id="add-due" type="date" min={data.asOf} value={due} onChange={(e) => setDue(e.target.value)} style={{ maxWidth: 200 }} />
          </FormField>
        </>
      ) : (
        <EmptyState>Every eligible supplier is already in this assessment.</EmptyState>
      )}
    </Modal>
  );
}
