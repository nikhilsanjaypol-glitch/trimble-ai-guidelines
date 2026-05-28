import { useState } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Guideline: OFFER BREADTH
 *   Offer divergent creative options — distinct, diverse takes
 *   (not tiny variations) — so the professional feels in a position
 *   to steer the creative direction of the work.
 *
 * Component: AI-SUGGESTION POPUP → DETAIL
 *   The popup card contains:
 *     · Header with logo / instructional strip / close
 *     · A 2×2 grid of four divergent material/finish directions
 *       for the same hospitality interior, each rendered as a
 *       moodboard of 6 swatches with material textures
 *       (wood grain, stone veining, velvet weave, brass gradient,
 *       terrazzo chips, cork dots, glass highlights)
 *     · Footer with Previous-iteration / Recreate / Pick CTAs
 *
 *   Clicking any board opens a detail modal with a larger plan,
 *   key metrics, pros / trade-offs, and "Use this direction" —
 *   i.e. clicking a card opens something relevant.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

/* ── Data model ─────────────────────────────────────────────────── */

type OptionId = 'coastal' | 'heritage' | 'industrial' | 'biophilic';

type TextureKind =
  | 'plain'
  | 'wood'
  | 'stone'
  | 'concrete'
  | 'velvet'
  | 'weave'
  | 'terrazzo'
  | 'cork'
  | 'metal'
  | 'glass';

interface Metric {
  label: string;
  value: string;
}

interface MaterialSwatch {
  name: string;
  hex: string;
  texture: TextureKind;
}

interface SiteOption {
  id: OptionId;
  num: number;
  title: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  // Exactly 6 swatches: [hero, side-top, side-bottom, bottom-1, bottom-2, bottom-3]
  swatches: MaterialSwatch[];
  metrics: Metric[];
  pros: string[];
  tradeoff: string;
}

