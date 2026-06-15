import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 5 — PROVIDE CONTEXT AND CITATIONS
 *
 * To ensure traceability & integrity.
 *
 * Two-column layout:
 *
 *   LEFT — a stack of readable AI Insight cards (one per citation).
 *          The active card is elevated and expands to show its
 *          short follow-up description. Each card has the colored
 *          left stripe matching its source passage.
 *
 *   RIGHT — the full source document (Daily Field Report). Clicking
 *           an insight card on the left dynamically:
 *             • emphasizes the cited passage in the document
 *             • smooth-scrolls the document body so the cited
 *               passage is centered in view
 *
 * The professional reads the AI's summary on the left and traces
 * any claim back to the exact words in the source on the right —
 * the citation is one click away.
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

/* ── Citable highlight inside the source document ──────────────── */
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
          'background-color 180ms ease, box-shadow 180ms ease',
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

/* ── Stacked AI Insight card (left column item) ────────────────── */
function InsightCard({
  citation,
  active,
  index,
  total,
  onClick,
  registerRef,
}: {
  citation: Citation;
  active: boolean;
  index: number;
  total: number;
  onClick: () => void;
  registerRef?: (el: HTMLButtonElement | null) => void;
}) {
  const c = COLORS[citation.color];
  return (
    <button
      ref={registerRef}
      type="button"
      onClick={onClick}
      className="flex flex-col text-left"
      style={{
        width: '100%',
        padding: '16px 18px',
        gap: '10px',
        backgroundColor: '#ffffff',
        borderTop:
          '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        borderRight:
          '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        borderBottom:
          '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        borderLeft: `4px solid ${c.border}`,
        borderRadius: '8px',
        boxShadow: active
          ? '0 8px 22px rgba(0,0,0,0.14)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        transition: 'box-shadow 180ms ease, transform 180ms ease',
        transform: active ? 'translateX(0)' : 'translateX(0)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.boxShadow =
            '0 3px 10px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.boxShadow =
            '0 1px 3px rgba(0,0,0,0.05)';
        }
      }}
    >
      {/* Header: sparkle + label + counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{ gap: '6px' }}>
          <ModusWcIcon
            name="sparkle"
            size="xs"
            decorative
            style={{ color: c.accent }}
          />
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
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
          {index} of {total}
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

      {/* Short descriptive follow-up — only on the active card */}
      {active && (
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
      )}
    </button>
  );
}

