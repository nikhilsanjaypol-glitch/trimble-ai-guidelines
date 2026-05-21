import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

/* ── Build-upon chip ────────────────────────────────────────────── */
/* The focused component — the new iteration sits on top of a fanned
   stack of existing decisions (software state, document, sketch,
   previous iteration). */

interface Layer {
  id: string;
  icon: string;
  label: string;
  accent: string;
  accentSoft: string;
}

const layers: Layer[] = [
  {
    id: 'last-iteration',
    icon: 'history',
    label: 'Last AI proposal · 1 h ago',
    accent: 'var(--modus-wc-color-status-success, #1e7e34)',
    accentSoft: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
  },
  {
    id: 'plan-v3',
    icon: 'layers',
    label: 'Grading plan · v3 (current)',
    accent: 'var(--modus-wc-color-primary, #0063A3)',
    accentSoft: 'var(--modus-wc-color-primary-light, #e8f4fd)',
  },
  {
    id: 'site-sketch',
    icon: 'gesture',
    label: 'Site-walk sketch · Jan 14',
    accent: 'var(--modus-wc-color-status-warning, #856404)',
    accentSoft: 'var(--modus-wc-color-status-warning-light, #fff8e1)',
  },
  {
    id: 'intent-memo',
    icon: 'document_outline',
    label: 'Pre-design intent memo',
    accent: 'var(--modus-wc-color-status-info, #004f83)',
    accentSoft: 'var(--modus-wc-color-status-info-light, #e8f4fd)',
  },
];

function TrimbleAiMark({ size = 22 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 30.002 32.6797"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="trimbleAiLogo2"
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
          fill="url(#trimbleAiLogo2)"
        />
      </svg>
    </span>
  );
}

function BuildUponChip() {
  return (
    <div style={{ width: '340px' }}>
      {/* Top iteration sheet */}
      <div
        className="rounded-2xl p-[2px] relative"
        style={{
          background: TRIMBLE_RAINBOW,
          boxShadow:
            '0 10px 24px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)',
          zIndex: 50,
        }}
      >
        <div
          className="rounded-[14px] flex items-start gap-2.5 px-4 py-3"
          style={{ backgroundColor: 'var(--modus-wc-color-base-page, #fff)' }}
        >
          <TrimbleAiMark />
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
                lineHeight: '20px',
              }}
            >
              Iterating on {layers.length} existing decisions
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color:
                  'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                lineHeight: '16px',
                marginBottom: 0,
              }}
            >
              Building forward — nothing here gets rewritten.
            </span>
          </div>
        </div>
      </div>

      {/* Source layers fanning out beneath */}
      {layers.map((layer, i) => {
        const depth = i + 1;
        return (
          <div
            key={layer.id}
            className="rounded-xl flex items-center gap-2.5 px-3 py-2.5 relative"
            style={{
              marginTop: '-10px',
              marginLeft: `${depth * 8}px`,
              marginRight: `${depth * 8}px`,
              backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
              border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              boxShadow: '0 6px 10px rgba(0,0,0,0.04)',
              opacity: Math.max(0.5, 1 - i * 0.13),
              zIndex: 40 - i,
            }}
          >
            <div
              className="flex items-center justify-center rounded-md shrink-0"
              style={{
                width: '22px',
                height: '22px',
                backgroundColor: layer.accentSoft,
              }}
            >
              <ModusWcIcon
                name={layer.icon}
                size="xs"
                decorative
                style={{ color: layer.accent }}
              />
            </div>
            <span
              className="font-medium truncate flex-1"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
                lineHeight: '18px',
                marginBottom: 0,
              }}
            >
              {layer.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Scenario ───────────────────────────────────────────────────── */
/* The chip lives at the top of a "proposed iteration" artifact pinned
   to a specific element in the project (here: north boundary, in the
   grading plan). No chat, no avatars — just a recommendation surface
   you'd see in the workspace. */

export default function Creative2() {
  return (
    <div className="flex flex-col gap-3" style={{ width: '340px' }}>
      {/* Context kicker — what this artifact is pinned to */}
      <div className="flex items-center gap-1.5">
        <ModusWcIcon
          name="place"
          size="xs"
          decorative
          style={{
            color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)',
          }}
        />
        <span
          className="font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          Pinned to north boundary · Grading plan v3
        </span>
      </div>

      {/* The focused build-upon chip — masthead of the artifact */}
      <BuildUponChip />

      {/* The proposed iteration body — calls out the preserved decisions
          by name so the chip's promise is grounded in the output. */}
      <div
        className="rounded-xl px-4 py-3"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
        }}
      >
        <span
          className="block font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          Proposed change
        </span>
        <p
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '1.55',
            marginBottom: 0,
          }}
        >
          Re-grade the north boundary to{' '}
          <span className="font-semibold">2% slope</span> — eliminates the
          segmental retaining wall, saves{' '}
          <span className="font-semibold">~$40k</span>, and keeps the on-site
          fill phasing from{' '}
          <span className="font-semibold">plan v3</span> intact. Southern
          hedge and east loading dock stay untouched.
        </p>
      </div>
    </div>
  );
}
