import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

const COLOR_USED = '#00B8B0';
const COLOR_REMAINING = '#9FD9D4';
const COLOR_NEW = 'var(--modus-wc-color-status-warning, #d97706)';

interface Segment {
  id: string;
  label: string;
  value: number;
  color: string;
  isNew?: boolean;
}

const segments: Segment[] = [
  { id: 'used', label: 'Budget Used', value: 70, color: COLOR_USED },
  { id: 'remaining', label: 'Remaining Budget', value: 20, color: COLOR_REMAINING },
  { id: 'contingency', label: 'Contingency', value: 10, color: COLOR_NEW, isNew: true },
];

/* ── User avatar (stick-figure SVG) ─────────────────────────────── */
function UserAvatar({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 20 Q5 13.5 12 13.5 Q19 13.5 19 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ── Trimble AI sparkle ─────────────────────────────────────────── */
function SparkleMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkleGrad2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF2BFC" />
          <stop offset="60%" stopColor="#4A00FF" />
          <stop offset="100%" stopColor="#0563A7" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 L13.6 9.4 L21 11 L13.6 12.6 L12 20 L10.4 12.6 L3 11 L10.4 9.4 Z"
        fill="url(#sparkleGrad2)"
      />
    </svg>
  );
}

/* ── Donut chart (3 segments) ───────────────────────────────────── */
function Donut({ centerValue, centerLabel }: { centerValue: string; centerLabel: string }) {
  const cx = 60;
  const cy = 60;
  const r = 42;
  const C = 2 * Math.PI * r;

  const rings = segments.map((s, i) => {
    const dash = (s.value / 100) * C;
    const beforeSum = segments
      .slice(0, i)
      .reduce((acc, x) => acc + (x.value / 100) * C, 0);
    return { id: s.id, color: s.color, dash, offset: -beforeSum };
  });

  return (
    <svg width={140} height={140} viewBox="0 0 120 120" aria-hidden="true">
      {rings.map((ring) => (
        <circle
          key={ring.id}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={ring.color}
          strokeWidth={14}
          strokeDasharray={`${ring.dash} ${C - ring.dash}`}
          strokeDashoffset={ring.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fontSize="18"
        fontWeight="600"
        fill="var(--modus-wc-color-base-content, #101828)"
      >
        {centerValue}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontSize="11"
        fill="var(--modus-wc-color-base-content-low-contrast, #6a6e79)"
      >
        {centerLabel}
      </text>
    </svg>
  );
}

/* ── Creative 2 — Build upon existing work ─────────────────────── */
/* Scenario: the user asks the AI to iterate on last quarter's Budget
   Tracker. The new output preserves the existing structure and adds
   one new line — clearly tagged — so it's obvious the AI built on
   the previous decision instead of starting fresh. */

export default function Creative2() {
  return (
    <div className="flex flex-col items-start gap-4" style={{ width: '420px' }}>
      {/* User prompt bubble */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{
          maxWidth: '340px',
          backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        }}
      >
        <span
          className="shrink-0"
          style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
        >
          <UserAvatar />
        </span>
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #101828)',
            fontStyle: 'italic',
            lineHeight: '20px',
          }}
        >
          &ldquo;Update my budget tracker for Q2 — add a contingency line&rdquo;
        </span>
      </div>

      {/* AI Budget Tracker output */}
      <div
        className="rounded-2xl p-[3px]"
        style={{
          background: TRIMBLE_RAINBOW,
          width: '100%',
          boxShadow:
            '0 10px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="rounded-[14px] flex flex-col"
          style={{ backgroundColor: 'var(--modus-wc-color-base-page, #fff)' }}
        >
          {/* Title + iteration badge */}
          <div className="flex flex-col items-center gap-2 px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <SparkleMark />
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-md, 16px)',
                  color: 'var(--modus-wc-color-base-content, #101828)',
                  lineHeight: '22px',
                }}
              >
                Budget Tracker
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
              }}
            >
              <ModusWcIcon
                name="history"
                size="xs"
                decorative
                style={{
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              />
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                Building on Q1 Tracker
              </span>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop:
                '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            }}
          />

          {/* Chart + Legend */}
          <div className="flex items-center gap-5 px-5 py-5">
            <Donut centerValue="20%" centerLabel="Remaining" />
            <div className="flex flex-col gap-2.5 flex-1">
              {segments.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    className="rounded-full shrink-0"
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: s.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      color: 'var(--modus-wc-color-base-content, #364153)',
                      lineHeight: '20px',
                    }}
                  >
                    {s.label}
                  </span>
                  {s.isNew && (
                    <span
                      className="px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        fontSize: '9px',
                        backgroundColor:
                          'var(--modus-wc-color-status-warning-light, #fff4e6)',
                        color:
                          'var(--modus-wc-color-status-warning, #b45309)',
                        letterSpacing: '0.4px',
                      }}
                    >
                      NEW
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
