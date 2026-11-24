import type { PortalData, Question, Supplier } from '@shared/domain/types';

/**
 * Sample answer text for the response-review screen (ported from the prototype).
 * A real backend returns the supplier's actual answers instead.
 */
export function sampleAnswer(d: PortalData, s: Supplier, q: Question): string {
  const hasFlag = (code: string) => d.flags.some((f) => f.supplierId === s.id && f.questionCode === code);
  if (q.answerType === 'Text') {
    if (q.code === 'OB-01') return s.name;
    if (q.code === 'OB-02') return `${s.city}, ${s.city === 'Pune' ? 'Maharashtra' : 'India'}`;
    return s.category;
  }
  if (q.code === 'OB-05') return hasFlag('OB-05') ? 'Yes, we hold a valid CTO — renewal in process' : 'Yes, we hold a valid CTO (expires Mar 2028)';
  if (q.code === 'OB-08') return hasFlag('OB-08') ? 'Yes — penalty or legal notice received (details in remarks)' : 'No penalties in the past 3 years';
  if (q.code === 'S-03') return hasFlag('S-03') ? 'Partly — overtime limits exceeded in some months' : 'Yes, audited annually';

  const v = q.areaIndex != null && s.areaScores ? s.areaScores[q.areaIndex] : s.score;
  if (v == null) return 'Not applicable for this tier';
  if (v >= 80) return 'D — Leading practice, verified';
  if (v >= 65) return 'C — Formal system in place, partly verified';
  if (v >= 45) return 'B — Some practice, not yet formal';
  return 'A — Not in place';
}
