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
            the morning shift. Following the overnight precipitation,
            the crew reverted to spot-grade hand-tooling instead of
            the planned roller pass to avoid further moisture intrusion
            into the lift. Standing water was vacuumed off grids C2
            and C3 between 08:15 and 09:40, after which the surface
            was scuffed and re-rolled at reduced passes to limit
            disturbance of the prepared mat.{' '}
            <Hl
              color="pink"
              active={selected === 1}
              onClick={() => setSelected(1)}
              registerRef={(el) => {
                hlRefs.current[1] = el;
              }}
            >
              Compaction test on grid lines C2–C4 returned 89% Proctor
              density — below the ACI 318 minimum of 95%. Pour permit
              was withheld pending re-test, now scheduled for May 19
              at 07:30.
            </Hl>{' '}
            The independent geotech (GTS Engineering) was on site to
            witness the re-test setup and confirmed sample locations
            against the approved test plan. Block D form-stripping
            completed on schedule with no defects flagged at
            strip-back; tie holes were filled, surface honeycombs
            (none observed) logged as clean, and curing compound was
            re-applied on the south wall face per the cold-joint plan.
          </Section>

          <Section number={2} label="Schedule status">
            Overall progress on Block C remains 1.5 days behind the
            baseline schedule following last week’s rebar tie-off
            slippage. The pour-permit hold described in §1 will
            compound this if it is not cleared by end-of-day May 19.
            The CPM model has been updated to reflect the contingent
            re-test and the rebar shipment slip (see §7), with a
            revised forecast slip of four working days against
            contract milestone M-14 (slab-on-grade complete).
            Float on the curtain-wall mock-up path has eroded to two
            days; mitigation options under review include a Saturday
            shift on May 24 and accelerating the Block D back-fill.
            Coordination meeting with trade partners is set for May
            20 at 08:00 to re-baseline the two-week look-ahead, and a
            formal Schedule Update Notice will be issued by EOD May 19.
          </Section>

          <Section number={3} label="Manpower">
            Crew of 24 on site at peak through the 09:00–13:00
            window: 8 concrete, 6 carpentry, 4 ironworkers, 2
            operators, 2 laborers, and 2 foremen. Concrete placement
            crew (8) was released at 13:30 once the pour permit was
            withheld; two laborers reassigned to formwork prep on
            Block D and four to clean-up of the wet-weather access
            lanes along the north perimeter. Operator coverage
            maintained on all three cranes through the afternoon, and
            the relief operator (M. Allen) covered the 12:00 lunch
            window on CK-12. No overtime authorized today. Safety
            orientation completed for two new ironworkers (J. Ortiz,
            T. Nguyen) prior to first-tools, including site-specific
            wet-weather access training.
          </Section>

          <Section number={4} label="Weather">
            Heavy precipitation overnight and into early afternoon,
            with intermittent thunder cells passing east of the site
            between 11:20 and 12:45. Wind sustained at 12–18 mph from
            the WSW with gusts to 26 mph, which triggered a one-hour
            suspension of crane operations between 11:30 and 12:30
            per the SOP-12 wind protocol. Temperatures held between
            8°C overnight low and 14°C afternoon high — within the
            cold-weather concreting range but above the placement
            threshold.{' '}
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
            </Hl>{' '}
            Forecast for May 19 shows clearing conditions and a
            twelve-hour dry window opening at 06:00, which should
            support the morning re-test and an afternoon pour if the
            density target is met. The May 20 forecast holds at 10%
            PoP, which should support pump-truck mobilization at
            first light.
          </Section>

          <Section number={5} label="Equipment">
            Crane CK-12 cleared the morning inspection with no
            deficiencies; daily log signed by the lift director and
            filed at 07:45. Concrete pump P-04 is on standby pending
            pour permit; hose was flushed and capped per protocol and
            the operator demobilized at 14:00 with two hours of show-up
            authorized. Compactor unit serviced and scheduled for a
            re-test run on May 19 at 07:30 ahead of the Proctor re-test.
            Skid steer SS-03 returned from the dealer with the new
            hydraulic line installed and is back in rotation; the
            replacement was covered under warranty. Generator G-02 fuel
            level checked at 78% — refuel scheduled for May 20 morning
            ahead of the pour. Two welding machines flagged for monthly
            ground-fault testing on May 21.
          </Section>

          <Section number={6} label="Subcontractors">
            Acme Steel Supply and Western Mechanical both on site
            through the shift. Northland EC (electrical) demobilized
            at 14:00 once the pour was suspended; they are expected
            back on May 21 once cast-in embeds are placed. Concrete
            supplier (Pacific Mix) was notified of the pour-permit
            hold at 13:35; the standing batch order for May 19 was
            re-confirmed for 06:30 once the re-test is cleared, with
            two backup trucks scheduled to absorb any slip. Pacific
            Glazing performed a site walk for the upcoming
            curtain-wall mock-up location and identified no conflicts;
            their submittal package is expected on May 20. Stretch
            Demolition closed out their punch list and demobilized
            their site box this morning. Trade meeting minutes
            circulated to all subs by 16:30 along with the updated
            two-week look-ahead.
          </Section>

          <Section number={7} label="Materials">
            Inventory reconciled against next week’s pull-list and one
            critical-path gap was identified during the morning
            warehouse walk.{' '}
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
            Inventory of 16 mm bar is sufficient for tomorrow’s
            stirrup fabrication; 32 mm column ties are on hand through
            May 22 with a buffer of approximately three tons. Anchor
            bolt template kits 4 of 6 received and staged in the south
            laydown; remaining kits (5 and 6) tracking for May 22 per
            the supplier. Curing blankets re-ordered under PO
            #2026-04412 with ETA confirmed for May 21. Form release
            agent inventory is at 2 drums — the re-order trigger was
            reached and a requisition was submitted to procurement at
            15:00. Concrete admixture stock checked against the May 19
            batch design with no shortfalls identified.
          </Section>

          <Section number={8} label="Submittals & RFIs">
            Three RFIs remain open at end-of-day: RFI-118 (corner
            reinforcing detail at column line G/4), RFI-121 (slab edge
            detail at column line A/1), and RFI-124 (mechanical core
            penetrations, levels 2 through 4). RFI-118 was the priority
            item this week — designer response was received at 11:40
            and forwarded to the steel detailer with a target turnaround
            of 24 hours for the revised shop drawings. Two submittals
            are pending designer review: SUB-067 (post-tensioning shop
            drawings, revision 2, submitted May 14) and SUB-072 (epoxy
            anchor system data, submitted May 16). No closeout
            submittals processed today. Submittal log was reconciled
            against the procurement schedule and three long-lead items
            were flagged for owner review.
          </Section>

          <Section number={9} label="Inspections & permits">
            City inspector (M. Donovan, badge #4421) visited at 10:00
            for the scheduled rebar inspection on Block C beams 14–17
            and passed the inspection with no comments; the green tag
            is posted on the south gang-box. Special inspections
            agency (Quality First Testing) was on site through 13:30
            for the morning Proctor tests and continued through the
            afternoon for the subgrade documentation pending the
            re-test. Pour permit P-2026-0184 was placed on hold
            pending the §1 re-test; the city was notified per
            protocol. Storm-water permit weekly inspection was
            completed; one BMP repair was noted at the north
            stockpile and corrected within the four-hour window (see
            §12). Crane annual certification renewal package for
            CK-12 was submitted to the certifying body on May 17.
          </Section>

          <Section number={10} label="Safety">
            No incidents or near-misses reported during the shift.
            PPE compliance was verified at the 09:00 toolbox talk;
            wet-weather walkway boards were staged at access points B
            and D following the morning storm. Daily JHA was reviewed
            with all foremen and signed off in the field. Eye-wash
            station at the steel laydown was re-stocked. Stretch-and-
            flex was completed at 07:00 with 22 of 24 crew
            participating. A site walk by the safety lead at 13:00
            identified one trip hazard at the north gate (a loose
            plate), which was remediated by 13:30 and logged in the
            corrective-actions tracker. Weekly safety metrics remain
            green across all leading indicators.
          </Section>

          <Section number={11} label="Quality control">
            Form-strip inspection of Block D walls passed with no
            defects flagged. QC review of forms 14–17 (Block C beams)
            is scheduled for May 19 at 08:00 ahead of the re-test.
            Field cylinders from the May 16 pour reached 28-day break
            results today at 4,820 psi against a 4,500 psi spec — a
            7% margin, consistent with the rolling 90-day trend.
            Slump records and air-content logs for the past week were
            reconciled against the QC checklist; one minor variance
            (slump 5.5″ against a 5.0″ target) was flagged on the May
            14 batch and noted for trend tracking. No NCRs were
            issued this shift. Concrete supplier QA reports for the
            week were reviewed and filed in the project record.
          </Section>

          <Section number={12} label="Environmental controls">
            All silt-fence runs were inspected post-storm and found
            intact except for a 4 m section at the north stockpile,
            which was re-staked and reinforced with additional fabric
            by 12:30. The SWPPP weekly checklist was completed and
            filed in the project record. Concrete washout pit is at
            60% capacity — a pump-out is scheduled for May 19
            morning. Two diesel spill kits were re-stocked at the
            equipment yard and the south fuel cache. Air quality and
            dust monitoring readings remain within acceptable
            thresholds; no exceedance was recorded. The next
            stormwater compliance audit is scheduled for May 28.
          </Section>

          <Section number={13} label="Notes & follow-ups">
            Coordinate with civil for the storm-drain inlet relocation
            on grid line C5 before the next pour cycle. Owner
            walk-down is scheduled for May 22 at 10:00 — confirm Block
            C is presentable and that the laydown south of column
            line F is cleared. Open the May 20 progress meeting with
            the rebar-delay re-baseline (see §2, §7) and the revised
            schedule update notice. Issue a revised crane plan for
            the May 21 lift of the pre-cast stair runs. Schedule the
            post-pour acceptance walk for the Block D walls and
            confirm the punch-list lead from the GC side. Follow up
            with procurement on the form-release re-order and confirm
            the May 21 curing-blanket delivery.
          </Section>

          <Section number={14} label="Photo log">
            42 photos logged today, geo-tagged and uploaded to the
            project document control system. Key references: IMG-0142
            through IMG-0148 (subgrade pre/post compaction at C2–C4),
            IMG-0151 (Proctor test in progress with the QFT
            inspector), IMG-0163 through IMG-0168 (Block D form
            strip-back), IMG-0177 (north silt-fence repair), and
            IMG-0184 (laydown reorganization at the south yard).
            Drone overflight planned for May 19 morning, conditions
            permitting, to capture the cleaned subgrade ahead of the
            re-test and update the digital site model.
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
