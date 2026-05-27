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
 *     · Header with view-toggle / regenerate / save / close tools
 *     · A 2×2 grid of four divergent site-layout options, each
 *       rendered as a CAD plan
 *     · Footer with a "Recreate" CTA and a tap-to-develop hint
 *
 *   Clicking any option opens a detail modal with a larger CAD
 *   plan, key metrics, pros / trade-offs, and "Use this direction"
 *   action — i.e. clicking a card opens something relevant.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

/* ── Data model ─────────────────────────────────────────────────── */

type OptionId =
  | 'tower'
  | 'courtyard'
  | 'linear'
  | 'reuse'
  | 'radial'
  | 'mat';

type Family = 'vertical' | 'low-rise' | 'adaptive';

interface Metric {
  label: string;
  value: string;
}

interface SiteOption {
  id: OptionId;
  num: number;
  title: string;
  family: Family;
  accent: string;
  accentSoft: string;
  metrics: Metric[];
  pros: string[];
  tradeoff: string;
}

const OPTIONS: SiteOption[] = [
  {
    id: 'tower',
    num: 1,
    title: 'Compact tower',
    family: 'vertical',
    accent: 'var(--modus-wc-color-primary, #0063A7)',
    accentSoft: 'var(--modus-wc-color-primary-light, #e8f4fd)',
    metrics: [
      { label: 'GFA', value: '12,400 m²' },
      { label: 'Footprint', value: '8% of site' },
      { label: 'Height', value: '6 storeys' },
      { label: 'Open space', value: '62%' },
    ],
    pros: [
      'Smallest footprint of the four',
      'Most visibility from the boulevard',
      'Frees the rest of the site for landscape',
    ],
    tradeoff: 'Higher per-floor cost; less daylight to interior floors.',
  },
  {
    id: 'courtyard',
    num: 2,
    title: 'Courtyard cluster',
    family: 'low-rise',
    accent: 'var(--modus-wc-color-status-success, #1e7e34)',
    accentSoft: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
    metrics: [
      { label: 'GFA', value: '11,800 m²' },
      { label: 'Buildings', value: '4 pavilions' },
      { label: 'Height', value: '2 storeys' },
      { label: 'Open space', value: '38%' },
    ],
    pros: [
      'Phaseable — build one pavilion at a time',
      'Natural daylight to every workspace',
      'Strong indoor–outdoor connection',
    ],
    tradeoff: 'Largest site coverage; longest construction timeline.',
  },
  {
    id: 'linear',
    num: 3,
    title: 'Linear bar',
    family: 'low-rise',
    accent: 'var(--modus-wc-color-status-info, #004f83)',
    accentSoft: 'var(--modus-wc-color-status-info-light, #e8f4fd)',
    metrics: [
      { label: 'GFA', value: '12,100 m²' },
      { label: 'Length', value: '264 m' },
      { label: 'Height', value: '3 storeys' },
      { label: 'Parking', value: '18 stalls' },
    ],
    pros: [
      'Strongest street presence along Main St',
      'Simple structural grid lowers build cost',
      'Generous entrance plaza',
    ],
    tradeoff: 'Long internal corridors; weak rear-yard activation.',
  },
  {
    id: 'reuse',
    num: 4,
    title: 'Reuse + new wing',
    family: 'adaptive',
    accent: 'var(--modus-wc-color-status-warning, #856404)',
    accentSoft: 'var(--modus-wc-color-status-warning-light, #fff8e1)',
    metrics: [
      { label: 'GFA', value: '13,600 m²' },
      { label: 'Existing', value: '1947 warehouse' },
      { label: 'New', value: 'CLT frame' },
      { label: 'Carbon', value: '−38% vs new build' },
    ],
    pros: [
      'Preserves embodied carbon in the existing shell',
      'Eligible for heritage tax credits',
      'Distinctive brand identity from day one',
    ],
    tradeoff: 'Hidden structural condition risk; more coordination.',
  },
];

/* ── CAD-style site plan SVGs ───────────────────────────────────── */

const PAPER = '#ffffff';
const GRID_MINOR = '#eef0f4';
const GRID_MAJOR = '#dfe2e8';
const INK = '#1d232b';
const INK_LIGHT = '#5a6270';
const DIM = '#0063a7';
const HATCH = '#2f3a47';
const ROAD = '#cdd1d8';

