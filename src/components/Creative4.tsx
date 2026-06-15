import { useMemo, useState } from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
} from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Guideline: PRESENT RELEVANT INFORMATION
 *   AI tools should present & communicate options that are optimised
 *   for different criteria, so the professional can make effective
 *   trade-offs based on their priorities.
 *
 * Component layers (top → bottom):
 *   1. Three plan thumbnails, one above each option column. The
 *      selected thumb is larger, accent-bordered and visually dips
 *      into the top of the table. Options are never reordered — the
 *      selection simply highlights option 1 / 2 / 3 in place.
 *   2. Unified comparison matrix (one rounded table, not 5 cards):
 *        – 5 columns: Criterion · Option 1 · Option 2 · Option 3 · Top pick
 *        – one row per criterion; the active column gets a tinted
 *          background + accent text and is marked by a thin coloured
 *          stripe at its top; a small dot marks the row winner
 *   3. A single "Select this" CTA below the table, centred under the
 *      active column. Clicking it commits the choice.
 * ───────────────────────────────────────────────────────────────── */

/* ── Data model ─────────────────────────────────────────────────── */

type CriterionId = 'cost' | 'speed' | 'material' | 'maintenance' | 'flexibility';

interface Criterion {
  id: CriterionId;
  label: string;
}

const CRITERIA: Criterion[] = [
  { id: 'cost',         label: 'Cost' },
  { id: 'speed',        label: 'Install Speed' },
  { id: 'material',     label: 'Material Vol.' },
  { id: 'maintenance',  label: 'Maintenance' },
  { id: 'flexibility',  label: 'Flexibility' },
];

type OptionId = 'perimeter' | 'manifold' | 'branched';

interface OptionCellValue {
  display: string;
  rank: 1 | 2 | 3; // 1 = best on this criterion
}

interface Option {
  id: OptionId;
  label: string;
  caption: string;
  bestFor: CriterionId;
  bestForLabel: string;
  accent: string;
  accentSoft: string;
  values: Record<CriterionId, OptionCellValue>;
}

const OPTIONS: Option[] = [
  {
    id: 'perimeter',
    label: 'Option 1',
    caption: 'Wall perimeter loop',
    bestFor: 'cost',
    bestForLabel: 'Best for cost',
    accent: 'var(--modus-wc-color-status-warning, #b3661a)',
    accentSoft: 'var(--modus-wc-color-status-warning-light, #fff8e1)',
    values: {
      cost:        { display: '€18.4k',  rank: 1 },
      speed:       { display: '4 days',  rank: 1 },
      material:    { display: '32 m',    rank: 1 },
      maintenance: { display: 'Hard',    rank: 3 },
      flexibility: { display: 'Low',     rank: 3 },
    },
  },
  {
    id: 'manifold',
    label: 'Option 2',
    caption: 'Centralised manifold',
    bestFor: 'flexibility',
    bestForLabel: 'Best for flexibility',
    accent: 'var(--modus-wc-color-status-success, #1e7e34)',
    accentSoft: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
    values: {
      cost:        { display: '€27.9k', rank: 2 },
      speed:       { display: '9 days', rank: 3 },
      material:    { display: '58 m',   rank: 2 },
      maintenance: { display: 'Easy',   rank: 2 },
      flexibility: { display: 'High',   rank: 1 },
    },
  },
  {
    id: 'branched',
    label: 'Option 3',
    caption: 'Branched zone system',
    bestFor: 'maintenance',
    bestForLabel: 'Best for maintenance',
    accent: 'var(--modus-wc-color-primary, #0063A7)',
    accentSoft: 'var(--modus-wc-color-primary-light, #e8f4fd)',
    values: {
      cost:        { display: '€42.5k', rank: 3 },
      speed:       { display: '6 days', rank: 2 },
      material:    { display: '64 m',   rank: 2 },
      maintenance: { display: 'Best',   rank: 1 },
      flexibility: { display: 'Mid',    rank: 2 },
    },
  },
];

const PIPE = {
  cold:  'var(--modus-wc-color-status-info, #004f83)',
  hot:   'var(--modus-wc-color-status-warning, #b3661a)',
  drain: 'var(--modus-wc-color-status-success, #1e7e34)',
};

/* ── Schematic plumbing-plan SVG ────────────────────────────────── */

