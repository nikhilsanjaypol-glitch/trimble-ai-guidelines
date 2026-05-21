import { useMemo, useState } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Guideline: PRESENT RELEVANT INFORMATION
 *   AI tools should present & communicate options that are optimised
 *   for different criteria, so the professional can make effective
 *   trade-offs based on their priorities.
 *
 * Component: PLAN-CAROUSEL + COMPARE-MATRIX
 *   Three plumbing routing plans sit in a carousel above. The middle
 *   thumbnail is the currently focused option. Below them, a single
 *   gradient-bordered comparison matrix shows every option side by
 *   side across the criteria that drive the decision (cost, install
 *   speed, material volume, maintenance, flexibility). A priority
 *   chip row above the matrix lets the professional declare what
 *   matters most — that row gets highlighted, the winning cell gets
 *   a rainbow underline, and the carousel auto-focuses the option
 *   that wins on that priority. Floating layout (no outer card)
 *   matches the Creative3 design language.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

/* ── Data model ─────────────────────────────────────────────────── */

type CriterionId = 'cost' | 'speed' | 'material' | 'maintenance' | 'flexibility';

interface Criterion {
  id: CriterionId;
  label: string;
  icon: string;
  /** Helper for the chip caption. */
  hint: string;
}

const CRITERIA: Criterion[] = [
  { id: 'cost',         label: 'Cost',          icon: 'dollar',          hint: 'Lower is better' },
  { id: 'speed',        label: 'Install Speed', icon: 'clock',           hint: 'Faster on site' },
  { id: 'material',     label: 'Material Vol.', icon: 'layers',          hint: 'Less pipe & fittings' },
  { id: 'maintenance',  label: 'Maintenance',   icon: 'tools',           hint: 'Easier long-term' },
  { id: 'flexibility',  label: 'Flexibility',   icon: 'swap_horizontal', hint: 'Easier to change later' },
];

type OptionId = 'perimeter' | 'manifold' | 'branched';

interface OptionCellValue {
  display: string;
  /** 1 = best, 2 = mid, 3 = worst. Drives the winning-cell highlight. */
  rank: 1 | 2 | 3;
}

interface Option {
  id: OptionId;
  label: string;
  caption: string;
  /** Single most distinctive criterion this option is tuned for. */
  bestFor: CriterionId;
  accent: string;
  accentSoft: string;
  rev: string;
  values: Record<CriterionId, OptionCellValue>;
}

const OPTIONS: Option[] = [
  {
    id: 'perimeter',
    label: 'Option 1',
    caption: 'Wall-perimeter loop',
    bestFor: 'cost',
    accent: 'var(--modus-wc-color-status-warning, #856404)',
    accentSoft: 'var(--modus-wc-color-status-warning-light, #fff8e1)',
    rev: 'A',
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
    accent: 'var(--modus-wc-color-status-success, #1e7e34)',
    accentSoft: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
    rev: 'B',
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
    accent: 'var(--modus-wc-color-primary, #0063A7)',
    accentSoft: 'var(--modus-wc-color-primary-light, #e8f4fd)',
    rev: 'C',
    values: {
      cost:        { display: '$$$',     rank: 3 },
      speed:       { display: 'Moderate', rank: 2 },
      material:    { display: 'High',     rank: 2 },
      maintenance: { display: 'Best',     rank: 1 },
      flexibility: { display: 'Moderate', rank: 2 },
    },
  },
];

