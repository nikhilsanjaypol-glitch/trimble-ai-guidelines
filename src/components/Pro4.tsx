import { useState } from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 4 — SUPPORT INTERVENTION
 *
 * The professional stays the ultimate authority. The AI proposes
 * an optimized fleet route (Trimble Maps); the user can Modify,
 * Revert, or Override at any point, with full undo / redo history.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

type Mode = 'idle' | 'modifying';
type AuthorityState = 'ai' | 'modified' | 'original' | 'accepted';

interface Version {
  state: AuthorityState;
}

const INITIAL_VERSION: Version = { state: 'ai' };

function previewBorder(state: AuthorityState): string {
  switch (state) {
    case 'ai':
      return TRIMBLE_RAINBOW;
    case 'modified':
      return 'var(--modus-wc-color-primary, #0063a3)';
    case 'accepted':
      return 'var(--modus-wc-color-status-success, #1e7e34)';
    case 'original':
    default:
      return 'var(--modus-wc-color-base-200, #e0e1e9)';
  }
}

/* ── Trimble Maps · Fleet route optimization ────────────────────── */
function FleetPreview() {
  const stops = [
    { x: 60, y: 60, n: '1' },
    { x: 160, y: 60, n: '2' },
    { x: 160, y: 130, n: '3' },
    { x: 250, y: 130, n: '4' },
    { x: 250, y: 200, n: '5' },
    { x: 60, y: 200, n: '6' },
  ];
  return (
    <svg
      viewBox="0 0 320 240"
      preserveAspectRatio="xMidYMid slice"
      className="block w-full h-full"
    >
      <rect width="320" height="240" fill="#f4ede0" />
      <ellipse cx="80" cy="100" rx="55" ry="32" fill="#cae0a8" opacity="0.55" />
      <ellipse cx="220" cy="170" rx="28" ry="14" fill="#a3c9e6" opacity="0.6" />
      <g stroke="#c9c3b6" strokeWidth="9" fill="none" strokeLinecap="round">
        <path d="M 10 60 L 310 60" />
        <path d="M 10 130 L 310 130" />
        <path d="M 10 200 L 310 200" />
        <path d="M 60 30 L 60 220" />
        <path d="M 160 30 L 160 220" />
        <path d="M 250 30 L 250 220" />
      </g>
      <g stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M 10 60 L 310 60" />
        <path d="M 10 130 L 310 130" />
        <path d="M 10 200 L 310 200" />
        <path d="M 60 30 L 60 220" />
        <path d="M 160 30 L 160 220" />
        <path d="M 250 30 L 250 220" />
      </g>
      <path
        d="M 60 60 L 160 60 L 160 130 L 250 130 L 250 200 L 60 200"
        stroke="#0063a3"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {stops.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="11" fill="rgba(0,99,163,0.18)" />
          <circle cx={s.x} cy={s.y} r="9" fill="#ffffff" stroke="#0063a3" strokeWidth="2" />
          <text x={s.x} y={s.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0063a3">{s.n}</text>
        </g>
      ))}
      <rect x="14" y="14" width="172" height="22" rx="4" fill="rgba(255,255,255,0.92)" />
      <text x="22" y="29" fontSize="10" fontWeight="700" fill="#0063a3" letterSpacing="0.5">ROUTE-12 · 6 STOPS · 28 MIN</text>
      <g transform="translate(294, 30)">
        <circle r="14" fill="#ffffff" stroke="#999" strokeWidth="0.7" />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="12"
          fontWeight="700"
          fill="#0063a3"
        >
          N
        </text>
      </g>
    </svg>
  );
}

/* ── Header icon button (undo / redo) ───────────────────────────── */
function HeaderIconButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center transition-colors"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'transparent',
        color: disabled
          ? 'var(--modus-wc-color-base-content-low-contrast, #b0b3bd)'
          : 'var(--modus-wc-color-base-content, #171c1e)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.backgroundColor =
          'var(--modus-wc-color-base-100, #f1f1f6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <ModusWcIcon name={icon} size="sm" decorative />
    </button>
  );
}

/* ── Tone tokens (used by every variant) ────────────────────────── */
type Tone = 'primary' | 'neutral' | 'success';

const TONE_TOKENS: Record<
  Tone,
  {
    iconFg: string;
    iconBg: string;
    border: string;
    tileBg: string;
    tileBgHover: string;
  }