function PlanSVG({ option }: { option: Option }) {
  const wall    = 'var(--modus-wc-color-base-200, #e0e1e9)';
  const stage   = 'var(--modus-wc-color-base-100, #f7f8fa)';
  const fixture = 'var(--modus-wc-color-base-page, #ffffff)';
  const label   = 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)';

  return (
    <svg
      viewBox="0 0 200 140"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="196" height="136" fill={stage} stroke={wall} strokeWidth="1" rx="1" />

      <g>
        <rect x="18" y="14" width="26" height="18" fill={fixture} stroke={wall} strokeWidth="0.8" />
        <circle cx="31" cy="23" r="2.6" fill="none" stroke={label} strokeWidth="0.8" />
        <rect x="86" y="14" width="26" height="18" fill={fixture} stroke={wall} strokeWidth="0.8" />
        <circle cx="99" cy="23" r="2.6" fill="none" stroke={label} strokeWidth="0.8" />
        <rect x="156" y="14" width="26" height="18" fill={fixture} stroke={wall} strokeWidth="0.8" />
        <text x="169" y="26" fontSize="7" textAnchor="middle" fill={label} fontWeight="600">DW</text>
        <rect x="60" y="74" width="80" height="22" fill={fixture} stroke={wall} strokeWidth="0.8" />
        <text x="100" y="89" fontSize="7" textAnchor="middle" fill={label} fontWeight="600">PREP</text>
        {[20, 100, 180].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="120" r="3" fill="none" stroke={PIPE.drain} strokeWidth="0.7" />
            <line x1={cx - 3} y1="120" x2={cx + 3} y2="120" stroke={PIPE.drain} strokeWidth="0.5" />
            <line x1={cx} y1="117" x2={cx} y2="123" stroke={PIPE.drain} strokeWidth="0.5" />
          </g>
        ))}
      </g>

      {option.id === 'perimeter' && (
        <g>
          <line x1="6" y1="6"  x2="194" y2="6"  stroke={PIPE.cold} strokeWidth="1.2" />
          <line x1="6" y1="9"  x2="194" y2="9"  stroke={PIPE.hot}  strokeWidth="1.2" />
          {[31, 99, 169].map((x) => (
            <g key={`s-${x}`}>
              <line x1={x}     y1="6" x2={x}     y2="14" stroke={PIPE.cold} strokeWidth="0.9" />
              <line x1={x + 3} y1="9" x2={x + 3} y2="14" stroke={PIPE.hot}  strokeWidth="0.9" />
            </g>
          ))}
          <line x1="6" y1="134" x2="194" y2="134" stroke={PIPE.drain} strokeWidth="1.3" />
          {[20, 100, 180].map((x) => (
            <line key={`d-${x}`} x1={x} y1="120" x2={x} y2="134" stroke={PIPE.drain} strokeWidth="0.9" />
          ))}
          <polyline points="100,96 100,108 150,108 150,134" fill="none" stroke={PIPE.drain} strokeWidth="0.9" strokeDasharray="2 1.5" />
        </g>
      )}

      {option.id === 'manifold' && (
        <g>
          <rect x="92" y="54" width="16" height="14" fill={option.accentSoft} stroke={option.accent} strokeWidth="1" />
          <text x="100" y="64" fontSize="6.5" textAnchor="middle" fill={option.accent} fontWeight="700">MANI</text>
          <line x1="6" y1="60" x2="92"  y2="60" stroke={PIPE.cold} strokeWidth="1.3" />
          <line x1="6" y1="64" x2="92"  y2="64" stroke={PIPE.hot}  strokeWidth="1.3" />
          {[31, 99, 169].map((x) => (
            <g key={`r-${x}`}>
              <polyline points={`100,54 100,42 ${x},42 ${x},32`} fill="none" stroke={PIPE.cold} strokeWidth="0.9" />
              <polyline points={`104,54 104,45 ${x + 3},45 ${x + 3},32`} fill="none" stroke={PIPE.hot} strokeWidth="0.9" />
            </g>
          ))}
          <line x1="100" y1="68" x2="100" y2="74" stroke={PIPE.cold} strokeWidth="0.9" />
          <polyline points="20,120 20,110 100,110 100,134"  fill="none" stroke={PIPE.drain} strokeWidth="1" />
          <polyline points="180,120 180,110 100,110"        fill="none" stroke={PIPE.drain} strokeWidth="1" />
        </g>
      )}

      {option.id === 'branched' && (
        <g>
          <rect x="36" y="50" width="14" height="14" fill={option.accentSoft} stroke={option.accent} strokeWidth="1" />
          <text x="43" y="60" fontSize="6.5" textAnchor="middle" fill={option.accent} fontWeight="700">Z1</text>
          <rect x="150" y="50" width="14" height="14" fill={option.accentSoft} stroke={option.accent} strokeWidth="1" />
          <text x="157" y="60" fontSize="6.5" textAnchor="middle" fill={option.accent} fontWeight="700">Z2</text>

          <line x1="6" y1="108" x2="194" y2="108" stroke={PIPE.cold} strokeWidth="1.2" />
          <line x1="6" y1="112" x2="194" y2="112" stroke={PIPE.hot}  strokeWidth="1.2" />
          {[43, 157].map((x) => (
            <g key={`v-${x}`}>
              <circle cx={x}     cy="108" r="2" fill={option.accentSoft} stroke={option.accent} strokeWidth="0.7" />
              <circle cx={x + 2} cy="112" r="2" fill={option.accentSoft} stroke={option.accent} strokeWidth="0.7" />
            </g>
          ))}

          <line x1="43"  y1="106" x2="43"  y2="64" stroke={PIPE.cold} strokeWidth="0.9" />
          <line x1="45"  y1="110" x2="45"  y2="64" stroke={PIPE.hot}  strokeWidth="0.9" />
          <line x1="157" y1="106" x2="157" y2="64" stroke={PIPE.cold} strokeWidth="0.9" />
          <line x1="159" y1="110" x2="159" y2="64" stroke={PIPE.hot}  strokeWidth="0.9" />

          <polyline points="43,50 43,40 31,40 31,32" fill="none" stroke={PIPE.cold} strokeWidth="0.9" />
          <polyline points="47,50 47,42 99,42 99,32" fill="none" stroke={PIPE.cold} strokeWidth="0.9" />
          <polyline points="45,50 45,45 34,45 34,32" fill="none" stroke={PIPE.hot} strokeWidth="0.9" />
          <polyline points="49,50 49,47 102,47 102,32" fill="none" stroke={PIPE.hot} strokeWidth="0.9" />
          <polyline points="157,50 157,40 169,40 169,32" fill="none" stroke={PIPE.cold} strokeWidth="0.9" />
          <polyline points="159,50 159,42 172,42 172,32" fill="none" stroke={PIPE.hot} strokeWidth="0.9" />

          <line x1="20"  y1="120" x2="20"  y2="134" stroke={PIPE.drain} strokeWidth="0.9" />
          <line x1="100" y1="120" x2="100" y2="134" stroke={PIPE.drain} strokeWidth="0.9" />
          <line x1="180" y1="120" x2="180" y2="134" stroke={PIPE.drain} strokeWidth="0.9" />
          <line x1="6"   y1="134" x2="100" y2="134" stroke={PIPE.drain} strokeWidth="1.2" />
          <line x1="100" y1="134" x2="194" y2="134" stroke={PIPE.drain} strokeWidth="1.2" />
          <line x1="100" y1="96"  x2="100" y2="108" stroke={PIPE.cold} strokeWidth="0.9" />
        </g>
      )}
    </svg>
  );
}

