import { useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

const RESPONSE_TEXT = 'I\u2019m not capable of completing that request.';

const RAINBOW_SHADOW =
  '0 20px 50px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.05)';

/* ── Rainbow shell — used by every response card ──────────────── */
/* Reuses the global `.creative7-plan-card-glow` class from index.css
   so the border subtly shimmers, matching Creative 5 / Creative 7. */
function RainbowShell({
  width = 520,
  children,
}: {
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="creative7-plan-card-glow rounded-2xl p-[2px] shrink-0"
      style={{
        width: `${width}px`,
        background: TRIMBLE_RAINBOW,
        backgroundSize: '200% 200%',
        boxShadow: RAINBOW_SHADOW,
      }}
    >
      <div className="bg-white rounded-[14px] flex flex-col w-full overflow-hidden">{children}</div>
    </div>
  );
}

/* ── 1 · Tool result — eyebrow stripe + message + tip ─────────── */
function ToolResponseCard() {
  return (
    <RainbowShell>
      <div
        className="flex items-center gap-1.5 px-5 py-2"
        style={{
          backgroundColor: '#fff9ef',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <ModusWcIcon name="alert_outline" size="xs" decorative style={{ color: '#b88217' }} />
        <span
          className="font-semibold"
          style={{
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#b88217',
          }}
        >
          Result · Unable to forecast
        </span>
      </div>
      <div className="flex flex-col items-center gap-2 px-10 py-7">
        <p
          className="text-center"
          style={{
            fontSize: '16px',
            lineHeight: 1.55,
            color: 'var(--modus-wc-color-base-content, #364153)',
            margin: 0,
          }}
        >
          {RESPONSE_TEXT}
        </p>
        <span
          className="text-center"
          style={{
            fontSize: '12px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Try a shorter horizon or fewer materials and re-run.
        </span>
      </div>
    </RainbowShell>
  );
}

/* ── 2 · Workflow blocked — left status stripe, message right ─── */
function WorkflowResponseCard() {
  return (
    <RainbowShell>
      <div className="flex w-full">
        <div
          className="flex items-start justify-center pt-5 shrink-0"
          style={{ width: '64px', backgroundColor: '#fff9ef' }}
        >
          <ModusWcIcon name="alert_outline" size="md" decorative style={{ color: '#b88217' }} />
        </div>
        <div className="flex flex-col gap-1.5 px-6 py-6 flex-1 min-w-0">
          <span
            className="font-semibold"
            style={{
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#b88217',
            }}
          >
            Step paused
          </span>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.45,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              margin: 0,
            }}
          >
            {RESPONSE_TEXT}
          </p>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Mark this step done manually to keep the workflow moving.
          </span>
        </div>
      </div>
    </RainbowShell>
  );
}

/* ── 3 · Widget empty state — big icon, centered, illustrative ─ */
function WidgetResponseCard() {
  return (
    <RainbowShell width={500}>
      <div className="flex flex-col items-center gap-3 px-10 py-7">
        <div
          className="flex items-center justify-center rounded-full size-12"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          }}
        >
          <ModusWcIcon
            name="bar_graph_square"
            size="md"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)' }}
          />
        </div>
        <span
          className="font-semibold"
          style={{
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          No reliable insight
        </span>
        <p
          className="text-center"
          style={{
            fontSize: '16px',
            lineHeight: 1.5,
            color: 'var(--modus-wc-color-base-content, #364153)',
            margin: 0,
          }}
        >
          {RESPONSE_TEXT}
        </p>
        <span
          className="text-center"
          style={{
            fontSize: '12px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          This tile will refresh when we can answer with confidence.
        </span>
      </div>
    </RainbowShell>
  );
}

/* ── 4 · Search empty — search icon left, message right ───────── */
function SearchResponseCard() {
  return (
    <RainbowShell>
      <div className="flex items-center gap-4 px-7 py-6">
        <div
          className="flex items-center justify-center rounded-full size-12 shrink-0"
          style={{ backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)' }}
        >
          <ModusWcIcon
            name="search"
            size="md"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span
            className="font-semibold"
            style={{
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            No reliable answer
          </span>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.45,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              margin: 0,
            }}
          >
            {RESPONSE_TEXT}
          </p>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Try rephrasing the query or browsing related reports.
          </span>
        </div>
      </div>
    </RainbowShell>
  );
}

/* ── 5 · Document callout — editorial blockquote, attribution ─── */
function DocumentResponseCard() {
  return (
    <RainbowShell>
      <div className="flex gap-4 px-8 py-7">
        <div
          className="shrink-0"
          style={{
            width: '3px',
            borderRadius: '2px',
            background: TRIMBLE_RAINBOW,
          }}
        />
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <span
            className="font-semibold"
            style={{
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            AI disclosure
          </span>
          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.5,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            “{RESPONSE_TEXT}”
          </p>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            — Trimble AI · Recommend authoring this section manually.
          </span>
        </div>
      </div>
    </RainbowShell>
  );
}

/* ═════════════════════════════════════════════════════════════════
   CONTEXT 1 — TOOL / GENERATOR PANEL
   The AI lives inside a dedicated tool with named input fields.
   Shows the inputs the user submitted; response below is the result.
   ═════════════════════════════════════════════════════════════════ */
function ToolPanelContext() {
  return (
    <div className="flex flex-col gap-3" style={{ width: '520px' }}>
      <div
        className="rounded-xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div
            className="flex items-center justify-center rounded-md size-6"
            style={{ backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)' }}
          >
            <ModusWcIcon name="bar_graph_square" size="xs" decorative style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }} />
          </div>
          <span
            className="font-semibold"
            style={{ fontSize: '13px', color: 'var(--modus-wc-color-base-content, #101828)' }}
          >
            AI Cost Forecaster
          </span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-y-2 gap-x-4 px-4 py-3">
          {[
            ['Project', 'Highway 47 — Phase 3'],
            ['Horizon', 'Next quarter (Q3 2027)'],
            ['Materials', 'Concrete · Steel'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <span
                className="font-semibold"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  paddingTop: '2px',
                }}
              >
                {k}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>
                {v}
              </span>
            </div>
          ))}
        </div>
        <div
          className="px-4 py-2"
          style={{
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
            fontSize: '11px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Generated 2 seconds ago
        </div>
      </div>

      <ToolResponseCard />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   CONTEXT 2 — WORKFLOW / PIPELINE STEP
   The AI is one step of a longer process. Stepper at top marks the
   AI step as blocked; response below explains why.
   ═════════════════════════════════════════════════════════════════ */
function WorkflowStepContext() {
  const steps = [
    { id: 1, label: 'Setup', state: 'done' as const },
    { id: 2, label: 'Inputs', state: 'done' as const },
    { id: 3, label: 'AI Forecast', state: 'blocked' as const },
    { id: 4, label: 'Review', state: 'pending' as const },
    { id: 5, label: 'Export', state: 'pending' as const },
  ];

  return (
    <div className="flex flex-col gap-3" style={{ width: '520px' }}>
      <div
        className="rounded-xl px-4 py-3 flex flex-col gap-3"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-semibold"
            style={{
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Step 3 of 5 · AI Forecast
          </span>
          <span
            className="font-semibold px-2 py-0.5 rounded-md"
            style={{
              fontSize: '10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#b88217',
              backgroundColor: '#fff9ef',
              border: '1px solid #f3c870',
            }}
          >
            Blocked
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => {
            const isBlocked = s.state === 'blocked';
            const isDone = s.state === 'done';
            const bg = isBlocked
              ? '#fff9ef'
              : isDone
                ? 'var(--modus-wc-color-status-success-light, #e6f4ea)'
                : 'var(--modus-wc-color-base-200, #e0e1e9)';
            const fg = isBlocked
              ? '#b88217'
              : isDone
                ? 'var(--modus-wc-color-status-success, #1e7e34)'
                : 'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)';
            return (
              <span key={s.id} className="flex items-center gap-1.5 flex-1 min-w-0">
                <span
                  className="flex items-center justify-center rounded-full font-semibold shrink-0"
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: bg,
                    color: fg,
                    fontSize: '10px',
                    border: isBlocked ? '1px solid #f3c870' : 'none',
                  }}
                >
                  {isDone ? '✓' : isBlocked ? '!' : s.id}
                </span>
                <span
                  className="truncate font-medium"
                  style={{
                    fontSize: '11px',
                    color: isBlocked
                      ? '#b88217'
                      : isDone
                        ? 'var(--modus-wc-color-base-content, #171c1e)'
                        : 'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)',
                  }}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className="flex-1"
                    style={{ height: '1px', backgroundColor: 'var(--modus-wc-color-base-200, #d0d3da)' }}
                  />
                )}
              </span>
            );
          })}
        </div>
      </div>

      <WorkflowResponseCard />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   CONTEXT 3 — DASHBOARD INSIGHT TILE
   Looks like an AI-insights widget on an analytics dashboard.
   Tile chrome (title bar, source, timestamp) wraps the response.
   ═════════════════════════════════════════════════════════════════ */
function DashboardTileContext() {
  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        width: '560px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ModusWcIcon name="brain" size="xs" decorative style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }} />
          <span
            className="font-semibold"
            style={{ fontSize: '13px', color: 'var(--modus-wc-color-base-content, #101828)' }}
          >
            AI Insights · Material Pricing
          </span>
        </div>
        <ModusWcIcon name="more_vertical" size="xs" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
      </div>

      <div className="flex justify-center px-5 py-5">
        <WidgetResponseCard />
      </div>

      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
          fontSize: '11px',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        <span>Source: Trimble AI · Model v2.4</span>
        <span>Updated just now</span>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   CONTEXT 4 — SEARCH QUERY / EMPTY STATE
   The user typed a question into a search bar.  Search bar with
   the query stays at the top; below it, an honest empty state.
   ═════════════════════════════════════════════════════════════════ */
function SearchQueryContext() {
  return (
    <div className="flex flex-col gap-4" style={{ width: '560px' }}>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <ModusWcIcon name="search" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
        <span
          className="flex-1 truncate"
          style={{ fontSize: '14px', color: 'var(--modus-wc-color-base-content, #364153)' }}
        >
          forecast next quarter concrete and steel prices for phase 3
        </span>
        <span
          className="font-semibold px-2 py-0.5 rounded-md shrink-0"
          style={{
            fontSize: '10px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          }}
        >
          AI search
        </span>
      </div>

      <div className="flex justify-center">
        <SearchResponseCard />
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   CONTEXT 5 — DOCUMENT / REPORT SECTION
   The response is one section of a multi-section project document.
   Document title + section heading sit above the response card.
   ═════════════════════════════════════════════════════════════════ */
function DocumentSectionContext() {
  return (
    <div className="flex flex-col gap-3" style={{ width: '520px' }}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <ModusWcIcon name="document_outline" size="xs" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
          <span
            className="font-semibold"
            style={{
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Project Brief · Highway 47 — Phase 3
          </span>
        </div>
        <span
          className="font-semibold"
          style={{
            fontSize: '20px',
            lineHeight: 1.2,
            color: 'var(--modus-wc-color-base-content, #101828)',
          }}
        >
          4. Market Forecast
        </span>
        <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}>
          Section 4 of 7 · Generated by Trimble AI
        </span>
        <div
          style={{
            height: '1px',
            backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)',
            marginTop: '6px',
          }}
        />
      </div>

      <DocumentResponseCard />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Picker — segmented control at the top of the page
   ═════════════════════════════════════════════════════════════════ */
type ContextVariant = 'tool' | 'workflow' | 'widget' | 'search' | 'document';

const CONTEXT_OPTIONS: { id: ContextVariant; label: string; sub: string }[] = [
  { id: 'tool', label: '1 · Tool panel', sub: 'Inputs + result' },
  { id: 'workflow', label: '2 · Workflow step', sub: 'Pipeline stepper' },
  { id: 'widget', label: '3 · Dashboard tile', sub: 'AI insight widget' },
  { id: 'search', label: '4 · Search query', sub: 'Empty result state' },
  { id: 'document', label: '5 · Document', sub: 'Report section' },
];

function ContextPicker({
  active,
  onChange,
}: {
  active: ContextVariant;
  onChange: (v: ContextVariant) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="font-semibold"
        style={{
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        Pick a context for the response
      </span>
      <div
        className="flex flex-wrap gap-1 p-1 rounded-lg"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        {CONTEXT_OPTIONS.map(({ id, label, sub }) => {
          const selected = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="flex flex-col items-start px-3 py-1.5 rounded-md transition-colors"
              style={{
                backgroundColor: selected
                  ? 'var(--modus-wc-color-base-page, #ffffff)'
                  : 'transparent',
                boxShadow: selected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span
                className="font-semibold"
                style={{
                  fontSize: '12px',
                  color: selected
                    ? 'var(--modus-wc-color-primary, #0063a3)'
                    : 'var(--modus-wc-color-base-content, #364153)',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                {sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Expert 5 — Be Honest About Limitations ────────────────────── */
/**
 * Direct, transparent limitations response, framed by a selectable
 * non-chat context.  Pick one of five surfaces — none of them are
 * conversational — and we'll lock that one in.
 */
export default function Expert5() {
  const [variant, setVariant] = useState<ContextVariant>('tool');

  return (
    <>
      <div
        className="fixed top-4 z-40"
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      >
        <ContextPicker active={variant} onChange={setVariant} />
      </div>

      <div className="flex flex-col items-start">
        {variant === 'tool' && <ToolPanelContext />}
        {variant === 'workflow' && <WorkflowStepContext />}
        {variant === 'widget' && <DashboardTileContext />}
        {variant === 'search' && <SearchQueryContext />}
        {variant === 'document' && <DocumentSectionContext />}
      </div>
    </>
  );
}
