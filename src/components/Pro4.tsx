import type { ReactElement } from 'react';
import { useState } from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 4 — SUPPORT INTERVENTION
 *
 * The /pro4 route renders five identical cards stacked vertically,
 * one per button-layout variant, so the engineer can compare them
 * head-to-head and pick the one that wins.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

type Mode = 'idle' | 'modifying' | 'overriding';
type PathKind = 'ai' | 'modified' | 'original' | 'overridden';
type Variant = 'a' | 'b' | 'c' | 'd' | 'e';

interface Version {
  kind: PathKind;
  reason?: string;
}

const INITIAL_VERSION: Version = { kind: 'ai' };

/* ── Aerial backdrop (shared) ───────────────────────────────────── */
function FieldBackdrop() {
  return (
    <g>
      <rect x="0" y="0" width="320" height="200" fill="#8db35a" />
      <rect x="0" y="0" width="110" height="140" fill="#4f6a39" />
      <circle cx="40" cy="40" r="22" fill="#3f5a2c" />
      <circle cx="80" cy="58" r="18" fill="#446530" />
      <circle cx="20" cy="100" r="20" fill="#3f5a2c" />
      <circle cx="70" cy="118" r="16" fill="#446530" />
      <circle cx="100" cy="36" r="14" fill="#3f5a2c" />
      <rect x="0" y="140" width="320" height="60" fill="#a78f5f" />
      <rect x="110" y="128" width="210" height="14" fill="#bda072" opacity="0.9" />
      <path
        d="M0 170 L120 140 L320 145"
        stroke="#8b7142"
        strokeWidth="6"
        fill="none"
        opacity="0.55"
      />
      <g opacity="0.18" stroke="#5a7a3a" strokeWidth="1">
        {Array.from({ length: 28 }).map((_, i) => (
          <line key={i} x1={110 + i * 8} y1="0" x2={110 + i * 8} y2="140" />
        ))}
      </g>
    </g>
  );
}

function PathOverlay({ kind }: { kind: PathKind }) {
  if (kind === 'original') {
    return (
      <g stroke="#a8e670" strokeWidth="2.4" fill="none" strokeLinecap="round">
        {Array.from({ length: 8 }).map((_, i) => {
          const x = 130 + i * 20;
          return <line key={i} x1={x} y1="12" x2={x} y2="140" opacity={0.95} />;
        })}
      </g>
    );
  }
  const tightness = kind === 'modified' ? 16 : 18;
  const arc = kind === 'modified' ? -18 : -22;
  return (
    <g stroke="#a8e670" strokeWidth="2.4" fill="none" strokeLinecap="round">
      {Array.from({ length: 9 }).map((_, i) => {
        const x = 120 + i * tightness;
        return (
          <path
            key={i}
            d={`M ${x} 12 C ${x + 10} 60, ${x + arc} 110, ${x + 4} 140`}
            opacity={0.95}
          />
        );
      })}
    </g>
  );
}

function TractorMarker({ kind }: { kind: PathKind }) {
  if (kind === 'original') {
    return (
      <g transform="translate(170 88)">
        <rect x="-4" y="-6" width="8" height="46" fill="#13b9d9" opacity="0.9" />
        <polygon
          points="0,-30 -14,-6 14,-6"
          fill="#13b9d9"
          stroke="#ffffff"
          strokeWidth="1.4"
        />
      </g>
    );
  }
  return (
    <g transform="translate(192 92)">
      <polygon
        points="0,-14 -10,8 10,8"
        fill="#13b9d9"
        stroke="#ffffff"
        strokeWidth="1.4"
      />
    </g>
  );
}

function OverrideMarker() {
  return (
    <g transform="translate(245 50)">
      <circle r="14" fill="#ffffff" opacity="0.92" />
      <circle r="14" fill="rgba(152,82,0,0.18)" />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="700"
        fill="#985200"
      >
        !
      </text>
    </g>
  );
}

function PathMap({ kind }: { kind: PathKind }) {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      className="block w-full h-full"
    >
      <FieldBackdrop />
      <PathOverlay kind={kind} />
      <TractorMarker kind={kind} />
      {kind === 'overridden' && <OverrideMarker />}
    </svg>
  );
}