/* ── Shared layout constants (carousel + matrix + CTA) ──────────── */

/* Five-column grid template used by the carousel row, the matrix and
 * the CTA row. The three option columns are equal width so the active
 * highlight can pop in place (left / middle / right) without the
 * layout reflowing. */
const LABELS_W   = 140;
const OPT_W      = 220;
const SUMMARY_W  = 140;
const HOST_W     = LABELS_W + OPT_W * 3 + SUMMARY_W;
const GRID_COLS  =
  `${LABELS_W}px ${OPT_W}px ${OPT_W}px ${OPT_W}px ${SUMMARY_W}px`;

/* Thumbnail dimensions. Inactive thumbs are smaller; the active thumb
 * grows AND translates down so its bottom edge dips into the top of
 * the table (matching the sketch). The active thumb is slightly wider
 * than its column so it visibly overflows into neighbouring columns,
 * but we keep a small clear gap to inactive thumbs. The matrix is a
 * DOM sibling of the carousel so its `overflow: hidden` does NOT clip
 * the overlap. */
const THUMB_INACTIVE_W = 190;
const THUMB_INACTIVE_H = 138;
const THUMB_ACTIVE_W   = 240;
const THUMB_ACTIVE_H   = 170;
const THUMB_OVERLAP    = 16;  // px the active thumb dips into the table

