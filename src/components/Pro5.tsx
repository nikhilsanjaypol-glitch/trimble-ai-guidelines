import { useLayoutEffect, useRef, useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 5 — PROVIDE CONTEXT AND CITATIONS
 *
 * To ensure traceability & integrity.
 *
 * The source document sits in the background as the relevant
 * context. Three passages are highlighted in distinct colors —
 * pink (Site conditions), green (Weather), blue (Materials) —
 * and clicking any one updates the foreground Cited-Insight card
 * to show the AI's paraphrased claim alongside the verbatim source
 * quote.
 *
 * The card's accent (sparkle icon, blockquote border, attribution
 * chip, "Open" link) re-tints to match the active highlight, so
 * the visual link between the AI's claim and its source is always
 * obvious at a glance.
 * ───────────────────────────────────────────────────────────────── */

type CColor = 'pink' | 'green' | 'blue';

interface ColorSet {
  idle: string;
  hover: string;
  active: string;
  border: string;
  surface: string;
  accent: string;
}

const COLORS: Record<CColor, ColorSet> = {
  pink: {
    idle: '#FFD8E5',
    hover: '#FFC2D6',
    active: '#FFA8C7',
    border: '#D14C84',
    surface: '#FCE5EE',
    accent: '#C13577',
  },
  green: {
    idle: '#DAF1C2',
    hover: '#C5E89F',
    active: '#B0E281',
    border: '#65AB35',
    surface: '#E8F5DA',
    accent: '#508A28',
  },
  blue: {
    idle: '#D5E4FA',
    hover: '#BED1F4',
    active: '#A8C3F0',
    border: '#4079C9',
    surface: '#E4EEFA',
    accent: '#3068B0',
  },
};

interface Citation {
  id: number;
  color: CColor;
  claim: string;
  quote: string;
  description: string;
}

const CITATIONS: Citation[] = [
  {
    id: 1,
    color: 'pink',
    claim: 'Geotechnical re-test required before pour authorization.',
    quote: '89% Proctor density — below ACI 318 minimum.',
    description:
      'Re-test must clear the 95% minimum before the pour permit can be raised.',
  },
  {
    id: 2,
    color: 'green',
    claim: 'Placement on hold — subgrade past safe-pour threshold.',
    quote: '47 mm rainfall — exceeds 25 mm placement threshold.',
    description:
      'Subgrade must dry below the 25 mm threshold before placement can resume.',
  },
  {
    id: 3,
    color: 'blue',
    claim: 'Rebar delay pushes pour to May 25 —\na 4-day slip.',
    quote: '22 mm rebar shipment rescheduled May 20 → May 24.',
    description:
      'Reschedule the pour crew and update next week’s look-ahead plan.',
  },
];

/* ── Citable highlight in the source document ──────────────────── */
function Hl({
  color,
  active,
  onClick,
  registerRef,
  children,
}: {
  color: CColor;
  active: boolean;
  onClick: () => void;
  registerRef?: (el: HTMLSpanElement | null) => void;
  children: React.ReactNode;
}) {
  const c = COLORS[color];
  return (
    <span
      ref={registerRef}
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
        backgroundColor: active ? c.active : c.idle,
        padding: '1px 3px',
        margin: '0 -3px',
        borderRadius: '2px',
        cursor: 'pointer',
        outline: 'none',
        transition:
          'background-color 150ms ease, box-shadow 150ms ease',
        boxShadow: active ? `inset 0 -2px 0 0 ${c.border}` : 'none',
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = c.hover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = c.idle;
      }}
      onFocus={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = c.hover;
      }}
      onBlur={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = c.idle;
      }}
    >
      {children}
    </span>
  );
}

