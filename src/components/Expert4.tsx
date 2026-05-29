import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Expert 4 — EXPLAIN WHY
 *
 * To provide evidence-based clarity & traceability.
 *
 * An expert doesn't just give an answer; they provide the evidence.
 * When advising the user, the AI should cite the specific source —
 * an internal policy, a contract paragraph — that backs up the
 * claim, so the user can verify the reasoning rather than taking
 * it on faith.
 *
 * Layout mirrors the guideline page's Avoid → Instead pattern, with
 * full chat components side-by-side rather than abstract pulls:
 *
 *   ┌─────────────────────┐   ┌─────────────────────┐
 *   │ [Avoid]             │   │ [Instead]           │
 *   │  vague, source-less │   │  same answer + cite │
 *   │  "should be fine"   │   │  evidence card      │
 *   └─────────────────────┘   └─────────────────────┘
 *
 * Both cards ask the same question; only the AI's evidence trail
 * differs.
 * ───────────────────────────────────────────────────────────────── */

const AVOID_ACCENT = 'var(--modus-wc-color-error, #d50057)';
const INSTEAD_ACCENT =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';
/** Solid colour used for the Instead pill so it reads cleanly at small
 *  sizes — the rainbow stays reserved for the card's border. */
const INSTEAD_PILL_COLOR = 'var(--modus-wc-color-success, #00b388)';
const PROMPT_TEXT =
  'Are AI-generated schedule recommendations allowed to be shared with external contractors?';

const CITATION = {
  title: 'Trimble Internal Policy — AI Governance',
  updated: 'Last updated: March 2025',
  section: 'Section 4.2 — External Data Sharing',
  quote:
    'AI-generated outputs related to project schedules, forecasts, or recommendations **must be reviewed and approved by an authorized project manager** before being shared with any external party.',
};

/* ── Mini Trimble AI logo ───────────────────────────────────────── */
function TrimbleAiLogo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
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
            id="expert4-logo"
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
          fill="url(#expert4-logo)"
        />
      </svg>
    </span>
  );
}

/* ── User chat bubble (gray, right-aligned) ─────────────────────── */
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

/* ── Coloured pill label — "Avoid" / "Instead" ──────────────────────
   `color` accepts a solid colour token OR a CSS gradient string.
   • Solid colour → opaque pill, white wordmark.
   • Gradient → white pill with a gradient border (padding-wrap) and the
     wordmark rendered in the same gradient via `background-clip: text`. */