/* ── Carousel thumb ─────────────────────────────────────────────── */

function CarouselThumb({
  option,
  isActive,
  onClick,
}: {
  option: Option;
  isActive: boolean;
  onClick: () => void;
}) {
  const w = isActive ? THUMB_ACTIVE_W : THUMB_INACTIVE_W;
  const h = isActive ? THUMB_ACTIVE_H : THUMB_INACTIVE_H;

  /* Inactive thumb hover offset (a tiny -2px lift) AND the active
   * thumb's downward dip (+OVERLAP) are both applied via transform so
   * neither affects layout flow. */
  const baseTransform = isActive ? `translateY(${THUMB_OVERLAP}px)` : 'translateY(0)';

  return (
    <button
      type="button"
      onClick={isActive ? undefined : onClick}
      className="rounded-2xl flex shrink-0 overflow-hidden"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        padding: '8px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: isActive
          ? `2px solid ${option.accent}`
          : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: isActive
          ? '0 18px 36px rgba(0,0,0,0.11), 0 6px 12px rgba(0,0,0,0.05)'
          : '0 6px 14px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
        cursor: isActive ? 'default' : 'pointer',
        transform: baseTransform,
        position: 'relative',
        zIndex: isActive ? 3 : 2,
        /* Width / height animate smoothly between active (240×170)
         * and inactive (180×130). The carousel cells are locked to
         * THUMB_ACTIVE_H so the row never resizes while two thumbs
         * interpolate past each other — no jitter, just a clean
         * grow / shrink. */
        transition:
          'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease, width 0.22s ease, height 0.22s ease',
      }}
      onMouseEnter={(e) => {
        if (isActive) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (isActive) return;
        e.currentTarget.style.transform = baseTransform;
      }}
      aria-pressed={isActive}
      aria-label={`${isActive ? 'Selected — ' : 'Select '}${option.label}, ${option.caption}`}
    >
      <PlanSVG option={option} />
    </button>
  );
}

/* ── Comparison matrix cards (one labels + three option cards) ──── */

/* Fixed heights so all 4 column cards line up across the gaps. */
const HEADER_H = 64;
const ROW_H    = 52;

/* All five matrix columns share this base; the rounded corners, outer
 * border and outer shadow now live on the grid wrapper so the columns
 * read as one continuous table. */
