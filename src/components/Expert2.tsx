import { useEffect, useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Expert 2 — COMMUNICATE THE WORK (landscape, non-chatbot)
 *
 * To create mutual understanding.
 *
 * Communicate the work done and decisions made, alongside any key
 * rationale. This builds trust in responses, while allowing users to
 * review, learn from and accept recommendations.
 *
 * Layout
 * ------
 * 1. A landscape "Completion confidence / LOW" trigger card floats on
 *    the page background. Click → details panel opens below.
 *
 * 2. Details panel:
 *      • One-line summary of the decision.
 *      • "I reached this conclusion by analyzing the following:"
 *      • A list of category cards. Each row has a chevron button;
 *        click → the row expands to a crisp finding plus a clickable
 *        source link with a launch icon, so the user can trace back
 *        to the original material.
 *
 * No chat frame, no prompt input — the insight stands on its own.
 * ───────────────────────────────────────────────────────────────── */

const CARD_WIDTH = 540;

interface Finding {
  id: string;
  title: string;
  detail: string;
  source: { title: string };
}

const FINDINGS: Finding[] = [
  {
    id: 'resource',
    title: 'Resource Allocation',
    detail:
      '20% under target headcount. Crew Alpha is 4 below, Crew Bravo is 2 below. No replacements scheduled this sprint.',
    source: { title: 'Crew schedule · falcon-sprint-12.csv' },
  },
  {
    id: 'change',
    title: 'Pending Change Orders',
    detail:
      '7 pending owner approval. 3 block south facade sequencing. Deadline before float buffer is hit: July 2.',
    source: { title: 'Change order log · ProjectVue' },
  },
  {
    id: 'pricing',
    title: 'Supply Chain Pricing',
    detail:
      '30% above bid baseline across 4 regional suppliers. Lock-in cost: ~$420K. Waiting risks +8–12% next month.',
    source: { title: 'Supplier quotes · Q2 2026' },
  },
];

/* ── Toast (transient confirmation message) ─────────────────────── */
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: `translate(-50%, ${visible ? '-44px' : '-32px'})`,
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        background: 'var(--modus-wc-color-base-content, #171c1e)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'opacity 180ms ease, transform 180ms ease',
        zIndex: 5,
      }}
    >
      {message}
    </div>
  );
}

/* ── Finding row — collapsible category card with chevron ───────── */
function FindingRow({
  finding,
  expanded,
  onToggle,
  onOpenSource,
}: {
  finding: Finding;
  expanded: boolean;
  onToggle: () => void;
  onOpenSource: () => void;
}) {
  return (
    <div
      className="rounded-lg"
      style={{
        background: 'var(--modus-wc-color-base-100, #f1f1f6)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex items-center w-full"
        style={{
          gap: '12px',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          borderRadius: '8px',
        }}
      >
        <span
          className="flex-1 truncate"
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '22px',
          }}
        >
          {finding.title}
        </span>
        <span
          aria-hidden
          className="flex items-center justify-center shrink-0"
          style={{ width: '20px', height: '20px' }}
        >
          <ModusWcIcon
            name={expanded ? 'expand_more' : 'chevron_right'}
            size="sm"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}
          />
        </span>
      </button>
      {expanded && (
        <div
          className="flex items-start"
          style={{
            gap: '12px',
            padding: '0 14px 12px 14px',
          }}
        >
          <p
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: '13px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '20px',
              margin: 0,
              fontWeight: 400,
            }}
          >
            {finding.detail}
          </p>
          <button
            type="button"
            onClick={onOpenSource}
            aria-label={`Open ${finding.source.title}`}
            title={`Open ${finding.source.title}`}
            className="flex items-center justify-center shrink-0 transition-colors"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--modus-wc-color-primary, #0063a3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'var(--modus-wc-color-base-200, #e0e1e9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ModusWcIcon name="launch" size="sm" decorative />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Trigger card (landscape pill) ──────────────────────────────── */
function TriggerCard({
  expanded,
  onToggle,
  factorCount,
}: {
  expanded: boolean;
  onToggle: () => void;
  factorCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls="expert2-details"
      className="flex items-stretch overflow-hidden transition-shadow"
      style={{
        width: '100%',
        background: 'var(--modus-wc-color-status-danger-light, #f8d7da)',
        border: '1.5px solid var(--modus-wc-color-status-danger, #c8102e)',
        borderRadius: '16px',
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        boxShadow: '0px 2px 6px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0px 6px 14px rgba(200, 16, 46, 0.12), 0px 2px 4px rgba(0,0,0,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0px 2px 6px rgba(0,0,0,0.04)';
      }}
    >
      {/* Left content block */}
      <div
        className="flex-1 flex flex-col justify-center min-w-0"
        style={{ padding: '20px 24px', gap: '8px' }}
      >
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-lg, 18px)',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '24px',
          }}
        >
          Completion confidence
        </span>
        <span
          className="inline-flex items-center"
          style={{
            gap: '4px',
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            lineHeight: '20px',
          }}
        >
          {factorCount} risk factors
          <ModusWcIcon
            name={expanded ? 'expand_less' : 'expand_more'}
            size="sm"
            decorative
            style={{
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          />
        </span>
      </div>

      {/* Right "LOW" ribbon */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{ padding: '0 22px' }}
        aria-hidden
      >
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '3px',
            color: 'var(--modus-wc-color-status-danger, #c8102e)',
            lineHeight: 1,
          }}
        >
          LOW
        </span>
      </div>
    </button>
  );
}

/* ── Expert 2 — Communicate the Work ────────────────────────────── */
export default function Expert2() {
  const [expanded, setExpanded] = useState(true);
  const [openFindings, setOpenFindings] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setRevealed(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  }

  function toggleFinding(id: string) {
    setOpenFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div
      className="flex flex-col relative"
      style={{
        width: CARD_WIDTH,
        gap: '12px',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 320ms ease, transform 320ms ease',
      }}
    >
      <Toast message={toast ?? ''} visible={!!toast} />

      {/* Trigger */}
      <TriggerCard
        expanded={expanded}
        onToggle={() => setExpanded((p) => !p)}
        factorCount={FINDINGS.length}
      />

      {/* Details panel */}
      {expanded && (
        <div
          id="expert2-details"
          className="bg-white rounded-2xl flex flex-col"
          style={{
            padding: '20px 24px',
            gap: '16px',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            boxShadow: '0px 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          {/* Summary — the headline answer (largest, most prominent) */}
          <p
            style={{
              fontSize: 'var(--modus-wc-font-size-md, 16px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '24px',
              margin: 0,
              fontWeight: 400,
            }}
          >
            <strong style={{ fontWeight: 700 }}>Project Falcon</strong>
            {' '}is at risk of missing handover on{' '}
            <strong style={{ fontWeight: 700 }}>Aug 14, 2026</strong>.
          </p>

          {/* Section label — subtle structural cue */}
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '20px',
              marginTop: '-4px',
            }}
          >
            I reached this conclusion by analyzing the following:
          </span>

          {/* Collapsible category cards */}
          <div className="flex flex-col" style={{ gap: '8px' }}>
            {FINDINGS.map((f) => (
              <FindingRow
                key={f.id}
                finding={f}
                expanded={!!openFindings[f.id]}
                onToggle={() => toggleFinding(f.id)}
                onOpenSource={() => showToast(`Opening ${f.source.title}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
