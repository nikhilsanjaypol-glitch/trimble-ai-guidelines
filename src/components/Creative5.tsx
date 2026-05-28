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
 *     · A 2×2 grid of four divergent bridge concepts spanning the
 *       same river — each rendered as a side ELEVATION (not a
 *       plan) so the structural form reads at a glance:
 *         01 · Steel box girder       — low, multi-span
 *         02 · Steel tied arch        — single-span landmark
 *         03 · Cable-stayed (1 pylon) — long-span, asymmetric
 *         04 · Steel Warren truss     — triangulated, robust
 *     · Footer with Previous-iteration / Recreate / Pick CTAs
 *
 *   Clicking any concept opens a detail modal with a larger
 *   elevation, key metrics, pros / trade-offs, and a "Use this
 *   direction" CTA — i.e. clicking a card opens something
 *   relevant.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

/* ── Data model ─────────────────────────────────────────────────── */

type OptionId = 'beam' | 'arch' | 'cableStay' | 'truss';

interface Metric {
  label: string;
  value: string;
}

interface SiteOption {
  id: OptionId;
  num: number;
  title: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  metrics: Metric[];
  pros: string[];
  tradeoff: string;
}

const OPTIONS: SiteOption[] = [
  {
    id: 'beam',
    num: 1,
    title: 'Steel box girder',
    subtitle: '3-span continuous · low profile',
    accent: 'var(--modus-wc-color-primary, #0063A7)',
    accentSoft: 'rgba(0, 99, 167, 0.14)',
    metrics: [
      { label: 'Main span', value: '120 m' },
      { label: 'Spans',     value: '3' },
      { label: 'Deck H',    value: '8 m' },
      { label: 'Est. cost', value: '$48M' },
    ],
    pros: [
      'Lowest unit cost of the four concepts',
      'Standard fabrication — no specialist contractor needed',
      'Shortest construction timeline (~18 months)',
    ],
    tradeoff: 'Two in-river piers — most aquatic disruption.',
  },
  {
    id: 'arch',
    num: 2,
    title: 'Steel tied arch',
    subtitle: 'Single span · landmark profile',
    accent: 'var(--modus-wc-color-status-success, #1e7e34)',
    accentSoft: 'rgba(30, 126, 52, 0.14)',
    metrics: [
      { label: 'Main span', value: '300 m' },
      { label: 'Arch rise', value: '60 m' },
      { label: 'Hangers',   value: '14' },
      { label: 'Est. cost', value: '$72M' },
    ],
    pros: [
      'No in-river piers — protects fish passage',
      'Iconic single-span profile — a regional landmark',
      'Lighter steel use than an equivalent truss',
    ],
    tradeoff: 'Highest upfront cost; sensitive to wind loads.',
  },
  {
    id: 'cableStay',
    num: 3,
    title: 'Cable-stayed (single pylon)',
    subtitle: 'Asymmetric · 130 m pylon',
    accent: 'var(--modus-wc-color-status-info, #004f83)',
    accentSoft: 'rgba(0, 79, 131, 0.14)',
    metrics: [
      { label: 'Main span', value: '380 m' },
      { label: 'Pylon H',   value: '130 m' },
      { label: 'Cables',    value: '20 stays' },
      { label: 'Est. cost', value: '$96M' },
    ],
    pros: [
      'Longest clear span of the four concepts',
      'Strong visual identity from kilometres away',
      'Most efficient deck weight per metre',
    ],
    tradeoff: 'Most expensive; longest design + construction lead time.',
  },
  {
    id: 'truss',
    num: 4,
    title: 'Steel Warren truss',
    subtitle: 'Through-truss · two in-river piers',
    accent: 'var(--modus-wc-color-status-warning, #856404)',
    accentSoft: 'rgba(133, 100, 4, 0.14)',
    metrics: [
      { label: 'Main span', value: '140 m' },
      { label: 'Spans',     value: '3' },
      { label: 'Truss H',   value: '32 m' },
      { label: 'Est. cost', value: '$58M' },
    ],
    pros: [
      'Highest stiffness — best for rail or mixed loads',
      'All-bolted shop fabrication — fast erection',
      'Material-honest, industrial visual character',
    ],
    tradeoff: 'Bulky superstructure obstructs upstream sightlines.',
  },
];

