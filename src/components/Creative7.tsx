import { useMemo, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

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

interface AssumptionOption {
  value: string;
  hint: string;
}

const ASSUMPTION_LABEL = 'Cost vs. schedule priority';
const ASSUMPTION_OPTIONS: AssumptionOption[] = [
  { value: 'Cost-first', hint: 'Allow up to a 2-week slip to save money' },
  { value: 'Schedule-first', hint: 'Hold the date, accept higher cost' },
  { value: 'Balanced', hint: 'Weight cost and schedule equally' },
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

function PlanCard() {
  const [paraphrase, setParaphrase] = useState(PARAPHRASE_DEFAULT);
  const [editingParaphrase, setEditingParaphrase] = useState(false);
  const [paraphraseDraft, setParaphraseDraft] = useState(PARAPHRASE_DEFAULT);

  const [assumption, setAssumption] = useState<string>(ASSUMPTION_OPTIONS[0].value);
  const [assumptionOpen, setAssumptionOpen] = useState(false);

  const planReady = useMemo(
    () => paraphrase.trim().length > 0 && !editingParaphrase,
    [paraphrase, editingParaphrase],
  );

  function saveParaphrase() {
    const next = paraphraseDraft.trim();
    if (next.length > 0) setParaphrase(next);
    setEditingParaphrase(false);
  }

  function cancelParaphrase() {
    setParaphraseDraft(paraphrase);
    setEditingParaphrase(false);
  }

  return (
    <div
      className="rounded-2xl p-[2px]"
      style={{
        background: TRIMBLE_RAINBOW,
        boxShadow: '0 10px 28px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
        width: '100%',
      }}
    >
      <div
        className="rounded-[14px] flex flex-col"
        style={{ backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)' }}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <ModusWcIcon
              name="list_view"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-primary, #0063A7)' }}
            />
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
            >
              Plan to confirm
            </span>
          </div>
          <span
            className="rounded-full px-2 py-0.5 font-semibold"
            style={{
              fontSize: '10px',
              backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              letterSpacing: '0.3px',
            }}
          >
            CONFIRM BEFORE RUN
          </span>
        </div>

        {/* Paraphrase */}
        <div className="flex flex-col gap-1 px-4 pb-3">
          <div className="flex items-center justify-between">
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
            {!editingParaphrase && (
              <button
                type="button"
                onClick={() => {
                  setParaphraseDraft(paraphrase);
                  setEditingParaphrase(true);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
              >
                <ModusWcIcon
                  name="edit_combination"
                  size="xs"
                  decorative
                  style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                />
                <span
                  className="font-medium"
                  style={{
                    fontSize: '11px',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                  }}
                >
                  Reword
                </span>
              </button>
            )}
          </div>

          {editingParaphrase ? (
            <div className="flex flex-col gap-2">
              <ModusWcTextInput
                value={paraphraseDraft}
                bordered={false}
                onInputChange={(e: CustomEvent) =>
                  setParaphraseDraft(e.detail?.target?.value || '')
                }
              />
              <div className="flex justify-end gap-2">
                <ModusWcButton
                  size="sm"
                  color="tertiary"
                  variant="outlined"
                  onButtonClick={cancelParaphrase}
                >
                  Cancel
                </ModusWcButton>
                <ModusWcButton size="sm" color="primary" onButtonClick={saveParaphrase}>
                  Save
                </ModusWcButton>
              </div>
            </div>
          ) : (
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: 1.5,
              }}
            >
              {paraphrase}
            </span>
          )}
        </div>

        {/* Plan checklist */}
        <div className="flex flex-col gap-1.5 px-4 pb-3">
          <span
            className="font-semibold"
            style={{
              fontSize: '11px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              letterSpacing: '0.4px',
            }}
          >
            PLAN · {PLAN_STEPS.length} STEPS
          </span>
          <ol className="flex flex-col gap-1 m-0 p-0 list-none">
            {PLAN_STEPS.map((step, i) => (
              <li key={step.id} className="flex items-start gap-2.5">
                <span
                  className="flex items-center justify-center rounded-full shrink-0 font-semibold"
                  style={{
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                    backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                    marginTop: '2px',
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    lineHeight: 1.45,
                  }}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Inline assumption */}
        <div className="px-4 pb-3">
          <div
            className="flex flex-col gap-2 rounded-lg p-2.5"
            style={{
              backgroundColor: 'var(--modus-wc-color-status-warning-light, #fff8e1)',
              border: '1px solid rgba(133, 100, 4, 0.18)',
            }}
          >
            <button
              type="button"
              onClick={() => setAssumptionOpen((p) => !p)}
              className="flex items-center gap-2 text-left"
              aria-expanded={assumptionOpen}
            >
              <ModusWcIcon
                name="alert_outline"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-status-warning, #856404)', flexShrink: 0 }}
              />
              <span
                className="font-semibold"
                style={{
                  fontSize: '11px',
                  color: 'var(--modus-wc-color-status-warning, #856404)',
                  letterSpacing: '0.3px',
                }}
              >
                ONE ASSUMPTION
              </span>
              <span
                className="flex-1 truncate"
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 13.5px)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                }}
              >
                {ASSUMPTION_LABEL} · <span className="font-semibold">{assumption}</span>
              </span>
              <ModusWcIcon
                name={assumptionOpen ? 'caret_up' : 'caret_down'}
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-status-warning, #856404)', flexShrink: 0 }}
              />
            </button>

            {assumptionOpen && (
              <div className="flex flex-wrap gap-1.5">
                {ASSUMPTION_OPTIONS.map((opt) => {
                  const active = opt.value === assumption;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAssumption(opt.value)}
                      className="flex flex-col gap-0.5 text-left rounded-md px-2 py-1.5 transition-colors"
                      style={{
                        backgroundColor: active
                          ? 'var(--modus-wc-color-status-warning, #856404)'
                          : 'var(--modus-wc-color-base-page, #ffffff)',
                        border: `1px solid ${
                          active
                            ? 'var(--modus-wc-color-status-warning, #856404)'
                            : 'rgba(133, 100, 4, 0.25)'
                        }`,
                        color: active
                          ? '#ffffff'
                          : 'var(--modus-wc-color-base-content, #171c1e)',
                        minWidth: '120px',
                      }}
                      aria-pressed={active}
                    >
                      <span
                        className="font-semibold"
                        style={{ fontSize: '12px', lineHeight: 1.2 }}
                      >
                        {opt.value}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          opacity: active ? 0.85 : 0.7,
                          lineHeight: 1.3,
                        }}
                      >
                        {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-2.5"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <ModusWcButton
            size="sm"
            color="tertiary"
            variant="outlined"
            onButtonClick={() => {
              setParaphraseDraft(paraphrase);
              setEditingParaphrase(true);
            }}
          >
            <span className="flex items-center gap-1">
              <ModusWcIcon name="edit_combination" size="xs" decorative />
              Edit plan
            </span>
          </ModusWcButton>
          <ModusWcButton
            size="sm"
            color="primary"
            disabled={!planReady || undefined}
            onButtonClick={() => {
              /* Hand-off to the run state would happen here. */
            }}
          >
            <span className="flex items-center gap-1">
              Looks good — run
              <ModusWcIcon name="arrow_right" size="xs" decorative />
            </span>
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ── Chat shell ─────────────────────────────────────────────────── */

export default function Creative7() {
  const [composer, setComposer] = useState('');

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        width: '560px',
        height: '720px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.06)',
      }}
    >
      {/* Chat header */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <TrimbleAiLogo size={22} />
          <div className="flex flex-col min-w-0">
            <span
              className="font-semibold truncate"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
                lineHeight: 1.2,
              }}
            >
              Trimble AI
            </span>
            <span
              className="flex items-center gap-1 truncate"
              style={{
                fontSize: '11px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                margin: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--modus-wc-color-status-success, #1e7e34)',
                  display: 'inline-block',
                }}
              />
              Plan mode · waiting on your confirmation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="New conversation"
            aria-label="New conversation"
            className="flex items-center justify-center rounded-md transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            <ModusWcIcon
              name="add_square"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content, #364153)' }}
            />
          </button>
          <button
            type="button"
            title="History"
            aria-label="History"
            className="flex items-center justify-center rounded-md transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            <ModusWcIcon
              name="history"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content, #364153)' }}
            />
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div
        className="flex-1 flex flex-col gap-4 px-4 py-4 overflow-y-auto"
        style={{ backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)' }}
      >
        {/* User turn */}
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

        {/* AI turn */}
        <div className="flex items-start gap-2">
          <div className="pt-0.5">
            <TrimbleAiLogo size={22} />
          </div>
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-base-content, #101828)',
                }}
              >
                Trimble AI
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                just now
              </span>
            </div>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: 1.55,
              }}
            >
              Before I dig in, here&apos;s how I&apos;m planning to approach it — confirm
              or reshape it and I&apos;ll get started.
            </span>

            {/* The plan card sits inline as the AI's structured response */}
            <PlanCard />

            <span
              style={{
                fontSize: '11px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                lineHeight: 1.5,
              }}
            >
              I&apos;ll only start once you confirm. Reword anything that misses the
              mark, or change the assumption.
            </span>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div
        className="px-3 py-3"
        style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-2 py-1.5"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          }}
        >
          <button
            type="button"
            title="Attach"
            aria-label="Attach"
            className="flex items-center justify-center rounded-md transition-colors hover:bg-[var(--modus-wc-color-base-200)] shrink-0"
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            <ModusWcIcon
              name="attach_file"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
            />
          </button>

          <div className="flex-1 min-w-0">
            <ModusWcTextInput
              value={composer}
              bordered={false}
              placeholder="Ask a follow-up or refine the plan…"
              onInputChange={(e: CustomEvent) =>
                setComposer(e.detail?.target?.value || '')
              }
            />
          </div>

          <ModusWcButton
            size="sm"
            color="primary"
            shape="square"
            disabled={composer.trim().length === 0 || undefined}
            onButtonClick={() => setComposer('')}
            aria-label="Send"
          >
            <ModusWcIcon name="send" size="sm" decorative />
          </ModusWcButton>
        </div>
        <div className="flex items-center justify-between pt-1.5 px-1">
          <span
            style={{
              fontSize: '10px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Trimble AI · Plan mode
          </span>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            ⏎ to send · Shift⏎ for newline
          </span>
        </div>
      </div>
    </div>
  );
}