const cardBase: React.CSSProperties = {
  backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const COL_DIVIDER = '1px solid var(--modus-wc-color-base-200, #e0e1e9)';

function computeRowWinners(): Record<CriterionId, number> {
  return CRITERIA.reduce((acc, c) => {
    let bestIdx  = 0;
    let bestRank = OPTIONS[0].values[c.id].rank;
    for (let i = 1; i < OPTIONS.length; i++) {
      if (OPTIONS[i].values[c.id].rank < bestRank) {
        bestRank = OPTIONS[i].values[c.id].rank;
        bestIdx  = i;
      }
    }
    acc[c.id] = bestIdx;
    return acc;
  }, {} as Record<CriterionId, number>);
}

function LabelsCard() {
  return (
    <div
      style={{
        ...cardBase,
        /* Whole criterion column tinted the same light grey as the
         * column headers (and the Top pick header), so the labels
         * column reads as a "header column" of the table. */
        backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
        borderTopLeftRadius: '14px',
        borderBottomLeftRadius: '14px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center"
        style={{
          height: `${HEADER_H}px`,
          padding: '0 18px',
          backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <span
          className="uppercase tracking-wide font-semibold"
          style={{
            fontSize: '11px',
            letterSpacing: '0.06em',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Criterion
        </span>
      </div>
      {/* Rows */}
      {CRITERIA.map((c, i) => (
        <div
          key={`lbl-${c.id}`}
          className="flex items-center"
          style={{
            height: `${ROW_H}px`,
            padding: '0 18px',
            borderTop:
              i > 0
                ? '1px solid var(--modus-wc-color-base-200, #e0e1e9)'
                : 'none',
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            /* Bold + full-contrast text colour so the criterion
             * labels carry the same visual weight as the Option 1/2/3
             * column headers across from them. */
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #101828)',
          }}
        >
          {c.label}
        </div>
      ))}
    </div>
  );
}

function SummaryCard({
  rowWinners,
}: {
  rowWinners: Record<CriterionId, number>;
}) {
  return (
    <div
      style={{
        ...cardBase,
        borderLeft: COL_DIVIDER,
        /* The grid (940px of fixed columns) overflows the wrapper's
         * border-box content area (938px) by 2px on the right, which
         * hides the wrapper's outer right border behind the
         * SummaryCard's background. We restore the missing line by
         * giving the SummaryCard its own 1px right border. */
        borderRight: COL_DIVIDER,
        borderTopRightRadius: '14px',
        borderBottomRightRadius: '14px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-center"
        style={{
          height: `${HEADER_H}px`,
          padding: '0 18px',
          backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <span
          className="uppercase tracking-wide font-semibold"
          style={{
            fontSize: '11px',
            letterSpacing: '0.06em',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Top pick
        </span>
      </div>

      {/* Rows — chip naming the option that wins each criterion */}
      {CRITERIA.map((c, i) => {
        const winnerIdx = rowWinners[c.id];
        const winner    = OPTIONS[winnerIdx];
        return (
          <div
            key={`sum-${c.id}`}
            className="flex items-center justify-center"
            style={{
              height: `${ROW_H}px`,
              padding: '0 10px',
              borderTop:
                i > 0
                  ? '1px solid var(--modus-wc-color-base-200, #e0e1e9)'
                  : 'none',
            }}
          >
            <span
              className="inline-flex items-center"
              style={{
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: winner.accentSoft,
                color: winner.accent,
                fontSize: 'var(--modus-wc-font-size-sm, 13px)',
                fontWeight: 600,
                border: `1px solid ${winner.accent}`,
                whiteSpace: 'nowrap',
              }}
            >
              <ModusWcIcon name="star" size="xs" decorative style={{ color: winner.accent }} />
              {winner.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OptionCard({
  option,
  optIdx,
  isActive,
  rowWinners,
}: {
  option: Option;
  optIdx: number;
  isActive: boolean;
  rowWinners: Record<CriterionId, number>;
}) {
  return (
    <div
      style={{
        ...cardBase,
        /* When inactive the column uses the thin grey divider on its
         * left; when active we drop the divider and let a spread
         * box-shadow draw an accent frame on ALL FOUR sides outside
         * the cell. Using box-shadow (instead of real `border`) means
         * the cell's content area stays the exact same size as the
         * other columns — no clipped rows — yet the column visibly
         * pops forward as one framed, lifted unit. */
        borderLeft: isActive ? 'none' : COL_DIVIDER,
        /* Active column has fully square corners — the bottom was
         * already square so the tab below could attach seamlessly,
         * and now the top is square too. */
        borderRadius: 0,
        boxShadow: isActive
          ? `0 0 0 2px ${option.accent}, 0 14px 32px rgba(0,0,0,0.16), 0 4px 10px ${option.accent}55`
          : 'none',
        position: 'relative',
        zIndex: isActive ? 5 : 1,
        /* Smooth the accent ring + lift shadow as the active column
         * changes. Box-shadow can transition between values, so the
         * frame fades in/out gracefully when the selection moves. */
        transition: 'box-shadow 0.22s ease',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{
          height: `${HEADER_H}px`,
          padding: '6px 12px',
          backgroundColor: isActive
            ? option.accentSoft
            : 'var(--modus-wc-color-base-100, #f7f8fa)',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          transition: 'background-color 0.22s ease',
        }}
      >
        <span
          className="font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-md, 16px)',
            color: isActive
              ? option.accent
              : 'var(--modus-wc-color-base-content, #101828)',
            transition: 'color 0.22s ease',
          }}
        >
          {option.label}
        </span>
        <span
          style={{
            marginTop: '2px',
            fontSize: 'var(--modus-wc-font-size-sm, 12px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          {option.caption}
        </span>
      </div>

      {/* Cells */}
      {CRITERIA.map((c, i) => {
        const isRowWinner = rowWinners[c.id] === optIdx;
        return (
          <div
            key={`cell-${option.id}-${c.id}`}
            className="relative flex items-center justify-center"
            style={{
              height: `${ROW_H}px`,
              padding: '0 12px',
              backgroundColor: isActive ? option.accentSoft : 'transparent',
              borderTop:
                i > 0
                  ? '1px solid var(--modus-wc-color-base-200, #e0e1e9)'
                  : 'none',
              transition: 'background-color 0.22s ease',
            }}
          >
            <span
              className="tabular-nums"
              style={{
                fontSize: 'var(--modus-wc-font-size-md, 15px)',
                fontWeight: isActive ? 600 : 500,
                color: isActive
                  ? option.accent
                  : 'var(--modus-wc-color-base-content, #101828)',
                transition: 'color 0.22s ease',
              }}
            >
              {option.values[c.id].display}
            </span>

            {isRowWinner && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '5px',
                  height: '5px',
                  borderRadius: '999px',
                  backgroundColor:
                    'var(--modus-wc-color-base-content-low-contrast, #9aa0a8)',
                }}
              />
            )}
          </div>
        );
      })}

    </div>
  );
}

/* ── Host component ─────────────────────────────────────────────── */

export default function Creative4() {
  // Nothing is active/selected on first open — the user has to click a
  // thumbnail to focus an option. While `activeIdx` is null, all three
  // thumbs render at the inactive size, no matrix column is framed,
  // and no popped CTA tab is shown.
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);

  const rowWinners = useMemo(() => computeRowWinners(), []);

  /* Layout — three stacked grids sharing the same GRID_COLS template
   * so the thumbnail, the matrix column and the tab below stay
   * vertically aligned for whichever option is active.
   *
   *   ┌──────────────────────────────────────────────────────────────┐
   *   │              ▢       ▢▢▢       ▢       <- carousel           │
   *   │                                                              │
   *   │   ┌labels┐ ┌opt-1┐ ┌─opt-2─┐ ┌opt-3┐ ┌summary┐ <- matrix     │
   *   │                   │       │                                  │
   *   │                   │ Select│ <- tab (active column extension) │
   *   │                   └───────┘                                  │
   *   └──────────────────────────────────────────────────────────────┘
   *
   * The active thumb dips DOWN into the table top, and the active
   * column extends DOWN below the table as a rounded tab containing
   * the CTA. Thumb + column + tab share the same accent treatment so
   * they read as one continuous, popped-out unit.
   *
   * The matrix wrapper has `overflow: visible` and the corner cells
   * (LabelsCard / SummaryCard) carry their own corner radii — that
   * lets the active column's outer shadow + the tab below it bleed
   * past the table edges without being clipped.
   */
  return (
    <div
      className="flex flex-col items-center"
      style={{ width: `${HOST_W}px` }}
    >
      {/* ── Carousel — one thumb above each option column ─────────── */}
      <div
        className="grid"
        style={{
          width: '100%',
          gridTemplateColumns: GRID_COLS,
          columnGap: 0,
          alignItems: 'end',
          /* Bigger than before — pushes all thumbs up so there's a
           * clear breathing gap between the inactive thumbs and the
           * top of the table; the active thumb (translateY = +OVERLAP)
           * still dips toward the table but no longer bites deep
           * into it. */
          paddingBottom: '14px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div />
        {OPTIONS.map((opt, idx) => (
          <div
            key={`thumb-${opt.id}`}
            className="flex justify-center items-end"
            /* Lock each thumb cell to the active-thumb height so the
             * carousel row keeps a constant height while one thumb
             * is shrinking (170 → 130) and another is growing
             * (130 → 170). Without this the row's max-height
             * recalculates every frame and the whole carousel
             * appears to shake. */
            style={{ height: `${THUMB_ACTIVE_H}px` }}
          >
            <CarouselThumb
              option={opt}
              isActive={idx === activeIdx}
              onClick={() => setActiveIdx(idx)}
            />
          </div>
        ))}
        <div />
      </div>

      {/* ── Matrix — one unified 5-column table ──────────────────── */}
      <div
        className="grid"
        style={{
          width: '100%',
          gridTemplateColumns: GRID_COLS,
          columnGap: 0,
          alignItems: 'stretch',
          borderRadius: '14px',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          /* NOTE: no `overflow: hidden` here — the active column's
           * outer shadow needs room to bleed slightly past the table
           * edges. The corner cells (LabelsCard / SummaryCard) each
           * own their two outer corner radii so the table still reads
           * as one rounded shape. */
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <LabelsCard />
        {OPTIONS.map((opt, idx) => (
          <OptionCard
            key={opt.id}
            option={opt}
            optIdx={idx}
            isActive={idx === activeIdx}
            rowWinners={rowWinners}
          />
        ))}
        <SummaryCard rowWinners={rowWinners} />
      </div>

      {/* ── Tab — the active column extends DOWN below the table as a
        * rounded tab that contains the "Select this" button. The tab
        * is pulled up to overlap the matrix's bottom border + the
        * column's bottom shadow strip, so the column and tab merge
        * into one continuous popped-out shape.
        *
        * Inactive cells render empty placeholders so the grid still
        * spans the full table width.
        */}
      <div
        className="grid"
        style={{
          width: '100%',
          gridTemplateColumns: GRID_COLS,
          columnGap: 0,
          marginTop: '-3px',
          position: 'relative',
          zIndex: 6,
          pointerEvents: 'none',
        }}
      >
        <div />
        {OPTIONS.map((opt, idx) => {
          const isActive = idx === activeIdx;
          const isChosen = chosenIdx === idx;

          /* Case 1 — active option: the popped tab with the CTA. */
          if (isActive) {
            return (
              <div
                key={`tab-${opt.id}`}
                style={{
                  pointerEvents: 'auto',
                  padding: '14px 12px 18px',
                  borderRadius: '0 0 12px 12px',
                  backgroundColor: opt.accentSoft,
                  boxShadow:
                    `0 0 0 2px ${opt.accent}, ` +
                    `0 14px 28px rgba(0,0,0,0.14), ` +
                    `0 4px 10px ${opt.accent}55`,
                  /* Explicit flex centering — `ModusWcButton` is a
                   * web component that can lay out unpredictably in
                   * a Tailwind flex parent, so we force the cell to
                   * use inline-style flex with a 100% width context
                   * and centre the button via `text-align: center`
                   * + `margin: 0 auto` as belt-and-braces. */
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                {isChosen ? (
                  /* "Action completed" state — instead of the muted
                   * grey disabled look, render a custom pill coloured
                   * with the option's own accent (orange for Option 1,
                   * green for Option 2, blue for Option 3) so the
                   * selection is communicated in-context with the
                   * highlighted column. We use a native `<button>`
                   * (with `disabled`) because `ModusWcButton`'s built-in
                   * colour palette is limited and its `disabled`
                   * styling always overrides custom backgrounds. */
                  <button
                    type="button"
                    disabled
                    style={{
                      margin: '0 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 18px',
                      minHeight: '40px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: opt.accent,
                      color: '#ffffff',
                      fontSize: 'var(--modus-wc-font-size-md, 14px)',
                      fontWeight: 600,
                      lineHeight: 1,
                      cursor: 'default',
                      boxShadow:
                        `0 1px 2px ${opt.accent}40, ` +
                        `0 4px 10px ${opt.accent}33`,
                      transition: 'background-color 0.22s ease',
                    }}
                  >
                    <ModusWcIcon
                      name="check_circle"
                      size="sm"
                      decorative
                      style={{ color: '#ffffff' }}
                    />
                    Selected
                  </button>
                ) : (
                  <ModusWcButton
                    size="md"
                    color="primary"
                    onButtonClick={() => setChosenIdx(idx)}
                    style={{ margin: '0 auto' }}
                  >
                    <span className="flex items-center gap-1.5">
                      <ModusWcIcon name="check" size="sm" decorative />
                      Select this
                    </span>
                  </ModusWcButton>
                )}
              </div>
            );
          }

          /* Case 2 — inactive but previously chosen: small "Selected"
           * pill below the column so the user can still see which
           * option they had committed to after navigating away. */
          if (isChosen) {
            return (
              <div
                key={`tab-${opt.id}`}
                className="flex justify-center items-start"
                style={{ paddingTop: '14px' }}
              >
                <span
                  className="inline-flex items-center"
                  style={{
                    gap: '4px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    backgroundColor: opt.accentSoft,
                    color: opt.accent,
                    fontSize: 'var(--modus-wc-font-size-sm, 13px)',
                    fontWeight: 600,
                    border: `1px solid ${opt.accent}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ModusWcIcon
                    name="check_circle"
                    size="xs"
                    decorative
                    style={{ color: opt.accent }}
                  />
                  Selected
                </span>
              </div>
            );
          }

          /* Case 3 — inactive, not chosen: empty placeholder. */
          return <div key={`tab-${opt.id}`} />;
        })}
        <div />
      </div>
    </div>
  );
}
