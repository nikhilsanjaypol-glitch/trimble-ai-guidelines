import { useMemo, useState } from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 4 — SUPPORT INTERVENTION
 *
 * "The professional must remain the ultimate authority. Provide
 *  tools to MODIFY, REVERT, or OVERRIDE the final output. By
 *  integrating results with UNDO/REDO and AUDIT capabilities,
 *  users can take full accountability for the work as its owner."
 *
 * One focused card. Every clause of the principle has a visible
 * surface:
 *   · The author chip names who currently owns the value (AI / YOU)
 *   · Three tile buttons expose Modify · Revert · Override directly
 *   · Header icons offer Undo / Redo across the version stack
 *   · Footer ribbon shows the version count and opens the audit log
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

const AI_VALUE = '65';
const UNIT = 'Nm';

type Author = 'ai' | 'you';
type Mode = 'idle' | 'modifying' | 'overriding';

interface Version {
  value: string;
  author: Author;
  reason?: string;
  label: string;
  time: string;
}

const INITIAL_VERSION: Version = {
  value: AI_VALUE,
  author: 'ai',
  label: 'AI proposal',
  time: '09:42',
};

function nowLabel(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

/* ── Mini Trimble AI logo ───────────────────────────────────────── */
function TrimbleAiLogo({ size = 16 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 30.002 32.6797" width="100%" height="100%" fill="none">
        <defs>
          <linearGradient
            id="pro4-logo"
            x1="3.7558"
            y1="10.5251"
            x2="20.4332"
            y2="30.2565"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF2BFC" />
            <stop offset="0.628993" stopColor="#0563A7" />
            <stop offset="1" stopColor="#075CA4" />
          </linearGradient>
        </defs>
        <path
          d="M1.69824 24.9697C3.48353 26.9109 5.82653 28.2524 8.4043 28.8096L1.69824 32.6797V24.9697ZM10.6523 5.60742C16.5357 5.60742 21.3057 10.3803 21.3057 16.2676C21.3055 22.1547 16.5356 26.9268 10.6523 26.9268C4.76928 26.9265 0.00017177 22.1545 0 16.2676C0 10.3805 4.76918 5.60766 10.6523 5.60742ZM10.6523 7.69238C5.9201 7.69263 2.08398 11.5321 2.08398 16.2676C2.08416 21.0029 5.92021 24.8416 10.6523 24.8418C15.3847 24.8418 19.2215 21.003 19.2217 16.2676C19.2217 11.532 15.3848 7.69238 10.6523 7.69238ZM30.002 16.3398L23.2803 20.2217C24.0854 17.7019 24.0922 14.9945 23.2998 12.4707L30.002 16.3398ZM8.35547 3.83691C5.79861 4.40439 3.47535 5.73916 1.69824 7.66309V0L8.35547 3.83691Z"
          fill="url(#pro4-logo)"
        />
      </svg>
    </span>
  );
}

/* ── Author chip on the right of the value ─────────────────────── */
function AuthorChip({ author }: { author: Author }) {
  if (author === 'ai') {
    return (
      <span
        className="inline-flex items-center gap-1.5"
        style={{
          height: '24px',
          padding: '0 10px 0 6px',
          borderRadius: '1000px',
          backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          fontWeight: 700,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
        }}
      >
        <TrimbleAiLogo size={14} />
        AI authored
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        height: '24px',
        padding: '2px',
        borderRadius: '1000px',
        background: TRIMBLE_RAINBOW,
      }}
    >
      <span
        className="inline-flex items-center gap-1.5"
        style={{
          height: '20px',
          padding: '0 10px',
          borderRadius: '1000px',
          backgroundColor: '#ffffff',
          color: 'var(--modus-wc-color-base-content, #171c1e)',
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          fontWeight: 700,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
        }}
      >
        Authored by you
      </span>
    </span>
  );
}

/* ── Tile button (one per intervention tool) ────────────────────── */
type Tone = 'primary' | 'neutral' | 'warning';

const TONE_TOKENS: Record<
  Tone,
  { fg: string; bg: string; border: string; bgHover: string }
> = {
  primary: {
    fg: 'var(--modus-wc-color-primary, #0063a3)',
    bg: 'rgba(0, 99, 163, 0.06)',
    border: 'rgba(0, 99, 163, 0.30)',
    bgHover: 'rgba(0, 99, 163, 0.12)',
  },
  neutral: {
    fg: 'var(--modus-wc-color-base-content, #171c1e)',
    bg: 'var(--modus-wc-color-base-100, #f1f1f6)',
    border: 'var(--modus-wc-color-base-200, #e0e1e9)',
    bgHover: 'var(--modus-wc-color-base-200, #e0e1e9)',
  },
  warning: {
    fg: 'var(--modus-wc-color-status-warning, #985200)',
    bg: 'rgba(152, 82, 0, 0.06)',
    border: 'rgba(152, 82, 0, 0.30)',
    bgHover: 'rgba(152, 82, 0, 0.12)',
  },
};

