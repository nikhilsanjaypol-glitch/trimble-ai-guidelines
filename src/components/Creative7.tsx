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

  const [assumption] = useState<string>(ASSUMPTION_OPTIONS[0].value);

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
        </div>

        {/* Paraphrase */}
        <div className="flex flex-col gap-1 px-4 pb-3">
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

        {/* Inline assumption — plain text */}
        <div className="px-4 pb-3">
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 13.5px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              lineHeight: 1.5,
            }}
          >
            <span
              className="font-semibold"
              style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}
            >
              One assumption:
            </span>{' '}
            {ASSUMPTION_LABEL} · <span className="font-semibold">{assumption}</span>
          </span>
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

/* ── Chat shell ─────────────────────────────────────────────────── */

export default function Creative7() {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-row"
      style={{
        width: '624px',
        height: '720px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.06)',
      }}
    >
      <SideNav />

      <div className="flex-1 flex flex-col min-w-0">
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
            </div>
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
              I&apos;ll only start once you confirm.
            </span>
          </div>
        </div>
      </div>

      {/* Composer — prompt bar copy-pasted from Creative 3 */}
      <div
        className="px-3 pb-3"
        style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <PromptBar />
      </div>
    </div>
  );
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
          style={{ gap: '0px' }}
          data-name="Basic Actions"
        >
          <button
            type="button"
            aria-label="Add attachment"
            style={{
              width: '48px',
              height: '48px',
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
              width: '48px',
              height: '48px',
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
