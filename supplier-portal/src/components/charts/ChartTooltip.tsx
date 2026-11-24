import { useEffect, useRef } from 'react';
import './charts.scss';

/**
 * One tooltip for every chart. Any element with `data-tip` shows it on hover
 * or keyboard focus. Mount once in the app layout.
 */
export function ChartTooltip() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    let active: Element | null = null;

    const show = (target: Element, x: number, y: number) => {
      active = target;
      el.textContent = target.getAttribute('data-tip');
      el.style.opacity = '1';
      place(x, y);
    };
    const hide = () => {
      active = null;
      el.style.opacity = '0';
    };
    const place = (x: number, y: number) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      el.style.left = `${Math.min(x + 14, window.innerWidth - w - 8)}px`;
      el.style.top = `${Math.min(y + 14, window.innerHeight - h - 8)}px`;
    };

    const over = (e: MouseEvent) => {
      const t = (e.target as Element).closest?.('[data-tip]');
      if (t) show(t, e.clientX, e.clientY);
      else if (active) hide();
    };
    const move = (e: MouseEvent) => {
      if (active) place(e.clientX, e.clientY);
    };
    const focus = (e: FocusEvent) => {
      const t = (e.target as Element).closest?.('[data-tip]');
      if (t) {
        const r = t.getBoundingClientRect();
        show(t, r.right, r.top);
      }
    };

    document.addEventListener('mouseover', over);
    document.addEventListener('mousemove', move);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  return <div ref={ref} className="chart-tooltip" role="tooltip" aria-hidden="true" />;
}
