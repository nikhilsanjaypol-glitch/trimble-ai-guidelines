import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* ─────────────────────────────────────────────────────────────────
 * Expert 3 — PRIORITIZE CLARITY OVER COMPLEXITY
 *
 * To provide digestible information.
 *
 * Because the user is not an expert, AI must deliver information
 * concisely while presenting it in a digestible way. This means a
 * casual, conversational, human tone and avoiding technical jargon
 * or acronyms unless clearly defined.
 *
 * Layout — two pills act as tabs that drive a stacked card deck. The
 * Avoid card animates first; once it's done typing, the Instead card
 * smoothly slides on top of it and starts typing. The user can also
 * click either pill (or the peeking corner of the back card) at any
 * point to switch which card is on top.
 *
 *   [ Avoid ]  [ Instead ]    ← pills double as tabs
 *
 *   ┌────────────────────┐
 *   │  back card peeks   │    ← inactive card offset down-right
 *   │  ┌────────────────────┐
 *   │  │                    │
 *   │  │   active card on   │
 *   │  │   top, full size   │
 *   └──│                    │
 *      └────────────────────┘
 *
 * Both cards ask the same question; only the AI's voice differs.
 * ───────────────────────────────────────────────────────────────── */

const AVOID_ACCENT = 'var(--modus-wc-color-error, #d50057)';
const INSTEAD_ACCENT =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';
/** Solid colour used for the Instead pill so it reads cleanly at small
 *  sizes — the rainbow stays reserved for the card's border. */
const INSTEAD_PILL_COLOR = 'var(--modus-wc-color-success, #00b388)';
const PROMPT_TEXT = 'Is my site safe to build on?';

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
            id="expert3-logo"
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
          fill="url(#expert3-logo)"
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

/* ── PillTab — a coloured pill that doubles as a tab control ─────────
   Solid colour pill with a white wordmark. Active reads "lifted": full
   opacity, soft drop shadow, no scale-down. Inactive dims to 0.45 and
   scales slightly. Click brings the matching card to the front of the
   stack. */
function PillTab({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        background: color,
        color: '#ffffff',
        height: '32px',
        padding: '0 18px',
        borderRadius: '1000px',
        border: 'none',
        fontSize: 'var(--modus-wc-font-size-sm, 14px)',
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        cursor: active ? 'default' : 'pointer',
        opacity: active ? 1 : 0.45,
        transform: active ? 'scale(1)' : 'scale(0.96)',
        boxShadow: active ? '0 6px 14px rgba(0,0,0,0.18)' : 'none',
        transition:
          'opacity 280ms ease, transform 280ms ease, box-shadow 280ms ease',
        outline: 'none',
      }}
    >
      {label}
    </button>
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
          ? 'expert3-rainbow-shimmer 3.6s ease-in-out infinite'
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
        {/* User prompt — same casual phrasing on both sides */}
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

  // Stable ref so we can fire onComplete from an effect without re-running it.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled) return;
    if (progress >= totalChars) return;
    const id = window.setTimeout(() => setProgress((p) => p + 1), speed);
    return () => window.clearTimeout(id);
  }, [enabled, progress, totalChars, speed]);

  // Fire onComplete exactly once when typing finishes.
  const finished = enabled && totalChars > 0 && progress >= totalChars;
  useEffect(() => {
    if (finished) onCompleteRef.current?.();
  }, [finished]);

  /** Until enabled, treat progress as 0 so all chars render hidden but the
   *  full final text still computes the layout (fixed container size). */
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

              // The caret sits right after the last typed char in the part
              // that currently contains the typing cursor.
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
            // Element parts: rendered into the layout from the start, but
            // visibility-hidden until typing reaches their position.
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

      {/* Thinking dots overlay while waiting to start typing. The hidden
          paragraphs above already reserve the final container height. */}
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

