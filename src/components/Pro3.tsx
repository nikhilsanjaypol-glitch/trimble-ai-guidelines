import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 3 — BE TRAINABLE, CONTEXT AND DOMAIN AWARE
 *
 * To ensure relevance & usefulness.
 *
 * The characteristic UI element for this guideline is an "AI Memory"
 * card — a compact panel that shows what the AI has actually been
 * trained to recall about a specific project. It proves the AI is
 * domain-aware (engineering specifics), context-aware (this project,
 * this client), and trainable (the user can teach it more).
 *
 * One title line ("Trained for [Project]"), four recall tiles of
 * specific facts, one action ("Teach AI more"). That's it.
 * ───────────────────────────────────────────────────────────────── */

interface Fact {
  icon: string;
  label: string;
  value: string;
}

const FACTS: Fact[] = [
  { icon: 'mountains', label: 'Soil bearing', value: '180 kPa' },
  { icon: 'shield_check', label: 'Seismic zone', value: 'D2 · IBC 2024' },
  { icon: 'document_outline', label: 'Output template', value: 'Acme Memo v3' },
  { icon: 'ruler', label: 'Units', value: 'Metric (SI)' },
];

/* ── Mini Trimble AI logo ───────────────────────────────────────── */
function TrimbleAiLogo({ size = 28 }: { size?: number }) {
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
            id="pro3-mem-logo"
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
          fill="url(#pro3-mem-logo)"
        />
      </svg>
    </span>
  );
}

export default function Pro3() {
  return (
    <div
      className="bg-white flex flex-col"
      style={{
        width: '380px',
        padding: '20px',
        gap: '16px',
        borderRadius: 'var(--modus-wc-border-radius-lg, 12px)',
        boxShadow: '0px 4px 16px rgba(0,0,0,0.10)',
      }}
    >
      {/* Header — identifies WHAT the AI has been trained on */}
      <div className="flex items-center gap-3">
        <TrimbleAiLogo size={32} />
        <div className="flex flex-col" style={{ gap: '2px' }}>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Trained for
          </span>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-md, 16px)',
              fontWeight: 700,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '20px',
            }}
          >
            Cedar Hills Phase 2
          </span>
        </div>
        {/* Active dot */}
        <span className="ml-auto flex items-center gap-1.5">
          <span
            aria-hidden
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '1000px',
              backgroundColor: 'var(--modus-wc-color-success, #1e8a3c)',
              boxShadow: '0 0 0 3px rgba(30,138,60,0.15)',
            }}
          />
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              fontWeight: 600,
              color: 'var(--modus-wc-color-success, #1e8a3c)',
            }}
          >
            Active
          </span>
        </span>
      </div>

      {/* Section label */}
      <span
        style={{
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        Key facts I recall
      </span>

      {/* Recall tiles — what the AI actually remembers */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        {FACTS.map((fact) => (
          <div
            key={fact.label}
            className="flex flex-col"
            style={{
              gap: '6px',
              padding: '12px',
              borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
              backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
              borderLeft: '3px solid var(--modus-wc-color-primary, #0063a3)',
            }}
          >
            <span className="flex items-center gap-1.5">
              <ModusWcIcon
                name={fact.icon}
                size="xs"
                decorative
                style={{
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              />
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                {fact.label}
              </span>
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 700,
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '20px',
              }}
            >
              {fact.value}
            </span>
          </div>
        ))}
      </div>

      {/* Footer action — reinforces the "trainable" pillar */}
      <button
        type="button"
        className="flex items-center justify-center gap-1.5 transition-colors"
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
          border: '1px dashed var(--modus-wc-color-base-200, #cbcdd6)',
          backgroundColor: 'transparent',
          color: 'var(--modus-wc-color-primary, #0063a3)',
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          fontWeight: 600,
          cursor: 'pointer',
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
        Teach AI about this project
      </button>
    </div>
  );
}
