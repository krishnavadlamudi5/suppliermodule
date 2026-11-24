import { Input, Select, Checkbox, Table, Tabs, Segmented } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '../../components/Button/Button';
import type { ButtonVariant } from '../../components/Button/Button';
import { palette, semantic, maturityRamp, maturityInk, heatRamp, fontSize, color } from '../../theme/tokens';
import type { PaletteKey } from '../../theme/tokens';
import { ComponentGallery } from './ComponentGallery';
import { ChartGallery } from './ChartGallery';
import './FoundationPage.scss';

/* WCAG relative-luminance contrast */
function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const GROUPS: { title: string; prefix: string }[] = [
  { title: 'Brand', prefix: 'brand-' },
  { title: 'Green scale', prefix: 'green-' },
  { title: 'Neutrals', prefix: 'neutral-' },
  { title: 'Success', prefix: 'success-' },
  { title: 'Warning', prefix: 'warning-' },
  { title: 'Error', prefix: 'error-' },
  { title: 'Info', prefix: 'info-' },
];

function Swatch({ name }: { name: PaletteKey }) {
  const hex = palette[name];
  const onWhite = contrast(hex, '#FFFFFF');
  const ink = onWhite >= 4.5 ? '#FFFFFF' : palette['neutral-900'];
  return (
    <div className="fd-swatch">
      <div className="fd-swatch__chip" style={{ background: hex, color: ink }}>
        {hex}
      </div>
      <div className="fd-swatch__meta">
        <b>{name}</b>
        <small className={onWhite >= 4.5 ? 'ok' : onWhite >= 3 ? 'mid' : 'no'}>
          {onWhite.toFixed(2)}:1 on white {onWhite >= 4.5 ? '· AA text' : onWhite >= 3 ? '· large text / UI' : ''}
        </small>
      </div>
    </div>
  );
}

const VARIANTS: { v: ButtonVariant; label: string; use: string }[] = [
  { v: 'primary', label: 'Primary', use: 'One per view: Save, Invite, Launch' },
  { v: 'secondary', label: 'Secondary', use: 'Cancel, Back, Export, Remind' },
  { v: 'ghost', label: 'Ghost', use: 'Low-emphasis: Edit in tables, Preview' },
  { v: 'danger', label: 'Danger', use: 'Destructive: Close assessment' },
  { v: 'accept', label: 'Accept', use: 'Review: accept answer / document' },
  { v: 'reject', label: 'Reject', use: 'Review: flag answer / reject document' },
];

const PILLS = [
  ['Reviewed', 'success'],
  ['Not invited', 'warning'],
  ['Overdue', 'error'],
  ['Developing', 'info'],
  ['Invited', 'neutral'],
  ['Awaiting review', 'brand'],
] as const;

const TEXT_ROLES = ['text-primary', 'text-heading', 'text-secondary', 'text-muted', 'text-link', 'text-disabled'] as const;