const OPTIONS: SiteOption[] = [
  {
    id: 'coastal',
    num: 1,
    title: 'Coastal calm',
    subtitle: 'Soft sand · sea glass · weathered oak',
    accent: '#5D8CAF',
    accentSoft: 'rgba(93, 140, 175, 0.12)',
    swatches: [
      { name: 'Linen sand',     hex: '#E7DCC9', texture: 'concrete' },
      { name: 'Sea glass',      hex: '#A8C0CC', texture: 'glass' },
      { name: 'Driftwood oak',  hex: '#C2A57B', texture: 'wood' },
      { name: 'Deep navy',      hex: '#2D4A5E', texture: 'plain' },
      { name: 'Salt white',     hex: '#FBFAF5', texture: 'plain' },
      { name: 'Limestone',      hex: '#D9D5CB', texture: 'stone' },
    ],
    metrics: [
      { label: 'Warmth', value: 'Cool' },
      { label: 'Mood',   value: 'Calm' },
      { label: 'Maint.', value: 'Low' },
      { label: 'Budget', value: '$$' },
    ],
    pros: [
      'Maximises perceived light and openness',
      'Soft, natural materials feel restorative',
      'Forgiving palette — easy to retouch over time',
    ],
    tradeoff: 'Risks reading as bland in winter light or under heavy shade.',
  },
  {
    id: 'heritage',
    num: 2,
    title: 'Heritage warmth',
    subtitle: 'Burgundy velvet · brass · walnut',
    accent: '#6A1F2F',
    accentSoft: 'rgba(106, 31, 47, 0.12)',
    swatches: [
      { name: 'Burgundy velvet', hex: '#6A1F2F', texture: 'velvet' },
      { name: 'Brushed brass',   hex: '#B89763', texture: 'metal' },
      { name: 'Walnut',          hex: '#4A2F1F', texture: 'wood' },
      { name: 'Ivory marble',    hex: '#F4EDDC', texture: 'stone' },
      { name: 'Emerald',         hex: '#1F4A3A', texture: 'velvet' },
      { name: 'Cognac leather',  hex: '#8B3A26', texture: 'weave' },
    ],
    metrics: [
      { label: 'Warmth', value: 'Warm' },
      { label: 'Mood',   value: 'Intimate' },
      { label: 'Maint.', value: 'High' },
      { label: 'Budget', value: '$$$' },
    ],
    pros: [
      'Strongest sense of occasion of the four',
      'Pairs beautifully with low, warm lighting',
      'Distinctive — hard to confuse with a competitor',
    ],
    tradeoff: 'Darker overall; needs careful lighting and feels heavy in raw daylight.',
  },
  {
    id: 'industrial',
    num: 3,
    title: 'Industrial edge',
    subtitle: 'Concrete · blackened steel · copper',
    accent: '#383838',
    accentSoft: 'rgba(56, 56, 56, 0.10)',
    swatches: [
      { name: 'Polished concrete', hex: '#6E6E6E', texture: 'concrete' },
      { name: 'Blackened steel',   hex: '#1A1A1C', texture: 'metal' },
      { name: 'Weathered oak',     hex: '#6B5340', texture: 'wood' },
      { name: 'Burnt copper',      hex: '#B26B3F', texture: 'metal' },
      { name: 'Frosted glass',     hex: '#C8CCCF', texture: 'glass' },
      { name: 'Charcoal felt',     hex: '#3A3A3D', texture: 'velvet' },
    ],
    metrics: [
      { label: 'Warmth', value: 'Cool' },
      { label: 'Mood',   value: 'Bold' },
      { label: 'Maint.', value: 'Low' },
      { label: 'Budget', value: '$$' },
    ],
    pros: [
      'Most contemporary read — photographs well',
      'Hides wear; very forgiving in high-traffic zones',
      'Lets art and product imagery dominate the room',
    ],
    tradeoff: 'Can feel cold or generic in large volumes without warm accents.',
  },
  {
    id: 'biophilic',
    num: 4,
    title: 'Biophilic lush',
    subtitle: 'Forest green · terracotta · cork',
    accent: '#2E5840',
    accentSoft: 'rgba(46, 88, 64, 0.12)',
    swatches: [
      { name: 'Forest velvet', hex: '#2E5840', texture: 'velvet' },
      { name: 'Terracotta',    hex: '#C2613B', texture: 'stone' },
      { name: 'Cork',          hex: '#B89D7A', texture: 'cork' },
      { name: 'Blush plaster', hex: '#E8C2A5', texture: 'plain' },
      { name: 'Terrazzo',      hex: '#D4C5A8', texture: 'terrazzo' },
      { name: 'Brushed brass', hex: '#B89B5F', texture: 'metal' },
    ],
    metrics: [
      { label: 'Warmth', value: 'Warm' },
      { label: 'Mood',   value: 'Vital' },
      { label: 'Maint.', value: 'Med.' },
      { label: 'Budget', value: '$$' },
    ],
    pros: [
      'Most energising of the four',
      'Strong sustainability + biophilia story',
      'Palette photographs differently in every light',
    ],
    tradeoff: 'High chroma — small spaces can feel busy if mis-edited.',
  },
];

/* ── Material-board SVGs (colour swatches with textures) ────────── */

const PAPER = '#ffffff';
const GRID_MAJOR = '#dfe2e8';
const INK = '#1d232b';
const INK_LIGHT = '#5a6270';
const BOARD_BG = '#F6F2E9';

function MaterialDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <pattern id={`tex-wood-${uid}`} width={3} height={9} patternUnits="userSpaceOnUse">
        <line x1={0} y1={3} x2={3} y2={3.3} stroke="rgba(0,0,0,0.24)" strokeWidth={0.45} />
        <line x1={0} y1={6} x2={3} y2={5.8} stroke="rgba(0,0,0,0.16)" strokeWidth={0.32} />
        <line x1={0} y1={8.5} x2={3} y2={8.7} stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />
      </pattern>
      <pattern id={`tex-stone-${uid}`} width={22} height={22} patternUnits="userSpaceOnUse">
        <path d="M 0 7 Q 11 4 22 8" fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth={0.45} />
        <path d="M 0 15 Q 11 17 22 13" fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth={0.45} />
        <path d="M 5 0 Q 7 11 4 22" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={0.3} />
      </pattern>
      <pattern id={`tex-concrete-${uid}`} width={5} height={5} patternUnits="userSpaceOnUse">
        <circle cx={0.6} cy={0.6} r={0.28} fill="rgba(0,0,0,0.20)" />
        <circle cx={3.2} cy={3.4} r={0.24} fill="rgba(0,0,0,0.14)" />
        <circle cx={1.6} cy={3.8} r={0.22} fill="rgba(255,255,255,0.18)" />
        <circle cx={4.2} cy={1.2} r={0.2}  fill="rgba(0,0,0,0.10)" />
      </pattern>
      <pattern id={`tex-velvet-${uid}`} width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
        <line x1={0} y1={0} x2={0} y2={4} stroke="rgba(255,255,255,0.07)" strokeWidth={0.55} />
        <line x1={2} y1={0} x2={2} y2={4} stroke="rgba(0,0,0,0.22)" strokeWidth={0.4} />
      </pattern>
      <pattern id={`tex-weave-${uid}`} width={3} height={3} patternUnits="userSpaceOnUse">
        <line x1={0} y1={0} x2={3} y2={3} stroke="rgba(0,0,0,0.18)" strokeWidth={0.4} />
        <line x1={0} y1={3} x2={3} y2={0} stroke="rgba(255,255,255,0.12)" strokeWidth={0.35} />
      </pattern>
      <pattern id={`tex-terrazzo-${uid}`} width={16} height={16} patternUnits="userSpaceOnUse">
        <polygon points="2,2 5,1 6,4 3,5" fill="rgba(0,0,0,0.24)" />
        <polygon points="9,5 12,4 13,7 10,8" fill="rgba(255,255,255,0.45)" />
        <polygon points="3,9 6,8 7,11 4,12" fill="rgba(40,80,160,0.32)" />
        <polygon points="11,11 14,10 14,14 11,14" fill="rgba(180,100,40,0.32)" />
        <polygon points="1,12 3,11 3,14 1,14" fill="rgba(255,255,255,0.3)" />
      </pattern>
      <pattern id={`tex-cork-${uid}`} width={7} height={7} patternUnits="userSpaceOnUse">
        <circle cx={2} cy={2} r={0.75} fill="rgba(0,0,0,0.30)" />
        <circle cx={5} cy={4.5} r={0.55} fill="rgba(0,0,0,0.20)" />
        <circle cx={1.2} cy={5.5} r={0.45} fill="rgba(0,0,0,0.24)" />
        <circle cx={6} cy={1.5} r={0.32} fill="rgba(0,0,0,0.18)" />
        <circle cx={3.5} cy={3.5} r={0.25} fill="rgba(255,255,255,0.14)" />
      </pattern>
      <linearGradient id={`tex-metal-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.48)" />
        <stop offset="35%"  stopColor="rgba(255,255,255,0)" />
        <stop offset="70%"  stopColor="rgba(0,0,0,0.05)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.34)" />
      </linearGradient>
      <linearGradient id={`tex-glass-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
        <stop offset="45%"  stopColor="rgba(255,255,255,0.08)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
      </linearGradient>
      <linearGradient id={`bezel-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.18)" />
        <stop offset="30%"  stopColor="rgba(255,255,255,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.16)" />
      </linearGradient>
    </defs>
  );
}

function Swatch({
  x, y, w, h, swatch, uid,
}: {
  x: number; y: number; w: number; h: number;
  swatch: MaterialSwatch;
  uid: string;
}) {
  const labelH = h >= 80 ? 13 : 11;
  const swH = h - labelH;
  const nameSize = h >= 80 ? 5 : 4.1;
  const hexSize = h >= 80 ? 4 : 3.5;
  const textured = swatch.texture !== 'plain';

  return (
    <g>
      <rect x={x} y={y} width={w} height={swH} fill={swatch.hex} />
      {textured && (
        <rect x={x} y={y} width={w} height={swH} fill={`url(#tex-${swatch.texture}-${uid})`} />
      )}
      <rect x={x} y={y} width={w} height={swH} fill={`url(#bezel-${uid})`} />

      <rect x={x} y={y + swH} width={w} height={labelH} fill="rgba(0,0,0,0.86)" />
      <text
        x={x + 4}
        y={y + swH + labelH - 3.5}
        fontSize={nameSize}
        fill="#ffffff"
        fontFamily="ui-monospace, monospace"
        fontWeight={600}
        letterSpacing={0.3}
      >
        {swatch.name.toUpperCase()}
      </text>
      <text
        x={x + w - 4}
        y={y + swH + labelH - 3.5}
        fontSize={hexSize}
        fill="rgba(255,255,255,0.6)"
        fontFamily="ui-monospace, monospace"
        textAnchor="end"
      >
        {swatch.hex}
      </text>

      <rect
        x={x} y={y} width={w} height={h}
        fill="none"
        stroke="rgba(0,0,0,0.20)"
        strokeWidth={0.45}
      />
    </g>
  );
}

