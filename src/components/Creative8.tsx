import { useEffect, useRef, useState } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
   Creative 8 — Give professionals control
   Scenario: a surveyor opens a project area on the map view.
   The AI drafts a field methodology note where every key decision —
   primary control point, instrument, datum, tolerance — is an inline
   editable token in the prose. Tap a token → alternatives slide out
   under the sentence. Sign the note → tokens lock with the surveyor's
   name attached (and a field-sheet entry ID).

   The full-canvas backdrop is a real aerial photograph of the site,
   captured by drone, with the survey overlay (parcel boundary, control
   points, monument symbols) drawn on top — AR-style. The pulsing AI
   marker is anchored to the AI's recommended primary control monument.
   ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

interface Alt {
  value: string;
  note: string;
}

interface Token {
  id: string;
  label: string;
  value: string;
  alternatives: Alt[];
  rationale: string;
}

const INITIAL_TOKENS: Token[] = [
  {
    id: 'control',
    label: 'Primary control point',
    value: 'BM-104 · NE concrete monument',
    alternatives: [
      { value: 'BM-208 · SW iron pin', note: 'Low canopy · but 230 m further from work zone' },
      { value: 'CP-201 · road monument', note: 'Fast access · vibration risk from Hwy 41 traffic' },
    ],
    rationale:
      'BM-104 has a published Class A vertical, sky-clear horizon for GNSS, and sits within 80 m of the parcel centroid.',
  },
  {
    id: 'instrument',
    label: 'Instrument',
    value: 'GNSS RTK · Trimble R12i',
    alternatives: [
      { value: 'Robotic TS · Trimble SX12', note: 'Higher precision · slower under tree canopy' },
      { value: 'Static GNSS · 30-min occupations', note: 'Highest accuracy · adds half a day' },
    ],
    rationale:
      'R12i holds ±8 mm horizontal under canopy and lets the crew set all 14 corners in one shift.',
  },
  {
    id: 'datum',
    label: 'Datum & epoch',
    value: 'NAD 83 (2011) · Epoch 2010.0',
    alternatives: [
      { value: 'NAD 83 (CORS96) · Epoch 2002.0', note: 'Matches the 2002 plat · older realization' },
      { value: 'WGS 84 (G2139)', note: 'Better for tie-in to GIS · client wants state plane' },
    ],
    rationale:
      'NAD 83 (2011) is the published datum of the recorded plat on file with the county.',
  },
  {
    id: 'tolerance',
    label: 'Positional tolerance',
    value: 'ALTA Class A · ±5 mm horizontal',
    alternatives: [
      { value: 'ALTA Class B · ±15 mm', note: 'Faster · acceptable for boundary-only deliverable' },
      { value: 'Topo only · ±50 mm', note: 'For terrain · not legal corner positions' },
    ],
    rationale:
      'Title insurer and county recorder both require Class A at every corner before the plat can be filed.',
  },
];

/* ── Inline token chip embedded in the prose (lifted to module scope so React
 * Fast Refresh / static-components rule is satisfied; state lives in the parent) */
function TokenChip({
  token,
  isActive,
  locked,
  onClick,
}: {
  token: Token;
  isActive: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  if (locked) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 rounded-md align-baseline"
        style={{
          backgroundColor: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
          border: '1px solid var(--modus-wc-color-status-success, #1e7e34)',
          color: 'var(--modus-wc-color-status-success, #1e7e34)',
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          fontWeight: 600,
          lineHeight: '20px',
        }}
      >
        <ModusWcIcon name="check" size="xs" decorative style={{ color: 'inherit' }} />
        {token.value}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-1.5 rounded-md align-baseline transition-all"
      style={{
        backgroundColor: isActive
          ? 'var(--modus-wc-color-primary, #0063a3)'
          : 'var(--modus-wc-color-primary-light, #e8f4fd)',
        border: '1px solid var(--modus-wc-color-primary, #0063a3)',
        color: isActive ? '#fff' : 'var(--modus-wc-color-primary, #0063a3)',
        fontSize: 'var(--modus-wc-font-size-sm, 14px)',
        fontWeight: 600,
        lineHeight: '20px',
        cursor: 'pointer',
      }}
    >
      <ModusWcIcon name="sparkle" size="xs" decorative style={{ color: 'inherit' }} />
      {token.value}
      <ModusWcIcon
        name={isActive ? 'caret_up' : 'caret_down'}
        size="xs"
        decorative
        style={{ color: 'inherit' }}
      />
    </button>
  );
}

