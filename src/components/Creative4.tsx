import { useState } from 'react';
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
 *   1. 3-thumb carousel (small / large-active / small) with chevrons,
 *      and an active caption beneath the focused thumb
 *   2. Rainbow-bordered comparison matrix
 *        – column headers per option, middle (active) highlighted green
 *        – one row per criterion, each cell tinted when its option is
 *          the active focus; small dot marks the row winner
 *        – legend strip beneath the rows
 *        – footer: context line + "Choose Option N" CTA
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
      cost:        { display: '$',        rank: 1 },
      speed:       { display: 'Fast',     rank: 1 },
      material:    { display: 'Moderate', rank: 1 },
      maintenance: { display: 'Hard',     rank: 3 },
      flexibility: { display: 'Low',      rank: 3 },
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
      cost:        { display: '$$',   rank: 2 },
      speed:       { display: 'Slow', rank: 3 },
      material:    { display: 'High', rank: 2 },
      maintenance: { display: 'Easy', rank: 2 },
      flexibility: { display: 'High', rank: 1 },
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
      cost:        { display: '$$$',      rank: 3 },
      speed:       { display: 'Moderate', rank: 2 },
      material:    { display: 'High',     rank: 2 },
      maintenance: { display: 'Best',     rank: 1 },
      flexibility: { display: 'Moderate', rank: 2 },
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

/* ── Carousel arrow ─────────────────────────────────────────────── */

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: '44px',
        height: '44px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow =
          '0 6px 14px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 4px 10px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
      }}
      aria-label={direction === 'left' ? 'Previous option' : 'Next option'}
    >
      <ModusWcIcon
        name={direction === 'left' ? 'chevron_left' : 'chevron_right'}
        size="sm"
        decorative
        style={{ color: 'var(--modus-wc-color-base-content, #364153)' }}
      />
    </button>
  );
}

/* ── Comparison matrix: 4 separated column cards ─────────────────── */

/* Fixed heights keep all 4 column cards the same total height so rows
 * line up across the gaps between cards. */
const HEADER_H        = 60;
const ROW_H           = 50;
const CTA_H           = 76;  // bottom CTA area on the 3 option cards
const BIG_THUMB_H     = 180; // active card's image preview
const SMALL_THUMB_H   = 130; // inactive cards' image preview
const THUMB_AREA_H    = BIG_THUMB_H; // total top "image" area on every option card

