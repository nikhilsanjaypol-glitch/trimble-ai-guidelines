import { useEffect, useMemo, useRef, useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

/* ── Guideline ─── ALLOW EDITABLE OUTPUTS ──────────────────────
 * The professional asked the AI to draft a Type V exterior wall
 * for an office tower. The AI returns a real CAD-detail of the
 * assembly. Every material strip is a manipulable graphical
 * component — swap by clicking, resize by dragging, insert at
 * any boundary, remove with the trash. Dimensions reflow,
 * callouts re-position, R-value / cost / code-check recompute
 * live. The same assembly hands off to SketchUp, Tekla
 * Structures, Trimble Connect, and WinEst.
 * ─────────────────────────────────────────────────────────────── */

/* ── Code requirement ──────────────────────────────────────────── */
const CODE = {
  rMin: 21,
  label: 'IECC 2024 — Zone 5 — R-21 CI minimum',
};

/* ── Materials catalog ─────────────────────────────────────────── */
type CategoryId = 'cladding' | 'rigid' | 'masonry' | 'cavity' | 'gypsum';

interface Material {
  id: string;
  name: string;
  shortName: string;
  category: CategoryId;
  rPerInch: number;
  costPerInchPerSf: number;
  patternId: string;
  accentColor: string;
  defaultThicknessIn: number;
  minThicknessIn: number;
  maxThicknessIn: number;
  thicknessStepIn: number;
  fireRated?: boolean;
}

const MATERIALS: Material[] = [
  // Cladding
  {
    id: 'brick',
    name: 'Brick veneer',
    shortName: 'Brick',
    category: 'cladding',
    rPerInch: 0.2,
    costPerInchPerSf: 3.5,
    patternId: 'pat-brick',
    accentColor: '#a3552c',
    defaultThicknessIn: 4,
    minThicknessIn: 3.5,
    maxThicknessIn: 4.5,
    thicknessStepIn: 0.25,
  },
  {
    id: 'stone',
    name: 'Stone veneer',
    shortName: 'Stone',
    category: 'cladding',
    rPerInch: 0.08,
    costPerInchPerSf: 5.5,
    patternId: 'pat-stone',
    accentColor: '#8a7d6e',
    defaultThicknessIn: 4,
    minThicknessIn: 3,
    maxThicknessIn: 5,
    thicknessStepIn: 0.5,
  },
  {
    id: 'metal',
    name: 'Metal panel',
    shortName: 'Metal panel',
    category: 'cladding',
    rPerInch: 0.05,
    costPerInchPerSf: 6,
    patternId: 'pat-metal',
    accentColor: '#5a6470',
    defaultThicknessIn: 1.5,
    minThicknessIn: 0.75,
    maxThicknessIn: 2,
    thicknessStepIn: 0.25,
  },
  // Rigid CI
  {
    id: 'mineralwool-ci',
    name: 'Mineral wool CI',
    shortName: 'MW rigid',
    category: 'rigid',
    rPerInch: 4.2,
    costPerInchPerSf: 1.0,
    patternId: 'pat-mineralwool',
    accentColor: '#c7a86a',
    defaultThicknessIn: 4,
    minThicknessIn: 2,
    maxThicknessIn: 6,
    thicknessStepIn: 0.5,
    fireRated: true,
  },
  {
    id: 'xps',
    name: 'XPS rigid foam',
    shortName: 'XPS',
    category: 'rigid',
    rPerInch: 5,
    costPerInchPerSf: 0.9,
    patternId: 'pat-xps',
    accentColor: '#3d8bbf',
    defaultThicknessIn: 3,
    minThicknessIn: 1,
    maxThicknessIn: 6,
    thicknessStepIn: 0.5,
  },
  {
    id: 'polyiso',
    name: 'Polyiso rigid',
    shortName: 'Polyiso',
    category: 'rigid',
    rPerInch: 6,
    costPerInchPerSf: 1.1,
    patternId: 'pat-polyiso',
    accentColor: '#d4a574',
    defaultThicknessIn: 3,
    minThicknessIn: 1,
    maxThicknessIn: 5,
    thicknessStepIn: 0.5,
  },
  // Masonry
  {
    id: 'cmu',
    name: 'CMU 8" (1-hr fire)',
    shortName: 'CMU',
    category: 'masonry',
    rPerInch: 0.14,
    costPerInchPerSf: 1.25,
    patternId: 'pat-cmu',
    accentColor: '#6e7280',
    defaultThicknessIn: 8,
    minThicknessIn: 6,
    maxThicknessIn: 12,
    thicknessStepIn: 2,
    fireRated: true,
  },
  // Cavity
  {
    id: 'stud-batt-r13',
    name: 'Steel stud + R-13 batt',
    shortName: 'R-13 stud',
    category: 'cavity',
    rPerInch: 3.7,
    costPerInchPerSf: 1.3,
    patternId: 'pat-batt',
    accentColor: '#d68080',
    defaultThicknessIn: 3.5,
    minThicknessIn: 3.5,
    maxThicknessIn: 6,
    thicknessStepIn: 0.5,
  },
  {
    id: 'stud-mw-r15',
    name: 'Steel stud + R-15 MW batt',
    shortName: 'R-15 stud',
    category: 'cavity',
    rPerInch: 4.3,
    costPerInchPerSf: 1.45,
    patternId: 'pat-batt-mw',
    accentColor: '#c46e6e',
    defaultThicknessIn: 3.5,
    minThicknessIn: 3.5,
    maxThicknessIn: 6,
    thicknessStepIn: 0.5,
  },
  // Gypsum
  {
    id: 'gyp-58-x',
    name: 'Gypsum 5/8" Type X',
    shortName: 'GWB 5/8" X',
    category: 'gypsum',
    rPerInch: 0.9,
    costPerInchPerSf: 2.4,
    patternId: 'pat-gypsum',
    accentColor: '#dcd5c8',
    defaultThicknessIn: 0.625,
    minThicknessIn: 0.5,
    maxThicknessIn: 1.25,
    thicknessStepIn: 0.125,
    fireRated: true,
  },
  {
    id: 'gyp-12',
    name: 'Gypsum 1/2" standard',
    shortName: 'GWB 1/2"',
    category: 'gypsum',
    rPerInch: 0.9,
    costPerInchPerSf: 2.2,
    patternId: 'pat-gypsum',
    accentColor: '#e6dfd3',
    defaultThicknessIn: 0.5,
    minThicknessIn: 0.375,
    maxThicknessIn: 0.625,
    thicknessStepIn: 0.125,
  },
];

const MATERIAL_BY_ID: Record<string, Material> = Object.fromEntries(
  MATERIALS.map((m) => [m.id, m]),
);

const CATEGORY_LABELS: Record<CategoryId, string> = {
  cladding: 'Cladding',
  rigid: 'Continuous insulation',
  masonry: 'Masonry / backup',
  cavity: 'Cavity assembly',
  gypsum: 'Interior finish',
};

/* ── Layers & state ────────────────────────────────────────────── */
interface Layer {
  id: string;
  materialId: string;
  thicknessIn: number;
}

const INITIAL_LAYERS: Layer[] = [
  { id: 'L1', materialId: 'brick',          thicknessIn: 4     },
  { id: 'L2', materialId: 'mineralwool-ci', thicknessIn: 4     },
  { id: 'L3', materialId: 'cmu',            thicknessIn: 8     },
  { id: 'L4', materialId: 'stud-mw-r15',    thicknessIn: 3.5   },
  { id: 'L5', materialId: 'gyp-58-x',       thicknessIn: 0.625 },
];

const AIR_FILM_R = 0.85;

const AI_BRIEF =
  'Draft a Type V exterior wall — Climate Zone 5, R-21 CI minimum, masonry face, 1-hr fire rated.';

/* ── Native tools (handoff) ───────────────────────────────────── */
interface NativeTool {
  id: string;
  label: string;
  format: string;
  accent: string;
}

const NATIVE_TOOLS: NativeTool[] = [
  { id: 'sketchup', label: 'SketchUp',         format: '.skp',  accent: 'var(--modus-wc-color-status-danger, #c84a3f)' },
  { id: 'tekla',    label: 'Tekla Structures', format: '.ifc',  accent: 'var(--modus-wc-color-primary, #0063A3)' },
  { id: 'connect',  label: 'Trimble Connect',  format: 'cloud', accent: 'var(--modus-wc-color-status-info, #009AFE)' },
  { id: 'winest',   label: 'WinEst',           format: '.est',  accent: 'var(--modus-wc-color-status-success, #1e7e34)' },
];

/* ── Drawing geometry constants ────────────────────────────────── */
const VIEW_W = 720;
const VIEW_H = 320;
const DRAW_LEFT = 28;
const DRAW_RIGHT = 432;          // layers occupy x = 28..432 (404 wide)
const DRAW_TOP = 64;
const DRAW_BOTTOM = 244;         // 180 tall layer band
const DIM_LINE_Y = 44;
const EXT_LABEL_Y = 268;
const CALLOUT_LEFT = 472;
const CALLOUT_ROW_H = 36;
const CALLOUT_TOP = 58;

const MAX_PPI = 22; // when wall is thin, do not over-stretch

function getPpi(totalIn: number): number {
  const drawWidth = DRAW_RIGHT - DRAW_LEFT;
  return Math.min(MAX_PPI, drawWidth / Math.max(totalIn, 0.1));
}

function fmtIn(value: number): string {
  // Render decimals as a mixed fraction-ish label, e.g. 4.25 -> 4¼"
  const whole = Math.floor(value);
  const frac = value - whole;
  const map: Record<string, string> = {
    '0':     '',
    '0.125': '⅛',
    '0.25':  '¼',
    '0.375': '⅜',
    '0.5':   '½',
    '0.625': '⅝',
    '0.75':  '¾',
    '0.875': '⅞',
  };
  const fracKey = frac.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  const fracStr = map[fracKey] ?? (frac > 0 ? frac.toFixed(2).replace(/^0/, '') : '');
  if (whole === 0 && !fracStr) return '0"';
  if (whole === 0) return `${fracStr}"`;
  return `${whole}${fracStr}"`;
}

function snapThickness(value: number, mat: Material): number {
  const step = mat.thicknessStepIn;
  const snapped = Math.round(value / step) * step;
  return Math.max(mat.minThicknessIn, Math.min(mat.maxThicknessIn, snapped));
}

/* ── Trimble AI sparkle logo ─────────────────────────────────── */
function TrimbleAiLogo({ size = 18 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
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
            id="trimbleAiLogoC1"
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
          fill="url(#trimbleAiLogoC1)"
        />
      </svg>
    </span>
  );
}

/* ── SVG hatch defs ────────────────────────────────────────────── */
function HatchDefs() {
  return (
    <defs>
      {/* brick: running-bond pattern */}
      <pattern id="pat-brick" width="22" height="14" patternUnits="userSpaceOnUse">
        <rect width="22" height="14" fill="#c4763d" opacity="0.35" />
        <rect x="0" y="0"  width="22" height="7" fill="none" stroke="#7c3a18" strokeWidth="0.7" />
        <rect x="0" y="7"  width="22" height="7" fill="none" stroke="#7c3a18" strokeWidth="0.7" />
        <line x1="11" y1="0" x2="11" y2="7" stroke="#7c3a18" strokeWidth="0.7" />
        <line x1="0"  y1="7" x2="0"  y2="14" stroke="#7c3a18" strokeWidth="0.7" />
        <line x1="22" y1="7" x2="22" y2="14" stroke="#7c3a18" strokeWidth="0.7" />
      </pattern>

      {/* stone: irregular polygons */}
      <pattern id="pat-stone" width="28" height="22" patternUnits="userSpaceOnUse">
        <rect width="28" height="22" fill="#a59885" opacity="0.35" />
        <path
          d="M 0 0 L 14 4 L 28 0 M 0 11 L 9 9 L 18 12 L 28 9 M 0 22 L 11 19 L 22 22 L 28 19"
          fill="none"
          stroke="#5b5044"
          strokeWidth="0.6"
        />
      </pattern>

      {/* metal panel: tight vertical lines + ribs */}
      <pattern id="pat-metal" width="6" height="8" patternUnits="userSpaceOnUse">
        <rect width="6" height="8" fill="#8a929b" opacity="0.3" />
        <line x1="0" y1="0" x2="0" y2="8" stroke="#2f3947" strokeWidth="0.6" />
        <line x1="3" y1="0" x2="3" y2="8" stroke="#2f3947" strokeWidth="0.4" opacity="0.5" />
      </pattern>

      {/* mineral wool rigid: dense zig-zag */}
      <pattern id="pat-mineralwool" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#e8d8a8" opacity="0.5" />
        <path d="M 0 2 L 5 8 L 10 2 M 0 6 L 5 0 L 10 6" fill="none" stroke="#7d6630" strokeWidth="0.7" />
      </pattern>

      {/* XPS: dotted grid */}
      <pattern id="pat-xps" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#bcdaee" opacity="0.6" />
        <circle cx="2" cy="2" r="0.9" fill="#1f5e88" />
        <circle cx="6" cy="6" r="0.9" fill="#1f5e88" />
      </pattern>

      {/* polyiso: diagonal cross-hatch */}
      <pattern id="pat-polyiso" width="9" height="9" patternUnits="userSpaceOnUse">
        <rect width="9" height="9" fill="#f0d5b1" opacity="0.55" />
        <path d="M 0 9 L 9 0 M -2 2 L 2 -2 M 7 11 L 11 7" stroke="#8a5b1c" strokeWidth="0.6" />
        <path d="M 0 0 L 9 9 M -2 7 L 2 11 M 7 -2 L 11 2" stroke="#8a5b1c" strokeWidth="0.6" />
      </pattern>

      {/* CMU: stacked blocks with mortar grooves */}
      <pattern id="pat-cmu" width="32" height="20" patternUnits="userSpaceOnUse">
        <rect width="32" height="20" fill="#a8aeb6" opacity="0.4" />
        <rect x="0" y="0"  width="32" height="10" fill="none" stroke="#3d4655" strokeWidth="0.8" />
        <rect x="0" y="10" width="32" height="10" fill="none" stroke="#3d4655" strokeWidth="0.8" />
        <line x1="16" y1="0"  x2="16" y2="10" stroke="#3d4655" strokeWidth="0.8" />
        <line x1="0"  y1="10" x2="0"  y2="20" stroke="#3d4655" strokeWidth="0.8" />
        <line x1="32" y1="10" x2="32" y2="20" stroke="#3d4655" strokeWidth="0.8" />
        {/* mortar dimple */}
        <circle cx="8"  cy="5"  r="0.5" fill="#3d4655" opacity="0.4" />
        <circle cx="24" cy="5"  r="0.5" fill="#3d4655" opacity="0.4" />
        <circle cx="16" cy="15" r="0.5" fill="#3d4655" opacity="0.4" />
      </pattern>

      {/* batt insulation (fiberglass): wavy horizontal lines */}
      <pattern id="pat-batt" width="14" height="10" patternUnits="userSpaceOnUse">
        <rect width="14" height="10" fill="#f5cfcf" opacity="0.55" />
        <path d="M 0 3 Q 3.5 0  7 3 T 14 3" fill="none" stroke="#9a4a4a" strokeWidth="0.7" />
        <path d="M 0 7 Q 3.5 4  7 7 T 14 7" fill="none" stroke="#9a4a4a" strokeWidth="0.7" />
      </pattern>

      {/* mineral wool batt: tighter wavy lines */}
      <pattern id="pat-batt-mw" width="14" height="10" patternUnits="userSpaceOnUse">
        <rect width="14" height="10" fill="#eebcbc" opacity="0.55" />
        <path d="M 0 2 Q 3.5 -1  7 2 T 14 2" fill="none" stroke="#7a3535" strokeWidth="0.8" />
        <path d="M 0 5 Q 3.5  2  7 5 T 14 5" fill="none" stroke="#7a3535" strokeWidth="0.8" />
        <path d="M 0 8 Q 3.5  5  7 8 T 14 8" fill="none" stroke="#7a3535" strokeWidth="0.8" />
      </pattern>

      {/* gypsum: light stipple */}
      <pattern id="pat-gypsum" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#e8e1d2" opacity="0.55" />
        <circle cx="1.5" cy="1.5" r="0.4" fill="#6e6044" />
        <circle cx="4.5" cy="4.5" r="0.4" fill="#6e6044" />
      </pattern>
    </defs>
  );
}

/* ── Layer drawing helpers ─────────────────────────────────────── */
interface DrawLayer {
  layer: Layer;
  material: Material;
  startIn: number;
  endIn: number;
  startX: number;
  endX: number;
  midX: number;
  index: number;
}

function buildDrawLayers(layers: Layer[], ppi: number): DrawLayer[] {
  let cursor = DRAW_LEFT;
  let cursorIn = 0;
  return layers.map((l, index) => {
    const mat = MATERIAL_BY_ID[l.materialId];
    const widthPx = l.thicknessIn * ppi;
    const startX = cursor;
    const endX = cursor + widthPx;
    const startIn = cursorIn;
    const endIn = cursorIn + l.thicknessIn;
    cursor = endX;
    cursorIn = endIn;
    return {
      layer: l,
      material: mat,
      startIn,
      endIn,
      startX,
      endX,
      midX: (startX + endX) / 2,
      index,
    };
  });
}

/* ── Title block ───────────────────────────────────────────────── */
function TitleBlock({
  editCount,
  onReset,
  onDismiss,
}: {
  editCount: number;
  onReset: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="flex items-stretch"
      style={{
        borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
      }}
    >
      {/* Left column — detail metadata */}
      <div
        className="flex flex-col justify-center px-4 py-3 shrink-0"
        style={{
          width: 168,
          borderRight: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          backgroundColor: 'var(--modus-wc-color-base-100, #f8f9fb)',
        }}
      >
        <span
          className="font-mono font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.6px',
          }}
        >
          DETAIL A-501
        </span>
        <span
          className="font-semibold leading-tight"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            marginTop: 2,
          }}
        >
          EXTERIOR WALL
          <br />
          TYPE-1
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            marginTop: 6,
          }}
        >
          SCALE 1:4 · PLAN
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            marginTop: 1,
          }}
        >
          BROOKHAVEN PH-2
        </span>
      </div>

      {/* Right column — AI brief + actions */}
      <div className="flex flex-col flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <TrimbleAiLogo size={16} />
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                letterSpacing: '0.4px',
              }}
            >
              AI BRIEF · DRAFTED 18 SEC AGO
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {editCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="flex items-center justify-center rounded transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
                style={{
                  width: 22,
                  height: 22,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Reset to AI draft"
                title="Restore AI's original draft"
              >
                <ModusWcIcon
                  name="refresh"
                  size="xs"
                  decorative
                  style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                />
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="flex items-center justify-center rounded transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
              style={{
                width: 22,
                height: 22,
                background: 'transparent',
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
        <span
          className="leading-snug"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            marginTop: 4,
          }}
        >
          {AI_BRIEF}
        </span>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="font-mono font-semibold px-1.5 py-0.5 rounded"
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              letterSpacing: '0.4px',
            }}
          >
            REV 0 · DRAFT
          </span>
          <span
            className="font-semibold px-1.5 py-0.5 rounded"
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              backgroundColor: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
              color: 'var(--modus-wc-color-status-success, #1e7e34)',
              letterSpacing: '0.3px',
            }}
          >
            EDITABLE
          </span>
          {editCount > 0 && (
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              · {editCount} edit{editCount === 1 ? '' : 's'} on top of AI draft
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Material picker popover ───────────────────────────────────── */
interface PickerState {
  mode: 'swap' | 'insert';
  layerIndex: number; // for swap: index of layer; for insert: insert at this index
  anchorX: number;    // viewBox X
  showAll: boolean;
}

function MaterialPicker({
  state,
  layers,
  containerWidth,
  drawingTop,
  drawingHeight,
  onSwap,
  onInsert,
  onRemove,
  onClose,
  onToggleAll,
}: {
  state: PickerState;
  layers: Layer[];
  containerWidth: number;
  drawingTop: number;
  drawingHeight: number;
  onSwap: (materialId: string) => void;
  onInsert: (materialId: string) => void;
  onRemove: () => void;
  onClose: () => void;
  onToggleAll: () => void;
}) {
  const POPOVER_WIDTH = 264;
  const OUTER_PAD = 2;

  const currentLayer = state.mode === 'swap' ? layers[state.layerIndex] : null;
  const currentMaterial = currentLayer ? MATERIAL_BY_ID[currentLayer.materialId] : null;

  // Anchor: layer midX is in viewBox units. The SVG renders at the inner-card width
  // (= containerWidth - 2 * OUTER_PAD). Convert to HTML px relative to the outer card.
  const innerWidth = containerWidth - OUTER_PAD * 2;
  const svgScale = innerWidth / VIEW_W;
  const anchorPx = state.anchorX * svgScale + OUTER_PAD;
  const leftRaw = anchorPx - POPOVER_WIDTH / 2;
  const left = Math.max(8, Math.min(containerWidth - POPOVER_WIDTH - 8, leftRaw));
  const triangleLeft = Math.max(16, Math.min(POPOVER_WIDTH - 16, anchorPx - left));

  // Vertical: position popover just below the bottom of the layer rectangles
  // (DRAW_BOTTOM in viewBox units → HTML px on the rendered SVG).
  const layersBottomPx = (DRAW_BOTTOM / VIEW_H) * drawingHeight;
  const top = drawingTop + layersBottomPx + 12;

  const categoryAlts = MATERIALS.filter(
    (m) =>
      (currentMaterial ? m.category === currentMaterial.category : true) &&
      m.id !== currentMaterial?.id,
  );
  const otherCategories = MATERIALS.filter(
    (m) => currentMaterial && m.category !== currentMaterial.category,
  );

  const visible = state.showAll
    ? state.mode === 'insert'
      ? MATERIALS
      : [...categoryAlts, ...otherCategories]
    : state.mode === 'insert'
      ? MATERIALS.slice(0, 6)
      : categoryAlts.slice(0, 5);

  return (
    <>
      {/* Backdrop to capture clicks-outside (fixed so it covers the whole viewport) */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-10"
        style={{ background: 'transparent' }}
        aria-hidden
      />
      <div
        className="absolute z-20 rounded-lg overflow-hidden"
        style={{
          left,
          top,
          width: POPOVER_WIDTH,
          backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
        }}
      >
        {/* Triangle pointing UP toward the clicked layer */}
        <div
          className="absolute"
          style={{
            left: triangleLeft - 6,
            top: -7,
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '7px solid var(--modus-wc-color-base-page, #fff)',
            filter: 'drop-shadow(0 -1px 0 var(--modus-wc-color-base-200, #e0e1e9))',
          }}
        />

        {/* Header */}
        <div
          className="px-3 py-2"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-100, #f8f9fb)',
            borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          }}
        >
          <span
            className="font-semibold"
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              letterSpacing: '0.4px',
            }}
          >
            {state.mode === 'swap' ? 'SWAP MATERIAL' : 'INSERT NEW LAYER'}
          </span>
          {currentMaterial && (
            <div
              className="font-semibold mt-0.5"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              Currently: {currentMaterial.name}
            </div>
          )}
          {state.mode === 'insert' && (
            <div
              className="font-semibold mt-0.5"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              Insert at position {state.layerIndex + 1}
            </div>
          )}
        </div>

        {/* Options */}
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {visible.map((m) => {
            const deltaR =
              currentLayer && currentMaterial
                ? m.defaultThicknessIn * m.rPerInch -
                  currentLayer.thicknessIn * currentMaterial.rPerInch
                : m.defaultThicknessIn * m.rPerInch;
            const deltaSign = deltaR >= 0 ? '+' : '';
            const deltaColor =
              deltaR >= 0
                ? 'var(--modus-wc-color-status-success, #1e7e34)'
                : 'var(--modus-wc-color-status-danger, #c84a3f)';
            return (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  state.mode === 'swap' ? onSwap(m.id) : onInsert(m.id)
                }
                className="flex items-center w-full gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--modus-wc-color-base-200, #f1f1f6)',
                }}
              >
                <span
                  className="shrink-0 rounded"
                  style={{
                    width: 22,
                    height: 22,
                    background: m.accentColor,
                    opacity: 0.85,
                    border: '1px solid rgba(0,0,0,0.12)',
                  }}
                />
                <span className="flex flex-col min-w-0 flex-1">
                  <span
                    className="font-semibold truncate"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {m.name}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    }}
                  >
                    {CATEGORY_LABELS[m.category]} · R-{(m.defaultThicknessIn * m.rPerInch).toFixed(1)} · {fmtIn(m.defaultThicknessIn)}
                  </span>
                </span>
                {state.mode === 'swap' && (
                  <span
                    className="font-mono font-semibold shrink-0"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                      color: deltaColor,
                    }}
                  >
                    {deltaSign}{deltaR.toFixed(1)} R
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            backgroundColor: 'var(--modus-wc-color-base-100, #f8f9fb)',
          }}
        >
          <button
            type="button"
            onClick={onToggleAll}
            className="flex items-center gap-1"
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              color: 'var(--modus-wc-color-primary, #0063A3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {state.showAll ? 'Show fewer' : 'All materials'}
            <ModusWcIcon
              name={state.showAll ? 'caret_up' : 'caret_down'}
              size="xs"
              decorative
              style={{ color: 'var(--modus-wc-color-primary, #0063A3)' }}
            />
          </button>
          {state.mode === 'swap' && layers.length > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: 'var(--modus-wc-color-status-danger, #c84a3f)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <ModusWcIcon
                name="delete"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-status-danger, #c84a3f)' }}
              />
              Remove this layer
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Wall drawing (the big SVG) ────────────────────────────────── */
interface ResizeTooltip {
  layerIndex: number;
  thicknessIn: number;
  x: number;
  y: number;
}

function WallDrawing({
  drawLayers,
  totalIn,
  resizingIndex,
  resizeTooltip,
  activeIndex,
  hoverGapIndex,
  onLayerClick,
  onResizeStart,
  onInsertClick,
  onGapHover,
  svgRef,
}: {
  drawLayers: DrawLayer[];
  totalIn: number;
  resizingIndex: number | null;
  resizeTooltip: ResizeTooltip | null;
  activeIndex: number | null;
  hoverGapIndex: number | null;
  onLayerClick: (index: number, midX: number) => void;
  onResizeStart: (index: number, e: React.MouseEvent) => void;
  onInsertClick: (index: number, x: number) => void;
  onGapHover: (
    next: number | null | ((cur: number | null) => number | null),
  ) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  // Build callout positions (top-to-bottom in layer order = exterior at top)
  const calloutRows = drawLayers.map((dl, i) => ({
    ...dl,
    calloutY: CALLOUT_TOP + i * CALLOUT_ROW_H + CALLOUT_ROW_H / 2,
  }));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      style={{
        display: 'block',
        userSelect: 'none',
        cursor: resizingIndex !== null ? 'col-resize' : 'default',
      }}
    >
      <HatchDefs />

      {/* Drawing background (subtle paper) */}
      <rect
        x="0"
        y="0"
        width={VIEW_W}
        height={VIEW_H}
        fill="var(--modus-wc-color-base-page, #fdfcfa)"
      />

      {/* Top dimension line */}
      <DimensionLine
        x1={DRAW_LEFT}
        x2={drawLayers[drawLayers.length - 1]?.endX ?? DRAW_LEFT}
        y={DIM_LINE_Y}
        totalIn={totalIn}
        ticks={drawLayers.map((dl) => dl.endX)}
      />

      {/* Layer rectangles */}
      {drawLayers.map((dl) => {
        const isActive = activeIndex === dl.index;
        return (
          <g key={dl.layer.id}>
            <rect
              x={dl.startX}
              y={DRAW_TOP}
              width={Math.max(dl.endX - dl.startX, 0.5)}
              height={DRAW_BOTTOM - DRAW_TOP}
              fill={`url(#${dl.material.patternId})`}
              stroke={isActive ? 'var(--modus-wc-color-primary, #0063A3)' : '#3a4452'}
              strokeWidth={isActive ? 1.8 : 0.8}
            />
            {/* Clickable hit area (generous for thin layers) */}
            <rect
              x={dl.startX}
              y={DRAW_TOP}
              width={Math.max(dl.endX - dl.startX, 14)}
              height={DRAW_BOTTOM - DRAW_TOP}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onLayerClick(dl.index, dl.midX);
              }}
            />
          </g>
        );
      })}

      {/* Resize handles (right edge of each layer except last gets handle on the boundary; last layer has handle on its right edge for total resize) */}
      {drawLayers.map((dl, i) => {
        if (i === drawLayers.length - 1) return null; // boundaries only between layers
        const boundaryX = dl.endX;
        const isResizing = resizingIndex === i;
        return (
          <g key={`resize-${dl.layer.id}`}>
            <line
              x1={boundaryX}
              y1={DRAW_TOP}
              x2={boundaryX}
              y2={DRAW_BOTTOM}
              stroke={isResizing ? 'var(--modus-wc-color-primary, #0063A3)' : '#3a4452'}
              strokeWidth={isResizing ? 1.8 : 0.8}
            />
            <rect
              x={boundaryX - 5}
              y={DRAW_TOP + 24}
              width={10}
              height={DRAW_BOTTOM - DRAW_TOP - 48}
              fill="transparent"
              style={{ cursor: 'col-resize' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(i, e);
              }}
            />
            {/* Grab affordance: small chevrons (visible during resize) */}
            {isResizing && (
              <g pointerEvents="none">
                <circle cx={boundaryX} cy={(DRAW_TOP + DRAW_BOTTOM) / 2} r={4} fill="var(--modus-wc-color-primary, #0063A3)" />
              </g>
            )}
          </g>
        );
      })}

      {/* Insert "+" affordance between layers (and at extremes) */}
      {[...Array(drawLayers.length + 1)].map((_, i) => {
        const x =
          i === 0
            ? DRAW_LEFT
            : i === drawLayers.length
              ? drawLayers[drawLayers.length - 1].endX
              : drawLayers[i - 1].endX;
        const isHover = hoverGapIndex === i;
        return (
          <g key={`gap-${i}`}>
            <rect
              x={x - 10}
              y={DIM_LINE_Y + 4}
              width={20}
              height={16}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onGapHover(i)}
              onMouseLeave={() => onGapHover((cur) => (cur === i ? null : cur))}
              onClick={(e) => {
                e.stopPropagation();
                onInsertClick(i, x);
              }}
            />
            {isHover && (
              <g pointerEvents="none">
                <circle cx={x} cy={DIM_LINE_Y + 12} r={8} fill="var(--modus-wc-color-primary, #0063A3)" />
                <path
                  d={`M ${x - 4} ${DIM_LINE_Y + 12} L ${x + 4} ${DIM_LINE_Y + 12} M ${x} ${DIM_LINE_Y + 8} L ${x} ${DIM_LINE_Y + 16}`}
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        );
      })}

      {/* Resize tooltip */}
      {resizeTooltip && (
        <g pointerEvents="none">
          <rect
            x={resizeTooltip.x - 26}
            y={resizeTooltip.y - 26}
            width={52}
            height={20}
            rx={4}
            fill="var(--modus-wc-color-base-content, #171c1e)"
          />
          <text
            x={resizeTooltip.x}
            y={resizeTooltip.y - 12}
            textAnchor="middle"
            fontSize={11}
            fontFamily="monospace"
            fontWeight={600}
            fill="white"
          >
            {fmtIn(resizeTooltip.thicknessIn)}
          </text>
        </g>
      )}

      {/* EXTERIOR / INTERIOR end labels */}
      <line
        x1={DRAW_LEFT}
        y1={DRAW_BOTTOM + 6}
        x2={DRAW_LEFT}
        y2={DRAW_BOTTOM + 12}
        stroke="var(--modus-wc-color-base-content, #252a2e)"
        strokeWidth="0.8"
      />
      <text
        x={DRAW_LEFT}
        y={EXT_LABEL_Y}
        fontSize="10"
        fontWeight="700"
        fill="var(--modus-wc-color-base-content-low-contrast, #4a5565)"
        textAnchor="start"
        letterSpacing="1.2"
      >
        EXTERIOR
      </text>
      <line
        x1={drawLayers[drawLayers.length - 1]?.endX ?? DRAW_LEFT}
        y1={DRAW_BOTTOM + 6}
        x2={drawLayers[drawLayers.length - 1]?.endX ?? DRAW_LEFT}
        y2={DRAW_BOTTOM + 12}
        stroke="var(--modus-wc-color-base-content, #252a2e)"
        strokeWidth="0.8"
      />
      <text
        x={drawLayers[drawLayers.length - 1]?.endX ?? DRAW_LEFT}
        y={EXT_LABEL_Y}
        fontSize="10"
        fontWeight="700"
        fill="var(--modus-wc-color-base-content-low-contrast, #4a5565)"
        textAnchor="end"
        letterSpacing="1.2"
      >
        INTERIOR
      </text>

      {/* Leader lines */}
      {calloutRows.map((row) => (
        <line
          key={`leader-${row.layer.id}`}
          x1={row.midX}
          y1={DRAW_TOP}
          x2={CALLOUT_LEFT - 4}
          y2={row.calloutY}
          stroke="var(--modus-wc-color-base-content-low-contrast, #6a6e79)"
          strokeWidth="0.7"
        />
      ))}
      {calloutRows.map((row) => (
        <circle
          key={`leader-dot-${row.layer.id}`}
          cx={row.midX}
          cy={DRAW_TOP}
          r={1.6}
          fill="var(--modus-wc-color-base-content, #171c1e)"
        />
      ))}

      {/* Callout labels */}
      {calloutRows.map((row, i) => {
        const r = row.material.rPerInch * row.layer.thicknessIn;
        const showR = row.material.rPerInch >= 0.5;
        const isAiOriginal =
          INITIAL_LAYERS[i] &&
          INITIAL_LAYERS[i].materialId === row.layer.materialId &&
          Math.abs(INITIAL_LAYERS[i].thicknessIn - row.layer.thicknessIn) < 0.01;
        return (
          <g key={`callout-${row.layer.id}`}>
            <circle
              cx={CALLOUT_LEFT + 6}
              cy={row.calloutY}
              r={9}
              fill={isAiOriginal ? 'var(--modus-wc-color-base-100, #f8f9fb)' : 'var(--modus-wc-color-primary-light, #e8f4fd)'}
              stroke={isAiOriginal ? 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' : 'var(--modus-wc-color-primary, #0063A3)'}
              strokeWidth="1"
            />
            <text
              x={CALLOUT_LEFT + 6}
              y={row.calloutY + 3.5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill={isAiOriginal ? 'var(--modus-wc-color-base-content, #252a2e)' : 'var(--modus-wc-color-primary, #0063A3)'}
            >
              {i + 1}
            </text>
            <text
              x={CALLOUT_LEFT + 22}
              y={row.calloutY - 2}
              fontSize="11.5"
              fontWeight="600"
              fill="var(--modus-wc-color-base-content, #171c1e)"
            >
              {row.material.shortName}
              <tspan
                fontFamily="monospace"
                fontWeight="500"
                fill="var(--modus-wc-color-base-content-low-contrast, #6a6e79)"
                fontSize="10.5"
                dx="6"
              >
                {fmtIn(row.layer.thicknessIn)}
              </tspan>
            </text>
            <text
              x={CALLOUT_LEFT + 22}
              y={row.calloutY + 10}
              fontSize="10"
              fontFamily="monospace"
              fill="var(--modus-wc-color-base-content-low-contrast, #6a6e79)"
            >
              {CATEGORY_LABELS[row.material.category]}
              {showR && (
                <tspan
                  dx="6"
                  fill={
                    row.material.rPerInch >= 2
                      ? 'var(--modus-wc-color-status-success, #1e7e34)'
                      : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)'
                  }
                  fontWeight="600"
                >
                  R-{r.toFixed(1)}
                </tspan>
              )}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Dimension line component ─────────────────────────────────── */
function DimensionLine({
  x1,
  x2,
  y,
  totalIn,
  ticks,
}: {
  x1: number;
  x2: number;
  y: number;
  totalIn: number;
  ticks: number[];
}) {
  const arrowSize = 5;
  return (
    <g>
      {/* Extension lines from layers up to dim line */}
      <line x1={x1} y1={y - 2} x2={x1} y2={y + 18} stroke="var(--modus-wc-color-base-content-low-contrast, #4a5565)" strokeWidth="0.6" />
      <line x1={x2} y1={y - 2} x2={x2} y2={y + 18} stroke="var(--modus-wc-color-base-content-low-contrast, #4a5565)" strokeWidth="0.6" />

      {/* Main dim line */}
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="var(--modus-wc-color-base-content, #252a2e)" strokeWidth="0.9" />

      {/* Arrows */}
      <polygon
        points={`${x1},${y} ${x1 + arrowSize},${y - arrowSize / 2} ${x1 + arrowSize},${y + arrowSize / 2}`}
        fill="var(--modus-wc-color-base-content, #252a2e)"
      />
      <polygon
        points={`${x2},${y} ${x2 - arrowSize},${y - arrowSize / 2} ${x2 - arrowSize},${y + arrowSize / 2}`}
        fill="var(--modus-wc-color-base-content, #252a2e)"
      />

      {/* Tick marks at boundaries (small slashes) */}
      {ticks.slice(0, -1).map((tx, i) => (
        <line
          key={`tick-${i}`}
          x1={tx - 3}
          y1={y - 3}
          x2={tx + 3}
          y2={y + 3}
          stroke="var(--modus-wc-color-base-content-low-contrast, #6a6e79)"
          strokeWidth="0.6"
        />
      ))}

      {/* Total label */}
      <rect
        x={(x1 + x2) / 2 - 32}
        y={y - 18}
        width={64}
        height={14}
        fill="var(--modus-wc-color-base-page, #fff)"
      />
      <text
        x={(x1 + x2) / 2}
        y={y - 7}
        textAnchor="middle"
        fontSize="11"
        fontFamily="monospace"
        fontWeight="700"
        fill="var(--modus-wc-color-base-content, #171c1e)"
      >
        {fmtIn(totalIn)} TOTAL
      </text>
    </g>
  );
}

/* ── Metrics strip ─────────────────────────────────────────────── */
function MetricsStrip({
  totalIn,
  rValue,
  cost,
  codeMet,
  fireMet,
  editCount,
}: {
  totalIn: number;
  rValue: number;
  cost: number;
  codeMet: boolean;
  fireMet: boolean;
  editCount: number;
}) {
  const codeAccent = codeMet
    ? 'var(--modus-wc-color-status-success, #1e7e34)'
    : 'var(--modus-wc-color-status-danger, #c84a3f)';
  const codeBg = codeMet
    ? 'var(--modus-wc-color-status-success-light, #e6f4ea)'
    : 'var(--modus-wc-color-status-danger-light, #fce8e9)';

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
      }}
    >
      <div
        className="flex flex-col px-3 py-2"
        style={{
          borderRight: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          backgroundColor: codeBg,
        }}
      >
        <span
          className="font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: codeAccent,
            letterSpacing: '0.4px',
          }}
        >
          R-VALUE
        </span>
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-mono font-semibold"
            style={{
              fontSize: 'var(--modus-wc-font-size-lg, 18px)',
              color: codeAccent,
            }}
          >
            R-{rValue.toFixed(1)}
          </span>
          <ModusWcIcon
            name={codeMet ? 'check_circle' : 'alert'}
            size="xs"
            decorative
            style={{ color: codeAccent }}
          />
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: codeAccent,
            fontWeight: 600,
          }}
        >
          {codeMet ? `meets R-${CODE.rMin}` : `below R-${CODE.rMin} target`}
        </span>
      </div>

      <div
        className="flex flex-col px-3 py-2"
        style={{ borderRight: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <span
          className="font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.4px',
          }}
        >
          TOTAL THICKNESS
        </span>
        <span
          className="font-mono font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-lg, 18px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          {fmtIn(totalIn)}
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          {totalIn.toFixed(2)}" actual
        </span>
      </div>

      <div
        className="flex flex-col px-3 py-2"
        style={{ borderRight: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <span
          className="font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.4px',
          }}
        >
          COST / SF
        </span>
        <span
          className="font-mono font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-lg, 18px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          ${cost.toFixed(2)}
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          installed budget
        </span>
      </div>

      <div className="flex flex-col px-3 py-2">
        <span
          className="font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.4px',
          }}
        >
          FIRE RATING
        </span>
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-semibold"
            style={{
              fontSize: 'var(--modus-wc-font-size-lg, 18px)',
              color: fireMet
                ? 'var(--modus-wc-color-status-success, #1e7e34)'
                : 'var(--modus-wc-color-status-warning, #856404)',
            }}
          >
            {fireMet ? '1-hr' : '—'}
          </span>
          <ModusWcIcon
            name={fireMet ? 'check_circle' : 'alert'}
            size="xs"
            decorative
            style={{
              color: fireMet
                ? 'var(--modus-wc-color-status-success, #1e7e34)'
                : 'var(--modus-wc-color-status-warning, #856404)',
            }}
          />
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            fontWeight: 600,
          }}
        >
          {editCount === 0 ? 'as drafted by AI' : `${editCount} edit${editCount === 1 ? '' : 's'}`}
        </span>
      </div>
    </div>
  );
}

