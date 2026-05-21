import { useEffect, useRef, useState } from 'react';
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcTextInput,
} from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 4 — SUPPORT INTERVENTION
 *
 * The professional must remain the ultimate authority. The AI can
 * propose — but the value is not "yours" until you deliberately
 * take ownership. This card uses a slide-to-confirm gesture as the
 * single intervention mechanic: dragging the thumb across the
 * authority track moves the artefact from AI authorship to YOUR
 * authorship. Once taken, the value becomes editable, an undo
 * (hand-back) is always one click away, and a tiny audit line
 * stamps accountability.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

const AI_VALUE = '65';
const UNIT = 'Nm';
const COMMIT_THRESHOLD = 0.92;

type Phase = 'ai' | 'taken';

function TrimbleAiLogo({ size = 18 }: { size?: number }) {
  return (
    <span className="flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
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

function YouAvatar({ size = 18 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: TRIMBLE_RAINBOW,
        color: '#ffffff',
        fontSize: '9px',
        fontWeight: 800,
        letterSpacing: '0.4px',
      }}
    >
      YOU
    </span>
  );
}

export default function Pro4() {
  const [phase, setPhase] = useState<Phase>('ai');
  const [progress, setProgress] = useState(0);
  const [value, setValue] = useState(AI_VALUE);
  const [draftValue, setDraftValue] = useState(AI_VALUE);
  const [hint, setHint] = useState(false);
  // State mirror of draggingRef for use in render (refs cannot be read during render).
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startProgressRef = useRef(0);
  const settledRef = useRef(false);

  /* Subtle attention pulse on the thumb when idle */
  useEffect(() => {
    if (phase !== 'ai') return;
    const id = window.setInterval(() => {
      setHint((h) => !h);
    }, 1600);
    return () => window.clearInterval(id);
  }, [phase]);

  function getUsableWidth() {
    const track = trackRef.current;
    if (!track) return 1;
    const TRACK_PADDING = 4;
    const THUMB_SIZE = 48;
    return Math.max(1, track.clientWidth - TRACK_PADDING * 2 - THUMB_SIZE);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (phase !== 'ai') return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    setIsDragging(true);
    settledRef.current = false;
    startXRef.current = e.clientX;
    startProgressRef.current = progress;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    const next = Math.max(
      0,
      Math.min(1, startProgressRef.current + dx / getUsableWidth()),
    );
    setProgress(next);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (progress >= COMMIT_THRESHOLD && !settledRef.current) {
      settledRef.current = true;
      setProgress(1);
      window.setTimeout(() => {
        setPhase('taken');
        setDraftValue(value);
      }, 220);
    } else {
      setProgress(0);
    }
  }

  function handBack() {
    setPhase('ai');
    setProgress(0);
    setValue(AI_VALUE);
    setDraftValue(AI_VALUE);
  }

  function commitEdit(next: string) {
    const v = next.trim();
    if (v === '') return;
    setValue(v);
  }

  const valueChanged = phase === 'taken' && value !== AI_VALUE;

  return (
    <div
      className="bg-white shrink-0 flex flex-col"
      style={{
        width: '380px',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 28px -10px rgba(0,0,0,0.10)',
      }}
    >
      {/* ── Header strip with author chip ──────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              fontWeight: 700,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
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

        <span
          className="inline-flex items-center gap-1.5"
          style={{
            height: '24px',
            padding: '0 10px 0 6px',
            borderRadius: '1000px',
            backgroundColor:
              phase === 'ai'
                ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                : 'rgba(74, 0, 255, 0.08)',
            color:
              phase === 'ai'
                ? 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)'
                : '#4A00FF',
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            fontWeight: 700,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          {phase === 'ai' ? <TrimbleAiLogo size={16} /> : <YouAvatar size={16} />}
          {phase === 'ai' ? 'Authored by AI' : 'Authored by you'}
        </span>
      </div>

      {/* ── Value display / inline editor ──────────────────────── */}
      <div className="flex items-end gap-2" style={{ marginTop: '14px', minHeight: '54px' }}>
        {phase === 'ai' ? (
          <>
            <span
              className="font-semibold tabular-nums"
              style={{
                fontSize: '40px',
                lineHeight: '44px',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.5px',
              }}
            >
              {value}
            </span>
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-md, 16px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                marginBottom: '6px',
              }}
            >
              {UNIT}
            </span>
          </>
        ) : (
          <>
            <div style={{ width: '110px' }}>
              <ModusWcTextInput
                value={draftValue}
                size="md"
                onInputChange={(e: CustomEvent) => {
                  const v = e.detail?.target?.value ?? '';
                  setDraftValue(v);
                  commitEdit(v);
                }}
              />
            </div>
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-md, 16px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                marginBottom: '12px',
              }}
            >
              {UNIT}
            </span>
            {valueChanged && (
              <span
                className="ml-auto inline-flex items-center gap-1"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                  fontWeight: 700,
                  color: '#4A00FF',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                }}
              >
                <ModusWcIcon name="edit_combination" size="xs" decorative style={{ color: '#4A00FF' }} />
                Modified
              </span>
            )}
          </>
        )}
      </div>

      {/* ── AI rationale (only while AI is the author) ──────────── */}
      {phase === 'ai' && (
        <p
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
            lineHeight: '18px',
            marginBottom: 0,
            marginTop: '6px',
          }}
        >
          AI lowered torque after detecting fastener-fatigue risk in the
          updated load case.
        </p>
      )}

      {/* ── Authority track ─────────────────────────────────────── */}
      <div
        ref={trackRef}
        className="relative select-none"
        style={{
          height: '56px',
          borderRadius: '1000px',
          marginTop: '18px',
          padding: '4px',
          background:
            phase === 'taken'
              ? TRIMBLE_RAINBOW
              : 'var(--modus-wc-color-base-100, #f1f1f6)',
          border:
            phase === 'taken'
              ? 'none'
              : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          overflow: 'hidden',
        }}
      >
        {/* Filled progress (rainbow grows from left) */}
        {phase === 'ai' && (
          <div
            className="absolute top-0 left-0 h-full"
            style={{
              width: `${Math.max(progress * 100, 0)}%`,
              background: TRIMBLE_RAINBOW,
              borderRadius: '1000px',
              transition: isDragging ? 'none' : 'width 220ms ease',
              opacity: progress > 0.02 ? 1 : 0,
            }}
          />
        )}

        {/* Static label */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ paddingLeft: '52px', paddingRight: '20px' }}
        >
          {phase === 'ai' ? (
            <span
              className="flex items-center gap-2"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 600,
                color:
                  progress > 0.4
                    ? '#ffffff'
                    : 'var(--modus-wc-color-base-content, #171c1e)',
                opacity: 1 - progress * 0.6,
                transition: 'color 200ms ease, opacity 200ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              Slide to take authority
              <ModusWcIcon
                name="arrow_right"
                size="xs"
                decorative
                style={{
                  color:
                    progress > 0.4
                      ? '#ffffff'
                      : 'var(--modus-wc-color-base-content, #171c1e)',
                  transform: hint ? 'translateX(2px)' : 'translateX(0)',
                  transition: 'transform 600ms ease',
                }}
              />
            </span>
          ) : (
            <span
              className="flex items-center gap-2"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 700,
                color: '#ffffff',
                whiteSpace: 'nowrap',
              }}
            >
              <ModusWcIcon name="check" size="sm" decorative style={{ color: '#ffffff' }} />
              You hold authority
            </span>
          )}
        </div>

        {/* Draggable thumb */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute flex items-center justify-center rounded-full"
          role="slider"
          aria-label="Slide to take authority"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          style={{
            top: '4px',
            left: `calc(4px + ${progress * 100}% * 1)`,
            transform: `translateX(${-progress * 48}px)`,
            width: '48px',
            height: '48px',
            backgroundColor: '#ffffff',
            boxShadow:
              phase === 'ai'
                ? '0 1px 2px rgba(0,0,0,0.10), 0 4px 12px -2px rgba(0,0,0,0.18)'
                : '0 1px 2px rgba(0,0,0,0.06)',
            cursor: phase === 'ai' ? 'grab' : 'default',
            transition: isDragging
              ? 'none'
              : 'left 220ms ease, transform 220ms ease',
            touchAction: 'none',
          }}
        >
          {phase === 'ai' ? (
            <TrimbleAiLogo size={22} />
          ) : (
            <YouAvatar size={28} />
          )}
        </div>
      </div>

      {/* ── Footer: actions / audit ─────────────────────────────── */}
      {phase === 'ai' ? (
        <div
          className="flex items-center gap-1.5"
          style={{
            marginTop: '14px',
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            fontWeight: 600,
            letterSpacing: '0.2px',
          }}
        >
          <ModusWcIcon
            name="info"
            size="xs"
            decorative
            style={{
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          />
          The AI can propose. Only you can decide.
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2" style={{ marginTop: '14px' }}>
          <span
            className="inline-flex items-center gap-1"
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
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            />
            Logged · v2 · attributed to you
          </span>
          <ModusWcButton
            size="sm"
            color="tertiary"
            variant="outlined"
            onButtonClick={handBack}
          >
            <span className="flex items-center gap-1">
              <ModusWcIcon name="undo" size="xs" decorative />
              Hand back to AI
            </span>
          </ModusWcButton>
        </div>
      )}
    </div>
  );
}
