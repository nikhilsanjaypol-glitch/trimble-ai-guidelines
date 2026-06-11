import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';

/* ── Guideline ─── ALLOW EDITABLE OUTPUTS ──────────────────────
 * To allow professionals to continue where AI has left off.
 * The AI output must be more than just a picture or inspiration.
 * It should be directly editable and manipulable (text, graphics,
 * components), delivered in a format that integrates seamlessly
 * into the user's existing workflow and familiar tools.
 *
 * Scenario — widget creation with a settings card:
 *   1. The user prompts Trimble AI in the dashboard's AI Builder.
 *   2. The AI returns a "Purchases by Cost Center" widget that
 *      visually matches the Trimble Modus widget pattern at Figma
 *      node 609:10551.
 *   3. To continue where the AI left off, the professional opens
 *      the SETTINGS CARD that sits alongside the widget. From there
 *      they can rewrite the title, rename each cost center, and
 *      retune each cost-center total. Every change updates the
 *      widget instantly. Save commits, Cancel reverts.
 *
 *   The settings-card-alongside-widget pattern matches the reference
 *   image first shared for this guideline.
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

/* ── Chart display options (editable from the Settings card) ──── */
type PaletteId = 'blue' | 'sunset' | 'forest' | 'mono';

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
  blue:   [COLORS.ccBlue, COLORS.ccNavy, COLORS.ccSky,  COLORS.ccTeal],
  sunset: ['#d97706',     '#b91c1c',     '#7c2d12',     '#f59e0b'],
  forest: ['#15803d',     '#166534',     '#65a30d',     '#0f766e'],
  mono:   ['#252a2e',     '#464b52',     '#6a6e79',     '#a8acb8'],
};

const INITIAL_DISPLAY: ChartDisplay = {
  chartType: 'forecast',
  showForecast: true,
  showDataPoints: true,
  showGrid: true,
  forecastMonths: 2,
  palette: 'blue',
};

/* Available views — match the Figma dropdown (Overview + each cost center). */
type ViewId = 'overview' | CcId;


/* ── Chart geometry ─────────────────────────────────────────── */
/* The chart SVG spans the full 880 px widget width (landscape 16∶9-ish).
 * The 24 px Header / SummaryStrip gutter is reproduced *inside* the SVG:
 *   • Y-axis tick labels are LEFT-aligned at SVG x = 24, so their
 *     left edge lines up with "Total Purchase Orders" above.
 *   • PAD_LEFT = 52 — leaves room (24 + ~22px for "100" + 6 padding)
 *     before the plot starts so labels never collide with grid lines.
 *   • PAD_RIGHT = 24 — plot right-edge lands at widget x = 856, the
 *     same column where the legend's "500" / "450" totals end.
 * All three rows of widget content thus line up at the same left and
 * right margin. */