/* ── Open-in rail ──────────────────────────────────────────────── */
function OpenInRail({
  sentTo,
  onSendTo,
}: {
  sentTo: string | null;
  onSendTo: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-4 pt-3 pb-4">
      <span
        className="font-semibold"
        style={{
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          letterSpacing: '0.4px',
        }}
      >
        OPEN THE SAME ASSEMBLY IN
      </span>
      <div className="flex flex-wrap gap-1.5">
        {NATIVE_TOOLS.map((tool) => {
          const active = sentTo === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSendTo(tool.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-full transition-all"
              style={{
                backgroundColor: active
                  ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                  : 'var(--modus-wc-color-base-page, #fff)',
                border: `1px solid ${active ? tool.accent : 'var(--modus-wc-color-base-200, #e0e1e9)'}`,
                cursor: 'pointer',
              }}
            >
              <ModusWcIcon
                name={active ? 'check' : 'launch'}
                size="xs"
                decorative
                style={{
                  color: active ? tool.accent : 'var(--modus-wc-color-base-content, #252a2e)',
                }}
              />
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                  color: active ? tool.accent : 'var(--modus-wc-color-base-content, #252a2e)',
                }}
              >
                {tool.label}
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: '9px',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                {tool.format}
              </span>
            </button>
          );
        })}
      </div>
      {sentTo && (
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
          }}
        >
          Same assembly, your edits intact — ready for{' '}
          {NATIVE_TOOLS.find((t) => t.id === sentTo)?.label}.
        </span>
      )}
    </div>
  );
}

