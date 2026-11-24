import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './Card.scss';

interface CardProps {
  /** Headline — on insight cards, state the finding ("3 high-spend suppliers score below 60") */
  title?: ReactNode;
  /** The question the card answers, shown under the title */
  question?: ReactNode;
  /** Left side of the footer */
  footnote?: ReactNode;
  /** Footer link on the right */
  footerLink?: { to: string; label: string };
  extra?: ReactNode;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, question, footnote, footerLink, extra, compact, className, children }: CardProps) {
  return (
    <section className={['card', compact && 'card--compact', className].filter(Boolean).join(' ')}>
      {(title || extra) && (
        <div className="card__head">
          {title && <h2 className="card__title">{title}</h2>}
          {extra && <div className="card__extra">{extra}</div>}
        </div>
      )}
      {question && <p className="card__question">{question}</p>}
      {children}
      {(footnote || footerLink) && (
        <div className="card__foot">
          <span>{footnote}</span>
          {footerLink && (
            <Link className="card__link" to={footerLink.to}>
              {footerLink.label} →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

/** Responsive grid for cards: 1–3 columns. */
export function CardGrid({ cols = 2, children }: { cols?: 1 | 2 | 3 | 4; children: ReactNode }) {
  return <div className={`card-grid card-grid--${cols}`}>{children}</div>;
}