/* Pipe palette shared across all plans. */
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
      {/* room */}
      <rect x="2" y="2" width="196" height="136" fill={stage} stroke={wall} strokeWidth="1" rx="1" />

      {/* shared fixture layout — sinks top, dishwasher top-right, prep island, floor drains */}
      <g>
        {/* Sink 1 (top-left) */}
        <rect x="18" y="14" width="26" height="18" fill={fixture} stroke={wall} strokeWidth="0.8" />
        <circle cx="31" cy="23" r="2.6" fill="none" stroke={label} strokeWidth="0.8" />
        {/* Sink 2 (top-centre) */}
        <rect x="86" y="14" width="26" height="18" fill={fixture} stroke={wall} strokeWidth="0.8" />
        <circle cx="99" cy="23" r="2.6" fill="none" stroke={label} strokeWidth="0.8" />
        {/* Dishwasher (top-right) */}
        <rect x="156" y="14" width="26" height="18" fill={fixture} stroke={wall} strokeWidth="0.8" />
        <text x="169" y="26" fontSize="7" textAnchor="middle" fill={label} fontWeight="600">DW</text>
        {/* Prep island */}
        <rect x="60" y="74" width="80" height="22" fill={fixture} stroke={wall} strokeWidth="0.8" />
        <text x="100" y="89" fontSize="7" textAnchor="middle" fill={label} fontWeight="600">PREP</text>
        {/* Floor drains */}
        {[20, 100, 180].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="120" r="3" fill="none" stroke={PIPE.drain} strokeWidth="0.7" />
            <line x1={cx - 3} y1="120" x2={cx + 3} y2="120" stroke={PIPE.drain} strokeWidth="0.5" />
            <line x1={cx} y1="117" x2={cx} y2="123" stroke={PIPE.drain} strokeWidth="0.5" />
          </g>
        ))}
      </g>

      {/* OPTION 1 — perimeter loop */}
      {option.id === 'perimeter' && (
        <g>
          {/* Cold + hot supply lines hugging the top wall */}
          <line x1="6" y1="6"  x2="194" y2="6"  stroke={PIPE.cold} strokeWidth="1.2" />
          <line x1="6" y1="9"  x2="194" y2="9"  stroke={PIPE.hot}  strokeWidth="1.2" />
          {[31, 99, 169].map((x) => (
            <g key={`s-${x}`}>
              <line x1={x}     y1="6" x2={x}     y2="14" stroke={PIPE.cold} strokeWidth="0.9" />
              <line x1={x + 3} y1="9" x2={x + 3} y2="14" stroke={PIPE.hot}  strokeWidth="0.9" />
            </g>
          ))}
          {/* Drain along the bottom wall, single trunk */}
          <line x1="6" y1="134" x2="194" y2="134" stroke={PIPE.drain} strokeWidth="1.3" />
          {[20, 100, 180].map((x) => (
            <line key={`d-${x}`} x1={x} y1="120" x2={x} y2="134" stroke={PIPE.drain} strokeWidth="0.9" />
          ))}
          {/* Prep island drain runs a long branch around the perimeter (high maintenance penalty) */}
          <polyline points="100,96 100,108 150,108 150,134" fill="none" stroke={PIPE.drain} strokeWidth="0.9" strokeDasharray="2 1.5" />
        </g>
      )}

      {/* OPTION 2 — centralised manifold */}
      {option.id === 'manifold' && (
        <g>
          {/* central manifold box */}
          <rect x="92" y="54" width="16" height="14" fill={option.accentSoft} stroke={option.accent} strokeWidth="1" />
          <text x="100" y="64" fontSize="6.5" textAnchor="middle" fill={option.accent} fontWeight="700">MANI</text>
          {/* mains feed in from left */}
          <line x1="6" y1="60" x2="92"  y2="60" stroke={PIPE.cold} strokeWidth="1.3" />
          <line x1="6" y1="64" x2="92"  y2="64" stroke={PIPE.hot}  strokeWidth="1.3" />
          {/* radiate from manifold up to each fixture */}
          {[31, 99, 169].map((x) => (
            <g key={`r-${x}`}>
              <polyline points={`100,54 100,42 ${x},42 ${x},32`} fill="none" stroke={PIPE.cold} strokeWidth="0.9" />
              <polyline points={`104,54 104,45 ${x + 3},45 ${x + 3},32`} fill="none" stroke={PIPE.hot} strokeWidth="0.9" />
            </g>
          ))}
          {/* prep island fed straight down from manifold */}
          <line x1="100" y1="68" x2="100" y2="74" stroke={PIPE.cold} strokeWidth="0.9" />
          {/* drains converge to a central spine, single exit */}
          <polyline points="20,120 20,110 100,110 100,134"  fill="none" stroke={PIPE.drain} strokeWidth="1" />
          <polyline points="180,120 180,110 100,110"        fill="none" stroke={PIPE.drain} strokeWidth="1" />
        </g>
      )}

      {/* OPTION 3 — branched zone system */}
      {option.id === 'branched' && (
        <g>
          {/* Two zone sub-manifolds (Z1, Z2) */}
          <rect x="36" y="50" width="14" height="14" fill={option.accentSoft} stroke={option.accent} strokeWidth="1" />
          <text x="43" y="60" fontSize="6.5" textAnchor="middle" fill={option.accent} fontWeight="700">Z1</text>
          <rect x="150" y="50" width="14" height="14" fill={option.accentSoft} stroke={option.accent} strokeWidth="1" />
          <text x="157" y="60" fontSize="6.5" textAnchor="middle" fill={option.accent} fontWeight="700">Z2</text>

          {/* Mains along the bottom with isolation valves into each zone */}
          <line x1="6" y1="108" x2="194" y2="108" stroke={PIPE.cold} strokeWidth="1.2" />
          <line x1="6" y1="112" x2="194" y2="112" stroke={PIPE.hot}  strokeWidth="1.2" />
          {[43, 157].map((x) => (
            <g key={`v-${x}`}>
              <circle cx={x}     cy="108" r="2" fill={option.accentSoft} stroke={option.accent} strokeWidth="0.7" />
              <circle cx={x + 2} cy="112" r="2" fill={option.accentSoft} stroke={option.accent} strokeWidth="0.7" />
            </g>
          ))}

          {/* risers from valves up into each sub-manifold */}
          <line x1="43"  y1="106" x2="43"  y2="64" stroke={PIPE.cold} strokeWidth="0.9" />
          <line x1="45"  y1="110" x2="45"  y2="64" stroke={PIPE.hot}  strokeWidth="0.9" />
          <line x1="157" y1="106" x2="157" y2="64" stroke={PIPE.cold} strokeWidth="0.9" />
          <line x1="159" y1="110" x2="159" y2="64" stroke={PIPE.hot}  strokeWidth="0.9" />

          {/* Z1 serves sink 1 + sink 2 */}
          <polyline points="43,50 43,40 31,40 31,32" fill="none" stroke={PIPE.cold} strokeWidth="0.9" />
          <polyline points="47,50 47,42 99,42 99,32" fill="none" stroke={PIPE.cold} strokeWidth="0.9" />
          <polyline points="45,50 45,45 34,45 34,32" fill="none" stroke={PIPE.hot} strokeWidth="0.9" />
          <polyline points="49,50 49,47 102,47 102,32" fill="none" stroke={PIPE.hot} strokeWidth="0.9" />
          {/* Z2 serves dishwasher */}
          <polyline points="157,50 157,40 169,40 169,32" fill="none" stroke={PIPE.cold} strokeWidth="0.9" />
          <polyline points="159,50 159,42 172,42 172,32" fill="none" stroke={PIPE.hot} strokeWidth="0.9" />

          {/* zoned drains — each cluster has its own trunk */}
          <line x1="20"  y1="120" x2="20"  y2="134" stroke={PIPE.drain} strokeWidth="0.9" />
          <line x1="100" y1="120" x2="100" y2="134" stroke={PIPE.drain} strokeWidth="0.9" />
          <line x1="180" y1="120" x2="180" y2="134" stroke={PIPE.drain} strokeWidth="0.9" />
          <line x1="6"   y1="134" x2="100" y2="134" stroke={PIPE.drain} strokeWidth="1.2" />
          <line x1="100" y1="134" x2="194" y2="134" stroke={PIPE.drain} strokeWidth="1.2" />
          {/* prep island tap stub */}
          <line x1="100" y1="96"  x2="100" y2="108" stroke={PIPE.cold} strokeWidth="0.9" />
        </g>
      )}
    </svg>
  );
}