/* ── Creative 1 — Wall Assembly Detail ────────────────────────── */
interface Creative1Props {
  open?: boolean;
  onClose?: () => void;
}

export default function Creative1({ open = true, onClose }: Creative1Props = {}) {
  const [dismissed, setDismissed] = useState(false);
  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [hoverGapIndex, setHoverGapIndex] = useState<number | null>(null);

  // Resize state
  const [resizingIndex, setResizingIndex] = useState<number | null>(null);
  const [resizeTooltip, setResizeTooltip] = useState<ResizeTooltip | null>(null);
  const resizeStartRef = useRef<{
    layerIndex: number;
    startClientX: number;
    startThicknessIn: number;
    ppi: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(720);
  const [drawingMetrics, setDrawingMetrics] = useState({ top: 0, height: 0 });

  // Track container width + drawing box for popover anchoring
  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      setContainerWidth(containerRef.current?.clientWidth ?? 720);
      if (drawingRef.current) {
        setDrawingMetrics({
          top: drawingRef.current.offsetTop,
          height: drawingRef.current.offsetHeight,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    if (drawingRef.current) ro.observe(drawingRef.current);
    return () => ro.disconnect();
  }, []);

  // Global drag listeners for resize
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const ctx = resizeStartRef.current;
      if (!ctx || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scale = rect.width / VIEW_W;
      const dxScreen = e.clientX - ctx.startClientX;
      const dxIn = dxScreen / scale / ctx.ppi;

      setLayers((prev) => {
        const next = [...prev];
        const target = next[ctx.layerIndex];
        if (!target) return prev;
        const mat = MATERIAL_BY_ID[target.materialId];
        const newThick = snapThickness(ctx.startThicknessIn + dxIn, mat);
        next[ctx.layerIndex] = { ...target, thicknessIn: newThick };
        return next;
      });

      // Build a snapshot of layers up to the resized one to compute tooltip x
      const tooltipMatRef = MATERIAL_BY_ID[layers[ctx.layerIndex]?.materialId ?? ''];
      const newThickPreview = tooltipMatRef
        ? snapThickness(ctx.startThicknessIn + dxIn, tooltipMatRef)
        : ctx.startThicknessIn;
      // Recompute boundary x from current state (approximate via rect)
      setResizeTooltip({
        layerIndex: ctx.layerIndex,
        thicknessIn: newThickPreview,
        x: (e.clientX - rect.left) / scale,
        y: (DRAW_TOP + DRAW_BOTTOM) / 2,
      });
    }
    function onUp() {
      resizeStartRef.current = null;
      setResizingIndex(null);
      setResizeTooltip(null);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [layers]);

  // Derived
  const totalIn = useMemo(
    () => layers.reduce((s, l) => s + l.thicknessIn, 0),
    [layers],
  );
  const ppi = useMemo(() => getPpi(totalIn), [totalIn]);
  const drawLayers = useMemo(() => buildDrawLayers(layers, ppi), [layers, ppi]);
  const rValue = useMemo(
    () =>
      layers.reduce(
        (s, l) => s + l.thicknessIn * (MATERIAL_BY_ID[l.materialId]?.rPerInch ?? 0),
        0,
      ) + AIR_FILM_R,
    [layers],
  );
  const cost = useMemo(
    () =>
      layers.reduce(
        (s, l) =>
          s + l.thicknessIn * (MATERIAL_BY_ID[l.materialId]?.costPerInchPerSf ?? 0),
        0,
      ),
    [layers],
  );
  const codeMet = rValue >= CODE.rMin;
  const fireMet = layers.some((l) => MATERIAL_BY_ID[l.materialId]?.fireRated);
  const editCount = useMemo(() => {
    const lenDiff = Math.abs(layers.length - INITIAL_LAYERS.length);
    const commonLen = Math.min(layers.length, INITIAL_LAYERS.length);
    let modCount = 0;
    for (let i = 0; i < commonLen; i++) {
      const l = layers[i];
      const init = INITIAL_LAYERS[i];
      if (
        init.materialId !== l.materialId ||
        Math.abs(init.thicknessIn - l.thicknessIn) > 0.001
      ) {
        modCount++;
      }
    }
    return lenDiff + modCount;
  }, [layers]);

  // Handlers
  function handleLayerClick(index: number, midX: number) {
    if (resizingIndex !== null) return;
    setPicker({ mode: 'swap', layerIndex: index, anchorX: midX, showAll: false });
  }

  function handleInsertClick(index: number, x: number) {
    setPicker({ mode: 'insert', layerIndex: index, anchorX: x, showAll: false });
  }

  function handleResizeStart(index: number, e: React.MouseEvent) {
    const target = layers[index];
    if (!target) return;
    resizeStartRef.current = {
      layerIndex: index,
      startClientX: e.clientX,
      startThicknessIn: target.thicknessIn,
      ppi,
    };
    setResizingIndex(index);
    setPicker(null);
  }

  function swapMaterial(materialId: string) {
    if (!picker || picker.mode !== 'swap') return;
    const mat = MATERIAL_BY_ID[materialId];
    if (!mat) return;
    setLayers((prev) => {
      const next = [...prev];
      const old = next[picker.layerIndex];
      if (!old) return prev;
      const oldMat = MATERIAL_BY_ID[old.materialId];
      // Keep existing thickness if compatible; otherwise snap to material default
      let thick = old.thicknessIn;
      if (
        !oldMat ||
        thick < mat.minThicknessIn ||
        thick > mat.maxThicknessIn
      ) {
        thick = mat.defaultThicknessIn;
      } else {
        thick = snapThickness(thick, mat);
      }
      next[picker.layerIndex] = {
        ...old,
        materialId,
        thicknessIn: thick,
      };
      return next;
    });
    setPicker(null);
  }

  function insertMaterial(materialId: string) {
    if (!picker || picker.mode !== 'insert') return;
    const mat = MATERIAL_BY_ID[materialId];
    if (!mat) return;
    setLayers((prev) => {
      const next = [...prev];
      next.splice(picker.layerIndex, 0, {
        id: `L${Date.now()}`,
        materialId,
        thicknessIn: mat.defaultThicknessIn,
      });
      return next;
    });
    setPicker(null);
  }

  function removeLayer() {
    if (!picker || picker.mode !== 'swap') return;
    if (layers.length <= 1) return;
    setLayers((prev) => prev.filter((_, i) => i !== picker.layerIndex));
    setPicker(null);
  }

  function resetAssembly() {
    setLayers(INITIAL_LAYERS);
  }

  function handleDismiss() {
    setDismissed(true);
    onClose?.();
  }

  function handleGapHover(
    next: number | null | ((cur: number | null) => number | null),
  ) {
    setHoverGapIndex(next);
  }

  if (!open || dismissed) return null;

  return (
    <div
      ref={containerRef}
      className="rounded-2xl p-[2px] relative"
      style={{
        background: TRIMBLE_RAINBOW,
        width: 720,
        boxShadow: '0px 12px 32px rgba(0,0,0,0.18), 0px 4px 10px rgba(0,0,0,0.08)',
        marginBottom: 'var(--modus-wc-spacing-xl, 2rem)',
      }}
    >
      <div
        className="rounded-[14px] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--modus-wc-color-base-page, #fff)' }}
      >
        <TitleBlock
          editCount={editCount}
          onReset={resetAssembly}
          onDismiss={handleDismiss}
        />

        <div ref={drawingRef} className="relative">
          <WallDrawing
            drawLayers={drawLayers}
            totalIn={totalIn}
            resizingIndex={resizingIndex}
            resizeTooltip={resizeTooltip}
            activeIndex={picker?.mode === 'swap' ? picker.layerIndex : null}
            hoverGapIndex={hoverGapIndex}
            onLayerClick={handleLayerClick}
            onResizeStart={handleResizeStart}
            onInsertClick={handleInsertClick}
            onGapHover={handleGapHover}
            svgRef={svgRef}
          />
        </div>

        <MetricsStrip
          totalIn={totalIn}
          rValue={rValue}
          cost={cost}
          codeMet={codeMet}
          fireMet={fireMet}
          editCount={editCount}
        />

        <OpenInRail sentTo={sentTo} onSendTo={setSentTo} />
      </div>

      {/* Picker lives at the outer (rainbow) level so it can appear below the
          drawing without being clipped by the inner card's overflow-hidden. */}
      {picker && (
        <MaterialPicker
          state={picker}
          layers={layers}
          containerWidth={containerWidth}
          drawingTop={drawingMetrics.top}
          drawingHeight={drawingMetrics.height}
          onSwap={swapMaterial}
          onInsert={insertMaterial}
          onRemove={removeLayer}
          onClose={() => setPicker(null)}
          onToggleAll={() =>
            setPicker((p) => (p ? { ...p, showAll: !p.showAll } : p))
          }
        />
      )}
    </div>
  );
}