const CHART_W = 880;
const CHART_H = 280;
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
export default function Creative1() {
  /* AI's output state — what the widget shows */
  const [title, setTitle] = useState(INITIAL_TITLE);
  const [ccs, setCcs] = useState<CostCenter[]>(INITIAL_CCS);
  const [display, setDisplay] = useState<ChartDisplay>(INITIAL_DISPLAY);

  /* Editing state — the settings card and its draft */
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<{
    title: string;
    ccs: CostCenter[];
    display: ChartDisplay;
  } | null>(null);

  const [prompt] = useState(
    'Create a widget showing purchases by cost center across 12 month',
  );

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

  /* What the widget renders — the draft when editing, otherwise the saved value */
  const visibleTitle = draft ? draft.title : title;
  const visibleCcs = draft ? draft.ccs : ccs;
  const visibleDisplay = draft ? draft.display : display;

  /* Per-CC totals (un-filtered — the settings card always shows all 4
   * cost centers regardless of the dropdown filter, so this reads from
   * `visibleCcs`, not the focused subset below). */
  const totals = useMemo(
    () => visibleCcs.map((cc) => cc.monthly.reduce((a, b) => a + b, 0)),
    [visibleCcs],
  );

  /* When the dropdown is on a single cost center, filter the cost-center
   * list down to just that one. The legend, the headline total, and the
   * forecast widget all derive from this filtered list. */
  const focusedCcs = useMemo(
    () => (view === 'overview' ? visibleCcs : visibleCcs.filter((c) => c.id === view)),
    [view, visibleCcs],
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

  /* ── Open / close edit mode ─────────────────────────────── */
  function openEdit() {
    setDraft({ title, ccs, display });
    setEditMode(true);
  }

  function cancelEdit() {
    setDraft(null);
    setEditMode(false);
  }

  function saveEdit() {
    if (draft) {
      setTitle(draft.title);
      setCcs(draft.ccs);
      setDisplay(draft.display);
    }
    setDraft(null);
    setEditMode(false);
  }

  /* ── Settings-card change handlers (write into draft) ───── */
  function setDraftTitle(next: string) {
    setDraft((d) => (d ? { ...d, title: next } : d));
  }

  function setDraftCcLabel(id: CcId, next: string) {
    setDraft((d) =>
      d
        ? {
            ...d,
            ccs: d.ccs.map((cc) =>
              cc.id === id ? { ...cc, label: next } : cc,
            ),
          }
        : d,
    );
  }

  /**
   * Editing a CC total scales its monthly array proportionally so the
   * chart shape is preserved while heights rescale.
   */
  function setDraftCcTotal(id: CcId, nextTotal: number) {
    if (!Number.isFinite(nextTotal) || nextTotal < 0) return;
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        ccs: d.ccs.map((cc) => {
          if (cc.id !== id) return cc;
          const prevTotal = cc.monthly.reduce((a, b) => a + b, 0);
          if (prevTotal === 0) {
            return { ...cc, monthly: cc.monthly.map(() => nextTotal / 12) };
          }
          const scale = nextTotal / prevTotal;
          return {
            ...cc,
            monthly: cc.monthly.map((v) => Math.round(v * scale)),
          };
        }),
      };
    });
  }

  /* Patch the draft's display options (toggle / horizon / etc). */
  function setDraftDisplay(patch: Partial<ChartDisplay>) {
    setDraft((d) =>
      d ? { ...d, display: { ...d.display, ...patch } } : d,
    );
  }

  /**
   * Switching palette overwrites the CC colors (in the draft only —
   * it commits on Save). The palette id is also stored so the
   * Settings card knows which swatch to mark active.
   */
  function setDraftPalette(palette: PaletteId) {
    setDraft((d) => {
      if (!d) return d;
      const colors = PALETTES[palette];
      return {
        ...d,
        display: { ...d.display, palette },
        ccs: d.ccs.map((cc, i) => ({ ...cc, color: colors[i] ?? cc.color })),
      };
    });
  }

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
       * shimmers in the same cadence. Scoped via a unique animation
       * name so it can't clash with anything else. */}
      <style>{`
        @keyframes creative1RainbowShimmer {
          0%   { background-position: 0% 50%, 0% 50%; }
          50%  { background-position: 0% 50%, 100% 50%; }
          100% { background-position: 0% 50%, 0% 50%; }
        }
      `}</style>

      <UserPromptBubble prompt={prompt} />
      <AiAgentIntro />

      <div style={{ marginTop: '10px' }}>
        <div style={{ position: 'relative', width: '880px' }}>
          {/* AI's output — always read-only. The dual-gradient ring uses
           * the same technique as the Creative 3 prompt bar; the rainbow
           * layer is sized 200 % wide and slowly shifted by the
           * `creative1RainbowShimmer` keyframes so the border glitters,
           * marking the widget visually as a live AI artifact. */}
          <div
            style={{
              width: '880px',
              boxSizing: 'border-box',
              border: '2px solid transparent',
              /* Matches the Modus button corner radius (--modus-wc-rounded-btn,
               * 0.5rem) so the widget and the Edit / Save buttons share the
               * same silhouette. */
              borderRadius: '8px',
              backgroundImage:
                `linear-gradient(${COLORS.white}, ${COLORS.white}), ` +
                'linear-gradient(90deg, #00d7c0 0%, #0094f0 35%, #b73efa 68%, #ff5a8c 100%)',
              /* White layer: 100 % covers the padding-box exactly.
               * Rainbow layer: 200 % wide so the keyframes can scroll it
               * across the border-box without revealing seams. */
              backgroundSize: '100% 100%, 200% 100%',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              animation: 'creative1RainbowShimmer 3.6s ease-in-out infinite',
              boxShadow: editMode
                ? '0 0 0 2px rgba(74,0,255,0.18), 0 8px 28px rgba(15,23,42,0.06)'
                : '0 1px 3px rgba(15,23,42,0.08), 0 8px 28px rgba(15,23,42,0.06)',
              overflow: 'hidden',
              transition: 'box-shadow 160ms ease',
              /* Treat the widget surface as a non-text artifact: every static
               * label / number shows the standard arrow cursor and can't be
               * dragged-to-select. Interactive parts (dropdown trigger, menu
               * items) explicitly opt back into `cursor: pointer`. */
              cursor: 'default',
              userSelect: 'none',
            }}
          >
          <Header
            title={visibleTitle}
            view={view}
            onViewChange={changeView}
          />
          <SummaryStrip
            ccs={focusedCcs}
            totals={focusedTotals}
            grandTotal={focusedGrandTotal}
            hoveredCc={hoveredCc}
            onHover={setHoveredCc}
          />
          {visibleDisplay.chartType === 'forecast' && (
            <ChartForecast
              ccs={focusedCcs}
              display={visibleDisplay}
              hoveredCc={hoveredCc}
              tooltip={tooltip}
              onHover={setHoveredCc}
              onTooltip={setTooltip}
            />
          )}
          {visibleDisplay.chartType === 'bar' && (
            <ChartBar
              ccs={focusedCcs}
              display={visibleDisplay}
              hoveredCc={hoveredCc}
              tooltip={tooltip}
              onHover={setHoveredCc}
              onTooltip={setTooltip}
            />
          )}
          {visibleDisplay.chartType === 'donut' && (
            <ChartDonut
              ccs={focusedCcs}
              totals={focusedTotals}
              grandTotal={focusedGrandTotal}
              hoveredCc={hoveredCc}
              onHover={setHoveredCc}
            />
          )}
          </div>

          {/* Settings card — overlays the widget while editing */}
          {editMode && draft && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
              }}
            >
              <SettingsCard
                title={draft.title}
                ccs={draft.ccs}
                totals={totals}
                display={draft.display}
                onChangeTitle={setDraftTitle}
                onChangeCcLabel={setDraftCcLabel}
                onChangeCcTotal={setDraftCcTotal}
                onChangeDisplay={setDraftDisplay}
                onChangePalette={setDraftPalette}
              />
            </div>
          )}
        </div>
      </div>

      <FooterActions
        editMode={editMode}
        widgetWidth={880}
        onEdit={openEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
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
  return (
    <div
      style={{
        height: '90px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '40px',
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex items-baseline" style={{ gap: '12px', flexShrink: 0 }}>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: COLORS.textMid,
            lineHeight: '28px',
            letterSpacing: '0.027px',
          }}
        >
          Total Purchase Orders
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: '20px',
            fontWeight: 400,
            color: COLORS.textMid,
            lineHeight: '28px',
            letterSpacing: '0.03px',
            transition: 'color 120ms ease',
          }}
        >
          {grandTotal}
        </span>
      </div>

      <div
        className="grid grid-cols-2 flex-1"
        style={{ gap: '4px 24px', rowGap: '4px' }}
      >
        {ccs.map((cc, i) => {
          const isHovered = hoveredCc === cc.id;
          const isOtherHovered = hoveredCc !== null && hoveredCc !== cc.id;
          const opacity = isOtherHovered ? 0.55 : 1;

          return (
            <div
              key={cc.id}
              onMouseEnter={() => onHover(cc.id)}
              onMouseLeave={() => onHover(null)}
              className="flex items-center text-left"
              style={{
                /* Size each chip to the actual text width so the hover
                 * rectangle covers the full label, not just the grid cell. */
                width: 'max-content',
                justifySelf: 'start',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 700,
                color: COLORS.blue,
                lineHeight: '21px',
                letterSpacing: '0.15px',
                whiteSpace: 'nowrap',
                padding: '4px 6px',
                margin: '-4px -6px',
                borderRadius: '4px',
                opacity,
                transition: 'opacity 120ms ease, background-color 120ms ease',
                backgroundColor: isHovered
                  ? 'rgba(0, 99, 163, 0.06)'
                  : 'transparent',
              }}
            >
              <span
                className="block shrink-0"
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '999px',
                  backgroundColor: cc.color,
                  border: `2px solid ${cc.color}`,
                  boxSizing: 'border-box',
                }}
              />
              <span>{cc.label}</span>
              <span>-</span>
              <span className="tabular-nums">{totals[i]}</span>
            </div>
          );
        })}
      </div>
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
   * and bar charts. */
  const cx = CHART_W / 2;
  const cy = PAD_TOP + PLOT_H / 2;
  const R_OUTER = 110;
  const R_INNER = 70;
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

