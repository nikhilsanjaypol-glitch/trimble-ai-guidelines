import { useMemo, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';
import { useExpert1Variant } from '../context/Expert1VariantContext';

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
    trailingIcon: 'chevron_right_thick',
  },
];

const POWER_CHECKS = [
  'Power cable is seated at both ends',
  'Power LED is on (steady green)',
  'Outlet delivers power (try a different one)',
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
}: {
  checks: boolean[];
  onToggle: (i: number) => void;
  onResolved: () => void;
  onUnresolved: () => void;
}) {
  const allChecked = checks.every(Boolean);
  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl"
      style={{
        padding: '12px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
      }}
    >
      <div className="flex flex-col">
        {POWER_CHECKS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(i)}
            className="flex items-center gap-2 text-left"
            style={{
              padding: '4px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: '16px',
                height: '16px',
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

      <div className="flex items-center justify-end gap-2">
        <ModusWcButton
          size="sm"
          color="tertiary"
          variant="outlined"
          disabled={!allChecked || undefined}
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
  );
}

/* ── App-isolation sub-card (Yes / No / Haven't tried) ──────────── */
function AppIsolationCard({
  answer,
  onAnswer,
  onResolved,
  onUnresolved,
}: {
  answer: 'yes' | 'no' | 'unknown' | null;
  onAnswer: (a: 'yes' | 'no' | 'unknown') => void;
  onResolved: () => void;
  onUnresolved: () => void;
}) {
  const guidance: Record<'yes' | 'no' | 'unknown', string> = {
    yes: 'It\'s likely a system-level fault — escalate to support next.',
    no: 'It\'s app-specific — try reinstalling the affected app.',
    unknown: 'Open the file in another app and try to reproduce it.',
  };

  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl"
      style={{
        padding: '12px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
      }}
    >
      <div className="flex flex-wrap gap-1.5">
        {([
          { id: 'yes' as const, label: 'Yes' },
          { id: 'no' as const, label: 'No' },
          { id: 'unknown' as const, label: "Haven't tried" },
        ]).map((opt) => {
          const active = answer === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onAnswer(opt.id)}
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
        <p
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
            lineHeight: '18px',
            margin: 0,
          }}
        >
          {guidance[answer]}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
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
  onConnect,
}: {
  selected: ContactMethod['id'] | null;
  onSelect: (id: ContactMethod['id']) => void;
  onConnect: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl"
      style={{
        padding: '12px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
      }}
    >
      <div className="flex flex-col gap-1">
        {CONTACT_METHODS.map((m) => {
          const active = selected === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className="flex items-center gap-2.5 w-full text-left transition-colors"
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: active
                  ? '1.5px solid var(--modus-wc-color-primary, #0063a3)'
                  : '1px solid transparent',
                backgroundColor: active
                  ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
                  : 'var(--modus-wc-color-base-100, #f1f1f6)',
                cursor: 'pointer',
              }}
            >
              <ModusWcIcon
                name={m.icon}
                size="sm"
                decorative
                style={{
                  color: active
                    ? 'var(--modus-wc-color-primary, #0063a3)'
                    : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  flexShrink: 0,
                }}
              />
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
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}
              >
                {m.detail.split('·')[1]?.trim() ?? ''}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2">
        <ModusWcButton
          size="sm"
          color="primary"
          disabled={!selected || undefined}
          onButtonClick={onConnect}
        >
          Connect me
        </ModusWcButton>
      </div>
    </div>
  );
}

/* ── Expert 1 — Lead the Conversation (Troubleshooting card)
 *    `showPromptBar` toggles the sticky bottom (rainbow prompt input
 *    + disclaimer). The "screen-only" variant turns it off so we can
 *    showcase just the conversation itself.
 *    `logoSize` lets the screen-only landscape variant scale the
 *    agent avatar up so it reads at the bigger width.               */
