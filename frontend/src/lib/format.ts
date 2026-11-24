const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "24 Nov 2026" */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

/** "24 Nov" */
export function formatDateShort(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${MON[d.getMonth()]}`;
}

/** Spend in ₹ lakh → "₹1.8 Cr" / "₹95 L" */
export function formatInr(lakh: number): string {
  if (lakh >= 100) return `₹${(lakh / 100).toFixed(lakh % 100 ? 1 : 0)} Cr`;
  return `₹${lakh} L`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