> = {
  primary: {
    iconFg: '#ffffff',
    iconBg: 'var(--modus-wc-color-primary, #0063a3)',
    border: 'rgba(0, 99, 163, 0.22)',
    tileBg: 'rgba(0, 99, 163, 0.04)',
    tileBgHover: 'rgba(0, 99, 163, 0.10)',
  },
  neutral: {
    iconFg: 'var(--modus-wc-color-base-content, #171c1e)',
    iconBg: 'var(--modus-wc-color-base-100, #f1f1f6)',
    border: 'var(--modus-wc-color-base-200, #e0e1e9)',
    tileBg: '#ffffff',
    tileBgHover: 'var(--modus-wc-color-base-100, #f8f9fa)',
  },
  success: {
    iconFg: '#ffffff',
    iconBg: 'var(--modus-wc-color-status-success, #1e7e34)',
    border: 'rgba(30, 126, 52, 0.28)',
    tileBg: 'rgba(30, 126, 52, 0.04)',
    tileBgHover: 'rgba(30, 126, 52, 0.10)',
  },
};

interface ButtonHandlers {
  onModify: () => void;
  onRevert: () => void;
  onAccept: () => void;
  revertDisabled: boolean;
  acceptDisabled: boolean;
}

const BUTTONS: Array<{
  icon: string;
  label: string;
  helper: string;
  tone: Tone;
  action: keyof Pick<ButtonHandlers, 'onModify' | 'onRevert' | 'onAccept'>;
}> = [
  {
    icon: 'tune',
    label: 'Modify',
    helper: 'Edit the plan',
    tone: 'primary',
    action: 'onModify',
  },
  {
    icon: 'refresh',
    label: 'Revert',
    helper: 'Restore original',
    tone: 'neutral',
    action: 'onRevert',
  },
  {
    icon: 'check_circle',
    label: 'Accept',
    helper: 'Confirm as final',
    tone: 'success',
    action: 'onAccept',
  },
];

