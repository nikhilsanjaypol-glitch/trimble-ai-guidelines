import { useEffect, useRef, useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const QUESTION =
  'Why was beam B-2.04 upgraded from W14×30 to W14×34 in REV 03?';

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'cite'; sourceId: number };

const ANSWER_BODY: Segment[] = [
  {
    kind: 'text',
    value:
      "The unbraced length at this beam (**3.6 m**) exceeds the W14×30's L\u209a of **2.8 m**. Once L_b exceeds L\u209a, the section's flexural strength is reduced by **inelastic lateral-torsional buckling** — it can no longer reach its full plastic moment.",
  },
  { kind: 'cite', sourceId: 1 },
  {
    kind: 'text',
    value:
      ' **W14×34** is the lightest section that restores full capacity at this span.',
  },
];

type Source = {
  id: number;
  doc: string;
  section: string;
  quote: string;
};

const SOURCES: Source[] = [
  {
    id: 1,
    doc: 'AISC 360-22',
    section: '§ F2.2 — Lateral-Torsional Buckling',
    quote:
      'When the unbraced length L_b exceeds L_p, **nominal flexural strength is reduced by inelastic lateral-torsional buckling**. A larger section is required to develop the full plastic moment.',
  },
];

const FLAGGED_BEAM = { x: 1200, y: 1100 };

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3.0;
const INITIAL_ZOOM = 0.5;
const CANVAS_W = 2400;
const CANVAS_H = 1800;
const FIT_PADDING = 40;

const COL_X = [300, 660, 1020, 1380, 1740];
const COL_LABELS = ['A', 'B', 'C', 'D', 'E'];
const ROW_Y = [200, 650, 1100, 1550];
const ROW_LABELS = ['1', '2', '3', '4'];

