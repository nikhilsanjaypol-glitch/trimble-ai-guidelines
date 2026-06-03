import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 6 — VISUALIZE WORK DONE FOR ACCEPTANCE
 *
 * A 3D BIM viewport where the only cyan elements are the four
 * structural joints the AI just added.  Everything else — columns,
 * beams, bracing, slabs — stays in plain greyscale, so the eye
 * lands on AI's contribution instantly without competing detail.
 *
 * A small notification card floats below the model with a sparkle
 * icon, the message, and a Trimble-rainbow accent line along the
 * bottom edge.  Clicking the card accepts the change — the cyan
 * joints fade, the card flips to a confirmed state, and a reset
 * link makes the demo replayable.
 *
 * The model itself is interactive: drag to rotate around the
 * vertical axis, click any highlighted joint to ping it, or hit
 * "Reset view" to return to the canonical angle.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

const AI_COLOR = '#1B6FD9';
const AI_SURFACE = '#E6F1FB';
const ACCEPTED_GREEN = '#1E7A4F';

const HL_CYAN_DEEP = '#1FB1A7';
const HL_CYAN_FILL = 'rgba(60, 201, 192, 0.55)';
const HL_CYAN_FILL_FOCUS = 'rgba(60, 201, 192, 0.78)';

const FRAME_DARK = '#586069';
const FRAME_MED = '#8C939E';
const FRAME_FAINT = '#BFC4CC';

/* ── Building geometry ──────────────────────────────────────────── */
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
    const cx = x - W / 2;
    const cz = z - D / 2;
    const rx = cx * c + cz * s;
    const rz = -cx * s + cz * c;
    return [rx * C + rz * DX, -y * C + rz * DY];
  };
}

/* ── Structural model ───────────────────────────────────────────── */
function StructuralModel({
  yaw,
  showHighlights,
  pingedJoint,
  onJointClick,
}: {
  yaw: number;
  showHighlights: boolean;
  pingedJoint: number | null;
  onJointClick: (j: number) => void;
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
      />
    );
  };

  /* ── Greyscale frame ───────────────────────────────────────── */
  const frame: JSX.Element[] = [];

  // Faint floor outlines for depth perception
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

  // Front-face columns
  for (let i = 0; i <= W; i++) {
    frame.push(ln(`col-front-${i}`, [i, 0, 0], [i, H, 0], FRAME_DARK, 1.1));
  }
  // Right-side columns
  for (let k = 1; k <= D; k++) {
    frame.push(ln(`col-right-${k}`, [W, 0, k], [W, H, k], FRAME_DARK, 1.1));
  }
  // Back-left corner column
  frame.push(ln('col-bl', [0, 0, D], [0, H, D], FRAME_MED, 0.9));
  // Back-face intermediate columns (faint)
  for (let i = 1; i < W; i++) {
    frame.push(ln(`col-back-${i}`, [i, 0, D], [i, H, D], FRAME_FAINT, 0.6));
  }
  // Left-face intermediate columns (faint)
  for (let k = 1; k < D; k++) {
    frame.push(ln(`col-left-${k}`, [0, 0, k], [0, H, k], FRAME_FAINT, 0.6));
  }

  // Beams at every floor
  for (let j = 1; j <= H; j++) {
    frame.push(ln(`bm-f-${j}`, [0, j, 0], [W, j, 0], FRAME_DARK, 0.9));
    frame.push(ln(`bm-r-${j}`, [W, j, 0], [W, j, D], FRAME_DARK, 0.9));
    frame.push(ln(`bm-b-${j}`, [0, j, D], [W, j, D], FRAME_FAINT, 0.5));
    frame.push(ln(`bm-l-${j}`, [0, j, 0], [0, j, D], FRAME_FAINT, 0.5));
  }

  // X-bracing on right side, rear bay (matches reference)
  for (let j = 0; j < H; j++) {
    frame.push(ln(`br-${j}-a`, [W, j, 2], [W, j + 1, D], FRAME_FAINT, 0.6));
    frame.push(ln(`br-${j}-b`, [W, j + 1, 2], [W, j, D], FRAME_FAINT, 0.6));
  }

  /* ── Highlight: structural joints (the AI's edit) ──────────── */
  const joints: JSX.Element[] = [];
  if (showHighlights) {
    for (let j = 1; j < H; j++) {
      const yBot = j;
      const yTop = j + 0.45;
      const zNear = 1.25;
      const zFar = 1.85;
      const isFocused = pingedJoint === j;
      joints.push(
        <polygon
          key={`joint-${j}`}
          points={`${pt(W, yBot, zNear)} ${pt(W, yTop, zNear)} ${pt(W, yTop, zFar)} ${pt(W, yBot, zFar)}`}
          fill={isFocused ? HL_CYAN_FILL_FOCUS : HL_CYAN_FILL}
          stroke={HL_CYAN_DEEP}
          strokeWidth={isFocused ? 1.6 : 0.9}
          style={{
            transition:
              'fill 280ms ease, stroke-width 280ms ease, opacity 600ms ease',
          }}
        />,
      );
    }
  }

  /* ── Hit-targets so each joint is clickable & cursor-aware ─ */
  const hitTargets: JSX.Element[] = [];
  if (showHighlights) {
    for (let j = 1; j < H; j++) {
      const yBot = j - 0.05;
      const yTop = j + 0.55;
      const zNear = 1.05;
      const zFar = 2.05;
      hitTargets.push(
        <polygon
          key={`hit-${j}`}
          points={`${pt(W, yBot, zNear)} ${pt(W, yTop, zNear)} ${pt(W, yTop, zFar)} ${pt(W, yBot, zFar)}`}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onJointClick(j);
          }}
        >
          <title>Structural joint · level {j}</title>
        </polygon>,
      );
    }
  }

  return (
    <svg
      viewBox="-200 -260 400 320"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-label="3D BIM model — drag to rotate"
    >
      {frame}
      {joints}
      {hitTargets}
    </svg>
  );
}