/* ── Numbered + underlined section heading inside the report ───── */
function Section({
  number,
  label,
  children,
}: {
  number: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--modus-wc-color-base-content, #171c1e)',
          marginBottom: '6px',
          paddingBottom: '4px',
          borderBottom:
            '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
        }}
      >
        <span
          style={{
            color:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            fontWeight: 700,
          }}
        >
          {number}.
        </span>
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
  const accent = COLORS[citation.color];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const [cardTop, setCardTop] = useState<number>(120);

  /* Position the card so its top aligns with the active highlight.
     useLayoutEffect runs before the browser paints, so the card lands
     at the correct top on first render (no flash). */
  useLayoutEffect(() => {
    const hlEl = hlRefs.current[selected];
    const containerEl = containerRef.current;
    if (!hlEl || !containerEl) return;
    const hlRect = hlEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    setCardTop(Math.max(20, hlRect.top - containerRect.top - 10));
  }, [selected]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: '900px', height: '720px' }}
    >
      {/* Source document — formal field-report form */}
      <div
        className="absolute bg-white flex flex-col"
        style={{
          top: '20px',
          left: '0',
          width: '520px',
          height: '680px',
          boxShadow: '0px 8px 24px 0px rgba(0,0,0,0.10)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Letterhead */}
        <div
          style={{
            padding: '18px 32px',
            backgroundColor:
              'var(--modus-wc-color-base-100, #f5f7f9)',
            borderBottom:
              '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily:
                  'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '18px',
              }}
            >
              Trimble Construction Co.
            </div>
            <div
              style={{
                fontFamily:
                  'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:
                  'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                marginTop: '4px',
                lineHeight: '14px',
              }}
            >
              Daily Field Report · Form FR-04 · Rev. 3
            </div>
          </div>
          <div
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '12px',
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              textAlign: 'right',
              lineHeight: '15px',
            }}
          >
            No. 2026-0184
          </div>
        </div>

        {/* Report metadata — 2-column label/value grid */}
        <div
          style={{
            padding: '16px 32px',
            borderBottom:
              '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            display: 'grid',
            gridTemplateColumns: '96px 1fr',
            rowGap: '6px',
            columnGap: '16px',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '13.5px',
            lineHeight: '18px',
          }}
        >
          {[
            ['Project', 'Cedar Hills Phase 2'],
            ['Block', 'C'],
            ['Date', 'May 18, 2026 · 14:30 PT'],
            ['Inspector', 'J. Park, Site Supervisor'],
          ].map(([k, v]) => (
            <span key={k} style={{ display: 'contents' }}>
              <span
                style={{
                  fontFamily:
                    'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  alignSelf: 'baseline',
                }}
              >
                {k}
              </span>
              <span
                style={{
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                }}
              >
                {v}
              </span>
            </span>
          ))}
        </div>

        {/* Document body — numbered sections */}
        <div
          style={{
            flex: 1,
            padding: '20px 32px',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '14px',
            lineHeight: '22px',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            overflow: 'hidden',
          }}
        >
          <Section number={1} label="Site conditions">
            Subgrade preparation continued on grid lines C2–C4 through
            the morning shift.{' '}
            <Hl
              color="pink"
              active={selected === 1}
              onClick={() => setSelected(1)}
              registerRef={(el) => {
                hlRefs.current[1] = el;
              }}
            >
              Compaction test on grid lines C2–C4 returned 89% Proctor
              density — below ACI 318 minimum. Pour permit withheld
              pending re-test.
            </Hl>
          </Section>

          <Section number={2} label="Weather">
            Heavy precipitation overnight and into early afternoon.{' '}
            <Hl
              color="green"
              active={selected === 2}
              onClick={() => setSelected(2)}
              registerRef={(el) => {
                hlRefs.current[2] = el;
              }}
            >
              47 mm of rainfall recorded over the past 36 hours.
              Subgrade saturation exceeds the 25 mm method-statement
              threshold for safe concrete placement.
            </Hl>
          </Section>

          <Section number={3} label="Materials">
            <Hl
              color="blue"
              active={selected === 3}
              onClick={() => setSelected(3)}
              registerRef={(el) => {
                hlRefs.current[3] = el;
              }}
            >
              Acme Steel Supply notified that the 22 mm rebar shipment
              is rescheduled from May 20 to May 24 due to port-side
              congestion at Oakland.
            </Hl>{' '}
            Inventory of 16 mm bar sufficient for tomorrow’s stirrup
            fabrication.
          </Section>

          <Section number={4} label="Manpower">
            Crew of 8 on site through 16:00. Concrete crew released
            early pending pour permit.
          </Section>
        </div>

        {/* Footer — signature line + page count */}
        <div
          style={{
            padding: '14px 32px',
            backgroundColor:
              'var(--modus-wc-color-base-100, #f5f7f9)',
            borderTop:
              '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily:
              'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
            fontSize: '10.5px',
            color:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Signed
            </span>
            <span
              style={{
                minWidth: '160px',
                borderBottom:
                  '1px solid var(--modus-wc-color-base-content, #171c1e)',
                paddingBottom: '2px',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '14px',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '16px',
              }}
            >
              J. Park
            </span>
          </span>
          <span
            style={{
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Page 1 of 1
          </span>
        </div>
      </div>

      {/* Cited Insight card — foreground, slides to align with the
          active highlight on the left */}
      <div
        className="absolute bg-white rounded-xl flex flex-col"
        style={{
          top: `${cardTop}px`,
          right: '0',
          width: '340px',
          padding: '20px 20px 20px 24px',
          gap: '14px',
          boxShadow: '0px 10px 28px 0px rgba(0,0,0,0.18)',
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderRight: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderBottom:
            '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderLeft: `4px solid ${accent.border}`,
          transition:
            'top 320ms cubic-bezier(0.4, 0, 0.2, 1), border-left-color 180ms ease',
        }}
      >
        {/* Header tag + citation counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: '6px' }}>
            <ModusWcIcon
              name="sparkle"
              size="xs"
              decorative
              style={{
                color: accent.accent,
                transition: 'color 180ms ease',
              }}
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
            whiteSpace: 'pre-line',
          }}
        >
          {citation.claim}
        </p>

        {/* Short descriptive follow-up */}
        <p
          style={{
            margin: 0,
            fontSize: 'var(--modus-wc-font-size-sm, 13px)',
            lineHeight: '18px',
            color:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          {citation.description}
        </p>
      </div>
    </div>
  );
}