/* ── Carousel thumbnail (one plan) ──────────────────────────────── */

function PlanThumb({
  option,
  active,
  onClick,
}: {
  option: Option;
  active: boolean;
  onClick: () => void;
}) {
  const w = active ? 280 : 220;
  const h = active ? 196 : 160;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative shrink-0 rounded-xl flex flex-col"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: active
          ? `1.5px solid ${option.accent}`
          : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: active
          ? `0 0 0 4px ${option.accentSoft}, 0 14px 28px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.05)`
          : '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
        opacity: active ? 1 : 0.85,
        cursor: 'pointer',
        transition:
          'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.opacity = '0.95';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.opacity = '0.85';
      }}
      aria-pressed={active}
      aria-label={`${option.label} — ${option.caption}`}
    >
      <div className="flex-1 p-2">
        <PlanSVG option={option} />
      </div>
      <div
        className="flex items-center justify-between px-2 py-1.5"
        style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <span
          className="truncate"
          style={{
            fontSize: '8.5px',
            fontWeight: 700,
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.3px',
          }}
        >
          COMMERCIAL KITCHEN PLUMBING PLAN
        </span>
        <span
          className="shrink-0"
          style={{
            fontSize: '8.5px',
            fontWeight: 700,
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          REV {option.rev}
        </span>
      </div>
    </button>
  );
}

