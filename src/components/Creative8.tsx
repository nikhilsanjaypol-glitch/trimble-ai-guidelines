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

   The full-canvas map is a satellite-style site view with the survey
   overlay (parcel boundary, control points). The pulsing AI marker is
   anchored to the AI's recommended primary control monument.
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

/* The original 2400×1600 site plan is wrapped in a translate(800 600)
   group so the surveyed parcel sits in the bottom-right of the larger
   canvas. BM_104 is the position inside that group (original design
   coords); PRIMARY_CONTROL_WORLD is the same point in absolute world
   coords — used by the marker overlay outside the SVG. */
const SHIFT_X = 800;
const SHIFT_Y = 600;
const BM_104 = { x: 1080, y: 360 };
const PRIMARY_CONTROL_WORLD = { x: BM_104.x + SHIFT_X, y: BM_104.y + SHIFT_Y };

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const INITIAL_ZOOM = 0.65;

const PARCEL_POLYGON =
  '520,340 1080,360 1180,560 1140,840 660,900 440,720 400,500';

const SECONDARY_CONTROLS = [
  { id: 'BM-208', x: 460, y: 760, label: 'BM-208', sub: 'SW iron pin' },
  { id: 'CP-201', x: 1240, y: 580, label: 'CP-201', sub: 'Road mon.' },
  { id: 'CP-302', x: 800, y: 600, label: 'CP-302', sub: 'Interior' },
];

/* Expansive canvas (3200×2200 world units) styled like Google Maps'
   default Terrain layer: warm cream base, subtle hill shading, brown
   contour lines, pale green forest, light blue water, and white road
   cores with proper highway/local casings. The bigger world gives the
   surveyor more terrain to pan and zoom across. */