function MethodologyNote({ onClose }: { onClose: () => void }) {
  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [locked, setLocked] = useState(false);

  const active = activeId ? tokens.find((t) => t.id === activeId) ?? null : null;

  function tokenById(id: string) {
    return tokens.find((t) => t.id === id)!;
  }

  function pickAlternative(tokenId: string, newValue: string) {
    setTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, value: newValue } : t)),
    );
    setActiveId(null);
    setShowWhy(false);
  }

  function toggleToken(id: string) {
    setActiveId((curr) => (curr === id ? null : id));
    setShowWhy(false);
  }

  function signNote() {
    setLocked(true);
    setActiveId(null);
    setShowWhy(false);
  }

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        width: '540px',
        backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Document header — looks like a page-of-notebook header, not a card title */}
      <div
        className="flex items-center justify-between gap-3 px-6 pt-5 pb-3"
        style={{ borderBottom: '1px dashed var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div className="flex flex-col">
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              letterSpacing: '0.3px',
            }}
          >
            BOUNDARY SURVEY · FIELD METHODOLOGY · DRAFT
          </span>
          <span
            className="font-semibold"
            style={{
              fontSize: 'var(--modus-wc-font-size-md, 16px)',
              color: 'var(--modus-wc-color-base-content, #101828)',
            }}
          >
            Pine Ridge Tract — Boundary &amp; topographic survey
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: locked
                ? 'var(--modus-wc-color-status-success-light, #e6f4ea)'
                : 'var(--modus-wc-color-base-100, #f1f1f6)',
              border: locked
                ? '1px solid var(--modus-wc-color-status-success, #1e7e34)'
                : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            }}
          >
            <ModusWcIcon
              name={locked ? 'lock' : 'sparkle'}
              size="xs"
              decorative
              style={{
                color: locked
                  ? 'var(--modus-wc-color-status-success, #1e7e34)'
                  : 'var(--modus-wc-color-primary, #0063a3)',
              }}
            />
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: locked
                  ? 'var(--modus-wc-color-status-success, #1e7e34)'
                  : 'var(--modus-wc-color-base-content, #252a2e)',
                letterSpacing: '0.2px',
              }}
            >
              {locked ? 'SIGNED · #FS-2401' : 'AI-DRAFTED · 4 decisions in-line'}
            </span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center size-6 rounded transition-colors hover:bg-[var(--modus-wc-color-base-200)]"
            style={{ background: 'transparent' }}
            aria-label="Close methodology note"
          >
            <ModusWcIcon
              name="close"
              size="xs"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
            />
          </button>
        </div>
      </div>

      {/* The prose itself — decisions are inline tokens, not extracted into cards */}
      <div className="px-6 pt-5 pb-3">
        <p
          style={{
            fontSize: 'var(--modus-wc-font-size-md, 16px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '28px',
            marginBottom: 0,
          }}
        >
          To survey the <span style={{ fontWeight: 600 }}>Pine Ridge Tract 12-A</span>,
          anchor the control network at{' '}
          <TokenChip
            token={tokenById('control')}
            isActive={activeId === 'control'}
            locked={locked}
            onClick={() => toggleToken('control')}
          />{' '}
          using{' '}
          <TokenChip
            token={tokenById('instrument')}
            isActive={activeId === 'instrument'}
            locked={locked}
            onClick={() => toggleToken('instrument')}
          />, with all observations referenced to{' '}
          <TokenChip
            token={tokenById('datum')}
            isActive={activeId === 'datum'}
            locked={locked}
            onClick={() => toggleToken('datum')}
          />. Every property corner must meet{' '}
          <TokenChip
            token={tokenById('tolerance')}
            isActive={activeId === 'tolerance'}
            locked={locked}
            onClick={() => toggleToken('tolerance')}
          />{' '}
          before the plat is filed.
        </p>
      </div>

      {/* Inline expansion drawer — appears under the paragraph when a token is active */}
      {active && !locked && (
        <div
          className="mx-6 mb-3 rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-100, #f5f6fa)',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          }}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <ModusWcIcon
                name="swap_horizontal"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
              />
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: 'var(--modus-wc-color-base-content, #364153)',
                }}
              >
                <strong>{active.label}</strong> — pick another?
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              className="flex items-center gap-1 transition-colors hover:underline"
              style={{ background: 'transparent' }}
            >
              <ModusWcIcon
                name="help_outline"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-status-info, #004f83)' }}
              />
              <span
                className="font-medium"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: 'var(--modus-wc-color-status-info, #004f83)',
                }}
              >
                {showWhy ? 'Hide reason' : "Why AI's pick?"}
              </span>
            </button>
          </div>

          {showWhy && (
            <div
              className="px-3 py-2 mx-3 mb-2 rounded-md"
              style={{ backgroundColor: 'var(--modus-wc-color-base-page, #fff)' }}
            >
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                  lineHeight: '18px',
                }}
              >
                {active.rationale}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 px-3 pb-3">
            {active.alternatives
              .filter((a) => a.value !== active.value)
              .map((alt) => (
                <button
                  key={alt.value}
                  type="button"
                  onClick={() => pickAlternative(active.id, alt.value)}
                  className="flex flex-col items-start gap-0.5 px-3 py-2 rounded-md text-left transition-colors"
                  style={{
                    backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
                    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                    minWidth: '180px',
                    flex: '1 1 auto',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor =
                      'var(--modus-wc-color-primary, #0063a3)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      'var(--modus-wc-color-base-200, #e0e1e9)')
                  }
                >
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      color: 'var(--modus-wc-color-base-content, #101828)',
                    }}
                  >
                    {alt.value}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                      lineHeight: '14px',
                    }}
                  >
                    {alt.note}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Signature footer — replaces "card with buttons" with a document sign-off row */}
      <div
        className="flex items-center justify-between gap-3 px-6 py-4"
        style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex items-center justify-center rounded-full font-semibold shrink-0"
            style={{
              width: '28px',
              height: '28px',
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              backgroundColor: locked
                ? 'var(--modus-wc-color-primary, #0063a3)'
                : 'var(--modus-wc-color-base-200, #e0e1e9)',
              color: locked ? '#fff' : 'var(--modus-wc-color-base-content, #364153)',
            }}
          >
            ML
          </span>
          <div className="flex flex-col min-w-0">
            <span
              className="font-semibold truncate"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
                lineHeight: '18px',
              }}
            >
              Marcus L. — Project surveyor (PLS #38024)
            </span>
            <span
              className="truncate"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                lineHeight: '14px',
              }}
            >
              {locked
                ? 'Signed just now · logged to field sheet #FS-2401'
                : 'Your PLS number will be attached to every choice on signature'}
            </span>
          </div>
        </div>

        {locked ? (
          <ModusWcButton size="sm" color="tertiary" variant="outlined">
            <span className="flex items-center gap-1">
              Open field sheet
              <ModusWcIcon name="launch" size="xs" decorative />
            </span>
          </ModusWcButton>
        ) : (
          <ModusWcButton size="sm" color="primary" onButtonClick={signNote}>
            <span className="flex items-center gap-1">
              <ModusWcIcon name="signature" size="xs" decorative />
              Sign &amp; lock note
            </span>
          </ModusWcButton>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Pulsing rainbow marker — the entry point
   Borrows the Creative5 marker idiom: rainbow-bordered round button
   with an expanding pulse ring while closed, scales up when open,
   small count badge showing how many decisions await review.
   ───────────────────────────────────────────────────────────────── */

function Marker({
  open,
  count,
  onClick,
}: {
  open: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open AI field methodology note"
      aria-expanded={open}
      style={{
        position: 'relative',
        width: '44px',
        height: '44px',
        borderRadius: '999px',
        padding: '2px',
        background: TRIMBLE_RAINBOW,
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
        boxShadow: open
          ? '0 8px 22px rgba(0,0,0,0.20)'
          : '0 4px 12px rgba(0,0,0,0.18)',
        transform: open ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      {!open && (
        <>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '999px',
              border: '2px solid rgba(0, 154, 254, 0.45)',
              animation: 'creative8-pulse 1.8s ease-out infinite',
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '999px',
              border: '2px solid rgba(255, 32, 146, 0.35)',
              animation: 'creative8-pulse 1.8s ease-out 0.6s infinite',
            }}
          />
        </>
      )}

      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        }}
      >
        <ModusWcIcon
          name="sparkle"
          decorative
          size="sm"
          style={{ color: 'var(--modus-wc-color-primary, #0063A7)' }}
        />
      </span>

      {!open && (
        <span
          aria-hidden="true"
          className="absolute flex items-center justify-center rounded-full font-semibold"
          style={{
            top: '-4px',
            right: '-4px',
            width: '20px',
            height: '20px',
            fontSize: '11px',
            backgroundColor: 'var(--modus-wc-color-status-error, #b3261e)',
            color: '#ffffff',
            border: '2px solid var(--modus-wc-color-base-page, #ffffff)',
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      )}

      <style>{`
        @keyframes creative8-pulse {
          0%   { transform: scale(1);   opacity: 0.75; }
          100% { transform: scale(1.55); opacity: 0;    }
        }
      `}</style>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Interactive site-plan map — the full-canvas background
   Pan: drag · Zoom: scroll wheel · Reset: button
   World coordinates are SVG coordinates. Marker + note overlay in
   screen space, anchored to the AI's recommended primary control
   monument (BM-104).
   ───────────────────────────────────────────────────────────────── */

const PRIMARY_CONTROL_WORLD = { x: 1080, y: 360 };
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.5;

const PARCEL_POLYGON =
  '520,340 1080,360 1180,560 1140,840 660,900 440,720 400,500';

const SECONDARY_CONTROLS = [
  { id: 'BM-208', x: 460, y: 760, label: 'BM-208', sub: 'SW iron pin' },
  { id: 'CP-201', x: 1240, y: 580, label: 'CP-201', sub: 'Road mon.' },
  { id: 'CP-302', x: 800, y: 600, label: 'CP-302', sub: 'Interior' },
];

/* Aerial photograph of the survey location — replaces the satellite-style
   SVG with an actual photo, then layers the survey overlay (parcel
   boundary, control points, monument symbol) on top, AR-style. */
const SITE_PHOTO_URL =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80&auto=format&fit=crop';

function SitePlan() {
  return (
    <div
      style={{
        width: '1600px',
        height: '1100px',
        position: 'relative',
        backgroundColor: '#3a4a3a',
      }}
    >
      {/* Aerial photograph backdrop */}
      <img
        src={SITE_PHOTO_URL}
        alt="Aerial photograph of Pine Ridge Tract 12-A"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
          filter: 'saturate(0.92) contrast(1.02)',
        }}
      />

      {/* Slight darken layer — so the white survey overlay reads cleanly */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.18) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Survey overlay — sits on top of the photograph */}
      <svg
        width="1600"
        height="1100"
        viewBox="0 0 1600 1100"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'block',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <filter id="overlayShadow8" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0" dy="1" result="offsetblur" />
            <feComponentTransfer><feFuncA type="linear" slope="0.55" /></feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subject parcel: semi-transparent yellow fill, red dashed boundary */}
        <polygon
          points={PARCEL_POLYGON}
          fill="rgba(242,201,76,0.22)"
          stroke="#ffd23f"
          strokeWidth="3"
          strokeDasharray="10 5"
          filter="url(#overlayShadow8)"
        />

        {/* Parcel corner ticks */}
        {PARCEL_POLYGON.split(' ').map((p) => {
          const [x, y] = p.split(',').map(Number);
          return (
            <g key={`corner-${x}-${y}`} filter="url(#overlayShadow8)">
              <circle cx={x} cy={y} r="6" fill="#ffffff" stroke="#c73838" strokeWidth="2" />
            </g>
          );
        })}

        {/* Bearing/distance labels on a couple of boundary legs */}
        <g filter="url(#overlayShadow8)">
          <rect x="772" y="320" width="148" height="20" rx="3" fill="rgba(255,255,255,0.92)" />
          <text x="780" y="335" fontSize="10" fontWeight="700" fill="#7a1f1f" fontFamily="ui-monospace, SFMono-Regular, monospace">
            N 87°12' E · 560.4 ft
          </text>
        </g>
        <g transform="rotate(72 1240 500)" filter="url(#overlayShadow8)">
          <rect x="1232" y="486" width="148" height="20" rx="3" fill="rgba(255,255,255,0.92)" />
          <text x="1240" y="500" fontSize="10" fontWeight="700" fill="#7a1f1f" fontFamily="ui-monospace, SFMono-Regular, monospace">
            S 14°08' E · 412.6 ft
          </text>
        </g>

        {/* Parcel label — large, low opacity over photo */}
        <text x="780" y="600" fontSize="32" fontWeight="800" fill="rgba(255,255,255,0.85)" textAnchor="middle" letterSpacing="3" filter="url(#overlayShadow8)">
          TRACT 12-A
        </text>
        <text x="780" y="624" fontSize="11" fontWeight="700" fill="rgba(255,255,255,0.85)" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace" filter="url(#overlayShadow8)">
          12.4 AC · PINE RIDGE SUBDIVISION
        </text>

        {/* Secondary control points — triangle + label box */}
        {SECONDARY_CONTROLS.map((cp) => (
          <g key={cp.id} filter="url(#overlayShadow8)">
            <circle cx={cp.x} cy={cp.y} r="14" fill="rgba(255,255,255,0.65)" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
            <polygon
              points={`${cp.x},${cp.y - 9} ${cp.x - 8},${cp.y + 6} ${cp.x + 8},${cp.y + 6}`}
              fill="#ffffff"
              stroke="#1f242c"
              strokeWidth="1.5"
            />
            <circle cx={cp.x} cy={cp.y} r="1.8" fill="#1f242c" />
            <rect
              x={cp.x + 14}
              y={cp.y - 14}
              width="76"
              height="28"
              rx="4"
              fill="rgba(255,255,255,0.96)"
              stroke="rgba(0,0,0,0.22)"
              strokeWidth="1"
            />
            <text x={cp.x + 22} y={cp.y - 2} fontSize="10" fontWeight="800" fill="#1f242c" fontFamily="ui-monospace, SFMono-Regular, monospace">
              {cp.label}
            </text>
            <text x={cp.x + 22} y={cp.y + 10} fontSize="9" fill="rgba(60,70,90,0.85)" fontFamily="ui-monospace, SFMono-Regular, monospace">
              {cp.sub}
            </text>
          </g>
        ))}

        {/* Primary control BM-104 — where the AI marker anchors */}
        <g filter="url(#overlayShadow8)">
          {/* GNSS sky-view ring */}
          <circle
            cx={PRIMARY_CONTROL_WORLD.x}
            cy={PRIMARY_CONTROL_WORLD.y}
            r={140}
            fill="rgba(0,154,254,0.10)"
            stroke="rgba(0,154,254,0.65)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <rect x={PRIMARY_CONTROL_WORLD.x + 86} y={PRIMARY_CONTROL_WORLD.y - 122} width="138" height="20" rx="3" fill="rgba(255,255,255,0.92)" />
          <text
            x={PRIMARY_CONTROL_WORLD.x + 92}
            y={PRIMARY_CONTROL_WORLD.y - 107}
            fontSize="10"
            fontWeight="700"
            fill="#0063a3"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            GNSS sky view · 92%
          </text>

          {/* Monument symbol — square with X (concrete mon.) */}
          <circle cx={PRIMARY_CONTROL_WORLD.x} cy={PRIMARY_CONTROL_WORLD.y} r="22" fill="rgba(255,255,255,0.85)" />
          <rect
            x={PRIMARY_CONTROL_WORLD.x - 11}
            y={PRIMARY_CONTROL_WORLD.y - 11}
            width="22"
            height="22"
            fill="#ffffff"
            stroke="#0063a3"
            strokeWidth="2"
          />
          <line
            x1={PRIMARY_CONTROL_WORLD.x - 7}
            y1={PRIMARY_CONTROL_WORLD.y - 7}
            x2={PRIMARY_CONTROL_WORLD.x + 7}
            y2={PRIMARY_CONTROL_WORLD.y + 7}
            stroke="#0063a3"
            strokeWidth="2"
          />
          <line
            x1={PRIMARY_CONTROL_WORLD.x + 7}
            y1={PRIMARY_CONTROL_WORLD.y - 7}
            x2={PRIMARY_CONTROL_WORLD.x - 7}
            y2={PRIMARY_CONTROL_WORLD.y + 7}
            stroke="#0063a3"
            strokeWidth="2"
          />
          {/* BM-104 callout */}
          <rect x={PRIMARY_CONTROL_WORLD.x - 60} y={PRIMARY_CONTROL_WORLD.y + 30} width="120" height="34" rx="4" fill="rgba(255,255,255,0.96)" stroke="rgba(0,99,167,0.45)" strokeWidth="1" />
          <text
            x={PRIMARY_CONTROL_WORLD.x}
            y={PRIMARY_CONTROL_WORLD.y + 46}
            fontSize="11"
            fontWeight="800"
            fill="#0a3a5a"
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            BM-104
          </text>
          <text
            x={PRIMARY_CONTROL_WORLD.x}
            y={PRIMARY_CONTROL_WORLD.y + 58}
            fontSize="9"
            fill="rgba(10,58,90,0.85)"
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            14,237.92 E · 5,892.18 N
          </text>
        </g>

        {/* North arrow — top-right */}
        <g transform="translate(1500 90)" filter="url(#overlayShadow8)">
          <circle cx="0" cy="0" r="28" fill="rgba(255,255,255,0.92)" stroke="#1f242c" strokeWidth="1.2" />
          <polygon points="0,-20 8,8 0,2 -8,8" fill="#b3261e" />
          <polygon points="0,20 8,-8 0,-2 -8,-8" fill="#1f242c" />
          <text x="0" y="-32" fontSize="11" fontWeight="800" fill="#ffffff" textAnchor="middle" stroke="#1f242c" strokeWidth="0.4">
            N
          </text>
        </g>

        {/* Scale bar — bottom-left */}
        <g transform="translate(60 1040)" filter="url(#overlayShadow8)">
          <rect x="-6" y="-4" width="180" height="40" rx="3" fill="rgba(255,255,255,0.85)" />
          <rect x="0" y="0" width="40" height="8" fill="#1f242c" />
          <rect x="40" y="0" width="40" height="8" fill="#ffffff" stroke="#1f242c" strokeWidth="1" />
          <rect x="80" y="0" width="40" height="8" fill="#1f242c" />
          <rect x="120" y="0" width="40" height="8" fill="#ffffff" stroke="#1f242c" strokeWidth="1" />
          <text x="0" y="26" fontSize="10" fontWeight="700" fill="#1f242c">0</text>
          <text x="80" y="26" fontSize="10" fontWeight="700" fill="#1f242c" textAnchor="middle">100 ft</text>
          <text x="160" y="26" fontSize="10" fontWeight="700" fill="#1f242c" textAnchor="middle">200 ft</text>
        </g>

        {/* Photo metadata stamp — bottom-right */}
        <g transform="translate(1310 1050)" filter="url(#overlayShadow8)">
          <rect x="0" y="0" width="240" height="34" rx="4" fill="rgba(20,24,32,0.78)" />
          <text x="12" y="14" fontSize="9" fontWeight="700" fill="#9aa0aa" fontFamily="ui-monospace, SFMono-Regular, monospace">
            DJI MAVIC 3 · 90 m AGL
          </text>
          <text x="12" y="26" fontSize="9" fontWeight="600" fill="#ffffff" fontFamily="ui-monospace, SFMono-Regular, monospace">
            14 May · 09:42 · 36.4 MP
          </text>
        </g>
      </svg>
    </div>
  );
}

function MapControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  const btnStyle: React.CSSProperties = {
    width: '34px',
    height: '34px',
    background: 'var(--modus-wc-color-base-page, #fff)',
    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  };
  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={onZoomIn} style={btnStyle} aria-label="Zoom in">
        <ModusWcIcon name="add" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content, #364153)' }} />
      </button>
      <button type="button" onClick={onZoomOut} style={btnStyle} aria-label="Zoom out">
        <ModusWcIcon name="remove" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content, #364153)' }} />
      </button>
      <button type="button" onClick={onReset} style={btnStyle} aria-label="Reset view">
        <ModusWcIcon name="compass" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content, #364153)' }} />
      </button>
      <div
        className="flex items-center justify-center font-semibold"
        style={{
          ...btnStyle,
          cursor: 'default',
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

function TitleBlock() {
  return (
    <div
      className="rounded-lg px-3 py-2 flex flex-col gap-0.5"
      style={{
        background: 'var(--modus-wc-color-base-page, #fff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          letterSpacing: '0.3px',
        }}
      >
        SITE PHOTO · F-100 · 14 MAY 2026
      </span>
      <span
        className="font-semibold"
        style={{
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          color: 'var(--modus-wc-color-base-content, #101828)',
        }}
      >
        Pine Ridge Tract 12-A — BM-104 site
      </span>
      <span
        style={{
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        DJI Mavic 3 · 90 m AGL · georeferenced to NAD 83 (2011)
      </span>
    </div>
  );
}

function ControlsHint() {
  return (
    <div
      className="rounded-md px-3 py-1.5 flex items-center gap-3"
      style={{
        background: 'rgba(20, 24, 32, 0.78)',
        backdropFilter: 'blur(6px)',
        color: '#ffffff',
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        lineHeight: 1.4,
        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      }}
    >
      <span><strong>Drag</strong> — pan</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span><strong>Scroll</strong> — zoom</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span><strong>Tap marker</strong> — open methodology</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Default export — Map canvas + pulsing marker → Methodology Note
   The map fills the viewport. The marker is pinned to BM-104 in
   world space and stays anchored as the map pans/zooms.
   ───────────────────────────────────────────────────────────────── */

export default function Creative8() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, didMove: false });

  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Center on BM-104 on first mount.
  useEffect(() => {
    if (initialized) return;
    const el = containerRef.current;
    if (!el) return;
    setPan({
      x: el.clientWidth / 2 - PRIMARY_CONTROL_WORLD.x,
      y: el.clientHeight / 2 - PRIMARY_CONTROL_WORLD.y,
    });
    setInitialized(true);
  }, [initialized]);

  const markerScreen = {
    x: PRIMARY_CONTROL_WORLD.x * zoom + pan.x,
    y: PRIMARY_CONTROL_WORLD.y * zoom + pan.y,
  };

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setDragging(true);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      didMove: false,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (!dragRef.current.didMove && Math.hypot(dx, dy) > 3) {
      dragRef.current.didMove = true;
    }
    setPan({
      x: dragRef.current.panX + dx,
      y: dragRef.current.panY + dy,
    });
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragging) return;
    setDragging(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  }

  function handleWheel(e: React.WheelEvent) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    if (newZoom === zoom) return;
    const wx = (mx - pan.x) / zoom;
    const wy = (my - pan.y) / zoom;
    setPan({ x: mx - wx * newZoom, y: my - wy * newZoom });
    setZoom(newZoom);
  }

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, z * 1.2));
  }
  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, z / 1.2));
  }
  function resetView() {
    const el = containerRef.current;
    if (!el) return;
    setZoom(1);
    setPan({
      x: el.clientWidth / 2 - PRIMARY_CONTROL_WORLD.x,
      y: el.clientHeight / 2 - PRIMARY_CONTROL_WORLD.y,
    });
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#e9ecf2',
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Pan/zoomed map content */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      >
        <SitePlan />
      </div>

      {/* Connector line from marker to opened note */}
      {open && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <defs>
            <linearGradient id="rainbowLine8" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D7C0" />
              <stop offset="33%" stopColor="#009AFE" />
              <stop offset="55%" stopColor="#4A00FF" />
              <stop offset="78%" stopColor="#FF2092" />
              <stop offset="100%" stopColor="#FF00D3" />
            </linearGradient>
          </defs>
          <line
            x1={markerScreen.x}
            y1={markerScreen.y}
            x2={markerScreen.x + 60}
            y2={markerScreen.y + 30}
            stroke="url(#rainbowLine8)"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      )}

      {/* Marker — anchored to BM-104's projected screen position */}
      <div
        style={{
          position: 'absolute',
          left: markerScreen.x,
          top: markerScreen.y,
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Marker
          open={open}
          count={INITIAL_TOKENS.length}
          onClick={() => {
            if (dragRef.current.didMove) return;
            setOpen((o) => !o);
          }}
        />
      </div>

      {/* Methodology note — opens beside the marker, fixed size in screen space */}
      {open && (
        <div
          style={{
            position: 'absolute',
            left: markerScreen.x + 38,
            top: markerScreen.y - 20,
            zIndex: 20,
            animation: 'creative8-fade-in 0.2s ease-out',
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <MethodologyNote onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Title block — top-left */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      >
        <TitleBlock />
      </div>

      {/* Map controls — bottom-right */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 30,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
      </div>

      {/* Controls hint — bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      >
        <ControlsHint />
      </div>

      <style>{`
        @keyframes creative8-fade-in {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
