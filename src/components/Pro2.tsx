import { useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 2 — PERFORM BITE-SIZED TASKS
 *
 * AI capabilities live on the 3D model itself — right-click an
 * element and the AI is offered as a set of "magic actions" with
 * bright, recognizable icons. Each action is a small, well-scoped
 * task the professional can trigger and verify one at a time, with
 * no typed prompts.
 * ───────────────────────────────────────────────────────────────── */

interface MagicAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  tint: string;
  shortcut: string;
}

const ACTIONS: MagicAction[] = [
  {
    id: 'cost',
    icon: 'calculator',
    label: 'Cost check',
    description: 'Estimate impact against the budget.',
    tint: '#1AB1A0',
    shortcut: '⌘1',
  },
  {
    id: 'conformance',
    icon: 'list_checkmark',
    label: 'Conformance check',
    description: 'Validate against project standards.',
    tint: '#0063A3',
    shortcut: '⌘2',
  },
  {
    id: 'organize',
    icon: 'sparkle',
    label: 'Auto-organize',
    description: 'Group, name, and tidy by type.',
    tint: '#7B2DFF',
    shortcut: '⌘3',
  },
  {
    id: 'issues',
    icon: 'alert_outline',
    label: 'Detect issues',
    description: 'Find clashes and missing data.',
    tint: '#E25C00',
    shortcut: '⌘4',
  },
];

export default function Pro2() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className="relative"
      style={{
        filter:
          'drop-shadow(0px 14px 28px rgba(0,0,0,0.18)) drop-shadow(0px 2px 4px rgba(0,0,0,0.10))',
      }}
    >
      {/* Pointer notch suggesting right-click anchor */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -6,
          left: 18,
          width: 12,
          height: 12,
          backgroundColor: '#ffffff',
          transform: 'rotate(45deg)',
          borderTopLeftRadius: 2,
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderLeft: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          zIndex: 0,
        }}
      />

      <div
        className="relative bg-white rounded-xl flex flex-col"
        style={{
          width: 300,
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        {/* Selection chip — proves the menu is anchored on a 3D element */}
        <div
          className="flex items-center gap-2 mx-2 mt-1 mb-2 rounded-md px-2.5"
          style={{
            height: 28,
            backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          }}
        >
          <ModusWcIcon
            name="dimensions"
            size="xs"
            decorative
            style={{
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          />
          <span
            className="flex-1 min-w-0 truncate"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
            }}
          >
            Wall 23 · Level 2
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.2px',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Curtain wall
          </span>
        </div>

        {/* Magic actions section header */}
        <div className="flex items-center gap-1.5 px-3 pt-1 pb-1.5">
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Magic actions
          </span>
          <span
            className="flex-1"
            aria-hidden="true"
            style={{
              height: 1,
              backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)',
            }}
          />
        </div>

        {/* Magic-icon rows */}
        <div className="flex flex-col px-1.5">
          {ACTIONS.map((action) => {
            const isHovered = hovered === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onMouseEnter={() => setHovered(action.id)}
                onMouseLeave={() => setHovered(null)}
                className="flex items-center gap-2.5 text-left rounded-md cursor-pointer"
                style={{
                  padding: '6px 8px',
                  backgroundColor: isHovered
                    ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                    : 'transparent',
                  border: 'none',
                  transition: 'background-color 120ms ease',
                }}
              >
                {/* Magic-icon tile */}
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: action.tint,
                    boxShadow: isHovered ? `0 0 0 3px ${action.tint}22` : 'none',
                    transition: 'box-shadow 120ms ease',
                  }}
                >
                  <ModusWcIcon
                    name={action.icon}
                    size="sm"
                    decorative
                    style={{ color: '#ffffff' }}
                  />
                </div>

                {/* Label + description */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: '18px',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {action.label}
                  </span>
                  <span
                    className="truncate"
                    style={{
                      fontSize: 11,
                      lineHeight: '16px',
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    }}
                  >
                    {action.description}
                  </span>
                </div>

                {/* Shortcut hint */}
                <span
                  className="shrink-0"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    letterSpacing: '0.3px',
                  }}
                >
                  {action.shortcut}
                </span>
              </button>
            );
          })}
        </div>

        {/* Standard menu items — anchor this as a native context menu */}
        <div
          className="mt-1 pt-1 mx-1.5"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          {[
            { icon: 'visibility_off', label: 'Hide element', shortcut: 'H' },
            { icon: 'settings_outline', label: 'Properties…', shortcut: '↵' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onMouseEnter={() => setHovered(item.label)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center gap-2.5 w-full text-left rounded-md cursor-pointer"
              style={{
                padding: '6px 8px',
                backgroundColor:
                  hovered === item.label
                    ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                    : 'transparent',
                border: 'none',
                transition: 'background-color 120ms ease',
              }}
            >
              <ModusWcIcon
                name={item.icon}
                size="sm"
                decorative
                style={{
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  width: 32,
                }}
              />
              <span
                className="flex-1"
                style={{
                  fontSize: 13,
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  letterSpacing: '0.3px',
                }}
              >
                {item.shortcut}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