function HatchedRect({
  x, y, w, h, hatchId, stroke = INK, strokeWidth = 1.2,
}: {
  x: number; y: number; w: number; h: number;
  hatchId: string; stroke?: string; strokeWidth?: number;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${hatchId})`} />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
}

function NorthArrow({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill={PAPER} stroke={INK} strokeWidth={0.9} />
      <polygon points={`${cx},${cy - 6} ${cx - 3},${cy + 2} ${cx + 3},${cy + 2}`} fill={INK} />
      <text x={cx} y={cy + 7.5} fontSize={5} fontWeight={700} textAnchor="middle" fill={INK}>N</text>
    </g>
  );
}

function ScaleBar({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={12} height={3} fill={INK} />
      <rect x={x + 12} y={y} width={12} height={3} fill={PAPER} stroke={INK} strokeWidth={0.6} />
      <rect x={x + 24} y={y} width={12} height={3} fill={INK} />
      <text x={x} y={y - 1.5} fontSize={4} fill={INK_LIGHT} fontFamily="ui-monospace, monospace">0</text>
      <text x={x + 36} y={y - 1.5} fontSize={4} fill={INK_LIGHT} textAnchor="end" fontFamily="ui-monospace, monospace">30m</text>
    </g>
  );
}

function Tree({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={2.4} fill="none" stroke={INK_LIGHT} strokeWidth={0.5} />
      <line x1={cx - 1.7} y1={cy - 1.7} x2={cx + 1.7} y2={cy + 1.7} stroke={INK_LIGHT} strokeWidth={0.4} />
      <line x1={cx - 1.7} y1={cy + 1.7} x2={cx + 1.7} y2={cy - 1.7} stroke={INK_LIGHT} strokeWidth={0.4} />
    </g>
  );
}

function DimH({ x1, x2, y, text }: { x1: number; x2: number; y: number; text: string }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={DIM} strokeWidth={0.5} />
      <line x1={x1} y1={y - 1.5} x2={x1} y2={y + 1.5} stroke={DIM} strokeWidth={0.5} />
      <line x1={x2} y1={y - 1.5} x2={x2} y2={y + 1.5} stroke={DIM} strokeWidth={0.5} />
      <text x={(x1 + x2) / 2} y={y - 1.8} fontSize={4.5} fill={DIM} textAnchor="middle" fontFamily="ui-monospace, monospace">
        {text}
      </text>
    </g>
  );
}

function SitePlanSVG({ option, large = false }: { option: SiteOption; large?: boolean }) {
  const W = 320;
  const H = 180;
  const id = option.id;
  const uid = `${id}-${large ? 'lg' : 'sm'}`;
  const hatchId = `hatch-${uid}`;
  const hatchAltId = `hatchAlt-${uid}`;
  const gridId = `grid-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ display: 'block', backgroundColor: PAPER }}
    >
      <defs>
        <pattern id={gridId} width={10} height={10} patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke={GRID_MINOR} strokeWidth={0.5} />
        </pattern>
        <pattern id={hatchId} width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={4} height={4} fill={PAPER} />
          <line x1={0} y1={0} x2={0} y2={4} stroke={HATCH} strokeWidth={0.8} />
        </pattern>
        <pattern id={hatchAltId} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
          <rect width={5} height={5} fill={PAPER} />
          <line x1={0} y1={0} x2={0} y2={5} stroke={option.accent} strokeWidth={0.6} />
        </pattern>
      </defs>

      {/* Paper + grid */}
      <rect x={0} y={0} width={W} height={H} fill={PAPER} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${gridId})`} />
      {Array.from({ length: Math.floor(W / 50) }, (_, i) => (i + 1) * 50).map((x) => (
        <line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={H} stroke={GRID_MAJOR} strokeWidth={0.6} />
      ))}
      {Array.from({ length: Math.floor(H / 50) }, (_, i) => (i + 1) * 50).map((y) => (
        <line key={`gy-${y}`} x1={0} y1={y} x2={W} y2={y} stroke={GRID_MAJOR} strokeWidth={0.6} />
      ))}

      {/* Property line */}
      <rect x={16} y={16} width={W - 32} height={H - 50} fill="none" stroke={INK} strokeWidth={1.1} strokeDasharray="6 2 1 2" />

      {/* Road */}
      <rect x={0} y={H - 18} width={W} height={18} fill={ROAD} />
      <line x1={0} y1={H - 9} x2={W} y2={H - 9} stroke={PAPER} strokeWidth={0.8} strokeDasharray="8 8" />
      <text x={W - 8} y={H - 4} fontSize={5} fill={INK_LIGHT} textAnchor="end" fontFamily="ui-monospace, monospace" letterSpacing={0.5}>
        MAIN ST
      </text>

      {/* OPTION 1 — Tower */}
      {id === 'tower' && (
        <g>
          <HatchedRect x={132} y={56} w={42} h={42} hatchId={hatchId} />
          <text x={153} y={80} fontSize={5.5} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.4}>TOWER</text>
          <text x={153} y={88} fontSize={4.2} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">6 STOREYS</text>
          <rect x={146} y={98} width={14} height={44} fill={ROAD} />
          <rect x={196} y={102} width={88} height={40} fill="none" stroke={INK} strokeWidth={0.9} />
          {[210, 224, 238, 252, 266, 280].map((x) => (
            <line key={x} x1={x} y1={102} x2={x} y2={142} stroke={INK} strokeWidth={0.5} />
          ))}
          <text x={240} y={117} fontSize={4.2} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">PARKING (6)</text>
          <DimH x1={16} x2={132} y={50} text="42.0" />
          <DimH x1={174} x2={304} y={50} text="46.0" />
          {[28, 44, 60, 76, 92, 108, 212, 228, 244, 260, 276, 292].map((x) => (
            <Tree key={`t-${x}`} cx={x} cy={28} />
          ))}
          {[28, 44, 60, 76, 92, 108].map((x) => <Tree key={`b-${x}`} cx={x} cy={120} />)}
        </g>
      )}

      {/* OPTION 2 — Courtyard */}
      {id === 'courtyard' && (
        <g>
          <HatchedRect x={86} y={36} w={48} h={32} hatchId={hatchId} />
          <HatchedRect x={186} y={36} w={48} h={32} hatchId={hatchId} />
          <HatchedRect x={86} y={92} w={48} h={32} hatchId={hatchId} />
          <HatchedRect x={186} y={92} w={48} h={32} hatchId={hatchId} />
          <text x={110} y={56} fontSize={5} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace">A</text>
          <text x={210} y={56} fontSize={5} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace">B</text>
          <text x={110} y={112} fontSize={5} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace">C</text>
          <text x={210} y={112} fontSize={5} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace">D</text>
          <rect x={138} y={70} width={44} height={50} fill="none" stroke={INK} strokeWidth={0.9} strokeDasharray="2 2" />
          {[78, 88, 98, 108, 118].map((y) => (
            <line key={`ch-${y}`} x1={138} y1={y} x2={182} y2={y} stroke={INK_LIGHT} strokeWidth={0.3} />
          ))}
          <text x={160} y={98} fontSize={4} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">COURT</text>
          {[52, 56, 108, 112].map((y) => (
            <line key={`hp-${y}`} x1={134} y1={y} x2={186} y2={y} stroke={INK} strokeWidth={0.5} />
          ))}
          {[158, 162].map((x) => (
            <line key={`vp-${x}`} x1={x} y1={68} x2={x} y2={124} stroke={INK} strokeWidth={0.5} />
          ))}
          <rect x={154} y={124} width={12} height={20} fill={ROAD} />
          <DimH x1={86} x2={234} y={30} text="148.0" />
          {[28, 44, 60, 260, 276, 292].map((x) => <Tree key={`tt-${x}`} cx={x} cy={28} />)}
          {[28, 44, 260, 276, 292].map((x) => <Tree key={`bt-${x}`} cx={x} cy={132} />)}
        </g>
      )}

      {/* OPTION 3 — Linear */}
      {id === 'linear' && (
        <g>
          <HatchedRect x={28} y={48} w={264} h={28} hatchId={hatchId} />
          {[48, 78, 108, 138, 168, 198, 228, 258, 288].map((x) => (
            <g key={`c-${x}`}>
              <circle cx={x} cy={54} r={1.2} fill={INK} />
              <circle cx={x} cy={70} r={1.2} fill={INK} />
            </g>
          ))}
          <text x={160} y={66} fontSize={5.5} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.4}>LINEAR BAR · 3 STOREYS</text>
          <rect x={28} y={80} width={264} height={14} fill="none" stroke={INK_LIGHT} strokeWidth={0.6} strokeDasharray="3 2" />
          {[58, 88, 118, 148, 178, 208, 238, 268].map((x) => (
            <line key={`pv-${x}`} x1={x} y1={80} x2={x} y2={94} stroke={INK_LIGHT} strokeWidth={0.3} />
          ))}
          <text x={160} y={90} fontSize={4} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">ENTRANCE PLAZA</text>
          <rect x={28} y={104} width={264} height={28} fill="none" stroke={INK} strokeWidth={0.9} />
          {Array.from({ length: 18 }, (_, i) => 42 + i * 14).map((x) => (
            <line key={`pk-${x}`} x1={x} y1={104} x2={x} y2={132} stroke={INK} strokeWidth={0.5} />
          ))}
          <text x={160} y={120} fontSize={4.2} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">PARKING (18)</text>
          <DimH x1={28} x2={292} y={42} text="264.0" />
        </g>
      )}

      {/* OPTION 4 — Reuse */}
      {id === 'reuse' && (
        <g>
          <HatchedRect x={28} y={40} w={120} h={82} hatchId={hatchId} stroke={INK} strokeWidth={1.6} />
          <text x={88} y={70} fontSize={5.2} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.5}>EXISTING</text>
          <text x={88} y={78} fontSize={4.2} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">WAREHOUSE · 1947</text>
          <rect x={148} y={64} width={26} height={34} fill={PAPER} stroke={INK} strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={161} y={84} fontSize={3.6} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">LINK</text>
          <polygon points="174,46 296,58 296,108 174,118" fill={`url(#${hatchAltId})`} stroke={option.accent} strokeWidth={1.4} />
          <text x={235} y={78} fontSize={5.2} fontWeight={700} fill={option.accent} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.5}>NEW WING</text>
          <text x={235} y={86} fontSize={4.2} fill={option.accent} textAnchor="middle" fontFamily="ui-monospace, monospace">2026 · CLT FRAME</text>
          <DimH x1={28} x2={148} y={34} text="120.0" />
          <DimH x1={174} x2={296} y={34} text="122.0" />
          {[36, 52, 248, 268, 288].map((x) => <Tree key={`tt-${x}`} cx={x} cy={132} />)}
        </g>
      )}

      {/* OPTION 5 — Radial Hub */}
      {id === 'radial' && (
        <g>
          {/* Central hub (hexagon) */}
          <polygon
            points="160,62 180,72 180,92 160,102 140,92 140,72"
            fill={`url(#${hatchId})`}
            stroke={INK}
            strokeWidth={1.4}
          />
          <text x={160} y={85} fontSize={5} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.4}>HUB</text>

          {/* 4 wings radiating */}
          <HatchedRect x={80} y={42} w={48} h={18} hatchId={hatchId} />
          <HatchedRect x={192} y={42} w={48} h={18} hatchId={hatchId} />
          <HatchedRect x={80} y={104} w={48} h={18} hatchId={hatchId} />
          <HatchedRect x={192} y={104} w={48} h={18} hatchId={hatchId} />
          <text x={104} y={54} fontSize={4.2} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace">A</text>
          <text x={216} y={54} fontSize={4.2} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace">B</text>
          <text x={104} y={116} fontSize={4.2} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace">C</text>
          <text x={216} y={116} fontSize={4.2} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace">D</text>

          {/* Spokes — dashed walkways */}
          <line x1={128} y1={51} x2={150} y2={70} stroke={INK} strokeWidth={0.7} strokeDasharray="2 1.5" />
          <line x1={192} y1={51} x2={170} y2={70} stroke={INK} strokeWidth={0.7} strokeDasharray="2 1.5" />
          <line x1={128} y1={113} x2={150} y2={94} stroke={INK} strokeWidth={0.7} strokeDasharray="2 1.5" />
          <line x1={192} y1={113} x2={170} y2={94} stroke={INK} strokeWidth={0.7} strokeDasharray="2 1.5" />

          {/* Driveway */}
          <rect x={154} y={102} width={12} height={42} fill={ROAD} />
          <DimH x1={80} x2={240} y={32} text="160.0" />
          {[28, 44, 280, 296].map((x) => <Tree key={`tr-${x}`} cx={x} cy={28} />)}
          {[28, 44, 280, 296].map((x) => <Tree key={`br-${x}`} cx={x} cy={132} />)}
        </g>
      )}

      {/* OPTION 6 — Mat building */}
      {id === 'mat' && (
        <g>
          {/* Big mat footprint */}
          <HatchedRect x={28} y={32} w={264} h={104} hatchId={hatchId} stroke={INK} strokeWidth={1.4} />
          {/* 3 internal light courts (cut-outs shown as PAPER fill) */}
          <rect x={62} y={56} width={48} height={28} fill={PAPER} stroke={INK} strokeWidth={0.9} strokeDasharray="2 2" />
          <text x={86} y={73} fontSize={3.8} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">COURT 1</text>
          <rect x={134} y={84} width={52} height={32} fill={PAPER} stroke={INK} strokeWidth={0.9} strokeDasharray="2 2" />
          <text x={160} y={103} fontSize={3.8} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">COURT 2</text>
          <rect x={210} y={56} width={48} height={28} fill={PAPER} stroke={INK} strokeWidth={0.9} strokeDasharray="2 2" />
          <text x={234} y={73} fontSize={3.8} fill={INK_LIGHT} textAnchor="middle" fontFamily="ui-monospace, monospace">COURT 3</text>

          {/* Structural grid columns */}
          {[48, 70, 92, 114, 136, 158, 180, 202, 224, 246, 268].flatMap((x) =>
            [42, 70, 98, 126].map((y) => <circle key={`col-${x}-${y}`} cx={x} cy={y} r={0.8} fill={INK} />)
          )}

          {/* Label */}
          <text x={160} y={48} fontSize={5.2} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.4}>
            MAT BUILDING · 1 STOREY
          </text>

          {/* Tiny entry */}
          <rect x={154} y={136} width={12} height={8} fill={ROAD} />
        </g>
      )}

      <NorthArrow cx={W - 22} cy={26} />
      <ScaleBar x={20} y={148} />
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
            <span style={{ fontWeight: 700, color: INK }}>SK-0{option.num}</span>
            <span>·</span>
            <span>SITE PLAN</span>
            <span>·</span>
            <span>1:500</span>
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
          <span style={{ fontWeight: 700, color: INK }}>SK-0{option.num}</span>
          <span>·</span>
          <span>1:500</span>
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

      <div className="flex flex-col px-3 py-2">
        <span
          className="font-semibold truncate"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 13.5px)',
            color: 'var(--modus-wc-color-base-content, #101828)',
            lineHeight: 1.2,
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
            {/* Mini Trimble AI logo */}
            <span className="flex items-center justify-center shrink-0" style={{ width: '22px', height: '22px' }}>
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
                Four divergent site layouts
              </span>
              <span
                className="truncate"
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  margin: 0,
                  lineHeight: 1.35,
                }}
              >
                Pick the direction you want to develop — I&apos;ll detail it.
              </span>
            </div>
          </div>

          {/* Tool cluster */}
          <div className="flex items-center gap-1 shrink-0">
            <ToolButton icon="refresh" label="Regenerate options" onClick={() => undefined} />
            <ToolButton icon="bookmark" label="Save this set" onClick={() => undefined} />
            <span
              aria-hidden="true"
              style={{
                width: '1px',
                height: '18px',
                backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)',
                margin: '0 4px',
              }}
            />
            <ToolButton icon="close" label="Close" onClick={onClose} />
          </div>
        </div>

        {/* Body — option grid (or list) */}
        <div
          className="grid grid-cols-2 gap-3 px-4 py-4"
          style={{
            maxHeight: '620px',
            overflowY: 'auto',
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
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
          <ModusWcButton size="sm" color="tertiary" variant="outlined" onButtonClick={onClose}>
            <span className="flex items-center gap-1">
              <ModusWcIcon name="refresh" size="xs" decorative />
              Recreate
            </span>
          </ModusWcButton>
          <div className="flex-1" />
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