function InterventionTile({
  icon,
  label,
  helper,
  tone,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  helper: string;
  tone: Tone;
  disabled?: boolean;
  onClick: () => void;
}) {
  const t = TONE_TOKENS[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start gap-1 text-left transition-colors"
      style={{
        flex: 1,
        padding: '10px',
        borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
        border: `1px solid ${t.border}`,
        backgroundColor: t.bg,
        color: t.fg,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.backgroundColor = t.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = t.bg;
      }}
    >
      <span
        className="flex items-center justify-center rounded-md"
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: '#ffffff',
        }}
      >
        <ModusWcIcon name={icon} size="xs" decorative style={{ color: t.fg }} />
      </span>
      <span
        className="font-semibold"
        style={{
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          color: 'var(--modus-wc-color-base-content, #171c1e)',
          marginTop: '2px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          lineHeight: '14px',
        }}
      >
        {helper}
      </span>
    </button>
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
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: 'transparent',
        color: disabled
          ? 'var(--modus-wc-color-base-content-low-contrast, #b0b3bd)'
          : 'var(--modus-wc-color-base-content, #171c1e)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
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

/* ── Pro 4 — Support Intervention ───────────────────────────────── */
export default function Pro4() {
  const [history, setHistory] = useState<Version[]>([INITIAL_VERSION]);
  const [pointer, setPointer] = useState(0);
  const [mode, setMode] = useState<Mode>('idle');
  const [auditOpen, setAuditOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [reason, setReason] = useState('');

  const current = history[pointer];
  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;

  const totalEdits = useMemo(
    () => history.filter((v) => v.author === 'you').length,
    [history],
  );

  function pushVersion(version: Version) {
    const next = [...history.slice(0, pointer + 1), version];
    setHistory(next);
    setPointer(next.length - 1);
  }

  function startModify() {
    setDraft(current.value);
    setMode('modifying');
  }

  function startOverride() {
    setDraft(current.value);
    setReason('');
    setMode('overriding');
  }

  function commitModify() {
    const v = draft.trim();
    if (v === '') return;
    pushVersion({
      value: v,
      author: 'you',
      label: 'Modified',
      time: nowLabel(),
    });
    setMode('idle');
  }

  function commitOverride() {
    const v = draft.trim();
    const r = reason.trim();
    if (v === '' || r === '') return;
    pushVersion({
      value: v,
      author: 'you',
      label: 'Override',
      reason: r,
      time: nowLabel(),
    });
    setMode('idle');
  }

  function revertToAi() {
    pushVersion({
      value: AI_VALUE,
      author: 'you',
      label: 'Reverted to AI',
      time: nowLabel(),
    });
  }

  function undo() {
    if (!canUndo) return;
    setPointer((p) => p - 1);
  }

  function redo() {
    if (!canRedo) return;
    setPointer((p) => p + 1);
  }

  return (
    <div
      className="bg-white shrink-0 flex flex-col"
      style={{
        width: '380px',
        borderRadius: '16px',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow:
          '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -10px rgba(0,0,0,0.10)',
      }}
    >
      {/* ── Header: spec context + undo/redo ───────────────────── */}
      <div
        className="flex items-center justify-between gap-2"
        style={{ padding: '14px 16px 8px' }}
      >
        <div className="flex flex-col min-w-0">
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
            Bolt M16 · grade 8.8
          </span>
          <span
            className="font-semibold"
            style={{
              fontSize: 'var(--modus-wc-font-size-md, 16px)',
              color: 'var(--modus-wc-color-base-content, #101828)',
              marginTop: '2px',
            }}
          >
            Torque spec
          </span>
        </div>
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

      {/* ── Value + author chip ─────────────────────────────────── */}
      <div
        className="flex items-end justify-between gap-3"
        style={{ padding: '0 16px 4px' }}
      >
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span
            className="font-semibold tabular-nums"
            style={{
              fontSize: '38px',
              lineHeight: '40px',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.6px',
            }}
          >
            {current.value}
          </span>
          <span
            className="font-semibold"
            style={{
              fontSize: 'var(--modus-wc-font-size-md, 16px)',
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            {UNIT}
          </span>
        </div>
        <AuthorChip author={current.author} />
      </div>

      {/* ── Reason (AI rationale or override note) ──────────────── */}
      <p
        style={{
          margin: 0,
          padding: '4px 16px 14px',
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
          lineHeight: '18px',
        }}
      >
        {current.reason ? (
          <>
            <span style={{ fontWeight: 700, color: 'var(--modus-wc-color-status-warning, #985200)' }}>
              Override reason:
            </span>{' '}
            {current.reason}
          </>
        ) : current.author === 'ai' ? (
          'AI lowered torque after detecting fastener-fatigue risk in the updated load case.'
        ) : (
          'Your value owns this spec.'
        )}
      </p>

      {/* ── Inline state: Modify / Override / 3 tools ───────────── */}
      {mode === 'modifying' && (
        <div
          className="flex flex-col gap-2"
          style={{
            margin: '0 16px',
            padding: '12px',
            borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
            backgroundColor: 'rgba(0, 99, 163, 0.05)',
            border: '1px solid rgba(0, 99, 163, 0.25)',
          }}
        >
          <ModusWcTextInput
            label="Your value"
            value={draft}
            size="sm"
            onInputChange={(e: CustomEvent) =>
              setDraft(e.detail?.target?.value ?? '')
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
              disabled={draft.trim() === '' || undefined}
              onButtonClick={commitModify}
            >
              Save my value
            </ModusWcButton>
          </div>
        </div>
      )}

      {mode === 'overriding' && (
        <div
          className="flex flex-col gap-2"
          style={{
            margin: '0 16px',
            padding: '12px',
            borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
            backgroundColor: 'rgba(152, 82, 0, 0.06)',
            border: '1px solid rgba(152, 82, 0, 0.30)',
          }}
        >
          <ModusWcTextInput
            label="Forced value"
            value={draft}
            size="sm"
            onInputChange={(e: CustomEvent) =>
              setDraft(e.detail?.target?.value ?? '')
            }
          />
          <ModusWcTextInput
            label="Reason (recorded)"
            value={reason}
            size="sm"
            placeholder="e.g. Site standard supersedes AI"
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
                draft.trim() === '' || reason.trim() === '' || undefined
              }
              onButtonClick={commitOverride}
            >
              <span className="flex items-center gap-1">
                <ModusWcIcon name="block" size="xs" decorative />
                Override AI
              </span>
            </ModusWcButton>
          </div>
        </div>
      )}

      {mode === 'idle' && (
        <div
          className="flex items-stretch gap-2"
          style={{ padding: '0 16px' }}
        >
          <InterventionTile
            icon="edit_combination"
            label="Modify"
            helper="Edit the value"
            tone="primary"
            onClick={startModify}
          />
          <InterventionTile
            icon="refresh"
            label="Revert"
            helper="Restore AI value"
            tone="neutral"
            disabled={current.value === AI_VALUE && current.author === 'ai'}
            onClick={revertToAi}
          />
          <InterventionTile
            icon="block"
            label="Override"
            helper="Force with reason"
            tone="warning"
            onClick={startOverride}
          />
        </div>
      )}

      {/* ── Footer: audit ribbon ────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-2"
        style={{
          marginTop: '14px',
          padding: '10px 16px',
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          backgroundColor: 'var(--modus-wc-color-base-100, #f8f9fa)',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
        }}
      >
        <span
          className="inline-flex items-center gap-1.5"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.2px',
          }}
        >
          <ModusWcIcon
            name="lock"
            size="xs"
            decorative
            style={{
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          />
          v{pointer + 1} · {totalEdits} of your edits
        </span>
        <button
          type="button"
          onClick={() => setAuditOpen((v) => !v)}
          className="inline-flex items-center gap-1"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--modus-wc-color-primary, #0063a3)',
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            fontWeight: 700,
            letterSpacing: '0.2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {auditOpen ? 'Hide audit' : 'View audit'}
          <ModusWcIcon
            name={auditOpen ? 'chevron_up' : 'chevron_down'}
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
          />
        </button>
      </div>

      {/* ── Audit log (collapsible) ─────────────────────────────── */}
      {auditOpen && (
        <div
          className="flex flex-col"
          style={{
            maxHeight: '160px',
            overflowY: 'auto',
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            backgroundColor: '#ffffff',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
          }}
        >
          {history
            .slice()
            .reverse()
            .map((v, i, arr) => {
              const idx = arr.length - 1 - i;
              const isCurrent = idx === pointer;
              return (
                <div
                  key={`v-${idx}`}
                  className="flex items-start gap-2"
                  style={{
                    padding: '8px 16px',
                    borderTop:
                      i === 0
                        ? 'none'
                        : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                    backgroundColor: isCurrent
                      ? 'rgba(0, 99, 163, 0.04)'
                      : 'transparent',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                      fontWeight: 600,
                      color:
                        'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                      width: '40px',
                      flexShrink: 0,
                      paddingTop: '2px',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {v.time}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 shrink-0"
                    style={{
                      height: '18px',
                      padding: '0 6px',
                      borderRadius: '1000px',
                      backgroundColor:
                        v.author === 'ai'
                          ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                          : 'rgba(0, 99, 163, 0.10)',
                      color:
                        v.author === 'ai'
                          ? 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)'
                          : 'var(--modus-wc-color-primary, #0063a3)',
                      fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                      fontWeight: 700,
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {v.author === 'ai' ? 'AI' : 'YOU'}
                  </span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span
                      style={{
                        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                        fontWeight: 600,
                        color: 'var(--modus-wc-color-base-content, #171c1e)',
                        lineHeight: '18px',
                      }}
                    >
                      {v.label} · {v.value} {UNIT}
                    </span>
                    {v.reason && (
                      <span
                        style={{
                          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                          color:
                            'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                          lineHeight: '14px',
                          marginTop: '2px',
                        }}
                      >
                        {v.reason}
                      </span>
                    )}
                  </div>
                  {isCurrent && (
                    <span
                      style={{
                        fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                        fontWeight: 700,
                        color: 'var(--modus-wc-color-primary, #0063a3)',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
