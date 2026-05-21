import { useState } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Guideline: PROVIDE OPTIONS
 *   Provide multiple divergent options so the professional can give
 *   creative direction and keep a sense of creative control.
 *
 * Component: ONE-OPEN-FOUR-SWITCHERS
 *   Five divergent kitchen directions are offered. ONE direction
 *   is opened in the centre — large kitchen-plan SVG with live,
 *   toggleable signature-move layers (Photoshop-style). The OTHER
 *   FOUR sit as quiet switcher chips above the panel: tap any chip
 *   to swap it into the centre. Toggle state is preserved per move
 *   so the professional's customisations survive a direction swap.
 *   That preservation is the "creative control" part of the
 *   guideline made literal.
 *
 *   Three floating elements stack in the middle of the surface
 *   (switcher row, detail panel, chat-bar pill) — no containing
 *   card wraps them.
 * ───────────────────────────────────────────────────────────────── */

type PlanId = 'open' | 'storage' | 'workflow' | 'sustainable' | 'family';

interface MoveDef {
  id: string;
  title: string;
  description: string;
}

interface Direction {
  id: PlanId;
  name: string;
  philosophy: string;
  icon: string;
  accent: string;
  accentSoft: string;
  moves: MoveDef[];
}

const DIRECTIONS: Direction[] = [
  {
    id: 'open',
    name: 'Open & Airy',
    philosophy: 'Few uppers, statement glass, room to breathe.',
    icon: 'lightbulb',
    accent: 'var(--modus-wc-color-status-success, #1e7e34)',
    accentSoft: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
    moves: [
      { id: 'window', title: 'Picture window', description: 'Floor-to-ceiling glazing on the prep wall.' },
      { id: 'skylight', title: 'Skylight cutout', description: 'Daylight directly above the open zone.' },
      { id: 'pendants', title: 'Pendant cluster', description: 'Three pendants over the open area.' },
    ],
  },
  {
    id: 'storage',
    name: 'Storage-Maxed',
    philosophy: 'Floor-to-ceiling cabinetry — every wall earns its keep.',
    icon: 'apps',
    accent: 'var(--modus-wc-color-primary, #0063A7)',
    accentSoft: 'var(--modus-wc-color-primary-light, #e8f4fd)',
    moves: [
      { id: 'wall-cabinets', title: 'Wall-to-wall cabinets', description: 'Cabinetry runs full perimeter.' },
      { id: 'island', title: 'Storage island', description: 'Drawers on both sides of the island.' },
      { id: 'pantry', title: 'Tall pantry', description: 'Pull-out larder in the corner.' },
    ],
  },
  {
    id: 'workflow',
    name: "Chef's Workflow",
    philosophy: 'Tight work triangle, deep drawers everywhere.',
    icon: 'compare_arrows',
    accent: 'var(--modus-wc-color-status-warning, #856404)',
    accentSoft: 'var(--modus-wc-color-status-warning-light, #fff8e1)',
    moves: [
      { id: 'triangle', title: 'Work triangle', description: 'Sink, range, fridge in under 12 ft.' },
      { id: 'drawers', title: 'Deep drawer banks', description: 'No base cabinets — drawers throughout.' },
      { id: 'pot-filler', title: 'Pot filler', description: 'Wall-mount tap over the range.' },
    ],
  },
  {
    id: 'sustainable',
    name: 'Sustainable',
    philosophy: 'FSC wood, low-flow fixtures, energy-star kit.',
    icon: 'sustainability',
    accent: 'var(--modus-wc-color-secondary, #6A6E79)',
    accentSoft: 'var(--modus-wc-color-secondary-light, #f3f0ff)',
    moves: [
      { id: 'planter', title: 'Herb planter wall', description: 'Living planter behind the sink.' },
      { id: 'solar-tube', title: 'Solar tube', description: 'Natural light without heat gain.' },
      { id: 'water-loop', title: 'Greywater loop', description: 'Sink runoff feeds irrigation.' },
    ],
  },
  {
    id: 'family',
    name: 'Family Hub',
    philosophy: 'Bench seating, durable tops, kid-friendly zones.',
    icon: 'star_outline',
    accent: 'var(--modus-wc-color-status-info, #004f83)',
    accentSoft: 'var(--modus-wc-color-status-info-light, #e8f4fd)',
    moves: [
      { id: 'island', title: 'Family island', description: 'Big island with four stools.' },
      { id: 'bench', title: 'Bench banquette', description: 'Built-in bench against the side wall.' },
      { id: 'snack', title: 'Snack drawer', description: 'Kid-height pull-out at island end.' },
    ],
  },
];