function LabelPill({ label, color }: { label: string; color: string }) {
  const isGradient = color.includes('gradient');

  if (!isGradient) {
    return (
      <span
        className="inline-flex items-center justify-center"
        style={{
          background: color,
          color: '#ffffff',
          height: '32px',
          padding: '0 18px',
          borderRadius: '1000px',
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          fontWeight: 700,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          alignSelf: 'flex-start',
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className="inline-flex"
      style={{
        background: color,
        padding: '2px',
        borderRadius: '1000px',
        alignSelf: 'flex-start',
      }}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          height: '28px',
          padding: '0 16px',
          borderRadius: '1000px',
        }}
      >
        <span
          style={{
            background: color,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            fontWeight: 800,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </span>
    </span>
  );
}

/* ── A single chat card — the response slot is swapped per example ─
   Border is rendered via the padding-wrap technique so `accent` can be
   either a solid colour ("var(...)") or a gradient ("linear-gradient(...)").
   The outer + inner are both `flex flex-col` and `flex: 1` so the card
   stretches to match its sibling when the parent uses items-stretch. */
function ChatCard({
  accent,
  response,
  shadow = true,
  borderThickness = 1.5,
  glow = false,
}: {
  accent: string;
  response: ReactNode;
  shadow?: boolean;
  borderThickness?: number;
  /** When true, the rainbow gradient on the border slowly shifts position
   *  so the border line itself glitters. The drop shadow is unchanged. */
  glow?: boolean;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        width: '400px',
        background: accent,
        backgroundSize: glow ? '200% 100%' : '100% 100%',
        animation: glow
          ? 'expert4-rainbow-shimmer 3.6s ease-in-out infinite'
          : undefined,
        padding: `${borderThickness}px`,
        borderRadius: `${12 + borderThickness}px`,
        boxShadow: shadow ? '0px 0px 10px 0px rgba(0,0,0,0.15)' : 'none',
        flex: 1,
      }}
    >
      <div
        className="bg-white flex flex-col"
        style={{
          padding: '24px',
          gap: '24px',
          borderRadius: '12px',
          flex: 1,
        }}
      >
        {/* User prompt — same wording on both sides */}
        <UserBubble text={PROMPT_TEXT} />

        {/* Agent response */}
        <div className="flex gap-0 items-start">
          {/* Avatar column — 40px wrapper vertically centers the logo. */}
          <div className="flex items-start pr-2 shrink-0">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: '40px', height: '40px' }}
            >
              <TrimbleAiLogo size={32} />
            </div>
          </div>

          {/* Bubble stack */}
          <div
            className="flex flex-col flex-1 min-w-0"
            style={{ gap: '12px', padding: '8px 0' }}
          >
            {response}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Re-usable response paragraph ────────────────────────────────── */
function ResponseParagraph({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 'var(--modus-wc-font-size-sm, 14px)',
        color: 'var(--modus-wc-color-base-content, #171c1e)',
        lineHeight: '22px',
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

/* ── Thinking-dots placeholder shown before typing starts ─────────── */
function ThinkingDots() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setPhase((p) => (p + 1) % 3), 350);
    return () => window.clearInterval(id);
  }, []);

  const dot = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
    transition: 'opacity 200ms ease, transform 200ms ease',
  } as const;

  return (
    <div
      aria-label="Thinking"
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        minHeight: '22px',
        padding: '4px 0',
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            ...dot,
            opacity: phase === i ? 1 : 0.35,
            transform: phase === i ? 'scale(1.15)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  );
}

/* ── Blinking caret shown at the typing position ─────────────────── */
function BlinkingCaret() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = window.setInterval(() => setOn((v) => !v), 530);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '2px',
        height: '14px',
        marginLeft: '2px',
        verticalAlign: 'text-bottom',
        backgroundColor: 'var(--modus-wc-color-base-content, #171c1e)',
        opacity: on ? 1 : 0,
        transition: 'opacity 60ms',
      }}
    />
  );
}

/* ── Typed response — a list of paragraphs, each a list of parts.
   String parts are typed char-by-char; element parts appear instantly
   once all preceding text has been typed. ───────────────────────── */
type TypingPart = string | ReactNode;
type TypingBlock = TypingPart[];

function TypingResponse({
  blocks,
  speed = 10,
  enabled = true,
  onComplete,
}: {
  blocks: TypingBlock[];
  speed?: number;
  enabled?: boolean;
  onComplete?: () => void;
}) {
  const totalChars = useMemo(() => {
    let total = 0;
    for (const block of blocks) {
      for (const part of block) {
        if (typeof part === 'string') total += part.length;
      }
    }
    return total;
  }, [blocks]);

  const [progress, setProgress] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled) return;
    if (progress >= totalChars) return;
    const id = window.setTimeout(() => setProgress((p) => p + 1), speed);
    return () => window.clearTimeout(id);
  }, [enabled, progress, totalChars, speed]);

  const finished = enabled && totalChars > 0 && progress >= totalChars;
  useEffect(() => {
    if (finished) onCompleteRef.current?.();
  }, [finished]);

  const effectiveProgress = enabled ? progress : 0;
  const done = enabled && progress >= totalChars;
  let charsSeen = 0;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {blocks.map((block, bi) => (
        <ResponseParagraph key={bi}>
          {block.map((part, pi) => {
            if (typeof part === 'string') {
              const partStart = charsSeen;
              const partEnd = charsSeen + part.length;
              charsSeen = partEnd;

              const typedChars = Math.max(
                0,
                Math.min(part.length, effectiveProgress - partStart),
              );
              const typed = part.slice(0, typedChars);
              const untyped = part.slice(typedChars);

              const caretInPart =
                enabled &&
                !done &&
                effectiveProgress >= partStart &&
                effectiveProgress < partEnd;

              return (
                <Fragment key={pi}>
                  {typed}
                  {caretInPart && <BlinkingCaret />}
                  {untyped && (
                    <span aria-hidden="true" style={{ visibility: 'hidden' }}>
                      {untyped}
                    </span>
                  )}
                </Fragment>
              );
            }
            const visible = charsSeen <= effectiveProgress;
            return (
              <span
                key={pi}
                aria-hidden={!visible}
                style={{ visibility: visible ? 'visible' : 'hidden' }}
              >
                {part}
              </span>
            );
          })}
        </ResponseParagraph>
      ))}

      {!enabled && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
          }}
        >
          <ThinkingDots />
        </div>
      )}
    </div>
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
      aria-expanded={active}
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

