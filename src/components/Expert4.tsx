import { useState } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Expert 4 — EXPLAIN WHY
 *
 * To provide evidence-based clarity & traceability.
 *
 * Surface: a Tekla Structures viewport. A structural engineer is
 * reviewing a floor framing layout. The AI has flagged a single beam
 * with a suggested resize. By default the user sees just the
 * suggestion — one line, very low-friction. Tapping "Why?" expands
 * the annotation to reveal the exact code paragraph (AISC 360-22)
 * that drove the suggestion, with the load-bearing phrase
 * highlighted. The user can verify the recommendation against the
 * code without leaving the viewport.
 *
 * The interaction is deliberately minimal: one pin, one suggestion,
 * one source. No chat. No list of findings. Just a single AI
 * annotation in context.
 * ───────────────────────────────────────────────────────────────── */

const SPEC = {
  doc: 'AISC 360-22 — Specification for Structural Steel Buildings',
  section: '§F2.2 — Lateral-Torsional Buckling',
  quote:
    'For doubly symmetric compact I-shaped members, when the unbraced length exceeds L_p, **nominal flexural strength is reduced by inelastic lateral-torsional buckling**. A larger section or shorter unbraced length is required to develop the full plastic moment.',
};

/* ── Trimble AI mark used in the pin ────────────────────────────── */
function TrimbleAiGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 30.002 32.6797"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="expert4-pin-logo"
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
        fill="url(#expert4-pin-logo)"
      />
    </svg>
  );
}

