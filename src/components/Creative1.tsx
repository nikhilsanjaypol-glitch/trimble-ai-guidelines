import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ModusWcIcon,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

/* ── Guideline ─── ALLOW EDITABLE OUTPUTS ──────────────────────
 * The AI drafts a first-pass project budget. The output is not
 * a picture of a chart — it IS the chart. Click any category
 * in the legend, type a new number, and the donut, total, and
 * variance reflow in place. Same artefact, fully manipulable.
 * ─────────────────────────────────────────────────────────────── */

/* ── Data model ──────────────────────────────────────────────── */
interface Segment {
  id: string;
  name: string;
  value: number; // $ thousands
  color: string;
}

const INITIAL_SEGMENTS: Segment[] = [
  { id: 'site',      name: 'Site work',  value: 120, color: '#00D7C0' },
  { id: 'structure', name: 'Structure',  value: 280, color: '#009AFE' },
  { id: 'finishes',  name: 'Finishes',   value: 145, color: '#4A00FF' },
  { id: 'mep',       name: 'Mechanical', value: 105, color: '#FF2092' },
];

const TARGET_BUDGET = 650;

// Donut geometry (module-level so React hooks deps stay stable).
const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 88;
const STROKE = 30;

/* ── Geometry helpers ────────────────────────────────────────── */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

const fmtK = (n: number) => `$${Math.round(n)}k`;

/* ── Main component ──────────────────────────────────────────── */
export default function Creative1() {
  const [segments, setSegments] = useState<Segment[]>(INITIAL_SEGMENTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const total = useMemo(
    () => segments.reduce((s, x) => s + x.value, 0),
    [segments],
  );
  const variance = total - TARGET_BUDGET;
  const overBudget = variance > 0;

  // Build arc geometry as a pure transform — no mutated closure variables.
  const arcs = useMemo<Arc[]>(() => {
    return segments.map((seg, i) => {
      const beforeSum = segments
        .slice(0, i)
        .reduce((acc, x) => acc + x.value, 0);
      const startSweep = total > 0 ? (beforeSum / total) * 360 : 0;
      const pct = total > 0 ? seg.value / total : 0;
      const sweep = pct * 360;
      const startAngle = startSweep + 0.6;
      const endAngle = Math.max(startSweep + sweep - 0.6, startAngle);
      return {
        ...seg,
        pct,
        startAngle,
        endAngle,
        path: describeArc(CX, CY, RADIUS, startAngle, endAngle),
      };
    });
  }, [segments, total]);

  function updateSegment(id: string, newValue: number) {
    if (!Number.isFinite(newValue) || newValue < 0) return;
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value: newValue } : s)),
    );
  }

  return (
    <div
      className="rounded-2xl"
      style={{
        width: '560px',
        padding: '2px',
        background: TRIMBLE_RAINBOW,
        boxShadow: '0 8px 28px rgba(15, 23, 42, 0.10)',
      }}
    >
      <div
        className="rounded-[14px] flex flex-col"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          padding: '22px 24px',
          gap: '20px',
        }}
      >
        {/* Title block */}
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span
              className="uppercase font-semibold inline-flex items-center gap-1"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                letterSpacing: '0.5px',
              }}
            >
              <ModusWcIcon
                name="sparkle"
                size="xs"
                decorative
                style={{ color: 'inherit' }}
              />
              AI Draft · Project budget
            </span>
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-md, 16px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                marginTop: '2px',
              }}
            >
              Riverside Office · Q3 plan
            </span>
          </div>

          <span
            className="inline-flex items-center gap-1 px-2"
            style={{
              height: '22px',
              borderRadius: '1000px',
              backgroundColor: 'rgba(30, 126, 52, 0.10)',
              color: 'var(--modus-wc-color-status-success, #1e7e34)',
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
            }}
          >
            <ModusWcIcon
              name="edit_combination"
              size="xs"
              decorative
              style={{ color: 'inherit' }}
            />
            Editable
          </span>
        </header>

        {/* Body — donut + legend */}
        <div className="flex items-center" style={{ gap: '24px' }}>
          <Donut
            size={SIZE}
            cx={CX}
            cy={CY}
            radius={RADIUS}
            stroke={STROKE}
            arcs={arcs}
            hoverId={hoverId}
            editingId={editingId}
            total={total}
            onHover={setHoverId}
            onSelect={(id) => setEditingId(id)}
          />

          <div className="flex flex-col flex-1" style={{ gap: '6px' }}>
            {arcs.map((a) => (
              <LegendRow
                key={a.id}
                segment={a}
                pct={a.pct}
                hovered={hoverId === a.id}
                editing={editingId === a.id}
                onHover={(v) => setHoverId(v ? a.id : null)}
                onStartEdit={() => setEditingId(a.id)}
                onClose={() => setEditingId(null)}
                onChange={(v) => updateSegment(a.id, v)}
              />
            ))}

            {/* Variance footer */}
            <div
              className="flex items-center justify-between"
              style={{
                marginTop: '6px',
                paddingTop: '10px',
                borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              }}
            >
              <span
                className="uppercase font-semibold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  letterSpacing: '0.4px',
                }}
              >
                vs target {fmtK(TARGET_BUDGET)}
              </span>
              <span
                className="font-semibold tabular-nums inline-flex items-center gap-1"
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: overBudget
                    ? 'var(--modus-wc-color-status-warning, #c46c00)'
                    : 'var(--modus-wc-color-status-success, #1e7e34)',
                }}
              >
                <ModusWcIcon
                  name={overBudget ? 'caret_up' : 'caret_down'}
                  size="xs"
                  decorative
                  style={{ color: 'inherit' }}
                />
                {overBudget ? '+' : ''}
                {fmtK(variance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Donut ───────────────────────────────────────────────────── */
interface Arc extends Segment {
  pct: number;
  startAngle: number;
  endAngle: number;
  path: string;
}

interface DonutProps {
  size: number;
  cx: number;
  cy: number;
  radius: number;
  stroke: number;
  arcs: Arc[];
  hoverId: string | null;
  editingId: string | null;
  total: number;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

function Donut({
  size,
  cx,
  cy,
  radius,
  stroke,
  arcs,
  hoverId,
  editingId,
  total,
  onHover,
  onSelect,
}: DonutProps) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--modus-wc-color-base-100, #f1f1f6)"
          strokeWidth={stroke}
        />
        {/* segments */}
        {arcs.map((a) => {
          const isActive = hoverId === a.id || editingId === a.id;
          return (
            <path
              key={a.id}
              d={a.path}
              fill="none"
              stroke={a.color}
              strokeWidth={isActive ? stroke + 4 : stroke}
              strokeLinecap="butt"
              style={{
                cursor: 'pointer',
                transition: 'stroke-width 160ms ease',
              }}
              onMouseEnter={() => onHover(a.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(a.id)}
            />
          );
        })}
      </svg>

      {/* center label */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ textAlign: 'center' }}
      >
        <span
          className="uppercase font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.5px',
          }}
        >
          Total
        </span>
        <span
          className="font-semibold tabular-nums"
          style={{
            fontSize: '30px',
            lineHeight: '36px',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            letterSpacing: '-0.5px',
          }}
        >
          {fmtK(total)}
        </span>
      </div>
    </div>
  );
}