export default function FoundationPage() {
  return (
    <div className="fd">
      <header className="fd-head">
        <div>
          <div className="fd-eyebrow">Design system</div>
          <h1>Supplier ESG portal: tokens and components</h1>
          <p>Every color, type size, button and shared component the portal uses, generated from <code>src/theme/tokens.ts</code>.</p>
        </div>
      </header>

      <ComponentGallery />

      <ChartGallery />

      <section className="fd-card">
        <h2>Buttons</h2>
        <p className="fd-q">One system: 32 / 36 / 44 px, 8px radius, Montserrat 600. Hover, pressed and disabled states on every variant.</p>
        <table className="fd-btn-grid">
          <thead>
            <tr>
              <th>Variant</th>
              <th>Small · 32</th>
              <th>Default · 36</th>
              <th>Large · 44</th>
              <th>Disabled</th>
              <th>Use for</th>
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map(({ v, label, use }) => (
              <tr key={v}>
                <td><b>{label}</b></td>
                <td><Button variant={v} size="sm">{label}</Button></td>
                <td><Button variant={v} icon={v === 'primary' ? <PlusOutlined /> : undefined}>{v === 'primary' ? 'Add supplier' : label}</Button></td>
                <td><Button variant={v} size="lg">{label}</Button></td>
                <td><Button variant={v} disabled>{label}</Button></td>
                <td className="fd-muted">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="fd-card">
        <h2>Palette</h2>
        <p className="fd-q">One hex per token. Contrast is measured live against white.</p>
        {GROUPS.map((g) => (
          <div key={g.title} className="fd-group">
            <h3>{g.title}</h3>
            <div className="fd-swatches">
              {(Object.keys(palette) as PaletteKey[])
                .filter((k) => k.startsWith(g.prefix))
                .map((k) => <Swatch key={k} name={k} />)}
            </div>
          </div>
        ))}
      </section>

      <div className="fd-grid2">
        <section className="fd-card">
          <h2>Text roles</h2>
          <p className="fd-q">Semantic tokens components use, never raw hex</p>
          {TEXT_ROLES.map((r) => (
            <div key={r} className="fd-row">
              <span style={{ color: color(r), fontWeight: r === 'text-heading' ? 650 : r === 'text-link' ? 600 : 500 }}>
                Supplier ESG programme
              </span>
              <code>--{r}</code>
              <small className="fd-muted">{palette[semantic[r]]} · {contrast(color(r), '#FFFFFF').toFixed(1)}:1</small>
            </div>
          ))}
        </section>

        <section className="fd-card">
          <h2>Type scale</h2>
          <p className="fd-q">Montserrat 400 / 500 / 600 / 700</p>
          {(Object.entries(fontSize) as [string, string][]).reverse().map(([k, v]) => (
            <div key={k} className="fd-row">
              <span style={{ fontSize: v, fontWeight: k === '2xl' || k === 'xl' ? 650 : 500 }}>Annual ESG Assessment</span>
              <code>--fs-{k}</code>
              <small className="fd-muted">{v}</small>
            </div>
          ))}
        </section>
      </div>

      <div className="fd-grid2">
        <section className="fd-card">
          <h2>Status pills</h2>
          <p className="fd-q">Background + text + border triplets, all AA</p>
          <div className="fd-pills">
            {PILLS.map(([t, k]) => (
              <span key={t} className={`fd-pill fd-pill--${k}`}>{t}</span>
            ))}
          </div>
        </section>

        <section className="fd-card">
          <h2>Chart ramps</h2>
          <p className="fd-q">Maturity (green scale) and score heatmap (red → brand green)</p>
          <div className="fd-ramp">
            {['Nascent', 'Emerging', 'Developing', 'Progressive', 'Transformative'].map((n, i) => (
              <span key={n} style={{ background: maturityRamp[i], color: maturityInk[i] }}>{n}</span>
            ))}
          </div>
          <div className="fd-ramp">
            {heatRamp.map((h) => (
              <span key={h.label} style={{ background: h.fill, color: h.ink }}>{h.label}</span>
            ))}
          </div>
          <div className="fd-ramp fd-ramp--series">
            <span style={{ background: color('chart-series-1') }}>Series 1 · Tier 1</span>
            <span style={{ background: color('chart-series-2') }}>Series 2 · Tier 2</span>
            <span style={{ background: color('chart-inactive') }}>Inactive</span>
          </div>
        </section>
      </div>

      <section className="fd-card">
        <h2>Ant Design components, themed</h2>
        <p className="fd-q">Colors come through ConfigProvider. No <code>!important</code> overrides.</p>
        <div className="fd-controls">
          <Input placeholder="Search suppliers, assessments, questions" style={{ width: 320 }} />
          <Select defaultValue="all" style={{ width: 160 }} options={[{ value: 'all', label: 'All facilities' }, { value: 'p1', label: 'Pune Plant 1' }]} />
          <Segmented options={['All tiers', 'Tier 1', 'Tier 2']} />
          <Checkbox defaultChecked>Remind 7, 3, 1 days before</Checkbox>
        </div>
        <Tabs
          items={[
            { key: 'a', label: 'Responses' },
            { key: 'b', label: 'Evidence' },
            { key: 'c', label: 'Clarifications' },
            { key: 'd', label: 'Red flags' },
          ]}
        />
        <Table
          size="middle"
          pagination={false}
          rowSelection={{ defaultSelectedRowKeys: ['2'] }}
          columns={[
            { title: 'Supplier', dataIndex: 'n' },
            { title: 'Tier', dataIndex: 't' },
            { title: 'ESG score', dataIndex: 's', align: 'right' },
          ]}
          dataSource={[
            { key: '1', n: 'Sharda Polymers', t: 'Tier 1', s: 74 },
            { key: '2', n: 'Kavya Castings', t: 'Tier 1', s: 48 },
            { key: '3', n: 'Nirmal Packaging', t: 'Tier 2', s: 66 },
          ]}
        />
      </section>
    </div>
  );
}
