import { useEffect, useMemo, useRef, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Expert 1 — LEAD THE CONVERSATION
 *
 * Don't force the user to guess how to talk to the expert.
 * The agent uses clarifying questions to help the user formulate
 * their request, especially when the initial prompt is vague or
 * lacks technical detail.
 *
 * Interactions in this demo:
 *   · Agent breaks the vague prompt into one focused question at a
 *     time, with chip answers AND a "Something else" custom input.
 *   · Each answered question collapses to a "You selected: X" pill
 *     that the user can click to revise.
 *   · Each question carries a "Why am I asking?" rationale so the
 *     user can see the agent's reasoning.
 *   · A typing indicator pauses briefly between steps to keep the
 *     handoff legible.
 *   · After enough context is gathered, the agent shows a context
 *     summary card with editable rows and offers next-step actions
 *     and follow-up suggestions.
 *   · The chat input still works for free-form follow-ups.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

interface ClarifyStep {
  id: 'aspect' | 'location';
  question: string;
  options: string[];
  recommended?: string;
  /** Why the agent is asking — surfaces on info-icon click. */
  rationale: string;
  /** Short label used in the summary card. */
  summaryLabel: string;
}

const CLARIFY_STEPS: ClarifyStep[] = [
  {
    id: 'aspect',
    question: "I can help with that — let's narrow it down. What would you like to fix?",
    options: ['Alignment', 'Elevation', 'Geometry', 'Drainage'],
    recommended: 'Alignment',
    rationale:
      'A model can have many issue types. Telling me the aspect lets me load the right checks and skip irrelevant data.',
    summaryLabel: 'Aspect',
  },
  {
    id: 'location',
    question: 'Next, where is the issue located?',
    options: ['Road', 'Site', 'Pad', 'Corridor'],
    recommended: 'Road',
    rationale:
      'I only need to scan the relevant portion of the model — pinpointing the location keeps the analysis fast and focused.',
    summaryLabel: 'Location',
  },
];

interface ActionDef {
  id: string;
  label: string;
  description: string;
}

const ACTIONS: ActionDef[] = [
  { id: 'analyse', label: 'Analyse', description: 'Inspect and report — no changes made.' },
  { id: 'fix', label: 'Fix', description: "Apply the recommended fix; you'll review before commit." },
  { id: 'suggest', label: 'Get suggestions', description: 'Show ranked options with trade-offs.' },
];

const FOLLOW_UPS = [
  'Show me the diff',
  'Estimate the impact',
  'Add to backlog',
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

/* ── Option chip (clarifying-question choice) ───────────────────── */
function OptionChip({
  label,
  recommended,
  variant = 'solid',
  onClick,
}: {
  label: string;
  recommended?: boolean;
  variant?: 'solid' | 'dashed';
  onClick: () => void;
}) {
  const borderColor = recommended
    ? 'var(--modus-wc-color-primary, #0063a3)'
    : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 transition-colors"
      style={{
        height: '24px',
        padding: '0 10px',
        borderRadius: '1000px',
        border:
          variant === 'dashed'
            ? `1px dashed ${borderColor}`
            : `1px solid ${borderColor}`,
        backgroundColor: 'transparent',
        color: recommended
          ? 'var(--modus-wc-color-primary, #0063a3)'
          : 'var(--modus-wc-color-base-content, #171c1e)',
        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
        fontWeight: 400,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = recommended
          ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
          : 'var(--modus-wc-color-base-100, #f1f1f6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {variant === 'dashed' && <ModusWcIcon name="add" size="xs" decorative />}
      {label}
    </button>
  );
}

/* ── Editable "You selected: X" badge ───────────────────────────── */
function SelectedBadge({
  label,
  onEdit,
}: {
  label: string;
  onEdit?: () => void;
}) {
  const editable = typeof onEdit === 'function';
  return (
    <button
      type="button"
      onClick={onEdit}
      disabled={!editable}
      className="inline-flex items-center gap-1 group"
      title={editable ? 'Click to revise' : undefined}
      style={{
        height: '22px',
        padding: '0 6px',
        borderRadius: 'var(--modus-wc-border-radius-xs, 4px)',
        border: '0.5px solid var(--modus-wc-color-primary, #0063a3)',
        color: 'var(--modus-wc-color-primary, #0063a3)',
        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
        backgroundColor: 'transparent',
        cursor: editable ? 'pointer' : 'default',
        transition: 'background-color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!editable) return;
        e.currentTarget.style.backgroundColor =
          'var(--modus-wc-color-primary-light, #e8f4fd)';
      }}
      onMouseLeave={(e) => {
        if (!editable) return;
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span style={{ fontWeight: 400 }}>You selected:</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {editable && (
        <span
          aria-hidden="true"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ display: 'inline-flex', alignItems: 'center' }}
        >
          <ModusWcIcon name="edit_combination" size="xs" decorative />
        </span>
      )}
    </button>
  );
}

/* ── Typing-dots indicator (agent is "thinking") ────────────────── */
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

/* ── Question bubble with optional "Why?" expansion ─────────────── */
function QuestionBubble({
  step,
  showWhy,
  onToggleWhy,
  children,
}: {
  step: ClarifyStep;
  showWhy: boolean;
  onToggleWhy: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 py-2" style={{ width: '320px' }}>
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
          {step.question}
        </p>
        <button
          type="button"
          onClick={onToggleWhy}
          aria-label={showWhy ? 'Hide rationale' : 'Why am I asking?'}
          title={showWhy ? 'Hide rationale' : 'Why am I asking?'}
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
            <strong style={{ fontWeight: 600 }}>Why I'm asking:</strong>{' '}
            {step.rationale}
          </span>
        </div>
      )}

      {children}
    </div>
  );
}

/* ── User chat bubble (gray, right-aligned) ─────────────────────── */
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
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

/* ── Free-form agent bubble (white, no avatar gutter) ───────────── */
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

/* ── Expert 1 — Lead the Conversation ───────────────────────────── */
export default function Expert1() {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [customStep, setCustomStep] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState('');
  const [chosenAction, setChosenAction] = useState<string | null>(null);
  const [showWhyFor, setShowWhyFor] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState('');
  const [freeMessages, setFreeMessages] = useState<
    { kind: 'user' | 'agent'; text: string }[]
  >([]);
  const customInputRef = useRef<HTMLInputElement | null>(null);

  /* Autofocus the inline custom-answer input when it opens. */
  useEffect(() => {
    if (customStep && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [customStep]);

  /* Where in the clarifying flow are we right now? */
  const answeredCount = useMemo(
    () => CLARIFY_STEPS.filter((s) => selections[s.id]).length,
    [selections],
  );
  const nextStep =
    !editingStep && answeredCount < CLARIFY_STEPS.length
      ? CLARIFY_STEPS[answeredCount]
      : null;
  const editingStepDef = editingStep
    ? CLARIFY_STEPS.find((s) => s.id === editingStep) ?? null
    : null;
  const showActionPrompt =
    !editingStep && answeredCount === CLARIFY_STEPS.length && !chosenAction;

  /* Brief "agent is thinking" pause when a chip is clicked. */
  function pauseThenAdvance() {
    setIsThinking(true);
    window.setTimeout(() => setIsThinking(false), 650);
  }

  function selectOption(stepId: string, value: string) {
    setSelections((prev) => ({ ...prev, [stepId]: value }));
    setEditingStep(null);
    setCustomStep(null);
    setCustomDraft('');
    setShowWhyFor(null);
    if (answeredCount < CLARIFY_STEPS.length - 1) {
      pauseThenAdvance();
    }
  }

  function chooseAction(actionLabel: string) {
    setChosenAction(actionLabel);
    pauseThenAdvance();
  }

  function startOver() {
    setSelections({});
    setEditingStep(null);
    setCustomStep(null);
    setCustomDraft('');
    setChosenAction(null);
    setShowWhyFor(null);
    setFeedback(null);
    setCopied(false);
    setFreeMessages([]);
  }

  function refineAction() {
    setChosenAction(null);
  }

  function handleCopy() {
    const lines = CLARIFY_STEPS.filter((s) => selections[s.id]).map(
      (s) => `${s.summaryLabel}: ${selections[s.id]}`,
    );
    if (chosenAction) lines.push(`Action: ${chosenAction}`);
    if (freeMessages.length) {
      lines.push('');
      freeMessages.forEach((m) => lines.push(`${m.kind === 'user' ? 'You' : 'Agent'}: ${m.text}`));
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
          text: chosenAction
            ? `Got it — I'll fold "${text}" into the ${chosenAction.toLowerCase()} pass.`
            : `Noted — "${text}". I'll keep that in mind as we narrow down.`,
        },
      ]);
      setIsThinking(false);
    }, 700);
  }

  /* Render helper: option chips + "Something else" + custom input. */
  function renderOptions(step: ClarifyStep, currentValue?: string) {
    if (customStep === step.id) {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = customDraft.trim();
            if (val) selectOption(step.id, val);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={customInputRef}
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            placeholder="Type your answer…"
            className="flex-1 outline-none"
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              padding: '4px 10px',
              borderRadius: '1000px',
              border: '1px solid var(--modus-wc-color-primary, #0063a3)',
              backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
              height: '24px',
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={!customDraft.trim()}
            aria-label="Confirm answer"
            className="flex items-center justify-center"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '1000px',
              border: 'none',
              cursor: customDraft.trim() ? 'pointer' : 'default',
              backgroundColor: customDraft.trim()
                ? 'var(--modus-wc-color-primary, #0063a3)'
                : 'var(--modus-wc-color-base-200, #e0e1e9)',
              color: '#ffffff',
            }}
          >
            <ModusWcIcon name="check" size="xs" decorative />
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomStep(null);
              setCustomDraft('');
            }}
            aria-label="Cancel"
            className="flex items-center justify-center"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '1000px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            <ModusWcIcon name="close" size="xs" decorative />
          </button>
        </form>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {step.options.map((opt) => (
          <OptionChip
            key={opt}
            label={opt}
            recommended={opt === step.recommended && opt !== currentValue}
            onClick={() => selectOption(step.id, opt)}
          />
        ))}
        <OptionChip
          label="Something else"
          variant="dashed"
          onClick={() => {
            setCustomStep(step.id);
            setCustomDraft('');
          }}
        />
      </div>
    );
  }

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
      {/* Local keyframe for the typing-dots animation. */}
      <style>{`
        @keyframes expert1-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>

      {/* User prompt */}
      <UserBubble text="Fix my model" />

      {/* Agent response — clarifying questions */}
      <div className="flex gap-0 items-start">
        <div className="flex items-start pr-2 pt-2 shrink-0">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: '40px', height: '40px' }}
          >
            <TrimbleAiLogo size={24} />
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {/* Already-answered steps — collapsed to editable badges
              (unless this is the step being edited). */}
          {CLARIFY_STEPS.map((step) => {
            const value = selections[step.id];
            if (!value) return null;
            if (editingStep === step.id) return null;
            return (
              <div key={step.id} className="flex flex-col gap-2 py-2" style={{ width: '320px' }}>
                <p
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    lineHeight: '24px',
                    margin: 0,
                  }}
                >
                  {step.question}
                </p>
                <SelectedBadge label={value} onEdit={() => setEditingStep(step.id)} />
              </div>
            );
          })}

          {/* Step currently being edited — re-show chips with original
              selection highlighted. */}
          {editingStepDef && (
            <QuestionBubble
              step={editingStepDef}
              showWhy={showWhyFor === editingStepDef.id}
              onToggleWhy={() =>
                setShowWhyFor((p) =>
                  p === editingStepDef.id ? null : editingStepDef.id,
                )
              }
            >
              {renderOptions(editingStepDef, selections[editingStepDef.id])}
              <button
                type="button"
                onClick={() => {
                  setEditingStep(null);
                  setCustomStep(null);
                }}
                className="self-start"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 0 0 0',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  cursor: 'pointer',
                }}
              >
                Keep "{selections[editingStepDef.id]}"
              </button>
            </QuestionBubble>
          )}

          {/* Typing indicator while the next step is loading. */}
          {isThinking && !editingStep && (nextStep || showActionPrompt || chosenAction) && (
            <TypingIndicator />
          )}

          {/* Next pending clarifying question. */}
          {!isThinking && nextStep && (
            <QuestionBubble
              step={nextStep}
              showWhy={showWhyFor === nextStep.id}
              onToggleWhy={() =>
                setShowWhyFor((p) => (p === nextStep.id ? null : nextStep.id))
              }
            >
              {renderOptions(nextStep)}
            </QuestionBubble>
          )}

          {/* Action-chip prompt once both questions are answered. */}
          {!isThinking && showActionPrompt && (
            <div className="flex flex-col gap-2 py-2" style={{ width: '320px' }}>
              <p
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '24px',
                  margin: 0,
                }}
              >
                What would you like to do?
              </p>
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((a) => (
                  <OptionChip
                    key={a.id}
                    label={a.label}
                    onClick={() => chooseAction(a.label)}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  lineHeight: '14px',
                }}
              >
                {ACTIONS.find((a) => a.label === 'Fix')?.description}
              </span>
            </div>
          )}

          {/* Context summary card — appears after action chosen. */}
          {!isThinking && chosenAction && (
            <div
              className="flex flex-col rounded-xl"
              style={{
                marginTop: '8px',
                marginBottom: '4px',
                border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
                overflow: 'hidden',
              }}
            >
              {/* Rainbow accent header */}
              <div style={{ height: '3px', background: TRIMBLE_RAINBOW }} />
              <div className="flex flex-col gap-3 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      fontWeight: 600,
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    Here's what I'll do
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                      color: 'var(--modus-wc-color-status-success, #1e7e34)',
                      fontWeight: 600,
                    }}
                  >
                    <ModusWcIcon
                      name="check_circle"
                      size="xs"
                      decorative
                      style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
                    />
                    Ready
                  </span>
                </div>

                {/* Context rows */}
                <div className="flex flex-col gap-1.5">
                  {CLARIFY_STEPS.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-2"
                      style={{ minHeight: '24px' }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                          width: '72px',
                          flexShrink: 0,
                        }}
                      >
                        {s.summaryLabel}
                      </span>
                      <span
                        className="flex-1 min-w-0 truncate"
                        style={{
                          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                          fontWeight: 600,
                          color: 'var(--modus-wc-color-base-content, #171c1e)',
                        }}
                      >
                        {selections[s.id]}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingStep(s.id)}
                        aria-label={`Edit ${s.summaryLabel}`}
                        className="flex items-center justify-center rounded transition-colors"
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            'var(--modus-wc-color-base-100, #f1f1f6)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <ModusWcIcon name="edit_combination" size="xs" decorative />
                      </button>
                    </div>
                  ))}
                  <div
                    className="flex items-center justify-between gap-2"
                    style={{ minHeight: '24px' }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                        color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                        width: '72px',
                        flexShrink: 0,
                      }}
                    >
                      Action
                    </span>
                    <span
                      className="flex-1 min-w-0 truncate"
                      style={{
                        fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                        fontWeight: 600,
                        color: 'var(--modus-wc-color-primary, #0063a3)',
                      }}
                    >
                      {chosenAction}
                    </span>
                    <button
                      type="button"
                      onClick={refineAction}
                      aria-label="Change action"
                      className="flex items-center justify-center rounded transition-colors"
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'var(--modus-wc-color-base-100, #f1f1f6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <ModusWcIcon name="edit_combination" size="xs" decorative />
                    </button>
                  </div>
                </div>

                {/* Follow-up suggestions */}
                <div className="flex flex-col gap-1.5">
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Suggested follow-ups
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {FOLLOW_UPS.map((f) => (
                      <OptionChip key={f} label={f} onClick={() => handleSend(f)} />
                    ))}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <ModusWcButton
                    size="sm"
                    color="tertiary"
                    variant="outlined"
                    onButtonClick={startOver}
                  >
                    <span className="inline-flex items-center gap-1">
                      <ModusWcIcon name="refresh" size="xs" decorative />
                      Start over
                    </span>
                  </ModusWcButton>
                  <ModusWcButton size="sm" color="primary">
                    <span className="inline-flex items-center gap-1">
                      Run {chosenAction?.toLowerCase()}
                      <ModusWcIcon name="caret_right" size="xs" decorative />
                    </span>
                  </ModusWcButton>
                </div>
              </div>
            </div>
          )}

          {/* Free-form message thread (after summary). */}
          {freeMessages.length > 0 && (
            <div className="flex flex-col gap-3" style={{ marginTop: '8px' }}>
              {freeMessages.map((m, i) =>
                m.kind === 'user' ? (
                  <UserBubble key={i} text={m.text} />
                ) : (
                  <AgentTextBubble key={i} text={m.text} />
                ),
              )}
            </div>
          )}

          {/* Action toolbar — feedback / share / reset / copy */}
          <div className="flex gap-1 items-center pt-2">
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
                chosenAction
                  ? 'Ask a follow-up…'
                  : 'How can I help you?'
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
                aria-label="Project context"
                title="Project: Highway 17 widening"
              >
                <ModusWcIcon name="sparkle" size="xs" decorative />
                <span>Project</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Add source"
                title="Add a file or reference"
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
