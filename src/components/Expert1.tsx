import { useMemo, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Expert 1 — LEAD THE CONVERSATION  (Troubleshooting variant)
 *
 * Don't force the user to guess how to talk to the expert.
 * When the user pastes something opaque (an error code, a stack
 * trace, a screenshot), the agent should:
 *
 *   1. Translate the input into a plain-English diagnosis so the
 *      user knows what they're looking at.
 *   2. Offer an ORDERED stack of next-step actions — cheapest
 *      self-serve fix first, escalation last — so the user always
 *      knows what to do next instead of staring at chat.
 *   3. Walk the user through whichever option they pick, with
 *      bounded sub-flows that have clear success criteria.
 *   4. If the chosen step doesn't resolve the issue, automatically
 *      advance the user to the next option in the stack. The agent
 *      keeps the conversation moving forward.
 *
 * Demo prompt: "Error Code C0342" → hardware-fault diagnosis →
 * power check → app-isolation check → human support.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

/* ── Troubleshooting steps (ordered cheapest → escalation) ─────── */
type StepId = 'power' | 'app' | 'support';

interface TroubleStep {
  id: StepId;
  label: string;
  hint: string;
  trailingIcon: string;
  trailingEmphasis?: 'primary';
}

const TROUBLE_STEPS: TroubleStep[] = [
  {
    id: 'power',
    label: 'Check the power',
    hint: 'Verify the device is properly powered.',
    trailingIcon: 'chevron_right_thick',
  },
  {
    id: 'app',
    label: 'Try in another app',
    hint: 'Confirm whether the issue is app-specific.',
    trailingIcon: 'chevron_right_thick',
  },
  {
    id: 'support',
    label: 'Contact support',
    hint: '~3 min wait · ticket pre-filled with this thread',
    trailingIcon: 'phone',
    trailingEmphasis: 'primary',
  },
];

const POWER_CHECKS = [
  'Power cable is seated at both ends',
  'Power LED is on (steady green)',
  'Outlet delivers power (try a different one)',
  'Device has been power-cycled (off 30s, on)',
];

interface ContactMethod {
  id: 'call' | 'email' | 'chat';
  icon: string;
  label: string;
  detail: string;
}

const CONTACT_METHODS: ContactMethod[] = [
  { id: 'call', icon: 'phone', label: 'Call now', detail: '1-800-TRIMBLE · ~3 min wait' },
  { id: 'email', icon: 'email', label: 'Email support', detail: 'support@trimble.com · ~4 hr reply' },
  { id: 'chat', icon: 'chat', label: 'Open live chat', detail: 'Typically connected in ~1 min' },
];

/* ── Mini Trimble AI logo ───────────────────────────────────────── */
function TrimbleAiLogo({ size = 24 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 30.002 32.6797" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="expert1-logo" x1="3.7558" y1="10.5251" x2="20.4332" y2="30.2565" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF2BFC" />
            <stop offset="0.628993" stopColor="#0563A7" />
            <stop offset="1" stopColor="#075CA4" />
          </linearGradient>
        </defs>
        <path
          d="M1.69824 24.9697C3.48353 26.9109 5.82653 28.2524 8.4043 28.8096L1.69824 32.6797V24.9697ZM10.6523 5.60742C16.5357 5.60742 21.3057 10.3803 21.3057 16.2676C21.3055 22.1547 16.5356 26.9268 10.6523 26.9268C4.76928 26.9265 0.00017177 22.1545 0 16.2676C0 10.3805 4.76918 5.60766 10.6523 5.60742ZM10.6523 7.69238C5.9201 7.69263 2.08398 11.5321 2.08398 16.2676C2.08416 21.0029 5.92021 24.8416 10.6523 24.8418C15.3847 24.8418 19.2215 21.003 19.2217 16.2676C19.2217 11.532 15.3848 7.69238 10.6523 7.69238ZM30.002 16.3398L23.2803 20.2217C24.0854 17.7019 24.0922 14.9945 23.2998 12.4707L30.002 16.3398ZM8.35547 3.83691C5.79861 4.40439 3.47535 5.73916 1.69824 7.66309V0L8.35547 3.83691Z"
          fill="url(#expert1-logo)"
        />
      </svg>
    </span>
  );
}

/* ── Toolbar icon button (thumbs, refresh, share, copy) ─────────── */
function ActionIconButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex items-center justify-center rounded-md transition-colors"
      style={{
        width: '24px',
        height: '24px',
        backgroundColor: active
          ? 'var(--modus-wc-color-base-200, #e0e1e9)'
          : 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.backgroundColor = 'var(--modus-wc-color-base-100, #f1f1f6)';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <ModusWcIcon
        name={icon}
        size="xs"
        decorative
        style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
      />
    </button>
  );
}

/* ── Stacked action card (the ordered next-step buttons) ────────── */
function ActionCard({
  step,
  state,
  onClick,
}: {
  step: TroubleStep;
  state: 'pending' | 'active' | 'tried' | 'resolved';
  onClick: () => void;
}) {
  const isResolved = state === 'resolved';
  const isTried = state === 'tried';
  const isActive = state === 'active';
  const muted = isTried && !isResolved;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'step' : undefined}
      className="flex items-center justify-between gap-3 w-full transition-colors"
      style={{
        minHeight: '48px',
        padding: '8px 10px 8px 14px',
        borderRadius: '10px',
        border: isActive
          ? '1.5px solid var(--modus-wc-color-primary, #0063a3)'
          : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        backgroundColor: isActive
          ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
          : 'var(--modus-wc-color-base-page, #ffffff)',
        cursor: 'pointer',
        opacity: muted ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (isActive) return;
        e.currentTarget.style.backgroundColor =
          'var(--modus-wc-color-base-100, #f1f1f6)';
      }}
      onMouseLeave={(e) => {
        if (isActive) return;
        e.currentTarget.style.backgroundColor =
          'var(--modus-wc-color-base-page, #ffffff)';
      }}
    >
      <span className="flex flex-col items-start text-left min-w-0 flex-1">
        <span
          className="flex items-center gap-1.5"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '20px',
          }}
        >
          {isResolved && (
            <ModusWcIcon
              name="check_circle"
              size="xs"
              decorative
              style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
            />
          )}
          {isTried && !isResolved && (
            <ModusWcIcon
              name="close"
              size="xs"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
            />
          )}
          <span
            style={{
              textDecoration: muted ? 'line-through' : 'none',
            }}
          >
            {step.label}
          </span>
        </span>
        <span
          className="truncate w-full"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 11px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            lineHeight: '16px',
            margin: 0,
          }}
        >
          {isResolved
            ? 'Resolved the issue — nice.'
            : isTried
            ? "Didn't resolve the issue."
            : step.hint}
        </span>
      </span>

      {/* Trailing icon — chevron for self-serve, phone circle for support */}
      {step.trailingEmphasis === 'primary' ? (
        <span
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--modus-wc-color-primary, #0063a3)',
            color: '#ffffff',
          }}
          aria-hidden="true"
        >
          <ModusWcIcon
            name={step.trailingIcon}
            size="sm"
            decorative
            style={{ color: '#ffffff' }}
          />
        </span>
      ) : (
        <span
          className="flex items-center justify-center shrink-0"
          style={{ width: '24px', height: '24px' }}
          aria-hidden="true"
        >
          <ModusWcIcon
            name={step.trailingIcon}
            size="sm"
            decorative
            style={{
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          />
        </span>
      )}
    </button>
  );
}