const moveKey = (dirId: PlanId, moveId: string) => `${dirId}:${moveId}`;

const DEFAULT_ENABLED = new Set<string>(
  DIRECTIONS.flatMap((d) => d.moves.map((m) => moveKey(d.id, m.id)))
);

/* ── live, layered kitchen-plan SVG ─────────────────────────────── */

function LivePlan({
  direction,
  enabled,
}: {
  direction: Direction;
  enabled: Set<string>;
}) {
  const { id, accent, accentSoft } = direction;
  const room = 'var(--modus-wc-color-base-200, #e0e1e9)';
  const stage = 'var(--modus-wc-color-base-100, #f7f8fa)';
  const on = (moveId: string) => enabled.has(moveKey(id, moveId));

  return (
    <svg
      viewBox="0 0 360 240"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* room */}
      <rect x="6" y="6" width="348" height="228" fill={stage} stroke={room} strokeWidth="1.5" rx="3" />

      {id === 'open' && (
        <g>
          {/* base L-counter */}
          <rect x="6" y="188" width="180" height="46" fill={accentSoft} stroke={accent} strokeWidth="1" />
          <rect x="6" y="88" width="46" height="100" fill={accentSoft} stroke={accent} strokeWidth="1" />
          <rect x="20" y="200" width="22" height="22" fill="white" stroke={accent} strokeWidth="0.8" />
          <rect x="60" y="200" width="22" height="22" fill="white" stroke={accent} strokeWidth="0.8" />
          <rect x="100" y="200" width="22" height="22" fill="white" stroke={accent} strokeWidth="0.8" />
          {/* fridge stub */}
          <rect x="300" y="188" width="48" height="46" fill={accentSoft} stroke={accent} strokeWidth="1" />
          <line x1="300" y1="210" x2="348" y2="210" stroke={accent} strokeWidth="0.8" />

          {on('window') && (
            <g>
              <rect x="100" y="2" width="200" height="6" fill={accent} rx="1.5" />
              <line x1="166" y1="2" x2="166" y2="8" stroke={stage} strokeWidth="1.5" />
              <line x1="233" y1="2" x2="233" y2="8" stroke={stage} strokeWidth="1.5" />
            </g>
          )}
          {on('skylight') && (
            <g>
              <ellipse
                cx="220"
                cy="70"
                rx="42"
                ry="26"
                fill={accent}
                fillOpacity="0.16"
                stroke={accent}
                strokeWidth="1"
                strokeDasharray="3 2"
              />
              <text x="220" y="74" fontSize="9" textAnchor="middle" fill={accent}>
                ☼
              </text>
            </g>
          )}
          {on('pendants') && (
            <g>
              <line x1="210" y1="8" x2="210" y2="118" stroke={accent} strokeWidth="0.6" />
              <line x1="230" y1="8" x2="230" y2="124" stroke={accent} strokeWidth="0.6" />
              <line x1="250" y1="8" x2="250" y2="118" stroke={accent} strokeWidth="0.6" />
              <circle cx="210" cy="118" r="7" fill={accent} />
              <circle cx="230" cy="124" r="7" fill={accent} />
              <circle cx="250" cy="118" r="7" fill={accent} />
            </g>
          )}
        </g>
      )}

      {id === 'storage' && (
        <g>
          {/* base: counters top + bottom */}
          <rect x="6" y="6" width="348" height="42" fill={accentSoft} stroke={accent} strokeWidth="1" />
          <rect x="6" y="192" width="348" height="42" fill={accentSoft} stroke={accent} strokeWidth="1" />
          {[44, 84, 124, 164, 204, 244, 284, 324].map((x) => (
            <line key={`t-${x}`} x1={x} y1="6" x2={x} y2="48" stroke={accent} strokeWidth="0.8" />
          ))}
          {[44, 84, 124, 164, 204, 244, 284, 324].map((x) => (
            <line key={`b-${x}`} x1={x} y1="192" x2={x} y2="234" stroke={accent} strokeWidth="0.8" />
          ))}

          {on('wall-cabinets') && (
            <g>
              <rect x="6" y="48" width="30" height="144" fill={accentSoft} stroke={accent} strokeWidth="1" />
              <rect x="324" y="48" width="30" height="144" fill={accentSoft} stroke={accent} strokeWidth="1" />
              <line x1="6" y1="100" x2="36" y2="100" stroke={accent} strokeWidth="0.6" />
              <line x1="6" y1="148" x2="36" y2="148" stroke={accent} strokeWidth="0.6" />
              <line x1="324" y1="100" x2="354" y2="100" stroke={accent} strokeWidth="0.6" />
              <line x1="324" y1="148" x2="354" y2="148" stroke={accent} strokeWidth="0.6" />
            </g>
          )}
          {on('island') && (
            <g>
              <rect
                x="110"
                y="100"
                width="140"
                height="50"
                fill={accent}
                fillOpacity="0.18"
                stroke={accent}
                strokeWidth="1.2"
                rx="2"
              />
              <line x1="180" y1="100" x2="180" y2="150" stroke={accent} strokeWidth="0.6" />
            </g>
          )}
          {on('pantry') && (
            <g>
              <rect x="40" y="48" width="48" height="60" fill={accent} fillOpacity="0.32" stroke={accent} strokeWidth="1" />
              <line x1="64" y1="48" x2="64" y2="108" stroke={accent} strokeWidth="0.8" />
              <text x="64" y="86" fontSize="8" textAnchor="middle" fill="white" fontWeight="600">
                P
              </text>
            </g>
          )}
        </g>
      )}

      {id === 'workflow' && (
        <g>
          {/* base galley */}
          <rect x="6" y="6" width="348" height="46" fill={accentSoft} stroke={accent} strokeWidth="1" />
          <rect x="6" y="188" width="348" height="46" fill={accentSoft} stroke={accent} strokeWidth="1" />
          {/* zones: sink (top left), range (top right), fridge (bottom centre) */}
          <rect x="60" y="14" width="40" height="30" fill="white" stroke={accent} strokeWidth="1" />
          <text x="80" y="33" fontSize="8" textAnchor="middle" fill={accent} fontWeight="600">
            SINK
          </text>
          <rect x="240" y="14" width="40" height="30" fill="white" stroke={accent} strokeWidth="1" />
          <text x="260" y="33" fontSize="8" textAnchor="middle" fill={accent} fontWeight="600">
            RANGE
          </text>
          <rect x="160" y="196" width="40" height="30" fill="white" stroke={accent} strokeWidth="1" />
          <text x="180" y="215" fontSize="8" textAnchor="middle" fill={accent} fontWeight="600">
            FRIDGE
          </text>

          {on('triangle') && (
            <polygon
              points="80,30 260,30 180,212"
              fill={accent}
              fillOpacity="0.12"
              stroke={accent}
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          )}
          {on('drawers') && (
            <g>
              <line x1="120" y1="6" x2="120" y2="52" stroke={accent} strokeWidth="0.8" />
              <line x1="160" y1="6" x2="160" y2="52" stroke={accent} strokeWidth="0.8" />
              <line x1="200" y1="6" x2="200" y2="52" stroke={accent} strokeWidth="0.8" />
              <line x1="220" y1="6" x2="220" y2="52" stroke={accent} strokeWidth="0.8" />
              <line x1="300" y1="6" x2="300" y2="52" stroke={accent} strokeWidth="0.8" />
              <line x1="330" y1="6" x2="330" y2="52" stroke={accent} strokeWidth="0.8" />
              <line x1="40" y1="188" x2="40" y2="234" stroke={accent} strokeWidth="0.8" />
              <line x1="80" y1="188" x2="80" y2="234" stroke={accent} strokeWidth="0.8" />
              <line x1="120" y1="188" x2="120" y2="234" stroke={accent} strokeWidth="0.8" />
              <line x1="220" y1="188" x2="220" y2="234" stroke={accent} strokeWidth="0.8" />
              <line x1="260" y1="188" x2="260" y2="234" stroke={accent} strokeWidth="0.8" />
              <line x1="300" y1="188" x2="300" y2="234" stroke={accent} strokeWidth="0.8" />
            </g>
          )}
          {on('pot-filler') && (
            <g>
              <line x1="260" y1="6" x2="260" y2="14" stroke={accent} strokeWidth="2.5" />
              <line x1="234" y1="6" x2="260" y2="6" stroke={accent} strokeWidth="2.5" />
              <line x1="234" y1="6" x2="234" y2="14" stroke={accent} strokeWidth="2.5" />
            </g>
          )}
        </g>
      )}

      {id === 'sustainable' && (
        <g>
          {/* base L counter */}
          <rect x="6" y="188" width="240" height="46" fill={accentSoft} stroke={accent} strokeWidth="1" />
          <rect x="200" y="50" width="46" height="138" fill={accentSoft} stroke={accent} strokeWidth="1" />
          {/* sink */}
          <rect x="60" y="200" width="36" height="22" fill="white" stroke={accent} strokeWidth="1" />
          <circle cx="78" cy="211" r="2.5" fill={accent} />

          {on('planter') && (
            <g>
              {[28, 64, 100, 136, 172].map((x, i) => (
                <g key={i}>
                  <path
                    d={`M${x},80 Q${x + 12},62 ${x + 24},80 Q${x + 24},96 ${x + 12},104 Q${x},96 ${x},80 Z`}
                    fill={accent}
                    fillOpacity="0.35"
                    stroke={accent}
                    strokeWidth="0.8"
                  />
                  <path
                    d={`M${x + 12},90 Q${x + 16},80 ${x + 22},74`}
                    stroke={accent}
                    strokeWidth="0.8"
                    fill="none"
                  />
                </g>
              ))}
              <rect x="20" y="100" width="190" height="6" fill={accent} fillOpacity="0.5" />
            </g>
          )}
          {on('solar-tube') && (
            <g>
              <circle cx="290" cy="100" r="20" fill={accent} fillOpacity="0.22" stroke={accent} strokeWidth="1.2" />
              <circle cx="290" cy="100" r="6" fill={accent} />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const a = (i * Math.PI) / 4;
                const x1 = 290 + Math.cos(a) * 22;
                const y1 = 100 + Math.sin(a) * 22;
                const x2 = 290 + Math.cos(a) * 30;
                const y2 = 100 + Math.sin(a) * 30;
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="1.2" />
                );
              })}
            </g>
          )}
          {on('water-loop') && (
            <g>
              <path
                d="M78,222 C78,180 290,180 290,140"
                stroke={accent}
                strokeWidth="1.4"
                fill="none"
                strokeDasharray="4 3"
              />
              <circle cx="78" cy="222" r="3" fill={accent} />
              <circle cx="290" cy="140" r="3" fill={accent} />
              <text x="180" y="170" fontSize="9" textAnchor="middle" fill={accent} fontWeight="600">
                ↻
              </text>
            </g>
          )}
        </g>
      )}

      {id === 'family' && (
        <g>
          {/* top counter */}
          <rect x="6" y="6" width="348" height="36" fill={accentSoft} stroke={accent} strokeWidth="1" />
          {/* stove */}
          <rect x="160" y="14" width="40" height="22" fill="white" stroke={accent} strokeWidth="1" />
          <circle cx="170" cy="25" r="3" fill={accent} fillOpacity="0.5" />
          <circle cx="190" cy="25" r="3" fill={accent} fillOpacity="0.5" />

          {on('island') && (
            <g>
              <rect
                x="80"
                y="100"
                width="200"
                height="50"
                fill={accent}
                fillOpacity="0.22"
                stroke={accent}
                strokeWidth="1.2"
                rx="3"
              />
              <line x1="180" y1="100" x2="180" y2="150" stroke={accent} strokeWidth="0.6" />
              <circle cx="105" cy="175" r="6" fill={accent} />
              <circle cx="155" cy="175" r="6" fill={accent} />
              <circle cx="205" cy="175" r="6" fill={accent} />
              <circle cx="255" cy="175" r="6" fill={accent} />
            </g>
          )}
          {on('bench') && (
            <g>
              <rect
                x="6"
                y="80"
                width="40"
                height="148"
                fill={accent}
                fillOpacity="0.18"
                stroke={accent}
                strokeWidth="1"
              />
              <rect x="10" y="84" width="32" height="20" fill={accent} fillOpacity="0.35" />
              <rect x="10" y="112" width="32" height="20" fill={accent} fillOpacity="0.35" />
              <rect x="10" y="140" width="32" height="20" fill={accent} fillOpacity="0.35" />
            </g>
          )}
          {on('snack') && (
            <g>
              <rect
                x="244"
                y="110"
                width="32"
                height="30"
                fill={accent}
                fillOpacity="0.45"
                stroke={accent}
                strokeWidth="1"
              />
              <line x1="260" y1="110" x2="260" y2="140" stroke="white" strokeWidth="1.2" />
              <text x="260" y="155" fontSize="8" textAnchor="middle" fill={accent} fontWeight="600">
                snack
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

/* ── switcher chip (4 quiet + 1 active) ─────────────────────────── */

function SwitcherChip({
  direction,
  active,
  chosen,
  onClick,
}: {
  direction: Direction;
  active: boolean;
  chosen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-left"
      style={{
        width: '152px',
        backgroundColor: active
          ? direction.accentSoft
          : 'var(--modus-wc-color-base-page, #ffffff)',
        border: active
          ? `1.5px solid ${direction.accent}`
          : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: active
          ? `0 0 0 3px ${direction.accentSoft}, 0 10px 22px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)`
          : '0 4px 12px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        transition:
          'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease',
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow =
          '0 10px 20px rgba(0,0,0,0.08), 0 2px 5px rgba(0,0,0,0.05)';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 4px 12px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)';
      }}
      aria-pressed={active}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0"
        style={{
          width: '30px',
          height: '30px',
          backgroundColor: active
            ? direction.accent
            : 'var(--modus-wc-color-base-100, #f5f6fa)',
        }}
      >
        <ModusWcIcon
          name={direction.icon}
          size="sm"
          decorative
          style={{
            color: active ? '#ffffff' : direction.accent,
          }}
        />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className="truncate font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 13.5px)',
            color: 'var(--modus-wc-color-base-content, #101828)',
            lineHeight: 1.2,
          }}
        >
          {direction.name}
        </span>
        <span
          className="truncate flex items-center gap-1"
          style={{
            fontSize: '10.5px',
            color: chosen
              ? direction.accent
              : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            margin: 0,
            fontWeight: chosen ? 600 : 400,
          }}
        >
          {chosen ? (
            <>
              <ModusWcIcon
                name="check_circle"
                size="xs"
                decorative
                style={{ color: direction.accent }}
              />
              Chosen
            </>
          ) : active ? (
            'Active'
          ) : (
            'Switch to'
          )}
        </span>
      </div>
    </button>
  );
}

/* ── one toggleable move row ────────────────────────────────────── */

function MoveToggle({
  move,
  enabled,
  accent,
  accentSoft,
  onToggle,
}: {
  move: MoveDef;
  enabled: boolean;
  accent: string;
  accentSoft: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-start gap-3 p-2.5 rounded-lg text-left"
      style={{
        width: '100%',
        backgroundColor: enabled
          ? accentSoft
          : 'var(--modus-wc-color-base-100, #f7f8fa)',
        border: enabled ? `1px solid ${accent}` : '1px solid transparent',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
      aria-pressed={enabled}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0"
        style={{
          width: '26px',
          height: '26px',
          backgroundColor: enabled ? accent : 'var(--modus-wc-color-base-page, #ffffff)',
          border: enabled ? 'none' : '1px solid var(--modus-wc-color-base-200, #d0d3da)',
          marginTop: '1px',
        }}
      >
        <ModusWcIcon
          name={enabled ? 'visibility_on' : 'visibility_off'}
          size="xs"
          decorative
          style={{
            color: enabled
              ? '#ffffff'
              : 'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)',
          }}
        />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 13.5px)',
            color: enabled
              ? 'var(--modus-wc-color-base-content, #101828)'
              : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            lineHeight: 1.25,
          }}
        >
          {move.title}
        </span>
        <span
          style={{
            fontSize: '11.5px',
            color: enabled
              ? 'var(--modus-wc-color-base-content-low-contrast, #4a5565)'
              : 'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {move.description}
        </span>
      </div>
    </button>
  );
}

/* ── chat-bar pill (context only) ───────────────────────────────── */

function ChatBarPill() {
  return (
    <div
      className="flex items-center gap-1.5 pl-2 pr-1.5 py-1.5"
      style={{
        width: '100%',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        borderRadius: '999px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: '32px', height: '32px' }}
        aria-hidden="true"
      >
        <ModusWcIcon
          name="link"
          size="sm"
          decorative
          style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
        />
      </div>
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: '32px', height: '32px' }}
        aria-hidden="true"
      >
        <ModusWcIcon
          name="tools"
          size="sm"
          decorative
          style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
        />
      </div>
      <span
        className="flex-1 truncate"
        style={{
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)',
          padding: '0 6px',
        }}
      >
        Ask Trimble AI to refine this direction…
      </span>
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: '34px',
          height: '34px',
          backgroundColor: 'var(--modus-wc-color-primary, #0063A7)',
        }}
        aria-hidden="true"
      >
        <ModusWcIcon
          name="arrow_right"
          size="sm"
          decorative
          style={{ color: '#ffffff' }}
        />
      </div>
    </div>
  );
}

