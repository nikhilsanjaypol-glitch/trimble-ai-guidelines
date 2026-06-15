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
 * 1. A compact landscape trigger card floats on the page background.
 *    At a glance the user reads the metric, the count of underlying
 *    factors, and the confidence level (vertical "LOW" ribbon).
 *
 *      ┌────────────────────────────────────────────────┐
 *      │  Completion confidence                  L      │
 *      │                                         O      │
 *      │  3 risk factors ▼                       W      │
 *      └────────────────────────────────────────────────┘
 *
 * 2. Click the card → a details panel slides open underneath:
 *      • One-line summary of the decision.
 *      • "What I found" — short bullets. Each bullet has a citation
 *        marker; clicking it expands an inline source preview with
 *        the source name, freshness, snippet, and a link out, so the
 *        user can trace back to the original material.
 *      • A single recommendation with Apply / Dismiss actions.
 *
 * No chat frame, no prompt input — the insight stands on its own.
 * ───────────────────────────────────────────────────────────────── */

const CARD_WIDTH = 540;

interface Source {
  title: string;
  updated: string;
  snippet: string;
}

interface Finding {
  id: string;
  text: string;
  citation: number;
  source: Source;
}

const FINDINGS: Finding[] = [
  {
    id: 'resource',
    text: 'Crew is 20% under target headcount on Falcon.',
    citation: 1,
    source: {
      title: 'Crew schedule · falcon-sprint-12.csv',
      updated: 'Updated 2 hours ago',
      snippet:
        'Form-work crew Alpha is 4 below target; Crew Bravo is 2 below target. No replacements scheduled for the remainder of the sprint.',
    },
  },
  {
    id: 'change',
    text: '7 change orders are pending owner approval.',
    citation: 2,
    source: {
      title: 'Change order log · ProjectVue',
      updated: 'Updated 4 hours ago',
      snippet:
        '3 of 7 open change orders block sequencing on the south facade. Average owner approval cycle is 6 days.',
    },
  },
  {
    id: 'pricing',
    text: 'Concrete is 30% above the bid baseline.',
    citation: 3,
    source: {
      title: 'Supplier quotes · Q2 2026',
      updated: 'Updated yesterday',
      snippet:
        'All 4 regional suppliers are quoting between $128 and $135 per cubic yard, versus a $98 baseline.',
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

/* ── Citation marker — small superscript-style numbered badge ───── */
function CitationMarker({
  number,
  active,
  onClick,
}: {
  number: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Source ${number}`}
      aria-expanded={active}
      onClick={onClick}
      className="inline-flex items-center justify-center transition-colors align-middle"
      style={{
        width: '20px',
        height: '20px',
        marginLeft: '4px',
        borderRadius: '999px',
        border: 'none',
        background: active
          ? 'var(--modus-wc-color-primary, #0063a3)'
          : 'rgba(0, 99, 163, 0.10)',
        color: active ? '#fff' : 'var(--modus-wc-color-primary, #0063a3)',
        fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
        fontWeight: 700,
        cursor: 'pointer',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = 'rgba(0, 99, 163, 0.18)';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = 'rgba(0, 99, 163, 0.10)';
      }}
    >
      {number}
    </button>
  );
}

/* ── Source detail (inline citation expansion) ──────────────────── */
function SourceDetail({
  source,
  citation,
  onOpen,
}: {
  source: Source;
  citation: number;
  onOpen: () => void;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        gap: '6px',
        marginTop: '6px',
        marginLeft: '20px',
        padding: '10px 12px',
        background: 'var(--modus-wc-color-base-100, #f1f1f6)',
        borderRadius: '8px',
        borderLeft: '3px solid var(--modus-wc-color-primary, #0063a3)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col" style={{ gap: '2px' }}>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              fontWeight: 600,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '18px',
            }}
          >
            <span style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}>
              [{citation}]
            </span>
            {' '}
            {source.title}
          </span>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '14px',
            }}
          >
            {source.updated}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${source.title}`}
          className="flex items-center justify-center rounded-md shrink-0"
          style={{
            width: '24px',
            height: '24px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              'var(--modus-wc-color-base-200, #e0e1e9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <ModusWcIcon
            name="launch"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
          />
        </button>
      </div>
      <p
        style={{
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          color: 'var(--modus-wc-color-base-content, #171c1e)',
          lineHeight: '18px',
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        “{source.snippet}”
      </p>
    </div>
  );
}

/* ── Finding row (text + citation, with inline source expansion) ─ */
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
    <div className="flex flex-col">
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            marginTop: '10px',
            flexShrink: 0,
          }}
        />
        <span
          className="flex-1"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '22px',
          }}
        >
          {finding.text}
          <CitationMarker
            number={finding.citation}
            active={expanded}
            onClick={onToggle}
          />
        </span>
      </div>
      {expanded && (
        <SourceDetail
          source={finding.source}
          citation={finding.citation}
          onOpen={onOpenSource}
        />
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
  const [openCitations, setOpenCitations] = useState<Record<string, boolean>>({});
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

  function toggleCitation(id: string) {
    setOpenCitations((prev) => ({ ...prev, [id]: !prev[id] }));
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

          {/* What I found */}
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 700,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              What I found
            </span>
            <div className="flex flex-col" style={{ gap: '4px' }}>
              {FINDINGS.map((f) => (
                <FindingRow
                  key={f.id}
                  finding={f}
                  expanded={!!openCitations[f.id]}
                  onToggle={() => toggleCitation(f.id)}
                  onOpenSource={() => showToast(`Opening ${f.source.title}`)}
                />
              ))}
            </div>
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