/* ── Legend Row ──────────────────────────────────────────────── */
interface LegendRowProps {
  segment: Segment;
  pct: number;
  hovered: boolean;
  editing: boolean;
  onHover: (v: boolean) => void;
  onStartEdit: () => void;
  onClose: () => void;
  onChange: (v: number) => void;
}

function LegendRow({
  segment,
  pct,
  hovered,
  editing,
  onHover,
  onStartEdit,
  onClose,
  onChange,
}: LegendRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const inputElRef = useRef<Element | null>(null);

  // Focus the shadow-DOM input once when we enter edit mode.
  useEffect(() => {
    if (!editing) return;
    const id = window.setTimeout(() => {
      const host = inputElRef.current as
        | (Element & { shadowRoot?: ShadowRoot | null })
        | null;
      const inner = host?.shadowRoot?.querySelector('input');
      inner?.focus();
      inner?.select?.();
    }, 0);
    return () => window.clearTimeout(id);
  }, [editing]);

  // Click outside the row closes edit mode.
  useEffect(() => {
    if (!editing) return;
    function handler(e: MouseEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [editing, onClose]);

  return (
    <div
      ref={rowRef}
      className="flex items-center rounded-md"
      style={{
        gap: '12px',
        padding: '6px 8px',
        backgroundColor:
          hovered || editing
            ? 'var(--modus-wc-color-base-100, #f1f1f6)'
            : 'transparent',
        cursor: editing ? 'default' : 'pointer',
        transition: 'background-color 140ms ease',
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={() => !editing && onStartEdit()}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === 'Escape') onClose();
      }}
    >
      <span
        className="block rounded-sm shrink-0"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: segment.color,
        }}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <span
          className="font-medium truncate"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '18px',
          }}
        >
          {segment.name}
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            lineHeight: '14px',
          }}
        >
          {Math.round(pct * 100)}%
        </span>
      </div>

      {editing ? (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ width: '92px' }}
        >
          <ModusWcTextInput
            ref={(el: Element | null) => {
              inputElRef.current = el;
            }}
            value={String(segment.value)}
            size="sm"
            bordered={false}
            onInputChange={(e: CustomEvent) => {
              const v = e.detail?.target?.value ?? '';
              const n = parseFloat(v);
              if (Number.isFinite(n) && n >= 0) onChange(n);
            }}
          />
        </div>
      ) : (
        <span
          className="font-semibold tabular-nums"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            minWidth: '64px',
            textAlign: 'right',
          }}
        >
          {fmtK(segment.value)}
        </span>
      )}
    </div>
  );
}