function CompareMatrix({
  activeIdx,
  chosenIdx,
  onChoose,
  onActivate,
}: {
  activeIdx: number;
  chosenIdx: number | null;
  onChoose: () => void;
  onActivate: (idx: number) => void;
}) {
  const isChosen = chosenIdx === activeIdx;

  /* For each criterion, compute who the row winner is (lowest rank). */
  const rowWinners: Record<CriterionId, number> = CRITERIA.reduce(
    (acc, c) => {
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
    },
    {} as Record<CriterionId, number>,
  );

  const cardBase: React.CSSProperties = {
    backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
    borderRadius: '14px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: '180px 1fr 1fr 1fr',
        gap: '12px',
        alignItems: 'stretch',
      }}
    >
        {/* Labels column — empty thumb area on top + empty CTA area on
            the bottom keep this card the same height as the option cards. */}
        <div
          style={{
            ...cardBase,
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          {/* Spacer matching the option cards' image area */}
          <div style={{ height: `${THUMB_AREA_H}px` }} />
          {/* Header */}
          <div
            className="flex items-center"
            style={{
              height: `${HEADER_H}px`,
              padding: '0 18px',
              backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
              borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
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
                fontWeight: 500,
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              }}
            >
              {c.label}
            </div>
          ))}

          {/* Spacer matching the CTA area on the option cards */}
          <div style={{ height: `${CTA_H}px`, marginTop: 'auto' }} />
        </div>

        {/* Three option cards */}
        {OPTIONS.map((opt, optIdx) => {
          const isActive    = optIdx === activeIdx;
          const thumbH      = isActive ? BIG_THUMB_H : SMALL_THUMB_H;
          const topSpacerH  = THUMB_AREA_H - thumbH; // pushes inactive thumbs down so their bottoms align with the active thumb's bottom
          return (
            <div
              key={`col-${opt.id}`}
              role={isActive ? undefined : 'button'}
              tabIndex={isActive ? undefined : 0}
              onClick={isActive ? undefined : () => onActivate(optIdx)}
              onKeyDown={
                isActive
                  ? undefined
                  : (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onActivate(optIdx);
                      }
                    }
              }
              aria-label={
                isActive
                  ? undefined
                  : `Switch to ${opt.label}: ${opt.caption}`
              }
              style={{
                ...cardBase,
                border: isActive
                  ? `2px solid ${opt.accent}`
                  : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                boxShadow: isActive
                  ? '0 14px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.05)'
                  : '0 2px 6px rgba(0,0,0,0.04)',
                cursor: isActive ? 'default' : 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={
                isActive
                  ? undefined
                  : (e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow =
                        '0 8px 18px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.05)';
                    }
              }
              onMouseLeave={
                isActive
                  ? undefined
                  : (e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow =
                        '0 2px 6px rgba(0,0,0,0.04)';
                    }
              }
            >
              {/* Image area — fills the top of the card; inactive thumbs
                  sit at the bottom of this band so all thumb bottoms align */}
              <div
                style={{
                  height: `${THUMB_AREA_H}px`,
                  backgroundColor: isActive ? opt.accentSoft : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {topSpacerH > 0 && <div style={{ height: `${topSpacerH}px` }} />}
                <div
                  style={{
                    height: `${thumbH}px`,
                    padding: '10px 12px',
                  }}
                >
                  <PlanSVG option={opt} />
                </div>
              </div>

              {/* Header */}
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{
                  height: `${HEADER_H}px`,
                  padding: '4px 12px',
                  backgroundColor: isActive
                    ? opt.accentSoft
                    : 'var(--modus-wc-color-base-100, #f7f8fa)',
                  borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                  borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                }}
              >
                <span
                  className="font-semibold"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-md, 16px)',
                    color: isActive
                      ? opt.accent
                      : 'var(--modus-wc-color-base-content, #101828)',
                  }}
                >
                  {opt.label}
                </span>
                <span
                  style={{
                    marginTop: '2px',
                    fontSize: 'var(--modus-wc-font-size-sm, 12px)',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {opt.caption}
                </span>
              </div>
              {/* Cells */}
              {CRITERIA.map((c, i) => {
                const isRowWinner = rowWinners[c.id] === optIdx;
                return (
                  <div
                    key={`cell-${opt.id}-${c.id}`}
                    className="relative flex items-center justify-center"
                    style={{
                      height: `${ROW_H}px`,
                      padding: '0 12px',
                      backgroundColor: isActive ? opt.accentSoft : 'transparent',
                      borderTop:
                        i > 0
                          ? '1px solid var(--modus-wc-color-base-200, #e0e1e9)'
                          : 'none',
                    }}
                  >
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: 'var(--modus-wc-font-size-md, 15px)',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive
                          ? opt.accent
                          : 'var(--modus-wc-color-base-content, #101828)',
                      }}
                    >
                      {opt.values[c.id].display}
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

              {/* CTA section — only the active column shows the button */}
              <div
                className="flex items-center justify-center"
                style={{
                  height: `${CTA_H}px`,
                  padding: '12px',
                  marginTop: 'auto',
                  backgroundColor: isActive ? opt.accentSoft : 'transparent',
                  borderTop: isActive
                    ? '1px solid var(--modus-wc-color-base-200, #e0e1e9)'
                    : 'none',
                }}
              >
                {isActive && (isChosen ? (
                  <ModusWcButton size="md" color="secondary" variant="outlined" disabled>
                    <span className="flex items-center gap-1.5">
                      <ModusWcIcon name="check_circle" size="sm" decorative />
                      Chosen
                    </span>
                  </ModusWcButton>
                ) : (
                  <ModusWcButton size="md" color="primary" onButtonClick={onChoose}>
                    <span className="flex items-center gap-1.5">
                      <ModusWcIcon name="check" size="sm" decorative />
                      Choose {opt.label}
                    </span>
                  </ModusWcButton>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}

/* ── Host component ─────────────────────────────────────────────── */

export default function Creative4() {
  const [activeIdx, setActiveIdx] = useState(1);     // Option 2 selected by default
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);

  const N = OPTIONS.length;
  const leftIdx   = (activeIdx - 1 + N) % N;
  const rightIdx  = (activeIdx + 1) % N;

  return (
    <div className="flex items-center" style={{ width: '880px', gap: '12px' }}>
      <CarouselArrow direction="left" onClick={() => setActiveIdx(leftIdx)} />
      <div className="flex-1 min-w-0">
        <CompareMatrix
          activeIdx={activeIdx}
          chosenIdx={chosenIdx}
          onChoose={() => setChosenIdx(activeIdx)}
          onActivate={setActiveIdx}
        />
      </div>
      <CarouselArrow direction="right" onClick={() => setActiveIdx(rightIdx)} />
    </div>
  );
}
