import { useState } from 'react';
import { Input, InputNumber, Modal, Segmented, Select } from 'antd';
import { FormField } from '../../components/blocks/Blocks';
import { useToast } from '../../components/useToast';
import { usePortal, usePortalActions } from '../../state/hooks';
import type { Supplier, Tier } from '@shared/domain/types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Edit a supplier's details. Scores and assessment history aren't editable here. */
export function EditSupplierModal({ supplier, open, onClose }: { supplier: Supplier; open: boolean; onClose: () => void }) {
  const data = usePortal();
  const { updateSupplier } = usePortalActions();
  const toast = useToast();
  const [f, setF] = useState({
    name: supplier.name,
    contact: supplier.contact,
    email: supplier.email,
    category: supplier.category,
    city: supplier.city,
    spend: supplier.spend,
    facility: supplier.facility,
    tier: supplier.tier,
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const emailOk = EMAIL.test(f.email.trim());
  const valid = !!f.name.trim() && !!f.contact.trim() && emailOk && f.spend > 0 && !!f.category.trim();
  const tierChanged = f.tier !== supplier.tier;

  const save = async () => {
    setBusy(true);
    try {
      await updateSupplier(supplier.id, f);
      toast.success(`${f.name.trim()} updated`);
      onClose();
    } catch {
      /* the store has already shown the error */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Edit ${supplier.name}`}
      okText="Save changes"
      okButtonProps={{ disabled: !valid, loading: busy }}
      onOk={save}
      destroyOnHidden
      width={560}
    >
      <FormField label="Company name *" htmlFor="es-name">
        <Input id="es-name" value={f.name} onChange={(e) => set('name', e.target.value)} />
      </FormField>
      <div className="form-row">
        <FormField label="Contact person *" htmlFor="es-contact">
          <Input id="es-contact" value={f.contact} onChange={(e) => set('contact', e.target.value)} />
        </FormField>
        <FormField label="Contact email *" htmlFor="es-email" hint={f.email && !emailOk ? 'Enter a valid email address.' : undefined}>
          <Input id="es-email" type="email" value={f.email} status={f.email && !emailOk ? 'error' : undefined} onChange={(e) => set('email', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Products or services supplied *" htmlFor="es-cat">
        <Input id="es-cat" value={f.category} onChange={(e) => set('category', e.target.value)} />
      </FormField>
      <div className="form-row">
        <FormField label="City" htmlFor="es-city">
          <Input id="es-city" value={f.city} onChange={(e) => set('city', e.target.value)} />
        </FormField>
        <FormField label="Annual spend (₹ lakh) *" htmlFor="es-spend">
          <InputNumber id="es-spend" min={1} style={{ width: '100%' }} value={f.spend} onChange={(v) => set('spend', Number(v) || 0)} />
        </FormField>
      </div>
      <div className="form-row">
        <FormField label="Facility it supplies" htmlFor="es-fac">
          <Select id="es-fac" style={{ width: '100%' }} value={f.facility} onChange={(v) => set('facility', v)} options={data.facilities.map((x) => ({ value: x.name, label: x.name }))} />
        </FormField>
        <FormField
          label="Tier"
          hint={tierChanged ? 'Changing tier affects which questionnaires they get in future assessments; existing ones are unchanged.' : undefined}
        >
          <Segmented<Tier>
            value={f.tier}
            onChange={(v) => set('tier', v)}
            options={[
              { value: 1, label: 'Tier 1' },
              { value: 2, label: 'Tier 2' },
            ]}
          />
        </FormField>
      </div>
    </Modal>
  );
}
