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
 *      • One-line summary of the decision (with the guideline info
 *        icon for the design pattern).
 *      • "I reached this conclusion by analyzing the following:"
 *      • A list of category cards. Each row has a chevron button;
 *        click → the row expands to a crisp finding plus a clickable
 *        source link with a launch icon, so the user can trace back
 *        to the original material.
 *      • A single recommendation with Apply / Dismiss actions.
 *
 * No chat frame, no prompt input — the insight stands on its own.
 * ───────────────────────────────────────────────────────────────── */

const CARD_WIDTH = 540;

interface Finding {
  id: string;
  title: string;
  detail: string;
  source: { title: string; updated: string };
}

const FINDINGS: Finding[] = [
  {
    id: 'resource',
    title: 'Resource Allocation',
    detail:
      'Crews are 20% under target headcount this sprint, with the largest gap on form-work crews.',
    source: {
      title: 'Crew schedule · falcon-sprint-12.csv',
      updated: 'Updated 2 hours ago',
    },
  },
  {
    id: 'change',
    title: 'Pending Change Orders',
    detail:
      '7 change orders are pending owner approval. 3 of them block sequencing on the south facade.',
    source: {
      title: 'Change order log · ProjectVue',
      updated: 'Updated 4 hours ago',
    },
  },
  {
    id: 'pricing',
    title: 'Supply Chain Pricing',
    detail:
      'Concrete is quoted 30% above the bid baseline across all four regional suppliers.',
    source: {
      title: 'Supplier quotes · Q2 2026',
      updated: 'Updated yesterday',
    },
  },
];

const RECOMMENDATION = {
  title: 'Reallocate 4 form-work crews from Site B',
  detail:
    'Site B is 8 days ahead of plan and has spare crew capacity. Moving 4 form-work crews to Falcon recovers ~5 days of schedule slack at no incremental labor cost.',
};

/* ── Guideline info popover (the "Communicate the work" guideline) */
function GuidelineInfo() {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="About this guideline"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex items-center justify-center rounded-full transition-colors"
        style={{
          width: '20px',
          height: '20px',
          padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <ModusWcIcon
          name="info"
          size="sm"
          decorative
          style={{
            color: open
              ? 'var(--modus-wc-color-primary, #0063a3)'
              : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-20 flex flex-col"
          style={{
            top: '110%',
            right: 0,
            width: '280px',
            padding: '12px 14px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              fontWeight: 600,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '20px',
            }}
          >
            Communicate the work
          </span>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              fontStyle: 'italic',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '18px',
            }}
          >
            To create mutual understanding.
          </span>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '18px',
            }}
          >
            Communicate the work done and decisions made, alongside any key
            rationale. This builds trust in responses, while allowing users to
            review, learn from and accept recommendations.
          </span>
        </span>
      )}
    </span>
  );
}

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
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            fontWeight: 500,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '20px',
          }}
        >
          {finding.title}
        </span>
        <span
          aria-hidden
          className="flex items-center justify-center shrink-0"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.08)',
            transition: 'transform 220ms ease',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <ModusWcIcon
            name="chevron_right"
            size="sm"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}
          />
        </span>
      </button>
      {expanded && (
        <div
          className="flex flex-col"
          style={{
            gap: '8px',
            padding: '0 14px 12px 14px',
          }}
        >
          <p
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '20px',
              margin: 0,
            }}
          >
            {finding.detail}
          </p>
          <button
            type="button"
            onClick={onOpenSource}
            aria-label={`Open ${finding.source.title}`}
            className="inline-flex items-center self-start"
            style={{
              gap: '6px',
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              fontWeight: 600,
              color: 'var(--modus-wc-color-primary, #0063a3)',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            <ModusWcIcon name="launch" size="xs" decorative />
            {finding.source.title}
            <span
              style={{
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                fontWeight: 400,
              }}
            >
              · {finding.source.updated}
            </span>
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
  const [recStatus, setRecStatus] = useState<'pending' | 'applied' | 'dismissed'>(
    'pending',
  );
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
          {/* Summary + guideline info icon */}
          <div className="flex items-start justify-between gap-3">
            <p
              style={{
                flex: 1,
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '22px',
                margin: 0,
              }}
            >
              <strong style={{ fontWeight: 600 }}>Project Falcon</strong>
              {' '}is at risk of missing handover on{' '}
              <strong style={{ fontWeight: 600 }}>Aug 14, 2026</strong>.
            </p>
            <GuidelineInfo />
          </div>

          {/* Section heading */}
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              fontWeight: 600,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '20px',
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

          {/* Recommendation */}
          <div
            className="flex flex-col"
            style={{
              gap: '6px',
              paddingTop: '14px',
              borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            }}
          >
            <span
              className="inline-flex items-center"
              style={{
                gap: '6px',
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 700,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              <ModusWcIcon
                name="lightbulb_on"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
              />
              Recommendation
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 600,
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '22px',
              }}
            >
              {RECOMMENDATION.title}
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                lineHeight: '18px',
              }}
            >
              {RECOMMENDATION.detail}
            </span>

            {/* Apply / Dismiss */}
            {recStatus === 'pending' ? (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRecStatus('applied');
                    showToast('Recommendation applied');
                  }}
                  className="inline-flex items-center transition-colors"
                  style={{
                    gap: '6px',
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--modus-wc-color-primary, #0063a3)',
                    color: '#fff',
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ModusWcIcon name="check" size="xs" decorative />
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecStatus('dismissed');
                    showToast('Recommendation dismissed');
                  }}
                  className="inline-flex items-center transition-colors"
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                    background: 'transparent',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'var(--modus-wc-color-base-100, #f1f1f6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span
                  className="inline-flex items-center"
                  style={{
                    gap: '6px',
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    fontWeight: 600,
                    color:
                      recStatus === 'applied'
                        ? 'var(--modus-wc-color-status-success, #1e7e34)'
                        : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  <ModusWcIcon
                    name={recStatus === 'applied' ? 'check_circle' : 'cancel_circle'}
                    size="xs"
                    decorative
                  />
                  {recStatus === 'applied' ? 'Applied' : 'Dismissed'}
                </span>
                <button
                  type="button"
                  onClick={() => setRecStatus('pending')}
                  className="cursor-pointer"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0 4px',
                    color: 'var(--modus-wc-color-primary, #0063a3)',
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Undo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