/* ── Settings card (the editing surface) ────────────────────── */
interface SettingsCardProps {
  title: string;
  ccs: CostCenter[];
  totals: number[];
  display: ChartDisplay;
  onChangeTitle: (v: string) => void;
  onChangeCcLabel: (id: CcId, v: string) => void;
  onChangeCcTotal: (id: CcId, v: number) => void;
  onChangeDisplay: (patch: Partial<ChartDisplay>) => void;
  onChangePalette: (palette: PaletteId) => void;
}

function SettingsCard({
  title,
  ccs,
  totals,
  display,
  onChangeTitle,
  onChangeCcLabel,
  onChangeCcTotal,
  onChangeDisplay,
  onChangePalette,
}: SettingsCardProps) {
  /* Widget height = 72 (Header) + 90 (SummaryStrip) + 312 (Chart pad + svg) = 474px
   * (landscape — the widget's 880 px width gives it a ~1.86∶1 ratio).
   * The card overlays the right side of the widget, flush with the
   * widget's top/right/bottom edges. A directional shadow on the left
   * edge reads as a panel slid in from the right. */
  return (
    <aside
      style={{
        width: '300px',
        height: '100%',
        backgroundColor: COLORS.white,
        /* Match the widget's right corner (8px) but keep the left side
         * straight so the card reads as a flush panel, not a floating popover. */
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
        borderLeft: `1px solid ${COLORS.border}`,
        boxShadow:
          '-12px 0 28px rgba(15,23,42,0.10), -2px 0 6px rgba(15,23,42,0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center shrink-0"
        style={{
          height: '52px',
          padding: '0 16px',
          gap: '8px',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <ModusWcIcon
          name="settings"
          size="md"
          decorative
          style={{ color: COLORS.textLow, fontSize: '20px' }}
        />
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: COLORS.text,
            lineHeight: '20px',
            letterSpacing: '0.15px',
          }}
        >
          Edit widget
        </span>
      </div>

      {/* Body — scrolls when the form overflows the widget height */}
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* ── Chart type ──────────────────────────────────── */}
        <SettingsField label="Chart type">
          <ChartTypePicker
            value={display.chartType}
            onChange={(t) => onChangeDisplay({ chartType: t })}
          />
        </SettingsField>

        {/* ── General ─────────────────────────────────────── */}
        <SettingsField label="Widget title">
          <ModusWcTextInput
            value={title}
            size="sm"
            onInputChange={(e: CustomEvent) => {
              const v = e.detail?.target?.value ?? '';
              onChangeTitle(v);
            }}
          />
        </SettingsField>

        {/* ── Cost centers ────────────────────────────────── */}
        <SettingsSectionHeader>Cost centers</SettingsSectionHeader>
        <div className="flex flex-col" style={{ gap: '8px' }}>
          {ccs.map((cc, i) => (
            <CcEditRow
              key={cc.id}
              cc={cc}
              total={totals[i]}
              onChangeLabel={(v) => onChangeCcLabel(cc.id, v)}
              onChangeTotal={(v) => onChangeCcTotal(cc.id, v)}
            />
          ))}
        </div>

        {/* ── Chart display ─ toggles relevant to the active chart type
         *      only. The donut has no time axis, so all three toggles
         *      hide and the section disappears entirely. */}
        {display.chartType !== 'donut' && (
          <>
            <SettingsSectionHeader>Chart display</SettingsSectionHeader>
            <div className="flex flex-col" style={{ gap: '6px' }}>
              <ToggleRow
                label="AI forecast"
                description="Show the dashed projection band"
                checked={display.showForecast}
                onChange={(v) => onChangeDisplay({ showForecast: v })}
              />
              {display.chartType === 'forecast' && (
                <ToggleRow
                  label="Data points"
                  description="Circles at every monthly value"
                  checked={display.showDataPoints}
                  onChange={(v) => onChangeDisplay({ showDataPoints: v })}
                />
              )}
              <ToggleRow
                label="Grid lines"
                description="Dashed Y-axis tick guides"
                checked={display.showGrid}
                onChange={(v) => onChangeDisplay({ showGrid: v })}
              />
            </div>

            {/* Forecast horizon — only meaningful when forecast is on
             *  AND the chart actually plots a time axis. */}
            <SettingsSectionHeader>Forecast</SettingsSectionHeader>
            <SettingsField label="Horizon">
              <SegmentSelect
                value={display.forecastMonths}
                options={[
                  { value: 1, label: '1 month' },
                  { value: 2, label: '2 months' },
                ]}
                disabled={!display.showForecast}
                onChange={(v) => onChangeDisplay({ forecastMonths: v })}
              />
            </SettingsField>
          </>
        )}

        {/* ── Color theme ─────────────────────────────────── */}
        <SettingsSectionHeader>Color theme</SettingsSectionHeader>
        <PaletteSwatches
          value={display.palette}
          onChange={onChangePalette}
        />
      </div>
    </aside>
  );
}

/* ── Settings card: section header (uppercase, with top divider) ──── */
function SettingsSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="uppercase"
      style={{
        fontSize: '10px',
        fontWeight: 700,
        color: COLORS.textLow,
        letterSpacing: '0.4px',
        paddingTop: '8px',
        borderTop: `1px solid ${COLORS.border}`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Settings card: single field row ────────────────────────── */
function SettingsField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className="flex flex-col"
      style={{ gap: '4px' }}
    >
      <span
        className="uppercase"
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: COLORS.textLow,
          letterSpacing: '0.4px',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/* ── Settings card: compact cost-center row ─────────────────── */
interface CcEditRowProps {
  cc: CostCenter;
  total: number;
  onChangeLabel: (v: string) => void;
  onChangeTotal: (v: number) => void;
}

function CcEditRow({
  cc,
  total,
  onChangeLabel,
  onChangeTotal,
}: CcEditRowProps) {
  return (
    <div className="flex items-center" style={{ gap: '8px' }}>
      <span
        className="block rounded-full shrink-0"
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: cc.color,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <ModusWcTextInput
          value={cc.label}
          size="sm"
          onInputChange={(e: CustomEvent) => {
            const v = e.detail?.target?.value ?? '';
            onChangeLabel(v);
          }}
        />
      </div>
      <div style={{ width: '64px', flexShrink: 0 }}>
        <ModusWcTextInput
          value={String(total)}
          size="sm"
          type="number"
          onInputChange={(e: CustomEvent) => {
            const v = e.detail?.target?.value ?? '';
            const n = parseFloat(v);
            if (Number.isFinite(n) && n >= 0) onChangeTotal(n);
          }}
        />
      </div>
    </div>
  );
}

/* ── Settings card: row with label/description on the left and a
 *      pill-shaped toggle on the right. Uses a styled native button
 *      (Modus has no Switch primitive used elsewhere in this app) so
 *      the keyboard / focus story stays standard. ────────────────── */
interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: '12px',
        padding: '4px 0',
      }}
    >
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: COLORS.text,
            lineHeight: '18px',
          }}
        >
          {label}
        </span>
        {description && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: COLORS.textLow,
              lineHeight: '14px',
              marginTop: '1px',
            }}
          >
            {description}
          </span>
        )}
      </div>

      {/* Track */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          flexShrink: 0,
          width: '32px',
          height: '18px',
          borderRadius: '999px',
          border: 'none',
          padding: 0,
          backgroundColor: checked ? COLORS.aiAccent : COLORS.border,
          cursor: 'pointer',
          position: 'relative',
          transition: 'background-color 140ms ease',
          outline: 'none',
        }}
      >
        {/* Thumb */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '16px' : '2px',
            width: '14px',
            height: '14px',
            borderRadius: '999px',
            backgroundColor: COLORS.white,
            boxShadow: '0 1px 2px rgba(15,23,42,0.18)',
            transition: 'left 140ms ease',
          }}
        />
      </button>
    </div>
  );
}