/* ── Typing-dots indicator ──────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5"
      style={{ padding: '12px 0 8px', height: '32px' }}
      aria-live="polite"
      aria-label="Agent is thinking"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: '6px',
            height: '6px',
            backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            animation: 'expert1-typing 1s ease-in-out infinite',
            animationDelay: `${i * 140}ms`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}

/* ── User chat bubble ───────────────────────────────────────────── */
function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="inline-flex items-center"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          borderRadius: '16px 16px 0 16px',
          padding: '8px 12px',
          maxWidth: '85%',
        }}
      >
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '24px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

/* ── Free-form agent text bubble (used for ack of typed messages) ─ */
function AgentTextBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2 items-start">
      <div className="shrink-0 pt-1">
        <TrimbleAiLogo size={20} />
      </div>
      <div
        className="flex-1"
        style={{
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          color: 'var(--modus-wc-color-base-content, #171c1e)',
          lineHeight: '24px',
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ── Power-check sub-card (interactive checklist) ───────────────── */
function PowerCheckCard({
  checks,
  onToggle,
  onResolved,
  onUnresolved,
  onCancel,
}: {
  checks: boolean[];
  onToggle: (i: number) => void;
  onResolved: () => void;
  onUnresolved: () => void;
  onCancel: () => void;
}) {
  const allChecked = checks.every(Boolean);
  return (
    <div
      className="flex flex-col rounded-xl"
      style={{
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center justify-between gap-2"
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          Power check
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="flex items-center justify-center rounded transition-colors"
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--modus-wc-color-base-100, #f1f1f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ModusWcIcon
            name="close"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
          />
        </button>
      </div>

      <div className="flex flex-col gap-1" style={{ padding: '8px 8px 4px' }}>
        {POWER_CHECKS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(i)}
            className="flex items-center gap-2.5 text-left transition-colors"
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'var(--modus-wc-color-base-100, #f1f1f6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: checks[i]
                  ? '1px solid var(--modus-wc-color-primary, #0063a3)'
                  : '1.5px solid var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                backgroundColor: checks[i]
                  ? 'var(--modus-wc-color-primary, #0063a3)'
                  : 'transparent',
              }}
              aria-hidden="true"
            >
              {checks[i] && (
                <ModusWcIcon
                  name="check"
                  size="xs"
                  decorative
                  style={{ color: '#ffffff' }}
                />
              )}
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '20px',
                textDecoration: checks[i] ? 'line-through' : 'none',
                opacity: checks[i] ? 0.6 : 1,
              }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      <div
        className="flex items-center justify-between gap-2"
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 11px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          {allChecked ? 'All checked — did it work?' : `${checks.filter(Boolean).length}/${POWER_CHECKS.length} completed`}
        </span>
        <div className="flex items-center gap-2">
          <ModusWcButton
            size="sm"
            color="tertiary"
            variant="outlined"
            onButtonClick={onUnresolved}
          >
            Still broken
          </ModusWcButton>
          <ModusWcButton
            size="sm"
            color="primary"
            disabled={!allChecked || undefined}
            onButtonClick={onResolved}
          >
            Resolved
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ── App-isolation sub-card (Yes / No / Haven't tried) ──────────── */
function AppIsolationCard({
  answer,
  onAnswer,
  onResolved,
  onUnresolved,
  onCancel,
}: {
  answer: 'yes' | 'no' | 'unknown' | null;
  onAnswer: (a: 'yes' | 'no' | 'unknown') => void;
  onResolved: () => void;
  onUnresolved: () => void;
  onCancel: () => void;
}) {
  const guidance: Record<'yes' | 'no' | 'unknown', string> = {
    yes: 'The issue happens across apps — that points to a system-level fault. The next step is to escalate to support.',
    no: 'The issue is app-specific. Try reinstalling the affected app: uninstall, restart the device, then reinstall.',
    unknown: 'Open the file in a second app (e.g. Trimble Connect) and try to reproduce the error. I\'ll wait.',
  };

  return (
    <div
      className="flex flex-col rounded-xl"
      style={{
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center justify-between gap-2"
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          Did the error reproduce in another app?
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="flex items-center justify-center rounded transition-colors"
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--modus-wc-color-base-100, #f1f1f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ModusWcIcon
            name="close"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
          />
        </button>
      </div>

      <div className="flex flex-col gap-2" style={{ padding: '12px' }}>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'yes' as const, label: 'Yes — happens in other apps' },
              { id: 'no' as const, label: 'No — only this app' },
              { id: 'unknown' as const, label: "Haven't tried yet" },
            ]
          ).map((opt) => {
            const active = answer === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onAnswer(opt.id)}
                className="transition-colors"
                style={{
                  height: '28px',
                  padding: '0 12px',
                  borderRadius: '1000px',
                  border: active
                    ? '1px solid var(--modus-wc-color-primary, #0063a3)'
                    : '1px solid var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  backgroundColor: active
                    ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
                    : 'transparent',
                  color: active
                    ? 'var(--modus-wc-color-primary, #0063a3)'
                    : 'var(--modus-wc-color-base-content, #171c1e)',
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {answer && (
          <div
            className="flex items-start gap-1.5 rounded-md"
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
              borderLeft: '2px solid var(--modus-wc-color-primary, #0063a3)',
            }}
          >
            <ModusWcIcon
              name="info"
              size="xs"
              decorative
              style={{
                color: 'var(--modus-wc-color-primary, #0063a3)',
                marginTop: '3px',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '18px',
              }}
            >
              {guidance[answer]}
            </span>
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-end gap-2"
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <ModusWcButton
          size="sm"
          color="tertiary"
          variant="outlined"
          disabled={!answer || undefined}
          onButtonClick={onUnresolved}
        >
          Still broken
        </ModusWcButton>
        <ModusWcButton
          size="sm"
          color="primary"
          disabled={!answer || undefined}
          onButtonClick={onResolved}
        >
          Resolved
        </ModusWcButton>
      </div>
    </div>
  );
}

/* ── Contact-support sub-card ───────────────────────────────────── */
function ContactSupportCard({
  selected,
  onSelect,
  includeContext,
  onToggleContext,
  onConnect,
  onCancel,
}: {
  selected: ContactMethod['id'] | null;
  onSelect: (id: ContactMethod['id']) => void;
  includeContext: boolean;
  onToggleContext: () => void;
  onConnect: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="flex flex-col rounded-xl"
      style={{
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center justify-between gap-2"
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          Reach a human
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="flex items-center justify-center rounded transition-colors"
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--modus-wc-color-base-100, #f1f1f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ModusWcIcon
            name="close"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
          />
        </button>
      </div>

      <div className="flex flex-col gap-1.5" style={{ padding: '10px' }}>
        {CONTACT_METHODS.map((m) => {
          const active = selected === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className="flex items-center gap-3 w-full text-left transition-colors"
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: active
                  ? '1.5px solid var(--modus-wc-color-primary, #0063a3)'
                  : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                backgroundColor: active
                  ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
                  : 'var(--modus-wc-color-base-page, #ffffff)',
                cursor: 'pointer',
              }}
            >
              <span
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: active
                    ? 'var(--modus-wc-color-primary, #0063a3)'
                    : 'var(--modus-wc-color-base-100, #f1f1f6)',
                  color: active ? '#ffffff' : 'var(--modus-wc-color-primary, #0063a3)',
                }}
                aria-hidden="true"
              >
                <ModusWcIcon
                  name={m.icon}
                  size="sm"
                  decorative
                  style={{
                    color: active
                      ? '#ffffff'
                      : 'var(--modus-wc-color-primary, #0063a3)',
                  }}
                />
              </span>
              <span className="flex flex-col items-start min-w-0 flex-1">
                <span
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    fontWeight: 600,
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    lineHeight: '20px',
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xxs, 11px)',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    lineHeight: '16px',
                    margin: 0,
                  }}
                >
                  {m.detail}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="flex items-center gap-2"
        style={{ padding: '4px 12px 10px' }}
      >
        <button
          type="button"
          onClick={onToggleContext}
          className="flex items-center gap-1.5"
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 0',
            cursor: 'pointer',
          }}
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '3px',
              border: includeContext
                ? '1px solid var(--modus-wc-color-primary, #0063a3)'
                : '1.5px solid var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              backgroundColor: includeContext
                ? 'var(--modus-wc-color-primary, #0063a3)'
                : 'transparent',
            }}
          >
            {includeContext && (
              <ModusWcIcon name="check" size="xs" decorative style={{ color: '#ffffff' }} />
            )}
          </span>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
            }}
          >
            Pre-fill ticket with this thread
          </span>
        </button>
      </div>

      <div
        className="flex items-center justify-end gap-2"
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <ModusWcButton
          size="sm"
          color="primary"
          disabled={!selected || undefined}
          onButtonClick={onConnect}
        >
          <span className="inline-flex items-center gap-1">
            <ModusWcIcon
              name={CONTACT_METHODS.find((m) => m.id === selected)?.icon ?? 'phone'}
              size="xs"
              decorative
            />
            Connect me
          </span>
        </ModusWcButton>
      </div>
    </div>
  );
}