function SitePlanSVG({ option, large = false }: { option: SiteOption; large?: boolean }) {
  const W = 320;
  const H = 180;
  const uid = `${option.id}-${large ? 'lg' : 'sm'}`;
  const s = option.swatches;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ display: 'block', backgroundColor: BOARD_BG }}
    >
      <MaterialDefs uid={uid} />

      {/* Board (warm paper) */}
      <rect x={0} y={0} width={W} height={H} fill={BOARD_BG} />

      {/* Header strip — mood name + sheet id */}
      <text
        x={6}
        y={10}
        fontSize={5.4}
        fontWeight={700}
        fill={INK}
        fontFamily="ui-monospace, monospace"
        letterSpacing={0.7}
      >
        {option.title.toUpperCase()} · MATERIAL BOARD
      </text>
      <text
        x={W - 6}
        y={10}
        fontSize={4.5}
        fill={INK_LIGHT}
        fontFamily="ui-monospace, monospace"
        textAnchor="end"
        letterSpacing={0.3}
      >
        MB-0{option.num}
      </text>

      {/* Swatch grid — hero left, two stacked right, three across bottom */}
      <Swatch x={6}   y={16}  w={150} h={100} swatch={s[0]} uid={uid} />
      <Swatch x={160} y={16}  w={154} h={48}  swatch={s[1]} uid={uid} />
      <Swatch x={160} y={68}  w={154} h={48}  swatch={s[2]} uid={uid} />
      <Swatch x={6}   y={120} w={72}  h={50}  swatch={s[3]} uid={uid} />
      <Swatch x={82}  y={120} w={72}  h={50}  swatch={s[4]} uid={uid} />
      <Swatch x={158} y={120} w={156} h={50}  swatch={s[5]} uid={uid} />

      {/* Accent stripe + subtitle */}
      <rect x={6} y={173} width={W - 12} height={1.8} fill={option.accent} />
      <text
        x={6}
        y={178.5}
        fontSize={3.6}
        fill={INK_LIGHT}
        fontFamily="ui-monospace, monospace"
        letterSpacing={0.4}
      >
        {option.subtitle.toUpperCase()}
      </text>
    </svg>
  );
}

/* ── Detail modal (opens on option click) ──────────────────────── */

