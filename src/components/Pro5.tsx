import { useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 5 — PROVIDE CONTEXT AND CITATIONS
 *
 * To ensure traceability & integrity.
 *
 * The source document sits in the background as the relevant
 * context. Three passages are highlighted as "citable" — clicking
 * any one updates the foreground Cited-Insight card to show the
 * AI's paraphrased claim alongside the verbatim source quote.
 *
 * The interaction is the principle: the professional traces the
 * AI's "what" back to the exact words in the source — and can
 * pivot between facts by clicking a different passage.
 * ───────────────────────────────────────────────────────────────── */

const ACCENT = '#0063a3';
const ACCENT_SURFACE = '#e6f1f9';
const HL_ACTIVE = '#FFD747';
const HL_IDLE = '#FFF1A8';
const HL_HOVER = '#FFE375';

interface Citation {
  id: number;
  claim: string;
  quote: string;
}

const CITATIONS: Citation[] = [
  {
    id: 1,
    claim:
      'Block C requires a geotechnical re-test before pour authorization can be issued.',
    quote:
      'Compaction test on grid lines C2–C4 returned 89% Proctor density — below ACI 318 minimum. Pour permit withheld pending re-test.',
  },
  {
    id: 2,
    claim:
      'Concrete placement is on hold; rainfall has saturated the subgrade beyond the safe-pour threshold.',
    quote:
      '47 mm of rainfall recorded over the past 36 hours. Subgrade saturation exceeds the 25 mm method-statement threshold for safe concrete placement.',
  },
  {
    id: 3,
    claim:
      'Rebar shortage from Acme Steel pushes the Block C pour to May 25 — a 4-day slip.',
    quote:
      'Acme Steel Supply notified that the 22 mm rebar shipment is rescheduled from May 20 to May 24 due to port-side congestion at Oakland.',
  },
];

/* ── Citable highlight in the source document ──────────────────── */
function Hl({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        backgroundColor: active ? HL_ACTIVE : HL_IDLE,
        padding: '1px 3px',
        margin: '0 -3px',
        borderRadius: '2px',
        cursor: 'pointer',
        outline: 'none',
        transition: 'background-color 150ms ease, box-shadow 150ms ease',
        boxShadow: active ? `inset 0 -2px 0 0 #b58800` : 'none',
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = HL_HOVER;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = HL_IDLE;
      }}
      onFocus={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = HL_HOVER;
      }}
      onBlur={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = HL_IDLE;
      }}
    >
      {children}
    </span>
  );
}

/* ── Labeled section inside the source report ──────────────────── */
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div
        style={{
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <p style={{ margin: 0 }}>{children}</p>
    </div>
  );
}