/* ── Expert 1 — Lead the Conversation (Troubleshooting) ─────────── */
export default function Expert1() {
  const [activeStep, setActiveStep] = useState<StepId | null>(null);
  const [triedSteps, setTriedSteps] = useState<StepId[]>([]);
  const [powerChecks, setPowerChecks] = useState<boolean[]>([false, false, false, false]);
  const [appAnswer, setAppAnswer] = useState<'yes' | 'no' | 'unknown' | null>(null);
  const [contactMethod, setContactMethod] = useState<ContactMethod['id'] | null>(null);
  const [includeContext, setIncludeContext] = useState(true);
  const [resolution, setResolution] = useState<
    | { kind: 'resolved'; via: StepId }
    | { kind: 'escalated'; via: ContactMethod['id'] }
    | null
  >(null);
  const [showWhy, setShowWhy] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState('');
  const [freeMessages, setFreeMessages] = useState<
    { kind: 'user' | 'agent'; text: string }[]
  >([]);

  const cardState: Record<StepId, 'pending' | 'active' | 'tried' | 'resolved'> = useMemo(() => {
    const map: Record<StepId, 'pending' | 'active' | 'tried' | 'resolved'> = {
      power: 'pending',
      app: 'pending',
      support: 'pending',
    };
    triedSteps.forEach((id) => {
      map[id] = 'tried';
    });
    if (resolution?.kind === 'resolved') {
      map[resolution.via] = 'resolved';
    }
    if (activeStep && !resolution) {
      map[activeStep] = 'active';
    }
    return map;
  }, [triedSteps, activeStep, resolution]);

  function pause(ms = 600) {
    setIsThinking(true);
    window.setTimeout(() => setIsThinking(false), ms);
  }

  function openStep(id: StepId) {
    setActiveStep(id);
    pause(450);
  }

  function closeStep() {
    setActiveStep(null);
  }

  function markResolved(id: StepId) {
    setResolution({ kind: 'resolved', via: id });
    setActiveStep(null);
    pause(500);
  }

  function markUnresolvedAndAdvance(id: StepId) {
    setTriedSteps((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveStep(null);
    const idx = TROUBLE_STEPS.findIndex((s) => s.id === id);
    const next = TROUBLE_STEPS[idx + 1];
    if (next) {
      pause(700);
      window.setTimeout(() => setActiveStep(next.id), 720);
    } else {
      pause(400);
    }
  }

  function connectSupport() {
    if (!contactMethod) return;
    setResolution({ kind: 'escalated', via: contactMethod });
    setTriedSteps((prev) => (prev.includes('support') ? prev : [...prev, 'support']));
    setActiveStep(null);
    pause(500);
  }

  function startOver() {
    setActiveStep(null);
    setTriedSteps([]);
    setPowerChecks([false, false, false, false]);
    setAppAnswer(null);
    setContactMethod(null);
    setIncludeContext(true);
    setResolution(null);
    setShowWhy(false);
    setIsThinking(false);
    setFeedback(null);
    setCopied(false);
    setFreeMessages([]);
  }

  function handleCopy() {
    const lines: string[] = ['Error Code C0342'];
    lines.push('Diagnosis: hardware fault (likely power or connection).');
    triedSteps.forEach((id) => {
      const step = TROUBLE_STEPS.find((s) => s.id === id);
      if (step) lines.push(`· Tried: ${step.label}`);
    });
    if (resolution?.kind === 'resolved') {
      const s = TROUBLE_STEPS.find((s) => s.id === resolution.via);
      lines.push(`· Resolved by: ${s?.label}`);
    }
    if (resolution?.kind === 'escalated') {
      const m = CONTACT_METHODS.find((m) => m.id === resolution.via);
      lines.push(`· Escalated via: ${m?.label}`);
    }
    if (freeMessages.length) {
      lines.push('');
      freeMessages.forEach((m) =>
        lines.push(`${m.kind === 'user' ? 'You' : 'Agent'}: ${m.text}`),
      );
    }
    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function handleSend(textOverride?: string) {
    const text = (textOverride ?? draft).trim();
    if (!text) return;
    setDraft('');
    setFreeMessages((prev) => [...prev, { kind: 'user', text }]);
    setIsThinking(true);
    window.setTimeout(() => {
      setFreeMessages((prev) => [
        ...prev,
        {
          kind: 'agent',
          text: resolution
            ? `Noted — "${text}". Want me to open a follow-up ticket for this?`
            : `Got it — "${text}". I'll factor that into the next step.`,
        },
      ]);
      setIsThinking(false);
    }, 700);
  }

  const showActionStack = !resolution;
  const escalatedMethod = resolution?.kind === 'escalated'
    ? CONTACT_METHODS.find((m) => m.id === resolution.via)
    : null;
  const resolvedStep = resolution?.kind === 'resolved'
    ? TROUBLE_STEPS.find((s) => s.id === resolution.via)
    : null;

  return (
    <div
      className="bg-white rounded-xl flex flex-col"
      style={{
        width: '440px',
        boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.15)',
        padding: '24px 24px 8px 24px',
        gap: '20px',
      }}
    >
      <style>{`
        @keyframes expert1-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>

      {/* User pastes a cryptic error code */}
      <UserBubble text="Error Code C0342" />

      {/* Agent — diagnosis + ordered next-step stack */}
      <div className="flex gap-0 items-start">
        <div className="flex items-start pr-2 pt-2 shrink-0">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: '40px', height: '40px' }}
          >
            <TrimbleAiLogo size={24} />
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {/* Plain-English diagnosis (leads the conversation away from the cryptic code) */}
          <div className="flex items-start gap-1">
            <p
              className="flex-1 min-w-0"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '24px',
                margin: 0,
              }}
            >
              <strong style={{ fontWeight: 600 }}>C0342</strong> normally means there's a{' '}
              <strong style={{ fontWeight: 600 }}>hardware fault</strong>, usually a power or
              connection issue. Here are some things to try, in order from quickest to most involved:
            </p>
            <button
              type="button"
              onClick={() => setShowWhy((p) => !p)}
              aria-label={showWhy ? 'Hide rationale' : 'Why these steps?'}
              title={showWhy ? 'Hide rationale' : 'Why these steps?'}
              className="shrink-0 flex items-center justify-center rounded transition-colors"
              style={{
                width: '20px',
                height: '20px',
                marginTop: '2px',
                backgroundColor: showWhy
                  ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                  : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (showWhy) return;
                e.currentTarget.style.backgroundColor =
                  'var(--modus-wc-color-base-100, #f1f1f6)';
              }}
              onMouseLeave={(e) => {
                if (showWhy) return;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ModusWcIcon
                name="help"
                size="xs"
                decorative
                style={{
                  color: showWhy
                    ? 'var(--modus-wc-color-primary, #0063a3)'
                    : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              />
            </button>
          </div>

          {showWhy && (
            <div
              className="flex items-start gap-1.5 rounded-md"
              style={{
                padding: '8px 10px',
                backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
                borderLeft: '2px solid var(--modus-wc-color-primary, #0063a3)',
              }}
            >
              <ModusWcIcon
                name="info"
                size="xs"
                decorative
                style={{
                  color: 'var(--modus-wc-color-primary, #0063a3)',
                  marginTop: '3px',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '18px',
                }}
              >
                <strong style={{ fontWeight: 600 }}>Why this order:</strong>{' '}
                Power issues account for ~60% of C0342 reports and take 30 seconds to rule out. App
                isolation removes another big chunk. Support is only worth your time if the
                self-serve checks don't land.
              </span>
            </div>
          )}

          {/* Stacked action cards — only render while there's no final resolution */}
          {showActionStack && (
            <div className="flex flex-col gap-2">
              {TROUBLE_STEPS.map((step) => (
                <ActionCard
                  key={step.id}
                  step={step}
                  state={cardState[step.id]}
                  onClick={() => openStep(step.id)}
                />
              ))}
            </div>
          )}

          {/* Brief thinking pause between steps */}
          {isThinking && <TypingIndicator />}

          {/* Sub-flow for the active step */}
          {!isThinking && activeStep === 'power' && (
            <PowerCheckCard
              checks={powerChecks}
              onToggle={(i) =>
                setPowerChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
              }
              onResolved={() => markResolved('power')}
              onUnresolved={() => markUnresolvedAndAdvance('power')}
              onCancel={closeStep}
            />
          )}

          {!isThinking && activeStep === 'app' && (
            <AppIsolationCard
              answer={appAnswer}
              onAnswer={setAppAnswer}
              onResolved={() => markResolved('app')}
              onUnresolved={() => markUnresolvedAndAdvance('app')}
              onCancel={closeStep}
            />
          )}

          {!isThinking && activeStep === 'support' && (
            <ContactSupportCard
              selected={contactMethod}
              onSelect={setContactMethod}
              includeContext={includeContext}
              onToggleContext={() => setIncludeContext((v) => !v)}
              onConnect={connectSupport}
              onCancel={closeStep}
            />
          )}

          {/* Final resolution card */}
          {!isThinking && resolution?.kind === 'resolved' && resolvedStep && (
            <div
              className="flex flex-col rounded-xl"
              style={{
                border: '1px solid var(--modus-wc-color-status-success, #1e7e34)',
                backgroundColor: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: '3px', background: TRIMBLE_RAINBOW }} />
              <div className="flex items-start gap-2.5" style={{ padding: '12px' }}>
                <span
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'var(--modus-wc-color-status-success, #1e7e34)',
                  }}
                  aria-hidden="true"
                >
                  <ModusWcIcon
                    name="check"
                    size="sm"
                    decorative
                    style={{ color: '#ffffff' }}
                  />
                </span>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      fontWeight: 600,
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                      lineHeight: '20px',
                    }}
                  >
                    Issue resolved
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                      lineHeight: '18px',
                      margin: 0,
                    }}
                  >
                    Fixed by <strong style={{ fontWeight: 600 }}>{resolvedStep.label.toLowerCase()}</strong>.
                    Glad we caught that — want me to log this fix to your device's troubleshooting history?
                  </span>
                </div>
              </div>
              <div
                className="flex items-center justify-end gap-2"
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid var(--modus-wc-color-status-success, #1e7e34)',
                  backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
                }}
              >
                <ModusWcButton
                  size="sm"
                  color="tertiary"
                  variant="outlined"
                  onButtonClick={startOver}
                >
                  Diagnose another
                </ModusWcButton>
                <ModusWcButton size="sm" color="primary">
                  Log fix
                </ModusWcButton>
              </div>
            </div>
          )}

          {!isThinking && resolution?.kind === 'escalated' && escalatedMethod && (
            <div
              className="flex flex-col rounded-xl"
              style={{
                border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: '3px', background: TRIMBLE_RAINBOW }} />
              <div className="flex items-start gap-2.5" style={{ padding: '12px' }}>
                <span
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'var(--modus-wc-color-primary, #0063a3)',
                  }}
                  aria-hidden="true"
                >
                  <ModusWcIcon
                    name={escalatedMethod.icon}
                    size="sm"
                    decorative
                    style={{ color: '#ffffff' }}
                  />
                </span>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      fontWeight: 600,
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                      lineHeight: '20px',
                    }}
                  >
                    Connecting via {escalatedMethod.label.toLowerCase()}…
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                      lineHeight: '18px',
                      margin: 0,
                    }}
                  >
                    {escalatedMethod.detail}.{' '}
                    {includeContext
                      ? 'I pre-filled the ticket with everything we tried.'
                      : 'Your ticket will be empty — describe the issue when prompted.'}
                  </span>
                </div>
              </div>
              <div
                className="flex items-center justify-end gap-2"
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                }}
              >
                <ModusWcButton
                  size="sm"
                  color="tertiary"
                  variant="outlined"
                  onButtonClick={startOver}
                >
                  Cancel
                </ModusWcButton>
              </div>
            </div>
          )}

          {/* Free-form message thread */}
          {freeMessages.length > 0 && (
            <div className="flex flex-col gap-3" style={{ marginTop: '4px' }}>
              {freeMessages.map((m, i) =>
                m.kind === 'user' ? (
                  <UserBubble key={i} text={m.text} />
                ) : (
                  <AgentTextBubble key={i} text={m.text} />
                ),
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex gap-1 items-center pt-1">
            <ActionIconButton
              icon="thumbs_up"
              label="Helpful"
              active={feedback === 'up'}
              onClick={() => setFeedback((p) => (p === 'up' ? null : 'up'))}
            />
            <ActionIconButton
              icon="thumbs_down"
              label="Not helpful"
              active={feedback === 'down'}
              onClick={() => setFeedback((p) => (p === 'down' ? null : 'down'))}
            />
            <ActionIconButton icon="refresh" label="Start over" onClick={startOver} />
            <ActionIconButton icon="share" label="Share" />
            <ActionIconButton
              icon={copied ? 'check' : 'content_copy'}
              label={copied ? 'Copied' : 'Copy conversation'}
              onClick={handleCopy}
            />
          </div>
        </div>
      </div>

      {/* Prompt input with rainbow gradient border */}
      <div
        className="rounded-2xl"
        style={{
          padding: '2px',
          background: TRIMBLE_RAINBOW,
        }}
      >
        <div
          className="bg-white rounded-[14px] flex flex-col gap-1"
          style={{ padding: '8px' }}
        >
          <div className="px-1">
            <ModusWcTextInput
              value={draft}
              placeholder={
                resolution
                  ? 'Ask a follow-up…'
                  : 'Paste an error or describe what you\'re seeing…'
              }
              bordered={false}
              onInputChange={(e: CustomEvent) => setDraft(e.detail?.target?.value || '')}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5 px-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex items-center gap-1"
                style={{
                  height: '24px',
                  padding: '0 4px 0 8px',
                  borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                  border: '1px solid var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
                }}
              >
                GPT 5
                <ModusWcIcon name="expand_more" size="xs" decorative />
              </button>
              <button
                type="button"
                className="flex items-center justify-center"
                style={{
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                  backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  gap: '4px',
                }}
                aria-label="Device context"
                title="Device: TSC7 controller (serial 4427A)"
              >
                <ModusWcIcon name="sparkle" size="xs" decorative />
                <span>Device</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Attach a screenshot or log"
                title="Attach a screenshot or log"
                className="flex items-center justify-center"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    'var(--modus-wc-color-base-100, #f1f1f6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ModusWcIcon name="add" size="sm" decorative />
              </button>
              <button
                type="button"
                aria-label="Send"
                onClick={() => handleSend()}
                disabled={draft.trim() === ''}
                className="flex items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '1000px',
                  backgroundColor:
                    draft.trim() === ''
                      ? 'transparent'
                      : 'var(--modus-wc-color-primary, #0063a3)',
                  color:
                    draft.trim() === ''
                      ? 'var(--modus-wc-color-base-content, #171c1e)'
                      : '#ffffff',
                  border: 'none',
                  cursor: draft.trim() === '' ? 'default' : 'pointer',
                  opacity: draft.trim() === '' ? 0.6 : 1,
                  transition: 'background-color 120ms ease',
                }}
              >
                <ModusWcIcon name="send" size="sm" decorative />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-1 px-1">
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            fontWeight: 600,
            lineHeight: '16px',
          }}
        >
          AI can make mistakes.
        </span>
        <button
          type="button"
          className="cursor-pointer"
          style={{
            background: 'none',
            border: 'none',
            padding: '0 4px',
            color: 'var(--modus-wc-color-primary, #0063a3)',
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            lineHeight: '16px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Acceptable Use
        </button>
      </div>
    </div>
  );
}
