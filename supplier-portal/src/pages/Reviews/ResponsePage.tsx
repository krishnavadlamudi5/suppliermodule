import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Input } from 'antd';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Pill } from '../../components/Pill/Pill';
import { CodeTag, RiskBadge } from '../../components/Badges/Badges';
import { DocChip, Timeline } from '../../components/blocks/Blocks';
import { MaturityPill, MessageList } from '../../components/domain/DomainBits';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { HBarChart } from '../../components/charts/HBarChart';
import { C } from '../../components/charts/chartKit';
import { useToast } from '../../components/useToast';
import { useConfirm } from '../../components/useConfirm';
import { usePortal, usePortalActions } from '../../state/hooks';
import { AREAS, AREA_SHORT, ASSIGNMENT_LABEL } from '../../domain/constants';
import { assessmentById, effectiveDecision, riskOf, supplierById, threadFor } from '../../domain/selectors';
import type { Assessment, PortalData, Question, Supplier } from '../../domain/types';
import { sampleAnswer } from '../../data/fixtures/sampleAnswers';
import { formatDate } from '../../lib/format';
import './ResponsePage.scss';

export default function ResponsePage() {
  const { assessmentId = '', supplierId = '' } = useParams();
  const data = usePortal();
  const { markReviewed, sendBack, setReviewDecisions } = usePortalActions();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const { hash } = useLocation();

  const a = assessmentById(data, assessmentId);
  const s = supplierById(data, supplierId);
  const x = data.assignments.find((y) => y.assessmentId === assessmentId && y.supplierId === supplierId);

  // Template questions for this tier, plus any question with a flag, document or thread on it
  const questions = useMemo(() => {
    if (!a || !s) return [];
    const base = data.questions.filter((q) => q.template === a.type && q.tiers.includes(s.tier));
    const extraCodes = new Set([
      ...data.threads.filter((t) => t.assessmentId === a.id && t.supplierId === s.id).map((t) => t.questionCode),
      ...data.flags.filter((f) => f.assessmentId === a.id && f.supplierId === s.id).map((f) => f.questionCode),
      ...data.evidence.filter((e) => e.assessmentId === a.id && e.supplierId === s.id).map((e) => e.questionCode),
    ]);
    const extra = data.questions.filter((q) => extraCodes.has(q.code) && !base.includes(q));
    return [...extra, ...base];
  }, [data, a, s]);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [hash]);

  if (!a || !s || !x) {
    return (
      <>
        <PageHeader title="Submission not found" crumbs={[{ label: 'Review Queue', to: '/reviews' }, { label: 'Submission' }]} />
        <Card>
          <EmptyState action={<Link to="/reviews">Back to Review Queue</Link>}>No submission exists for this supplier and assessment.</EmptyState>
        </Card>
      </>
    );
  }

  const decisionOf = (q: Question) => effectiveDecision(data, a.id, s.id, q.code);
  const accepted = questions.filter((q) => decisionOf(q) === 'accepted').length;
  const flagged = questions.filter((q) => decisionOf(q) === 'flagged').length;
  const waiting = questions.filter((q) => threadFor(data, a.id, s.id, q.code)?.messages.at(-1)?.from === 'supplier').length;
  const ref = { assessmentId: a.id, supplierId: s.id };
  const unchecked = questions.filter((q) => decisionOf(q) == null);
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

  const acceptRemaining = async () => {
    if (!unchecked.length) return;
    await setReviewDecisions(a.id, s.id, unchecked.map((q) => q.code), 'accepted');
    toast.success(`${unchecked.length} ${plural(unchecked.length, 'answer', 'answers')} accepted`);
  };

  const doSendBack = async () => {
    const ok = await confirm({
      title: `Send this response back to ${s.name}?`,
      content:
        flagged || waiting
          ? `They'll be asked to update ${flagged} flagged ${plural(flagged, 'answer', 'answers')} and see your questions. The response moves to Reopened.`
          : "You haven't flagged any answers or asked anything, so they won't know what to change. Flag or ask on the answers first.",
      okText: 'Send back',
    });
    if (!ok) return;
    await sendBack(ref);
    toast.success(`Sent back to ${s.name}`);
    navigate('/reviews/responses');
  };

  const doMarkReviewed = async () => {
    if (unchecked.length || flagged) {
      const parts: string[] = [];
      if (unchecked.length) parts.push(`${unchecked.length} ${plural(unchecked.length, "answer hasn't", "answers haven't")} been checked.`);
      if (flagged) parts.push(`${flagged} ${plural(flagged, 'answer is', 'answers are')} flagged, so consider sending it back instead.`);
      const ok = await confirm({ title: 'Mark reviewed with answers still open?', content: parts.join(' '), okText: 'Mark reviewed anyway' });
      if (!ok) return;
    }
    await markReviewed(ref);
    toast.success(`${s.name} marked reviewed`);
    navigate('/reviews/responses');
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Review Queue', to: '/reviews' }, { label: s.name }]}
        title={`${s.name} · ${a.title}`}
        subtitle={`Submitted by ${s.contact}${x.submittedOn ? ` on ${formatDate(x.submittedOn)}` : ''} · ${x.answered}/${a.questionCount} answered · ${ASSIGNMENT_LABEL[x.status]}`}
        actions={
          <>
            <Button onClick={() => toast.notYet('Overriding a score')}>Override score</Button>
            <Link to={`/suppliers/${s.id}`}>
              <Button>Supplier profile</Button>
            </Link>
          </>
        }
      />

      <div className="split-layout">
        <div>
          <p className="form-field__hint" style={{ margin: '0 0 10px' }}>
            Showing {questions.length} disclosures. Accept, flag or request clarification on each; supporting evidence is shown alongside the disclosure it substantiates.
          </p>
          {questions.map((q) => (
            <AnswerCard key={q.code} data={data} a={a} s={s} q={q} decision={decisionOf(q)} />
          ))}

          <div className="review-bar">
            <span>
              <b>{accepted}</b> accepted · <b>{flagged}</b> flagged · <b>{waiting}</b> question{waiting === 1 ? '' : 's'} awaiting you ·{' '}
              <b>{questions.length - accepted - flagged}</b> to check
            </span>
            <span className="review-bar__actions">
              {unchecked.length > 0 && (
                <Button variant="ghost" onClick={acceptRemaining}>
                  Accept {unchecked.length} remaining
                </Button>
              )}
              <Button onClick={doSendBack}>Return for Revision</Button>
              <Button variant="primary" disabled={x.status === 'reviewed'} onClick={doMarkReviewed}>
                {x.status === 'reviewed' ? 'Review Completed' : 'Complete Review'}
              </Button>
            </span>
          </div>
        </div>

        <div className="stack">
          <Scorecard data={data} a={a} s={s} />
          <Card title="Audit Trail">
            <div style={{ marginTop: 10 }}>
              <Timeline
                items={[
                  ...(x.status === 'reviewed' ? [{ title: 'Review completed', meta: 'Review team' }] : []),
                  ...(x.status === 'reopened' ? [{ title: 'Returned for revision', meta: 'Review team' }] : []),
                  ...(x.submittedOn ? [{ title: 'Submitted', meta: `${s.contact} · ${formatDate(x.submittedOn)}` }] : []),
                  { title: 'Invited', meta: `Due ${formatDate(x.dueDate)}` },
                  { title: 'Enrolled in assessment', meta: formatDate(a.startedOn) },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ---------------- One answer ---------------- */

function AnswerCard({ data, a, s, q, decision }: { data: PortalData; a: Assessment; s: Supplier; q: Question; decision: 'accepted' | 'flagged' | null }) {
  const { toggleReviewDecision, sendMessage, setEvidenceStatus } = usePortalActions();
  const toast = useToast();
  const confirm = useConfirm();
  const thread = threadFor(data, a.id, s.id, q.code);
  const [open, setOpen] = useState(!!thread);
  const [draft, setDraft] = useState('');
  const ev = data.evidence.find((e) => e.supplierId === s.id && e.assessmentId === a.id && e.questionCode === q.code);
  const flag = data.flags.find((f) => f.supplierId === s.id && f.assessmentId === a.id && f.questionCode === q.code);

  const send = async () => {
    if (!draft.trim()) return;
    await sendMessage(a.id, s.id, q.code, draft);
    setDraft('');
    toast.success('Clarification request recorded');
  };

  return (
    <section className={`answer${decision ? ` answer--${decision}` : ''}`} id={`q-${q.code}`} aria-label={q.text}>
      <div className="answer__meta">
        <CodeTag code={q.code} />
        <span>
          {q.section}
          {q.areaIndex != null ? ` · ${AREAS[q.areaIndex]}` : ''}
        </span>
        {q.redFlag && <Pill tone="error">Critical compliance question</Pill>}
        {decision && (
          <span style={{ marginLeft: 'auto' }}>
            <Pill tone={decision === 'accepted' ? 'success' : 'error'}>{decision === 'accepted' ? '✓ Accepted' : '⚑ Flagged'}</Pill>
          </span>
        )}
      </div>
      <div className="answer__question">{q.text}</div>
      <div className="answer__value">
        {sampleAnswer(data, s, q)}
        {flag && <div className="answer__flag">⚑ {flag.text}</div>}
      </div>
      {q.evidenceRequired && (
        <div className="answer__evidence">
          <span className="answer__label">Evidence</span>
          {ev ? (
            <>
              <DocChip name={ev.fileName} />
              <Pill tone={ev.status === 'Pending' ? 'warning' : ev.status === 'Accepted' ? 'success' : 'error'}>
                {ev.status === 'Pending' ? 'To verify' : ev.status}
              </Pill>
              {ev.status === 'Pending' && (
                <span className="answer__evidence-actions">
                  <Button size="sm" variant="accept" onClick={() => setEvidenceStatus(ev.id, 'Accepted').then(() => toast.success('Document accepted'))}>
                    Accept document
                  </Button>
                  <Button
                    size="sm"
                    variant="reject"
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Reject ${ev.fileName}?`,
                        content: `${s.name} will need to upload a new document for this answer.`,
                        okText: 'Reject document',
                        danger: true,
                      });
                      if (ok) await setEvidenceStatus(ev.id, 'Rejected').then(() => toast.success('Document rejected'));
                    }}
                  >
                    Reject document
                  </Button>
                </span>
              )}
            </>
          ) : flag ? (
            <Pill tone="error">Document missing</Pill>
          ) : (
            <span className="answer__note">Verified in a previous review cycle</span>
          )}
        </div>
      )}
      <div className="answer__actions">
        <span className="answer__label">Reviewer decision</span>
        <Button size="sm" variant="accept" aria-pressed={decision === 'accepted'} onClick={() => toggleReviewDecision(a.id, s.id, q.code, 'accepted')}>
          {decision === 'accepted' ? '✓ Answer accepted' : 'Accept disclosure'}
        </Button>
        <Button size="sm" variant="reject" aria-pressed={decision === 'flagged'} onClick={() => toggleReviewDecision(a.id, s.id, q.code, 'flagged')}>
          {decision === 'flagged' ? '⚑ Flagged' : 'Flag disclosure'}
        </Button>
        <Button size="sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          Request clarification{thread ? ` (${thread.messages.length})` : ''}
        </Button>
      </div>
      {open && (
        <div className="answer__thread">
          {thread && <MessageList messages={thread.messages} />}
          <div className="answer__compose">
            <Input
              placeholder={`Clarification request to ${s.contact}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onPressEnter={send}
              aria-label="Message to supplier"
              autoFocus={!thread}
            />
            <Button size="sm" variant="primary" disabled={!draft.trim()} onClick={send}>
              Send
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Scorecard ---------------- */

function Scorecard({ data, a, s }: { data: PortalData; a: Assessment; s: Supplier }) {
  const annual = a.type === 'Annual ESG';
  return (
    <Card title="ESG Scorecard" question="ESG performance score = average of impact-area scores">
      <div className="scorecard">
        <div>
          <small>Score</small>
          <b className="scorecard__big">{annual && s.score != null ? s.score : '—'}</b>
          {annual ? <MaturityPill score={s.score} /> : <small className="muted">Onboarding is not maturity-scored</small>}
        </div>
        <div>
          <small>Risk</small>
          <div style={{ marginTop: 6 }}>
            <RiskBadge level={riskOf(data, s)} />
          </div>
        </div>
        <div>
          <small>Compliance</small>
          <b>{s.compliance != null ? `${s.compliance}%` : '—'}</b>
        </div>
        <div>
          <small>Data confidence</small>
          <b>{s.confidence != null ? `${s.confidence}%` : '—'}</b>
        </div>
      </div>
      {annual && s.areaScores && (
        <HBarChart
          width={300}
          labelWidth={70}
          max={100}
          ariaLabel="Area scores"
          rows={s.areaScores.map((v, i) => ({ label: AREA_SHORT[i], value: v ?? 0, valueLabel: v ?? 'n/a', color: v == null ? C.inactive : C.series1, tip: `${AREAS[i]}: ${v ?? 'not scored'}` }))}
        />
      )}
    </Card>
  );
}