/* ── Floating popover anchored to "show me where" ───────────────── */
function SiteSketchPopover({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Soft patch location"
      style={{
        position: 'absolute',
        top: '50%',
        left: 'calc(100% + 12px)',
        transform: 'translateY(-50%)',
        zIndex: 50,
        width: '280px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        borderRadius: 'var(--modus-wc-border-radius-xl, 16px)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Tail / arrow pointing left to the link */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '-7px',
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          borderLeft: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          transform: 'translateY(-50%) rotate(45deg)',
        }}
      />

      {/* Header — title + close button */}
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center"
          style={{
            gap: '6px',
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            fontWeight: 700,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          Your site
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              fontWeight: 600,
            }}
          >
            (N ↑)
          </span>
        </span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '1000px',
            border: 'none',
            background: 'transparent',
            color:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--modus-wc-color-base-100, #f1f1f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>
      </div>

      {/* SVG sketch */}
      <svg
        viewBox="0 0 240 120"
        width="100%"
        height="108"
        role="img"
        aria-label="Site sketch with soft area highlighted in the north-east corner"
      >
        {/* Site outline */}
        <rect
          x="8"
          y="8"
          width="224"
          height="104"
          rx="6"
          fill="var(--modus-wc-color-base-100, #f1f1f6)"
          stroke="var(--modus-wc-color-base-content-low-contrast, #6a6e79)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* Solid (firm) ground dots */}
        <g
          fill="var(--modus-wc-color-base-content-low-contrast, #6a6e79)"
          opacity="0.5"
        >
          <circle cx="40" cy="40" r="2" />
          <circle cx="70" cy="70" r="2" />
          <circle cx="100" cy="50" r="2" />
          <circle cx="60" cy="95" r="2" />
          <circle cx="120" cy="90" r="2" />
          <circle cx="150" cy="55" r="2" />
        </g>

        {/* Highlighted soft area — north-east corner */}
        <rect
          x="160"
          y="16"
          width="64"
          height="40"
          rx="6"
          fill="rgba(213, 0, 87, 0.12)"
          stroke={AVOID_ACCENT}
          strokeWidth="1.5"
        />
        <text
          x="192"
          y="40"
          textAnchor="middle"
          fill={AVOID_ACCENT}
          fontSize="10"
          fontWeight="700"
          fontFamily="inherit"
        >
          Soft patch
        </text>

        {/* Compass: N arrow */}
        <g>
          <line
            x1="20"
            y1="100"
            x2="20"
            y2="86"
            stroke="var(--modus-wc-color-base-content, #171c1e)"
            strokeWidth="1.5"
          />
          <polygon
            points="20,82 17,90 23,90"
            fill="var(--modus-wc-color-base-content, #171c1e)"
          />
        </g>
      </svg>

      {/* Caption — plain-English description */}
      <p
        style={{
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          lineHeight: '18px',
          margin: 0,
        }}
      >
        The highlighted area is the softer spot — roughly the size of a
        two-car garage. Everywhere else is solid.
      </p>
    </div>
  );
}

/* ── Stateful Instead response with the working "show me where" ─── */
function InsteadResponse({ enabled }: { enabled: boolean }) {
  const [showMap, setShowMap] = useState(false);

  const showMeWhere = (
    <span
      key="show-me-where"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        onClick={() => setShowMap((p) => !p)}
        aria-expanded={showMap}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          font: 'inherit',
          color: 'var(--modus-wc-color-primary, #0063a3)',
          fontWeight: 600,
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        show me where
      </button>
      {showMap && <SiteSketchPopover onClose={() => setShowMap(false)} />}
    </span>
  );

  const blocks: TypingBlock[] = [
    [
      'The ground is firm, water drains away nicely, and we don’t expect anything to shift or sink.',
    ],
    [
      'There’s one small soft patch near the north edge — ',
      showMeWhere,
      '. A wider footing there will keep you safe.',
    ],
  ];

  return <TypingResponse blocks={blocks} enabled={enabled} />;
}

/* ── Stack offset (how far the back card peeks down + right) ────── */
const STACK_OFFSET = 24;
/** Pause after Avoid finishes typing before Instead slides on top. */
const HAND_OFF_DELAY_MS = 600;
/** Smooth motion curve for the card slide + fade. */
const STACK_TRANSITION =
  'transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease';

