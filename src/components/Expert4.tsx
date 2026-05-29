import { useEffect, useRef, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Expert 4 — EXPLAIN WHY
 *
 * To provide evidence-based clarity & traceability.
 *
 * An expert doesn't just give an answer; they provide the evidence.
 * The AI surfaces the exact source — internal policy, contract
 * paragraph, etc. — that backs up its claim, so the user can verify
 * the reasoning at the paragraph level.
 *
 * UI follows the Figma reference: one inline citation marker on the
 * answer; tapping it reveals a small evidence card showing the
 * source title, the cited section, the exact paragraph with the
 * load-bearing phrase highlighted, and a "View document" button.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

const CITATION = {
  title: 'Trimble Internal Policy — AI Governance',
  updated: 'Last updated: March 2025',
  section: 'Section 4.2 — External Data Sharing',
  quote:
    'AI-generated outputs related to project schedules, forecasts, or recommendations **must be reviewed and approved by an authorized project manager** before being shared with any external party.',
};

const ANSWER_LEAD =
  'AI-generated schedule recommendations can be shared with external contractors only after internal validation and approval by the project manager.';

const ANSWER_TRAIL =
  'This ensures that automated insights align with contractual and compliance requirements.';

/* ── Mini Trimble AI logo ───────────────────────────────────────── */
function TrimbleAiLogo({ size = 24 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 30.002 32.6797" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="expert4-logo" x1="3.7558" y1="10.5251" x2="20.4332" y2="30.2565" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF2BFC" />
            <stop offset="0.628993" stopColor="#0563A7" />
            <stop offset="1" stopColor="#075CA4" />
          </linearGradient>
        </defs>
        <path
          d="M1.69824 24.9697C3.48353 26.9109 5.82653 28.2524 8.4043 28.8096L1.69824 32.6797V24.9697ZM10.6523 5.60742C16.5357 5.60742 21.3057 10.3803 21.3057 16.2676C21.3055 22.1547 16.5356 26.9268 10.6523 26.9268C4.76928 26.9265 0.00017177 22.1545 0 16.2676C0 10.3805 4.76918 5.60766 10.6523 5.60742ZM10.6523 7.69238C5.9201 7.69263 2.08398 11.5321 2.08398 16.2676C2.08416 21.0029 5.92021 24.8416 10.6523 24.8418C15.3847 24.8418 19.2215 21.003 19.2217 16.2676C19.2217 11.532 15.3848 7.69238 10.6523 7.69238ZM30.002 16.3398L23.2803 20.2217C24.0854 17.7019 24.0922 14.9945 23.2998 12.4707L30.002 16.3398ZM8.35547 3.83691C5.79861 4.40439 3.47535 5.73916 1.69824 7.66309V0L8.35547 3.83691Z"
          fill="url(#expert4-logo)"
        />
      </svg>
    </span>
  );
}

/* ── User chat bubble ───────────────────────────────────────────── */
function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="flex items-center"
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

/* ── Action icon button (thumbs / refresh / share / copy) ───────── */
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

/* ── Inline citation marker — small numbered pill ───────────────── */
function CitationMarker({
  number,
  active,
  onClick,
}: {
  number: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Show source ${number}`}
      className="inline-flex items-center justify-center align-baseline transition-colors"
      style={{
        minWidth: '18px',
        height: '18px',
        padding: '0 5px',
        marginLeft: '4px',
        borderRadius: '999px',
        backgroundColor: active
          ? 'var(--modus-wc-color-primary, #0063a3)'
          : 'var(--modus-wc-color-base-200, #e0e1e9)',
        color: active ? '#ffffff' : 'var(--modus-wc-color-base-content, #171c1e)',
        fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
        fontWeight: 700,
        lineHeight: '18px',
        border: 'none',
        cursor: 'pointer',
        verticalAlign: 'middle',
        position: 'relative',
        top: '-1px',
      }}
    >
      {number}
    </button>
  );
}

/* ── Quote with highlighted phrases (text between **double asterisks**) */
function HighlightedQuote({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p
      style={{
        fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
        lineHeight: '16px',
        color: 'var(--modus-wc-color-base-content, #171c1e)',
        margin: 0,
      }}
    >
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2);
          return (
            <span
              key={idx}
              style={{
                backgroundColor: 'var(--orange-100, #ffedd5)',
                padding: '1px 2px',
                borderRadius: '2px',
              }}
            >
              {inner}
            </span>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </p>
  );
}

/* ── Evidence Card — small popover next to the answer ───────────── */
function EvidenceCard({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-label={`Source: ${CITATION.title}`}
      className="flex flex-col"
      style={{
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
        padding: '12px',
        gap: '12px',
        boxShadow:
          '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header: title + last updated */}
      <div className="flex flex-col">
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            fontWeight: 700,
            lineHeight: '20px',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          {CITATION.title}
        </span>
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            lineHeight: '16px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          {CITATION.updated}
        </span>
      </div>

      {/* Quote */}
      <div className="flex gap-2">
        <span
          aria-hidden
          className="shrink-0"
          style={{
            width: '2px',
            borderRadius: '2px',
            backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)',
            alignSelf: 'stretch',
          }}
        />
        <HighlightedQuote text={`${CITATION.section}: ${CITATION.quote}`} />
      </div>

      {/* View document */}
      <ModusWcButton
        size="sm"
        variant="outlined"
        color="secondary"
        onButtonClick={onClose}
      >
        View document
      </ModusWcButton>
    </div>
  );
}

/* ── Expert 4 — Explain Why ─────────────────────────────────────── */
export default function Expert4() {
  const [showEvidence, setShowEvidence] = useState(true);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState('');

  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showEvidence) return;
    function handleClick(event: MouseEvent) {
      if (!responseRef.current) return;
      if (!responseRef.current.contains(event.target as Node)) {
        setShowEvidence(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowEvidence(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showEvidence]);

  function handleCopy() {
    const cleanQuote = CITATION.quote.replace(/\*\*/g, '');
    const text = [
      ANSWER_LEAD,
      ANSWER_TRAIL,
      '',
      `Source: ${CITATION.title} — ${CITATION.section}`,
      `"${cleanQuote}"`,
    ].join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="bg-white rounded-xl flex flex-col"
      style={{
        width: '440px',
        boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.15)',
        padding: '24px 24px 8px 24px',
        gap: '24px',
      }}
    >
      {/* User prompt */}
      <UserBubble text="Are AI-generated schedule recommendations allowed to be shared with external contractors?" />

      {/* Agent response */}
      <div ref={responseRef} className="flex gap-0 items-start">
        {/* Avatar column */}
        <div className="flex items-start pr-2 pt-2 shrink-0">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: '40px', height: '40px' }}
          >
            <TrimbleAiLogo size={24} />
          </div>
        </div>

        {/* Bubble stack */}
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: '12px', padding: '8px 0' }}>
          {/* Answer with inline citation marker */}
          <p
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '24px',
              margin: 0,
            }}
          >
            {ANSWER_LEAD}
            <CitationMarker
              number={1}
              active={showEvidence}
              onClick={() => setShowEvidence((p) => !p)}
            />
          </p>

          <p
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '24px',
              margin: 0,
            }}
          >
            {ANSWER_TRAIL}
          </p>

          {/* Evidence card */}
          {showEvidence && <EvidenceCard onClose={() => setShowEvidence(false)} />}

          {/* Action toolbar */}
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
            <ActionIconButton
              icon="refresh"
              label="Regenerate"
              onClick={() => setShowEvidence(false)}
            />
            <ActionIconButton icon="share" label="Share" />
            <ActionIconButton
              icon={copied ? 'check' : 'content_copy'}
              label={copied ? 'Copied' : 'Copy response with source'}
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
              placeholder="How can I help you?"
              bordered={false}
              onInputChange={(e: CustomEvent) => setDraft(e.detail?.target?.value || '')}
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
                aria-label="Add context"
              >
                <ModusWcIcon name="sparkle" size="xs" decorative />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Add source"
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
                disabled={draft.trim() === ''}
                onClick={() => {
                  if (draft.trim() === '') return;
                  setDraft('');
                }}
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
