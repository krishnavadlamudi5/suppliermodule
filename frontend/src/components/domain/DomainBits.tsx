import { Pill } from '../Pill/Pill';
import { ASSIGNMENT_LABEL, ASSIGNMENT_TONE } from '@shared/domain/constants';
import { isOverdue, maturityName } from '@shared/domain/selectors';
import type { Assignment, ISODate, Message } from '@shared/domain/types';
import { formatDate, initials } from '../../lib/format';
import './DomainBits.scss';

/** Assignment status, plus an "Overdue" pill when it's late and not yet handed in. */
export function AssignmentStatusPill({ a, asOf }: { a: Assignment; asOf: ISODate }) {
  const late = a.status !== 'reviewed' && a.status !== 'submitted' && isOverdue(asOf, a.dueDate);
  return (
    <span className="status-pills">
      <Pill tone={ASSIGNMENT_TONE[a.status]}>{ASSIGNMENT_LABEL[a.status]}</Pill>
      {late && <Pill tone="error">Overdue</Pill>}
    </span>
  );
}

export function MaturityPill({ score }: { score: number | null | undefined }) {
  const name = maturityName(score);
  return name ? <Pill tone="info">{name}</Pill> : <span className="muted">—</span>;
}

export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="message-list">
      {messages.map((m, i) => (
        <div key={i} className={`message message--${m.from}`}>
          <span className="message__who" aria-hidden="true">
            {initials(m.author)}
          </span>
          <div className="message__body">
            {m.text}
            <small>
              {m.author} · {formatDate(m.sentOn)}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
