import { useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

type Confidence = 'high' | 'medium' | 'low';

interface Alternative {
  icon: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  rationale: string;
  pros: string[];
  nextSteps: string[];
  confidence: Confidence;
}

const CONFIDENCE_STYLES: Record<
  Confidence,
  { label: string; bg: string; border: string; text: string; icon: string }
> = {
  high: {
    label: 'High Confidence',
    bg: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
    border: 'var(--modus-wc-color-status-success, #1e7e34)',
    text: 'var(--modus-wc-color-status-success, #1e7e34)',
    icon: 'check_circle',
  },
  medium: {
    label: 'Medium Confidence',
    bg: 'var(--modus-wc-color-status-warning-light, #fff4d6)',
    border: 'var(--modus-wc-color-status-warning, #c49000)',
    text: 'var(--modus-wc-color-status-warning, #8a6300)',
    icon: 'alert_outline',
  },
  low: {
    label: 'Low Confidence',
    bg: 'var(--modus-wc-color-status-error-light, #fde7e9)',
    border: 'var(--modus-wc-color-status-error, #b00020)',
    text: 'var(--modus-wc-color-status-error, #b00020)',
    icon: 'help_outline',
  },
};

const alternatives: Alternative[] = [
  {
    icon: 'view_grid',
    title: 'Optimize Column Grid',
    summary:
      'Cut the column count from 6 to 4 with deeper grade beams — saves ~$22K in concrete, rebar, and formwork.',
    description:
      'Re-engineer the structural bay to span longer with four perimeter columns instead of six, using deeper interior grade beams to carry the load.',
    tags: ['Cost-saving', 'Structural'],
    rationale:
      'Fewer columns mean fewer footings, less concrete, and less formwork — the deeper grade beams more than absorb the redistributed load.',
    pros: [
      'Eliminates 2 columns + footings + rebar cages (~$22K)',
      'Faster column-pour cycle on the critical path',
      'Fewer column form sets to handle and rotate',
      'More open basement floor plate for MEP routing',
    ],
    nextSteps: [
      'Run revised column-grid analysis with the structural engineer',
      'Update grade-beam sizing for the longer span',
      'Re-tally concrete and rebar quantities for the new layout',
    ],
    confidence: 'high',
  },
  {
    icon: 'sync',
    title: 'Post-Tensioned Mat Slab',
    summary:
      'Replace the conventional rebar mat with post-tensioned tendons — cuts rebar tonnage ~35% and lets the slab go thinner.',
    description:
      'Swap the conventional reinforced mat foundation for a post-tensioned design with stressed tendons in place of dense rebar, allowing a thinner slab section.',
    tags: ['Material-saving', 'Faster'],
    rationale:
      'PT tendons carry tension more efficiently than passive rebar, allowing a thinner slab with less steel for the same structural performance.',
    pros: [
      'Cuts mat rebar tonnage by ~35%',
      'Slab thickness drops from 600mm to ~450mm',
      'Improved crack control across the foundation',
      'Faster strip-and-load cycle for upper floors',
    ],
    nextSteps: [
      'Engage a PT specialist to validate the slab design',
      'Get tendon supplier quote for stressing and grouting',
      'Update the rebar / concrete takeoff for the thinner slab',
    ],
    confidence: 'medium',
  },
  {
    icon: 'speed',
    title: 'High-Strength Concrete (6000 psi)',
    summary:
      'Spec 6000 psi columns instead of 4000 psi — shrinks cross-sections ~25% and trims vertical rebar.',
    description:
      'Switch the column concrete from 4000 psi to 6000 psi (~40 MPa), allowing smaller cross-sections and reduced vertical reinforcement at a small mix-cost premium.',
    tags: ['Material-saving', 'Trade-off'],
    rationale:
      'Higher compressive strength carries the same load with less section, recovering the mix cost premium through reduced concrete volume and rebar.',
    pros: [
      'Columns shrink from 1.0×1.0 m to ~0.85×0.85 m',
      'Vertical rebar drops ~15%',
      'More usable basement floor area',
      'Same code compliance and load rating',
    ],
    nextSteps: [
      'Confirm the batch plant can supply 6000 psi consistently',
      'Re-run the column reinforcement schedule at higher fc',
      'Update structural drawings for the new column dimensions',
    ],
    confidence: 'low',
  },
];

/* The single high-level outcome shared across the strategies */
const OUTCOME_TITLE = 'Opportunity to save $40K';
const OUTCOME_SUBTITLE = 'by applying one of these strategies.';

/* ── Inline Expanded Details (renders inside the card) ─────────── */
function ExpandedDetails({
  item,
  onCollapse,
}: {
  item: Alternative;
  onCollapse: () => void;
}) {
  const topPros = item.pros.slice(0, 2);
  const topSteps = item.nextSteps.slice(0, 2);

  return (
    <div className="flex flex-col gap-2 px-5 pb-3">
      {/* Strategy title + Collapse control */}
      <div className="flex items-center justify-between gap-2">
        <p
          className="font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #252a2e)',
            lineHeight: '20px',
            marginBottom: 0,
            flex: 1,
            minWidth: 0,
          }}
        >
          {item.title}
        </p>
        <button
          type="button"
          onClick={onCollapse}
          className="flex items-center gap-1 transition-colors hover:opacity-80 shrink-0"
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            fontWeight: 600,
            color: 'var(--modus-wc-color-primary, #0063a3)',
            background: 'transparent',
            border: 'none',
            padding: '2px 0',
            cursor: 'pointer',
          }}
          aria-label="Collapse details"
        >
          <ModusWcIcon
            name="expand_less"
            size="sm"
            decorative
            style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
          />
          Collapse
        </button>
      </div>

      {/* Rationale — short, no eyebrow needed */}
      <p
        style={{
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          color: 'var(--modus-wc-color-base-content, #252a2e)',
          lineHeight: '17px',
          marginBottom: 0,
        }}
      >
        {item.rationale}
      </p>

      {/* Key benefits — top 2 only */}
      <div className="flex flex-col gap-0.5">
        {topPros.map((pro) => (
          <div key={pro} className="flex items-start gap-1.5">
            <ModusWcIcon
              name="check"
              size="xs"
              decorative
              style={{
                color: 'var(--modus-wc-color-status-success, #1e7e34)',
                marginTop: '2px',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #252a2e)',
                lineHeight: '16px',
              }}
            >
              {pro}
            </span>
          </div>
        ))}
      </div>

      {/* Next steps — top 2 only, tighter padded box */}
      <div
        className="flex flex-col gap-1 p-2 rounded-md mt-0.5"
        style={{ backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Next steps
        </span>
        {topSteps.map((step, i) => (
          <div key={step} className="flex items-start gap-2">
            <span
              className="flex items-center justify-center rounded-full shrink-0 font-semibold"
              style={{
                width: '16px',
                height: '16px',
                fontSize: '10px',
                backgroundColor: 'var(--modus-wc-color-primary, #0063a3)',
                color: '#fff',
                marginTop: '1px',
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #252a2e)',
                lineHeight: '16px',
              }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── CAD palette (shared with Creative 5 vibe) ──────────────────── */
const PAPER = '#fafafa';
const INK = '#1d232b';
const INK_LIGHT = '#5a6270';

/* ── Per-strategy CAD-style illustrations ───────────────────────── */

/* Strategy 1 — Optimize column grid (plan view: 6 → 4 columns) */
function ColumnGridIllustration() {
  const accent = '#1e7e34';
  return (
    <svg
      viewBox="0 0 240 105"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      aria-hidden
    >
      <defs>
        <pattern
          id="hatchSlabPlan"
          width={6}
          height={6}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={6} stroke={INK_LIGHT} strokeWidth={0.6} />
        </pattern>
      </defs>

      {/* Foundation slab outline (plan view) */}
      <rect x={20} y={18} width={200} height={62} fill="url(#hatchSlabPlan)" stroke={INK} strokeWidth={1.6} />

      {/* OLD 6-column grid — dashed, faded (3 cols × 2 rows) */}
      {[60, 120, 180].flatMap((cx) =>
        [38, 60].map((cy) => (
          <circle
            key={`old-${cx}-${cy}`}
            cx={cx} cy={cy} r={6}
            fill="white"
            stroke={INK_LIGHT}
            strokeWidth={1.4}
            strokeDasharray="3 2"
          />
        )),
      )}

      {/* NEW 4-column grid — bold accent (2 cols × 2 rows) */}
      {[60, 180].flatMap((cx) =>
        [38, 60].map((cy) => (
          <g key={`new-${cx}-${cy}`}>
            <rect
              x={cx - 8} y={cy - 8} width={16} height={16}
              fill={accent} fillOpacity={0.18}
              stroke={accent} strokeWidth={2}
            />
            <rect x={cx - 3} y={cy - 3} width={6} height={6} fill={accent} />
          </g>
        )),
      )}

      {/* Savings label */}
      <text
        x={120} y={97}
        fontSize={14} fontWeight={800} fill={accent}
        fontFamily="ui-monospace, monospace" letterSpacing={0.6}
        textAnchor="middle"
      >
        −2 COLUMNS
      </text>
    </svg>
  );
}

/* Strategy 2 — Post-tensioned mat slab (rebar vs PT tendons, section view) */
function PostTensionedIllustration() {
  const accent = '#0063a7';
  return (
    <svg
      viewBox="0 0 240 105"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      aria-hidden
    >
      {/* Slab outline */}
      <rect x={20} y={32} width={200} height={36} fill="white" stroke={INK} strokeWidth={1.6} />

      {/* Centre divider between "before" (left) and "after" (right) */}
      <line x1={120} y1={20} x2={120} y2={80} stroke={INK} strokeWidth={0.8} strokeDasharray="3 3" />

      {/* LEFT — conventional rebar grid (dense, dashed, faded) */}
      <g stroke={INK_LIGHT} strokeWidth={0.9} strokeDasharray="2 1.5">
        {/* Horizontal bars */}
        {[40, 48, 56, 64].map((y) => (
          <line key={`h-${y}`} x1={28} y1={y} x2={114} y2={y} />
        ))}
        {/* Vertical bars */}
        {[30, 42, 54, 66, 78, 90, 102, 112].map((x) => (
          <line key={`v-${x}`} x1={x} y1={36} x2={x} y2={66} />
        ))}
      </g>

      {/* RIGHT — PT tendons (bold drape curves with end anchors) */}
      <g stroke={accent} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M 130 42 Q 175 64 220 42" />
        <path d="M 130 50 Q 175 72 220 50" />
        <path d="M 130 58 Q 175 80 220 58" />
      </g>
      {/* Anchor plates at tendon ends */}
      {[42, 50, 58].map((y) => (
        <g key={`anchor-${y}`}>
          <rect x={127} y={y - 3} width={4} height={6} fill={accent} />
          <rect x={219} y={y - 3} width={4} height={6} fill={accent} />
        </g>
      ))}

      {/* Section labels */}
      <text
        x={70} y={26}
        fontSize={11} fontWeight={800} fill={INK_LIGHT}
        fontFamily="ui-monospace, monospace" letterSpacing={0.6}
        textAnchor="middle"
      >
        REBAR
      </text>
      <text
        x={170} y={26}
        fontSize={11} fontWeight={800} fill={accent}
        fontFamily="ui-monospace, monospace" letterSpacing={0.6}
        textAnchor="middle"
      >
        PT TENDONS
      </text>

      {/* Savings */}
      <text
        x={120} y={97}
        fontSize={14} fontWeight={800} fill={accent}
        fontFamily="ui-monospace, monospace" letterSpacing={0.6}
        textAnchor="middle"
      >
        −35% STEEL
      </text>
    </svg>
  );
}

/* Strategy 3 — High-strength concrete (column cross-section comparison) */
function HighStrengthConcreteIllustration() {
  const accent = '#0e7490';
  return (
    <svg
      viewBox="0 0 240 105"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      aria-hidden
    >
      {/* OLD column 4000 psi — large, dashed outline */}
      <g transform="translate(60, 44)">
        <rect
          x={-30} y={-30} width={60} height={60}
          fill="white"
          stroke={INK_LIGHT} strokeWidth={1.6}
          strokeDasharray="4 3"
        />
        {/* Stirrup hint */}
        <rect
          x={-23} y={-23} width={46} height={46}
          fill="none"
          stroke={INK_LIGHT} strokeWidth={0.8}
          strokeDasharray="2 2"
        />
        {/* 8 rebar dots — corners + mid-edges */}
        {[
          [-20, -20], [0, -20], [20, -20],
          [-20, 0], [20, 0],
          [-20, 20], [0, 20], [20, 20],
        ].map(([x, y]) => (
          <circle key={`old-${x}-${y}`} cx={x} cy={y} r={2.4} fill={INK_LIGHT} />
        ))}
        <text
          x={0} y={48}
          fontSize={11} fontWeight={700} fill={INK_LIGHT}
          fontFamily="ui-monospace, monospace" letterSpacing={0.4}
          textAnchor="middle"
        >
          4000 psi
        </text>
      </g>

      {/* Arrow — old → new */}
      <g transform="translate(120, 44)" stroke={INK} strokeWidth={2} strokeLinecap="round">
        <line x1={-14} y1={0} x2={10} y2={0} />
        <polygon points="10,-5 22,0 10,5" fill={INK} stroke="none" />
      </g>

      {/* NEW column 6000 psi — smaller, bold accent */}
      <g transform="translate(180, 44)">
        <rect
          x={-22} y={-22} width={44} height={44}
          fill={accent} fillOpacity={0.14}
          stroke={accent} strokeWidth={2.4}
        />
        {/* Stirrup hint */}
        <rect
          x={-17} y={-17} width={34} height={34}
          fill="none"
          stroke={accent} strokeWidth={0.9}
        />
        {/* 6 rebar dots — corners + mid-edges */}
        {[
          [-15, -15], [0, -15], [15, -15],
          [-15, 15], [0, 15], [15, 15],
        ].map(([x, y]) => (
          <circle key={`new-${x}-${y}`} cx={x} cy={y} r={2.6} fill={accent} />
        ))}
        <text
          x={0} y={40}
          fontSize={11} fontWeight={800} fill={accent}
          fontFamily="ui-monospace, monospace" letterSpacing={0.4}
          textAnchor="middle"
        >
          6000 psi
        </text>
      </g>

      {/* Savings */}
      <text
        x={120} y={97}
        fontSize={14} fontWeight={800} fill={accent}
        fontFamily="ui-monospace, monospace" letterSpacing={0.6}
        textAnchor="middle"
      >
        −25% AREA
      </text>
    </svg>
  );
}

const ILLUSTRATIONS = [
  ColumnGridIllustration,
  PostTensionedIllustration,
  HighStrengthConcreteIllustration,
];

/* ── Strategy "Picture" Visual — paper sheet with CAD elevation ── */
function StrategyPicture({ idx }: { idx: number }) {
  const Illustration = ILLUSTRATIONS[idx] ?? ILLUSTRATIONS[0];
  return (
    <div
      className="rounded-md overflow-hidden relative w-full"
      style={{
        aspectRatio: '16 / 7',
        background: PAPER,
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
      }}
    >
      {/* Subtle grid for blueprint vibe */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
        aria-hidden
      >
        <defs>
          <pattern id="cadGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#dfe2e8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cadGrid)" />
      </svg>
      <Illustration />
    </div>
  );
}

/* ── Creative 6 — Suggest Alternatives ─────────────────────────── */
interface Creative6Props {
  open?: boolean;
  onClose?: () => void;
}

export default function Creative6({ open = true, onClose }: Creative6Props = {}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);

  if (!open) return null;

  const total = alternatives.length;
  const current = alternatives[currentIdx];
  const confidenceStyle = CONFIDENCE_STYLES[current.confidence];

  function prev() {
    setCurrentIdx((i) => (i - 1 + total) % total);
    setExpanded(false);
  }
  function next() {
    setCurrentIdx((i) => (i + 1) % total);
    setExpanded(false);
  }

  return (
    <>
      {/* Main card with animated rainbow gradient border + glow halo */}
      <div
        className="creative6-card-glow rounded-2xl p-[2px] shrink-0 relative"
        style={{
          background: TRIMBLE_RAINBOW,
          backgroundSize: '200% 200%',
          width: '300px',
        }}
      >
        {/* Prev / Next cycle arrows on outer edges */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous strategy"
          className="absolute z-20 flex items-center justify-center transition-transform hover:scale-110"
          style={{
            left: '-18px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          }}
        >
          <ModusWcIcon
            name="chevron_left"
            size="sm"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content, #252a2e)' }}
          />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next strategy"
          className="absolute z-20 flex items-center justify-center transition-transform hover:scale-110"
          style={{
            right: '-18px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          }}
        >
          <ModusWcIcon
            name="chevron_right"
            size="sm"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content, #252a2e)' }}
          />
        </button>

        <div
          className="rounded-[14px] flex flex-col w-full overflow-hidden"
          style={{ backgroundColor: 'var(--modus-wc-color-base-page, #fff)' }}
        >
          {/* Top row: TI Logo + High Confidence chip */}
          <div className="flex flex-col px-5 pt-3 pb-4 gap-0.5">
            <div className="flex items-center justify-between">
              {/* Trimble AI logo */}
              <span className="flex items-center justify-center" style={{ width: '28px', height: '28px' }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 30.002 32.6797"
                  fill="none"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="trimbleAiLogo"
                      x1="3.7558"
                      y1="10.5251"
                      x2="20.4332"
                      y2="30.2565"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#FF2BFC" />
                      <stop offset="0.628993" stopColor="#0563A7" />
                      <stop offset="1" stopColor="#075CA4" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M1.69824 24.9697C3.48353 26.9109 5.82653 28.2524 8.4043 28.8096L1.69824 32.6797V24.9697ZM10.6523 5.60742C16.5357 5.60742 21.3057 10.3803 21.3057 16.2676C21.3055 22.1547 16.5356 26.9268 10.6523 26.9268C4.76928 26.9265 0.00017177 22.1545 0 16.2676C0 10.3805 4.76918 5.60766 10.6523 5.60742ZM10.6523 7.69238C5.9201 7.69263 2.08398 11.5321 2.08398 16.2676C2.08416 21.0029 5.92021 24.8416 10.6523 24.8418C15.3847 24.8418 19.2215 21.003 19.2217 16.2676C19.2217 11.532 15.3848 7.69238 10.6523 7.69238ZM30.002 16.3398L23.2803 20.2217C24.0854 17.7019 24.0922 14.9945 23.2998 12.4707L30.002 16.3398ZM8.35547 3.83691C5.79861 4.40439 3.47535 5.73916 1.69824 7.66309V0L8.35547 3.83691Z"
                    fill="url(#trimbleAiLogo)"
                  />
                </svg>
              </span>

              {/* Confidence chip + close button, grouped at the top-right */}
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1 px-2 py-1 rounded transition-colors"
                  style={{
                    border: `1px solid ${confidenceStyle.border}`,
                    backgroundColor: confidenceStyle.bg,
                  }}
                  aria-label={confidenceStyle.label}
                >
                  <ModusWcIcon
                    name={confidenceStyle.icon}
                    size="xs"
                    decorative
                    style={{ color: confidenceStyle.text }}
                  />
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                      color: confidenceStyle.text,
                      letterSpacing: '0.1px',
                    }}
                  >
                    {confidenceStyle.label}
                  </span>
                </span>

                {/* Dismiss button — sits just beside the confidence chip */}
                <button
                  type="button"
                  onClick={() => onClose?.()}
                  className="flex items-center justify-center size-6 rounded-full transition-colors hover:bg-base-200"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  aria-label="Dismiss"
                >
                  <ModusWcIcon
                    name="close"
                    size="xs"
                    decorative
                    style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Outcome — flipped to lead with the value (static) */}
          <div className="flex flex-col gap-0.5 px-5 pb-4">
            <p
              className="font-semibold"
              style={{
                fontSize: '18px',
                color: 'var(--modus-wc-color-base-content, #252a2e)',
                lineHeight: '24px',
                marginBottom: 0,
              }}
            >
              {OUTCOME_TITLE}
            </p>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                lineHeight: '18px',
                marginBottom: 0,
              }}
            >
              {OUTCOME_SUBTITLE}
            </p>
          </div>

          {/* Visually distinct cycling section */}
          <div
            className="flex flex-col"
            style={{
              backgroundColor: 'var(--modus-wc-color-base-100, #f5f6fa)',
              borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            }}
          >
            {/* Eyebrow counter */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <span
                className="font-semibold"
                style={{
                  fontSize: '10px',
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                Strategy {currentIdx + 1} / {total}
              </span>
              <ModusWcIcon
                name="lightbulb"
                size="xs"
                decorative
                style={{
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              />
            </div>

            {/* Animated swap surface — re-keys on currentIdx + expanded for fade-in */}
            <div
              key={`${currentIdx}-${expanded ? 'x' : 'c'}`}
              className="creative6-fade flex flex-col"
            >
              {!expanded ? (
                <>
                  {/* Picture */}
                  <div className="px-5 pb-3">
                    <StrategyPicture idx={currentIdx} />
                  </div>

                  {/* Strategy title + 3-line summary (static, not a modal trigger) */}
                  <div className="flex flex-col gap-1 px-5 pb-2">
                    <p
                      className="font-semibold"
                      style={{
                        fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                        color: 'var(--modus-wc-color-base-content, #252a2e)',
                        lineHeight: '20px',
                        marginBottom: 0,
                      }}
                    >
                      {current.title}
                    </p>
                    <p
                      style={{
                        fontSize: '11px',
                        color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                        lineHeight: '20px',
                        marginBottom: 0,
                        minHeight: '40px',
                      }}
                    >
                      {current.summary}
                    </p>
                  </div>

                  {/* Expand button */}
                  <div className="px-5 pb-1">
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="flex items-center gap-1 transition-colors hover:opacity-80"
                      style={{
                        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                        fontWeight: 600,
                        color: 'var(--modus-wc-color-primary, #0063a3)',
                        background: 'transparent',
                        border: 'none',
                        padding: '4px 0',
                        cursor: 'pointer',
                      }}
                    >
                      <ModusWcIcon
                        name="expand_more"
                        size="sm"
                        decorative
                        style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
                      />
                      Expand details
                    </button>
                  </div>
                </>
              ) : (
                <ExpandedDetails
                  item={current}
                  onCollapse={() => setExpanded(false)}
                />
              )}
            </div>

            {/* Page-dot indicator for cycling */}
            <div className="flex items-center justify-center gap-1.5 px-5 pb-4 pt-2">
              {alternatives.map((a, i) => {
                const active = i === currentIdx;
                return (
                  <button
                    key={a.title}
                    type="button"
                    onClick={() => setCurrentIdx(i)}
                    aria-label={`Go to strategy ${i + 1}`}
                    className="transition-all"
                    style={{
                      width: active ? '20px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: active
                        ? 'var(--modus-wc-color-primary, #0063a3)'
                        : 'var(--modus-wc-color-base-300, #cbcdd6)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