/* ── Quote with highlighted phrases (text between **double asterisks**) */
function HighlightedQuote({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span
      style={{
        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
        lineHeight: '18px',
        color: 'var(--modus-wc-color-base-content, #171c1e)',
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
                padding: '1px 3px',
                borderRadius: '2px',
              }}
            >
              {inner}
            </span>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

/* ── Expert 4 — Explain Why (Tekla viewport surface) ─────────────── */
export default function Expert4() {
  const [expanded, setExpanded] = useState(false);

  /* Pin and callout coordinates inside the viewport. The leader
   * line is rendered in the SVG so it stays geometrically correct. */
  const PIN_X = 360;
  const PIN_Y = 158;
  const CALLOUT_X = 320;
  const CALLOUT_Y = 220;

  return (
    <div
      style={{
        position: 'relative',
        width: '640px',
        fontFamily:
          'Inter, "Open Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Viewport — clipped container holds the drawing + chrome.
       *  The AI pin & callout live OUTSIDE this clip (further down in the
       *  tree) so the callout can freely overflow when expanded. */}
      <div
        style={{
          position: 'relative',
          width: '640px',
          height: '420px',
          backgroundColor: '#fafbfc',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
      {/* Subtle dot grid — Tekla viewport ambience */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(106,110,121,0.16) 0.8px, transparent 0.8px)',
          backgroundSize: '16px 16px',
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />

      {/* Top-left status row */}
      <div
        className="absolute flex items-center"
        style={{ top: 14, left: 16, gap: 10, zIndex: 2 }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Tekla Structures
        </span>
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 3,
            height: 3,
            borderRadius: 999,
            backgroundColor:
              'var(--modus-wc-color-base-200, #e0e1e9)',
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          Falcon Tower / Level 4 framing
        </span>
      </div>

      {/* Top-right view chip */}
      <div
        className="absolute flex items-center"
        style={{ top: 12, right: 16, gap: 4, zIndex: 2 }}
      >
        <span
          className="inline-flex items-center"
          style={{
            height: 22,
            padding: '0 8px',
            borderRadius: 4,
            backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
            color:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          ELEVATION · 1:75
        </span>
      </div>

      {/* The drawing */}
      <svg
        viewBox="0 0 640 420"
        width="640"
        height="420"
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Column · left */}
        <rect
          x="92"
          y="100"
          width="18"
          height="200"
          fill="#ffffff"
          stroke="#171c1e"
          strokeWidth="1.25"
        />
        {/* Column · right */}
        <rect
          x="530"
          y="100"
          width="18"
          height="200"
          fill="#ffffff"
          stroke="#171c1e"
          strokeWidth="1.25"
        />

        {/* Beam — top flange */}
        <line
          x1="110"
          y1="150"
          x2="530"
          y2="150"
          stroke="#171c1e"
          strokeWidth="2.5"
        />
        {/* Beam — bottom flange */}
        <line
          x1="110"
          y1="178"
          x2="530"
          y2="178"
          stroke="#171c1e"
          strokeWidth="2.5"
        />
        {/* Beam — web edges (light) */}
        <line
          x1="110"
          y1="150"
          x2="110"
          y2="178"
          stroke="#171c1e"
          strokeWidth="0.75"
        />
        <line
          x1="530"
          y1="150"
          x2="530"
          y2="178"
          stroke="#171c1e"
          strokeWidth="0.75"
        />

        {/* Beam label — pinned to the beam */}
        <text
          x="320"
          y="143"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#171c1e"
          style={{ fontFamily: 'inherit' }}
        >
          B-2.04 · W14×30
        </text>

        {/* Ground hatching beneath each column */}
        <g stroke="#6a6e79" strokeWidth="0.75">
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`l-${i}`}
              x1={80 + i * 8}
              y1={314}
              x2={70 + i * 8}
              y2={324}
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`r-${i}`}
              x1={518 + i * 8}
              y1={314}
              x2={508 + i * 8}
              y2={324}
            />
          ))}
          <line x1="70" y1="312" x2="120" y2="312" />
          <line x1="508" y1="312" x2="558" y2="312" />
        </g>

        {/* Dimension line — bottom */}
        <g stroke="#6a6e79" strokeWidth="0.75">
          <line x1="101" y1="350" x2="539" y2="350" />
          <line x1="101" y1="344" x2="101" y2="356" />
          <line x1="539" y1="344" x2="539" y2="356" />
        </g>
        <text
          x="320"
          y="366"
          textAnchor="middle"
          fontSize="10"
          fill="#6a6e79"
          style={{ fontFamily: 'inherit' }}
        >
          7 200 mm
        </text>

        {/* Subtle deflection curve — exaggerated to hint at over-stress */}
        <path
          d={`M 110 164 Q 320 ${164 + 22} 530 164`}
          stroke="var(--modus-wc-color-status-warning, #ca8a04)"
          strokeWidth="1.25"
          strokeDasharray="3 3"
          fill="none"
          opacity="0.75"
        />

        {/* Leader line from pin → callout */}
        <line
          x1={PIN_X}
          y1={PIN_Y + 12}
          x2={CALLOUT_X + 16}
          y2={CALLOUT_Y}
          stroke="var(--modus-wc-color-primary, #0063a3)"
          strokeWidth="1.25"
          strokeDasharray="2 3"
        />
      </svg>

      {/* Bottom-left affordance hint — stays inside the clipped viewport */}
      {!expanded && (
        <span
          style={{
            position: 'absolute',
            bottom: 12,
            left: 16,
            fontSize: 10,
            fontWeight: 600,
            color:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.04em',
          }}
        >
          1 AI suggestion in view
        </span>
      )}
      </div>
      {/* /viewport — pin & callout below sit on top of (and can overflow) it */}

      {/* AI annotation pin */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        aria-label="AI annotation"
        aria-expanded={expanded}
        className="absolute flex items-center justify-center"
        style={{
          top: PIN_Y - 12,
          left: PIN_X - 12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          border: '2px solid var(--modus-wc-color-primary, #0063a3)',
          boxShadow:
            '0 2px 6px rgba(0,0,0,0.12), 0 0 0 4px rgba(0, 99, 163, 0.10)',
          cursor: 'pointer',
          padding: 0,
          zIndex: 3,
        }}
      >
        <TrimbleAiGlyph size={12} />
      </button>

      {/* Callout — free to overflow the viewport when expanded */}
      <div
        className="absolute flex flex-col"
        style={{
          top: CALLOUT_Y,
          left: CALLOUT_X,
          width: 280,
          padding: '10px 12px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderRadius: 8,
          boxShadow: expanded
            ? '0px 20px 32px -8px rgba(0,0,0,0.18), 0px 8px 16px -8px rgba(0,0,0,0.14)'
            : '0px 10px 15px -3px rgba(0,0,0,0.10), 0px 4px 6px -4px rgba(0,0,0,0.10)',
          gap: 8,
          zIndex: 4,
          transition: 'box-shadow 180ms ease',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            <TrimbleAiGlyph size={10} />
            Trimble AI
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--modus-wc-color-status-warning, #92400e)',
              backgroundColor:
                'var(--modus-wc-color-status-warning-light, #fef3c7)',
              padding: '1px 6px',
              borderRadius: 999,
              lineHeight: '14px',
            }}
          >
            Suggestion
          </span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: '18px',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          Upsize to{' '}
          <span style={{ fontWeight: 700 }}>W14×34</span> —{' '}
          unbraced length exceeds <em>L<sub>p</sub></em> for the
          current section.
        </p>

        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
          className="inline-flex items-center self-start"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--modus-wc-color-primary, #0063a3)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            gap: 2,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = 'underline')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.textDecoration = 'none')
          }
        >
          {expanded ? 'Hide source' : 'Why?'}
          <ModusWcIcon
            name={expanded ? 'expand_less' : 'expand_more'}
            size="xs"
            decorative
          />
        </button>

        {expanded && (
          <div
            className="flex flex-col"
            style={{
              gap: 8,
              paddingTop: 8,
              borderTop:
                '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              animation:
                'expert4-source-in 180ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            }}
          >
            <div className="flex flex-col">
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: '16px',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                }}
              >
                {SPEC.doc}
              </span>
              <span
                style={{
                  fontSize: 10,
                  lineHeight: '14px',
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontWeight: 600,
                }}
              >
                {SPEC.section}
              </span>
            </div>

            <div className="flex gap-2">
              <span
                aria-hidden
                className="shrink-0"
                style={{
                  width: 2,
                  borderRadius: 2,
                  backgroundColor:
                    'var(--modus-wc-color-base-200, #e0e1e9)',
                  alignSelf: 'stretch',
                }}
              />
              <HighlightedQuote text={SPEC.quote} />
            </div>

            <ModusWcButton size="sm" variant="outlined" color="secondary">
              <span className="flex items-center gap-2">
                <ModusWcIcon name="launch" size="xs" decorative />
                Open in spec library
              </span>
            </ModusWcButton>
          </div>
        )}
      </div>

      {/* Keyframes for the source-paragraph reveal */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes expert4-source-in {
              0% { opacity: 0; transform: translateY(-4px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `,
        }}
      />
    </div>
  );
}