/* ── Settings card: small segmented selector (e.g. "1 month" / "2 months").
 *      Renders as side-by-side pill buttons with one active. ────── */
interface SegmentSelectProps<T extends string | number> {
  value: T;
  options: Array<{ value: T; label: string }>;
  disabled?: boolean;
  onChange: (next: T) => void;
}

function SegmentSelect<T extends string | number>({
  value,
  options,
  disabled,
  onChange,
}: SegmentSelectProps<T>) {
  return (
    <div
      role="radiogroup"
      style={{
        display: 'inline-flex',
        padding: '2px',
        gap: '2px',
        borderRadius: '8px',
        backgroundColor: COLORS.bgLight,
        border: `1px solid ${COLORS.border}`,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        width: 'max-content',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: active ? COLORS.white : 'transparent',
              boxShadow: active
                ? '0 1px 2px rgba(15,23,42,0.08)'
                : 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: active ? COLORS.text : COLORS.textLow,
              cursor: 'pointer',
              transition:
                'background-color 120ms ease, color 120ms ease',
              fontFamily: 'inherit',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Settings card: chart-type picker. Three icon tiles laid out in a
 *      row; selecting one switches which chart visualization is rendered
 *      in the widget. The icon glyphs are inline SVG so they pick up
 *      `currentColor` for the active / inactive states. ──────────── */
interface ChartTypePickerProps {
  value: ChartType;
  onChange: (next: ChartType) => void;
}

function ChartTypePicker({ value, onChange }: ChartTypePickerProps) {
  const options: Array<{
    id: ChartType;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'forecast',
      label: 'Line',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M3 16 L7 10 L11 13 L15 6 L19 9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="3" cy="16" r="1.4" fill="currentColor" />
          <circle cx="7" cy="10" r="1.4" fill="currentColor" />
          <circle cx="11" cy="13" r="1.4" fill="currentColor" />
          <circle cx="15" cy="6"  r="1.4" fill="currentColor" />
          <circle cx="19" cy="9"  r="1.4" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'bar',
      label: 'Bars',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3"  y="11" width="3" height="7"  rx="1" fill="currentColor" />
          <rect x="8"  y="7"  width="3" height="11" rx="1" fill="currentColor" />
          <rect x="13" y="9"  width="3" height="9"  rx="1" fill="currentColor" />
          <rect x="18" y="5"  width="3" height="13" rx="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'donut',
      label: 'Donut',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 2 a9 9 0 1 1 -6.36 15.36"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M11 2 a9 9 0 0 1 8.55 11.66"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.4"
            fill="none"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      role="radiogroup"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '6px',
      }}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              borderRadius: '8px',
              border: `1px solid ${active ? COLORS.aiAccent : COLORS.border}`,
              backgroundColor: active
                ? 'rgba(74, 0, 255, 0.06)'
                : COLORS.white,
              color: active ? COLORS.aiAccent : COLORS.textLow,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition:
                'border-color 120ms ease, background-color 120ms ease, color 120ms ease',
            }}
          >
            {opt.icon}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: active ? COLORS.text : COLORS.textLow,
                letterSpacing: '0.15px',
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Settings card: palette swatches. Each row = a 4-color preview.
 *      Selecting a row recolors all four cost centers. ──────────── */
interface PaletteSwatchesProps {
  value: PaletteId;
  onChange: (next: PaletteId) => void;
}

function PaletteSwatches({ value, onChange }: PaletteSwatchesProps) {
  const labels: Array<{ id: PaletteId; label: string }> = [
    { id: 'blue',   label: 'Trimble' },
    { id: 'sunset', label: 'Sunset' },
    { id: 'forest', label: 'Forest' },
    { id: 'mono',   label: 'Mono' },
  ];

  return (
    <div className="flex flex-col" style={{ gap: '6px' }}>
      {labels.map(({ id, label }) => {
        const colors = PALETTES[id];
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: '6px',
              border: `1px solid ${active ? COLORS.aiAccent : COLORS.border}`,
              backgroundColor: active ? 'rgba(74, 0, 255, 0.04)' : COLORS.white,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition:
                'border-color 120ms ease, background-color 120ms ease',
            }}
          >
            {/* Color preview — 4 stacked tiles in a row */}
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 0 0 1px rgba(15,23,42,0.06) inset',
              }}
            >
              {colors.map((c, i) => (
                <span
                  key={i}
                  style={{
                    width: '14px',
                    height: '14px',
                    backgroundColor: c,
                  }}
                />
              ))}
            </span>
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 600,
                color: COLORS.text,
              }}
            >
              {label}
            </span>
            {active && (
              <ModusWcIcon
                name="check"
                size="sm"
                decorative
                style={{ color: COLORS.aiAccent, fontSize: '14px' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── User prompt bubble (right-aligned chat message) ────────── */
interface UserPromptBubbleProps {
  prompt: string;
}

function UserPromptBubble({ prompt }: UserPromptBubbleProps) {
  return (
    <div
      className="flex flex-col items-end"
      style={{ gap: '6px', padding: '0 4px' }}
    >
      <div
        style={{
          maxWidth: '520px',
          backgroundColor: COLORS.bgLight,
          /* TL, TR, BR (squared — points toward the speaker), BL */
          borderRadius: '18px 18px 0 18px',
          padding: '10px 16px',
          fontSize: '14px',
          lineHeight: '20px',
          color: COLORS.text,
          letterSpacing: '0.15px',
        }}
      >
        {prompt}
      </div>
      <span
        style={{
          fontSize: '11px',
          color: COLORS.textLow,
          letterSpacing: '0.15px',
          paddingRight: '8px',
        }}
      >
        Delivered
      </span>
    </div>
  );
}

/* ── AI agent intro ─────────────────────────────────────────── */
/* Trimble-AI logo is 80×56 natural. Rendering at 40 px tall keeps the
 * source aspect ratio (40 × 80/56 ≈ 57 px wide) so the brand mark stays
 * pixel-crisp without distortion. */
const AI_LOGO_HEIGHT = 44;
const AI_LOGO_WIDTH = Math.round((AI_LOGO_HEIGHT * 80) / 56); // 63
const AI_LOGO_GAP = 12;
const AI_LOGO_OFFSET = AI_LOGO_WIDTH + AI_LOGO_GAP; // 75

function AiAgentIntro() {
  /* Static narration — describes the widget once. Save / edit status is
   * conveyed by the action chrome (the contextual taskbar and the settings
   * card overlay), not by mutating the AI's reply. */
  const headline =
    "Here's your widget — 12 months of purchases by cost center with a 2-month AI forecast. Hover any line or chip to focus a cost center.";

  /* Pattern from Figma node 628:10759: the Trimble-AI brand mark sits
   * to the LEFT of the AI's reply, OUTSIDE the column the widget
   * occupies — the paragraph itself stays flush-left with the widget
   * card below so the reading column doesn't shift. We achieve that
   * with a negative `marginLeft` on the flex container equal to the
   * logo width + gap; the row therefore overhangs into the gutter on
   * the left, and the paragraph (flex: 1) fills the 880 px column
   * starting at x = 0 — same x as the widget. */
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: `${AI_LOGO_GAP}px`,
        marginLeft: `-${AI_LOGO_OFFSET}px`,
        width: `${AI_LOGO_OFFSET + 880}px`,
        padding: '4px 4px 0 0',
      }}
    >
      <img
        src="/assets/trimble-ai-logo.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          width: `${AI_LOGO_WIDTH}px`,
          height: `${AI_LOGO_HEIGHT}px`,
          flexShrink: 0,
          objectFit: 'contain',
          /* Pull the logo up so its optical center sits on the first
           * line of 14/20 text ("Here's your widget…"). The logo is
           * ~2.2× the line height; without the lift it would feel
           * bottom-heavy and overlap the second line of copy. */
          marginTop: '-12px',
          /* Static brand mark — disable selection / dragging so it
           * stays put when users interact with the paragraph next
           * to it. */
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
      <p
        style={{
          fontSize: '14px',
          lineHeight: '20px',
          color: COLORS.textMid,
          letterSpacing: '0.15px',
          margin: 0,
          flex: '1 1 auto',
          minWidth: 0,
        }}
      >
        {headline}
      </p>
    </div>
  );
}

/* ── Footer actions ─────────────────────────────────────────── */
interface FooterActionsProps {
  editMode: boolean;
  widgetWidth: number;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

function FooterActions({
  editMode,
  widgetWidth,
  onEdit,
  onCancel,
  onSave,
}: FooterActionsProps) {
  /* Local state for the chat input. The Generate button is a visual stub
   * for now — it just clears the field so users can see something happen
   * when they hit it; in production it would be wired to the AI refinement
   * pipeline. */
  const [refinePrompt, setRefinePrompt] = useState('');

  /* Generate is a no-op until the user has actually typed something. We
   * trim so a string of whitespace doesn't count as a real prompt. */
  const isPromptEmpty = refinePrompt.trim().length === 0;

  function handleGenerate() {
    if (isPromptEmpty) return;
    setRefinePrompt('');
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: `${widgetWidth}px`,
        transition: 'width 200ms ease',
      }}
    >
      {editMode ? (
        /* Edit-mode bar: Cancel + Save changes, wrapped in the same
         * rainbow-bordered pill so the chrome stays consistent across
         * modes. */
        <div style={taskbarPillStyle}>
          <ModusWcButton
            size="sm"
            color="tertiary"
            variant="outlined"
            onButtonClick={onCancel}
          >
            <ModusWcIcon
              name="close"
              size="xs"
              decorative
              style={{ marginRight: '6px' }}
            />
            Cancel
          </ModusWcButton>
          <ModusWcButton size="sm" color="primary" onButtonClick={onSave}>
            Save changes
          </ModusWcButton>
        </div>
      ) : (
        /* Default-mode footer — Photoshop-style merged AI taskbar:
         *
         *   ┌──────────────────────────────────────────────────────────┐
         *   │ Ask AI to refine this widget…       ➤  │  Edit  Save │
         *   └──────────────────────────────────────────────────────────┘
         *
         * Photoshop's contextual taskbar collapses every input + action
         * into one floating pill. We mirror that shape here: the chat
         * input + Send sit on the left, a thin internal divider then
         * separates the AI-prompt cluster from the structural actions
         * (Edit + Save) on the right, and the whole thing rests on a
         * soft drop shadow so it reads as a floating contextual
         * surface. */
        <div
          className="flex items-center"
          style={{
            height: '48px',
            width: '560px',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            borderRadius: '12px',
            padding: '4px 8px 4px 4px',
            gap: '4px',
            backgroundColor:
              'var(--modus-wc-color-base-page, #ffffff)',
            /* Floating-surface lift, same shape used on the rest of
             * the AI surfaces in this app. */
            boxShadow:
              '0 1px 2px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.10)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleGenerate();
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
                value={refinePrompt}
                onInputChange={(e: CustomEvent) => {
                  const v =
                    (
                      e as unknown as {
                        detail?: { target?: { value?: string } };
                      }
                    ).detail?.target?.value ?? '';
                  setRefinePrompt(v);
                }}
                style={{
                  flex: 1,
                  width: '100%',
                  display: 'block',
                  background: 'transparent',
                }}
              />
            </div>

            {/* Send (Enter) — circular icon button. The Add /
             * attachment button was removed; Send is the only
             * AI-prompt action that lives inside the bar. */}
            <button
              type="button"
              aria-label="Send prompt"
              onClick={handleGenerate}
              style={{
                width: '38px',
                height: '38px',
                padding: 0,
                background: 'transparent',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
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

            {/* Internal divider — separates the AI-prompt cluster from
             * the structural actions (Edit / Save). 28 px tall so it
             * reads as a divider against the 32 / 38 px button row
             * without touching the pill border. */}
            <span
              aria-hidden="true"
              style={{
                width: '1px',
                height: '28px',
                backgroundColor:
                  'var(--modus-wc-color-base-200, #e0e1e9)',
                flexShrink: 0,
                margin: '0 6px',
              }}
            />

            {/* Edit + Save — text-only Modus buttons. Edit opens the
             * settings card; Save commits any pending draft. */}
            <div
              className="flex items-center shrink-0"
              style={{ gap: '6px' }}
            >
            <ModusWcButton
              size="sm"
              color="tertiary"
              variant="outlined"
              onButtonClick={onEdit}
            >
              Edit
            </ModusWcButton>
            <ModusWcButton
              size="sm"
              color="primary"
              onButtonClick={onSave}
            >
              Save
            </ModusWcButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Taskbar shell + atoms ─────────────────────────────────── */
/* Plain white pill with a subtle 1 px neutral border. The rainbow
 * AI signal lives on the widget card now — keeping it off the
 * footer keeps a clear visual hierarchy: rainbow = AI artifact,
 * neutral = control surface that operates on it. */
const taskbarPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  boxSizing: 'border-box',
  height: '44px',
  /* 36 px Send button + 3 px top/bottom + 1 px border each side
   * = 44 px overall. Smaller children (the 32 px sm Modus Edit button
   * and the 24 px divider) center inside the same row. */
  padding: '3px 6px 3px 12px',
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '10px',
  /* Lifted off the page so the bar reads as a floating contextual
   * layer rather than an inline footer. */
  boxShadow:
    '0 1px 2px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.10)',
};

