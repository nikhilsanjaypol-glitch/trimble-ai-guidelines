import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 6 — VISUALIZE WORK DONE FOR ACCEPTANCE
 *
 * Background canvas: a 3D BIM frame styled to match the reference
 *   image — cyan roof slab + grid, two cyan front-left columns
 *   running full height, and four small cyan beam-column joints
 *   along the right wall.  The model is interactive — drag it to
 *   rotate around the vertical axis, click any cyan element to
 *   focus the matching schedule edit, and tap "Reset view" to
 *   snap back to the canonical angle.
 *
 * Foreground panel: a Gantt rebalance card.  AI's two pending
 *   shifts (Foundation, Roofing) light up the corresponding
 *   geometry on the model so the eye always sees both the WHEN
 *   and the WHERE.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

const AI_COLOR = '#1B6FD9';
const AI_SURFACE = '#E6F1FB';
const ACCEPTED_COLOR = '#1E7A4F';
const NEUTRAL_BAR = '#8E96A1';

const HL_CYAN_DEEP = '#1FB1A7';
const HL_CYAN_FILL = 'rgba(60, 201, 192, 0.32)';
const HL_CYAN_FILL_STRONG = 'rgba(60, 201, 192, 0.50)';

const FRAME_DARK = '#586069';
const FRAME_MED = '#8C939E';
const FRAME_FAINT = '#BFC4CC';

/* ── Building geometry (oblique projection w/ user-controlled yaw) ── */
const W = 5;
const D = 3;
const H = 5;
const C = 44;
const ANGLE = 26 * (Math.PI / 180);
const Z_FACTOR = 0.55;
const DX = -C * Math.cos(ANGLE) * Z_FACTOR;
const DY = -C * Math.sin(ANGLE) * Z_FACTOR;

type Projector = (x: number, y: number, z: number) => [number, number];

function makeProjector(yaw: number): Projector {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return (x, y, z) => {
    // Rotate around the building's vertical centerline first.
    const cx = x - W / 2;
    const cz = z - D / 2;
    const rx = cx * c + cz * s;
    const rz = -cx * s + cz * c;
    // Then a fixed cabinet-style projection.
    return [rx * C + rz * DX, -y * C + rz * DY];
  };
}

/* ── Gantt geometry ─────────────────────────────────────────────── */
const TIMELINE_DAYS = 184;
const TIMELINE_WIDTH = 320;
const NAME_COL = 102;
const ROW_HEIGHT = 30;
const BAR_HEIGHT = 14;

const MONTHS = [
  { offset: 0, label: 'Mar' },
  { offset: 31, label: 'Apr' },
  { offset: 61, label: 'May' },
  { offset: 92, label: 'Jun' },
  { offset: 122, label: 'Jul' },
  { offset: 153, label: 'Aug' },
];

interface TaskEdit {
  originalStartDay: number;
  originalEndDay: number;
  rationale: string;
  source: string;
  zone: 'foundation' | 'roof';
}

interface Task {
  id: string;
  name: string;
  startDay: number;
  endDay: number;
  edit?: TaskEdit;
}

const TASKS: Task[] = [
  { id: 'site', name: 'Site preparation', startDay: 4, endDay: 22 },
  {
    id: 'fdn',
    name: 'Foundation',
    startDay: 52,
    endDay: 102,
    edit: {
      originalStartDay: 44,
      originalEndDay: 88,
      rationale:
        'Footings deepened to 1.5 m per revised geotech — adds ~8 working days.',
      source: 'Geotech · cedar-hills-ph2.geo',
      zone: 'foundation',
    },
  },
  { id: 'steel', name: 'Steel erection', startDay: 110, endDay: 142 },
  {
    id: 'roof',
    name: 'Roofing',
    startDay: 148,
    endDay: 170,
    edit: {
      originalStartDay: 138,
      originalEndDay: 160,
      rationale:
        'Delayed 10 days to align with revised steel close-out (no float impact).',
      source: 'Drawing · S-201 Rev B',
      zone: 'roof',
    },
  },
  { id: 'close', name: 'Closeout', startDay: 170, endDay: 184 },
];

type Status = 'pending' | 'accepted' | 'rejected';

const dayToPx = (day: number) => (day / TIMELINE_DAYS) * TIMELINE_WIDTH;

