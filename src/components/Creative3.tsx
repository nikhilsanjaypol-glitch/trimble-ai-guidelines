import {
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Guideline: PROVIDE OPTIONS
 *   Provide multiple divergent options so the professional can give
 *   creative direction and keep a sense of creative control.
 *
 * Component: GALLERY → DETAIL
 *   Two screens, one component.
 *
 *   OVERVIEW screen:
 *     Five divergent kitchen directions sit side-by-side as
 *     thumbnails. Each thumbnail shows a mini live kitchen-plan
 *     preview, the direction name, its philosophy, and an "Open"
 *     affordance. Clicking a thumbnail zooms into the DETAIL view
 *     for that direction.
 *
 *   DETAIL screen:
 *     One direction is opened in full — large kitchen-plan SVG with
 *     live, toggleable signature-move layers (Photoshop-style), an
 *     N-of-3 status chip, and a single primary "Choose this" button
 *     in the footer. A quiet "← Back to all 5 options" link returns
 *     to the overview without losing any toggle or choice state.
 *
 *   State preservation across navigation is the "creative control"
 *   part of the guideline made literal: every customisation the
 *   professional makes survives every screen change.
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
    icon: 'sun',
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
    icon: 'forestry',
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

/* ── overview thumbnail (1 of 5 on the first screen) ────────────── */

function ThumbnailCard({
  direction,
  chosen,
  onOpen,
}: {
  direction: Direction;
  chosen: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-3 p-3 rounded-xl text-left"
      style={{
        width: '152px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: chosen
          ? `1.5px solid ${direction.accent}`
          : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: chosen
          ? `0 0 0 2px ${direction.accentSoft}, 0 1px 3px rgba(0,0,0,0.04)`
          : '0 1px 2px rgba(0,0,0,0.03)',
        cursor: 'pointer',
        transition:
          'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = chosen
          ? `0 0 0 2px ${direction.accentSoft}, 0 4px 10px rgba(0,0,0,0.06)`
          : '0 4px 10px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = chosen
          ? `0 0 0 2px ${direction.accentSoft}, 0 1px 3px rgba(0,0,0,0.04)`
          : '0 1px 2px rgba(0,0,0,0.03)';
      }}
    >
      {/* mini live plan preview */}
      <div
        className="rounded-md overflow-hidden relative"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
          padding: '4px',
          height: '88px',
        }}
      >
        <LivePlan direction={direction} enabled={DEFAULT_ENABLED} />
        {chosen && (
          <div
            className="absolute flex items-center gap-1 rounded-full px-1.5 py-0.5"
            style={{
              top: '6px',
              right: '6px',
              backgroundColor: direction.accent,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <ModusWcIcon
              name="check"
              size="xs"
              decorative
              style={{ color: '#ffffff' }}
            />
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#ffffff',
              }}
            >
              Chosen
            </span>
          </div>
        )}
      </div>

      {/* icon + name */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-md shrink-0"
          style={{
            width: '26px',
            height: '26px',
            backgroundColor: direction.accentSoft,
          }}
        >
          <ModusWcIcon
            name={direction.icon}
            size="xs"
            decorative
            style={{ color: direction.accent }}
          />
        </div>
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
      </div>

      {/* philosophy */}
      <span
        style={{
          fontSize: '11.5px',
          color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
          lineHeight: 1.45,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {direction.philosophy}
      </span>

      {/* open affordance */}
      <div
        className="mt-auto flex items-center justify-between pt-2"
        style={{
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          {direction.moves.length} moves
        </span>
        <span
          className="flex items-center gap-1"
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: direction.accent,
          }}
        >
          Open
          <ModusWcIcon
            name="arrow_right"
            size="xs"
            decorative
            style={{ color: direction.accent }}
          />
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

/* ── prompt bar (Figma node 549:61090, copy-pasted) ─────────────── */

function PromptBar() {
  return (
    <div
      className="flex flex-col items-center justify-end w-full"
      style={{
        backgroundColor: 'transparent',
        gap: '4px',
        paddingTop: '12px',
        paddingBottom: '0px',
      }}
      data-name="Prompt"
    >
      {/* _Prompt/Base — rainbow gradient border (Figma 549:61093) */}
      <div
        className="flex items-center justify-between w-full overflow-hidden"
        style={{
          height: '42px',
          border: '2px solid transparent',
          borderRadius: '12px',
          padding: '4px',
          backgroundImage:
            'linear-gradient(var(--modus-wc-color-base-page, #f5f6fa), var(--modus-wc-color-base-page, #f5f6fa)), ' +
            'linear-gradient(90deg, #00d7c0 0%, #0094f0 35%, #b73efa 68%, #ff5a8c 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
        data-name="_Prompt/Base"
      >
        {/* Text input — grows to fill the bar, sized to sit inside the rainbow border */}
        <div
          className="prompt-bar-input flex-1 min-w-0"
          style={{ display: 'flex', background: 'transparent' }}
        >
          <ModusWcTextInput
            size="sm"
            placeholder="How can I help you?"
            bordered={false}
            style={{
              flex: 1,
              width: '100%',
              display: 'block',
              background: 'transparent',
            }}
          />
        </div>

        {/* Basic Actions — Figma icon buttons */}
        <div
          className="flex items-center shrink-0"
          style={{ gap: '0px' }}
          data-name="Basic Actions"
        >
          <button
            type="button"
            aria-label="Add attachment"
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <img
              src="/assets/prompt-add.png"
              alt=""
              aria-hidden="true"
              style={{ width: '32px', height: '30px', display: 'block' }}
            />
          </button>
          <button
            type="button"
            aria-label="Send prompt"
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <img
              src="/assets/prompt-send.png"
              alt=""
              aria-hidden="true"
              style={{ width: '32px', height: '30px', display: 'block' }}
            />
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="flex flex-wrap items-center w-full"
        style={{ paddingLeft: '4px', paddingRight: '4px', gap: '8px' }}
        data-name="Disclaimer"
      >
        <p
          style={{
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: 600,
            fontSize: '10px',
            lineHeight: '16px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          AI can make mistakes.
        </p>
        <button
          type="button"
          style={{
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: 600,
            fontSize: '10px',
            lineHeight: '16px',
            color: 'var(--modus-wc-color-primary, #0063A7)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Acceptable Use
        </button>
      </div>
    </div>
  );
}

/* ── host component ─────────────────────────────────────────────── */

type ViewMode = 'overview' | 'detail';

export default function Creative3() {
  const [view, setView] = useState<ViewMode>('overview');
  const [activeId, setActiveId] = useState<PlanId | null>(null);
  const [enabled, setEnabled] = useState<Set<string>>(DEFAULT_ENABLED);
  const [chosenId, setChosenId] = useState<PlanId | null>(null);

  const active = activeId
    ? DIRECTIONS.find((d) => d.id === activeId) ?? null
    : null;
  const chosen = DIRECTIONS.find((d) => d.id === chosenId) ?? null;

  const openDetail = (id: PlanId) => {
    setActiveId(id);
    setView('detail');
  };

  const backToOverview = () => {
    setView('overview');
  };

  /* Cycle through DIRECTIONS in either direction; wraps at both ends so
     the prev/next arrows never disable, matching a carousel feel.     */
  const stepActive = (delta: 1 | -1) => {
    if (!activeId) return;
    const idx = DIRECTIONS.findIndex((d) => d.id === activeId);
    if (idx < 0) return;
    const nextIdx = (idx + delta + DIRECTIONS.length) % DIRECTIONS.length;
    setActiveId(DIRECTIONS[nextIdx].id);
  };

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
    if (!active) return;
    setChosenId((prev) => (prev === active.id ? null : active.id));
  };

  return (
    <div
      className="flex flex-col items-stretch gap-4"
      style={{ width: '820px' }}
    >
      {/* small AI label — adapts to current view + chosen state */}
      <div className="flex items-center gap-2 self-start">
        <img
          src="/assets/trimble-ai-logo.png"
          alt=""
          aria-hidden="true"
          style={{
            height: '36px',
            width: 'auto',
            flexShrink: 0,
            objectFit: 'contain',
            display: 'flex',
            textAlign: 'left',
            flexWrap: 'wrap',
            marginLeft: '-12px',
            marginRight: '-12px',
          }}
          data-name="Trimble AI Logo"
        />
        <span
          style={{
            fontSize: '14px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            marginTop: 0,
            marginBottom: 0,
            marginLeft: '2px',
            marginRight: '2px',
          }}
        >
          {view === 'overview'
            ? chosen
              ? `${chosen.name} is locked in. Open another option to compare, or revisit your choice.`
              : '5 divergent directions for your kitchen. Open any option to explore it in detail.'
            : active
              ? chosenId === active.id
                ? `${active.name} is locked in. Keep refining its moves or go back to compare.`
                : `Exploring ${active.name}. Toggle moves below, then commit — or head back to all options.`
              : ''}
        </span>
      </div>

      {view === 'overview' && (
        <OverviewScreen chosenId={chosenId} onOpen={openDetail} />
      )}

      {view === 'detail' && active && (
        <DetailScreen
          active={active}
          enabled={enabled}
          chosenId={chosenId}
          onToggleMove={toggleMove}
          onToggleChoice={toggleChoice}
          onSetEnabled={setEnabled}
          onBack={backToOverview}
          onPrev={() => stepActive(-1)}
          onNext={() => stepActive(1)}
          prevName={
            DIRECTIONS[
              (DIRECTIONS.findIndex((d) => d.id === active.id) -
                1 +
                DIRECTIONS.length) %
                DIRECTIONS.length
            ].name
          }
          nextName={
            DIRECTIONS[
              (DIRECTIONS.findIndex((d) => d.id === active.id) + 1) %
                DIRECTIONS.length
            ].name
          }
          position={DIRECTIONS.findIndex((d) => d.id === active.id) + 1}
          total={DIRECTIONS.length}
        />
      )}

      {/* prompt bar — sits directly below the cards */}
      <PromptBar />
    </div>
  );
}

/* ── overview screen ────────────────────────────────────────────── */

function OverviewScreen({
  chosenId,
  onOpen,
}: {
  chosenId: PlanId | null;
  onOpen: (id: PlanId) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
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
          Suggested directions
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)',
          }}
        >
          5 of 5 shown
        </span>
      </div>
      <div className="flex gap-3 justify-between">
        {DIRECTIONS.map((d) => (
          <ThumbnailCard
            key={d.id}
            direction={d}
            chosen={d.id === chosenId}
            onOpen={() => onOpen(d.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── detail screen (zoom-in target) ─────────────────────────────── */

function DetailScreen({
  active,
  enabled,
  chosenId,
  onToggleMove,
  onToggleChoice,
  onSetEnabled,
  onBack,
  onPrev,
  onNext,
  prevName,
  nextName,
  position,
  total,
}: {
  active: Direction;
  enabled: Set<string>;
  chosenId: PlanId | null;
  onToggleMove: (dirId: PlanId, moveId: string) => void;
  onToggleChoice: () => void;
  onSetEnabled: Dispatch<SetStateAction<Set<string>>>;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  prevName: string;
  nextName: string;
  position: number;
  total: number;
}) {
  const activeIsChosen = chosenId === active.id;
  const activeOnCount = active.moves.filter((m) =>
    enabled.has(moveKey(active.id, m.id))
  ).length;

  return (
    <div className="flex flex-col gap-3" style={{ animation: 'creative3-zoom 0.22s ease-out' }}>
      <style>{`
        @keyframes creative3-zoom {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* back to overview + current position */}
      <div className="flex items-center justify-between">
        <div className="creative3-back-btn">
          <ModusWcButton
            variant="outlined"
            color="tertiary"
            size="xs"
            onButtonClick={onBack}
            aria-label={`Back to all ${total} options`}
          >
            <ModusWcIcon
              name="chevron_left"
              size="xs"
              decorative
              style={{ marginRight: '2px' }}
            />
            Back to all {total} options
          </ModusWcButton>
        </div>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Option {position} of {total}
        </span>
      </div>

      {/* the detail panel, flanked by absolute prev/next nav arrows */}
      <div className="relative">
        <CarouselArrow
          direction="prev"
          label={`Previous option: ${prevName}`}
          onClick={onPrev}
        />
        <CarouselArrow
          direction="next"
          label={`Next option: ${nextName}`}
          onClick={onNext}
        />

        <div
          className="flex flex-col gap-4 p-5 rounded-2xl"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
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
                  onSetEnabled((prev) => {
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
                onToggle={() => onToggleMove(active.id, m.id)}
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
            onButtonClick={onToggleChoice}
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
      </div>
    </div>
  );
}

/* ── prev/next nav arrow used on either side of the detail panel ── */

function CarouselArrow({
  direction,
  label,
  onClick,
}: {
  direction: 'prev' | 'next';
  label: string;
  onClick: () => void;
}) {
  const isPrev = direction === 'prev';
  const baseColor =
    'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)';
  const restOpacity = 0.4;
  const hoverOpacity = 0.75;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '50%',
        [isPrev ? 'left' : 'right']: '-44px',
        transform: 'translateY(-50%)',
        padding: '8px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: baseColor,
        opacity: restOpacity,
        zIndex: 3,
        transition: 'opacity 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = String(hoverOpacity);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = String(restOpacity);
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points={isPrev ? '15 6 9 12 15 18' : '9 6 15 12 9 18'} />
      </svg>
    </button>
  );
}
