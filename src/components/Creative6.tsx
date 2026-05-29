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
    icon: 'layers',
    title: 'Extreme Grade Opportunity',
    summary:
      'Re-grade the slope 2% gentler — the retaining wall is no longer needed and the full $40K is captured.',
    description:
      "By increasing the site's northern slope by 2%, you can eliminate the need for a $40k retaining wall, though it will require 10% more fill material.",
    tags: ['Cost-saving', 'Trade-off'],
    rationale:
      'A 2% slope spreads the elevation change over a longer run, removing the need for structural retention entirely.',
    pros: [
      'Eliminates $40k retaining wall cost',
      'Reduces structural complexity on the north edge',
      'Improves natural drainage along the slope',
      'Fewer specialty contractors required',
    ],
    nextSteps: [
      'Run updated grading calculations for the north boundary',
      'Get a quantity takeoff on the additional fill required',
      'Confirm revised slope meets ADA and drainage code',
    ],
    confidence: 'high',
  },
  {
    icon: 'map_outline',
    title: 'Segmental Block Retaining Wall',
    summary:
      'Swap poured concrete for dry-stacked segmental blocks — material costs drop ~25% at the same load rating.',
    description:
      'Swap the poured concrete wall for a segmental block system to cut material costs by 25% while maintaining the same structural performance.',
    tags: ['Cost-effective', 'Low risk'],
    rationale:
      'Dry-stacked interlocking blocks need no formwork or curing — same load rating at noticeably lower material and labor cost.',
    pros: [
      'Cuts wall material costs by ~25%',
      'No formwork or concrete curing delays',
      'Easier to phase and adjust during construction',
      'Modular system allows future modifications',
    ],
    nextSteps: [
      'Request segmental block supplier quotes for the required run length',
      'Review geotech report for backfill and compaction requirements',
      'Confirm structural engineer sign-off on block system sizing',
    ],
    confidence: 'medium',
  },
  {
    icon: 'sync',
    title: 'Cut-Fill Balance Optimization',
    summary:
      'Reuse on-site cut material as fill in the low areas — saves ~$18K in haul-off and imported fill.',
    description:
      'Re-sequence the earthwork to balance cut and fill volumes on site, reducing truck haul cycles and saving an estimated $18k in material transport.',
    tags: ['Faster', 'Cost-effective'],
    rationale:
      'Excess cut is currently hauled off while fill is imported. Reusing on-site spoils as fill removes both trips.',
    pros: [
      'Saves ~$18k in haul and import costs',
      'Reduces truck traffic and schedule risk',
      'Lower carbon footprint from reduced haulage',
      'Simplifies logistics with fewer off-site movements',
    ],
    nextSteps: [
      'Run a cut-fill mass haul diagram across the full site',
      'Identify areas where spoil from cut zones can be reused',
      'Update the earthwork sequence in the project schedule',
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

function RegradeIllustration() {
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
          id="hatchGround1"
          width={6}
          height={6}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={6} stroke={INK_LIGHT} strokeWidth={0.7} />
        </pattern>
      </defs>

      {/* Ground baseline */}
      <line x1={16} y1={78} x2={224} y2={78} stroke={INK} strokeWidth={1.6} />
      <rect x={16} y={78} width={208} height={16} fill="url(#hatchGround1)" />

      {/* Original (steep) slope — dashed */}
      <line
        x1={56} y1={78} x2={112} y2={20}
        stroke={INK_LIGHT} strokeWidth={1.6} strokeDasharray="5 3"
      />

      {/* Old retaining wall — crossed-out */}
      <g transform="translate(106, 12)">
        <rect width={14} height={12} fill="white" stroke={INK_LIGHT} strokeWidth={1} />
        <line x1={-3} y1={-3} x2={17} y2={15} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <line x1={17} y1={-3} x2={-3} y2={15} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      </g>

      {/* New regraded slope — bold, with soft accent wedge */}
      <path d="M 56 78 L 208 38 L 208 78 Z" fill={accent} fillOpacity={0.16} />
      <line
        x1={56} y1={78} x2={208} y2={38}
        stroke={accent} strokeWidth={3.2} strokeLinecap="round"
      />

      {/* +2% label — placed in the open sky area above the new slope,
          clear of the crossed-out wall on the left and the structure on the right */}
      <text
        x={132} y={40}
        fontSize={18} fontWeight={800} fill={accent}
        fontFamily="ui-monospace, monospace" letterSpacing={0.5}
      >
        +2%
      </text>

      {/* Tiny structure marker at top of new slope */}
      <g transform="translate(196, 24)" fill={INK}>
        <polygon points="0,6 9,-2 18,6" />
        <rect x={2} y={6} width={14} height={10} />
      </g>
    </svg>
  );
}

function BlockWallIllustration() {
  const accent = '#0063a7';
  return (
    <svg
      viewBox="0 0 240 105"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      aria-hidden
    >
      <defs>
        <pattern
          id="hatchSoil2"
          width={6}
          height={6}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={6} stroke={INK_LIGHT} strokeWidth={0.7} />
        </pattern>
      </defs>

      {/* Backfill behind wall — hatched */}
      <path
        d="M 152 84 L 152 24 L 222 24 L 222 84 Z"
        fill="url(#hatchSoil2)"
        stroke={INK_LIGHT}
        strokeWidth={1}
      />

      {/* Capstone above blocks */}
      <rect
        x={48} y={20} width={108} height={6}
        fill={accent} fillOpacity={0.30}
        stroke={INK} strokeWidth={1.2}
      />

      {/* Stacked segmental blocks — 3 chunky rows for legibility */}
      <g stroke={INK} strokeWidth={1.4}>
        {/* Row 1 — bottom */}
        <rect x={42} y={62} width={120} height={22} fill="white" />
        <line x1={82} y1={62} x2={82} y2={84} />
        <line x1={122} y1={62} x2={122} y2={84} />
        {/* Row 2 — staggered, accent-tinted */}
        <rect x={48} y={40} width={108} height={22} fill={accent} fillOpacity={0.14} />
        <line x1={102} y1={40} x2={102} y2={62} />
        {/* Row 3 — top */}
        <rect x={54} y={20} width={96} height={20} fill="white" />
        <line x1={94} y1={20} x2={94} y2={40} />
        <line x1={130} y1={20} x2={130} y2={40} />
      </g>

      {/* Ground baseline + hatched ground */}
      <line x1={16} y1={84} x2={224} y2={84} stroke={INK} strokeWidth={1.6} />
      <rect x={16} y={84} width={208} height={12} fill="url(#hatchSoil2)" />
    </svg>
  );
}

function CutFillIllustration() {
  const accent = '#0e7490';
  return (
    <svg
      viewBox="0 0 240 105"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      aria-hidden
    >
      <defs>
        <pattern
          id="hatchCut3"
          width={5}
          height={5}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(135)"
        >
          <line x1={0} y1={0} x2={0} y2={5} stroke={accent} strokeWidth={0.9} />
        </pattern>
        <pattern
          id="hatchFill3"
          width={5}
          height={5}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={5} stroke={accent} strokeWidth={0.9} />
        </pattern>
      </defs>

      {/* CUT zone — terrain peak above target line */}
      <path
        d="M 16 56 Q 68 -8 124 56 L 16 56 Z"
        fill="url(#hatchCut3)"
        stroke={accent}
        strokeWidth={1.2}
      />

      {/* FILL zone — terrain valley below target line */}
      <path
        d="M 124 56 L 224 56 L 224 90 Q 196 116 124 56 Z"
        fill="url(#hatchFill3)"
        stroke={accent}
        strokeWidth={1.2}
      />

      {/* Existing terrain — bold continuous line over both zones */}
      <path
        d="M 16 56 Q 68 -8 124 56 Q 196 116 224 90"
        stroke={INK}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />

      {/* Target final grade — bold dashed */}
      <line
        x1={16} y1={56} x2={224} y2={56}
        stroke={INK} strokeWidth={1.8} strokeDasharray="6 4"
      />

      {/* Big CUT label — sits inside the cut zone, below the terrain peak,
          above the target grade line */}
      <text
        x={50} y={44}
        fontSize={14} fontWeight={800} fill={accent}
        fontFamily="ui-monospace, monospace" letterSpacing={0.5}
      >
        CUT
      </text>

      {/* Big FILL label — sits inside the fill zone, below the target line,
          above the terrain valley */}
      <text
        x={172} y={86}
        fontSize={14} fontWeight={800} fill={accent}
        fontFamily="ui-monospace, monospace" letterSpacing={0.5}
      >
        FILL
      </text>

      {/* Bold material-movement arrow — cut → fill, ends above the FILL label */}
      <path
        d="M 88 26 Q 130 -6 168 64"
        stroke={accent}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <polygon points="168,60 174,72 162,72" fill={accent} />
    </svg>
  );
}

const ILLUSTRATIONS = [
  RegradeIllustration,
  BlockWallIllustration,
  CutFillIllustration,
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
      {/* Main card with rainbow gradient border */}
      <div
        className="rounded-2xl p-[2px] shrink-0 relative"
        style={{
          background: TRIMBLE_RAINBOW,
          boxShadow:
            '0px 8px 24px rgba(0,0,0,0.18), 0px 2px 6px rgba(0,0,0,0.1)',
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