/* ── Carousel nav button ────────────────────────────────────────── */

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
        width: '40px',
        height: '40px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow =
          '0 6px 14px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 4px 10px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
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

/* ── Priority chip ──────────────────────────────────────────────── */

function PriorityChip({
  criterion,
  active,
  onClick,
}: {
  criterion: Criterion;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: active
          ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
          : 'var(--modus-wc-color-base-page, #ffffff)',
        border: `1px solid ${
          active
            ? 'var(--modus-wc-color-primary, #0063A7)'
            : 'var(--modus-wc-color-base-200, #e0e1e9)'
        }`,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      aria-pressed={active}
    >
      <ModusWcIcon
        name={criterion.icon}
        size="xs"
        decorative
        style={{
          color: active
            ? 'var(--modus-wc-color-primary, #0063A7)'
            : 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)',
        }}
      />
      <span
        className="whitespace-nowrap font-medium"
        style={{
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          color: active
            ? 'var(--modus-wc-color-primary, #0063A7)'
            : 'var(--modus-wc-color-base-content, #252a2e)',
        }}
      >
        {criterion.label}
      </span>
    </button>
  );
}

/* ── Compare matrix (gradient-bordered, single card) ────────────── */

function CompareMatrix({
  activeIdx,
  priority,
  chosenIdx,
  onColumnClick,
  onChoose,
}: {
  activeIdx: number;
  priority: CriterionId | null;
  chosenIdx: number | null;
  onColumnClick: (idx: number) => void;
  onChoose: (idx: number) => void;
}) {
  const activeOption = OPTIONS[activeIdx];
  const chosenOption = chosenIdx !== null ? OPTIONS[chosenIdx] : null;
  const activeIsChosen = chosenIdx === activeIdx;
  return (
    <div
      className="rounded-2xl p-[2px]"
      style={{
        background: TRIMBLE_RAINBOW,
        boxShadow: '0 18px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="rounded-[14px]"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          padding: '20px 24px',
        }}
      >
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '180px' }} />
            {OPTIONS.map((o) => (
              <col key={o.id} />
            ))}
          </colgroup>

          {/* Header row — Option chip cards */}
          <thead>
            <tr>
              <th aria-hidden="true" />
              {OPTIONS.map((opt, i) => {
                const isActive = i === activeIdx;
                const isChosen = i === chosenIdx;
                return (
                  <th key={opt.id} className="pb-3 px-2 align-bottom">
                    <div className="relative">
                      {isChosen && (
                        <span
                          aria-hidden="true"
                          className="absolute flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                          style={{
                            top: '-10px',
                            right: '-6px',
                            backgroundColor: 'var(--modus-wc-color-status-success, #1e7e34)',
                            color: '#ffffff',
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            boxShadow: '0 2px 6px rgba(30,126,52,0.35)',
                            zIndex: 1,
                          }}
                        >
                          <ModusWcIcon
                            name="check_circle"
                            size="xs"
                            decorative
                            style={{ color: '#ffffff' }}
                          />
                          CHOSEN
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onColumnClick(i)}
                        className="w-full flex flex-col items-center gap-0.5 py-2.5 px-3 rounded-xl"
                        style={{
                          backgroundColor: isActive
                            ? opt.accentSoft
                            : 'var(--modus-wc-color-base-page, #ffffff)',
                          border: isActive
                            ? `1.5px solid ${opt.accent}`
                            : isChosen
                              ? '1.5px solid var(--modus-wc-color-status-success, #1e7e34)'
                              : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                          boxShadow: isActive
                            ? `0 0 0 3px ${opt.accentSoft}`
                            : '0 2px 6px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        aria-pressed={isActive}
                      >
                        <span
                          className="font-semibold"
                          style={{
                            fontSize: 'var(--modus-wc-font-size-md, 16px)',
                            color: isActive
                              ? opt.accent
                              : 'var(--modus-wc-color-base-content, #101828)',
                            lineHeight: 1.2,
                          }}
                        >
                          {opt.label}
                        </span>
                        <span
                          className="truncate"
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                          }}
                        >
                          {opt.caption}
                        </span>
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body — one row per criterion */}
          <tbody>
            {CRITERIA.map((c) => {
              const isPriorityRow = priority === c.id;
              return (
                <tr
                  key={c.id}
                  style={{
                    backgroundColor: isPriorityRow
                      ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
                      : 'transparent',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <th
                    scope="row"
                    className="text-left py-3 pr-3"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      fontWeight: 600,
                      color: 'var(--modus-wc-color-base-content, #101828)',
                      paddingLeft: isPriorityRow ? '12px' : '0',
                      borderLeft: isPriorityRow
                        ? '3px solid var(--modus-wc-color-primary, #0063A7)'
                        : '3px solid transparent',
                      transition: 'padding-left 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    {c.label}
                  </th>
                  {OPTIONS.map((opt, i) => {
                    const cell = opt.values[c.id];
                    const isWinner = cell.rank === 1;
                    const isHighlightedWinner = isPriorityRow && isWinner;
                    return (
                      <td
                        key={opt.id}
                        className="py-3 px-2 text-center align-middle"
                        style={{
                          fontSize: 'var(--modus-wc-font-size-md, 16px)',
                          color: isHighlightedWinner
                            ? 'var(--modus-wc-color-base-content, #101828)'
                            : isPriorityRow
                              ? 'var(--modus-wc-color-base-content, #364153)'
                              : 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                          fontWeight: isHighlightedWinner ? 700 : 400,
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{cell.display}</span>
                          {/* Rainbow underline appears only on the winning cell of the priority row */}
                          <span
                            style={{
                              display: 'block',
                              height: '3px',
                              width: '36px',
                              borderRadius: '2px',
                              background: isHighlightedWinner ? TRIMBLE_RAINBOW : 'transparent',
                              transition: 'background 0.2s ease',
                            }}
                            aria-hidden="true"
                          />
                        </span>
                        {/* Subtle dot marker on every winning cell (visible even without priority set) */}
                        {!isPriorityRow && isWinner && (
                          <span
                            aria-hidden="true"
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '10px',
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                              opacity: 0.35,
                            }}
                          />
                        )}
                        {/* Column-active tint band */}
                        {i === activeIdx && (
                          <span
                            aria-hidden="true"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              pointerEvents: 'none',
                              backgroundColor: OPTIONS[activeIdx].accentSoft,
                              opacity: 0.18,
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Legend strip */}
        <div
          className="flex items-center justify-between pt-3 mt-1"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '3px',
                borderRadius: '2px',
                background: TRIMBLE_RAINBOW,
              }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: '11px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              Wins on the criterion you prioritised
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                opacity: 0.35,
              }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: '11px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              Best in row
            </span>
          </div>
        </div>

        {/* Decision footer — context on the left, primary CTA on the right */}
        <div
          className="flex items-center justify-between gap-3 pt-3 mt-3"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ModusWcIcon
              name={chosenOption ? 'check_circle' : 'info'}
              size="sm"
              decorative
              style={{
                color: chosenOption
                  ? 'var(--modus-wc-color-status-success, #1e7e34)'
                  : 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)',
                flexShrink: 0,
              }}
            />
            <span
              className="truncate"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              }}
            >
              {chosenOption ? (
                <>
                  <strong style={{ color: 'var(--modus-wc-color-base-content, #101828)' }}>
                    {chosenOption.label}
                  </strong>{' '}
                  · {chosenOption.caption} — locked in for this decision.
                </>
              ) : (
                <>
                  Reviewing{' '}
                  <strong style={{ color: 'var(--modus-wc-color-base-content, #101828)' }}>
                    {activeOption.label}
                  </strong>{' '}
                  · {activeOption.caption}. Confirm to commit to your project log.
                </>
              )}
            </span>
          </div>

          {activeIsChosen ? (
            <ModusWcButton
              size="md"
              color="secondary"
              variant="outlined"
              disabled
            >
              <span className="flex items-center gap-1.5">
                <ModusWcIcon name="check_circle" size="sm" decorative />
                Chosen
              </span>
            </ModusWcButton>
          ) : (
            <ModusWcButton
              size="md"
              color="primary"
              onButtonClick={() => onChoose(activeIdx)}
            >
              <span className="flex items-center gap-1.5">
                <ModusWcIcon name="check" size="sm" decorative />
                Choose {activeOption.label}
              </span>
            </ModusWcButton>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Chat-bar pill (context, mirrors Creative3) ─────────────────── */

function ChatBarPill() {
  return (
    <div
      className="flex items-center gap-1.5 pl-2 pr-1.5 py-1.5"
      style={{
        width: '100%',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        borderRadius: '999px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: '32px', height: '32px' }}
        aria-hidden="true"
      >
        <ModusWcIcon
          name="link"
          size="sm"
          decorative
          style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
        />
      </div>
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: '32px', height: '32px' }}
        aria-hidden="true"
      >
        <ModusWcIcon
          name="tools"
          size="sm"
          decorative
          style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
        />
      </div>
      <span
        className="flex-1 truncate"
        style={{
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)',
          padding: '0 6px',
        }}
      >
        Ask Trimble AI to weigh another criterion…
      </span>
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: '34px',
          height: '34px',
          backgroundColor: 'var(--modus-wc-color-primary, #0063A7)',
        }}
        aria-hidden="true"
      >
        <ModusWcIcon
          name="arrow_right"
          size="sm"
          decorative
          style={{ color: '#ffffff' }}
        />
      </div>
    </div>
  );
}

/* ── Host component ─────────────────────────────────────────────── */

export default function Creative4() {
  const [activeIdx, setActiveIdx] = useState(1); // start centred on Option 2
  const [priority, setPriority]   = useState<CriterionId | null>(null);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);

  const N = OPTIONS.length;
  /* Rotate the carousel so the active option is always centred. */
  const ordered = useMemo(() => {
    const left   = OPTIONS[(activeIdx - 1 + N) % N];
    const centre = OPTIONS[activeIdx];
    const right  = OPTIONS[(activeIdx + 1) % N];
    return [left, centre, right] as const;
  }, [activeIdx, N]);

  const active = OPTIONS[activeIdx];

  function step(delta: 1 | -1) {
    setActiveIdx((idx) => (idx + delta + N) % N);
  }

  function handlePriorityChange(next: CriterionId | null) {
    setPriority(next);
    /* When the user declares what matters most, focus the option that wins on it. */
    if (next) {
      const winnerIdx = OPTIONS.findIndex((o) => o.values[next].rank === 1);
      if (winnerIdx >= 0) setActiveIdx(winnerIdx);
    }
  }

  function handleColumnClick(i: number) {
    setActiveIdx(i);
  }

  return (
    <div className="flex flex-col gap-4" style={{ width: '880px' }}>
      {/* AI label */}
      <div className="flex items-center gap-2 self-start">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'var(--modus-wc-color-primary, #0063A7)',
          }}
        >
          <ModusWcIcon
            name="lightbulb"
            size="xs"
            decorative
            style={{ color: '#ffffff' }}
          />
        </div>
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            margin: 0,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: 'var(--modus-wc-color-base-content, #364153)',
            }}
          >
            Trimble AI
          </span>
          {' · '}
          3 plumbing routings — each tuned for a different priority. Tell me what
          matters most and I&apos;ll focus the right one.
        </span>
      </div>

      {/* Carousel — arrows + 3 thumbnails, active in the middle */}
      <div className="flex items-center justify-between gap-3">
        <CarouselArrow direction="left" onClick={() => step(-1)} />
        <div className="flex-1 flex items-center justify-center gap-4">
          {ordered.map((opt, i) => (
            <PlanThumb
              key={opt.id}
              option={opt}
              active={i === 1}
              onClick={() => setActiveIdx(OPTIONS.findIndex((o) => o.id === opt.id))}
            />
          ))}
        </div>
        <CarouselArrow direction="right" onClick={() => step(1)} />
      </div>

      {/* Active option caption — Trimble's "what you're looking at" label */}
      <div className="flex items-center justify-center gap-2 -mt-1">
        <span
          className="rounded-full px-2.5 py-1"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: active.accent,
            backgroundColor: active.accentSoft,
            letterSpacing: '0.4px',
          }}
        >
          {active.label.toUpperCase()} · {active.caption.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Best for {CRITERIA.find((c) => c.id === active.bestFor)!.label.toLowerCase()}
        </span>
      </div>

      {/* Priority chips */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span
            className="font-semibold"
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 11.5px)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            What matters most?
          </span>
          {priority && (
            <button
              type="button"
              onClick={() => setPriority(null)}
              style={{
                fontSize: '11px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 600,
              }}
            >
              Clear priority
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CRITERIA.map((c) => (
            <PriorityChip
              key={c.id}
              criterion={c}
              active={priority === c.id}
              onClick={() => handlePriorityChange(priority === c.id ? null : c.id)}
            />
          ))}
        </div>
      </div>

      {/* Compare matrix */}
      <CompareMatrix
        activeIdx={activeIdx}
        priority={priority}
        chosenIdx={chosenIdx}
        onColumnClick={handleColumnClick}
        onChoose={(i) => setChosenIdx(i)}
      />

      {/* Chat-bar pill */}
      <ChatBarPill />
    </div>
  );
}