/* ── Expert 3 — Prioritize Clarity Over Complexity ──────────────── */
export default function Expert3() {
  /** Which card is on top of the stack. */
  const [active, setActive] = useState<'avoid' | 'instead'>('avoid');
  /** Instead starts typing only once it's been activated (either auto
   *  after Avoid finishes, or manually via the pill / back-card click). */
  const [insteadEnabled, setInsteadEnabled] = useState(false);

  const showInstead = () => {
    setInsteadEnabled(true);
    setActive('instead');
  };
  const showAvoid = () => setActive('avoid');

  /** Avoid → Instead handoff: brief pause, then slide Instead on top
   *  and start its typing animation. */
  const handleAvoidComplete = () => {
    window.setTimeout(showInstead, HAND_OFF_DELAY_MS);
  };

  /** Visual recipe for a card in the stack. Front card sits at origin,
   *  back card is offset down-right with reduced opacity. */
  const stackStyle = (isActive: boolean): CSSProperties => ({
    gridArea: '1 / 1',
    display: 'flex',
    flexDirection: 'column',
    transform: isActive
      ? 'translate(0, 0)'
      : `translate(${STACK_OFFSET}px, ${STACK_OFFSET}px)`,
    opacity: isActive ? 1 : 0.85,
    zIndex: isActive ? 2 : 1,
    transition: STACK_TRANSITION,
    cursor: isActive ? 'default' : 'pointer',
  });

  return (
    <div className="flex flex-col" style={{ gap: '20px', width: 'fit-content' }}>
      {/* Keyframes for the Instead card's border-line glitter. Scoped by a
       *  prefixed animation name so it can't clash with other components. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes expert3-rainbow-shimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`,
        }}
      />

      {/* Tabs — both pills always visible, dimmed when inactive. */}
      <div
        role="tablist"
        aria-label="Response style"
        className="flex"
        style={{ gap: '12px' }}
      >
        <PillTab
          label="Avoid"
          color={AVOID_ACCENT}
          active={active === 'avoid'}
          onClick={showAvoid}
        />
        <PillTab
          label="Instead"
          color={INSTEAD_PILL_COLOR}
          active={active === 'instead'}
          onClick={showInstead}
        />
      </div>

      {/* Card deck — both cards share the same grid cell and swap z-order
       *  + offset based on `active`. Padding reserves space for the back
       *  card's peek so the parent layout never shifts. */}
      <div
        style={{
          display: 'grid',
          paddingRight: `${STACK_OFFSET}px`,
          paddingBottom: `${STACK_OFFSET}px`,
        }}
      >
        {/* AVOID — jargon-heavy answer (types first) */}
        <div
          onClick={active === 'avoid' ? undefined : showAvoid}
          style={stackStyle(active === 'avoid')}
        >
          <ChatCard
            accent={AVOID_ACCENT}
            response={
              <TypingResponse
                onComplete={handleAvoidComplete}
                blocks={[
                  [
                    'Subgrade bearing capacity exceeds 150 kPa across 92% of the parcel per SPT N-values (avg 18). Hydraulic conductivity ≥ 1×10⁻⁵ m/s supports adequate surface drainage. Differential settlement is projected below L/500 per ASCE 7-22.',
                  ],
                  [
                    'The NE quadrant exhibits reduced N-values requiring spread-footing geometry per IBC 1808 — refer to boring logs BL-04 and BL-05.',
                  ],
                ]}
              />
            }
          />
        </div>

        {/* INSTEAD — plain-English answer (types once it slides on top) */}
        <div
          onClick={active === 'instead' ? undefined : showInstead}
          style={stackStyle(active === 'instead')}
        >
          <ChatCard
            accent={INSTEAD_ACCENT}
            borderThickness={2}
            glow={insteadEnabled}
            response={<InsteadResponse enabled={insteadEnabled} />}
          />
        </div>
      </div>
    </div>
  );
}