const BASE_DATE = new Date(2026, 2, 1);
function dayToDateStr(day: number): string {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Structural model (interactive 3D canvas) ───────────────────── */
function StructuralModel({
  yaw,
  hlFoundation,
  hlRoof,
  focusedZone,
  onZoneClick,
}: {
  yaw: number;
  hlFoundation: boolean;
  hlRoof: boolean;
  focusedZone: 'foundation' | 'roof' | null;
  onZoneClick: (zone: 'foundation' | 'roof') => void;
}) {
  const proj = useMemo(() => makeProjector(yaw), [yaw]);

  const pt = (x: number, y: number, z: number) => {
    const [sx, sy] = proj(x, y, z);
    return `${sx.toFixed(1)},${sy.toFixed(1)}`;
  };

  const ln = (
    key: string,
    p1: [number, number, number],
    p2: [number, number, number],
    stroke: string,
    width: number,
    extra?: React.SVGProps<SVGLineElement>,
  ) => {
    const [x1, y1] = proj(p1[0], p1[1], p1[2]);
    const [x2, y2] = proj(p2[0], p2[1], p2[2]);
    return (
      <line
        key={key}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={width}
        {...extra}
      />
    );
  };

  /* Build the greyscale frame ─────────────────────────────────── */
  const frame: ReactElement[] = [];

  // Faint floor outlines at intermediate levels
  for (let j = 1; j < H; j++) {
    frame.push(
      <polygon
        key={`fs-${j}`}
        points={`${pt(0, j, 0)} ${pt(W, j, 0)} ${pt(W, j, D)} ${pt(0, j, D)}`}
        fill="rgba(110,120,135,0.04)"
        stroke="rgba(110,120,135,0.18)"
        strokeWidth={0.5}
      />,
    );
  }

  // Columns — front face (full grid)
  for (let i = 0; i <= W; i++) {
    frame.push(
      ln(
        `col-front-${i}`,
        [i, 0, 0],
        [i, H, 0],
        FRAME_DARK,
        1.1,
      ),
    );
  }
  // Columns — right side (full grid)
  for (let k = 1; k <= D; k++) {
    frame.push(
      ln(`col-right-${k}`, [W, 0, k], [W, H, k], FRAME_DARK, 1.1),
    );
  }
  // Back-left corner column
  frame.push(ln('col-bl', [0, 0, D], [0, H, D], FRAME_MED, 0.9));
  // Back-face intermediate columns (faint)
  for (let i = 1; i < W; i++) {
    frame.push(
      ln(`col-back-${i}`, [i, 0, D], [i, H, D], FRAME_FAINT, 0.6),
    );
  }
  // Left-face intermediate columns (faint)
  for (let k = 1; k < D; k++) {
    frame.push(
      ln(`col-left-${k}`, [0, 0, k], [0, H, k], FRAME_FAINT, 0.6),
    );
  }

  // Beams at every floor
  for (let j = 1; j <= H; j++) {
    frame.push(ln(`bm-f-${j}`, [0, j, 0], [W, j, 0], FRAME_DARK, 0.9));
    frame.push(ln(`bm-r-${j}`, [W, j, 0], [W, j, D], FRAME_DARK, 0.9));
    frame.push(ln(`bm-b-${j}`, [0, j, D], [W, j, D], FRAME_FAINT, 0.5));
    frame.push(ln(`bm-l-${j}`, [0, j, 0], [0, j, D], FRAME_FAINT, 0.5));
  }

  // X-bracing on right side wall, rear bay (matches reference)
  for (let j = 0; j < H; j++) {
    frame.push(
      ln(`br-${j}-a`, [W, j, 2], [W, j + 1, D], FRAME_FAINT, 0.6),
    );
    frame.push(
      ln(`br-${j}-b`, [W, j + 1, 2], [W, j, D], FRAME_FAINT, 0.6),
    );
  }

  /* Highlight: foundation = 2 front-left columns running full height */
  const fdnEmphasis = focusedZone === 'foundation';
  const foundationEls: ReactElement[] = [];
  if (hlFoundation) {
    for (const i of [0, 1]) {
      const [x1, y1] = proj(i, 0, 0);
      const [x2, y2] = proj(i, H, 0);
      foundationEls.push(
        <line
          key={`hl-fdn-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={HL_CYAN_DEEP}
          strokeWidth={fdnEmphasis ? 5 : 4}
          strokeLinecap="round"
          opacity={fdnEmphasis ? 1 : 0.85}
          style={{ transition: 'stroke-width 300ms ease, opacity 300ms ease' }}
        />,
      );
    }
  }

  /* Highlight: roof slab + grid + side beam-column markers */
  const roofEmphasis = focusedZone === 'roof';
  const roofEls: ReactElement[] = [];
  if (hlRoof) {
    // Slab fill
    roofEls.push(
      <polygon
        key="hl-roof-slab"
        points={`${pt(0, H, 0)} ${pt(W, H, 0)} ${pt(W, H, D)} ${pt(0, H, D)}`}
        fill={roofEmphasis ? HL_CYAN_FILL_STRONG : HL_CYAN_FILL}
        stroke={HL_CYAN_DEEP}
        strokeWidth={roofEmphasis ? 1.6 : 1.2}
        style={{ transition: 'fill 300ms ease, stroke-width 300ms ease' }}
      />,
    );
    // Slab grid
    for (let i = 1; i < W; i++) {
      const [x1, y1] = proj(i, H, 0);
      const [x2, y2] = proj(i, H, D);
      roofEls.push(
        <line
          key={`hl-roof-gi-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={HL_CYAN_DEEP}
          strokeWidth={0.7}
          opacity={roofEmphasis ? 0.7 : 0.5}
        />,
      );
    }
    for (let k = 1; k < D; k++) {
      const [x1, y1] = proj(0, H, k);
      const [x2, y2] = proj(W, H, k);
      roofEls.push(
        <line
          key={`hl-roof-gk-${k}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={HL_CYAN_DEEP}
          strokeWidth={0.7}
          opacity={roofEmphasis ? 0.7 : 0.5}
        />,
      );
    }
    // Side beam-column markers along the right wall (x=W) — one per floor
    for (let j = 1; j < H; j++) {
      const yBot = j;
      const yTop = j + 0.45;
      const zNear = 1.25;
      const zFar = 1.85;
      roofEls.push(
        <polygon
          key={`hl-marker-${j}`}
          points={`${pt(W, yBot, zNear)} ${pt(W, yTop, zNear)} ${pt(W, yTop, zFar)} ${pt(W, yBot, zFar)}`}
          fill={HL_CYAN_FILL_STRONG}
          stroke={HL_CYAN_DEEP}
          strokeWidth={0.9}
          opacity={roofEmphasis ? 1 : 0.92}
          style={{ transition: 'opacity 300ms ease' }}
        />,
      );
    }
  }

  /* Invisible hit-targets so the zones are clickable & cursor-aware */
  const hitTargets: ReactElement[] = [];
  if (hlFoundation) {
    // Wide capsule covering both front-left columns
    const [hx1, hy1] = proj(0, 0, 0);
    const [hx2, hy2] = proj(1, H, 0);
    const minX = Math.min(hx1, hx2);
    const maxX = Math.max(hx1, hx2);
    const minY = Math.min(hy1, hy2);
    const maxY = Math.max(hy1, hy2);
    hitTargets.push(
      <rect
        key="hit-fdn"
        x={minX - 6}
        y={minY - 4}
        width={maxX - minX + 12}
        height={maxY - minY + 8}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onZoneClick('foundation');
        }}
      >
        <title>Foundation — click to review</title>
      </rect>,
    );
  }
  if (hlRoof) {
    const corners: [number, number][] = [
      proj(0, H, 0),
      proj(W, H, 0),
      proj(W, H, D),
      proj(0, H, D),
    ];
    const points = corners.map(([x, y]) => `${x},${y}`).join(' ');
    hitTargets.push(
      <polygon
        key="hit-roof"
        points={points}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onZoneClick('roof');
        }}
      >
        <title>Roofing — click to review</title>
      </polygon>,
    );
  }

  return (
    <svg
      viewBox="-200 -260 400 320"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-label="3D BIM model — drag to rotate"
    >
      {frame}
      {foundationEls}
      {roofEls}
      {hitTargets}
    </svg>
  );
}

/* ── A single Gantt row ─────────────────────────────────────────── */
function GanttRow({
  task,
  status,
  focused,
  onFocus,
}: {
  task: Task;
  status: Status;
  focused: boolean;
  onFocus: () => void;
}) {
  const edit = task.edit;
  const isShifted = !!edit;
  const isPending = status === 'pending';
  const isAccepted = status === 'accepted';
  const isRejected = status === 'rejected';

  let solidColor: string = NEUTRAL_BAR;
  if (isShifted) {
    if (isAccepted) solidColor = ACCEPTED_COLOR;
    else if (isRejected) solidColor = NEUTRAL_BAR;
    else solidColor = AI_COLOR;
  }

  const renderStartDay =
    isShifted && isRejected ? edit!.originalStartDay : task.startDay;
  const renderEndDay =
    isShifted && isRejected ? edit!.originalEndDay : task.endDay;

  const showGhost = isShifted && !isRejected;
  const ghostStart = edit?.originalStartDay ?? 0;
  const ghostEnd = edit?.originalEndDay ?? 0;

  const delta = isShifted
    ? task.endDay -
      task.startDay -
      (edit!.originalEndDay - edit!.originalStartDay)
    : 0;
  const shiftDays = isShifted ? task.startDay - edit!.originalStartDay : 0;

  return (
    <div className="flex items-center" style={{ height: `${ROW_HEIGHT}px` }}>
      <div
        className="flex items-center"
        style={{ width: `${NAME_COL}px`, gap: '6px', paddingRight: '6px' }}
      >
        {isShifted && isPending && (
          <span
            className="flex items-center justify-center shrink-0"
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '4px',
              backgroundColor: AI_SURFACE,
              color: AI_COLOR,
            }}
          >
            <ModusWcIcon
              name="sparkle"
              size="xs"
              decorative
              style={{ color: 'currentColor' }}
            />
          </span>
        )}
        {isShifted && isAccepted && (
          <span
            className="flex items-center justify-center shrink-0"
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '4px',
              backgroundColor: '#E3F4EC',
              color: ACCEPTED_COLOR,
            }}
          >
            <ModusWcIcon
              name="check"
              size="xs"
              decorative
              style={{ color: 'currentColor' }}
            />
          </span>
        )}
        <span
          className="truncate"
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '18px',
          }}
        >
          {task.name}
        </span>
      </div>

      <div
        className="relative"
        style={{ width: `${TIMELINE_WIDTH}px`, height: `${ROW_HEIGHT}px` }}
      >
        {showGhost && (
          <div
            aria-hidden
            className="absolute"
            style={{
              left: `${dayToPx(ghostStart)}px`,
              width: `${dayToPx(ghostEnd - ghostStart)}px`,
              top: `${(ROW_HEIGHT - BAR_HEIGHT) / 2}px`,
              height: `${BAR_HEIGHT}px`,
              borderRadius: '4px',
              border: `1.5px dashed ${isAccepted ? '#A8B0BB' : '#A2BBDC'}`,
              backgroundColor: 'transparent',
              transition: 'border-color 400ms ease',
            }}
          />
        )}

        {showGhost && shiftDays > 0 && !isAccepted && (
          <div
            aria-hidden
            className="absolute"
            style={{
              left: `${dayToPx(ghostEnd) + 2}px`,
              top: `${ROW_HEIGHT / 2 - 1}px`,
              width: `${Math.max(dayToPx(task.startDay) - dayToPx(ghostEnd) - 4, 4)}px`,
              height: '2px',
              background: `linear-gradient(90deg, transparent 0%, ${AI_COLOR} 60%)`,
              opacity: 0.5,
            }}
          />
        )}

        <button
          type="button"
          onClick={isShifted && isPending ? onFocus : undefined}
          aria-label={
            isShifted ? `${task.name} — AI shifted, click to review` : task.name
          }
          className="absolute transition-all"
          style={{
            left: `${dayToPx(renderStartDay)}px`,
            width: `${dayToPx(renderEndDay - renderStartDay)}px`,
            top: `${(ROW_HEIGHT - BAR_HEIGHT) / 2}px`,
            height: `${BAR_HEIGHT}px`,
            borderRadius: '4px',
            backgroundColor: solidColor,
            border: 'none',
            padding: 0,
            cursor: isShifted && isPending ? 'pointer' : 'default',
            boxShadow:
              focused && isShifted && isPending
                ? `0 0 0 3px ${AI_SURFACE}, 0 0 0 4px ${AI_COLOR}`
                : 'none',
          }}
        />

        {isShifted && isPending && (
          <span
            className="absolute flex items-center"
            style={{
              left: `${dayToPx(renderEndDay) + 6}px`,
              top: `${(ROW_HEIGHT - 16) / 2}px`,
              height: '16px',
              padding: '0 5px',
              borderRadius: '4px',
              backgroundColor: AI_SURFACE,
              color: AI_COLOR,
              fontSize: '10px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: '16px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {delta >= 0 ? '+' : ''}
            {delta}d
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Pro 6 — schedule rebalance + interactive 3D BIM canvas ─────── */
export default function Pro6() {
  const editIds = useMemo(
    () => TASKS.filter((t) => t.edit).map((t) => t.id),
    [],
  );

  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    editIds.reduce<Record<string, Status>>(
      (acc, id) => ({ ...acc, [id]: 'pending' }),
      {},
    ),
  );

  const [focusedId, setFocusedId] = useState<string | null>(editIds[0] ?? null);

  const focusedTask = TASKS.find((t) => t.id === focusedId);
  const focusedStatus =
    focusedId && statuses[focusedId] ? statuses[focusedId] : null;

  const totals = useMemo(() => {
    let accepted = 0;
    let rejected = 0;
    for (const id of editIds) {
      if (statuses[id] === 'accepted') accepted += 1;
      if (statuses[id] === 'rejected') rejected += 1;
    }
    const pending = editIds.length - accepted - rejected;
    return { accepted, rejected, pending, total: editIds.length };
  }, [editIds, statuses]);

  const allResolved = totals.pending === 0;

  const fdnStatus = statuses['fdn'];
  const roofStatus = statuses['roof'];
  const hlFoundation = fdnStatus === 'pending';
  const hlRoof = roofStatus === 'pending';
  const focusedZone =
    focusedTask?.edit && focusedStatus === 'pending'
      ? focusedTask.edit.zone
      : null;

  /* ── Drag-to-rotate the 3D canvas ─────────────────────────────── */
  const [yaw, setYaw] = useState(0);
  const dragRef = useRef<{
    startX: number;
    startYaw: number;
    moved: boolean;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    function move(clientX: number) {
      if (!dragRef.current) return;
      const dx = clientX - dragRef.current.startX;
      if (Math.abs(dx) > 2) dragRef.current.moved = true;
      setYaw(dragRef.current.startYaw + dx * 0.012);
    }
    function end() {
      setIsDragging(false);
      dragRef.current = null;
    }
    function onMove(e: MouseEvent) {
      move(e.clientX);
    }
    function onUp() {
      end();
    }
    function onTMove(e: TouchEvent) {
      if (e.touches.length > 0) move(e.touches[0].clientX);
    }
    function onTEnd() {
      end();
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTMove);
    window.addEventListener('touchend', onTEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTMove);
      window.removeEventListener('touchend', onTEnd);
    };
  }, [isDragging]);

  function handleCanvasMouseDown(e: React.MouseEvent) {
    dragRef.current = { startX: e.clientX, startYaw: yaw, moved: false };
    setIsDragging(true);
  }
  function handleCanvasTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 0) return;
    dragRef.current = {
      startX: e.touches[0].clientX,
      startYaw: yaw,
      moved: false,
    };
    setIsDragging(true);
  }

  function handleZoneClick(zone: 'foundation' | 'roof') {
    // Don't trigger zone-click after a rotate drag.
    if (dragRef.current?.moved) return;
    const id = TASKS.find((t) => t.edit?.zone === zone)?.id;
    if (id && statuses[id] === 'pending') setFocusedId(id);
  }

  const isRotated = Math.abs(yaw) > 0.02;

  /* ── Gantt actions ────────────────────────────────────────────── */
  function setStatus(id: string, s: Status) {
    setStatuses((prev) => ({ ...prev, [id]: s }));
    window.setTimeout(() => {
      const start = editIds.indexOf(id);
      for (let step = 1; step <= editIds.length; step += 1) {
        const next = (start + step) % editIds.length;
        const nextId = editIds[next];
        const nextStatus = nextId === id ? s : statuses[nextId];
        if (nextStatus === 'pending') {
          setFocusedId(nextId);
          return;
        }
      }
      setFocusedId(null);
    }, 220);
  }

  function acceptAll() {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const id of editIds)
        if (next[id] === 'pending') next[id] = 'accepted';
      return next;
    });
    setFocusedId(null);
  }

  function reset() {
    setStatuses(
      editIds.reduce<Record<string, Status>>(
        (acc, id) => ({ ...acc, [id]: 'pending' }),
        {},
      ),
    );
    setFocusedId(editIds[0] ?? null);
    setYaw(0);
  }

  return (
    <div
      className="relative bg-white"
      style={{
        width: '740px',
        height: '580px',
        borderRadius: '16px',
        boxShadow: '0px 0px 14px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}
    >
      {/* Project label */}
      <div
        className="absolute"
        style={{
          top: '20px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        <span
          className="flex items-center justify-center"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: AI_SURFACE,
            color: AI_COLOR,
          }}
        >
          <ModusWcIcon
            name="building"
            size="xs"
            decorative
            style={{ color: 'currentColor' }}
          />
        </span>
        <div className="flex flex-col">
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '14px',
            }}
          >
            Cedar Hills · Phase 2 · Block C
          </span>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              fontWeight: 600,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '16px',
            }}
          >
            BIM viewport · 4D schedule
          </span>
        </div>
      </div>

      {/* View controls — top-right of canvas */}
      <div
        className="absolute flex items-center"
        style={{
          top: '20px',
          right: '20px',
          gap: '6px',
          zIndex: 5,
        }}
      >
        <span
          className="flex items-center"
          style={{
            gap: '4px',
            height: '24px',
            padding: '0 8px',
            borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(4px)',
            border:
              '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            color:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          <ModusWcIcon name="cursor_select" size="xs" decorative />
          Drag to rotate
        </span>
        {isRotated && (
          <button
            type="button"
            onClick={() => setYaw(0)}
            className="flex items-center transition-colors"
            style={{
              gap: '4px',
              height: '24px',
              padding: '0 8px',
              borderRadius: '999px',
              border:
                '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              backgroundColor: '#ffffff',
              color: AI_COLOR,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = AI_SURFACE;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <ModusWcIcon name="refresh" size="xs" decorative />
            Reset view
          </button>
        )}
      </div>

      {/* Background canvas — interactive 3D model */}
      <div
        className="absolute"
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={handleCanvasTouchStart}
        style={{
          inset: 0,
          padding: '52px 28px 28px 28px',
          zIndex: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <StructuralModel
          yaw={yaw}
          hlFoundation={hlFoundation}
          hlRoof={hlRoof}
          focusedZone={focusedZone}
          onZoneClick={handleZoneClick}
        />
      </div>

      {/* Foreground panel — Gantt rebalance card */}
      <div
        className="absolute"
        style={{
          bottom: '24px',
          right: '24px',
          width: '460px',
          padding: '1.5px',
          borderRadius: '14px',
          background: TRIMBLE_RAINBOW,
          boxShadow: '0px 8px 24px rgba(20, 24, 32, 0.14)',
          zIndex: 10,
        }}
      >
        <div
          className="bg-white flex flex-col"
          style={{
            borderRadius: '12.5px',
            padding: '16px 18px',
            gap: '12px',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center" style={{ gap: '8px' }}>
              <ModusWcIcon
                name="sparkle"
                size="sm"
                decorative
                style={{ color: AI_COLOR }}
              />
              <div className="flex flex-col">
                <span
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    fontWeight: 700,
                    lineHeight: '20px',
                    color: 'var(--modus-wc-color-base-content, #101828)',
                  }}
                >
                  Schedule rebalance
                </span>
                <span
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    lineHeight: '16px',
                    color:
                      'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {allResolved
                    ? `All ${totals.total} AI shifts reviewed`
                    : `${totals.total} task${totals.total === 1 ? '' : 's'} shifted by AI · ${totals.pending} pending`}
                </span>
              </div>
            </div>

            {!allResolved ? (
              <button
                type="button"
                onClick={acceptAll}
                className="flex items-center transition-colors shrink-0"
                style={{
                  gap: '6px',
                  height: '26px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: `1px solid ${AI_COLOR}`,
                  backgroundColor: 'transparent',
                  color: AI_COLOR,
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = AI_SURFACE;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ModusWcIcon name="check_circle" size="xs" decorative />
                Accept all
              </button>
            ) : (
              <button
                type="button"
                onClick={reset}
                className="flex items-center transition-colors shrink-0"
                style={{
                  gap: '6px',
                  height: '26px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border:
                    '1px solid var(--modus-wc-color-base-200, #cbcdd6)',
                  backgroundColor: 'transparent',
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ModusWcIcon name="refresh" size="xs" decorative />
                Reset demo
              </button>
            )}
          </div>

          {/* Gantt: month axis + rows */}
          <div className="flex flex-col">
            <div className="flex" style={{ paddingLeft: `${NAME_COL}px` }}>
              <div
                className="relative"
                style={{ width: `${TIMELINE_WIDTH}px`, height: '16px' }}
              >
                {MONTHS.map((m) => (
                  <span
                    key={m.label}
                    className="absolute"
                    style={{
                      left: `${dayToPx(m.offset)}px`,
                      top: 0,
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color:
                        'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-y-0"
                style={{
                  left: `${NAME_COL}px`,
                  width: `${TIMELINE_WIDTH}px`,
                  pointerEvents: 'none',
                }}
              >
                {MONTHS.map((m) => (
                  <div
                    key={`grid-${m.label}`}
                    className="absolute top-0 bottom-0"
                    style={{
                      left: `${dayToPx(m.offset)}px`,
                      width: '1px',
                      backgroundColor:
                        'var(--modus-wc-color-base-100, #f1f1f6)',
                    }}
                  />
                ))}
                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    right: 0,
                    width: '1px',
                    backgroundColor:
                      'var(--modus-wc-color-base-100, #f1f1f6)',
                  }}
                />
              </div>

              <div className="relative flex flex-col">
                {TASKS.map((t) => (
                  <GanttRow
                    key={t.id}
                    task={t}
                    status={t.edit ? statuses[t.id] : 'pending'}
                    focused={focusedId === t.id}
                    onFocus={() => setFocusedId(t.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Focused-task detail strip */}
          {focusedTask && focusedTask.edit && focusedStatus === 'pending' && (
            <div
              className="flex flex-col"
              style={{
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: AI_SURFACE,
                border: `1px solid ${AI_COLOR}33`,
              }}
            >
              <div
                className="flex items-center flex-wrap"
                style={{
                  gap: '6px',
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  lineHeight: '18px',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                  }}
                >
                  {focusedTask.name}
                </span>
                <span
                  className="inline-flex items-center"
                  style={{
                    gap: '3px',
                    padding: '0 6px',
                    height: '18px',
                    borderRadius: '999px',
                    backgroundColor: '#ffffff',
                    border: `1px solid ${HL_CYAN_DEEP}`,
                    color: HL_CYAN_DEEP,
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  <ModusWcIcon
                    name="location"
                    size="xs"
                    decorative
                    style={{ color: 'currentColor' }}
                  />
                  highlighted in model
                </span>
              </div>

              <div
                className="flex items-center flex-wrap"
                style={{
                  gap: '6px',
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  lineHeight: '18px',
                }}
              >
                <span
                  style={{
                    textDecoration: 'line-through',
                    color:
                      'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {dayToDateStr(focusedTask.edit.originalStartDay)} –{' '}
                  {dayToDateStr(focusedTask.edit.originalEndDay)}
                </span>
                <ModusWcIcon
                  name="chevron_right"
                  size="xs"
                  decorative
                  style={{
                    color:
                      'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                />
                <span
                  style={{
                    color: AI_COLOR,
                    backgroundColor: '#ffffff',
                    padding: '1px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    border: `1px solid ${AI_COLOR}`,
                  }}
                >
                  {dayToDateStr(focusedTask.startDay)} –{' '}
                  {dayToDateStr(focusedTask.endDay)}
                </span>
              </div>

              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  lineHeight: '18px',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                }}
              >
                {focusedTask.edit.rationale}
                <span
                  style={{
                    color:
                      'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {' '}
                  · {focusedTask.edit.source}
                </span>
              </span>

              <div className="flex items-center" style={{ gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setStatus(focusedTask.id, 'accepted')}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    height: '30px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: ACCEPTED_COLOR,
                    color: '#ffffff',
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    gap: '6px',
                  }}
                >
                  <ModusWcIcon name="check" size="xs" decorative />
                  Accept shift
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(focusedTask.id, 'rejected')}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    height: '30px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border:
                      '1px solid var(--modus-wc-color-base-200, #cbcdd6)',
                    backgroundColor: '#ffffff',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'var(--modus-wc-color-base-100, #f1f1f6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <ModusWcIcon name="close" size="xs" decorative />
                  Reject (keep original)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