/* ── CAD-style bridge elevation SVGs ────────────────────────────── */

const PAPER = '#ffffff';
const GRID_MAJOR = '#dfe2e8';
const INK = '#1d232b';
const INK_LIGHT = '#5a6270';
const DIM = '#0063a7';
const HATCH = '#2f3a47';
const BANK = '#d8d2c0';

function ScaleBar({ x, y, label = '100 m' }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={12} height={3} fill={INK} />
      <rect x={x + 12} y={y} width={12} height={3} fill={PAPER} stroke={INK} strokeWidth={0.6} />
      <rect x={x + 24} y={y} width={12} height={3} fill={INK} />
      <text x={x} y={y - 1.5} fontSize={4} fill={INK_LIGHT} fontFamily="ui-monospace, monospace">0</text>
      <text x={x + 36} y={y - 1.5} fontSize={4} fill={INK_LIGHT} textAnchor="end" fontFamily="ui-monospace, monospace">{label}</text>
    </g>
  );
}

function CarScale({ x, y }: { x: number; y: number }) {
  // Tiny side-on car silhouette for scale (sits on top of the deck)
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-3.5} y={-2.4} width={7} height={2.2} rx={0.4} fill={INK} />
      <rect x={-2.6} y={-3.6} width={3.4} height={1.4} rx={0.3} fill={INK} />
      <circle cx={-2.2} cy={0.1} r={0.7} fill={INK} />
      <circle cx={2.2}  cy={0.1} r={0.7} fill={INK} />
    </g>
  );
}