function previewBorder(kind: PathKind): string {
  switch (kind) {
    case 'ai':
      return TRIMBLE_RAINBOW;
    case 'modified':
      return 'var(--modus-wc-color-primary, #0063a3)';
    case 'overridden':
      return 'var(--modus-wc-color-status-warning, #985200)';
    case 'original':
    default:
      return 'var(--modus-wc-color-base-200, #e0e1e9)';
  }
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
type Tone = 'primary' | 'neutral' | 'warning';

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
  warning: {
    iconFg: '#ffffff',
    iconBg: 'var(--modus-wc-color-status-warning, #985200)',
    border: 'rgba(152, 82, 0, 0.28)',
    tileBg: 'rgba(152, 82, 0, 0.04)',
    tileBgHover: 'rgba(152, 82, 0, 0.10)',
  },
};

interface ButtonHandlers {
  onModify: () => void;
  onRevert: () => void;
  onOverride: () => void;
  revertDisabled: boolean;
}

const BUTTONS: Array<{
  icon: string;
  label: string;
  helper: string;
  tone: Tone;
  action: keyof Pick<ButtonHandlers, 'onModify' | 'onRevert' | 'onOverride'>;
}> = [
  {
    icon: 'edit_combination',
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
    icon: 'lock',
    label: 'Override',
    helper: 'Force with reason',
    tone: 'warning',
    action: 'onOverride',
  },
];