/* ── Evidence card — appears below the answer when the citation is open */
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
        gap: '10px',
        boxShadow:
          '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
        animation:
          'expert4-evidence-in 180ms cubic-bezier(0.22, 0.61, 0.36, 1)',
      }}
    >
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

      <ModusWcButton
        size="sm"
        variant="outlined"
        color="secondary"
        onButtonClick={onClose}
      >
        <span className="flex items-center gap-2">
          <ModusWcIcon name="launch" size="xs" decorative />
          View document
        </span>
      </ModusWcButton>
    </div>
  );
}

/* ── Avoid response — confident but source-less ─────────────────── */
function AvoidResponse({ onComplete }: { onComplete?: () => void }) {
  return (
    <TypingResponse
      onComplete={onComplete}
      blocks={[
        [
          'Yes, that should be fine. AI-generated schedule recommendations are typically allowed to be shared with external contractors as long as a project manager has approved them first.',
        ],
        [
          'Most teams handle this informally — just loop the PM in before sending anything out.',
        ],
      ]}
    />
  );
}

/* ── Instead response — same answer, but with an inline citation ── */
function InsteadResponse({ enabled }: { enabled: boolean }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [typingDone, setTypingDone] = useState(false);

  const citationMarker = (
    <CitationMarker
      key="cite-1"
      number={1}
      active={showEvidence}
      onClick={() => setShowEvidence((p) => !p)}
    />
  );

  const blocks: TypingBlock[] = [
    [
      'Yes — but only after a project manager validates and approves them.',
      citationMarker,
    ],
    [
      'Per Section 4.2 of the Trimble AI Governance policy, any AI-generated schedule output must be reviewed and approved by an authorized project manager before being shared with any external party.',
    ],
  ];

  return (
    <div className="flex flex-col" style={{ gap: '12px' }}>
      <TypingResponse
        blocks={blocks}
        enabled={enabled}
        onComplete={() => {
          setTypingDone(true);
          window.setTimeout(() => setShowEvidence(true), 250);
        }}
      />
      {typingDone && showEvidence && (
        <EvidenceCard onClose={() => setShowEvidence(false)} />
      )}
    </div>
  );
}

/* ── Expert 4 — Explain Why ─────────────────────────────────────── */
export default function Expert4() {
  /** Instead starts typing only after Avoid finishes (+ a brief pause). */
  const [insteadEnabled, setInsteadEnabled] = useState(false);

  return (
    <div className="flex items-stretch" style={{ gap: '24px' }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes expert4-rainbow-shimmer {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes expert4-evidence-in {
              0% { opacity: 0; transform: translateY(-4px) scale(0.985); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
          `,
        }}
      />

      {/* AVOID — same question, confident answer with no source */}
      <div className="flex flex-col" style={{ gap: '10px' }}>
        <LabelPill label="Avoid" color={AVOID_ACCENT} />
        <ChatCard
          accent={AVOID_ACCENT}
          shadow={false}
          response={
            <AvoidResponse
              onComplete={() =>
                window.setTimeout(() => setInsteadEnabled(true), 300)
              }
            />
          }
        />
      </div>

      {/* INSTEAD — same question, cited evidence */}
      <div className="flex flex-col" style={{ gap: '10px' }}>
        <LabelPill label="Instead" color={INSTEAD_PILL_COLOR} />
        <ChatCard
          accent={INSTEAD_ACCENT}
          borderThickness={2}
          glow={insteadEnabled}
          response={<InsteadResponse enabled={insteadEnabled} />}
        />
      </div>
    </div>
  );
}