/* ── Pro 5 — Insights column drives the source document on the right */
export default function Pro5() {
  const [selected, setSelected] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const hlRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const docBodyRef = useRef<HTMLDivElement | null>(null);

  /* Smooth-scroll the source-doc body so the active citation is
     centered in view. Runs after each selection change. */
  useEffect(() => {
    const hlEl = hlRefs.current[selected];
    const scrollEl = docBodyRef.current;
    if (!hlEl || !scrollEl) return;
    const hlRect = hlEl.getBoundingClientRect();
    const scrollRect = scrollEl.getBoundingClientRect();
    const targetTop =
      scrollEl.scrollTop +
      (hlRect.top - scrollRect.top) -
      scrollRect.height / 2 +
      hlRect.height / 2;
    scrollEl.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, [selected]);

  /* Geometry of the connector line that runs from the active
     insight card on the left to the cited passage on the right.
     Recomputed whenever the selection changes or the source doc
     body scrolls (so the line stays attached during smooth scroll). */
  const [line, setLine] = useState<{
    path: string;
    endX: number;
    endY: number;
    color: string;
  } | null>(null);

  const activeCitation =
    CITATIONS.find((c) => c.id === selected) ?? CITATIONS[0];

  useLayoutEffect(() => {
    const computeLine = () => {
      const container = containerRef.current;
      const card = cardRefs.current[selected];
      const hl = hlRefs.current[selected];
      const docBody = docBodyRef.current;
      if (!container || !card || !hl || !docBody) {
        setLine(null);
        return;
      }
      const cr = container.getBoundingClientRect();
      const cardR = card.getBoundingClientRect();
      const hlR = hl.getBoundingClientRect();
      const docR = docBody.getBoundingClientRect();

      const x1 = cardR.right - cr.left;
      const y1 = cardR.top + cardR.height / 2 - cr.top;

      // Clamp the right-side endpoint vertically to the visible
      // portion of the scrollable document body — keeps the line
      // visually pinned to the body even while smooth-scrolling.
      const rawY2 = hlR.top + hlR.height / 2 - cr.top;
      const docTop = docR.top - cr.top + 4;
      const docBottom = docR.bottom - cr.top - 4;
      const y2 = Math.max(docTop, Math.min(docBottom, rawY2));
      const x2 = hlR.left - cr.left;

      const dx = Math.max(40, x2 - x1);
      const cx1 = x1 + dx * 0.55;
      const cx2 = x2 - dx * 0.55;

      setLine({
        path: `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`,
        endX: x2,
        endY: y2,
        color: COLORS[activeCitation.color].border,
      });
    };

    computeLine();

    const docBody = docBodyRef.current;
    if (docBody) {
      docBody.addEventListener('scroll', computeLine, { passive: true });
    }
    window.addEventListener('resize', computeLine);
    return () => {
      if (docBody) docBody.removeEventListener('scroll', computeLine);
      window.removeEventListener('resize', computeLine);
    };
  }, [selected, activeCitation.color]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: '900px', height: '720px' }}
    >
      {/* LEFT — AI Insights column */}
      <div
        className="absolute flex flex-col justify-center"
        style={{
          top: '20px',
          left: '0',
          width: '340px',
          height: '680px',
          gap: '16px',
        }}
      >
        {CITATIONS.map((c, i) => (
          <InsightCard
            key={c.id}
            citation={c}
            active={selected === c.id}
            index={i + 1}
            total={CITATIONS.length}
            onClick={() => setSelected(c.id)}
            registerRef={(el) => {
              cardRefs.current[c.id] = el;
            }}
          />
        ))}
      </div>

      {/* RIGHT — Source document (Daily Field Report) */}
      <div
        className="absolute bg-white flex flex-col"
        style={{
          top: '20px',
          right: '0',
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

        {/* Document body — scrollable; numbered sections */}
        <div
          ref={docBodyRef}
          style={{
            flex: 1,
            padding: '20px 32px',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '14px',
            lineHeight: '22px',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            overflowY: 'auto',
            scrollBehavior: 'smooth',
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
            early pending pour permit. Two laborers reassigned to
            formwork prep on Block D.
          </Section>

          <Section number={5} label="Equipment">
            Crane CK-12 cleared morning inspection. Concrete pump
            P-04 on standby pending pour permit. Compactor unit
            scheduled for re-test run on May 19 at 07:30.
          </Section>

          <Section number={6} label="Safety">
            No incidents reported. PPE compliance verified at the
            09:00 toolbox talk. Wet-weather walkway boards staged at
            access points B and D.
          </Section>

          <Section number={7} label="Notes">
            Coordinate with civil for storm-drain inlet relocation on
            grid line C5 before the next pour cycle. QC review of
            forms 14–17 scheduled for May 19 at 08:00.
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

      {/* Connector line — runs from the active insight card on the
          left to the cited passage on the right. Sits above both
          columns and ignores pointer events so it never blocks
          clicks. Re-routes on selection change and on doc scroll. */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 10,
        }}
        aria-hidden
      >
        {line && (
          <g style={{ transition: 'opacity 180ms ease' }}>
            <path
              d={line.path}
              stroke={line.color}
              strokeWidth={1.75}
              fill="none"
              strokeLinecap="round"
              opacity={0.9}
            />
            <circle
              cx={line.endX}
              cy={line.endY}
              r={3.5}
              fill={line.color}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
