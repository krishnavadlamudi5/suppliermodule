/**
 * Development-only helpers. Never imported in production builds.
 * In the browser console: await window.__axe()  → accessibility violations on the current page.
 */
declare global {
  interface Window {
    __axe?: () => Promise<{ id: string; impact: string | null | undefined; help: string; nodes: string[] }[]>;
  }
}

window.__axe = async () => {
  const axe = (await import('axe-core')).default;
  const res = await axe.run(document, { resultTypes: ['violations'] });
  return res.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 4).map((n) => n.target.join(' ')),
  }));
};

export {};
