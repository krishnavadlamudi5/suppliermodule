import type { PillTone } from '../../components/Pill/Pill';
import type { Assessment, AssessmentType } from '@shared/domain/types';

export const TYPE_TONE: Record<AssessmentType, PillTone> = { Materiality: 'info', Onboarding: 'neutral', 'Annual ESG': 'brand', 'Follow-up': 'warning' };

/** Where an assessment links to (materiality lives on its own page). */
export const assessmentHref = (a: Assessment) => (a.type === 'Materiality' ? '/materiality/survey' : `/assessments/detail/${a.id}`);
