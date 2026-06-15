import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ModusWcIcon,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';

/* ── Guideline ─── BUILD UPON EXISTING WORK ────────────────────
 * The AI must allow iterations from existing decisions — whether
 * they came from the software itself, from external sources, or
 * from a previous AI iteration.
 *
 * Scenario — same Trimble Modus widget as Creative 1, but the
 * only way to modify it is by prompt:
 *   1. The AI delivers the "Purchases by Cost Center" widget,
 *      defaulted to a bar chart.
 *   2. There is no settings card and no toolbar. To keep iterating
 *      on the AI's output, the professional clicks "Edit with AI",
 *      which opens a single dedicated text box.
 *   3. They type a request — e.g. "can you edit the colours to
 *      differentiate the cost centres" — and the widget updates
 *      in place, building on its previous state instead of being
 *      regenerated from scratch.
 * ─────────────────────────────────────────────────────────────── */

/* ── Tokens taken from the Figma reference ──────────────────── */
const COLORS = {
  text:        '#252a2e',
  textMid:     '#464b52',
  textLow:     '#6a6e79',
  border:      '#e0e1e9',
  bgLight:     '#f1f1f6',
  white:       '#ffffff',
  blue:        '#0063a3',
  /* Cost-center palette — all in the Trimble blue family but spaced widely
   * across value (navy → sky) plus a small hue shift on the teal so the four
   * lines on the chart and the four legend chips read as distinct at a glance. */
  ccBlue:      '#0063a3',  // Trimble blue (brand anchor — cc1)
  ccNavy:      '#0a2e54',  // Deep navy (cc2)
  ccSky:       '#4ab1de',  // Light sky (cc3)
  ccTeal:      '#1a8aa8',  // Teal-leaning blue (cc4)
  aiAccent:    '#4A00FF',
};

/* ── Data model ─────────────────────────────────────────────── */
type CcId = 'cc1' | 'cc2' | 'cc3' | 'cc4';

interface CostCenter {
  id: CcId;
  label: string;
  color: string;
  monthly: number[];
}

const INITIAL_TITLE = 'Purchases By Cost Center';