/* ── host component ─────────────────────────────────────────────── */

export default function Creative3() {
  const [activeId, setActiveId] = useState<PlanId>('open');
  const [enabled, setEnabled] = useState<Set<string>>(DEFAULT_ENABLED);
  const [chosenId, setChosenId] = useState<PlanId | null>(null);

  const active = DIRECTIONS.find((d) => d.id === activeId)!;
  const chosen = DIRECTIONS.find((d) => d.id === chosenId) ?? null;
  const activeIsChosen = chosenId === active.id;
  const activeOnCount = active.moves.filter((m) =>
    enabled.has(moveKey(active.id, m.id))
  ).length;

  const toggleMove = (dirId: PlanId, moveId: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      const key = moveKey(dirId, moveId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleChoice = () => {
    setChosenId((prev) => (prev === active.id ? null : active.id));
  };

  return (
    <div
      className="flex flex-col items-stretch gap-4"
      style={{ width: '820px' }}
    >
      {/* small AI label */}
      <div className="flex items-center gap-2 self-start">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'var(--modus-wc-color-primary, #0063A7)',
          }}
        >
          <ModusWcIcon
            name="lightbulb"
            size="xs"
            decorative
            style={{ color: '#ffffff' }}
          />
        </div>
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            margin: 0,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: 'var(--modus-wc-color-base-content, #364153)',
            }}
          >
            Trimble AI
          </span>
          {' · '}
          {chosen
            ? `Locked in: ${chosen.name}. Keep refining its moves, or pick a different direction.`
            : '5 divergent directions — open one and toggle its signature moves. Switch any time.'}
        </span>
      </div>

      {/* SWITCHER ROW — 5 chips, 1 active, other 4 quiet switchers */}
      <div className="flex gap-2 justify-between">
        {DIRECTIONS.map((d) => (
          <SwitcherChip
            key={d.id}
            direction={d}
            active={d.id === activeId}
            chosen={d.id === chosenId}
            onClick={() => setActiveId(d.id)}
          />
        ))}
      </div>

      {/* CENTRAL DETAIL PANEL — only the active direction lives here */}
      <div
        className="flex flex-col gap-4 p-5 rounded-2xl"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          boxShadow:
            '0 18px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        {/* header */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: active.accentSoft,
            }}
          >
            <ModusWcIcon
              name={active.icon}
              decorative
              style={{ color: active.accent }}
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-md, 16px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
                lineHeight: 1.25,
              }}
            >
              {active.name}
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12.5px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                margin: 0,
              }}
            >
              {active.philosophy}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span
              className="rounded-full px-2.5 py-1"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: active.accent,
                backgroundColor: active.accentSoft,
              }}
            >
              {activeOnCount} of {active.moves.length} moves on
            </span>
          </div>
        </div>

        {/* body: SVG (left) + toggle stack (right) */}
        <div className="flex gap-4">
          {/* live kitchen plan */}
          <div
            className="rounded-xl overflow-hidden shrink-0"
            style={{
              width: '440px',
              height: '300px',
              backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
              border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              padding: '8px',
            }}
          >
            <LivePlan direction={active} enabled={enabled} />
          </div>

          {/* move toggles */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 11.5px)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  margin: 0,
                }}
              >
                Signature moves
              </span>
              <button
                type="button"
                onClick={() => {
                  setEnabled((prev) => {
                    const next = new Set(prev);
                    const allOn = active.moves.every((m) =>
                      next.has(moveKey(active.id, m.id))
                    );
                    active.moves.forEach((m) => {
                      const k = moveKey(active.id, m.id);
                      if (allOn) next.delete(k);
                      else next.add(k);
                    });
                    return next;
                  });
                }}
                style={{
                  fontSize: '11px',
                  color: active.accent,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                {activeOnCount === active.moves.length ? 'Hide all' : 'Show all'}
              </button>
            </div>
            {active.moves.map((m) => (
              <MoveToggle
                key={m.id}
                move={m}
                enabled={enabled.has(moveKey(active.id, m.id))}
                accent={active.accent}
                accentSoft={active.accentSoft}
                onToggle={() => toggleMove(active.id, m.id)}
              />
            ))}
          </div>
        </div>

        {/* footer — single primary commit action */}
        <div
          className="flex items-center justify-between gap-3 pt-3"
          style={{
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            marginTop: '2px',
          }}
        >
          <span
            className="flex items-center gap-2 min-w-0"
            style={{
              fontSize: '12px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              margin: 0,
            }}
          >
            {activeIsChosen ? (
              <>
                <ModusWcIcon
                  name="check_circle"
                  size="sm"
                  decorative
                  style={{ color: active.accent }}
                />
                <span className="truncate">
                  <span style={{ fontWeight: 600, color: active.accent }}>
                    {active.name}
                  </span>{' '}
                  is locked in with {activeOnCount} of {active.moves.length}{' '}
                  signature moves.
                </span>
              </>
            ) : (
              <span className="truncate">
                Commit when you&rsquo;re ready — you can change your mind anytime.
              </span>
            )}
          </span>

          <ModusWcButton
            color="primary"
            variant={activeIsChosen ? 'outlined' : 'filled'}
            size="md"
            onButtonClick={toggleChoice}
          >
            {activeIsChosen ? (
              <span className="flex items-center gap-1.5">
                <ModusWcIcon name="check" size="xs" decorative />
                Chosen — undo
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Choose {active.name}
                <ModusWcIcon name="arrow_right" size="xs" decorative />
              </span>
            )}
          </ModusWcButton>
        </div>
      </div>

      {/* chat-bar pill */}
      <ChatBarPill />
    </div>
  );
}
