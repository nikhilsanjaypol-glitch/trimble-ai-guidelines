import { useMemo, useRef, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';
import {
  useCreative7Variant,
  type Creative7Variant,
} from '../context/Creative7VariantContext';

/* ─────────────────────────────────────────────────────────────────
 * Guideline: REITERATE THE PLAN
 *   Before getting to work, the AI paraphrases what it heard,
 *   lists the steps it plans to take, and surfaces the one or two
 *   places where it had to guess. The user can reword the
 *   interpretation, swap an assumption inline, or approve the
 *   plan in one tap.
 *
 * Component: CHAT-EMBEDDED PLAN CARD
 *   A single chat surface — modeled on Cursor's plan agent mode —
 *   showing one user turn followed by one AI turn whose body is a
 *   compact plan card (paraphrase + checklist + one inline
 *   assumption pill + Edit / Run actions). The composer is
 *   visible at the bottom for follow-up.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

const USER_REQUEST =
  'Recommend a grading approach for the north boundary that minimises cost without slowing the schedule too much.';

const PARAPHRASE_DEFAULT =
  'Recommend a north-boundary grading approach that leads with cost and treats schedule as a guardrail.';

interface PlanStep {
  id: string;
  label: string;
}

const PLAN_STEPS: PlanStep[] = [
  { id: 'pull', label: 'Pull current grading plan & topographic survey' },
  { id: 'compare', label: 'Compare wall · re-grade · segmental block' },
  { id: 'cost', label: 'Run cost & schedule delta (Denver unit rates)' },
  { id: 'recommend', label: 'Recommend the best fit with trade-offs called out' },
];

/* ── Trimble AI logo (mini, used in chat avatar) ───────────────── */

function TrimbleAiLogo({ size = 22 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 30.002 32.6797"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="tlogo-7"
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
          fill="url(#tlogo-7)"
        />
      </svg>
    </span>
  );
}

/* ── The plan card (AI's structured response inside the chat) ──── */

interface PlanSnapshot {
  paraphrase: string;
  steps: PlanStep[];
}

/* Solid-input shared style — clearly visible chrome so edit mode is obvious. */
const EDIT_INPUT_BASE = {
  width: '100%',
  backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
  border: '1px solid var(--modus-wc-color-base-200, #cbd2d9)',
  borderRadius: '6px',
  padding: '8px 10px',
  color: 'var(--modus-wc-color-base-content, #171c1e)',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
} as const;

function PlanCard() {
  /* PlanCard reads the variant to decide whether to render the
     full-fidelity tablet pieces (paraphrase block, footer hint) or
     the minimal plan-only view. Defaults to plan-only when standalone. */
  const variantCtx = useCreative7Variant();
  const variant: Creative7Variant = variantCtx?.variant ?? 'plan-only';
  const isTablet = variant === 'tablet';

  const [editing, setEditing] = useState(false);
  const [paraphrase, setParaphrase] = useState(PARAPHRASE_DEFAULT);
  const [steps, setSteps] = useState<PlanStep[]>(PLAN_STEPS);

  const snapshotRef = useRef<PlanSnapshot | null>(null);
  const paraRef = useRef<HTMLTextAreaElement>(null);
  const stepRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const planReady = useMemo(() => !editing, [editing]);

  function startEdit(focusTarget?: 'paraphrase' | 'first-step' | string) {
    snapshotRef.current = {
      paraphrase,
      steps: steps.map((s) => ({ ...s })),
    };
    setEditing(true);
    requestAnimationFrame(() => {
      if (focusTarget === 'paraphrase' && isTablet) {
        paraRef.current?.focus();
        const len = paraRef.current?.value.length ?? 0;
        paraRef.current?.setSelectionRange(len, len);
      } else if (focusTarget === 'first-step' || !focusTarget) {
        if (steps[0]) stepRefs.current[steps[0].id]?.focus();
      } else {
        /* Treat as a step id */
        stepRefs.current[focusTarget]?.focus();
      }
    });
  }

  function saveEdit() {
    const cleanedSteps = steps
      .map((s) => ({ ...s, label: s.label.trim() }))
      .filter((s) => s.label.length > 0);
    setSteps(cleanedSteps.length > 0 ? cleanedSteps : PLAN_STEPS);
    setParaphrase(paraphrase.trim().length > 0 ? paraphrase.trim() : PARAPHRASE_DEFAULT);
    snapshotRef.current = null;
    setEditing(false);
  }

  function cancelEdit() {
    if (snapshotRef.current) {
      setParaphrase(snapshotRef.current.paraphrase);
      setSteps(snapshotRef.current.steps);
    }
    setEditing(false);
  }

  function updateStep(id: string, label: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
  }

  function addStepAfter(id: string | null) {
    let newId = '';
    setSteps((prev) => {
      newId = `step-${Date.now()}`;
      const idx = id ? prev.findIndex((s) => s.id === id) : prev.length - 1;
      const insertAt = idx >= 0 ? idx + 1 : prev.length;
      const next = [...prev];
      next.splice(insertAt, 0, { id: newId, label: '' });
      return next;
    });
    requestAnimationFrame(() => {
      if (newId) stepRefs.current[newId]?.focus();
    });
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function handleStepKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    step: PlanStep,
    idx: number,
  ) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addStepAfter(step.id);
    } else if (e.key === 'Backspace' && step.label === '' && steps.length > 1) {
      e.preventDefault();
      const prevStep = steps[idx - 1];
      removeStep(step.id);
      if (prevStep) {
        requestAnimationFrame(() => {
          const el = stepRefs.current[prevStep.id];
          el?.focus();
          const len = el?.value.length ?? 0;
          el?.setSelectionRange(len, len);
        });
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  function handleGlobalEditKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!editing) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  /* Auto-grow the paraphrase textarea to fit content (tablet variant only). */
  const paraRows = Math.max(
    2,
    paraphrase.split('\n').length,
    Math.ceil(paraphrase.length / 60),
  );

  return (
    <div
      className="creative7-plan-card-glow rounded-2xl p-[2px]"
      style={{
        background: TRIMBLE_RAINBOW,
        backgroundSize: '200% 200%',
        width: '100%',
      }}
    >
      <div
        className="rounded-[14px] flex flex-col"
        style={{
          backgroundColor: editing
            ? 'var(--modus-wc-color-base-100, #f6f8fa)'
            : 'var(--modus-wc-color-base-page, #ffffff)',
          transition: 'background-color 200ms ease',
        }}
        onKeyDown={handleGlobalEditKey}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{
                width: '28px',
                height: '28px',
                background:
                  'linear-gradient(135deg, var(--modus-wc-color-primary-light, #e8f4fd) 0%, var(--modus-wc-color-secondary-light, #f3f0ff) 100%)',
                border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              }}
              aria-hidden="true"
            >
              <ModusWcIcon
                name="compass"
                size="sm"
                decorative
                style={{ color: 'var(--modus-wc-color-primary, #0063A7)' }}
              />
            </span>
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
                lineHeight: 1.2,
              }}
            >
              Here&apos;s my plan
            </span>
          </div>

          {editing && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
              style={{
                fontSize: '10px',
                backgroundColor: 'var(--modus-wc-color-primary-light, #e8f4fd)',
                color: 'var(--modus-wc-color-primary, #0063A7)',
                letterSpacing: '0.3px',
              }}
            >
              <ModusWcIcon name="pencil" size="xs" decorative />
              EDITING
            </span>
          )}
        </div>

        {/* Paraphrase — tablet variant only */}
        {isTablet && (
          <div className="flex flex-col gap-1 px-4 pb-3 w-full">
            <span
              className="font-semibold"
              style={{
                fontSize: '11px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                letterSpacing: '0.4px',
              }}
            >
              HERE&apos;S WHAT I&apos;LL DO
            </span>
            {editing ? (
              <textarea
                ref={paraRef}
                value={paraphrase}
                rows={paraRows}
                spellCheck
                onChange={(e) => setParaphrase(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    'var(--modus-wc-color-primary, #0063A7)';
                  e.currentTarget.style.boxShadow =
                    '0 0 0 3px var(--modus-wc-color-primary-light, #e8f4fd)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    'var(--modus-wc-color-base-200, #cbd2d9)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={{
                  ...EDIT_INPUT_BASE,
                  resize: 'vertical',
                  minWidth: 0,
                  maxWidth: '100%',
                  minHeight: '60px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => startEdit('paraphrase')}
                className="text-left transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
                style={{
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  margin: '-2px -6px',
                  cursor: 'text',
                  width: 'calc(100% + 12px)',
                  minWidth: 0,
                }}
                aria-label="Edit paraphrase"
              >
                <span
                  title={paraphrase}
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {paraphrase}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Plan checklist — visually distinct panel, with inline step editing */}
        <div className="px-4 pb-3 w-full">
          <div
            className="flex flex-col gap-2 rounded-lg"
            style={{
              backgroundColor: editing
                ? 'var(--modus-wc-color-base-page, #ffffff)'
                : 'var(--modus-wc-color-base-100, #f1f1f6)',
              border: editing
                ? '1px solid var(--modus-wc-color-base-200, #cbd2d9)'
                : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              padding: '12px 14px',
              transition: 'background-color 150ms ease, border-color 150ms ease',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-semibold"
                style={{
                  fontSize: '11px',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  letterSpacing: '0.4px',
                }}
              >
                {steps.length} STEPS
              </span>
              {!editing && (
                <button
                  type="button"
                  onClick={() => startEdit('first-step')}
                  title="Edit plan"
                  aria-label="Edit plan"
                  className="flex items-center justify-center transition-colors hover:bg-[var(--modus-wc-color-base-page)]"
                  style={{
                    width: '26px',
                    height: '26px',
                    background: 'var(--modus-wc-color-base-page, #ffffff)',
                    border: '1px solid var(--modus-wc-color-base-200, #cbd2d9)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <ModusWcIcon
                    name="pencil"
                    size="xs"
                    decorative
                    style={{
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    }}
                  />
                </button>
              )}
            </div>

            <ol className="flex flex-col gap-1.5 m-0 p-0 list-none w-full">
              {steps.map((step, i) => (
                <li
                  key={step.id}
                  className="group flex items-start gap-2.5 min-w-0 w-full"
                  style={{ position: 'relative' }}
                >
                  <span
                    className="flex items-center justify-center rounded-full shrink-0 font-semibold"
                    style={{
                      width: '20px',
                      height: '20px',
                      fontSize: '11px',
                      backgroundColor: 'var(--modus-wc-color-primary, #0063A7)',
                      color: 'var(--modus-wc-color-primary-content, #ffffff)',
                      marginTop: '1px',
                    }}
                  >
                    {i + 1}
                  </span>

                  {editing ? (
                    <input
                      ref={(el) => {
                        stepRefs.current[step.id] = el;
                      }}
                      type="text"
                      value={step.label}
                      placeholder="Describe this step…"
                      onChange={(e) => updateStep(step.id, e.target.value)}
                      onKeyDown={(e) => handleStepKeyDown(e, step, i)}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          'var(--modus-wc-color-primary, #0063A7)';
                        e.currentTarget.style.boxShadow =
                          '0 0 0 3px var(--modus-wc-color-primary-light, #e8f4fd)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          'var(--modus-wc-color-base-200, #cbd2d9)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      style={{
                        ...EDIT_INPUT_BASE,
                        padding: '6px 10px',
                        fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                        lineHeight: 1.4,
                        flex: 1,
                        minWidth: 0,
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(step.id)}
                      className="text-left transition-colors hover:bg-[var(--modus-wc-color-base-page)] min-w-0"
                      style={{
                        background: 'transparent',
                        border: '1px solid transparent',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        margin: '-2px -6px',
                        cursor: 'text',
                        flex: 1,
                        minWidth: 0,
                      }}
                      aria-label={`Edit step ${i + 1}`}
                    >
                      <span
                        title={step.label}
                        style={{
                          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                          color: 'var(--modus-wc-color-base-content, #171c1e)',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {step.label}
                      </span>
                    </button>
                  )}

                  {editing && steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      title="Remove step"
                      aria-label={`Remove step ${i + 1}`}
                      className="flex items-center justify-center rounded shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      style={{
                        width: '22px',
                        height: '22px',
                        background: 'transparent',
                        border: '1px solid transparent',
                        cursor: 'pointer',
                        marginTop: '0px',
                      }}
                    >
                      <ModusWcIcon
                        name="close"
                        size="xs"
                        decorative
                        style={{
                          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                        }}
                      />
                    </button>
                  )}
                </li>
              ))}
            </ol>

            {editing && (
              <button
                type="button"
                onClick={() => addStepAfter(steps[steps.length - 1]?.id ?? null)}
                className="flex items-center gap-1.5 self-start rounded transition-colors hover:bg-[var(--modus-wc-color-base-page)]"
                style={{
                  background: 'transparent',
                  border: '1px dashed var(--modus-wc-color-primary, #0063A7)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  color: 'var(--modus-wc-color-primary, #0063A7)',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '4px',
                }}
              >
                <ModusWcIcon name="add" size="xs" decorative />
                Add step
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-between gap-2 px-4 py-2.5"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          {editing ? (
            <>
              <span />
              <div className="flex items-center gap-2">
                <ModusWcButton
                  size="sm"
                  color="tertiary"
                  variant="outlined"
                  onButtonClick={cancelEdit}
                >
                  Cancel
                </ModusWcButton>
                <ModusWcButton size="sm" color="primary" onButtonClick={saveEdit}>
                  <span className="flex items-center gap-1">
                    <ModusWcIcon name="check" size="xs" decorative />
                    Save plan
                  </span>
                </ModusWcButton>
              </div>
            </>
          ) : (
            <>
              {isTablet ? (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  Click any line to edit the plan
                </span>
              ) : (
                <span />
              )}
              <ModusWcButton
                size="sm"
                color="primary"
                disabled={!planReady || undefined}
                onButtonClick={() => {
                  /* Hand-off to the run state would happen here. */
                }}
              >
                <span className="flex items-center gap-1">
                  Run
                  <ModusWcIcon name="arrow_right" size="xs" decorative />
                </span>
              </ModusWcButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Side nav (Figma TI_M2 tablet · 64px collapsed) ─────────────── */

function SideNavButton({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
      style={{
        width: '40px',
        height: '40px',
        background: 'transparent',
        border: '1px solid transparent',
        cursor: 'pointer',
      }}
    >
      <ModusWcIcon
        name={icon}
        size="sm"
        decorative
        style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}
      />
    </button>
  );
}

function SideNav() {
  return (
    <aside
      className="flex flex-col items-center justify-between shrink-0"
      style={{
        width: '64px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        borderRight: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '4px 0 10px rgba(0,0,0,0.04)',
        paddingTop: '12px',
        paddingBottom: '12px',
      }}
      aria-label="Trimble AI navigation"
    >
      {/* Top — menu collapse + new chat */}
      <div className="flex flex-col items-center gap-2">
        <SideNavButton icon="menu" label="Collapse navigation" />
        <SideNavButton icon="comment_add" label="New chat" />
      </div>

      {/* Footer — settings */}
      <div className="flex flex-col items-center gap-2">
        <SideNavButton icon="settings" label="Settings" />
      </div>
    </aside>
  );
}

/* ── Chat thread (shared between variants) ──────────────────────── */

function ChatThread() {
  const variantCtx = useCreative7Variant();
  const isTablet = (variantCtx?.variant ?? 'plan-only') === 'tablet';

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '464px' }}>
      {/* User turn — tablet variant only */}
      {isTablet && (
        <div className="flex flex-col items-end gap-1">
          <div
            className="rounded-2xl rounded-tr-md px-3 py-2"
            style={{
              maxWidth: '78%',
              backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              lineHeight: 1.5,
            }}
          >
            {USER_REQUEST}
          </div>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            You · just now
          </span>
        </div>
      )}

      {/* AI turn */}
      <div className="flex items-start gap-3">
        <div className="shrink-0" style={{ marginTop: '-2px' }}>
          <TrimbleAiLogo size={28} />
        </div>
        <div className="flex flex-col gap-3 min-w-0 flex-1">
          <span
            style={{
              fontSize: '13px',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: 1.55,
            }}
          >
            Before I dig in, here&apos;s how I&apos;m planning to approach it — confirm
            or reshape it and I&apos;ll get started.
          </span>

          {/* The plan card sits inline as the AI's structured response */}
          <PlanCard />

          {isTablet && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                lineHeight: 1.5,
              }}
            >
              I&apos;ll only start once you confirm.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tablet shell — full chat surface (side nav + avatar + prompt bar) */

function TabletShell() {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-row relative"
      style={{
        width: '768px',
        height: '700px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.06)',
      }}
    >
      {/* Side nav — full height */}
      <SideNav />

      {/* Right canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Avatar — top-right corner */}
        <div
          className="absolute flex items-center justify-center rounded-full overflow-hidden"
          style={{
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--modus-wc-color-primary-light, #e8f4fd)',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            zIndex: 2,
          }}
          aria-label="Profile"
          role="img"
        >
          <ModusWcIcon
            name="person"
            size="sm"
            decorative
            style={{ color: 'var(--modus-wc-color-primary, #0063A7)' }}
          />
        </div>

        {/* Chat thread — centered horizontally + vertically */}
        <div
          className="creative7-chat-scroll flex-1 flex flex-col justify-center items-center min-h-0 overflow-y-auto"
          style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '64px', paddingBottom: '24px' }}
        >
          <ChatThread />
        </div>

        {/* Composer — centered, sits at the bottom of the right canvas */}
        <div
          className="flex justify-center"
          style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '16px' }}
        >
          <div style={{ width: '100%', maxWidth: '464px' }}>
            <PromptBar />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Plan-only shell — just the centered chat thread, no chrome ─── */

function PlanOnlyShell() {
  /* Use `transform: scale()` (standard) instead of `zoom` (non-standard) so
     Cursor's Select Element tool and the browser inspector hit-test cleanly
     on the scaled UI. We wrap with an outer flex centerer so the scaled
     child stays centered even though `transform` doesn't affect layout size. */
  return (
    <div className="w-full flex justify-center">
      <div
        style={{
          transform: 'scale(1.15)',
          transformOrigin: 'top center',
        }}
      >
        <ChatThread />
      </div>
    </div>
  );
}

/* ── Top-level: pick variant from context (default: tablet) ─────── */

export default function Creative7() {
  const variantCtx = useCreative7Variant();
  const variant: Creative7Variant = variantCtx?.variant ?? 'plan-only';

  return variant === 'tablet' ? <TabletShell /> : <PlanOnlyShell />;
}

/* ── prompt bar (Figma node 549:61090, copy-pasted from Creative 3) ─ */

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
      {/* _Prompt/Base — Trimble light grey stroke */}
      <div
        className="flex items-center justify-between w-full overflow-hidden"
        style={{
          height: '42px',
          border: '2px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderRadius: '12px',
          padding: '4px',
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
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
          style={{ gap: '0px', marginRight: '-4px' }}
          data-name="Basic Actions"
        >
          <button
            type="button"
            aria-label="Add attachment"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/assets/prompt-add.png"
              alt=""
              aria-hidden="true"
              style={{ width: '36px', height: '34px', display: 'block' }}
            />
          </button>
          <button
            type="button"
            aria-label="Send prompt"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/assets/prompt-send.png"
              alt=""
              aria-hidden="true"
              style={{ width: '36px', height: '34px', display: 'block' }}
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
