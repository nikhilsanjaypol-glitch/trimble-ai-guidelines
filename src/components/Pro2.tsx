import { useEffect, useRef, useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 2 — PERFORM BITE-SIZED TASKS
 *
 * A dense CAD floor plan fills the viewport. Right-click anywhere
 * on the model and a small palette of "AI tools" pops up — each one
 * a narrow, well-scoped task scoped to the highlighted Wall 23.
 * Click "Dimension" and the AI drops in the most important wall
 * lengths; the other tools demonstrate similar bite-sized actions
 * (spell check, compliance, labels). No typed prompts.
 * ───────────────────────────────────────────────────────────────── */

type ActionId = 'dimension' | 'spell' | 'compliance' | 'label';

interface AiTool {
  id: ActionId;
  icon: string;
  label: string;
  description: string;
  tint: string;
}

const ACTIONS: AiTool[] = [
  {
    id: 'dimension',
    icon: 'ruler',
    label: 'Dimension',
    description: 'Place key wall lengths on the drawing.',
    tint: '#1AB1A0',
  },
  {
    id: 'spell',
    icon: 'text_marker',
    label: 'Spell check',
    description: 'Find typos in labels and tags.',
    tint: '#0063A3',
  },
  {
    id: 'compliance',
    icon: 'shield',
    label: 'Compliance detect',
    description: 'Validate against project standards.',
    tint: '#7B2DFF',
  },
  {
    id: 'label',
    icon: 'tag',
    label: 'Label',
    description: 'Auto-name rooms and tag elements.',
    tint: '#E25C00',
  },
];

/* ── CAD Floor Plan ───────────────────────────────────────────────
 * Detailed architectural plan with column grid, MEP overlay (HVAC,
 * electrical, plumbing, sprinklers, data), lighting layout, stair
 * core, elevator, IT/server, mechanical, janitor, keynotes, section
 * markers, egress arrows, wall/door tags, and a title block. Wall
 * 23 (curtain wall on grid 18-A.4) is highlighted as the current
 * selection. */
function FloorPlan({ showDimensions = false }: { showDimensions?: boolean }) {
  return (
    <svg
      viewBox="0 0 1400 900"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }}
    >
      <defs>
        <pattern id="p2-grid-minor" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#dde6ef" strokeWidth="0.5" />
        </pattern>
        <pattern id="p2-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#b8c5d4" strokeWidth="0.8" />
        </pattern>
        {/* HVAC duct hatch — muted */}
        <pattern id="p2-duct-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#8d99a8" strokeWidth="0.6" opacity="0.55" />
        </pattern>
        {/* Wall poche hatch */}
        <pattern id="p2-wall-hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3" stroke="#1a2330" strokeWidth="0.6" />
        </pattern>
        {/* Shaft / dashed-X for elevator + stair */}
        <pattern id="p2-shaft-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="14" stroke="#9aa7b6" strokeWidth="0.4" />
          <line x1="7" y1="0" x2="7" y2="14" stroke="#9aa7b6" strokeWidth="0.4" />
        </pattern>
        <linearGradient id="p2-wall23-glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF2092" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#FF00D3" stopOpacity="1" />
          <stop offset="100%" stopColor="#7B2DFF" stopOpacity="0.85" />
        </linearGradient>
        {/* Egress arrowhead marker — muted */}
        <marker id="p2-egress-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8d99a8" />
        </marker>
        <marker id="p2-leader-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#5a6b7e" />
        </marker>
      </defs>

      {/* ── Background grids ─────────────────────────────────────── */}
      <rect width="1400" height="900" fill="#f3f6fa" />
      <rect width="1400" height="900" fill="url(#p2-grid-minor)" />
      <rect width="1400" height="900" fill="url(#p2-grid-major)" />

      {/* ╔════ DIMMED LAYER · 1 of 3 ════════════════════════════════╗ */}
      <g opacity="0.5">

      {/* ── Column grid bubbles & gridlines ──────────────────────── */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="11" fill="#1a2330">
        {[
          { x: 120, label: '1' },
          { x: 380, label: '2' },
          { x: 540, label: '2.5' },
          { x: 700, label: '3' },
          { x: 840, label: '3.5' },
          { x: 920, label: '4' },
          { x: 1100, label: '5' },
          { x: 1280, label: '6' },
        ].map(({ x, label }) => (
          <g key={`col-${label}`}>
            <line x1={x} y1="92" x2={x} y2="800" stroke="#9aa7b6" strokeWidth="0.4" strokeDasharray="2 6" />
            <circle cx={x} cy="100" r="11" fill="#fff" stroke="#1a2330" strokeWidth="1.1" />
            <text x={x} y="104" textAnchor="middle" fontWeight="700" fontSize="10">{label}</text>
          </g>
        ))}
        {[
          { y: 120, label: 'A' },
          { y: 280, label: 'A.5' },
          { y: 360, label: 'B' },
          { y: 460, label: 'B.5' },
          { y: 540, label: 'C' },
          { y: 660, label: 'C.5' },
          { y: 780, label: 'D' },
        ].map(({ y, label }) => (
          <g key={`row-${label}`}>
            <line x1="92" y1={y} x2="1300" y2={y} stroke="#9aa7b6" strokeWidth="0.4" strokeDasharray="2 6" />
            <circle cx="100" cy={y} r="11" fill="#fff" stroke="#1a2330" strokeWidth="1.1" />
            <text x="100" y={y + 4} textAnchor="middle" fontWeight="700" fontSize="10">{label}</text>
          </g>
        ))}
      </g>

      {/* ╚════ END DIMMED LAYER · 1 of 3 ═══════════════════════════╝ */}
      </g>

      {/* ── Building footprint (poche walls) ─────────────────────── */}
      <g>
        {/* Exterior wall poche bands */}
        <rect x="120" y="120" width="1160" height="14" fill="url(#p2-wall-hatch)" stroke="#1a2330" strokeWidth="1" />
        <rect x="120" y="766" width="1160" height="14" fill="url(#p2-wall-hatch)" stroke="#1a2330" strokeWidth="1" />
        <rect x="120" y="120" width="14" height="660" fill="url(#p2-wall-hatch)" stroke="#1a2330" strokeWidth="1" />
        <rect x="1266" y="120" width="14" height="660" fill="url(#p2-wall-hatch)" stroke="#1a2330" strokeWidth="1" />

        {/* Inside fill */}
        <rect x="134" y="134" width="1132" height="632" fill="#ffffff" />
      </g>

      {/* ── Interior partitions ──────────────────────────────────── */}
      <g stroke="#1a2330" strokeWidth="2" fill="none" strokeLinecap="square">
        {/* Vertical interior walls */}
        <line x1="380" y1="134" x2="380" y2="240" />
        <line x1="380" y1="290" x2="380" y2="540" />
        <line x1="540" y1="360" x2="540" y2="540" />
        <line x1="700" y1="134" x2="700" y2="200" />
        <line x1="700" y1="260" x2="700" y2="360" />
        <line x1="700" y1="360" x2="700" y2="540" />
        <line x1="840" y1="134" x2="840" y2="360" />
        <line x1="840" y1="540" x2="840" y2="660" />
        <line x1="840" y1="710" x2="840" y2="766" />
        <line x1="920" y1="134" x2="920" y2="540" />
        <line x1="920" y1="540" x2="920" y2="660" />
        <line x1="920" y1="710" x2="920" y2="766" />
        <line x1="1020" y1="540" x2="1020" y2="660" />
        <line x1="1100" y1="360" x2="1100" y2="540" />
        <line x1="1100" y1="540" x2="1100" y2="640" />
        <line x1="1100" y1="690" x2="1100" y2="766" />
        <line x1="1180" y1="540" x2="1180" y2="660" />
        {/* Horizontal interior walls */}
        <line x1="134" y1="360" x2="380" y2="360" />
        <line x1="134" y1="540" x2="380" y2="540" />
        <line x1="430" y1="540" x2="700" y2="540" />
        <line x1="540" y1="460" x2="700" y2="460" />
        <line x1="700" y1="360" x2="780" y2="360" />
        <line x1="820" y1="360" x2="1266" y2="360" />
        <line x1="700" y1="460" x2="840" y2="460" />
        <line x1="920" y1="460" x2="1100" y2="460" />
        <line x1="700" y1="540" x2="840" y2="540" />
        <line x1="840" y1="660" x2="1180" y2="660" />
        <line x1="700" y1="660" x2="840" y2="660" />
      </g>

      {/* ── Structural columns at grid intersections ─────────────── */}
      <g fill="#1a2330" stroke="#1a2330" strokeWidth="1">
        {[120, 380, 540, 700, 840, 920, 1100, 1280].map((cx) =>
          [120, 280, 360, 460, 540, 660, 780].map((cy) => (
            <rect
              key={`col-${cx}-${cy}`}
              x={cx - 5}
              y={cy - 5}
              width="10"
              height="10"
              fill="#1a2330"
            />
          )),
        )}
      </g>

      {/* ── Wall 23 — the highlighted selection ──────────────────── */}
      <g>
        <line
          x1="700"
          y1="134"
          x2="700"
          y2="200"
          stroke="url(#p2-wall23-glow)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1="700"
          y1="260"
          x2="700"
          y2="360"
          stroke="url(#p2-wall23-glow)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1="700"
          y1="134"
          x2="700"
          y2="360"
          stroke="#FF00D3"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.18"
        />
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="11" fill="#FF00D3">
          <line x1="700" y1="160" x2="780" y2="100" stroke="#FF00D3" strokeWidth="1" />
          <circle cx="780" cy="100" r="3" fill="#FF00D3" />
          <text x="788" y="96" fontWeight="700">WALL 23 · TYPE W3-A</text>
          <text x="788" y="110" fill="#5a6b7e">Curtain · Grid 3 · 18-A.4 · GWB ea side</text>
        </g>
      </g>

      {/* ╔════ DIMMED LAYER · 2 of 3 ════════════════════════════════╗ */}
      <g opacity="0.5">

      {/* ── Windows on exterior walls ────────────────────────────── */}
      <g stroke="#1a2330" strokeWidth="1.1" fill="#fff">
        {[150, 220, 290, 410, 480, 570, 730, 800, 960, 1030, 1140, 1210].map((x) => (
          <g key={`win-top-${x}`}>
            <rect x={x} y="126" width="36" height="8" fill="#fff" />
            <line x1={x} y1="130" x2={x + 36} y2="130" />
          </g>
        ))}
        {[150, 220, 290, 460, 540, 770, 840, 960, 1030, 1140, 1210].map((x) => (
          <g key={`win-bot-${x}`}>
            <rect x={x} y="766" width="36" height="8" fill="#fff" />
            <line x1={x} y1="770" x2={x + 36} y2="770" />
          </g>
        ))}
        {/* Side windows */}
        {[170, 250, 580, 700].map((y) => (
          <g key={`win-left-${y}`}>
            <rect x="126" y={y} width="8" height="32" fill="#fff" />
            <line x1="130" y1={y} x2="130" y2={y + 32} />
          </g>
        ))}
        {[170, 250, 580, 700].map((y) => (
          <g key={`win-right-${y}`}>
            <rect x="1266" y={y} width="8" height="32" fill="#fff" />
            <line x1="1270" y1={y} x2="1270" y2={y + 32} />
          </g>
        ))}
      </g>

      {/* ── Doors with swing arcs + tags ─────────────────────────── */}
      <g stroke="#5a6b7e" strokeWidth="0.9" fill="none">
        {/* Conference door (D-101) */}
        <line x1="380" y1="240" x2="380" y2="290" stroke="#5a6b7e" />
        <path d="M 380 290 A 50 50 0 0 0 430 240" strokeDasharray="3 2" />
        <line x1="380" y1="290" x2="430" y2="290" />
        {/* Wall 23 door (D-103) */}
        <line x1="700" y1="200" x2="700" y2="260" stroke="url(#p2-wall23-glow)" strokeWidth="2" />
        <path d="M 700 260 A 60 60 0 0 1 760 200" stroke="#FF00D3" strokeDasharray="3 2" />
        {/* Open Office to corridor (D-104) */}
        <line x1="540" y1="540" x2="540" y2="500" stroke="#5a6b7e" strokeDasharray="0" />
        <line x1="540" y1="540" x2="590" y2="540" />
        <path d="M 590 540 A 50 50 0 0 0 540 490" strokeDasharray="3 2" />
        <line x1="540" y1="490" x2="540" y2="540" />
        {/* Reception (D-105) */}
        <line x1="380" y1="540" x2="430" y2="540" />
        <path d="M 430 540 A 50 50 0 0 1 430 590" strokeDasharray="3 2" />
        <line x1="430" y1="540" x2="430" y2="590" />
        {/* Storage (D-106) */}
        <line x1="780" y1="540" x2="780" y2="580" stroke="#5a6b7e" />
        <path d="M 780 540 A 40 40 0 0 0 740 580" strokeDasharray="3 2" />
        <line x1="780" y1="540" x2="740" y2="540" />
        {/* Stair core (D-107) */}
        <line x1="780" y1="360" x2="820" y2="360" />
        <path d="M 780 360 A 40 40 0 0 1 820 320" strokeDasharray="3 2" />
        <line x1="780" y1="320" x2="780" y2="360" />
        {/* Break room (D-108) */}
        <line x1="920" y1="320" x2="920" y2="280" stroke="#5a6b7e" />
        <path d="M 920 280 A 40 40 0 0 0 960 320" strokeDasharray="3 2" />
        <line x1="920" y1="280" x2="960" y2="280" />
        {/* IT room (D-109) */}
        <line x1="1020" y1="400" x2="1060" y2="400" />
        <path d="M 1060 400 A 40 40 0 0 0 1020 440" strokeDasharray="3 2" />
        <line x1="1020" y1="400" x2="1020" y2="440" />
        {/* Janitor (D-110) */}
        <line x1="920" y1="660" x2="920" y2="700" />
        <path d="M 920 700 A 30 30 0 0 1 950 670" strokeDasharray="3 2" />
        <line x1="920" y1="700" x2="950" y2="700" />
        {/* RR women (D-111) */}
        <line x1="1020" y1="660" x2="1020" y2="690" />
        <path d="M 1020 690 A 30 30 0 0 1 1050 660" strokeDasharray="3 2" />
        {/* RR men (D-112) */}
        <line x1="1100" y1="640" x2="1100" y2="690" />
        <path d="M 1100 640 A 50 50 0 0 1 1150 690" strokeDasharray="3 2" />
        <line x1="1100" y1="690" x2="1150" y2="690" />
        {/* Elev (D-113) */}
        <line x1="840" y1="620" x2="900" y2="620" />
        {/* Mech (D-114) */}
        <line x1="840" y1="730" x2="890" y2="730" />
      </g>

      {/* Door tags — small hexagons */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="8" fill="#1a2330">
        {[
          { x: 405, y: 268, t: '101' },
          { x: 730, y: 228, t: '103' },
          { x: 568, y: 510, t: '104' },
          { x: 405, y: 568, t: '105' },
          { x: 758, y: 568, t: '106' },
          { x: 798, y: 340, t: '107' },
          { x: 940, y: 300, t: '108' },
          { x: 1042, y: 422, t: '109' },
          { x: 940, y: 690, t: '110' },
          { x: 1038, y: 680, t: '111' },
          { x: 1128, y: 678, t: '112' },
          { x: 858, y: 612, t: '113' },
          { x: 858, y: 722, t: '114' },
        ].map(({ x, y, t }) => (
          <g key={`dtag-${t}`}>
            <polygon
              points={`${x} ${y - 6} ${x + 6} ${y - 3} ${x + 6} ${y + 3} ${x} ${y + 6} ${x - 6} ${y + 3} ${x - 6} ${y - 3}`}
              fill="#fff"
              stroke="#1a2330"
              strokeWidth="0.7"
            />
            <text x={x} y={y + 2} textAnchor="middle" fontWeight="700">{t}</text>
          </g>
        ))}
      </g>

      {/* ── Conference room furniture ────────────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        <ellipse cx="250" cy="240" rx="100" ry="44" />
        <text x="250" y="244" textAnchor="middle" fontSize="9" fill="#5a6b7e" fontFamily="ui-monospace">CONF 12-PERSON</text>
        {[[170, 180], [250, 170], [330, 180], [170, 300], [250, 310], [330, 300], [130, 240], [370, 240]].map(([cx, cy], i) => (
          <rect key={`conf-ch-${i}`} x={cx - 14} y={cy - 14} width="28" height="28" rx="3" fill="#e7edf3" />
        ))}
        {/* AV credenza + screen wall */}
        <rect x="140" y="140" width="220" height="14" fill="#e7edf3" />
        <text x="250" y="151" textAnchor="middle" fontSize="8" fill="#5a6b7e" fontFamily="ui-monospace">85&quot; DISPLAY</text>
        {/* Side credenza */}
        <rect x="140" y="332" width="220" height="14" fill="#e7edf3" />
        <text x="250" y="342" textAnchor="middle" fontSize="8" fill="#5a6b7e" fontFamily="ui-monospace">CREDENZA</text>
      </g>

      {/* ── Huddle / lounge (between conf & reception) ───────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        <rect x="160" y="400" width="180" height="40" rx="4" fill="#e7edf3" />
        <rect x="160" y="450" width="180" height="40" rx="4" fill="#e7edf3" />
        <rect x="160" y="500" width="180" height="20" rx="2" fill="#e7edf3" />
        <text x="250" y="514" textAnchor="middle" fontSize="8" fill="#5a6b7e" fontFamily="ui-monospace">COFFEE TBL</text>
        {/* Plant */}
        <circle cx="350" cy="510" r="10" fill="#e7edf3" stroke="#9aa7b6" strokeDasharray="2 1" />
      </g>

      {/* ── Open Office workstations (4×2 grid + dividers) ───────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        {[420, 510, 600].map((x) => (
          <g key={`ws-col-${x}`}>
            {/* Top row workstation pair */}
            <rect x={x} y="170" width="60" height="32" />
            <rect x={x} y="210" width="60" height="32" />
            {/* Panel between */}
            <line x1={x} y1="206" x2={x + 60} y2="206" stroke="#1a2330" strokeWidth="2.5" />
            {/* Chairs */}
            <circle cx={x + 30} cy="156" r="9" fill="#e7edf3" />
            <circle cx={x + 30} cy="256" r="9" fill="#e7edf3" />
            {/* Monitors */}
            <rect x={x + 16} y="168" width="28" height="3" fill="#1a2330" />
            <rect x={x + 16} y="241" width="28" height="3" fill="#1a2330" />
            {/* File cabinet */}
            <rect x={x + 60} y="186" width="14" height="36" fill="#e7edf3" />

            {/* Bottom row workstation pair */}
            <rect x={x} y="330" width="60" height="32" />
            <rect x={x} y="370" width="60" height="32" />
            <line x1={x} y1="366" x2={x + 60} y2="366" stroke="#1a2330" strokeWidth="2.5" />
            <circle cx={x + 30} cy="316" r="9" fill="#e7edf3" />
            <circle cx={x + 30} cy="416" r="9" fill="#e7edf3" />
            <rect x={x + 16} y="328" width="28" height="3" fill="#1a2330" />
            <rect x={x + 16} y="401" width="28" height="3" fill="#1a2330" />
            <rect x={x + 60} y="346" width="14" height="36" fill="#e7edf3" />
          </g>
        ))}
        {/* Vertical panels separating columns */}
        <line x1="500" y1="148" x2="500" y2="264" stroke="#1a2330" strokeWidth="2" strokeDasharray="2 1" />
        <line x1="590" y1="148" x2="590" y2="264" stroke="#1a2330" strokeWidth="2" strokeDasharray="2 1" />
        <line x1="500" y1="308" x2="500" y2="424" stroke="#1a2330" strokeWidth="2" strokeDasharray="2 1" />
        <line x1="590" y1="308" x2="590" y2="424" stroke="#1a2330" strokeWidth="2" strokeDasharray="2 1" />
        {/* Printer station */}
        <rect x="640" y="460" width="40" height="60" fill="#e7edf3" />
        <text x="660" y="494" textAnchor="middle" fontSize="8" fill="#5a6b7e" fontFamily="ui-monospace">MFP</text>
      </g>

      {/* ── Manager office furniture ─────────────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        <rect x="730" y="170" width="100" height="40" />
        <rect x="760" y="225" width="40" height="20" fill="#e7edf3" />
        <rect x="720" y="280" width="120" height="50" rx="4" fill="#e7edf3" />
        <text x="780" y="312" textAnchor="middle" fontSize="9" fill="#5a6b7e" fontFamily="ui-monospace">SOFA</text>
        {/* Bookshelf */}
        <rect x="824" y="150" width="14" height="80" fill="#e7edf3" />
        <line x1="824" y1="170" x2="838" y2="170" stroke="#1a2330" strokeWidth="0.6" />
        <line x1="824" y1="190" x2="838" y2="190" stroke="#1a2330" strokeWidth="0.6" />
        <line x1="824" y1="210" x2="838" y2="210" stroke="#1a2330" strokeWidth="0.6" />
      </g>

      {/* ── Stair core (treads + arrows) ─────────────────────────── */}
      <g opacity="0.55">
        <rect x="840" y="134" width="80" height="226" fill="url(#p2-shaft-hatch)" stroke="#1a2330" strokeWidth="1.5" />
        {/* Stair treads */}
        <g stroke="#1a2330" strokeWidth="0.9" fill="none">
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`tread-up-${i}`} x1="844" y1={150 + i * 14} x2="876" y2={150 + i * 14} />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`tread-dn-${i}`} x1="884" y1={150 + i * 14} x2="916" y2={150 + i * 14} />
          ))}
          {/* Center wall */}
          <line x1="880" y1="140" x2="880" y2="320" stroke="#1a2330" strokeWidth="2" />
          {/* UP / DN arrows */}
          <line x1="860" y1="340" x2="860" y2="160" stroke="#8d99a8" strokeWidth="1.4" markerEnd="url(#p2-egress-arrow)" />
          <line x1="900" y1="160" x2="900" y2="340" stroke="#8d99a8" strokeWidth="1.4" markerEnd="url(#p2-egress-arrow)" />
        </g>
        <text x="860" y="348" textAnchor="middle" fontSize="9" fontFamily="ui-monospace" fontWeight="700" fill="#5a6b7e">UP</text>
        <text x="900" y="348" textAnchor="middle" fontSize="9" fontFamily="ui-monospace" fontWeight="700" fill="#5a6b7e">DN</text>
        <text x="880" y="124" textAnchor="middle" fontSize="9" fontFamily="ui-monospace" fontWeight="700" fill="#1a2330">STAIR ST-1</text>
      </g>

      {/* ── Break room: counters, fridge, dishwasher, island ─────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#e7edf3" opacity="0.55">
        {/* Counter run along top */}
        <rect x="934" y="140" width="332" height="32" />
        <text x="1100" y="160" textAnchor="middle" fontSize="9" fill="#5a6b7e" fontFamily="ui-monospace">COUNTER · UPPER CABS ABOVE</text>
        {/* Sink */}
        <rect x="950" y="146" width="34" height="20" fill="#fff" stroke="#1a2330" />
        <circle cx="967" cy="156" r="3" fill="none" stroke="#1a2330" strokeWidth="0.6" />
        {/* Range */}
        <rect x="1000" y="142" width="46" height="28" fill="#fff" stroke="#1a2330" />
        {[1008, 1018, 1028, 1038].map((cx, i) => (
          <circle key={`burner-${i}`} cx={cx} cy="156" r="3" fill="none" stroke="#1a2330" strokeWidth="0.6" />
        ))}
        {/* Fridge */}
        <rect x="1062" y="142" width="36" height="28" fill="#fff" stroke="#1a2330" />
        <text x="1080" y="158" textAnchor="middle" fontSize="7" fill="#5a6b7e" fontFamily="ui-monospace">REF</text>
        {/* Dishwasher */}
        <rect x="1110" y="142" width="36" height="28" fill="#fff" stroke="#1a2330" />
        <text x="1128" y="158" textAnchor="middle" fontSize="7" fill="#5a6b7e" fontFamily="ui-monospace">DW</text>
        {/* Microwave + coffee */}
        <rect x="1160" y="142" width="36" height="28" fill="#fff" stroke="#1a2330" />
        <text x="1178" y="158" textAnchor="middle" fontSize="7" fill="#5a6b7e" fontFamily="ui-monospace">MW</text>
        <rect x="1210" y="142" width="44" height="28" fill="#fff" stroke="#1a2330" />
        <text x="1232" y="158" textAnchor="middle" fontSize="7" fill="#5a6b7e" fontFamily="ui-monospace">COFFEE</text>
        {/* Island */}
        <rect x="1040" y="220" width="180" height="60" fill="#fff" stroke="#1a2330" />
        <text x="1130" y="254" textAnchor="middle" fontSize="9" fill="#5a6b7e" fontFamily="ui-monospace">ISLAND · SEATS 6</text>
        {/* Bar stools */}
        {[1060, 1100, 1140, 1180, 1220].map((cx, i) => (
          <circle key={`stool-${i}`} cx={cx} cy={i % 2 === 0 ? 204 : 296} r="7" fill="#e7edf3" stroke="#1a2330" />
        ))}
      </g>

      {/* ── Corridor (B-row) — directional arrows ────────────────── */}
      <g stroke="#8d99a8" strokeWidth="1.5" fill="none" opacity="0.85">
        <line x1="380" y1="410" x2="700" y2="410" markerEnd="url(#p2-egress-arrow)" strokeDasharray="6 4" />
        <line x1="700" y1="410" x2="1100" y2="410" markerEnd="url(#p2-egress-arrow)" strokeDasharray="6 4" />
        <line x1="540" y1="410" x2="540" y2="540" markerEnd="url(#p2-egress-arrow)" strokeDasharray="6 4" />
      </g>
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="9" fill="#5a6b7e">
        <text x="420" y="403" fontWeight="700">EGRESS PATH · 44&quot; CLR</text>
      </g>

      {/* ── IT / Server room ─────────────────────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        {/* Server racks */}
        {[930, 950, 970, 990].map((x) => (
          <g key={`rack-${x}`}>
            <rect x={x} y="376" width="14" height="56" fill="#cdd6e0" stroke="#1a2330" />
            <line x1={x + 2} y1="386" x2={x + 12} y2="386" stroke="#1a2330" strokeWidth="0.5" />
            <line x1={x + 2} y1="392" x2={x + 12} y2="392" stroke="#1a2330" strokeWidth="0.5" />
            <line x1={x + 2} y1="398" x2={x + 12} y2="398" stroke="#1a2330" strokeWidth="0.5" />
            <line x1={x + 2} y1="404" x2={x + 12} y2="404" stroke="#1a2330" strokeWidth="0.5" />
            <line x1={x + 2} y1="410" x2={x + 12} y2="410" stroke="#1a2330" strokeWidth="0.5" />
            <line x1={x + 2} y1="416" x2={x + 12} y2="416" stroke="#1a2330" strokeWidth="0.5" />
            <line x1={x + 2} y1="422" x2={x + 12} y2="422" stroke="#1a2330" strokeWidth="0.5" />
          </g>
        ))}
        {/* Workbench */}
        <rect x="930" y="442" width="80" height="14" fill="#e7edf3" />
      </g>

      {/* ── Print / Copy room ────────────────────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        <rect x="1120" y="380" width="60" height="40" fill="#e7edf3" />
        <text x="1150" y="404" textAnchor="middle" fontSize="9" fill="#5a6b7e" fontFamily="ui-monospace">PLOTTER</text>
        <rect x="1200" y="380" width="40" height="40" fill="#e7edf3" />
        <text x="1220" y="404" textAnchor="middle" fontSize="8" fill="#5a6b7e" fontFamily="ui-monospace">COPIER</text>
        <rect x="1120" y="430" width="120" height="14" fill="#e7edf3" />
      </g>

      {/* ── Storage shelving ─────────────────────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#e7edf3" opacity="0.55">
        <rect x="710" y="556" width="120" height="18" />
        <rect x="710" y="582" width="120" height="18" />
        <rect x="710" y="608" width="120" height="18" />
        <rect x="710" y="634" width="120" height="18" />
        {[710, 740, 770, 800, 830].map((x) => (
          <line key={`shelf-${x}`} x1={x} y1="556" x2={x} y2="652" stroke="#1a2330" strokeWidth="0.4" />
        ))}
      </g>

      {/* ── Elevator (with car) ──────────────────────────────────── */}
      <g opacity="0.55">
        <rect x="850" y="556" width="60" height="92" fill="url(#p2-shaft-hatch)" stroke="#1a2330" strokeWidth="1.5" />
        <rect x="858" y="566" width="44" height="72" fill="#fff" stroke="#1a2330" strokeWidth="0.7" />
        <line x1="850" y1="610" x2="910" y2="610" stroke="#1a2330" strokeWidth="0.4" strokeDasharray="2 2" />
        <text x="880" y="606" textAnchor="middle" fontSize="9" fontFamily="ui-monospace" fontWeight="700" fill="#1a2330">EL-1</text>
        <text x="880" y="668" textAnchor="middle" fontSize="7" fontFamily="ui-monospace" fill="#5a6b7e">2,500 lb</text>
      </g>

      {/* ── Mechanical closet ────────────────────────────────────── */}
      <g opacity="0.55">
        <rect x="850" y="670" width="60" height="92" fill="#f5f6fa" stroke="#1a2330" strokeWidth="0.8" />
        <rect x="858" y="680" width="44" height="34" fill="#fff" stroke="#1a2330" strokeWidth="0.6" />
        <text x="880" y="702" textAnchor="middle" fontSize="7" fontFamily="ui-monospace" fill="#5a6b7e">AHU-2</text>
        <rect x="858" y="720" width="20" height="20" fill="#fff" stroke="#1a2330" strokeWidth="0.6" />
        <rect x="882" y="720" width="20" height="20" fill="#fff" stroke="#1a2330" strokeWidth="0.6" />
        <text x="880" y="754" textAnchor="middle" fontSize="8" fontFamily="ui-monospace" fontWeight="700" fill="#1a2330">MECH</text>
      </g>

      {/* ── Janitor closet ───────────────────────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="0.9" fill="#fff" opacity="0.55">
        <rect x="922" y="546" width="92" height="110" fill="#f5f6fa" />
        {/* Mop sink */}
        <rect x="930" y="554" width="22" height="22" fill="#fff" stroke="#1a2330" />
        <line x1="941" y1="556" x2="941" y2="574" strokeWidth="0.4" />
        {/* Shelves */}
        <rect x="960" y="556" width="48" height="14" fill="#e7edf3" />
        <rect x="960" y="576" width="48" height="14" fill="#e7edf3" />
        <text x="968" y="640" fontSize="8" fontFamily="ui-monospace" fontWeight="700" fill="#1a2330">JC</text>
      </g>

      {/* ── Women's restroom ─────────────────────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        {/* Stalls */}
        {[1028, 1062, 1096, 1130, 1162].map((cx, i) => i < 3 && (
          <g key={`wc-w-${cx}`}>
            <rect x={cx - 14} y="550" width="28" height="34" fill="#fff" stroke="#1a2330" />
            <ellipse cx={cx} cy="568" rx="9" ry="7" fill="#fff" stroke="#1a2330" />
          </g>
        ))}
        {/* Accessible stall */}
        <rect x="1112" y="550" width="62" height="40" fill="#fff" stroke="#1a2330" />
        <ellipse cx="1158" cy="568" rx="10" ry="8" fill="#fff" stroke="#1a2330" />
        <text x="1120" y="586" fontSize="7" fontFamily="ui-monospace" fill="#5a6b7e">ADA</text>
        {/* Lavatories */}
        {[1030, 1060, 1090, 1130, 1160].map((cx) => (
          <ellipse key={`lav-w-${cx}`} cx={cx} cy="624" rx="11" ry="8" fill="#e7edf3" stroke="#1a2330" />
        ))}
        {/* Mirror line */}
        <line x1="1020" y1="640" x2="1180" y2="640" strokeWidth="0.5" strokeDasharray="2 2" />
      </g>

      {/* ── Men's restroom ───────────────────────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        {/* Stalls */}
        {[1198, 1232].map((cx) => (
          <g key={`wc-m-${cx}`}>
            <rect x={cx - 14} y="556" width="28" height="34" fill="#fff" stroke="#1a2330" />
            <ellipse cx={cx} cy="574" rx="9" ry="7" fill="#fff" stroke="#1a2330" />
          </g>
        ))}
        {/* Urinals */}
        {[1196, 1222, 1248].map((cx) => (
          <rect key={`uri-${cx}`} x={cx - 9} y="612" width="18" height="14" fill="#e7edf3" stroke="#1a2330" />
        ))}
        {/* Lavatories */}
        {[1200, 1230, 1260].map((cx) => (
          <ellipse key={`lav-m-${cx}`} cx={cx} cy="660" rx="10" ry="8" fill="#e7edf3" stroke="#1a2330" />
        ))}
      </g>

      {/* ── Reception furniture (bottom-left) ────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        <path d="M 160 570 Q 250 552 340 570 L 340 600 L 160 600 Z" fill="#e7edf3" />
        <text x="250" y="588" textAnchor="middle" fontSize="9" fill="#5a6b7e" fontFamily="ui-monospace">RECEPTION DESK</text>
        {/* Reception chair */}
        <circle cx="250" cy="618" r="11" fill="#e7edf3" />
        {/* Couches */}
        <rect x="160" y="660" width="180" height="44" rx="4" fill="#e7edf3" />
        <rect x="160" y="660" width="44" height="44" rx="4" fill="#e7edf3" />
        <rect x="296" y="660" width="44" height="44" rx="4" fill="#e7edf3" />
        {/* Coffee table */}
        <rect x="220" y="720" width="60" height="32" rx="4" fill="#fff" />
        {/* Magazine rack */}
        <rect x="160" y="720" width="20" height="40" fill="#e7edf3" />
        {/* Plant */}
        <circle cx="324" cy="740" r="12" fill="#e7edf3" stroke="#9aa7b6" strokeDasharray="2 1" />
      </g>

      {/* ── Open workspace (collab tables) ───────────────────────── */}
      <g stroke="#9aa7b6" strokeWidth="1" fill="#fff" opacity="0.55">
        <rect x="440" y="600" width="220" height="60" />
        <text x="550" y="636" textAnchor="middle" fontSize="9" fill="#5a6b7e" fontFamily="ui-monospace">COLLAB · 12P</text>
        {[470, 530, 590].map((cx) => (
          <rect key={`open-ch-${cx}`} x={cx - 12} y="576" width="24" height="20" fill="#e7edf3" />
        ))}
        {[470, 530, 590].map((cx) => (
          <rect key={`open-ch2-${cx}`} x={cx - 12} y="664" width="24" height="20" fill="#e7edf3" />
        ))}
        <rect x="440" y="700" width="220" height="60" />
        <text x="550" y="736" textAnchor="middle" fontSize="9" fill="#5a6b7e" fontFamily="ui-monospace">COLLAB · 12P</text>
        {[470, 530, 590].map((cx) => (
          <rect key={`open-ch3-${cx}`} x={cx - 12} y="676" width="24" height="20" fill="#e7edf3" />
        ))}
      </g>

      {/* ── Lighting layout (2x4 troffers) ───────────────────────── */}
      <g stroke="#b0bbc8" strokeWidth="0.6" fill="none" opacity="0.7">
        {[180, 260, 460, 540, 620, 760, 820, 1000, 1080, 1200].map((cx) => (
          <g key={`light-row1-${cx}`}>
            <rect x={cx - 16} y="170" width="32" height="16" />
            <line x1={cx - 16} y1="170" x2={cx + 16} y2="186" />
            <line x1={cx - 16} y1="186" x2={cx + 16} y2="170" />
          </g>
        ))}
        {[180, 460, 540, 620, 760, 1000, 1080, 1200].map((cx) => (
          <g key={`light-row2-${cx}`}>
            <rect x={cx - 16} y="280" width="32" height="16" />
            <line x1={cx - 16} y1="280" x2={cx + 16} y2="296" />
            <line x1={cx - 16} y1="296" x2={cx + 16} y2="280" />
          </g>
        ))}
        {[180, 260, 460, 540, 620, 760, 1000, 1200].map((cx) => (
          <g key={`light-row3-${cx}`}>
            <rect x={cx - 16} y="600" width="32" height="16" />
            <line x1={cx - 16} y1="600" x2={cx + 16} y2="616" />
            <line x1={cx - 16} y1="616" x2={cx + 16} y2="600" />
          </g>
        ))}
        {[180, 260, 460, 540, 620, 760, 1000, 1200].map((cx) => (
          <g key={`light-row4-${cx}`}>
            <rect x={cx - 16} y="710" width="32" height="16" />
            <line x1={cx - 16} y1="710" x2={cx + 16} y2="726" />
            <line x1={cx - 16} y1="726" x2={cx + 16} y2="710" />
          </g>
        ))}
      </g>

      {/* ── HVAC supply ducts ────────────────────────────────────── */}
      <g stroke="#8d99a8" strokeWidth="2.5" fill="none" opacity="0.75">
        <path d="M 200 150 L 200 500 L 600 500 L 600 700 L 1000 700 L 1000 400 L 1240 400" strokeDasharray="6 4" />
        <path d="M 200 250 L 350 250" strokeDasharray="6 4" />
        <path d="M 200 380 L 350 380" strokeDasharray="6 4" />
        <path d="M 600 600 L 850 600" strokeDasharray="6 4" />
        <path d="M 1000 200 L 1240 200" strokeDasharray="6 4" />
        <path d="M 1000 300 L 1240 300" strokeDasharray="6 4" />
        <path d="M 440 240 L 660 240" strokeDasharray="6 4" />
        <path d="M 760 220 L 760 340" strokeDasharray="6 4" />
      </g>
      {/* HVAC supply diffusers */}
      <g fill="#8d99a8" stroke="#5a6b7e" strokeWidth="0.8" opacity="0.85">
        {[
          [200, 200], [200, 320], [200, 440], [350, 250], [350, 380],
          [550, 250], [550, 380], [820, 250], [600, 600], [1080, 200],
          [1080, 300], [1080, 600], [1200, 700], [780, 700], [460, 700],
          [460, 240], [620, 240], [760, 240], [780, 600], [960, 400],
          [1200, 400], [1080, 700],
        ].map(([cx, cy], i) => (
          <g key={`diff-${i}`}>
            <rect x={cx - 9} y={cy - 9} width="18" height="18" fill="url(#p2-duct-hatch)" stroke="#8d99a8" strokeWidth="0.7" />
            <line x1={cx - 9} y1={cy - 9} x2={cx + 9} y2={cy + 9} stroke="#8d99a8" strokeWidth="0.4" />
            <line x1={cx - 9} y1={cy + 9} x2={cx + 9} y2={cy - 9} stroke="#8d99a8" strokeWidth="0.4" />
          </g>
        ))}
      </g>
      {/* Return-air grilles (parallel lines) */}
      <g stroke="#5a6b7e" strokeWidth="0.8" fill="none" opacity="0.8">
        {[
          [300, 470], [620, 470], [890, 470], [240, 700], [620, 540],
        ].map(([cx, cy], i) => (
          <g key={`return-${i}`}>
            <rect x={cx - 10} y={cy - 10} width="20" height="20" fill="#fff" />
            <line x1={cx - 8} y1={cy - 6} x2={cx + 8} y2={cy - 6} />
            <line x1={cx - 8} y1={cy - 2} x2={cx + 8} y2={cy - 2} />
            <line x1={cx - 8} y1={cy + 2} x2={cx + 8} y2={cy + 2} />
            <line x1={cx - 8} y1={cy + 6} x2={cx + 8} y2={cy + 6} />
          </g>
        ))}
      </g>
      {/* VAV boxes */}
      <g stroke="#5a6b7e" strokeWidth="0.8" fill="#fff" opacity="0.9">
        {[[270, 200], [800, 200], [1140, 250], [600, 670]].map(([cx, cy], i) => (
          <g key={`vav-${i}`}>
            <rect x={cx - 12} y={cy - 8} width="24" height="16" />
            <text x={cx} y={cy + 3} textAnchor="middle" fontSize="7" fontFamily="ui-monospace" fontWeight="700" fill="#5a6b7e">VAV</text>
          </g>
        ))}
      </g>
      {/* Exhaust fans (restrooms / mech) */}
      <g stroke="#5a6b7e" strokeWidth="0.9" fill="#fff" opacity="0.85">
        {[[1080, 690], [1230, 690], [880, 730]].map(([cx, cy], i) => (
          <g key={`exhaust-${i}`}>
            <circle cx={cx} cy={cy} r="9" />
            <path d={`M ${cx - 6} ${cy} A 6 6 0 0 1 ${cx + 6} ${cy}`} fill="none" />
            <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} strokeWidth="0.5" />
            <line x1={cx - 9} y1={cy} x2={cx + 9} y2={cy} strokeWidth="0.5" />
          </g>
        ))}
      </g>

      {/* ── Plumbing supply (cold/hot) ───────────────────────────── */}
      <g stroke="#8d99a8" strokeWidth="0.9" fill="none" opacity="0.75">
        <path d="M 1042 660 L 1042 540 L 1260 540" strokeDasharray="4 2" />
        <path d="M 1080 660 L 1080 540" strokeDasharray="4 2" />
        <path d="M 1130 590 L 1130 540" strokeDasharray="4 2" />
        <path d="M 1230 660 L 1230 540" strokeDasharray="4 2" />
        <path d="M 970 160 L 970 132" strokeDasharray="4 2" />
        <text x="1265" y="535" fontSize="9" fill="#5a6b7e" fontFamily="ui-monospace">CW · HW · SAN</text>
      </g>

      {/* ── Sprinkler heads ──────────────────────────────────────── */}
      <g stroke="#5a6b7e" strokeWidth="0.5" fill="#fff" opacity="0.55">
        {[
          [180, 170], [260, 170], [330, 170], [180, 270], [260, 270], [330, 270],
          [180, 440], [260, 440], [180, 580], [260, 580], [180, 720], [260, 720],
          [430, 170], [510, 170], [600, 170], [680, 170],
          [430, 320], [510, 320], [600, 320], [680, 320],
          [460, 600], [540, 600], [620, 600], [460, 720], [540, 720], [620, 720],
          [740, 200], [800, 200], [740, 300], [800, 300],
          [880, 200], [880, 280], [880, 580], [880, 700],
          [960, 200], [1040, 200], [1120, 200], [1200, 200], [1240, 200],
          [960, 280], [1040, 280], [1120, 280], [1200, 280], [1240, 280],
          [960, 400], [1040, 400], [1130, 400], [1220, 400],
          [960, 470], [1130, 470], [1220, 470],
          [1040, 580], [1130, 580], [1220, 580], [1040, 700], [1130, 700], [1220, 700],
        ].map(([cx, cy], i) => (
          <g key={`sprink-${i}`}>
            <circle cx={cx} cy={cy} r="3.5" />
            <circle cx={cx} cy={cy} r="1" fill="#5a6b7e" />
          </g>
        ))}
      </g>

      {/* ── Fire extinguishers ───────────────────────────────────── */}
      <g fill="#8d99a8" stroke="#5a6b7e" strokeWidth="0.6">
        {[[180, 410], [690, 410], [870, 410], [1100, 410]].map(([cx, cy], i) => (
          <g key={`fe-${i}`}>
            <rect x={cx - 5} y={cy - 7} width="10" height="14" rx="1" />
            <text x={cx + 8} y={cy + 3} fontSize="7" fontFamily="ui-monospace" fontWeight="700" fill="#5a6b7e">FE</text>
          </g>
        ))}
      </g>

      {/* ── Wall type tags (W1, W2, W3) ──────────────────────────── */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="8" fill="#1a2330">
        {[
          { x: 420, y: 480, label: 'W1', tx: 420, ty: 540 },
          { x: 880, y: 480, label: 'W2', tx: 920, ty: 460 },
          { x: 1000, y: 510, label: 'W3', tx: 1020, ty: 540 },
          { x: 350, y: 326, label: 'W1', tx: 380, ty: 320 },
        ].map(({ x, y, label, tx, ty }, i) => (
          <g key={`wt-${i}`}>
            <line x1={x} y1={y} x2={tx} y2={ty} stroke="#5a6b7e" strokeWidth="0.5" markerEnd="url(#p2-leader-arrow)" />
            <circle cx={x} cy={y} r="9" fill="#fff" stroke="#1a2330" strokeWidth="0.8" />
            <text x={x} y={y + 3} textAnchor="middle" fontWeight="700">{label}</text>
          </g>
        ))}
      </g>

      {/* ╚════ END DIMMED LAYER · 2 of 3 ═══════════════════════════╝ */}
      </g>

      {/* ── Section markers ──────────────────────────────────────── */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10" fontWeight="700">
        {/* Section A-A across the building */}
        <g>
          <line x1="100" y1="450" x2="1300" y2="450" stroke="#1a2330" strokeWidth="0.5" strokeDasharray="14 4 2 4" />
          <circle cx="80" cy="450" r="14" fill="#1a2330" />
          <text x="80" y="454" textAnchor="middle" fill="#fff">A</text>
          <polygon points="80,464 74,478 86,478" fill="#1a2330" />
          <circle cx="1320" cy="450" r="14" fill="#1a2330" />
          <text x="1320" y="454" textAnchor="middle" fill="#fff">A</text>
          <polygon points="1320,464 1314,478 1326,478" fill="#1a2330" />
        </g>
        {/* Section B-B vertical */}
        <g>
          <line x1="780" y1="92" x2="780" y2="820" stroke="#1a2330" strokeWidth="0.5" strokeDasharray="14 4 2 4" />
          <circle cx="780" cy="76" r="14" fill="#1a2330" />
          <text x="780" y="80" textAnchor="middle" fill="#fff">B</text>
          <polygon points="794,76 808,70 808,82" fill="#1a2330" />
          <circle cx="780" cy="838" r="14" fill="#1a2330" />
          <text x="780" y="842" textAnchor="middle" fill="#fff">B</text>
          <polygon points="794,838 808,832 808,844" fill="#1a2330" />
        </g>
      </g>

      {/* ╔════ DIMMED LAYER · 3 of 3 ════════════════════════════════╗ */}
      <g opacity="0.5">

      {/* ── Room labels ──────────────────────────────────────────── */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill="#1a2330" textAnchor="middle">
        <text x="250" y="210" fontSize="12" fontWeight="700">CONFERENCE</text>
        <text x="250" y="224" fontSize="9" fill="#5a6b7e">101 · 425 sf</text>

        <text x="250" y="370" fontSize="11" fontWeight="700">HUDDLE / LOUNGE</text>
        <text x="250" y="384" fontSize="9" fill="#5a6b7e">102 · 220 sf</text>

        <text x="540" y="158" fontSize="12" fontWeight="700">OPEN OFFICE</text>
        <text x="540" y="172" fontSize="9" fill="#5a6b7e">103 · 612 sf · 12 WS</text>

        <text x="780" y="158" fontSize="12" fontWeight="700">MANAGER</text>
        <text x="780" y="172" fontSize="9" fill="#5a6b7e">104 · 224 sf</text>

        <text x="1100" y="138" fontSize="11" fontWeight="700">BREAK ROOM</text>
        <text x="1100" y="152" fontSize="9" fill="#5a6b7e">105 · 480 sf</text>

        <text x="970" y="430" fontSize="10" fontWeight="700">IT / SERVER 106</text>
        <text x="1150" y="430" fontSize="10" fontWeight="700">PRINT / COPY 107</text>

        <text x="250" y="654" fontSize="12" fontWeight="700">RECEPTION</text>
        <text x="250" y="668" fontSize="9" fill="#5a6b7e">108 · 380 sf</text>

        <text x="550" y="566" fontSize="12" fontWeight="700">OPEN WORKSPACE</text>
        <text x="550" y="580" fontSize="9" fill="#5a6b7e">109 · 412 sf</text>

        <text x="770" y="566" fontSize="10" fontWeight="700">STORAGE 110</text>

        <text x="1060" y="640" fontSize="9" fontWeight="700" fill="#5a6b7e">RESTROOM W · 111</text>
        <text x="1220" y="640" fontSize="9" fontWeight="700" fill="#5a6b7e">RESTROOM M · 112</text>
      </g>

      {/* ── North arrow ──────────────────────────────────────────── */}
      <g transform="translate(140 830)">
        <circle cx="0" cy="0" r="24" fill="white" stroke="#1a2330" strokeWidth="1.1" />
        <path d="M 0 -18 L 6 12 L 0 6 L -6 12 Z" fill="#1a2330" />
        <text x="0" y="-26" textAnchor="middle" fontSize="9" fontFamily="ui-monospace" fontWeight="700" fill="#1a2330">N</text>
      </g>

      {/* ── Scale bar ────────────────────────────────────────────── */}
      <g transform="translate(220 830)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="8" fill="#1a2330">
        <rect x="0" y="-5" width="180" height="9" fill="#fff" stroke="#1a2330" strokeWidth="0.6" />
        <rect x="0" y="-5" width="45" height="9" fill="#1a2330" />
        <rect x="90" y="-5" width="45" height="9" fill="#1a2330" />
        <text x="0" y="14">0</text>
        <text x="45" y="14">8&apos;</text>
        <text x="90" y="14">16&apos;</text>
        <text x="180" y="14">32&apos;</text>
        <text x="90" y="-10" textAnchor="middle" fontWeight="700">SCALE 1/8&quot; = 1&apos;-0&quot;</text>
      </g>

      {/* ── Legend (top-right strip) ─────────────────────────────── */}
      <g transform="translate(1320 90)" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="9" fill="#1a2330">
        <rect x="0" y="0" width="60" height="150" fill="#fff" stroke="#1a2330" strokeWidth="0.7" />
        <text x="30" y="14" textAnchor="middle" fontWeight="700" fontSize="9">LEGEND</text>
        {/* Diffuser */}
        <rect x="8" y="22" width="10" height="10" fill="url(#p2-duct-hatch)" stroke="#8d99a8" strokeWidth="0.6" />
        <text x="22" y="31" fontSize="8">DIFF</text>
        {/* Return */}
        <rect x="8" y="38" width="10" height="10" fill="#fff" stroke="#5a6b7e" strokeWidth="0.6" />
        <line x1="10" y1="42" x2="16" y2="42" stroke="#5a6b7e" strokeWidth="0.4" />
        <line x1="10" y1="46" x2="16" y2="46" stroke="#5a6b7e" strokeWidth="0.4" />
        <text x="22" y="47" fontSize="8">RET</text>
        {/* Sprinkler */}
        <circle cx="13" cy="58" r="4" fill="#fff" stroke="#5a6b7e" strokeWidth="0.5" />
        <circle cx="13" cy="58" r="1" fill="#5a6b7e" />
        <text x="22" y="61" fontSize="8">SPR</text>
        {/* Light */}
        <rect x="8" y="72" width="10" height="6" fill="none" stroke="#b0bbc8" strokeWidth="0.5" />
        <line x1="8" y1="72" x2="18" y2="78" stroke="#b0bbc8" strokeWidth="0.5" />
        <line x1="8" y1="78" x2="18" y2="72" stroke="#b0bbc8" strokeWidth="0.5" />
        <text x="22" y="78" fontSize="8">LITE</text>
        {/* Egress */}
        <line x1="8" y1="92" x2="18" y2="92" stroke="#8d99a8" strokeWidth="1" markerEnd="url(#p2-egress-arrow)" />
        <text x="22" y="95" fontSize="8">EGR</text>
        {/* FE */}
        <rect x="9" y="104" width="8" height="10" fill="#8d99a8" />
        <text x="22" y="111" fontSize="8">EXT</text>
        {/* Door tag */}
        <polygon points="13 122 17 124 17 128 13 130 9 128 9 124" fill="#fff" stroke="#1a2330" strokeWidth="0.5" />
        <text x="22" y="128" fontSize="8">DR#</text>
        {/* Wall type */}
        <circle cx="13" cy="140" r="5" fill="#fff" stroke="#1a2330" strokeWidth="0.6" />
        <text x="13" y="143" textAnchor="middle" fontSize="6" fontWeight="700">W</text>
        <text x="22" y="143" fontSize="8">WALL</text>
      </g>

      {/* ╚════ END DIMMED LAYER · 3 of 3 ═══════════════════════════╝ */}
      </g>

      {/* ── AI-placed dimensions (revealed by the "Dimension" tool) ─ */}
      {showDimensions && (
        <g
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="11"
          fontWeight={700}
          style={{ animation: 'pro2-dim-in 280ms ease-out both' }}
        >
          {/* Arrow marker — magenta for Wall 23, blue for the rest */}
          <defs>
            <marker
              id="p2-dim-arrow-magenta"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF00D3" />
            </marker>
            <marker
              id="p2-dim-arrow-blue"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0063A3" />
            </marker>
          </defs>

          {/* ── Wall 23 vertical dimension (magenta, prominent) ─── */}
          <g stroke="#FF00D3" fill="#FF00D3">
            {/* Witness lines from wall extents to dim line */}
            <line x1="700" y1="134" x2="640" y2="134" strokeWidth="0.8" />
            <line x1="700" y1="360" x2="640" y2="360" strokeWidth="0.8" />
            {/* Dim line with arrows */}
            <line
              x1="652"
              y1="138"
              x2="652"
              y2="356"
              strokeWidth="1"
              markerStart="url(#p2-dim-arrow-magenta)"
              markerEnd="url(#p2-dim-arrow-magenta)"
            />
            {/* Dim text background pill */}
            <rect
              x="624"
              y="237"
              width="56"
              height="20"
              rx="3"
              fill="#ffffff"
              stroke="#FF00D3"
              strokeWidth="0.8"
            />
            <text x="652" y="251" textAnchor="middle" stroke="none">
              22&apos;-6&quot;
            </text>
          </g>

          {/* ── Overall building width (top, blue) ─────────────── */}
          <g stroke="#0063A3" fill="#0063A3">
            <line x1="120" y1="120" x2="120" y2="92" strokeWidth="0.8" />
            <line x1="1280" y1="120" x2="1280" y2="92" strokeWidth="0.8" />
            <line
              x1="124"
              y1="100"
              x2="1276"
              y2="100"
              strokeWidth="1"
              markerStart="url(#p2-dim-arrow-blue)"
              markerEnd="url(#p2-dim-arrow-blue)"
            />
            <rect
              x="660"
              y="90"
              width="80"
              height="20"
              rx="3"
              fill="#ffffff"
              stroke="#0063A3"
              strokeWidth="0.8"
            />
            <text x="700" y="104" textAnchor="middle" stroke="none">
              116&apos;-0&quot;
            </text>
          </g>

          {/* ── Overall building depth (left, blue) ────────────── */}
          <g stroke="#0063A3" fill="#0063A3">
            <line x1="120" y1="120" x2="92" y2="120" strokeWidth="0.8" />
            <line x1="120" y1="780" x2="92" y2="780" strokeWidth="0.8" />
            <line
              x1="100"
              y1="124"
              x2="100"
              y2="776"
              strokeWidth="1"
              markerStart="url(#p2-dim-arrow-blue)"
              markerEnd="url(#p2-dim-arrow-blue)"
            />
            <rect
              x="72"
              y="440"
              width="56"
              height="20"
              rx="3"
              fill="#ffffff"
              stroke="#0063A3"
              strokeWidth="0.8"
              transform="rotate(-90 100 450)"
            />
            <text
              x="100"
              y="454"
              textAnchor="middle"
              stroke="none"
              transform="rotate(-90 100 450)"
            >
              66&apos;-0&quot;
            </text>
          </g>

          {/* ── Conference room interior width (blue) ──────────── */}
          <g stroke="#0063A3" fill="#0063A3">
            <line x1="140" y1="195" x2="140" y2="172" strokeWidth="0.8" />
            <line x1="360" y1="195" x2="360" y2="172" strokeWidth="0.8" />
            <line
              x1="144"
              y1="180"
              x2="356"
              y2="180"
              strokeWidth="1"
              markerStart="url(#p2-dim-arrow-blue)"
              markerEnd="url(#p2-dim-arrow-blue)"
            />
            <rect
              x="226"
              y="170"
              width="48"
              height="18"
              rx="3"
              fill="#ffffff"
              stroke="#0063A3"
              strokeWidth="0.8"
            />
            <text x="250" y="183" textAnchor="middle" stroke="none" fontSize="10">
              22&apos;-0&quot;
            </text>
          </g>

          {/* ── Corridor width (blue) ───────────────────────────── */}
          <g stroke="#0063A3" fill="#0063A3">
            <line x1="540" y1="475" x2="520" y2="475" strokeWidth="0.8" />
            <line x1="540" y1="540" x2="520" y2="540" strokeWidth="0.8" />
            <line
              x1="528"
              y1="479"
              x2="528"
              y2="536"
              strokeWidth="1"
              markerStart="url(#p2-dim-arrow-blue)"
              markerEnd="url(#p2-dim-arrow-blue)"
            />
            <rect
              x="500"
              y="498"
              width="44"
              height="18"
              rx="3"
              fill="#ffffff"
              stroke="#0063A3"
              strokeWidth="0.8"
            />
            <text x="522" y="511" textAnchor="middle" stroke="none" fontSize="10">
              6&apos;-6&quot;
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}

/* ── Floating right-click context menu ───────────────────────────── */
function ContextMenu({
  x,
  y,
  onPointerDown,
  onSelect,
}: {
  x: number;
  y: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onSelect: (id: ActionId) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute"
      style={{
        top: y,
        left: x,
        zIndex: 20,
        filter:
          'drop-shadow(0px 14px 28px rgba(0,0,0,0.22)) drop-shadow(0px 2px 4px rgba(0,0,0,0.12))',
        animation: 'pro2-pop 120ms ease-out',
      }}
    >
      {/* Pointer notch */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -6,
          left: 18,
          width: 12,
          height: 12,
          backgroundColor: '#ffffff',
          transform: 'rotate(45deg)',
          borderTopLeftRadius: 2,
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderLeft: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          zIndex: 0,
        }}
      />

      <div
        className="relative bg-white rounded-xl flex flex-col"
        style={{
          width: 280,
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        {/* AI tools section header */}
        <div className="flex items-center gap-1.5 px-3 pt-1 pb-1.5">
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            AI tools
          </span>
          <span
            className="flex-1"
            aria-hidden="true"
            style={{
              height: 1,
              backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)',
            }}
          />
        </div>

        {/* AI-tool rows */}
        <div className="flex flex-col px-1.5">
          {ACTIONS.map((action) => {
            const isHovered = hovered === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onMouseEnter={() => setHovered(action.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(action.id)}
                className="flex items-center gap-2.5 text-left rounded-md cursor-pointer"
                style={{
                  padding: '6px 8px',
                  backgroundColor: isHovered
                    ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                    : 'transparent',
                  border: 'none',
                  transition: 'background-color 120ms ease',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: action.tint,
                    boxShadow: isHovered
                      ? `0 0 0 3px ${action.tint}22`
                      : 'none',
                    transition: 'box-shadow 120ms ease',
                  }}
                >
                  <ModusWcIcon
                    name={action.icon}
                    size="sm"
                    decorative
                    style={{ color: '#ffffff' }}
                  />
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: '18px',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {action.label}
                  </span>
                  <span
                    className="truncate"
                    style={{
                      fontSize: 11,
                      lineHeight: '16px',
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    }}
                  >
                    {action.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Pro 2 — full-bleed CAD canvas + right-click magic menu ────── */
export default function Pro2() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; visible: boolean }>(
    { x: 660, y: 200, visible: false },
  );
  const [showDimensions, setShowDimensions] = useState(false);
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [status, setStatus] = useState<
    | {
        phase: 'processing' | 'done';
        tint: string;
        icon: string;
        label: string;
        stat: string;
      }
    | null
  >(null);

  /* Constrain (x, y) so the menu stays fully inside the wrapper. */
  function clampToWrapper(x: number, y: number) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return { x, y };
    const menuW = 312;
    const menuH = 360;
    return {
      x: Math.min(Math.max(8, x), rect.width - menuW - 8),
      y: Math.min(Math.max(8, y), rect.height - menuH - 8),
    };
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { x, y } = clampToWrapper(e.clientX - rect.left, e.clientY - rect.top);
    setMenu({ x, y, visible: true });
  }

  function handleClick() {
    setMenu((prev) => ({ ...prev, visible: false }));
    if (status?.phase === 'done') setStatus(null);
  }

  function handleMouseMove(e: React.MouseEvent) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    cursorRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    if (status) setCursor(cursorRef.current);
  }

  function handleSelect(id: ActionId) {
    const action = ACTIONS.find((a) => a.id === id);
    if (!action) return;

    setMenu((prev) => ({ ...prev, visible: false }));

    const stat: Record<ActionId, string> = {
      dimension: '+5 placed',
      spell: '0 typos',
      compliance: '0 issues',
      label: '+12 added',
    };

    /* Seed the indicator's starting position from the most recent cursor
     * sample so it appears exactly where the pointer is, before the next
     * mousemove ticks in. */
    setCursor(cursorRef.current);
    setStatus({
      phase: 'processing',
      tint: action.tint,
      icon: action.icon,
      label: action.label,
      stat: stat[id],
    });

    window.clearTimeout((handleSelect as any)._processT);
    window.clearTimeout((handleSelect as any)._doneT);

    (handleSelect as any)._processT = window.setTimeout(() => {
      if (id === 'dimension') setShowDimensions(true);
      setStatus((prev) =>
        prev ? { ...prev, phase: 'done' } : prev,
      );
      (handleSelect as any)._doneT = window.setTimeout(
        () => setStatus(null),
        2400,
      );
    }, 900);
  }

  /* On mount, re-clamp the initial position once we know the wrapper
   * size — otherwise the default position can fall outside small windows. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      setMenu((prev) => {
        const { x, y } = clampToWrapper(prev.x, prev.y);
        return { ...prev, x, y };
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      ref={wrapperRef}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 overflow-hidden select-none"
      style={{
        backgroundColor: '#f3f6fa',
        cursor: status?.phase === 'processing' ? 'progress' : 'context-menu',
      }}
    >
      <style>{`
        @keyframes pro2-pop {
          from { opacity: 0; transform: translateY(-4px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes pro2-dim-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pro2-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pro2-check-pop {
          0%   { opacity: 0; transform: scale(0.5); }
          60%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* CAD canvas — gently dims when the menu is open so the
       *  colorful AI-tools card reads as the figure. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: menu.visible ? 0.55 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        <FloorPlan showDimensions={showDimensions} />
      </div>

      {/* Floating context menu */}
      {menu.visible && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onPointerDown={(e) => e.stopPropagation()}
          onSelect={handleSelect}
        />
      )}

      {/* Cursor-attached status indicator — first spinner, then result. */}
      {status && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: cursor.y + 14,
            left: cursor.x + 14,
            zIndex: 25,
            filter:
              'drop-shadow(0px 8px 18px rgba(0,0,0,0.22)) drop-shadow(0px 2px 4px rgba(0,0,0,0.12))',
            animation: 'pro2-pop 140ms ease-out',
            transition: 'top 80ms linear, left 80ms linear',
          }}
        >
          <div
            className="relative bg-white rounded-full flex items-center gap-2"
            style={{
              border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              padding: '6px 12px 6px 6px',
              height: 32,
            }}
          >
            {/* Leading icon — spinner while processing, tool icon when done */}
            {status.phase === 'processing' ? (
              <div
                className="rounded-full"
                style={{
                  width: 20,
                  height: 20,
                  border: `2px solid ${status.tint}33`,
                  borderTopColor: status.tint,
                  animation: 'pro2-spin 700ms linear infinite',
                }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: '#1AB1A0',
                  animation: 'pro2-check-pop 260ms ease-out',
                }}
              >
                <ModusWcIcon
                  name="check"
                  size="xs"
                  decorative
                  style={{ color: '#ffffff', fontSize: 12 }}
                />
              </div>
            )}

            {/* Status text */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                whiteSpace: 'nowrap',
              }}
            >
              {status.phase === 'processing'
                ? `${status.label}…`
                : status.label}
            </span>

            {/* Stat chip — only after the action completes */}
            {status.phase === 'done' && (
              <span
                className="rounded-full"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.2px',
                  padding: '2px 7px',
                  backgroundColor: `${status.tint}1A`,
                  color: status.tint,
                  whiteSpace: 'nowrap',
                }}
              >
                {status.stat}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