function DetailModal({
  option,
  onClose,
  onDevelop,
}: {
  option: SiteOption;
  onClose: () => void;
  onDevelop: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: '560px',
          maxHeight: '90vh',
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-3"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex items-center justify-center rounded-full font-semibold shrink-0"
              style={{
                width: '24px',
                height: '24px',
                fontSize: '12px',
                backgroundColor: option.accentSoft,
                color: option.accent,
              }}
            >
              {option.num}
            </span>
            <div className="flex flex-col min-w-0">
              <span
                className="font-semibold truncate"
                style={{
                  fontSize: 'var(--modus-wc-font-size-md, 16px)',
                  color: 'var(--modus-wc-color-base-content, #101828)',
                  lineHeight: 1.2,
                }}
              >
                {option.title}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-7 rounded hover:bg-[var(--modus-wc-color-base-200)]"
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <ModusWcIcon
              name="close"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
            />
          </button>
        </div>

        {/* CAD preview */}
        <div
          className="relative"
          style={{
            backgroundColor: PAPER,
            borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            aspectRatio: '16 / 9',
          }}
        >
          <SitePlanSVG option={option} large />
          <div
            className="absolute bottom-1.5 right-1.5 flex items-center gap-1.5 px-1.5 py-0.5"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              border: `1px solid ${GRID_MAJOR}`,
              fontSize: '9px',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.4px',
              color: INK_LIGHT,
            }}
          >
            <span style={{ fontWeight: 700, color: INK }}>MB-0{option.num}</span>
            <span>·</span>
            <span>MATERIAL BOARD</span>
            <span>·</span>
            <span>LOBBY · L01</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">
          {/* Metrics row */}
          <div className="grid grid-cols-4 gap-2">
            {option.metrics.map((m) => (
              <div
                key={m.label}
                className="flex flex-col gap-0.5 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)' }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                  }}
                >
                  {m.label}
                </span>
                <span
                  className="font-semibold"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 13.5px)',
                    color: 'var(--modus-wc-color-base-content, #101828)',
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Pros */}
          <div className="flex flex-col gap-2">
            <span
              className="font-semibold"
              style={{
                fontSize: '11px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
              }}
            >
              Why this direction
            </span>
            <div className="flex flex-col gap-1.5">
              {option.pros.map((p) => (
                <div key={p} className="flex items-start gap-2">
                  <ModusWcIcon
                    name="check"
                    size="xs"
                    decorative
                    style={{ color: option.accent, marginTop: '3px', flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 13.5px)',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                      lineHeight: 1.45,
                    }}
                  >
                    {p}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trade-off */}
          <div
            className="flex items-start gap-2 p-2.5 rounded-lg"
            style={{ backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)' }}
          >
            <ModusWcIcon
              name="alert_outline"
              size="xs"
              decorative
              style={{
                color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)',
                marginTop: '2px',
                flexShrink: 0,
              }}
            />
            <div className="flex flex-col gap-0.5">
              <span
                className="font-semibold"
                style={{
                  fontSize: '10px',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                Trade-off
              </span>
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                  lineHeight: 1.45,
                }}
              >
                {option.tradeoff}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <ModusWcButton size="sm" color="tertiary" variant="outlined" onButtonClick={onClose}>
            Back to options
          </ModusWcButton>
          <div className="flex-1" />
          <ModusWcButton size="sm" color="tertiary" variant="outlined" onButtonClick={onClose}>
            <span className="flex items-center gap-1">
              <ModusWcIcon name="bookmark" size="xs" decorative />
              Save
            </span>
          </ModusWcButton>
          <ModusWcButton size="sm" color="primary" onButtonClick={onDevelop}>
            <span className="flex items-center gap-1">
              <ModusWcIcon name="arrow_right" size="xs" decorative />
              Use this direction
            </span>
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ── Option card (mini CAD preview + caption) ──────────────────── */

function OptionCard({
  option,
  onOpen,
}: {
  option: SiteOption;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col text-left rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        transition:
          'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow =
          '0 8px 20px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)';
      }}
      aria-label={`Option ${option.num}: ${option.title}`}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          backgroundColor: PAPER,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <SitePlanSVG option={option} />

        {/* CAD title block */}
        <div
          className="absolute bottom-0 right-0 flex items-center gap-1 px-1.5 py-0.5"
          style={{
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderTop: `1px solid ${GRID_MAJOR}`,
            borderLeft: `1px solid ${GRID_MAJOR}`,
            fontSize: '8px',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.4px',
            color: INK_LIGHT,
          }}
        >
          <span style={{ fontWeight: 700, color: INK }}>MB-0{option.num}</span>
          <span>·</span>
          <span>LOBBY · L01</span>
        </div>

        {/* Number badge */}
        <span
          className="absolute top-2 left-2 flex items-center justify-center rounded-full font-semibold"
          style={{
            width: '20px',
            height: '20px',
            fontSize: '11px',
            backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
            color: option.accent,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        >
          {option.num}
        </span>

      </div>

      <div className="flex flex-col px-3 py-2.5">
        <span
          className="font-semibold truncate"
          style={{
            fontSize: 'var(--modus-wc-font-size-md, 16px)',
            color: 'var(--modus-wc-color-base-content, #101828)',
            lineHeight: 1.25,
          }}
        >
          {option.num}. {option.title}
        </span>
      </div>
    </button>
  );
}

/* ── Tool button (small icon-only toolbar button) ───────────────── */

function ToolButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className="flex items-center justify-center rounded-md transition-colors"
      style={{
        width: '28px',
        height: '28px',
        backgroundColor: active
          ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
          : 'transparent',
        border: active
          ? '1px solid var(--modus-wc-color-primary, #0063A7)'
          : '1px solid transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.backgroundColor =
          'var(--modus-wc-color-base-100, #f1f1f6)';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <ModusWcIcon
        name={icon}
        size="sm"
        decorative
        style={{
          color: active
            ? 'var(--modus-wc-color-primary, #0063A7)'
            : 'var(--modus-wc-color-base-content, #364153)',
        }}
      />
    </button>
  );
}

/* ── Suggestion popup card ─────────────────────────────────────── */

function SuggestionPopup({
  onClose,
  onOpenDetail,
}: {
  onClose: () => void;
  onOpenDetail: (id: OptionId) => void;
}) {
  return (
    <div
      className="rounded-2xl p-[2px] relative"
      style={{
        background: TRIMBLE_RAINBOW,
        boxShadow: '0 20px 50px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.10)',
        width: '820px',
      }}
    >
      <div
        className="rounded-[14px] flex flex-col overflow-hidden relative"
        style={{ backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Trimble AI logo */}
            <span className="flex items-center justify-center shrink-0" style={{ width: '34px', height: '34px' }}>
              <svg viewBox="0 0 30.002 32.6797" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="tlogo-5popup" x1="3.7558" y1="10.5251" x2="20.4332" y2="30.2565" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF2BFC" />
                    <stop offset="0.628993" stopColor="#0563A7" />
                    <stop offset="1" stopColor="#075CA4" />
                  </linearGradient>
                </defs>
                <path
                  d="M1.69824 24.9697C3.48353 26.9109 5.82653 28.2524 8.4043 28.8096L1.69824 32.6797V24.9697ZM10.6523 5.60742C16.5357 5.60742 21.3057 10.3803 21.3057 16.2676C21.3055 22.1547 16.5356 26.9268 10.6523 26.9268C4.76928 26.9265 0.00017177 22.1545 0 16.2676C0 10.3805 4.76918 5.60766 10.6523 5.60742ZM10.6523 7.69238C5.9201 7.69263 2.08398 11.5321 2.08398 16.2676C2.08416 21.0029 5.92021 24.8416 10.6523 24.8418C15.3847 24.8418 19.2215 21.003 19.2217 16.2676C19.2217 11.532 15.3848 7.69238 10.6523 7.69238ZM30.002 16.3398L23.2803 20.2217C24.0854 17.7019 24.0922 14.9945 23.2998 12.4707L30.002 16.3398ZM8.35547 3.83691C5.79861 4.40439 3.47535 5.73916 1.69824 7.66309V0L8.35547 3.83691Z"
                  fill="url(#tlogo-5popup)"
                />
              </svg>
            </span>
            <div className="flex flex-col min-w-0">
              <span
                className="font-semibold truncate"
                style={{
                  fontSize: 'var(--modus-wc-font-size-lg, 18px)',
                  color: 'var(--modus-wc-color-base-content, #101828)',
                  lineHeight: 1.25,
                }}
              >
                Four divergent material directions
              </span>
            </div>
          </div>

          {/* Tool cluster */}
          <div className="flex items-center gap-1 shrink-0">
            <ToolButton icon="close" label="Close" onClick={onClose} />
          </div>
        </div>

        {/* Instruction strip — sits between header and grid */}
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          }}
        >
          <ModusWcIcon
            name="lightbulb"
            size="xs"
            decorative
            style={{
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          />
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 13px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              lineHeight: 1.4,
            }}
          >
            Pick the direction you want to develop — I&apos;ll detail it.
          </span>
        </div>

        {/* Body — option grid */}
        <div
          className="grid grid-cols-2 gap-3 px-4 py-4"
          style={{
            maxHeight: '620px',
            overflowY: 'auto',
          }}
        >
          {OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              option={opt}
              onOpen={() => onOpenDetail(opt.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <ModusWcButton size="sm" color="tertiary" variant="outlined" onButtonClick={() => undefined}>
            <span className="flex items-center gap-1">
              <ModusWcIcon name="history" size="xs" decorative />
              Previous iteration
            </span>
          </ModusWcButton>
          <div className="flex-1" />
          <ModusWcButton size="sm" color="tertiary" variant="outlined" onButtonClick={onClose}>
            <span className="flex items-center gap-1">
              <ModusWcIcon name="refresh" size="xs" decorative />
              Recreate
            </span>
          </ModusWcButton>
          <ModusWcButton size="sm" color="primary" onButtonClick={() => undefined}>
            <span className="flex items-center gap-1">
              <ModusWcIcon name="arrow_right" size="xs" decorative />
              Pick a direction
            </span>
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}


/* ── Host: the option board itself + detail modal ───────────────
 *   No trigger — the card is the component example. Clicking any
 *   option opens its detail modal.
 * ───────────────────────────────────────────────────────────────── */

export default function Creative5() {
  const [detailId, setDetailId] = useState<OptionId | null>(null);

  const detail = detailId ? OPTIONS.find((o) => o.id === detailId) ?? null : null;

  return (
    <>
      <SuggestionPopup
        onClose={() => undefined}
        onOpenDetail={(id) => setDetailId(id)}
      />

      {detail && (
        <DetailModal
          option={detail}
          onClose={() => setDetailId(null)}
          onDevelop={() => setDetailId(null)}
        />
      )}
    </>
  );
}