/* ── Pro 6 — interactive 3D BIM canvas with a single AI edit ───── */
export default function Pro6() {
  const [yaw, setYaw] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [pingedJoint, setPingedJoint] = useState<number | null>(null);

  /* Drag-to-rotate */
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
    const onMove = (e: MouseEvent) => move(e.clientX);
    const onUp = () => end();
    const onTMove = (e: TouchEvent) => {
      if (e.touches.length > 0) move(e.touches[0].clientX);
    };
    const onTEnd = () => end();
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

  function handleJointClick(j: number) {
    if (dragRef.current?.moved) return;
    setPingedJoint(j);
    window.setTimeout(() => setPingedJoint(null), 1200);
  }

  function acceptChanges() {
    setAccepted(true);
    setPingedJoint(null);
  }

  function reset() {
    setAccepted(false);
    setYaw(0);
    setPingedJoint(null);
  }

  const isRotated = Math.abs(yaw) > 0.02;

  return (
    <div
      className="relative bg-white"
      style={{
        width: '720px',
        height: '500px',
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
        <div className="flex flex-col">
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '14px',
            }}
          >
            Cedar Hills · Phase 2 · Block C
          </span>
        </div>
      </div>

      {/* View controls — top-right */}
      <div
        className="absolute flex items-center"
        style={{
          top: '18px',
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
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
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
              border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
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

      {/* 3D model canvas */}
      <div
        className="absolute"
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={handleCanvasTouchStart}
        style={{
          inset: 0,
          padding: '52px 28px 88px 28px',
          zIndex: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <StructuralModel
          yaw={yaw}
          showHighlights={!accepted}
          pingedJoint={pingedJoint}
          onJointClick={handleJointClick}
        />
      </div>

      {/* Notification card — sparkle + message + Accept button + rainbow line */}
      <div
        className="absolute"
        style={{
          bottom: '22px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <div
          className="relative flex flex-col bg-white"
          style={{
            width: '300px',
            borderRadius: '12px',
            padding: '14px 16px 18px',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            boxShadow: '0px 8px 22px rgba(20, 24, 32, 0.12)',
            overflow: 'hidden',
            gap: '12px',
          }}
        >
          {/* Message row */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <ModusWcIcon
              name={accepted ? 'check_circle' : 'sparkle'}
              size="sm"
              decorative
              style={{
                color: accepted ? ACCEPTED_GREEN : AI_COLOR,
              }}
            />
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 600,
                lineHeight: '20px',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              {accepted ? 'Changes accepted' : 'Added Structural joints'}
            </span>
          </div>

          {/* Action: Accept Changes (primary) or Reset demo (secondary) */}
          {!accepted ? (
            <button
              type="button"
              onClick={acceptChanges}
              className="w-full flex items-center justify-center transition-colors"
              style={{
                height: '34px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: HL_CYAN_DEEP,
                color: '#ffffff',
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 700,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1A9C93';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = HL_CYAN_DEEP;
              }}
            >
              <ModusWcIcon name="check" size="xs" decorative />
              Accept Changes
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="self-start flex items-center transition-colors"
              style={{
                gap: '4px',
                height: '24px',
                padding: '0 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: AI_COLOR,
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              <ModusWcIcon name="refresh" size="xs" decorative />
              Reset demo
            </button>
          )}

          {/* Rainbow accent line — sits at the very bottom edge */}
          <div
            aria-hidden
            className="absolute"
            style={{
              left: 0,
              right: 0,
              bottom: 0,
              height: '3px',
              background: TRIMBLE_RAINBOW,
            }}
          />
        </div>
      </div>
    </div>
  );
}