/* ── Pro 5 — Cited insight, driven by source document ──────────── */
export default function Pro5() {
  const [selected, setSelected] = useState<number>(1);
  const citation = CITATIONS.find((c) => c.id === selected)!;

  return (
    <div className="relative" style={{ width: '700px', height: '540px' }}>
      {/* Source document — background context */}
      <div
        className="absolute bg-white rounded-xl"
        style={{
          top: '20px',
          left: '0',
          width: '380px',
          height: '500px',
          padding: '20px 24px',
          boxShadow: '0px 4px 14px 0px rgba(0,0,0,0.08)',
          border:
            '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          overflow: 'hidden',
        }}
      >
        {/* Document header */}
        <div
          style={{
            borderBottom:
              '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            paddingBottom: '12px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              marginBottom: '4px',
            }}
          >
            Daily Field Report
          </div>
          <div
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '20px',
            }}
          >
            Block C — Cedar Hills Phase 2
          </div>
          <div
            style={{
              fontSize: '11px',
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              marginTop: '4px',
              lineHeight: '14px',
            }}
          >
            May 18, 2026 · 14:30 PT · J. Park, Site Supervisor
          </div>
        </div>

        {/* Document body */}
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '12.5px',
            lineHeight: '20px',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          <Section label="Site conditions">
            Subgrade preparation continued on grid lines C2–C4 through
            the morning shift.{' '}
            <Hl
              active={selected === 1}
              onClick={() => setSelected(1)}
            >
              Compaction test on grid lines C2–C4 returned 89% Proctor
              density — below ACI 318 minimum. Pour permit withheld
              pending re-test.
            </Hl>
          </Section>

          <Section label="Weather">
            Heavy precipitation overnight and into early afternoon.{' '}
            <Hl
              active={selected === 2}
              onClick={() => setSelected(2)}
            >
              47 mm of rainfall recorded over the past 36 hours.
              Subgrade saturation exceeds the 25 mm method-statement
              threshold for safe concrete placement.
            </Hl>
          </Section>

          <Section label="Materials">
            <Hl
              active={selected === 3}
              onClick={() => setSelected(3)}
            >
              Acme Steel Supply notified that the 22 mm rebar shipment
              is rescheduled from May 20 to May 24 due to port-side
              congestion at Oakland.
            </Hl>{' '}
            Inventory of 16 mm bar sufficient for tomorrow’s stirrup
            fabrication.
          </Section>

          <Section label="Manpower">
            Crew of 8 on site through 16:00. Concrete crew released
            early pending pour permit.
          </Section>
        </div>
      </div>

      {/* Cited Insight card — foreground, overlapping right side */}
      <div
        className="absolute bg-white rounded-xl flex flex-col"
        style={{
          top: '90px',
          right: '0',
          width: '340px',
          padding: '20px',
          gap: '14px',
          boxShadow: '0px 10px 28px 0px rgba(0,0,0,0.18)',
          border:
            '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        {/* Header tag + citation counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '6px' }}>
            <ModusWcIcon
              name="sparkle"
              size="xs"
              decorative
              style={{ color: ACCENT }}
            />
            <span
              style={{
                fontSize:
                  'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color:
                  'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              AI Insight · Cited
            </span>
          </div>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              fontWeight: 600,
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            {selected} of {CITATIONS.length}
          </span>
        </div>

        {/* The AI's paraphrased claim */}
        <p
          style={{
            margin: 0,
            fontSize: 'var(--modus-wc-font-size-md, 15px)',
            fontWeight: 500,
            lineHeight: '22px',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          {citation.claim}
        </p>

        {/* Verbatim source quote */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor:
              'var(--modus-wc-color-base-100, #f5f7f9)',
            borderLeft: `3px solid ${ACCENT}`,
            borderRadius: '0 6px 6px 0',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 'var(--modus-wc-font-size-sm, 13px)',
              lineHeight: '20px',
              fontStyle: 'italic',
              color:
                'var(--modus-wc-color-base-content, #171c1e)',
            }}
          >
            “{citation.quote}”
          </p>
        </div>

        {/* Attribution row */}
        <div className="flex items-center" style={{ gap: '10px' }}>
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: ACCENT_SURFACE,
            }}
          >
            <ModusWcIcon
              name="calendar"
              size="sm"
              decorative
              style={{ color: ACCENT }}
            />
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 13px)',
                fontWeight: 600,
                lineHeight: '18px',
                color:
                  'var(--modus-wc-color-base-content, #171c1e)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Daily Field Report — Block C
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 11px)',
                lineHeight: '16px',
                color:
                  'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              May 18, 2026 · J. Park
            </span>
          </div>

          <button
            type="button"
            className="flex items-center shrink-0"
            style={{
              gap: '4px',
              background: 'none',
              border: 'none',
              padding: 0,
              color: ACCENT,
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.textDecoration = 'underline')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.textDecoration = 'none')
            }
          >
            Open
            <ModusWcIcon name="launch" size="xs" decorative />
          </button>
        </div>

        {/* Helper hint */}
        <p
          style={{
            margin: 0,
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            lineHeight: '14px',
            color:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            fontStyle: 'italic',
          }}
        >
          Click any highlighted passage in the report to trace a
          different insight.
        </p>
      </div>
    </div>
  );
}