function SitePlanSVG({ option, large = false }: { option: SiteOption; large?: boolean }) {
  const W = 320;
  const H = 180;
  const id = option.id;
  const uid = `${id}-${large ? 'lg' : 'sm'}`;
  const hatchId = `hatch-${uid}`;
  const waterId = `water-${uid}`;

  // Shared elevation geometry
  const DECK_Y = 80;           // top of deck
  const DECK_T = 4;            // deck thickness
  const DECK_BOT = DECK_Y + DECK_T;
  const GROUND_Y = 144;        // water level / ground line
  const BANK_L = 38;           // left abutment edge
  const BANK_R = 282;          // right abutment edge
  const SPAN = BANK_R - BANK_L;

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
        <pattern id={hatchId} width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={4} height={4} fill={PAPER} />
          <line x1={0} y1={0} x2={0} y2={4} stroke={HATCH} strokeWidth={0.8} />
        </pattern>
        <pattern id={waterId} width={20} height={8} patternUnits="userSpaceOnUse">
          <rect width={20} height={8} fill="rgba(0,99,167,0.10)" />
          <path d="M 0 4 Q 5 2 10 4 T 20 4" fill="none" stroke="rgba(0,99,167,0.45)" strokeWidth={0.5} />
        </pattern>
      </defs>

      {/* Sky / paper */}
      <rect x={0} y={0} width={W} height={H} fill={PAPER} />

      {/* Water */}
      <rect x={0} y={GROUND_Y} width={W} height={H - GROUND_Y} fill={`url(#${waterId})`} />
      <line x1={0} y1={GROUND_Y} x2={W} y2={GROUND_Y} stroke="rgba(0,99,167,0.65)" strokeWidth={0.7} />

      {/* Banks */}
      <path
        d={`M 0 ${GROUND_Y} L ${BANK_L} ${GROUND_Y} L ${BANK_L} ${DECK_BOT + 2} L 0 ${DECK_BOT + 6} Z`}
        fill={BANK}
        stroke={INK}
        strokeWidth={0.6}
      />
      <path
        d={`M ${W} ${GROUND_Y} L ${BANK_R} ${GROUND_Y} L ${BANK_R} ${DECK_BOT + 2} L ${W} ${DECK_BOT + 6} Z`}
        fill={BANK}
        stroke={INK}
        strokeWidth={0.6}
      />
      <text x={18} y={GROUND_Y - 2} fontSize={4} fill={INK_LIGHT} fontFamily="ui-monospace, monospace" letterSpacing={0.3}>
        WEST BANK
      </text>
      <text x={W - 18} y={GROUND_Y - 2} fontSize={4} fill={INK_LIGHT} fontFamily="ui-monospace, monospace" letterSpacing={0.3} textAnchor="end">
        EAST BANK
      </text>

      {/* Existing approach roads (dashed) */}
      <line x1={0} y1={DECK_Y + DECK_T / 2} x2={BANK_L} y2={DECK_Y + DECK_T / 2} stroke={INK_LIGHT} strokeWidth={0.6} strokeDasharray="3 2" />
      <line x1={BANK_R} y1={DECK_Y + DECK_T / 2} x2={W} y2={DECK_Y + DECK_T / 2} stroke={INK_LIGHT} strokeWidth={0.6} strokeDasharray="3 2" />

      {/* OPTION 1 — Steel box girder (3-span, low-profile) */}
      {id === 'beam' && (
        <g>
          {/* Deck */}
          <rect x={BANK_L} y={DECK_Y} width={SPAN} height={DECK_T} fill={option.accentSoft} stroke={option.accent} strokeWidth={1.1} />
          {/* Box girder below deck */}
          <rect x={BANK_L} y={DECK_BOT} width={SPAN} height={9} fill={option.accentSoft} stroke={option.accent} strokeWidth={1.2} />
          {[BANK_L + 20, BANK_L + 60, BANK_L + 100, BANK_L + 140, BANK_L + 180, BANK_L + 220].map((x) => (
            <line key={x} x1={x} y1={DECK_BOT + 0.5} x2={x} y2={DECK_BOT + 8.5} stroke={option.accent} strokeWidth={0.5} />
          ))}
          {/* Two in-river piers (1/3 and 2/3) */}
          {[BANK_L + SPAN / 3, BANK_L + (2 * SPAN) / 3].map((x, i) => (
            <g key={i}>
              <rect x={x - 3.5} y={DECK_BOT + 9} width={7} height={GROUND_Y - DECK_BOT - 9} fill={`url(#${hatchId})`} stroke={INK} strokeWidth={0.8} />
              {/* Pier cap */}
              <rect x={x - 5} y={DECK_BOT + 9} width={10} height={2.5} fill={INK} />
              {/* Submerged footing */}
              <rect x={x - 7} y={GROUND_Y - 1} width={14} height={3.5} fill={INK} />
            </g>
          ))}
          {/* Bridge type caption */}
          <text x={W / 2} y={DECK_Y - 5} fontSize={4.2} fontWeight={700} fill={option.accent} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.5}>
            STEEL BOX GIRDER · 3-SPAN CONTINUOUS
          </text>
        </g>
      )}

      {/* OPTION 2 — Steel tied arch (single span, arch above deck) */}
      {id === 'arch' && (
        <g>
          {/* Abutments */}
          {[BANK_L - 6, BANK_R].map((x, i) => (
            <rect key={i} x={x} y={DECK_Y - 4} width={6} height={GROUND_Y - DECK_Y + 6} fill={`url(#${hatchId})`} stroke={INK} strokeWidth={0.8} />
          ))}
          {/* Arch — parabolic curve above deck */}
          <path
            d={`M ${BANK_L} ${DECK_Y} Q ${BANK_L + SPAN / 2} 14 ${BANK_R} ${DECK_Y}`}
            fill="none"
            stroke={option.accent}
            strokeWidth={3.2}
            strokeLinecap="round"
          />
          {/* Hangers from arch down to deck */}
          {Array.from({ length: 11 }, (_, i) => BANK_L + ((i + 1) * SPAN) / 12).map((x, i) => {
            const t = (x - BANK_L) / SPAN;
            const archY = DECK_Y - (DECK_Y - 14) * 4 * t * (1 - t);
            return <line key={i} x1={x} y1={archY + 0.5} x2={x} y2={DECK_Y} stroke={option.accent} strokeWidth={0.7} />;
          })}
          {/* Deck */}
          <rect x={BANK_L} y={DECK_Y} width={SPAN} height={DECK_T} fill={option.accentSoft} stroke={option.accent} strokeWidth={1.2} />
          {/* Caption */}
          <text x={W / 2} y={20} fontSize={4.2} fontWeight={700} fill={option.accent} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.5}>
            STEEL TIED ARCH · SINGLE SPAN
          </text>
          {/* Arch-rise dimension */}
          <line x1={BANK_L + SPAN / 2 - 2} y1={14} x2={BANK_L + SPAN / 2 - 2} y2={DECK_Y} stroke={DIM} strokeWidth={0.5} strokeDasharray="2 1.5" />
          <text x={BANK_L + SPAN / 2 + 2} y={(14 + DECK_Y) / 2} fontSize={4} fill={DIM} fontFamily="ui-monospace, monospace">RISE 60 m</text>
        </g>
      )}

      {/* OPTION 3 — Cable-stayed, single pylon (asymmetric, tall pylon) */}
      {id === 'cableStay' && (
        <g>
          {/* Abutments */}
          {[BANK_L - 6, BANK_R].map((x, i) => (
            <rect key={i} x={x} y={DECK_Y - 4} width={6} height={GROUND_Y - DECK_Y + 6} fill={`url(#${hatchId})`} stroke={INK} strokeWidth={0.8} />
          ))}
          {/* Single pylon at ~1/3 of span (off-centre = asymmetric) */}
          {(() => {
            const px = BANK_L + SPAN * 0.36;
            const pTop = 12;
            return (
              <g>
                {/* Pylon (slight A-frame in elevation: tapered) */}
                <path d={`M ${px - 2.5} ${GROUND_Y} L ${px - 1} ${pTop} L ${px + 1} ${pTop} L ${px + 2.5} ${GROUND_Y} Z`} fill={INK} />
                {/* Pylon foundation in water */}
                <rect x={px - 8} y={GROUND_Y - 1} width={16} height={3.5} fill={INK} />
                {/* Back-stay cables (shorter, behind pylon) */}
                {Array.from({ length: 5 }, (_, i) => BANK_L + 12 + i * 12).map((x, i) => (
                  <line key={`b-${i}`} x1={px} y1={pTop + 1} x2={x} y2={DECK_Y - 1} stroke={option.accent} strokeWidth={0.7} />
                ))}
                {/* Forward-stay cables (longer, fanning across main span) */}
                {Array.from({ length: 12 }, (_, i) => px + 16 + i * 18).filter((x) => x < BANK_R - 4).map((x, i) => (
                  <line key={`f-${i}`} x1={px} y1={pTop + 1} x2={x} y2={DECK_Y - 1} stroke={option.accent} strokeWidth={0.7} />
                ))}
              </g>
            );
          })()}
          {/* Deck */}
          <rect x={BANK_L} y={DECK_Y} width={SPAN} height={DECK_T} fill={option.accentSoft} stroke={option.accent} strokeWidth={1.2} />
          {/* Caption */}
          <text x={W / 2} y={20} fontSize={4.2} fontWeight={700} fill={option.accent} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.5}>
            SINGLE-PYLON CABLE-STAY · ASYMMETRIC
          </text>
          {/* Pylon-height dimension */}
          <text x={BANK_L + SPAN * 0.36 + 5} y={28} fontSize={4} fill={DIM} fontFamily="ui-monospace, monospace">PYLON 130 m</text>
        </g>
      )}

      {/* OPTION 4 — Steel Warren through-truss */}
      {id === 'truss' && (
        <g>
          {/* Abutments */}
          {[BANK_L - 6, BANK_R].map((x, i) => (
            <rect key={i} x={x} y={42} width={6} height={GROUND_Y - 42 + 6} fill={`url(#${hatchId})`} stroke={INK} strokeWidth={0.8} />
          ))}
          {/* Two in-river piers (smaller than girder version) */}
          {[BANK_L + SPAN / 3, BANK_L + (2 * SPAN) / 3].map((x, i) => (
            <g key={i}>
              <rect x={x - 3} y={DECK_BOT} width={6} height={GROUND_Y - DECK_BOT} fill={`url(#${hatchId})`} stroke={INK} strokeWidth={0.7} />
              <rect x={x - 6} y={GROUND_Y - 1} width={12} height={3.5} fill={INK} />
            </g>
          ))}
          {/* Top chord */}
          <line x1={BANK_L} y1={42} x2={BANK_R} y2={42} stroke={option.accent} strokeWidth={1.6} />
          {/* Bottom chord (above deck level) */}
          <line x1={BANK_L} y1={DECK_Y} x2={BANK_R} y2={DECK_Y} stroke={option.accent} strokeWidth={1.6} />
          {/* Vertical posts every 30 units */}
          {Array.from({ length: 9 }, (_, i) => BANK_L + i * 30).map((x) => (
            <line key={`v-${x}`} x1={x} y1={42} x2={x} y2={DECK_Y} stroke={option.accent} strokeWidth={1} />
          ))}
          {/* Diagonal bracing — Warren pattern (alternating triangles) */}
          {Array.from({ length: 8 }, (_, i) => BANK_L + i * 30).map((x, i) => (
            i % 2 === 0
              ? <line key={`d-${i}`} x1={x} y1={42} x2={x + 30} y2={DECK_Y} stroke={option.accent} strokeWidth={1} />
              : <line key={`d-${i}`} x1={x} y1={DECK_Y} x2={x + 30} y2={42} stroke={option.accent} strokeWidth={1} />
          ))}
          {/* Deck */}
          <rect x={BANK_L} y={DECK_Y} width={SPAN} height={DECK_T} fill={option.accentSoft} stroke={option.accent} strokeWidth={1.2} />
          {/* Caption */}
          <text x={W / 2} y={36} fontSize={4.2} fontWeight={700} fill={option.accent} textAnchor="middle" fontFamily="ui-monospace, monospace" letterSpacing={0.5}>
            STEEL WARREN THROUGH-TRUSS
          </text>
        </g>
      )}

      {/* Tiny vehicle on the deck for scale */}
      <CarScale x={id === 'cableStay' ? BANK_L + 60 : id === 'truss' ? BANK_L + 90 : 160} y={DECK_Y} />

      {/* Main span dimension below the structure */}
      <g>
        <line x1={BANK_L} y1={GROUND_Y + 16} x2={BANK_R} y2={GROUND_Y + 16} stroke={DIM} strokeWidth={0.55} />
        <line x1={BANK_L} y1={GROUND_Y + 14} x2={BANK_L} y2={GROUND_Y + 18} stroke={DIM} strokeWidth={0.55} />
        <line x1={BANK_R} y1={GROUND_Y + 14} x2={BANK_R} y2={GROUND_Y + 18} stroke={DIM} strokeWidth={0.55} />
        <text x={W / 2} y={GROUND_Y + 14} fontSize={4.5} fill={DIM} textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight={600}>
          {option.metrics[0].value} · MAIN SPAN
        </text>
      </g>

      {/* Flow direction */}
      <text x={W - 8} y={GROUND_Y + 8} fontSize={4} fill="rgba(0,99,167,0.85)" textAnchor="end" fontStyle="italic" fontFamily="ui-monospace, monospace">
        FLOW →
      </text>

      <ScaleBar x={18} y={H - 6} label="100 m" />
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
            <span style={{ fontWeight: 700, color: INK }}>BR-0{option.num}</span>
            <span>·</span>
            <span>BRIDGE ELEVATION</span>
            <span>·</span>
            <span>1:1500</span>
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
          <span style={{ fontWeight: 700, color: INK }}>BR-0{option.num}</span>
          <span>·</span>
          <span>1:1500</span>
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
                Four divergent bridge concepts
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
              Use this direction
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