function SitePlan() {
  return (
    <svg
      width="3200"
      height="2200"
      viewBox="0 0 3200 2200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Soft hill-shading fill */}
        <radialGradient id="hill8" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(184,158,115,0.16)" />
          <stop offset="100%" stopColor="rgba(184,158,115,0)" />
        </radialGradient>

        {/* Forest fill — soft pale green */}
        <linearGradient id="forest8" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cfe5c5" />
          <stop offset="100%" stopColor="#bbd6ad" />
        </linearGradient>

        {/* Water — pale blue with soft top-light */}
        <linearGradient id="water8" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bcdcec" />
          <stop offset="100%" stopColor="#a8cee0" />
        </linearGradient>

        {/* Drop shadow for buildings (very subtle, Google-like) */}
        <filter id="bldShadow8" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Base land ─────────────────────────────────────────────── */}
      <rect x="0" y="0" width="3200" height="2200" fill="#f5f1e6" />

      {/* Subtle hill shading — soft mounds across the terrain */}
      <ellipse cx="1850" cy="420" rx="700" ry="500" fill="url(#hill8)" />
      <ellipse cx="500" cy="1280" rx="800" ry="540" fill="url(#hill8)" />
      <ellipse cx="2200" cy="1300" rx="500" ry="380" fill="url(#hill8)" />
      <ellipse cx="2900" cy="520" rx="620" ry="440" fill="url(#hill8)" />
      <ellipse cx="2700" cy="1880" rx="780" ry="520" fill="url(#hill8)" />
      <ellipse cx="1400" cy="1980" rx="900" ry="500" fill="url(#hill8)" />

      {/* ── Contour lines ─────────────────────────────────────────── */}
      {[
        'M -20 240 Q 400 200 800 280 T 1700 320 T 2400 280 T 3220 240',
        'M -20 380 Q 460 340 880 420 T 1780 460 T 2400 440 T 3220 400',
        'M -20 520 Q 520 480 940 560 T 1850 600 T 2400 600 T 3220 580',
        'M -20 680 Q 480 640 920 720 T 1820 780 T 2400 780 T 3220 760',
        'M -20 1100 Q 520 1060 980 1140 T 1860 1180 T 2400 1180 T 3220 1160',
        'M -20 1260 Q 540 1220 1000 1300 T 1900 1320 T 2400 1340 T 3220 1320',
        'M -20 1420 Q 560 1380 1020 1460 T 1920 1480 T 2400 1480 T 3220 1500',
        'M -20 1640 Q 560 1600 1080 1680 T 1980 1700 T 2640 1720 T 3220 1700',
        'M -20 1820 Q 600 1780 1120 1860 T 2040 1880 T 2700 1900 T 3220 1880',
        'M -20 2020 Q 620 1980 1180 2060 T 2100 2080 T 2780 2100 T 3220 2080',
      ].map((d, i) => (
        <path
          key={`contour-${i}`}
          d={d}
          stroke="#b89e73"
          strokeWidth="0.8"
          fill="none"
          opacity="0.42"
        />
      ))}

      {/* ── Forest / park patches ─────────────────────────────────── */}
      <path
        d="M 0 60 L 360 40 L 460 220 L 380 380 L 220 420 L 40 360 L 0 280 Z"
        fill="url(#forest8)"
      />
      <path
        d="M 1500 100 L 1880 60 L 2200 140 L 2380 280 L 2400 460 L 2200 500 L 1900 420 L 1620 360 L 1500 240 Z"
        fill="url(#forest8)"
      />
      <path
        d="M 0 880 L 240 860 L 360 1020 L 280 1160 L 100 1180 L 0 1100 Z"
        fill="url(#forest8)"
      />
      <path
        d="M 1880 880 L 2200 860 L 2480 980 L 2520 1240 L 2160 1280 L 1980 1180 L 1880 1040 Z"
        fill="url(#forest8)"
      />
      {/* New: forest in the upper-right of the expanded canvas */}
      <path
        d="M 2580 120 L 2900 80 L 3140 200 L 3200 380 L 3200 540 L 2980 580 L 2740 480 L 2620 320 Z"
        fill="url(#forest8)"
      />
      {/* New: pine stand south of the parcel */}
      <path
        d="M 220 1700 L 540 1660 L 760 1780 L 820 1960 L 700 2120 L 460 2160 L 240 2080 L 160 1920 Z"
        fill="url(#forest8)"
      />
      {/* New: large forested ridge to the south-east */}
      <path
        d="M 1880 1780 L 2240 1740 L 2540 1820 L 2780 1960 L 2820 2140 L 2580 2180 L 2280 2120 L 2020 2020 L 1880 1900 Z"
        fill="url(#forest8)"
      />
      {/* New: thin tree line along the eastern edge */}
      <path
        d="M 2980 880 L 3200 860 L 3200 1380 L 3060 1340 L 3000 1100 Z"
        fill="url(#forest8)"
      />

      {/* Smaller scattered tree clusters — minimal, Google-Terrain-style */}
      {[
        { x: 280, y: 480, r: 26 },
        { x: 220, y: 580, r: 18 },
        { x: 320, y: 540, r: 14 },
        { x: 1380, y: 520, r: 22 },
        { x: 1560, y: 560, r: 16 },
        { x: 360, y: 1240, r: 20 },
        { x: 480, y: 1300, r: 14 },
        { x: 2080, y: 540, r: 22 },
        { x: 2200, y: 700, r: 26 },
        { x: 1820, y: 1080, r: 18 },
        { x: 2120, y: 1100, r: 20 },
        { x: 2640, y: 660, r: 22 },
        { x: 2820, y: 760, r: 18 },
        { x: 1100, y: 1820, r: 26 },
        { x: 1240, y: 1900, r: 16 },
        { x: 940, y: 1880, r: 20 },
        { x: 2920, y: 1640, r: 18 },
        { x: 3060, y: 1740, r: 22 },
        { x: 1660, y: 2020, r: 16 },
        { x: 1820, y: 2080, r: 14 },
      ].map((t, i) => (
        <circle key={`grove-${i}`} cx={t.x} cy={t.y} r={t.r} fill="#bdd5af" />
      ))}

      {/* ── Pine Creek (water body) ───────────────────────────────── */}
      <path
        d="M -40 1340 Q 240 1280 460 1380 T 880 1440 T 1320 1400 Q 1620 1360 1880 1460 T 2440 1500 T 2900 1480 T 3240 1520"
        stroke="url(#water8)"
        strokeWidth="34"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M -40 1340 Q 240 1280 460 1380 T 880 1440 T 1320 1400 Q 1620 1360 1880 1460 T 2440 1500 T 2900 1480 T 3240 1520"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <text x="540" y="1330" fontSize="13" fontStyle="italic" fontWeight="600" fill="#4f7e96">
        Pine Creek
      </text>

      {/* Tributary — meanders south through the new lower terrain */}
      <path
        d="M 1320 1400 Q 1380 1620 1500 1820 T 1620 2200"
        stroke="url(#water8)"
        strokeWidth="22"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 1320 1400 Q 1380 1620 1500 1820 T 1620 2200"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <text x="1430" y="1820" fontSize="11" fontStyle="italic" fontWeight="600" fill="#4f7e96" transform="rotate(70 1430 1820)">
        Cedar Branch
      </text>

      {/* Small pond on the right */}
      <ellipse cx="2200" cy="1380" rx="80" ry="48" fill="url(#water8)" />
      <ellipse cx="2200" cy="1380" rx="80" ry="48" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />

      {/* New pond in the lower-right */}
      <ellipse cx="2860" cy="1900" rx="120" ry="70" fill="url(#water8)" />
      <ellipse cx="2860" cy="1900" rx="120" ry="70" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      <text x="2860" y="1908" fontSize="11" fontStyle="italic" fontWeight="600" fill="#4f7e96" textAnchor="middle">
        Echo Pond
      </text>

      {/* ── Roads — Google-style casing + white core ─────────────── */}

      {/* State Hwy 41 — east-west, with yellow casing + white core */}
      <g transform="rotate(-2 1200 410)">
        <rect x="-40" y="386" width="3280" height="48" fill="#f4b400" />
        <rect x="-40" y="394" width="3280" height="32" fill="#ffffff" />
        {/* center dashes */}
        {Array.from({ length: 42 }).map((_, i) => (
          <rect
            key={`hwy-line-${i}`}
            x={-20 + i * 80}
            y={408}
            width="40"
            height="4"
            fill="#f4b400"
            opacity="0.85"
          />
        ))}
      </g>
      {/* Highway shield */}
      <g transform="translate(2100 360)">
        <rect x="-22" y="-16" width="44" height="32" rx="6" fill="#ffffff" stroke="#3a3f48" strokeWidth="1.5" />
        <text x="0" y="2" fontSize="9" fontWeight="800" fill="#3a3f48" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace">
          STATE
        </text>
        <text x="0" y="13" fontSize="11" fontWeight="800" fill="#3a3f48" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace">
          41
        </text>
      </g>

      {/* Local road — Lincoln Lane heading south, casing+core */}
      <path
        d="M 760 400 Q 800 600 720 800 T 660 1180 T 700 1500"
        stroke="#cccccc"
        strokeWidth="22"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 760 400 Q 800 600 720 800 T 660 1180 T 700 1500"
        stroke="#ffffff"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="700"
        y="1100"
        fontSize="11"
        fontWeight="600"
        fill="#5a5f67"
        fontStyle="italic"
        transform="rotate(82 700 1100)"
      >
        Lincoln Ln
      </text>

      {/* Dirt access path */}
      <path
        d="M 660 880 Q 980 1000 1300 980 T 1820 920"
        stroke="#a89878"
        strokeWidth="6"
        strokeDasharray="4 6"
        fill="none"
      />

      {/* Cedar County Rd — east-west collector across the southern terrain */}
      <path
        d="M 0 1820 Q 600 1780 1180 1840 T 2200 1880 T 3220 1860"
        stroke="#cccccc"
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 0 1820 Q 600 1780 1180 1840 T 2200 1880 T 3220 1860"
        stroke="#ffffff"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
      />
      <text x="2400" y="1850" fontSize="11" fontWeight="600" fill="#5a5f67" fontStyle="italic">
        Cedar County Rd
      </text>

      {/* Connector spur joining the parcel access road to Cedar County Rd */}
      <path
        d="M 700 1500 Q 760 1640 820 1820"
        stroke="#cccccc"
        strokeWidth="16"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 700 1500 Q 760 1640 820 1820"
        stroke="#ffffff"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />

      {/* ── Buildings — light gray with subtle shadow ─────────────── */}
      {[
        { x: 700, y: 280, w: 60, h: 44 },
        { x: 1340, y: 740, w: 80, h: 56 },
        { x: 160, y: 740, w: 50, h: 36 },
        { x: 240, y: 820, w: 40, h: 28 },
        { x: 2020, y: 760, w: 70, h: 50 },
        { x: 2080, y: 1080, w: 56, h: 40 },
        { x: 540, y: 1340, w: 44, h: 30 },
        { x: 1740, y: 480, w: 52, h: 36 },
        // New buildings in the expanded canvas
        { x: 2640, y: 1740, w: 64, h: 44 },
        { x: 2720, y: 1760, w: 40, h: 30 },
        { x: 2680, y: 1700, w: 48, h: 30 },
        { x: 2780, y: 1700, w: 44, h: 32 },
        { x: 380, y: 1900, w: 56, h: 38 },
        { x: 460, y: 1940, w: 40, h: 28 },
        { x: 1480, y: 2020, w: 52, h: 36 },
        { x: 3000, y: 720, w: 60, h: 42 },
      ].map((b, i) => (
        <rect
          key={`bld-${i}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill="#ebe8e0"
          stroke="#c8c4b8"
          strokeWidth="1"
          filter="url(#bldShadow8)"
        />
      ))}

      {/* Place labels */}
      <text x="2080" y="640" fontSize="13" fontWeight="600" fill="#666" letterSpacing="1">
        Pine Ridge
      </text>
      <text x="2080" y="660" fontSize="10" fill="#888" letterSpacing="0.5">
        Unincorporated
      </text>
      <text x="2700" y="1660" fontSize="13" fontWeight="600" fill="#666" letterSpacing="1">
        Cedar Hollow
      </text>
      <text x="2700" y="1680" fontSize="10" fill="#888" letterSpacing="0.5">
        Pop. 142
      </text>
      <text x="3000" y="280" fontSize="13" fontWeight="600" fill="#666" letterSpacing="1">
        Black Pine SF
      </text>
      <text x="3000" y="300" fontSize="10" fill="#888" letterSpacing="0.5">
        State Forest
      </text>

      {/* ─────────────────────────────────────────────────────────────
          SURVEY OVERLAY — drawn on top of the terrain map
          ───────────────────────────────────────────────────────────── */}

      {/* Subject parcel — yellow fill, red dashed boundary */}
      <polygon
        points={PARCEL_POLYGON}
        fill="rgba(242,201,76,0.22)"
        stroke="#c73838"
        strokeWidth="3"
        strokeDasharray="10 5"
      />

      {/* Parcel corner ticks */}
      {PARCEL_POLYGON.split(' ').map((p) => {
        const [x, y] = p.split(',').map(Number);
        return (
          <g key={`corner-${x}-${y}`}>
            <circle cx={x} cy={y} r="5" fill="#fff" stroke="#c73838" strokeWidth="2" />
          </g>
        );
      })}

      {/* Bearing/distance labels */}
      <g>
        <rect x="772" y="320" width="148" height="20" rx="3" fill="rgba(255,255,255,0.92)" stroke="rgba(199,56,56,0.35)" strokeWidth="1" />
        <text x="780" y="335" fontSize="10" fontWeight="700" fill="#7a1f1f" fontFamily="ui-monospace, SFMono-Regular, monospace">
          N 87°12' E · 560.4 ft
        </text>
      </g>
      <g transform="rotate(72 1240 500)">
        <rect x="1232" y="486" width="148" height="20" rx="3" fill="rgba(255,255,255,0.92)" stroke="rgba(199,56,56,0.35)" strokeWidth="1" />
        <text x="1240" y="500" fontSize="10" fontWeight="700" fill="#7a1f1f" fontFamily="ui-monospace, SFMono-Regular, monospace">
          S 14°08' E · 412.6 ft
        </text>
      </g>

      {/* Parcel label */}
      <text x="780" y="600" fontSize="26" fontWeight="800" fill="rgba(74,32,32,0.55)" textAnchor="middle" letterSpacing="3">
        TRACT 12-A
      </text>
      <text x="780" y="624" fontSize="11" fontWeight="600" fill="rgba(74,32,32,0.6)" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace">
        12.4 AC · PINE RIDGE SUBDIVISION
      </text>

      {/* Secondary control points */}
      {SECONDARY_CONTROLS.map((cp) => (
        <g key={cp.id}>
          <circle cx={cp.x} cy={cp.y} r="14" fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <polygon
            points={`${cp.x},${cp.y - 9} ${cp.x - 8},${cp.y + 6} ${cp.x + 8},${cp.y + 6}`}
            fill="#ffffff"
            stroke="#3a3f48"
            strokeWidth="1.5"
          />
          <circle cx={cp.x} cy={cp.y} r="1.8" fill="#3a3f48" />
          <rect
            x={cp.x + 14}
            y={cp.y - 14}
            width="76"
            height="28"
            rx="4"
            fill="rgba(255,255,255,0.96)"
            stroke="rgba(0,0,0,0.18)"
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
      <g>
        <circle
          cx={PRIMARY_CONTROL_WORLD.x}
          cy={PRIMARY_CONTROL_WORLD.y}
          r={140}
          fill="rgba(0,99,167,0.08)"
          stroke="rgba(0,99,167,0.4)"
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

      {/* North arrow — top-right of plan */}
      <g transform="translate(3100 110)">
        <circle cx="0" cy="0" r="28" fill="rgba(255,255,255,0.95)" stroke="#3a3f48" strokeWidth="1.2" />
        <polygon points="0,-20 8,8 0,2 -8,8" fill="#b3261e" />
        <polygon points="0,20 8,-8 0,-2 -8,-8" fill="#3a3f48" />
        <text x="0" y="-32" fontSize="11" fontWeight="800" fill="#3a3f48" textAnchor="middle">
          N
        </text>
      </g>

      {/* Scale bar — bottom-left */}
      <g transform="translate(60 2140)">
        <rect x="-6" y="-6" width="200" height="44" rx="3" fill="rgba(255,255,255,0.92)" />
        <rect x="0" y="0" width="46" height="8" fill="#1f242c" />
        <rect x="46" y="0" width="46" height="8" fill="#ffffff" stroke="#1f242c" strokeWidth="1" />
        <rect x="92" y="0" width="46" height="8" fill="#1f242c" />
        <rect x="138" y="0" width="46" height="8" fill="#ffffff" stroke="#1f242c" strokeWidth="1" />
        <text x="0" y="26" fontSize="10" fontWeight="700" fill="#1f242c">0</text>
        <text x="92" y="26" fontSize="10" fontWeight="700" fill="#1f242c" textAnchor="middle">100 ft</text>
        <text x="184" y="26" fontSize="10" fontWeight="700" fill="#1f242c" textAnchor="middle">200 ft</text>
      </g>
    </svg>
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
        FIELD SHEET F-100 · BOUNDARY &amp; TOPO
      </span>
      <span
        className="font-semibold"
        style={{
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          color: 'var(--modus-wc-color-base-content, #101828)',
        }}
      >
        Pine Ridge Tract 12-A — Survey
      </span>
      <span
        style={{
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        1 : 1000 · NAD 83 (2011) · State Plane CO Central
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
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Center on BM-104 on first mount.
  useEffect(() => {
    if (initialized) return;
    const el = containerRef.current;
    if (!el) return;
    setPan({
      x: el.clientWidth / 2 - PRIMARY_CONTROL_WORLD.x * INITIAL_ZOOM,
      y: el.clientHeight / 2 - PRIMARY_CONTROL_WORLD.y * INITIAL_ZOOM,
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
    setZoom(INITIAL_ZOOM);
    setPan({
      x: el.clientWidth / 2 - PRIMARY_CONTROL_WORLD.x * INITIAL_ZOOM,
      y: el.clientHeight / 2 - PRIMARY_CONTROL_WORLD.y * INITIAL_ZOOM,
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