/* ── Intervention buttons (tinted tiles) ────────────────────────── */
function InterventionButtons(h: ButtonHandlers) {
  return (
    <div
      className="flex items-stretch gap-2"
      style={{ padding: '14px 16px 16px' }}
    >
      {BUTTONS.map((b) => {
        const t = TONE_TOKENS[b.tone];
        const disabled =
          (b.action === 'onRevert' && h.revertDisabled) ||
          (b.action === 'onAccept' && h.acceptDisabled);
        return (
          <button
            key={b.label}
            type="button"
            onClick={disabled ? undefined : h[b.action]}
            disabled={disabled}
            className="flex flex-col items-start gap-2 text-left transition-all"
            style={{
              flex: 1,
              padding: '16px 14px',
              borderRadius: '12px',
              border: `1px solid ${t.border}`,
              backgroundColor: t.tileBg,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.45 : 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              if (disabled) return;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 8px 18px -6px rgba(0,0,0,0.14)';
              e.currentTarget.style.backgroundColor = t.tileBgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
              e.currentTarget.style.backgroundColor = t.tileBg;
            }}
          >
            <span
              className="flex items-center justify-center rounded-lg"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: t.iconBg,
                boxShadow:
                  b.tone === 'neutral'
                    ? '0 1px 1px rgba(0,0,0,0.04)'
                    : '0 2px 6px -2px rgba(0,0,0,0.18)',
              }}
            >
              <ModusWcIcon
                name={b.icon}
                size="md"
                decorative
                style={{ color: t.iconFg }}
              />
            </span>
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-md, 16px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '20px',
                marginTop: '2px',
              }}
            >
              {b.label}
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 11px)',
                color:
                  'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                lineHeight: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              {b.helper}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Pro 4 Card (one per Trimble-product variant) ───────────────── */
function Pro4Card() {
  const [history, setHistory] = useState<Version[]>([INITIAL_VERSION]);
  const [pointer, setPointer] = useState(0);
  const [mode, setMode] = useState<Mode>('idle');
  const [draftSummary, setDraftSummary] = useState('');

  const current = history[pointer];
  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;

  function pushVersion(version: Version) {
    const next = [...history.slice(0, pointer + 1), version];
    setHistory(next);
    setPointer(next.length - 1);
  }

  function startModify() {
    setDraftSummary('');
    setMode('modifying');
  }
  function commitModify() {
    if (draftSummary.trim() === '') return;
    pushVersion({ state: 'modified' });
    setMode('idle');
  }
  function revert() {
    pushVersion({ state: 'original' });
  }
  function accept() {
    pushVersion({ state: 'accepted' });
  }
  function undo() {
    if (canUndo) setPointer((p) => p - 1);
  }
  function redo() {
    if (canRedo) setPointer((p) => p + 1);
  }

  const handlers: ButtonHandlers = {
    onModify: startModify,
    onRevert: revert,
    onAccept: accept,
    revertDisabled: current.state === 'original',
    acceptDisabled: current.state === 'accepted',
  };


  return (
    <div
      className="bg-white shrink-0 flex flex-col"
      style={{
        width: '380px',
        borderRadius: '16px',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow:
          '0 20px 50px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.05)',
      }}
    >
      {/* Title + undo/redo */}
      <div
        className="flex items-center justify-between gap-2"
        style={{ padding: '16px 16px 12px' }}
      >
        <span
          className="font-bold"
          style={{
            fontSize: 'var(--modus-wc-font-size-lg, 18px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            letterSpacing: '0.1px',
            fontWeight: 700,
          }}
        >
          Route optimization
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          <HeaderIconButton
            icon="undo"
            label="Undo"
            disabled={!canUndo}
            onClick={undo}
          />
          <HeaderIconButton
            icon="redo"
            label="Redo"
            disabled={!canRedo}
            onClick={redo}
          />
        </div>
      </div>

      {/* Visual centerpiece */}
      <div style={{ padding: '0 16px' }}>
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: '12px',
            padding: current.state === 'original' ? '1px' : '2px',
            ...(current.state === 'ai'
              ? {
                  backgroundImage: TRIMBLE_RAINBOW,
                  backgroundSize: '200% 100%',
                  animation:
                    'pro4RainbowShimmer 3.6s ease-in-out infinite',
                }
              : { background: previewBorder(current.state) }),
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: '10px',
              aspectRatio: '4 / 3',
              backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
            }}
          >
            <FleetPreview />
            {current.state === 'accepted' && (
              <div
                className="absolute"
                style={{
                  top: 10,
                  right: 10,
                  height: 24,
                  padding: '0 10px',
                  borderRadius: 1000,
                  backgroundColor: 'rgba(30, 126, 52, 0.92)',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                }}
              >
                <ModusWcIcon name="check_circle" size="xs" decorative />
                Accepted
              </div>
            )}
            {current.state === 'modified' && (
              <div
                className="absolute"
                style={{
                  top: 10,
                  right: 10,
                  height: 24,
                  padding: '0 10px',
                  borderRadius: 1000,
                  backgroundColor: 'rgba(0, 99, 163, 0.92)',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                }}
              >
                <ModusWcIcon name="edit" size="xs" decorative />
                Your edits
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline modify form */}
      {mode === 'modifying' && (
        <div
          className="flex flex-col gap-2"
          style={{
            margin: '14px 16px 16px',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 99, 163, 0.05)',
            border: '1px solid rgba(0, 99, 163, 0.25)',
          }}
        >
          <ModusWcTextInput
            label="What did you change?"
            value={draftSummary}
            size="sm"
            placeholder="e.g. Service stop 4 before 11 AM"
            onInputChange={(e: CustomEvent) =>
              setDraftSummary(e.detail?.target?.value ?? '')
            }
          />
          <div className="flex items-center justify-end gap-2">
            <ModusWcButton
              size="sm"
              color="tertiary"
              variant="outlined"
              onButtonClick={() => setMode('idle')}
            >
              Cancel
            </ModusWcButton>
            <ModusWcButton
              size="sm"
              color="primary"
              disabled={draftSummary.trim() === '' || undefined}
              onButtonClick={commitModify}
            >
              Save my plan
            </ModusWcButton>
          </div>
        </div>
      )}

      {/* Intervention buttons */}
      {mode === 'idle' && <InterventionButtons {...handlers} />}
    </div>
  );
}

export default function Pro4() {
  return (
    <>
      <style>{`
        @keyframes pro4RainbowShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <Pro4Card />
    </>
  );
}