const INITIAL_CCS: CostCenter[] = [
  { id: 'cc1', label: 'Cost Center 01', color: COLORS.ccBlue, monthly: [30, 50, 50, 70, 25, 65, 20, 40, 30,  0, 20,  0] }, // 400
  { id: 'cc2', label: 'Cost Center 02', color: COLORS.ccNavy, monthly: [40, 35, 50, 50, 25, 80, 30, 60, 70,  0, 60,  0] }, // 500
  { id: 'cc3', label: 'Cost Center 03', color: COLORS.ccSky,  monthly: [30, 35, 45, 35, 20, 45, 25, 30, 25,  0, 50, 10] }, // 350
  { id: 'cc4', label: 'Cost Center 04', color: COLORS.ccTeal, monthly: [30, 35, 50, 70, 25, 50, 25, 60, 30, 30, 35, 10] }, // 450
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Synthetic forecast for the next 2 months (used by the forecast widget).
 * Labelled with a year suffix so they read as "next-year January / February"
 * instead of duplicating the Jan / Feb already shown earlier on the x-axis. */
const FORECAST_MONTHS = ["Jan '27", "Feb '27"];
const FORECAST_BY_CC: Record<CcId, number[]> = {
  cc1: [42, 38],
  cc2: [55, 60],
  cc3: [30, 35],
  cc4: [50, 45],
};
/* Reported as "model confidence" inside the AI forecast popover. */
const FORECAST_CONFIDENCE = 87;

/* ── Chart display options (mutated only by the AI edit prompt) ──── */
type PaletteId = 'blue' | 'sunset' | 'forest' | 'mono' | 'distinct';

/** Available chart styles. The settings card lets the user switch between
 * these — the underlying CC data + colors are shared, so the chart is the
 * only thing that changes. */
type ChartType = 'forecast' | 'bar' | 'donut';

interface ChartDisplay {
  /** Which chart visualization to render. */
  chartType: ChartType;
  /** Show the dashed AI projection (and the violet shaded band).
   *  Only meaningful for the forecast and bar charts. */
  showForecast: boolean;
  /** Render circles at every monthly + forecast data point.
   *  Only used by the forecast chart. */
  showDataPoints: boolean;
  /** Show the dashed Y-axis grid lines. Used by forecast and bar. */
  showGrid: boolean;
  /** How many forecast months to draw (1 or 2). */
  forecastMonths: 1 | 2;
  /** Which preset palette is applied to the cost centers. */
  palette: PaletteId;
}

/* Preset palettes — selecting one in the Settings card overwrites the
 * four cost-center colors. The "blue" palette mirrors the original
 * Trimble-blue family used in the AI's first response. */
const PALETTES: Record<PaletteId, [string, string, string, string]> = {
  blue:     [COLORS.ccBlue, COLORS.ccNavy, COLORS.ccSky,  COLORS.ccTeal],
  sunset:   ['#d97706',     '#b91c1c',     '#7c2d12',     '#f59e0b'],
  forest:   ['#15803d',     '#166534',     '#65a30d',     '#0f766e'],
  mono:     ['#252a2e',     '#464b52',     '#6a6e79',     '#a8acb8'],
  /* "Differentiated" palette — picked for maximum hue separation so
   * each cost center reads as its own slice. Triggered by the AI
   * edit prompt when the user asks for distinct / differentiated
   * colours. */
  distinct: ['#0063A3',     '#F59E0B',     '#10B981',     '#D946EF'],
};

const INITIAL_DISPLAY: ChartDisplay = {
  chartType: 'bar',
  showForecast: true,
  showDataPoints: true,
  showGrid: true,
  forecastMonths: 2,
  palette: 'blue',
};

/* Available views — match the Figma dropdown (Overview + each cost center). */
type ViewId = 'overview' | CcId;


/* ── Chart geometry ─────────────────────────────────────────── */
/* The chart SVG spans the full 720 px widget width. The chart height
 * is 360, giving the widget a near-square ~1.30∶1 ratio that's a touch
 * smaller than the previous 760 × 574 size while preserving the same
 * proportions. The 24 px Header / SummaryStrip gutter is reproduced
 * *inside* the SVG:
 *   • Y-axis tick labels are LEFT-aligned at SVG x = 24, so their
 *     left edge lines up with "Total Purchase Orders" above.
 *   • PAD_LEFT = 52 — leaves room (24 + ~22px for "100" + 6 padding)
 *     before the plot starts so labels never collide with grid lines.
 *   • PAD_RIGHT = 24 — plot right-edge lands at widget x = 696, the
 *     same column where the legend's "500" / "450" totals end.
 * All three rows of widget content thus line up at the same left and
 * right margin. */
const CHART_W = 720;
const CHART_H = 360;
const PAD_LEFT = 52;
const PAD_RIGHT = 24;
const Y_LABEL_X = 24;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PLOT_W = CHART_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = CHART_H - PAD_TOP - PAD_BOTTOM;

/* ── Tooltip data shape ─────────────────────────────────────── */
interface TooltipData {
  ccId: CcId;
  ccLabel: string;
  ccColor: string;
  month: string;
  value: number;
  /** Anchor in HTML (chart-container) px, used to position the popover. */
  x: number;
  y: number;
}

/* ── Main component ─────────────────────────────────────────── */
export default function Creative2() {
  /* AI's output state — what the widget shows. The "Edit with AI"
   * prompt below is the only way to mutate it; there's no settings
   * card and no toolbar in this variant. */
  const [title] = useState(INITIAL_TITLE);
  const [ccs, setCcs] = useState<CostCenter[]>(INITIAL_CCS);
  const [display, setDisplay] = useState<ChartDisplay>(INITIAL_DISPLAY);

  /* Chart-level interactivity */
  const [hoveredCc, setHoveredCc] = useState<CcId | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  /* Currently selected chart view — drives which chart component renders.
   * Switching the view also clears any active tooltip / hover so we don't
   * accidentally show a stale popover from the previous chart. */
  const [view, setView] = useState<ViewId>('overview');
  function changeView(next: ViewId) {
    setView(next);
    setHoveredCc(null);
    setTooltip(null);
  }

  /**
   * Prompt-bar submission → applies the requested modification on
   * top of the widget's *current* state. The widget is never
   * regenerated; we mutate `ccs` / `display` in place so each
   * iteration explicitly builds on the previous one. Currently
   * understands colour / palette requests.
   */
  function applyPromptEdit(p: string): void {
    const lower = p.toLowerCase();
    if (/(colou?r|differentiate|distinguish|distinct|hue|palette)/.test(lower)) {
      const colors = PALETTES.distinct;
      setDisplay((d) => ({ ...d, palette: 'distinct' }));
      setCcs((prev) =>
        prev.map((cc, i) => ({ ...cc, color: colors[i] ?? cc.color })),
      );
    }
  }

  /* When the dropdown is on a single cost center, filter the cost-center
   * list down to just that one. The legend, the headline total, and the
   * forecast widget all derive from this filtered list. */
  const focusedCcs = useMemo(
    () => (view === 'overview' ? ccs : ccs.filter((c) => c.id === view)),
    [view, ccs],
  );

  /* Totals + grandTotal for the *focused* set — drive the legend chips
   * and the headline "Total Purchase Orders" KPI. */
  const focusedTotals = useMemo(
    () => focusedCcs.map((cc) => cc.monthly.reduce((a, b) => a + b, 0)),
    [focusedCcs],
  );
  const focusedGrandTotal = useMemo(
    () => focusedTotals.reduce((sum, t) => sum + t, 0),
    [focusedTotals],
  );

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div
      className="flex flex-col"
      style={{
        gap: '14px',
        fontFamily: '"Open Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Keyframes that drive the widget card's rainbow ring. Palindrome
       * motion (out-and-back) at 3.6 s ease-in-out matches the treatment
       * used on the Expert 3 chat cards so every AI surface in the app
       * shimmers in the same cadence. */}
      <style>{`
        @keyframes creative2RainbowShimmer {
          0%   { background-position: 0% 50%, 0% 50%; }
          50%  { background-position: 0% 50%, 100% 50%; }
          100% { background-position: 0% 50%, 0% 50%; }
        }
      `}</style>

      <div style={{ marginTop: '10px' }}>
        <div style={{ position: 'relative', width: '720px' }}>
          {/* AI's output — shimmering rainbow border marks it as a live
           * AI artifact. There is no settings overlay in this variant. */}
          <div
            style={{
              width: '720px',
              boxSizing: 'border-box',
              border: '2px solid transparent',
              borderRadius: '16px',
              backgroundImage:
                `linear-gradient(${COLORS.white}, ${COLORS.white}), ` +
                'linear-gradient(90deg, #00d7c0 0%, #0094f0 35%, #b73efa 68%, #ff5a8c 100%)',
              backgroundSize: '100% 100%, 200% 100%',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              animation: 'creative2RainbowShimmer 3.6s ease-in-out infinite',
              boxShadow:
                '0 1px 3px rgba(15,23,42,0.08), 0 8px 28px rgba(15,23,42,0.06)',
              overflow: 'hidden',
              transition: 'box-shadow 160ms ease',
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            <Header title={title} view={view} onViewChange={changeView} />
            <SummaryStrip
              ccs={focusedCcs}
              totals={focusedTotals}
              grandTotal={focusedGrandTotal}
              hoveredCc={hoveredCc}
              onHover={setHoveredCc}
            />
            {display.chartType === 'forecast' && (
              <ChartForecast
                ccs={focusedCcs}
                display={display}
                hoveredCc={hoveredCc}
                tooltip={tooltip}
                onHover={setHoveredCc}
                onTooltip={setTooltip}
              />
            )}
            {display.chartType === 'bar' && (
              <ChartBar
                ccs={focusedCcs}
                display={display}
                hoveredCc={hoveredCc}
                tooltip={tooltip}
                onHover={setHoveredCc}
                onTooltip={setTooltip}
              />
            )}
            {display.chartType === 'donut' && (
              <ChartDonut
                ccs={focusedCcs}
                totals={focusedTotals}
                grandTotal={focusedGrandTotal}
                hoveredCc={hoveredCc}
                onHover={setHoveredCc}
              />
            )}
          </div>
        </div>
      </div>

      {/* No toolbar — modifications happen only through this prompt. */}
      <AiEditPrompt
        widgetWidth={720}
        suggestion="can you edit the colours to differentiate the cost centres"
        onSubmit={applyPromptEdit}
      />
    </div>
  );
}

/* ── Widget header (read-only) ──────────────────────────────── */
const VIEW_OPTIONS: Array<{ id: ViewId; label: string }> = [
  { id: 'overview', label: 'All cost centers' },
  { id: 'cc1', label: 'Cost Center 1' },
  { id: 'cc2', label: 'Cost Center 2' },
  { id: 'cc3', label: 'Cost Center 3' },
  { id: 'cc4', label: 'Cost Center 4' },
];

interface HeaderProps {
  title: string;
  view: ViewId;
  onViewChange: (next: ViewId) => void;
}

function Header({ title, view, onViewChange }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const selectedLabel =
    VIEW_OPTIONS.find((v) => v.id === view)?.label ?? 'All cost centers';

  return (
    <div
      style={{
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        /* 24px gutter — matches the SummaryStrip and chart wrappers below so
         * every row of widget content lines up at the same left/right edge. */
        padding: '0 24px',
        borderBottom: `1px solid ${COLORS.border}`,
        position: 'relative',
      }}
    >
      <ModusWcIcon
        name="invoice"
        size="md"
        decorative
        style={{ color: COLORS.textLow, fontSize: '24px' }}
      />
      <span
        className="ml-3 flex-1"
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: COLORS.text,
          lineHeight: '20px',
          letterSpacing: '0.027px',
          minWidth: 0,
        }}
      >
        {title}
      </span>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1"
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: open ? COLORS.text : COLORS.textLow,
          letterSpacing: '0.018px',
          textTransform: 'capitalize',
          background: open ? COLORS.bgLight : 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'background-color 120ms ease, color 120ms ease',
        }}
      >
        {selectedLabel}
        <ModusWcIcon
          name="caret_down"
          size="sm"
          decorative
          style={{
            color: 'inherit',
            transform: open ? 'rotate(180deg)' : undefined,
            transition: 'transform 160ms ease',
          }}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% - 6px)',
            right: '12px',
            minWidth: '260px',
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)',
            padding: '6px',
            zIndex: 20,
          }}
        >
          {VIEW_OPTIONS.map((v) => {
            const isSelected = v.id === view;
            return (
              <button
                key={v.id}
                role="menuitem"
                type="button"
                onClick={() => {
                  onViewChange(v.id);
                  setOpen(false);
                }}
                className="flex items-center w-full text-left"
                style={{
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background-color 120ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    COLORS.bgLight;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'transparent';
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: isSelected ? 700 : 500,
                    color: COLORS.text,
                    letterSpacing: '0.15px',
                    flex: 1,
                  }}
                >
                  {v.label}
                </span>
                <span
                  className="inline-flex items-center justify-center shrink-0"
                  style={{
                    width: '18px',
                    height: '18px',
                    color: isSelected ? COLORS.text : 'transparent',
                  }}
                  aria-hidden={!isSelected}
                >
                  <ModusWcIcon
                    name="check"
                    size="sm"
                    decorative
                    style={{ color: 'inherit' }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Summary strip (Total + 2×2 legend) ─────────────────────── */
interface SummaryStripProps {
  ccs: CostCenter[];
  totals: number[];
  grandTotal: number;
  hoveredCc: CcId | null;
  onHover: (id: CcId | null) => void;
}

function SummaryStrip({
  ccs,
  totals,
  grandTotal,
  hoveredCc,
  onHover,
}: SummaryStripProps) {
  /* The strip is rendered as a single flex row of equal-weight cells
   * separated by hairline dividers. Each cell stacks a small uppercase
   * label and a large tabular value, the same way every cell in a
   * dashboard summary table would be presented. The visual contract is
   * "this is one table", not "these are five separate cards" — no
   * rounded corners, no shadows, no per-cell pill backgrounds. */
  return (
    <div
      style={{
        height: '90px',
        display: 'flex',
        alignItems: 'stretch',
        padding: '0 24px',
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {/* Column 1 — Total POs (no color dot, slightly wider) */}
      <SummaryCell
        label="Total Purchase Orders"
        value={grandTotal}
        widthGrow={1.4}
        isFirst
      />

      {/* Columns 2-5 — one cell per cost center */}
      {ccs.map((cc, i) => {
        const isHovered = hoveredCc === cc.id;
        const isOtherHovered = hoveredCc !== null && hoveredCc !== cc.id;
        return (
          <SummaryCell
            key={cc.id}
            label={cc.label}
            value={totals[i]}
            dotColor={cc.color}
            dimmed={isOtherHovered}
            highlighted={isHovered}
            onMouseEnter={() => onHover(cc.id)}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
    </div>
  );
}

/* ── SummaryStrip cell — one column of the unified summary table ── */
interface SummaryCellProps {
  label: string;
  value: number;
  /** Optional color dot next to the label (cost-center cells). */
  dotColor?: string;
  /** Stretch factor for the cell's flex-basis. Defaults to 1. */
  widthGrow?: number;
  /** Suppress the left hairline divider — used by the first cell. */
  isFirst?: boolean;
  /** Whether this cell is dimmed because another column is being hovered. */
  dimmed?: boolean;
  /** Whether this cell is the one being hovered. */
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function SummaryCell({
  label,
  value,
  dotColor,
  widthGrow = 1,
  isFirst,
  dimmed,
  highlighted,
  onMouseEnter,
  onMouseLeave,
}: SummaryCellProps) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex flex-col justify-center"
      style={{
        flex: `${widthGrow} 1 0`,
        minWidth: 0,
        padding: '0 10px',
        gap: '4px',
        /* Hairline divider on the left of every cell except the first —
         * gives the row the visual cadence of table columns without
         * adding decorative chrome. */
        borderLeft: isFirst ? 'none' : `1px solid ${COLORS.border}`,
        /* Hover wash spans the full cell so the strip reads as a row of
         * cells (a table), not a row of pills sitting on a strip. */
        backgroundColor: highlighted ? 'rgba(0, 99, 163, 0.06)' : 'transparent',
        opacity: dimmed ? 0.55 : 1,
        transition: 'background-color 120ms ease, opacity 120ms ease',
      }}
    >
      <div className="flex items-center" style={{ gap: '4px', minWidth: 0 }}>
        {dotColor && (
          <span
            aria-hidden="true"
            className="block shrink-0"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              backgroundColor: dotColor,
            }}
          />
        )}
        {/* Label intentionally renders WITHOUT ellipsis / nowrap so the
         * full text is always visible — the cell is sized below to fit
         * "TOTAL PURCHASE ORDERS" / "COST CENTER 0X" in full. If the
         * widget ever shrinks past that point the label will wrap to a
         * second line rather than being truncated. */}
        <span
          className="uppercase"
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: COLORS.textLow,
            letterSpacing: '0.3px',
            lineHeight: '13px',
          }}
        >
          {label}
        </span>
      </div>
      <span
        className="tabular-nums"
        style={{
          fontSize: '22px',
          fontWeight: 500,
          color: COLORS.text,
          lineHeight: '28px',
          letterSpacing: '0.03px',
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Forecast widget props ──────────────────────────────────── */
interface ChartForecastProps {
  ccs: CostCenter[];
  display: ChartDisplay;
  hoveredCc: CcId | null;
  tooltip: TooltipData | null;
  onHover: (id: CcId | null) => void;
  onTooltip: (data: TooltipData | null) => void;
}

/* ── Chart tooltip ─────────────────────────────────────────── */
function ChartTooltip({ data }: { data: TooltipData }) {
  /* Position the tooltip just above the segment, centered on the bar.
   * We add 12px of clearance and a small triangular notch beneath. */
  const TOOLTIP_W = 168;
  const HALF = TOOLTIP_W / 2;
  /* Clamp horizontally to keep the tooltip inside the chart canvas. */
  const left = Math.max(8, Math.min(CHART_W - TOOLTIP_W - 8, data.x - HALF));
  const top = Math.max(8, data.y - 64);

  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${TOOLTIP_W}px`,
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
        padding: '10px 12px',
        pointerEvents: 'none',
        zIndex: 5,
        fontFamily: '"Open Sans", system-ui, sans-serif',
      }}
    >
      <div className="flex items-center" style={{ gap: '6px', marginBottom: '4px' }}>
        <span
          className="block shrink-0"
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '999px',
            backgroundColor: data.ccColor,
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: COLORS.textLow,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          {data.month}
        </span>
      </div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: COLORS.text,
          marginBottom: '2px',
        }}
      >
        {data.ccLabel}
      </div>
      <div className="flex items-baseline" style={{ gap: '6px' }}>
        <span
          className="tabular-nums"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: COLORS.text,
            lineHeight: '22px',
          }}
        >
          {data.value}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: COLORS.textLow,
          }}
        >
          purchase orders
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * Alternative chart views — wired to the Overview dropdown
 * ════════════════════════════════════════════════════════════════ */

/**
 * Catmull-Rom-to-Bezier converter. Given an array of [x,y] points,
 * returns an SVG path string `M ... C ...` that draws a smooth curve
 * through all of them. `tension` controls how taut/loose the curve is.
 */
function smoothPath(points: Array<[number, number]>, tension = 1): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  const out: string[] = [`M ${points[0][0]} ${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) * tension) / 6;
    const c1y = p1[1] + ((p2[1] - p0[1]) * tension) / 6;
    const c2x = p2[0] - ((p3[0] - p1[0]) * tension) / 6;
    const c2y = p2[1] - ((p3[1] - p1[1]) * tension) / 6;
    out.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`);
  }
  return out.join(' ');
}

/* ── Chart: FORECAST — line chart with dashed projection ────── */
function ChartForecast({
  ccs,
  display,
  hoveredCc,
  tooltip,
  onHover,
  onTooltip,
}: ChartForecastProps) {
  /* Per-CC max-of-monthly is small (peaks ~80) so we can use a tighter scale. */
  const F_Y_MAX = 100;
  const F_Y_TICKS = [0, 25, 50, 75, 100];

  /* The forecast may be hidden entirely or trimmed to one month. The
   * column count, slot width, and X scale all derive from this so the
   * actual line stretches to fill the available width when the forecast
   * is hidden. */
  const fcMonthsVisible = display.showForecast
    ? FORECAST_MONTHS.slice(0, display.forecastMonths)
    : [];
  const fcCount = fcMonthsVisible.length;
  const totalCols = MONTHS.length + fcCount;
  const slotW = PLOT_W / totalCols;
  const xForCol = (c: number) => PAD_LEFT + slotW / 2 + c * slotW;
  const yScale = (v: number) => PLOT_H - (v / F_Y_MAX) * PLOT_H;

  /* Whether the AI-forecast detail popover is open. Local to the chart since
   * nothing outside cares whether the popover is showing. */
  const [forecastOpen, setForecastOpen] = useState(false);

  /* Position of the "AI forecast" pill in chart-wrapper coordinates.
   * The wrapper has no horizontal padding so SVG x maps 1:1 to wrapper x;
   * vertical padding-top is 12px, hence the +12 below. */
  const aiPillLeft = PAD_LEFT + Math.floor(slotW * MONTHS.length) + 3;
  const aiPillTop = 12 + PAD_TOP + 2;

  return (
    <div style={{ padding: '12px 0 20px 0', position: 'relative' }}>
      <svg
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ display: 'block' }}
        onMouseLeave={() => {
          onHover(null);
          onTooltip(null);
        }}
      >
        {/* Y grid — labels always render so the scale is readable; the
         * connecting tick lines hide when "Grid lines" is toggled off. */}
        {F_Y_TICKS.map((t) => {
          const y = PAD_TOP + yScale(t);
          return (
            <g key={`grid-${t}`}>
              {(display.showGrid || t === 0) && (
                <line
                  x1={PAD_LEFT}
                  x2={CHART_W - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke={COLORS.border}
                  strokeWidth={1}
                  strokeDasharray={t === 0 ? '0' : '2 4'}
                />
              )}
              <text
                x={Y_LABEL_X}
                y={y + 4}
                textAnchor="start"
                style={{
                  fontFamily: '"Open Sans"',
                  fontSize: '12px',
                  fontWeight: 700,
                  fill: COLORS.text,
                  letterSpacing: '0.15px',
                }}
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* Forecast band (light shaded region under the dashed projection)
         * + the violet vertical divider that separates actuals from
         * projection. Both hide together when the forecast is off. */}
        {fcCount > 0 && (
          <>
            <rect
              x={PAD_LEFT + slotW * MONTHS.length}
              y={PAD_TOP}
              width={slotW * fcCount}
              height={PLOT_H}
              fill="rgba(74, 0, 255, 0.05)"
            />
            <line
              x1={PAD_LEFT + slotW * MONTHS.length}
              x2={PAD_LEFT + slotW * MONTHS.length}
              y1={PAD_TOP}
              y2={PAD_TOP + PLOT_H}
              stroke={COLORS.aiAccent}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.45}
            />
          </>
        )}
        {/* Lines per CC */}
        {ccs.map((cc) => {
          const dim = hoveredCc !== null && hoveredCc !== cc.id;
          const actualPts: Array<[number, number]> = cc.monthly.map((v, m) => [
            xForCol(m),
            PAD_TOP + yScale(v),
          ]);
          /* Forecast points are only rendered when the forecast is
           * enabled — and only for as many months as the user picked. */
          const fcValues = FORECAST_BY_CC[cc.id].slice(0, fcCount);
          const fcPts: Array<[number, number]> = fcValues.map((v, m) => [
            xForCol(MONTHS.length + m),
            PAD_TOP + yScale(v),
          ]);
          const bridgePts =
            fcPts.length > 0
              ? [actualPts[actualPts.length - 1], ...fcPts]
              : [];

          return (
            <g
              key={cc.id}
              opacity={dim ? 0.3 : 1}
              style={{ transition: 'opacity 140ms ease' }}
              onMouseEnter={() => onHover(cc.id)}
              onMouseLeave={() => onHover(null)}
            >
              <path
                d={smoothPath(actualPts, 0.9)}
                fill="none"
                stroke={cc.color}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              {bridgePts.length > 1 && (
                <path
                  d={smoothPath(bridgePts, 0.9)}
                  fill="none"
                  stroke={cc.color}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  opacity={0.85}
                />
              )}
              {display.showDataPoints &&
                actualPts.map(([x, y], m) => (
                  <circle
                    key={`a-${m}`}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={COLORS.white}
                    stroke={cc.color}
                    strokeWidth={2}
                    onMouseEnter={() => {
                      onHover(cc.id);
                      onTooltip({
                        ccId: cc.id,
                        ccLabel: cc.label,
                        ccColor: cc.color,
                        month: MONTHS[m],
                        value: cc.monthly[m],
                        x,
                        y: PAD_TOP + yScale(cc.monthly[m]) - PAD_TOP,
                      });
                    }}
                    onMouseLeave={() => onTooltip(null)}
                  />
                ))}
              {display.showDataPoints &&
                fcPts.map(([x, y], m) => (
                  <circle
                    key={`f-${m}`}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={cc.color}
                    stroke={COLORS.white}
                    strokeWidth={1.5}
                    onMouseEnter={() => {
                      onHover(cc.id);
                      onTooltip({
                        ccId: cc.id,
                        ccLabel: cc.label,
                        ccColor: cc.color,
                        month: fcMonthsVisible[m],
                        value: fcValues[m],
                        x,
                        y: PAD_TOP + yScale(fcValues[m]) - PAD_TOP,
                      });
                    }}
                    onMouseLeave={() => onTooltip(null)}
                  />
                ))}
            </g>
          );
        })}

        {/* X labels — actual months always render; forecast labels only
         * appear for as many forecast months as the user picked. */}
        {[...MONTHS, ...fcMonthsVisible].map((mo, m) => (
          <text
            key={`xlbl-${mo}-${m}`}
            x={xForCol(m)}
            y={PAD_TOP + PLOT_H + 18}
            textAnchor="middle"
            style={{
              fontFamily: '"Open Sans"',
              fontSize: m >= MONTHS.length ? '11px' : '12px',
              fontWeight: 700,
              fill: m >= MONTHS.length ? COLORS.aiAccent : COLORS.text,
              letterSpacing: '0.15px',
            }}
          >
            {mo}
          </text>
        ))}
      </svg>

      {/* AI forecast — clickable pill that opens the detail popover. Lives in
       * the chart-wrapper coordinate space (HTML, not SVG) so we get native
       * cursor / focus / hover handling. Hidden when the forecast is
       * toggled off in the Settings card. */}
      {fcCount > 0 && (
        <button
          type="button"
          onClick={() => setForecastOpen((o) => !o)}
          title="View AI forecast details"
          aria-expanded={forecastOpen}
          style={{
            position: 'absolute',
            left: `${aiPillLeft}px`,
            top: `${aiPillTop}px`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            padding: '2px 6px',
            background: forecastOpen
              ? 'rgba(74, 0, 255, 0.12)'
              : 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: '"Open Sans", system-ui, -apple-system, sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            color: COLORS.aiAccent,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            transition: 'background 120ms ease',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            if (!forecastOpen) {
              e.currentTarget.style.backgroundColor = 'rgba(74, 0, 255, 0.06)';
            }
          }}
          onMouseLeave={(e) => {
            if (!forecastOpen) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          AI forecast
          <ModusWcIcon
            name="expand_more"
            size="xs"
            decorative
            style={{
              transform: forecastOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 120ms ease',
            }}
          />
        </button>
      )}

      {forecastOpen && fcCount > 0 && (
        <ForecastPopover
          ccs={ccs}
          anchorTop={aiPillTop + 22}
          onClose={() => setForecastOpen(false)}
        />
      )}

      {tooltip && <ChartTooltip data={tooltip} />}
    </div>
  );
}

/* ── Chart: BAR — grouped vertical bars per month per CC ────── */
interface ChartBarProps {
  ccs: CostCenter[];
  display: ChartDisplay;
  hoveredCc: CcId | null;
  tooltip: TooltipData | null;
  onHover: (id: CcId | null) => void;
  onTooltip: (data: TooltipData | null) => void;
}

function ChartBar({
  ccs,
  display,
  hoveredCc,
  tooltip,
  onHover,
  onTooltip,
}: ChartBarProps) {
  /* Same Y scale + tick marks as the forecast chart so switching
   * between styles doesn't shift the value reading. */
  const Y_MAX = 100;
  const Y_TICKS = [0, 25, 50, 75, 100];
  const fcMonthsVisible = display.showForecast
    ? FORECAST_MONTHS.slice(0, display.forecastMonths)
    : [];
  const fcCount = fcMonthsVisible.length;
  const totalCols = MONTHS.length + fcCount;
  const slotW = PLOT_W / totalCols;
  /* Bars are drawn inside each month "slot" with a small inner gutter so
   * adjacent groups don't visually collide. The number of CCs is dynamic
   * (1–4) because the dropdown filter can narrow the list. */
  const SLOT_GAP = 4;
  const usable = Math.max(slotW - SLOT_GAP, 8);
  const barW = Math.max(2, Math.floor(usable / Math.max(ccs.length, 1)) - 2);
  const yScale = (v: number) => PLOT_H - (v / Y_MAX) * PLOT_H;
  const xForCol = (c: number) => PAD_LEFT + c * slotW + SLOT_GAP / 2;

  return (
    <div style={{ padding: '12px 0 20px 0', position: 'relative' }}>
      <svg
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ display: 'block' }}
        onMouseLeave={() => {
          onHover(null);
          onTooltip(null);
        }}
      >
        {/* Y grid + value labels */}
        {Y_TICKS.map((t) => {
          const y = PAD_TOP + yScale(t);
          return (
            <g key={`grid-${t}`}>
              {(display.showGrid || t === 0) && (
                <line
                  x1={PAD_LEFT}
                  x2={CHART_W - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke={COLORS.border}
                  strokeWidth={1}
                  strokeDasharray={t === 0 ? '0' : '2 4'}
                />
              )}
              <text
                x={Y_LABEL_X}
                y={y + 4}
                textAnchor="start"
                style={{
                  fontFamily: '"Open Sans"',
                  fontSize: '12px',
                  fontWeight: 700,
                  fill: COLORS.text,
                  letterSpacing: '0.15px',
                }}
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* Forecast band — light shaded region behind the projection bars */}
        {fcCount > 0 && (
          <>
            <rect
              x={PAD_LEFT + slotW * MONTHS.length}
              y={PAD_TOP}
              width={slotW * fcCount}
              height={PLOT_H}
              fill="rgba(74, 0, 255, 0.05)"
            />
            <line
              x1={PAD_LEFT + slotW * MONTHS.length}
              x2={PAD_LEFT + slotW * MONTHS.length}
              y1={PAD_TOP}
              y2={PAD_TOP + PLOT_H}
              stroke={COLORS.aiAccent}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.45}
            />
          </>
        )}

        {/* Bars — grouped per month, one bar per CC. Forecast columns
         * use the same colors but are drawn slightly translucent so
         * the projection is visually distinct from actuals. */}
        {Array.from({ length: totalCols }).map((_, c) => {
          const isForecast = c >= MONTHS.length;
          return (
            <g key={`grp-${c}`}>
              {ccs.map((cc, i) => {
                const value = isForecast
                  ? FORECAST_BY_CC[cc.id][c - MONTHS.length] ?? 0
                  : cc.monthly[c];
                const dim = hoveredCc !== null && hoveredCc !== cc.id;
                const x = xForCol(c) + i * (barW + 2);
                const y = PAD_TOP + yScale(value);
                const h = PLOT_H - yScale(value);
                return (
                  <rect
                    key={`bar-${c}-${cc.id}`}
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx={2}
                    fill={cc.color}
                    opacity={dim ? 0.25 : isForecast ? 0.55 : 1}
                    style={{ transition: 'opacity 140ms ease' }}
                    onMouseEnter={() => {
                      onHover(cc.id);
                      onTooltip({
                        ccId: cc.id,
                        ccLabel: cc.label,
                        ccColor: cc.color,
                        month: isForecast
                          ? fcMonthsVisible[c - MONTHS.length]
                          : MONTHS[c],
                        value,
                        x: x + barW / 2,
                        y: y - PAD_TOP,
                      });
                    }}
                    onMouseLeave={() => {
                      onHover(null);
                      onTooltip(null);
                    }}
                  />
                );
              })}
            </g>
          );
        })}

        {/* X labels */}
        {[...MONTHS, ...fcMonthsVisible].map((mo, m) => (
          <text
            key={`xlbl-${mo}-${m}`}
            x={xForCol(m) + (slotW - SLOT_GAP) / 2}
            y={PAD_TOP + PLOT_H + 18}
            textAnchor="middle"
            style={{
              fontFamily: '"Open Sans"',
              fontSize: m >= MONTHS.length ? '11px' : '12px',
              fontWeight: 700,
              fill: m >= MONTHS.length ? COLORS.aiAccent : COLORS.text,
              letterSpacing: '0.15px',
            }}
          >
            {mo}
          </text>
        ))}
      </svg>

      {tooltip && <ChartTooltip data={tooltip} />}
    </div>
  );
}

/* ── Chart: DONUT — share of grand total per cost center ────── */
interface ChartDonutProps {
  ccs: CostCenter[];
  totals: number[];
  grandTotal: number;
  hoveredCc: CcId | null;
  onHover: (id: CcId | null) => void;
}

function ChartDonut({
  ccs,
  totals,
  grandTotal,
  hoveredCc,
  onHover,
}: ChartDonutProps) {
  /* Geometry — donut sits centered in the chart canvas. Outer / inner radii
   * are picked so the ring reads at the same visual weight as the line
   * and bar charts at the current chart height (380 px). */
  const cx = CHART_W / 2;
  const cy = PAD_TOP + PLOT_H / 2;
  const R_OUTER = 140;
  const R_INNER = 90;
  /* Hovered slice expands outward 6px so it pops without breaking layout. */
  const HOVER_LIFT = 6;

  /* Build slice descriptors with cumulative angles. We start at -90deg
   * (12 o'clock) and walk clockwise. Empty totals collapse to a 0-angle
   * slice that's safely skipped during render. */
  let cursor = -Math.PI / 2;
  const slices = ccs.map((cc, i) => {
    const value = totals[i] ?? 0;
    const fraction = grandTotal > 0 ? value / grandTotal : 0;
    const angle = fraction * Math.PI * 2;
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    return { cc, value, fraction, start, end };
  });

  /**
   * Build an SVG donut-slice path. We use a thick ring (outer arc → line in
   * → reversed inner arc → close) so each slice is a real shape, not a
   * stroked arc — that way `fill` recolors them and hover lift is trivial.
   */
  function slicePath(
    start: number,
    end: number,
    rOuter: number,
    rInner: number,
  ): string {
    const sweep = end - start;
    const large = sweep > Math.PI ? 1 : 0;
    const x1 = cx + rOuter * Math.cos(start);
    const y1 = cy + rOuter * Math.sin(start);
    const x2 = cx + rOuter * Math.cos(end);
    const y2 = cy + rOuter * Math.sin(end);
    const x3 = cx + rInner * Math.cos(end);
    const y3 = cy + rInner * Math.sin(end);
    const x4 = cx + rInner * Math.cos(start);
    const y4 = cy + rInner * Math.sin(start);
    return [
      `M ${x1} ${y1}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');
  }

  return (
    <div style={{ padding: '12px 0 20px 0', position: 'relative' }}>
      <svg
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ display: 'block' }}
        onMouseLeave={() => onHover(null)}
      >
        {/* Slices */}
        {slices.map(({ cc, fraction, start, end }) => {
          if (fraction <= 0) return null;
          const dim = hoveredCc !== null && hoveredCc !== cc.id;
          const lifted = hoveredCc === cc.id;
          return (
            <path
              key={cc.id}
              d={slicePath(
                start,
                end,
                lifted ? R_OUTER + HOVER_LIFT : R_OUTER,
                R_INNER,
              )}
              fill={cc.color}
              opacity={dim ? 0.3 : 1}
              style={{
                transition:
                  'opacity 140ms ease, d 140ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => onHover(cc.id)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })}

        {/* Center label — total or hovered share */}
        {(() => {
          const hovered = slices.find((s) => s.cc.id === hoveredCc);
          if (hovered && hovered.fraction > 0) {
            const pct = Math.round(hovered.fraction * 100);
            return (
              <g>
                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  style={{
                    fontFamily: '"Open Sans"',
                    fontSize: '12px',
                    fontWeight: 700,
                    fill: COLORS.textLow,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {hovered.cc.label}
                </text>
                <text
                  x={cx}
                  y={cy + 18}
                  textAnchor="middle"
                  style={{
                    fontFamily: '"Open Sans"',
                    fontSize: '28px',
                    fontWeight: 700,
                    fill: hovered.cc.color,
                  }}
                >
                  {pct}%
                </text>
                <text
                  x={cx}
                  y={cy + 36}
                  textAnchor="middle"
                  style={{
                    fontFamily: '"Open Sans"',
                    fontSize: '12px',
                    fontWeight: 600,
                    fill: COLORS.textLow,
                  }}
                >
                  {hovered.value} POs
                </text>
              </g>
            );
          }
          return (
            <g>
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                style={{
                  fontFamily: '"Open Sans"',
                  fontSize: '12px',
                  fontWeight: 700,
                  fill: COLORS.textLow,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                Total
              </text>
              <text
                x={cx}
                y={cy + 22}
                textAnchor="middle"
                style={{
                  fontFamily: '"Open Sans"',
                  fontSize: '32px',
                  fontWeight: 700,
                  fill: COLORS.text,
                }}
              >
                {grandTotal}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

/* ── AI Forecast popover ────────────────────────────────────── */
interface ForecastPopoverProps {
  ccs: CostCenter[];
  anchorTop: number;
  onClose: () => void;
}

function ForecastPopover({ ccs, anchorTop, onClose }: ForecastPopoverProps) {
  /* Per-cost-center totals across the forecast horizon, plus the grand
   * projected total used in the popover footer. */
  const ccForecasts = ccs.map((cc) => ({
    ...cc,
    monthly: FORECAST_BY_CC[cc.id],
    total: FORECAST_BY_CC[cc.id].reduce((a, b) => a + b, 0),
  }));
  const grandProjected = ccForecasts.reduce((sum, cc) => sum + cc.total, 0);

  return (
    <div
      role="dialog"
      aria-label="AI forecast details"
      style={{
        position: 'absolute',
        top: `${anchorTop}px`,
        right: '24px',
        width: '280px',
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        boxShadow:
          '0 1px 3px rgba(15,23,42,0.08), 0 12px 32px rgba(15,23,42,0.14)',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between"
        style={{
          padding: '12px 14px',
          borderBottom: `1px solid ${COLORS.border}`,
          gap: '8px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: COLORS.aiAccent,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
            }}
          >
            AI Forecast
          </div>
          <div
            style={{
              fontSize: '12px',
              color: COLORS.textMid,
              marginTop: '2px',
              lineHeight: '16px',
            }}
          >
            Projected {FORECAST_MONTHS.join(' & ')} · {FORECAST_CONFIDENCE}%
            confidence
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close forecast details"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: '24px',
            height: '24px',
            background: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: COLORS.textLow,
            transition: 'background 120ms ease',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = COLORS.bgLight)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <ModusWcIcon name="close" size="xs" decorative />
        </button>
      </div>

      {/* Per-cost-center breakdown */}
      <div style={{ padding: '6px 14px' }}>
        {ccForecasts.map((cc) => (
          <div
            key={cc.id}
            className="flex items-center justify-between"
            style={{ padding: '6px 0', gap: '12px' }}
          >
            <div className="flex items-center" style={{ gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  backgroundColor: cc.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  color: COLORS.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cc.label}
              </span>
            </div>
            <span
              className="tabular-nums"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: COLORS.text,
                flexShrink: 0,
              }}
            >
              +{cc.total}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '10px 14px',
          borderTop: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.bgLight,
        }}
      >
        <span
          style={{ fontSize: '13px', fontWeight: 700, color: COLORS.text }}
        >
          Total projected
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: COLORS.aiAccent,
          }}
        >
          +{grandProjected}
        </span>
      </div>
    </div>
  );
}

/* ── AI Edit prompt ─────────────────────────────────────────── */
/* Same shape as the Creative 1 footer prompt bar — a 560 px Photoshop-
 * style floating pill with the Modus text input on the left and the
 * Send button on the right. Always visible (no collapsed state); the
 * Edit / Save cluster from Creative 1 is intentionally omitted because
 * Creative 2's whole premise is "modified with prompt only".
 *
 * Each submission calls `onSubmit` with the raw prompt text; the
 * parent applies the change directly on top of the widget's current
 * state, so every iteration builds on the last one. A "Try this
 * prompt" chip sits below the bar before the first submission to make
 * the colour-differentiation demo path obvious. */
interface AiEditPromptProps {
  widgetWidth: number;
  suggestion: string;
  onSubmit: (prompt: string) => void;
}

function AiEditPrompt({
  widgetWidth,
  suggestion,
  onSubmit,
}: AiEditPromptProps) {
  const [text, setText] = useState('');
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const isPromptEmpty = text.trim().length === 0;

  function handleSubmit(p?: string) {
    const v = (p ?? text).trim();
    if (!v) return;
    onSubmit(v);
    setSubmittedOnce(true);
    setText('');
  }

  return (
    <div
      className="flex flex-col items-center"
      style={{ gap: '10px', width: `${widgetWidth}px` }}
    >
      {/* Photoshop-style floating prompt pill — copied from the
       * Creative 1 footer. Modus base-200 border, base-page fill,
       * 12 px radius and a soft drop shadow so it reads as a
       * floating contextual surface. Enter submits. */}
      <div
        className="flex items-center"
        style={{
          height: '48px',
          width: '560px',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderRadius: '12px',
          padding: '4px 8px 4px 4px',
          gap: '4px',
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          boxShadow:
            '0 1px 2px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.10)',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
      >
        {/* Modus text input, flush inside the pill */}
        <div
          className="prompt-bar-input flex-1 min-w-0"
          style={{
            display: 'flex',
            background: 'transparent',
            paddingLeft: '4px',
          }}
        >
          <ModusWcTextInput
            size="sm"
            placeholder="Ask AI to refine this widget..."
            bordered={false}
            value={text}
            onInputChange={(e: CustomEvent) => {
              const v =
                (
                  e as unknown as {
                    detail?: { target?: { value?: string } };
                  }
                ).detail?.target?.value ?? '';
              setText(v);
            }}
            style={{
              flex: 1,
              width: '100%',
              display: 'block',
              background: 'transparent',
            }}
          />
        </div>

        {/* Send (Enter) — circular icon button, same asset as the rest
         * of the AI surfaces in the app. Disabled state stays the same
         * shape so the pill never reflows. */}
        <button
          type="button"
          aria-label="Send prompt"
          onClick={() => handleSubmit()}
          disabled={isPromptEmpty}
          style={{
            width: '38px',
            height: '38px',
            padding: 0,
            background: 'transparent',
            border: 'none',
            borderRadius: '999px',
            cursor: isPromptEmpty ? 'default' : 'pointer',
            opacity: isPromptEmpty ? 0.45 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'opacity 120ms ease',
          }}
        >
          <img
            src="/assets/prompt-send.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              width: '36px',
              height: '34px',
              display: 'block',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </button>
      </div>

      {/* Try-this suggestion — only shown until the user submits
       * something. Click *populates* the prompt bar with the
       * suggestion text instead of submitting; the user still has
       * to hit Send (or Enter) so the demo prompt feels typed. */}
      {!submittedOnce && (
        <button
          type="button"
          onClick={() => setText(suggestion)}
          className="inline-flex items-center"
          style={{
            gap: '8px',
            padding: '6px 12px',
            border: `1px dashed ${COLORS.border}`,
            borderRadius: '999px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '12px',
            color: COLORS.textMid,
            letterSpacing: '0.15px',
            transition:
              'background-color 120ms ease, border-color 120ms ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.backgroundColor = COLORS.bgLight;
            el.style.borderColor = '#c8cad5';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.backgroundColor = 'transparent';
            el.style.borderColor = COLORS.border;
          }}
        >
          <ModusWcIcon
            name="lightbulb"
            size="xs"
            decorative
            style={{ color: COLORS.aiAccent }}
          />
          <span>
            Try:{' '}
            <span style={{ color: COLORS.text, fontWeight: 600 }}>
              {suggestion}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