/* ── Variant A — Circular icon buttons ──────────────────────────── */
function ButtonsA(h: ButtonHandlers) {
  return (
    <div
      className="flex items-start justify-around"
      style={{ padding: '16px 16px 22px' }}
    >
      {BUTTONS.map((b) => {
        const t = TONE_TOKENS[b.tone];
        const isRevert = b.action === 'onRevert';
        const disabled = isRevert && h.revertDisabled;
        return (
          <button
            key={b.label}
            type="button"
            onClick={disabled ? undefined : h[b.action]}
            disabled={disabled}
            className="flex flex-col items-center gap-2 transition-transform"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.45 : 1,
            }}
            onMouseEnter={(e) => {
              if (disabled) return;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span
              className="flex items-center justify-center rounded-full"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: t.iconBg,
                boxShadow:
                  b.tone === 'neutral'
                    ? '0 1px 2px rgba(0,0,0,0.06), inset 0 0 0 1px var(--modus-wc-color-base-200, #e0e1e9)'
                    : '0 6px 14px -4px rgba(0,0,0,0.20)',
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
              className="font-bold"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '18px',
              }}
            >
              {b.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Variant B — Tinted tiles (current) ─────────────────────────── */
function ButtonsB(h: ButtonHandlers) {
  return (
    <div
      className="flex items-stretch gap-2"
      style={{ padding: '14px 16px 16px' }}
    >
      {BUTTONS.map((b) => {
        const t = TONE_TOKENS[b.tone];
        const isRevert = b.action === 'onRevert';
        const disabled = isRevert && h.revertDisabled;
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

/* ── Variant C — Stacked action rows ────────────────────────────── */
function ButtonsC(h: ButtonHandlers) {
  return (
    <div
      className="flex flex-col gap-2"
      style={{ padding: '14px 16px 16px' }}
    >
      {BUTTONS.map((b) => {
        const t = TONE_TOKENS[b.tone];
        const isRevert = b.action === 'onRevert';
        const disabled = isRevert && h.revertDisabled;
        return (
          <button
            key={b.label}
            type="button"
            onClick={disabled ? undefined : h[b.action]}
            disabled={disabled}
            className="flex items-center gap-3 text-left transition-colors"
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              border: `1px solid ${t.border}`,
              backgroundColor: t.tileBg,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.45 : 1,
            }}
            onMouseEnter={(e) => {
              if (disabled) return;
              e.currentTarget.style.backgroundColor = t.tileBgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = t.tileBg;
            }}
          >
            <span
              className="flex items-center justify-center rounded-md shrink-0"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: t.iconBg,
              }}
            >
              <ModusWcIcon
                name={b.icon}
                size="sm"
                decorative
                style={{ color: t.iconFg }}
              />
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <span
                className="font-bold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '18px',
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
                  marginTop: '2px',
                }}
              >
                {b.helper}
              </span>
            </div>
            <ModusWcIcon
              name="chevron_right"
              size="xs"
              decorative
              style={{
                color:
                  'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ── Variant D — Segmented toolbar ──────────────────────────────── */
function ButtonsD(h: ButtonHandlers) {
  return (
    <div style={{ padding: '14px 16px 16px' }}>
      <div
        className="flex items-stretch overflow-hidden"
        style={{
          borderRadius: '12px',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          backgroundColor: '#ffffff',
        }}
      >
        {BUTTONS.map((b, i) => {
          const t = TONE_TOKENS[b.tone];
          const isRevert = b.action === 'onRevert';
          const disabled = isRevert && h.revertDisabled;
          return (
            <button
              key={b.label}
              type="button"
              onClick={disabled ? undefined : h[b.action]}
              disabled={disabled}
              className="flex-1 flex flex-col items-center gap-1.5 transition-colors"
              style={{
                padding: '14px 4px',
                borderLeft:
                  i === 0
                    ? 'none'
                    : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                backgroundColor: 'transparent',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.45 : 1,
              }}
              onMouseEnter={(e) => {
                if (disabled) return;
                e.currentTarget.style.backgroundColor = t.tileBgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ModusWcIcon
                name={b.icon}
                size="md"
                decorative
                style={{ color: t.iconBg }}
              />
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 13px)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '18px',
                }}
              >
                {b.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Variant E — Hierarchy: primary + outlined ──────────────────── */
function ButtonsE(h: ButtonHandlers) {
  const tPrimary = TONE_TOKENS.primary;
  const tWarning = TONE_TOKENS.warning;
  return (
    <div className="flex gap-2" style={{ padding: '14px 16px 16px' }}>
      <button
        type="button"
        onClick={h.onModify}
        className="flex flex-col items-start text-left transition-all"
        style={{
          flex: 1.4,
          padding: '14px 16px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: tPrimary.iconBg,
          color: '#ffffff',
          cursor: 'pointer',
          boxShadow: '0 4px 12px -4px rgba(0, 99, 163, 0.40)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow =
            '0 8px 18px -6px rgba(0, 99, 163, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow =
            '0 4px 12px -4px rgba(0, 99, 163, 0.40)';
        }}
      >
        <span
          className="flex items-center justify-center rounded-lg"
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'rgba(255,255,255,0.18)',
            marginBottom: '8px',
          }}
        >
          <ModusWcIcon
            name="edit_combination"
            size="md"
            decorative
            style={{ color: '#ffffff' }}
          />
        </span>
        <span
          className="font-bold"
          style={{ fontSize: 16, color: '#ffffff', lineHeight: '20px' }}
        >
          Modify
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: '14px',
            marginTop: '2px',
          }}
        >
          Edit the plan
        </span>
      </button>

      <div className="flex-1 flex flex-col gap-2">
        <button
          type="button"
          onClick={h.revertDisabled ? undefined : h.onRevert}
          disabled={h.revertDisabled}
          className="flex items-center gap-2 transition-colors"
          style={{
            flex: 1,
            padding: '0 12px',
            borderRadius: '10px',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            backgroundColor: '#ffffff',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            cursor: h.revertDisabled ? 'not-allowed' : 'pointer',
            opacity: h.revertDisabled ? 0.45 : 1,
            fontWeight: 600,
            fontSize: 13,
          }}
          onMouseEnter={(e) => {
            if (h.revertDisabled) return;
            e.currentTarget.style.backgroundColor =
              'var(--modus-wc-color-base-100, #f8f9fa)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          <ModusWcIcon name="refresh" size="xs" decorative />
          Revert
        </button>
        <button
          type="button"
          onClick={h.onOverride}
          className="flex items-center gap-2 transition-colors"
          style={{
            flex: 1,
            padding: '0 12px',
            borderRadius: '10px',
            border: `1px solid ${tWarning.border}`,
            backgroundColor: '#ffffff',
            color: 'var(--modus-wc-color-status-warning, #985200)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = tWarning.tileBgHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          <ModusWcIcon
            name="lock"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-status-warning, #985200)' }}
          />
          Override
        </button>
      </div>
    </div>
  );
}

/* ── Pro 4 Card (one per variant) ───────────────────────────────── */
function Pro4Card({ variant }: { variant: Variant }) {
  const [history, setHistory] = useState<Version[]>([INITIAL_VERSION]);
  const [pointer, setPointer] = useState(0);
  const [mode, setMode] = useState<Mode>('idle');
  const [draftSummary, setDraftSummary] = useState('');
  const [reason, setReason] = useState('');

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
  function startOverride() {
    setDraftSummary('');
    setReason('');
    setMode('overriding');
  }
  function commitModify() {
    if (draftSummary.trim() === '') return;
    pushVersion({ kind: 'modified' });
    setMode('idle');
  }
  function commitOverride() {
    if (draftSummary.trim() === '' || reason.trim() === '') return;
    pushVersion({ kind: 'overridden', reason: reason.trim() });
    setMode('idle');
  }
  function revert() {
    pushVersion({ kind: 'original' });
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
    onOverride: startOverride,
    revertDisabled: current.kind === 'original',
  };

  const ButtonsByVariant: Record<Variant, (h: ButtonHandlers) => ReactElement> = {
    a: ButtonsA,
    b: ButtonsB,
    c: ButtonsC,
    d: ButtonsD,
    e: ButtonsE,
  };
  const ButtonsRenderer = ButtonsByVariant[variant];

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
          style={{
            fontSize: 'var(--modus-wc-font-size-lg, 18px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            letterSpacing: '0.1px',
            fontWeight: 500,
          }}
        >
          Path optimization
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
            padding: current.kind === 'original' ? '1px' : '2px',
            ...(current.kind === 'ai'
              ? {
                  backgroundImage: TRIMBLE_RAINBOW,
                  backgroundSize: '200% 100%',
                  animation:
                    'pro4RainbowShimmer 3.6s ease-in-out infinite',
                }
              : { background: previewBorder(current.kind) }),
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
            <PathMap kind={current.kind} />
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
            placeholder="e.g. Tightened row spacing by 0.4 m"
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

      {/* Inline override form */}
      {mode === 'overriding' && (
        <div
          className="flex flex-col gap-2"
          style={{
            margin: '14px 16px 16px',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(152, 82, 0, 0.06)',
            border: '1px solid rgba(152, 82, 0, 0.30)',
          }}
        >
          <ModusWcTextInput
            label="Forced plan"
            value={draftSummary}
            size="sm"
            placeholder="e.g. Switch to standard straight rows"
            onInputChange={(e: CustomEvent) =>
              setDraftSummary(e.detail?.target?.value ?? '')
            }
          />
          <ModusWcTextInput
            label="Reason (recorded)"
            value={reason}
            size="sm"
            placeholder="e.g. Equipment limitation"
            onInputChange={(e: CustomEvent) =>
              setReason(e.detail?.target?.value ?? '')
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
              color="warning"
              disabled={
                draftSummary.trim() === '' ||
                reason.trim() === '' ||
                undefined
              }
              onButtonClick={commitOverride}
            >
              <span className="flex items-center gap-1">
                <ModusWcIcon name="lock" size="xs" decorative />
                Override AI
              </span>
            </ModusWcButton>
          </div>
        </div>
      )}

      {/* Variant button section */}
      {mode === 'idle' && <ButtonsRenderer {...handlers} />}
    </div>
  );
}

/* ── Showcase: render all 5 variants stacked ────────────────────── */
const VARIANTS: Array<{ id: Variant; label: string; helper: string }> = [
  {
    id: 'a',
    label: 'Option A — Circular icon buttons',
    helper: 'Three large circles with white icons, label below. Matches the agriculture reference.',
  },
  {
    id: 'b',
    label: 'Option B — Tinted tiles (current)',
    helper: 'Side-by-side tiles, top-left icon badge, bold label, helper text.',
  },
  {
    id: 'c',
    label: 'Option C — Stacked action rows',
    helper: 'Three full-width rows, icon left, label + helper, chevron right.',
  },
  {
    id: 'd',
    label: 'Option D — Segmented toolbar',
    helper: 'Single rounded bar split into three segments, no gaps.',
  },
  {
    id: 'e',
    label: 'Option E — Hierarchy: primary + outlined',
    helper: 'Filled primary on the left, two slim outlined buttons stacked on the right.',
  },
];

export default function Pro4() {
  return (
    <div className="flex flex-col items-center" style={{ gap: '32px' }}>
      <style>{`
        @keyframes pro4RainbowShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {VARIANTS.map((v) => (
        <div key={v.id} className="flex flex-col items-center" style={{ gap: '10px' }}>
          <div
            className="flex flex-col items-center"
            style={{ width: '380px', gap: '4px' }}
          >
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 700,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color:
                  'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              {v.label}
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color:
                  'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                textAlign: 'center',
                lineHeight: '16px',
              }}
            >
              {v.helper}
            </span>
          </div>
          <Pro4Card variant={v.id} />
        </div>
      ))}
    </div>
  );
}