/* ── Trimble AI logo (mono variant available) ───────────────────── */
function TrimbleAiLogo({ size = 18, mono = false }: { size?: number; mono?: boolean }) {
  return (
    <svg viewBox="0 0 30.002 32.6797" width={size} height={size} fill="none" aria-hidden="true">
      {!mono && (
        <defs>
          <linearGradient id="expert4-logo" x1="3.7558" y1="10.5251" x2="20.4332" y2="30.2565" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF2BFC" />
            <stop offset="0.628993" stopColor="#0563A7" />
            <stop offset="1" stopColor="#075CA4" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M1.69824 24.9697C3.48353 26.9109 5.82653 28.2524 8.4043 28.8096L1.69824 32.6797V24.9697ZM10.6523 5.60742C16.5357 5.60742 21.3057 10.3803 21.3057 16.2676C21.3055 22.1547 16.5356 26.9268 10.6523 26.9268C4.76928 26.9265 0.00017177 22.1545 0 16.2676C0 10.3805 4.76918 5.60766 10.6523 5.60742ZM10.6523 7.69238C5.9201 7.69263 2.08398 11.5321 2.08398 16.2676C2.08416 21.0029 5.92021 24.8416 10.6523 24.8418C15.3847 24.8418 19.2215 21.003 19.2217 16.2676C19.2217 11.532 15.3848 7.69238 10.6523 7.69238ZM30.002 16.3398L23.2803 20.2217C24.0854 17.7019 24.0922 14.9945 23.2998 12.4707L30.002 16.3398ZM8.35547 3.83691C5.79861 4.40439 3.47535 5.73916 1.69824 7.66309V0L8.35547 3.83691Z"
        fill={mono ? '#ffffff' : 'url(#expert4-logo)'}
      />
    </svg>
  );
}

/* ── Highlighted quote — text inside **double-asterisks** is highlighted */
function HighlightedQuote({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span style={{ fontSize: 12, lineHeight: '17px', color: '#171c1e', fontStyle: 'italic' }}>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span
              key={idx}
              style={{
                backgroundColor: '#fff1cf',
                color: '#171c1e',
                padding: '1px 3px',
                borderRadius: 2,
                fontWeight: 600,
                fontStyle: 'normal',
              }}
            >
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

function FramingPlan() {
  const inkThin = '#1f242c';
  const inkLight = '#5a5f6a';
  const inkFaint = '#9ea3ad';

  const horizontalBeams: number[][] = [];
  for (const y of ROW_Y) {
    for (let i = 0; i < COL_X.length - 1; i++) {
      horizontalBeams.push([COL_X[i], y, COL_X[i + 1], y]);
    }
  }
  const verticalBeams: number[][] = [];
  for (const x of COL_X) {
    for (let i = 0; i < ROW_Y.length - 1; i++) {
      verticalBeams.push([x, ROW_Y[i], x, ROW_Y[i + 1]]);
    }
  }

  const FLAG_X1 = COL_X[2];
  const FLAG_X2 = COL_X[3];
  const FLAG_Y = ROW_Y[2];
  const FLAG_MID_X = (FLAG_X1 + FLAG_X2) / 2;

  const OPEN_X1 = COL_X[3] + 28;
  const OPEN_X2 = COL_X[4] - 28;
  const OPEN_Y1 = ROW_Y[0] + 28;
  const OPEN_Y2 = ROW_Y[1] - 28;

  const BR_X1 = COL_X[0];
  const BR_X2 = COL_X[1];
  const BR_Y1 = ROW_Y[1];
  const BR_Y2 = ROW_Y[2];

  type Joist = { x: number; y1: number; y2: number };
  const joists: Joist[] = [];
  for (let xb = 0; xb < COL_X.length - 1; xb++) {
    for (let yb = 0; yb < ROW_Y.length - 1; yb++) {
      const xs = COL_X[xb];
      const xe = COL_X[xb + 1];
      const j1 = xs + (xe - xs) / 3;
      const j2 = xs + (2 * (xe - xs)) / 3;
      const ys = ROW_Y[yb];
      const ye = ROW_Y[yb + 1];
      const inOpening = xb === 3 && yb === 0;
      const inBrace = xb === 0 && yb === 1;
      if (inOpening || inBrace) continue;
      joists.push({ x: j1, y1: ys, y2: ye });
      joists.push({ x: j2, y1: ys, y2: ye });
    }
  }

  const columns: Array<{ x: number; y: number }> = [];
  for (const x of COL_X) for (const y of ROW_Y) columns.push({ x, y });

  const beamLabels = [
    { x: (COL_X[0] + COL_X[1]) / 2, y: ROW_Y[0] - 8, text: 'W14x30' },
    { x: (COL_X[1] + COL_X[2]) / 2, y: ROW_Y[1] - 8, text: 'W14x30' },
    { x: (COL_X[2] + COL_X[3]) / 2, y: ROW_Y[2] - 8, text: 'W14x30' },
    { x: COL_X[1] - 22, y: (ROW_Y[1] + ROW_Y[2]) / 2, text: 'W21x44' },
    { x: COL_X[3] + 22, y: (ROW_Y[0] + ROW_Y[1]) / 2, text: 'W21x44' },
    { x: COL_X[4] + 22, y: (ROW_Y[2] + ROW_Y[3]) / 2, text: 'W21x44' },
  ];

  const memberTags = [
    { x: (COL_X[0] + COL_X[1]) / 2, y: ROW_Y[0], label: 'B-1.01' },
    { x: (COL_X[1] + COL_X[2]) / 2, y: ROW_Y[2], label: 'B-3.02' },
    { x: COL_X[2], y: (ROW_Y[1] + ROW_Y[2]) / 2, label: 'G-C.02' },
  ];

  return (
    <svg width="2400" height="1800" viewBox="0 0 2400 1800" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <defs>
        <pattern id="hatch-shaft" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={inkThin} strokeWidth="0.5" />
        </pattern>
        <pattern id="hatch-opening" patternUnits="userSpaceOnUse" width="14" height="14">
          <line x1="0" y1="14" x2="14" y2="0" stroke={inkThin} strokeWidth="0.4" />
          <line x1="0" y1="0" x2="14" y2="14" stroke={inkThin} strokeWidth="0.4" />
        </pattern>
        <marker id="arrow-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={inkFaint} />
        </marker>
        <marker id="arrow-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 10 0 L 0 5 L 10 10 z" fill={inkFaint} />
        </marker>
      </defs>

      <rect width="2400" height="1800" fill="#fafaf2" />

      {/* Faint paper grid */}
      <g opacity="0.06">
        {Array.from({ length: 49 }).map((_, i) => (
          <line key={`pgx-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="1800" stroke="#000" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 37 }).map((_, i) => (
          <line key={`pgy-${i}`} x1="0" y1={i * 50} x2="2400" y2={i * 50} stroke="#000" strokeWidth="0.5" />
        ))}
      </g>

      <rect x="60" y="60" width="2280" height="1680" fill="none" stroke={inkThin} strokeWidth="2.5" />
      <rect x="80" y="80" width="2240" height="1640" fill="none" stroke={inkThin} strokeWidth="0.75" />

      <rect
        x={COL_X[0] - 20}
        y={ROW_Y[0] - 20}
        width={COL_X[COL_X.length - 1] - COL_X[0] + 40}
        height={ROW_Y[ROW_Y.length - 1] - ROW_Y[0] + 40}
        fill="none"
        stroke={inkLight}
        strokeWidth="0.5"
        strokeDasharray="6 3"
      />

      {/* Composite deck direction arrows */}
      <g opacity="0.55">
        {[420, 870, 1320].map((y, i) => (
          <g key={`deck-${i}`}>
            <line
              x1={COL_X[0] + 80}
              y1={y}
              x2={COL_X[COL_X.length - 1] - 80}
              y2={y}
              stroke={inkFaint}
              strokeWidth="0.6"
              markerStart="url(#arrow-start)"
              markerEnd="url(#arrow-end)"
            />
            <text
              x={(COL_X[0] + COL_X[COL_X.length - 1]) / 2}
              y={y - 6}
              fontSize="10"
              fontStyle="italic"
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fill={inkFaint}
            >
              1.5" METAL DECK + 4" NWC TOPPING — DECK SPAN
            </text>
          </g>
        ))}
      </g>

      {/* Floor opening */}
      <g>
        <rect
          x={OPEN_X1}
          y={OPEN_Y1}
          width={OPEN_X2 - OPEN_X1}
          height={OPEN_Y2 - OPEN_Y1}
          fill="url(#hatch-opening)"
          stroke={inkThin}
          strokeWidth="1"
          strokeDasharray="8 4"
        />
        <text
          x={(OPEN_X1 + OPEN_X2) / 2}
          y={(OPEN_Y1 + OPEN_Y2) / 2 - 4}
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill={inkThin}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          OPEN TO BELOW
        </text>
        <text
          x={(OPEN_X1 + OPEN_X2) / 2}
          y={(OPEN_Y1 + OPEN_Y2) / 2 + 16}
          fontSize="10"
          textAnchor="middle"
          fill={inkLight}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          ATRIUM · 24.6 m^2
        </text>
      </g>

      {/* Grid lines */}
      {COL_X.map((x) => (
        <line key={`gx-${x}`} x1={x} y1={120} x2={x} y2={1680} stroke={inkThin} strokeWidth="0.6" strokeDasharray="36 3 2 3" />
      ))}
      {ROW_Y.map((y) => (
        <line key={`gy-${y}`} x1={140} y1={y} x2={1900} y2={y} stroke={inkThin} strokeWidth="0.6" strokeDasharray="36 3 2 3" />
      ))}

      {/* Grid bubbles */}
      {COL_X.map((x, i) => (
        <g key={`gb-c-${x}`}>
          <circle cx={x} cy={140} r={26} fill="#fafaf2" stroke={inkThin} strokeWidth="1.5" />
          <text x={x} y={148} fontSize="22" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="700" fill={inkThin}>{COL_LABELS[i]}</text>
          <circle cx={x} cy={1660} r={26} fill="#fafaf2" stroke={inkThin} strokeWidth="1.5" />
          <text x={x} y={1668} fontSize="22" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="700" fill={inkThin}>{COL_LABELS[i]}</text>
        </g>
      ))}
      {ROW_Y.map((y, i) => (
        <g key={`gb-r-${y}`}>
          <circle cx={140} cy={y} r={26} fill="#fafaf2" stroke={inkThin} strokeWidth="1.5" />
          <text x={140} y={y + 8} fontSize="22" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="700" fill={inkThin}>{ROW_LABELS[i]}</text>
          <circle cx={1900} cy={y} r={26} fill="#fafaf2" stroke={inkThin} strokeWidth="1.5" />
          <text x={1900} y={y + 8} fontSize="22" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="700" fill={inkThin}>{ROW_LABELS[i]}</text>
        </g>
      ))}

      {/* Secondary joists */}
      {joists.map((j, idx) => (
        <line key={`joist-${idx}`} x1={j.x} y1={j.y1 + 10} x2={j.x} y2={j.y2 - 10} stroke={inkLight} strokeWidth="0.7" />
      ))}
      <text
        x={(COL_X[0] + COL_X[1]) / 2}
        y={(ROW_Y[0] + ROW_Y[1]) / 2 + 4}
        fontSize="9"
        textAnchor="middle"
        fill={inkLight}
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        W12x14 JOISTS @ 2 400 c/c TYP
      </text>

      {/* Primary girders */}
      {horizontalBeams.map(([x1, y, x2], idx) => (
        <g key={`hb-${idx}`}>
          <line x1={x1 + 10} y1={y - 4} x2={x2 - 10} y2={y - 4} stroke={inkThin} strokeWidth="0.9" />
          <line x1={x1 + 10} y1={y + 4} x2={x2 - 10} y2={y + 4} stroke={inkThin} strokeWidth="0.9" />
        </g>
      ))}
      {verticalBeams.map(([x, y1, , y2], idx) => (
        <g key={`vb-${idx}`}>
          <line x1={x - 4} y1={y1 + 10} x2={x - 4} y2={y2 - 10} stroke={inkThin} strokeWidth="0.9" />
          <line x1={x + 4} y1={y1 + 10} x2={x + 4} y2={y2 - 10} stroke={inkThin} strokeWidth="0.9" />
        </g>
      ))}

      {/* Moment connection symbols */}
      {[
        { x: COL_X[2], y: ROW_Y[1], rot: 0 },
        { x: COL_X[3], y: ROW_Y[1], rot: 0 },
        { x: COL_X[2], y: ROW_Y[2], rot: 180 },
        { x: COL_X[3], y: ROW_Y[2], rot: 180 },
      ].map((m, i) => (
        <g key={`mom-${i}`} transform={`translate(${m.x} ${m.y}) rotate(${m.rot})`}>
          <polygon points="-12,-16 12,-16 0,-22" fill={inkThin} />
        </g>
      ))}

      {/* Vertical brace bay */}
      <g>
        <line x1={BR_X1 + 14} y1={BR_Y1 + 14} x2={BR_X2 - 14} y2={BR_Y2 - 14} stroke={inkThin} strokeWidth="2.2" />
        <line x1={BR_X2 - 14} y1={BR_Y1 + 14} x2={BR_X1 + 14} y2={BR_Y2 - 14} stroke={inkThin} strokeWidth="2.2" />
        <rect x={(BR_X1 + BR_X2) / 2 - 64} y={(BR_Y1 + BR_Y2) / 2 - 16} width="128" height="32" rx="3" fill="#fafaf2" stroke={inkThin} strokeWidth="0.75" />
        <text x={(BR_X1 + BR_X2) / 2} y={(BR_Y1 + BR_Y2) / 2 - 1} fontSize="11" fontWeight="700" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">VBF-1</text>
        <text x={(BR_X1 + BR_X2) / 2} y={(BR_Y1 + BR_Y2) / 2 + 12} fontSize="9" textAnchor="middle" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">HSS5x5x1/4</text>
      </g>

      {/* AI-flagged beam — emphasized in primary blue */}
      <g>
        <line x1={FLAG_X1 + 10} y1={FLAG_Y - 4} x2={FLAG_X2 - 10} y2={FLAG_Y - 4} stroke="#0063a3" strokeWidth="2" />
        <line x1={FLAG_X1 + 10} y1={FLAG_Y + 4} x2={FLAG_X2 - 10} y2={FLAG_Y + 4} stroke="#0063a3" strokeWidth="2" />
        <rect x={FLAG_MID_X - 60} y={FLAG_Y + 18} width="120" height="22" rx="3" fill="rgba(0,99,163,0.08)" stroke="#0063a3" strokeWidth="0.75" />
        <text x={FLAG_MID_X} y={FLAG_Y + 33} fontSize="11" fontWeight="700" textAnchor="middle" fill="#0063a3" fontFamily="ui-monospace, SFMono-Regular, monospace">B-2.04 W14x34</text>
      </g>

      {/* Revision cloud around the flagged beam */}
      <g opacity="0.9">
        <path
          d={`M ${FLAG_X1 - 30} ${FLAG_Y - 28}
              q -10 -14 4 -22 q 14 -10 26 0
              q 12 -12 28 0 q 14 -10 30 0 q 14 -10 30 0
              q 14 -10 30 0 q 14 -10 30 0
              q 14 -10 30 0 q 14 -10 30 0
              q 14 -10 28 4
              q 14 8 4 22
              q 10 14 -4 22 q -14 10 -26 0
              q -12 12 -28 0 q -14 10 -30 0
              q -14 10 -30 0 q -14 10 -30 0
              q -14 10 -30 0 q -14 10 -30 0
              q -14 10 -28 -4
              q -14 -8 -4 -22 z`}
          fill="none"
          stroke="#b3261e"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <g transform={`translate(${FLAG_X1 - 28} ${FLAG_Y - 26})`}>
          <polygon points="-10,-10 10,-10 0,8" fill="#fafaf2" stroke="#b3261e" strokeWidth="1" />
          <text x="0" y="-1" fontSize="11" fontWeight="800" textAnchor="middle" fill="#b3261e" fontFamily="ui-monospace, SFMono-Regular, monospace">3</text>
        </g>
      </g>

      {/* Detail callout 1/S-501 */}
      <g>
        <line x1={FLAG_MID_X + 64} y1={FLAG_Y + 40} x2={FLAG_MID_X + 110} y2={FLAG_Y + 96} stroke={inkThin} strokeWidth="0.75" />
        <circle cx={FLAG_MID_X + 130} cy={FLAG_Y + 110} r="22" fill="#fafaf2" stroke={inkThin} strokeWidth="1" />
        <line x1={FLAG_MID_X + 108} y1={FLAG_Y + 110} x2={FLAG_MID_X + 152} y2={FLAG_Y + 110} stroke={inkThin} strokeWidth="0.75" />
        <text x={FLAG_MID_X + 130} y={FLAG_Y + 106} fontSize="11" fontWeight="800" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">1</text>
        <text x={FLAG_MID_X + 130} y={FLAG_Y + 122} fontSize="10" fontWeight="700" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">S-501</text>
      </g>

      {/* Section line A-A through row 3 */}
      <g>
        <line x1={120} y1={ROW_Y[2] + 6} x2={210} y2={ROW_Y[2] + 6} stroke={inkThin} strokeWidth="2.2" />
        <line x1={1820} y1={ROW_Y[2] + 6} x2={1900} y2={ROW_Y[2] + 6} stroke={inkThin} strokeWidth="2.2" />
        <g transform={`translate(100 ${ROW_Y[2] + 6})`}>
          <circle cx="0" cy="0" r="14" fill="#fafaf2" stroke={inkThin} strokeWidth="1.25" />
          <line x1="-14" y1="0" x2="14" y2="0" stroke={inkThin} strokeWidth="0.75" />
          <text x="0" y="-3" fontSize="10" fontWeight="800" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">A</text>
          <text x="0" y="11" fontSize="9" fontWeight="700" textAnchor="middle" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">S-301</text>
          <polygon points="14,-6 22,0 14,6" fill={inkThin} />
        </g>
        <g transform={`translate(1920 ${ROW_Y[2] + 6})`}>
          <circle cx="0" cy="0" r="14" fill="#fafaf2" stroke={inkThin} strokeWidth="1.25" />
          <line x1="-14" y1="0" x2="14" y2="0" stroke={inkThin} strokeWidth="0.75" />
          <text x="0" y="-3" fontSize="10" fontWeight="800" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">A</text>
          <text x="0" y="11" fontSize="9" fontWeight="700" textAnchor="middle" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">S-301</text>
          <polygon points="-14,-6 -22,0 -14,6" fill={inkThin} />
        </g>
      </g>

      {/* Columns */}
      {columns.map((c) => (
        <rect key={`col-${c.x}-${c.y}`} x={c.x - 9} y={c.y - 9} width={18} height={18} fill={inkThin} />
      ))}

      {/* Stair shaft */}
      <g>
        <rect x={COL_X[1] + 22} y={ROW_Y[0] + 22} width="100" height="60" fill="url(#hatch-shaft)" stroke={inkThin} strokeWidth="0.75" />
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`tread-${i}`} x1={COL_X[1] + 28 + i * 13} y1={ROW_Y[0] + 26} x2={COL_X[1] + 28 + i * 13} y2={ROW_Y[0] + 78} stroke={inkLight} strokeWidth="0.4" />
        ))}
        <text x={COL_X[1] + 72} y={ROW_Y[0] + 58} fontSize="10" fontWeight="700" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">STAIR</text>
      </g>

      {/* Elevator shaft */}
      <g>
        <rect x={COL_X[2] - 60} y={ROW_Y[0] + 28} width="50" height="50" fill="url(#hatch-shaft)" stroke={inkThin} strokeWidth="0.75" />
        <line x1={COL_X[2] - 60} y1={ROW_Y[0] + 28} x2={COL_X[2] - 10} y2={ROW_Y[0] + 78} stroke={inkLight} strokeWidth="0.5" />
        <line x1={COL_X[2] - 10} y1={ROW_Y[0] + 28} x2={COL_X[2] - 60} y2={ROW_Y[0] + 78} stroke={inkLight} strokeWidth="0.5" />
        <text x={COL_X[2] - 35} y={ROW_Y[0] + 58} fontSize="9" fontWeight="700" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">ELEV</text>
      </g>

      {/* Beam labels */}
      {beamLabels.map((lbl, i) => (
        <text key={`lbl-${i}`} x={lbl.x} y={lbl.y} fontSize="10" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fill={inkLight}>
          {lbl.text}
        </text>
      ))}

      {/* Member tags */}
      {memberTags.map((t, i) => (
        <g key={`tag-${i}`}>
          <ellipse cx={t.x} cy={t.y - 18} rx="22" ry="9" fill="#fafaf2" stroke={inkThin} strokeWidth="0.6" />
          <text x={t.x} y={t.y - 15} fontSize="9" fontWeight="700" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">
            {t.label}
          </text>
        </g>
      ))}

      {/* Bottom bay-by-bay dimension string */}
      {COL_X.slice(0, -1).map((x, i) => {
        const x2 = COL_X[i + 1];
        const mid = (x + x2) / 2;
        return (
          <g key={`dim-x-${i}`}>
            <line x1={x} y1={1740} x2={x2} y2={1740} stroke={inkLight} strokeWidth="0.5" />
            <line x1={x} y1={1734} x2={x} y2={1746} stroke={inkLight} strokeWidth="0.75" />
            <line x1={x2} y1={1734} x2={x2} y2={1746} stroke={inkLight} strokeWidth="0.75" />
            <text x={mid} y={1758} fontSize="11" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fill={inkThin}>7 200</text>
          </g>
        );
      })}
      <g>
        <line x1={COL_X[0]} y1={1782} x2={COL_X[COL_X.length - 1]} y2={1782} stroke={inkLight} strokeWidth="0.5" />
        <line x1={COL_X[0]} y1={1776} x2={COL_X[0]} y2={1788} stroke={inkLight} strokeWidth="0.75" />
        <line x1={COL_X[COL_X.length - 1]} y1={1776} x2={COL_X[COL_X.length - 1]} y2={1788} stroke={inkLight} strokeWidth="0.75" />
        <text x={(COL_X[0] + COL_X[COL_X.length - 1]) / 2} y={1798} fontSize="10" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fill={inkThin}>OVERALL = 28 800 mm</text>
      </g>

      {/* Left bay-by-bay dimension string */}
      {ROW_Y.slice(0, -1).map((y, i) => {
        const y2 = ROW_Y[i + 1];
        const mid = (y + y2) / 2;
        return (
          <g key={`dim-y-${i}`}>
            <line x1={60} y1={y} x2={60} y2={y2} stroke={inkLight} strokeWidth="0.5" />
            <line x1={54} y1={y} x2={66} y2={y} stroke={inkLight} strokeWidth="0.75" />
            <line x1={54} y1={y2} x2={66} y2={y2} stroke={inkLight} strokeWidth="0.75" />
            <text x={36} y={mid + 4} fontSize="11" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fill={inkThin} transform={`rotate(-90 36 ${mid + 4})`}>9 000</text>
          </g>
        );
      })}
      <g>
        <line x1={20} y1={ROW_Y[0]} x2={20} y2={ROW_Y[ROW_Y.length - 1]} stroke={inkLight} strokeWidth="0.5" />
        <line x1={14} y1={ROW_Y[0]} x2={26} y2={ROW_Y[0]} stroke={inkLight} strokeWidth="0.75" />
        <line x1={14} y1={ROW_Y[ROW_Y.length - 1]} x2={26} y2={ROW_Y[ROW_Y.length - 1]} stroke={inkLight} strokeWidth="0.75" />
        <text x={6} y={(ROW_Y[0] + ROW_Y[ROW_Y.length - 1]) / 2 + 4} fontSize="10" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" fill={inkThin} transform={`rotate(-90 6 ${(ROW_Y[0] + ROW_Y[ROW_Y.length - 1]) / 2 + 4})`}>OVERALL = 27 000 mm</text>
      </g>

      {/* Match line on right edge */}
      <g>
        <line x1={1960} y1={ROW_Y[0] - 30} x2={1960} y2={ROW_Y[ROW_Y.length - 1] + 30} stroke="#b3261e" strokeWidth="1.4" strokeDasharray="14 6" />
        <text x={1968} y={(ROW_Y[0] + ROW_Y[ROW_Y.length - 1]) / 2} fontSize="11" fontWeight="800" fill="#b3261e" fontFamily="ui-monospace, SFMono-Regular, monospace" transform={`rotate(-90 1968 ${(ROW_Y[0] + ROW_Y[ROW_Y.length - 1]) / 2})`}>MATCH LINE — SEE S-105</text>
      </g>

      {/* General notes */}
      <g transform="translate(2030 280)">
        <rect x="0" y="0" width="280" height="180" fill="#fafaf2" stroke={inkThin} strokeWidth="0.75" />
        <line x1="0" y1="22" x2="280" y2="22" stroke={inkThin} strokeWidth="0.5" />
        <text x="140" y="16" fontSize="10" fontWeight="800" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">GENERAL NOTES</text>
        {[
          '1.  ALL BEAMS AISC W-SHAPES, A992 GR50.',
          '2.  HSS BRACES A500 GR C, FY=46 KSI.',
          '3.  BOLTED CONNECTIONS A325-N, U.N.O.',
          '4.  COMPOSITE DECK + 4" NWC TOPPING.',
          '5.  3/4" HEADED STUDS @ 12" o.c. TYP.',
          '6.  UNBRACED LENGTHS PER S-001 §4.',
          '7.  REFER S-001 FOR LOAD CRITERIA.',
        ].map((note, i) => (
          <text key={`note-${i}`} x="10" y={36 + i * 18} fontSize="9" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">{note}</text>
        ))}
      </g>

      {/* Key plan */}
      <g transform="translate(80 1480)">
        <rect x="0" y="0" width="220" height="200" fill="#fafaf2" stroke={inkThin} strokeWidth="0.75" />
        <line x1="0" y1="22" x2="220" y2="22" stroke={inkThin} strokeWidth="0.5" />
        <text x="110" y="16" fontSize="10" fontWeight="800" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">KEY PLAN</text>
        <rect x="20" y="38" width="180" height="140" fill="#fafaf2" stroke={inkThin} strokeWidth="1" />
        {[55, 90, 125, 160].map((x, i) => (
          <line key={`kg-x-${i}`} x1={x} y1={38} x2={x} y2={178} stroke={inkLight} strokeWidth="0.4" strokeDasharray="2 2" />
        ))}
        {[70, 110, 150].map((y, i) => (
          <line key={`kg-y-${i}`} x1={20} y1={y} x2={200} y2={y} stroke={inkLight} strokeWidth="0.4" strokeDasharray="2 2" />
        ))}
        <rect x="20" y="38" width="160" height="140" fill="rgba(0,99,163,0.20)" stroke="#0063a3" strokeWidth="1.5" />
        <text x="100" y="118" fontSize="11" fontWeight="800" textAnchor="middle" fill="#0063a3" fontFamily="ui-monospace, SFMono-Regular, monospace">S-104</text>
        <rect x="180" y="38" width="20" height="140" fill="rgba(120,120,120,0.10)" />
        <text x="190" y="118" fontSize="8" fontWeight="700" textAnchor="middle" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">S-</text>
        <text x="190" y="130" fontSize="8" fontWeight="700" textAnchor="middle" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">105</text>
        <g transform="translate(196 50)">
          <polygon points="0,-7 3,3 0,1 -3,3" fill="#b3261e" />
          <text x="0" y="-9" fontSize="7" fontWeight="800" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">N</text>
        </g>
      </g>

      {/* North arrow */}
      <g transform="translate(2200 200)">
        <circle cx="0" cy="0" r="36" fill="#fafaf2" stroke={inkThin} strokeWidth="1" />
        <polygon points="0,-26 9,10 0,3 -9,10" fill="#b3261e" />
        <polygon points="0,26 9,-10 0,-3 -9,-10" fill={inkThin} />
        <text x="0" y="-42" fontSize="13" fontWeight="800" fill={inkThin} textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace">N</text>
        <text x="0" y="56" fontSize="8" fill={inkLight} textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace">PROJECT NORTH</text>
      </g>

      {/* Title block */}
      <g transform="translate(1900 1480)">
        <rect x="0" y="0" width="400" height="200" fill="#fafaf2" stroke={inkThin} strokeWidth="1.25" />
        <line x1="0" y1="36" x2="400" y2="36" stroke={inkThin} strokeWidth="0.75" />
        <line x1="0" y1="86" x2="400" y2="86" stroke={inkThin} strokeWidth="0.75" />
        <line x1="0" y1="142" x2="400" y2="142" stroke={inkThin} strokeWidth="0.75" />
        <line x1="200" y1="36" x2="200" y2="86" stroke={inkThin} strokeWidth="0.75" />
        <line x1="120" y1="86" x2="120" y2="142" stroke={inkThin} strokeWidth="0.5" />
        <line x1="200" y1="86" x2="200" y2="142" stroke={inkThin} strokeWidth="0.5" />
        <line x1="280" y1="86" x2="280" y2="142" stroke={inkThin} strokeWidth="0.5" />
        <line x1="100" y1="142" x2="100" y2="200" stroke={inkThin} strokeWidth="0.5" />
        <line x1="200" y1="142" x2="200" y2="200" stroke={inkThin} strokeWidth="0.75" />

        <text x="200" y="22" fontSize="13" fontWeight="800" fill={inkThin} textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace">FALCON TOWER · LEVEL 04 STEEL FRAMING PLAN</text>

        <text x="10" y="50" fontSize="8" fontWeight="800" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">REV</text>
        <text x="40" y="50" fontSize="8" fontWeight="800" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">DATE</text>
        <text x="100" y="50" fontSize="8" fontWeight="800" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">DESCRIPTION</text>
        {[
          { r: '01', d: '2026-04-08', desc: 'IFC release' },
          { r: '02', d: '2026-05-22', desc: 'Coord. updates' },
          { r: '03', d: '2026-06-11', desc: 'Beam sizing — AI rev.' },
        ].map((rv, i) => (
          <g key={`rev-${i}`}>
            <text x="10" y={66 + i * 12} fontSize="9" fontWeight="700" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">{rv.r}</text>
            <text x="40" y={66 + i * 12} fontSize="9" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">{rv.d}</text>
            <text x="100" y={66 + i * 12} fontSize="9" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">{rv.desc}</text>
          </g>
        ))}

        <text x="300" y="50" fontSize="9" fontWeight="800" textAnchor="middle" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">P.E. STAMP</text>
        <circle cx="300" cy="64" r="14" fill="none" stroke={inkLight} strokeWidth="0.5" strokeDasharray="2 2" />
        <text x="300" y="68" fontSize="6" textAnchor="middle" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">N. RAMOS</text>

        <text x="10" y="100" fontSize="8" fontWeight="800" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">PROJECT NO.</text>
        <text x="10" y="118" fontSize="11" fontWeight="700" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">TR-2026-082</text>
        <text x="10" y="135" fontSize="8" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">FALCON TOWER</text>

        <text x="130" y="100" fontSize="8" fontWeight="800" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">SCALE</text>
        <text x="130" y="118" fontSize="11" fontWeight="700" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">1 : 100</text>
        <text x="130" y="135" fontSize="8" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">UNITS  mm</text>

        <text x="210" y="100" fontSize="8" fontWeight="800" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">DRAWN</text>
        <text x="210" y="118" fontSize="11" fontWeight="700" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">P. SHAH</text>
        <text x="210" y="135" fontSize="8" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">CHK  M.OKAFOR</text>

        <text x="290" y="100" fontSize="8" fontWeight="800" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">ENGINEER</text>
        <text x="290" y="118" fontSize="11" fontWeight="700" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">N. RAMOS, P.E.</text>
        <text x="290" y="135" fontSize="8" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">CO 0035124</text>

        <text x="14" y="160" fontSize="9" fontWeight="800" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">DATE</text>
        <text x="14" y="184" fontSize="13" fontWeight="700" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">2026-06-11</text>
        <text x="116" y="160" fontSize="9" fontWeight="800" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">REV</text>
        <text x="116" y="186" fontSize="16" fontWeight="800" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">03</text>
        <text x="300" y="158" fontSize="9" fontWeight="800" textAnchor="middle" fill={inkLight} fontFamily="ui-monospace, SFMono-Regular, monospace">DRAWING NO.</text>
        <text x="300" y="186" fontSize="22" fontWeight="800" textAnchor="middle" fill={inkThin} fontFamily="ui-monospace, SFMono-Regular, monospace">S-104</text>
      </g>
    </svg>
  );
}

/* ── CAD-style annotation pill — replaces the old rainbow marker.
   It reads as a drafting callout ("Why this change?") rather than as
   a notification badge, so the AI is presenting an authoritative
   answer the engineer can open, not a suggestion they can dismiss. */
function Marker({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close why-answer' : 'Why this change?'}
      aria-expanded={open}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px 8px 12px',
        borderRadius: 999,
        backgroundColor: '#ffffff',
        border: open
          ? '1.5px solid var(--modus-wc-color-primary, #0063a3)'
          : '1.5px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow:
          '0 6px 16px rgba(15,23,42,0.18), 0 2px 4px rgba(15,23,42,0.10)',
        color: 'var(--modus-wc-color-base-content, #171c1e)',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'border-color 140ms ease, transform 140ms ease',
        transform: open ? 'translateY(-1px)' : 'none',
      }}
    >
      <TrimbleAiLogo size={22} />
      <span>Why this change?</span>
      <span aria-hidden style={{ display: 'inline-flex', color: 'var(--modus-wc-color-primary, #0063a3)' }}>
        <ModusWcIcon name={open ? 'expand_less' : 'expand_more'} size="xs" decorative />
      </span>
    </button>
  );
}

/* ── Inline citation chip in the answer prose (compact variant) ── */
function CitationChip({
  sourceId,
  active,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  sourceId: number;
  active: boolean;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const lit = active || hovered;
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onMouseEnter}
      onBlur={onMouseLeave}
      onClick={onClick}
      aria-label={`Source ${sourceId}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 6px',
        marginLeft: 3,
        marginRight: 1,
        verticalAlign: '1px',
        borderRadius: 9,
        border: 'none',
        backgroundColor: lit
          ? 'var(--modus-wc-color-primary, #0063a3)'
          : 'rgba(0,99,163,0.10)',
        color: lit ? '#ffffff' : 'var(--modus-wc-color-primary, #0063a3)',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'inherit',
        lineHeight: 1,
        cursor: 'pointer',
        transition: 'background-color 120ms ease, color 120ms ease, transform 120ms ease',
        transform: lit ? 'translateY(-1px)' : 'none',
      }}
    >
      {sourceId}
    </button>
  );
}

/* ── Compact source card — one reference, minimal chrome ────────── */
function SourceCard({
  source,
  active,
  hovered,
  onMouseEnter,
  onMouseLeave,
}: {
  source: Source;
  active: boolean;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const lit = active || hovered;
  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        backgroundColor: lit ? 'rgba(0,99,163,0.04)' : '#fafbfc',
        border: lit ? '1px solid #0063a3' : '1px solid #eef0f4',
        borderRadius: 8,
        transition: 'border-color 140ms ease, background-color 140ms ease',
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: lit ? '#0063a3' : '#ffffff',
          color: lit ? '#ffffff' : '#0063a3',
          border: '1.5px solid #0063a3',
          fontSize: 11,
          fontWeight: 800,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {source.id}
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#171c1e', lineHeight: 1.3 }}>
            {source.doc}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#6a6e79',
            }}
          >
            {source.section}
          </span>
        </div>

        <HighlightedQuote text={source.quote} />
      </div>
    </article>
  );
}

/* ── Evidence card opened by the marker.
   Shows the question, the AI's definitive answer with inline citation
   chips, and the three numbered source cards. Hovering a chip
   highlights the matching source; hovering a source highlights the
   matching chip. */
function EvidenceCard({ onClose }: { onClose: () => void }) {
  const [activeSource, setActiveSource] = useState<number | null>(null);
  const [hoveredSource, setHoveredSource] = useState<number | null>(null);

  function renderText(text: string, segIdx: number) {
    /* Parse **highlight** markers and wrap them in a yellow <mark>
       so the key facts (numbers, the recommended section, the
       reason) jump out of the prose. */
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <mark
            key={`${segIdx}-${partIdx}`}
            style={{
              backgroundColor: '#fff1cf',
              color: '#171c1e',
              padding: '1px 4px',
              borderRadius: 3,
              fontWeight: 600,
            }}
          >
            {part.slice(2, -2)}
          </mark>
        );
      }
      return <span key={`${segIdx}-${partIdx}`}>{part}</span>;
    });
  }

  function renderBody() {
    return ANSWER_BODY.map((seg, idx) => {
      if (seg.kind === 'text') return <span key={idx}>{renderText(seg.value, idx)}</span>;
      const id = seg.sourceId;
      return (
        <CitationChip
          key={idx}
          sourceId={id}
          active={activeSource === id}
          hovered={hoveredSource === id}
          onMouseEnter={() => setHoveredSource(id)}
          onMouseLeave={() => setHoveredSource(null)}
          onClick={() => setActiveSource((cur) => (cur === id ? null : id))}
        />
      );
    });
  }

  return (
    <div
      style={{
        width: 380,
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e1e9',
        borderRadius: 12,
        boxShadow: '0 18px 36px rgba(15,23,42,0.18), 0 4px 10px rgba(15,23,42,0.08)',
        animation: 'expert4-card-in 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid #eef0f4',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#6a6e79',
            }}
          >
            <TrimbleAiLogo size={16} />
            Trimble AI · why answers
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <span
              aria-hidden
              style={{
                width: 3,
                alignSelf: 'stretch',
                background: '#0063a3',
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#171c1e', lineHeight: 1.4 }}>
              {QUESTION}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 24,
            height: 24,
            border: 'none',
            background: 'transparent',
            borderRadius: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6a6e79',
            flexShrink: 0,
          }}
        >
          <ModusWcIcon name="close" size="xs" decorative />
        </button>
      </div>

      {/* Answer + single inline source */}
      <div
        style={{
          padding: '14px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#0063a3',
            }}
          >
            Answer
          </span>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: '#171c1e' }}>
            {renderBody()}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6a6e79',
            }}
          >
            Source
          </span>
          {SOURCES.map((src) => (
            <SourceCard
              key={src.id}
              source={src}
              active={activeSource === src.id}
              hovered={hoveredSource === src.id}
              onMouseEnter={() => setHoveredSource(src.id)}
              onMouseLeave={() => setHoveredSource(null)}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes expert4-card-in {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function TitlePill() {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e0e1e9',
        borderRadius: 8,
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#6a6e79',
        }}
      >
        Tekla Structures - Drawing S-104
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>
        Falcon Tower / Level 4 — Steel Framing Plan
      </span>
      <span style={{ fontSize: 10, color: '#6a6e79', letterSpacing: '0.2px' }}>
        1 : 100 · NAD 83 grid · 1 AI explanation in view
      </span>
    </div>
  );
}

/* ── Default export — full-canvas pannable / zoomable CAD plan,
   with the new annotation-pill marker + answer-with-evidence card. */
export default function Expert4() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, didMove: false });

  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1200,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // On mount, compute a fit-to-view zoom so the entire 2400×1800 sheet
  // is visible and centered in the viewport — no auto-zoom on the flagged
  // beam. The user can drag/scroll-zoom in afterwards.
  useEffect(() => {
    if (initialized) return;
    const el = containerRef.current;
    if (!el) return;
    const fitX = (el.clientWidth - FIT_PADDING * 2) / CANVAS_W;
    const fitY = (el.clientHeight - FIT_PADDING * 2) / CANVAS_H;
    const fitZoom = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, Math.min(fitX, fitY)),
    );
    setZoom(fitZoom);
    setPan({
      x: (el.clientWidth - CANVAS_W * fitZoom) / 2,
      y: (el.clientHeight - CANVAS_H * fitZoom) / 2,
    });
    setInitialized(true);
  }, [initialized]);

  // Beam projected position on screen.
  const beamScreen = {
    x: FLAGGED_BEAM.x * zoom + pan.x,
    y: FLAGGED_BEAM.y * zoom + pan.y,
  };

  // The marker pill is offset above-and-right of the beam so it never
  // overlaps the highlighted member or its callout. The leader line
  // tells the user it's pinned to the beam.
  const PILL_OFFSET = { x: 110, y: -90 };
  const markerScreen = {
    x: beamScreen.x + PILL_OFFSET.x,
    y: beamScreen.y + PILL_OFFSET.y,
  };

  /* Card always sits to the LEFT of the pill, vertically centered on it.
     The rainbow connector runs from the pill's left edge into the middle
     of the card's right edge so it's clearly visible between the two. */
  const CARD_WIDTH = 380;
  const CARD_HEIGHT = 360;
  const PADDING = 24;
  const PILL_HALF_W = 110;
  const GAP = 56;

  const cardLeft = markerScreen.x - PILL_HALF_W - GAP - CARD_WIDTH;
  const cardTop = Math.max(
    PADDING,
    Math.min(
      markerScreen.y - CARD_HEIGHT / 2,
      viewport.h - CARD_HEIGHT - PADDING,
    ),
  );
  const connectorStart = { x: markerScreen.x - PILL_HALF_W, y: markerScreen.y };
  const connectorEnd = { x: cardLeft + CARD_WIDTH, y: cardTop + CARD_HEIGHT / 2 };

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setDragging(true);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      didMove: false,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (!dragRef.current.didMove && Math.hypot(dx, dy) > 3) {
      dragRef.current.didMove = true;
    }
    setPan({
      x: dragRef.current.panX + dx,
      y: dragRef.current.panY + dy,
    });
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragging) return;
    setDragging(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  }

  function handleWheel(e: React.WheelEvent) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    if (newZoom === zoom) return;
    const wx = (mx - pan.x) / zoom;
    const wy = (my - pan.y) / zoom;
    setPan({ x: mx - wx * newZoom, y: my - wy * newZoom });
    setZoom(newZoom);
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#e9e6dd',
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Pan/zoom-transformed CAD plan */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      >
        <FramingPlan />
      </div>

      {/* Leader line — beam → annotation pill (always visible) */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        <line
          x1={beamScreen.x}
          y1={beamScreen.y}
          x2={markerScreen.x - 12}
          y2={markerScreen.y + 12}
          stroke="#0063a3"
          strokeWidth="1.25"
          strokeDasharray="4 3"
          opacity="0.85"
        />
        <circle
          cx={beamScreen.x}
          cy={beamScreen.y}
          r="3.5"
          fill="#0063a3"
        />
      </svg>

      {/* Connector — same 1.5px solid Trimble-primary stroke as the
          "Why this change?" pill border, so the line reads as a direct
          extension of the button into the evidence card. The line
          touches the pill's left edge and the card's right edge with
          no end caps in between. */}
      {open && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 25,
          }}
        >
          <line
            x1={connectorStart.x}
            y1={connectorStart.y}
            x2={connectorEnd.x}
            y2={connectorEnd.y}
            stroke="#0063a3"
            strokeWidth="1.5"
            strokeLinecap="butt"
          />
        </svg>
      )}

      {/* Annotation pill — anchored in screen space to the projected beam */}
      <div
        style={{
          position: 'absolute',
          left: markerScreen.x,
          top: markerScreen.y,
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          dragRef.current.didMove = false;
        }}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <Marker open={open} onClick={() => setOpen((o) => !o)} />
      </div>

      {/* Evidence card — clamped within the viewport */}
      {open && (
        <div
          style={{
            position: 'absolute',
            left: cardLeft,
            top: cardTop,
            zIndex: 20,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <EvidenceCard onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Top-left title pill */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 30, pointerEvents: 'none' }}>
        <TitlePill />
      </div>
    </div>
  );
}