function TroubleshootCard({
  showPromptBar = true,
  logoSize = 24,
  logoOffsetLeft = 0,
}: {
  showPromptBar?: boolean;
  logoSize?: number;
  logoOffsetLeft?: number;
} = {}) {
  const [activeStep, setActiveStep] = useState<StepId | null>(null);
  const [triedSteps, setTriedSteps] = useState<StepId[]>([]);
  const [powerChecks, setPowerChecks] = useState<boolean[]>(() =>
    POWER_CHECKS.map(() => false),
  );
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
    setPowerChecks(POWER_CHECKS.map(() => false));
    setAppAnswer(null);
    setContactMethod(null);
    setIncludeContext(true);
    setResolution(null);
    setShowWhy(false);
    setIsThinking(false);
    setFreeMessages([]);
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
    <div className="flex-1 flex flex-col min-h-0 w-full">
      <style>{`
        @keyframes expert1-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>

      {/* Scrollable conversation area — fills the phone between top bar and prompt */}
      <div
        className="flex-1 flex flex-col overflow-y-auto min-h-0"
        style={{ padding: '18px 16px 12px 16px', gap: '20px' }}
      >
        {/* User pastes a cryptic error code */}
        <UserBubble text="Error Code C0342" />

      {/* Agent — diagnosis + ordered next-step stack */}
      <div className="flex gap-2 items-start">
        {/* Logo column. With items-start the logo's top hugs the column,
            but visually we want its vertical center to sit on the first
            line of "C0342 normally means…" (line-height: 24px). Shift
            it up by half the difference so the centers line up.
            `logoOffsetLeft` lets each variant tune the horizontal
            placement — phone-shell uses 0 so the avatar aligns with
            the hamburger above it, screen-only tugs the bigger logo
            left so it reads as the agent's column gutter.            */}
        <div
          className="shrink-0"
          style={{
            marginTop: `${(24 - logoSize) / 2}px`,
            marginLeft: `${-logoOffsetLeft}px`,
          }}
        >
          <TrimbleAiLogo size={logoSize} />
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

          {/* Stacked action cards — only render while there's no final
              resolution. The active step's sub-flow renders inline,
              directly under the button that was clicked, so the user
              doesn't have to look elsewhere for what just opened. */}
          {showActionStack && (
            <div className="flex flex-col gap-2">
              {TROUBLE_STEPS.map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <div key={step.id} className="flex flex-col gap-2">
                    <ActionCard
                      step={step}
                      state={cardState[step.id]}
                      onClick={() => openStep(step.id)}
                    />

                    {isActive && isThinking && <TypingIndicator />}

                    {isActive && !isThinking && step.id === 'power' && (
                      <PowerCheckCard
                        checks={powerChecks}
                        onToggle={(i) =>
                          setPowerChecks((prev) =>
                            prev.map((v, idx) => (idx === i ? !v : v)),
                          )
                        }
                        onResolved={() => markResolved('power')}
                        onUnresolved={() => markUnresolvedAndAdvance('power')}
                      />
                    )}

                    {isActive && !isThinking && step.id === 'app' && (
                      <AppIsolationCard
                        answer={appAnswer}
                        onAnswer={setAppAnswer}
                        onResolved={() => markResolved('app')}
                        onUnresolved={() => markUnresolvedAndAdvance('app')}
                      />
                    )}

                    {isActive && !isThinking && step.id === 'support' && (
                      <ContactSupportCard
                        selected={contactMethod}
                        onSelect={setContactMethod}
                        onConnect={connectSupport}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Typing indicator while advancing between steps (no
              activeStep yet so we can't dock it under any one card). */}
          {isThinking && !activeStep && <TypingIndicator />}

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

        </div>
      </div>
      </div>

      {showPromptBar && (
      /* Sticky bottom — rainbow prompt + disclaimer, pinned to the bottom of the phone */
      <div
        className="shrink-0 flex flex-col"
        style={{
          padding: '8px 16px 16px 16px',
          gap: '8px',
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        }}
      >
      {/* _Prompt/Base — rainbow gradient border (ported from Creative 3) */}
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
            value={draft}
            placeholder={resolution ? 'Ask a follow-up…' : 'How can I help you?'}
            bordered={false}
            onInputChange={(e: CustomEvent) =>
              setDraft(e.detail?.target?.value || '')
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
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
            onClick={() => handleSend()}
            disabled={draft.trim() === ''}
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: '999px',
              cursor: draft.trim() === '' ? 'default' : 'pointer',
              opacity: draft.trim() === '' ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              transition: 'opacity 120ms ease',
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

      {/* Disclaimer (ported from Creative 3) */}
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
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * TI_M2 — Mobile chat shell (Figma 593:68076)
 *   375 × 812 mobile shell with:
 *     · Top bar — hamburger (left) + circular avatar (right)
 *     · Collapsible user-question bubble with expand chevron
 *     · Trimble AI logo + long-form AI response
 *     · Sticky bottom prompt bar with rainbow stroke
 * ───────────────────────────────────────────────────────────────── */

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 720;
/* Landscape width for the "Screen only" variant — wider than the
 * 375px phone so it clearly reads as landscape, but not the full
 * 720px rotation (that felt too stretched for a chat thread).       */
const BARE_LANDSCAPE_WIDTH = 560;

/* ── Mobile top bar — hamburger + circular avatar ───────────────── */
function MobileTopBar() {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: '56px',
        padding: '12px 16px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
      }}
    >
      <button
        type="button"
        aria-label="Open menu"
        title="Menu"
        className="flex items-center justify-start transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
        style={{
          width: '32px',
          height: '32px',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <ModusWcIcon
          name="menu"
          size="sm"
          decorative
          style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}
        />
      </button>

      <button
        type="button"
        aria-label="Profile"
        title="Profile"
        className="flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: '32px',
          height: '32px',
          backgroundColor: 'var(--modus-wc-color-primary-light, #e8f4fd)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <ModusWcIcon
          name="person"
          size="sm"
          decorative
          style={{ color: 'var(--modus-wc-color-primary, #0063A7)' }}
        />
      </button>
    </div>
  );
}

/* ── TI_M2 — mobile chat shell with the troubleshooting card inside ─ */
function TiM2Mobile() {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col relative shrink-0"
      style={{
        width: `${MOBILE_WIDTH}px`,
        height: `${MOBILE_HEIGHT}px`,
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow:
          '0 28px 60px rgba(0,0,0,0.16), 0 6px 18px rgba(0,0,0,0.08)',
      }}
    >
      <MobileTopBar />
      <TroubleshootCard />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * TiM2Bare — option 2. Landscape conversation card. No phone chrome
 * at all: the MobileTopBar (hamburger + avatar) and the sticky
 * bottom prompt bar + disclaimer are both stripped. No bezel, no
 * border, no shadow, no rounded corners. The card is laid out
 * landscape (720px wide — same as the phone's height) so it reads
 * as the rotated device, and it grows naturally with its content.
 * ───────────────────────────────────────────────────────────────── */
function TiM2Bare() {
  return (
    <div
      className="flex flex-col shrink-0"
      style={{ width: `${BARE_LANDSCAPE_WIDTH}px` }}
    >
      <TroubleshootCard showPromptBar={false} logoSize={30} logoOffsetLeft={10} />
    </div>
  );
}

/* Visual scale factor applied to the whole guideline. `zoom` (rather
 * than `transform: scale`) is used so the layout box grows too — that
 * way the parent Shell still centers cleanly with no overflow clip
 * and no subpixel blurriness. Bump this constant to taste.          */
const UI_SCALE = 1.1;

/* ── Expert 1 — page export.
 *    Reads the variant from Expert1VariantContext, which is driven by
 *    the Expert1VariantPicker inside the top-right GuidelineOverlay
 *    info button (App.tsx). Defaults to the full phone shell.       */
export default function Expert1() {
  const ctx = useExpert1Variant();
  const variant = ctx?.variant ?? 'phone';
  return (
    <div style={{ zoom: UI_SCALE }}>
      {variant === 'phone' ? <TiM2Mobile /> : <TiM2Bare />}
    </div>
  );
}
