import { useMemo, useState } from 'react';
import { ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

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
 * Interactions in this canvas:
 *   1. Three-level tone toggle — Quick / Friendly / Technical — so
 *      the user can dial complexity up or down.
 *   2. A reading-time chip that updates with the chosen tone so the
 *      cost of the response is visible before reading.
 *   3. Inline glossary popovers in Technical mode — every acronym or
 *      jargon term has a dotted underline and a tap-to-define popup.
 *   4. "Show me where" reveals a tiny site sketch that highlights
 *      the soft north-east corner the answer references.
 *   5. Source chips below the answer surface the inputs the AI used
 *      so trust is concrete, not abstract.
 *   6. Follow-up suggestion chips, phrased in casual user voice,
 *      expand to a friendly plain-language answer when tapped.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

type Tone = 'quick' | 'friendly' | 'technical';

interface Glossary {
  [term: string]: string;
}

const GLOSSARY: Glossary = {
  subgrade: 'The natural soil layer underneath where you build.',
  'bearing capacity': 'How much weight the ground can safely hold up.',
  SPT: 'Standard Penetration Test — a quick on-site test that counts hammer blows to measure soil strength.',
  CBR: 'California Bearing Ratio — a number that says how stiff the soil is compared to a known reference.',
  'differential settlement':
    'When one part of a building sinks more than another, causing it to tilt or crack.',
};

interface SourceChip {
  id: string;
  label: string;
  icon: string;
}

const SOURCES: SourceChip[] = [
  { id: 'soil', label: 'Soil report', icon: 'document' },
  { id: 'survey', label: 'Site survey', icon: 'map_marker' },
  { id: 'topo', label: 'Topo map', icon: 'layers' },
];

interface FollowUp {
  id: string;
  question: string;
  answer: string;
}

const FOLLOWUPS: FollowUp[] = [
  {
    id: 'footing',
    question: "What's a footing?",
    answer:
      "It's the wider base under a foundation that spreads the building's weight over more ground — kind of like snowshoes for a house. The wider it is, the softer ground it can handle.",
  },
  {
    id: 'north',
    question: 'Why is the north edge softer?',
    answer:
      "That spot used to be a low area where rain collected, so the soil there is finer and looser than the rest of your site. It's not a deal-breaker, just something to design around.",
  },
  {
    id: 'ignore',
    question: 'What if I ignore it?',
    answer:
      'Over time, that corner could settle a little more than the rest, which can crack walls or tilt floors. A wider footing in that spot prevents it — pretty cheap fix now, expensive to repair later.',
  },
];

/* ── Mini Trimble AI logo ───────────────────────────────────────── */
function TrimbleAiLogo({ size = 24 }: { size?: number }) {
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
        e.currentTarget.style.backgroundColor =
          'var(--modus-wc-color-base-100, #f1f1f6)';
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
        style={{
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      />
    </button>
  );
}

/* ── Three-way tone toggle: Quick | Friendly | Technical ────────── */
function ToneToggle({
  tone,
  onChange,
}: {
  tone: Tone;
  onChange: (next: Tone) => void;
}) {
  const options: { id: Tone; label: string }[] = [
    { id: 'quick', label: 'Quick' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'technical', label: 'Technical' },
  ];
  return (
    <div
      role="tablist"
      aria-label="Response tone"
      className="inline-flex items-center"
      style={{
        backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
        borderRadius: '1000px',
        padding: '2px',
        gap: '2px',
      }}
    >
      {options.map((opt) => {
        const selected = opt.id === tone;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.id)}
            className="transition-colors"
            style={{
              height: '24px',
              padding: '0 10px',
              borderRadius: '1000px',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              fontWeight: 600,
              backgroundColor: selected
                ? 'var(--modus-wc-color-base-page, #ffffff)'
                : 'transparent',
              color: selected
                ? 'var(--modus-wc-color-base-content, #171c1e)'
                : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              boxShadow: selected ? '0px 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Reading-time chip ──────────────────────────────────────────── */
function ReadingTimeChip({ seconds }: { seconds: number }) {
  return (
    <span
      className="inline-flex items-center"
      aria-label={`Estimated ${seconds} second read`}
      style={{
        height: '20px',
        padding: '0 8px',
        borderRadius: '1000px',
        backgroundColor: 'transparent',
        color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
        fontWeight: 600,
        gap: '4px',
      }}
    >
      <ModusWcIcon name="clock" size="xs" decorative />
      {seconds}s read
    </span>
  );
}

/* ── A jargon term with a dotted underline and an inline popover ─ */
function JargonTerm({
  term,
  definition,
  open,
  onToggle,
}: {
  term: string;
  definition: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <span className="relative inline">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="inline"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          font: 'inherit',
          color: 'var(--modus-wc-color-primary, #0063a3)',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: '3px',
          cursor: 'pointer',
        }}
      >
        {term}
      </button>
      {open && (
        <span
          role="tooltip"
          className="block"
          style={{
            marginTop: '4px',
            padding: '8px 10px',
            borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
            backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
            borderLeft:
              '3px solid var(--modus-wc-color-primary, #0063a3)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            lineHeight: '18px',
            fontWeight: 400,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              marginRight: '4px',
            }}
          >
            {term}:
          </span>
          {definition}
        </span>
      )}
    </span>
  );
}

/* ── "Show me where" inline mini site sketch ────────────────────── */
function SiteSketch() {
  return (
    <div
      className="flex flex-col"
      style={{
        marginTop: '6px',
        padding: '10px 12px',
        borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
        backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
        gap: '8px',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            fontWeight: 600,
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          Your site
        </span>
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            color:
              'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            fontWeight: 600,
          }}
        >
          N ↑
        </span>
      </div>

      <svg
        viewBox="0 0 240 120"
        width="100%"
        height="120"
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
          fill="#ffffff"
          stroke="var(--modus-wc-color-base-content-low-contrast, #6a6e79)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* Solid (firm) ground label dots */}
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
          fill="rgba(255, 32, 146, 0.12)"
          stroke="#FF2092"
          strokeWidth="1.5"
        />
        <text
          x="192"
          y="40"
          textAnchor="middle"
          fill="#FF2092"
          fontSize="10"
          fontWeight="700"
          fontFamily="inherit"
        >
          Soft patch
        </text>

        {/* Compass: just an N arrow */}
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

      <p
        style={{
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          lineHeight: '18px',
          margin: 0,
        }}
      >
        The pink area is the softer spot — roughly the size of a two-car
        garage. Everywhere else is solid.
      </p>
    </div>
  );
}

/* ── Source chip — "Based on: …" ────────────────────────────────── */
function SourcePill({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center transition-colors"
      style={{
        height: '22px',
        padding: '0 8px',
        borderRadius: '1000px',
        border:
          '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        backgroundColor: 'transparent',
        color: 'var(--modus-wc-color-base-content, #171c1e)',
        fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
        fontWeight: 600,
        gap: '4px',
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
      <ModusWcIcon name={icon} size="xs" decorative />
      {label}
    </button>
  );
}

/* ── Follow-up suggestion chip ──────────────────────────────────── */
function FollowUpChip({
  label,
  asked,
  onClick,
}: {
  label: string;
  asked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center transition-colors"
      style={{
        height: '26px',
        padding: '0 10px',
        borderRadius: '1000px',
        border: `1px solid ${
          asked
            ? 'var(--modus-wc-color-primary, #0063a3)'
            : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)'
        }`,
        backgroundColor: asked
          ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
          : 'transparent',
        color: asked
          ? 'var(--modus-wc-color-primary, #0063a3)'
          : 'var(--modus-wc-color-base-content, #171c1e)',
        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
        fontWeight: 400,
        gap: '4px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {asked ? (
        <ModusWcIcon name="check" size="xs" decorative />
      ) : (
        <ModusWcIcon name="add" size="xs" decorative />
      )}
      {label}
    </button>
  );
}

/* ── Expert 3 — Prioritize Clarity Over Complexity ──────────────── */
export default function Expert3() {
  const [tone, setTone] = useState<Tone>('friendly');
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [askedFollowUp, setAskedFollowUp] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState('');

  function toggleTerm(term: string) {
    setOpenTerm((prev) => (prev === term ? null : term));
  }

  function handleToneChange(next: Tone) {
    setTone(next);
    setOpenTerm(null);
    setShowMap(false);
  }

  function handleFollowUp(id: string) {
    setAskedFollowUp((prev) => (prev === id ? null : id));
  }

  function handleReset() {
    setTone('friendly');
    setOpenTerm(null);
    setShowMap(false);
    setAskedFollowUp(null);
  }

  const readingSeconds = useMemo(() => {
    if (tone === 'quick') return 5;
    if (tone === 'friendly') return 15;
    return 35;
  }, [tone]);

  const askedAnswer = useMemo(
    () => FOLLOWUPS.find((f) => f.id === askedFollowUp)?.answer ?? null,
    [askedFollowUp],
  );

  function handleCopy() {
    const text =
      tone === 'quick'
        ? 'Short answer: yes — your site is safe to build on. Just plan a wider footing in the north-east corner.'
        : tone === 'friendly'
          ? [
              'Short answer: yes — your site looks good to build on.',
              '',
              'The ground is firm, water drains away nicely, and we don’t expect anything to shift or sink. There’s one small soft patch near the north edge — a wider footing there will keep you safe.',
              '',
              'Want me to walk you through how we know?',
            ].join('\n')
          : [
              'Subgrade assessment: site is suitable for construction.',
              '',
              'Bearing capacity exceeds 150 kPa across 92% of the parcel. SPT N-values average 18 (well above the 8-blow threshold). CBR > 6 indicates a stable subgrade. Differential settlement is projected below L/500 per ASCE 7-22. The north-east quadrant shows reduced N-values requiring spread-footing geometry per IBC 1808.',
              '',
              'See the geotechnical report for full SPT logs, gradation curves, and consolidation results.',
            ].join('\n');

    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="bg-white rounded-xl flex flex-col"
      style={{
        width: '460px',
        boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.15)',
        padding: '24px 24px 8px 24px',
        gap: '24px',
      }}
    >
      {/* User prompt — deliberately casual, non-expert phrasing */}
      <UserBubble text="Is my site safe to build on?" />

      {/* Agent response */}
      <div className="flex gap-0 items-start">
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
        <div
          className="flex flex-col flex-1 min-w-0"
          style={{ gap: '12px', padding: '8px 0' }}
        >
          {/* Tone toggle row + reading time */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <ToneToggle tone={tone} onChange={handleToneChange} />
            <ReadingTimeChip seconds={readingSeconds} />
          </div>

          {tone === 'quick' && (
            <>
              <p
                style={{
                  fontSize: 'var(--modus-wc-font-size-md, 16px)',
                  fontWeight: 600,
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '24px',
                  margin: 0,
                }}
              >
                Yes — safe to build on.
              </p>
              <p
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '22px',
                  margin: 0,
                }}
              >
                Just plan a wider footing in the north-east corner.{' '}
                <button
                  type="button"
                  onClick={() => setShowMap((p) => !p)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--modus-wc-color-primary, #0063a3)',
                    fontSize: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {showMap ? 'Hide map' : 'Show me where'}
                </button>
              </p>
              {showMap && <SiteSketch />}
            </>
          )}

          {tone === 'friendly' && (
            <>
              {/* Headline answer — short, friendly, conversational */}
              <p
                style={{
                  fontSize: 'var(--modus-wc-font-size-md, 16px)',
                  fontWeight: 600,
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '24px',
                  margin: 0,
                }}
              >
                Short answer: yes — your site looks good to build on.
              </p>

              {/* Casual explanation, zero jargon */}
              <p
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '22px',
                  margin: 0,
                }}
              >
                The ground is firm, water drains away nicely, and we don’t
                expect anything to shift or sink. There’s one small soft patch
                near the north edge —{' '}
                <button
                  type="button"
                  onClick={() => setShowMap((p) => !p)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--modus-wc-color-primary, #0063a3)',
                    fontSize: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {showMap ? 'hide map' : 'show me where'}
                </button>
                . A wider footing there will keep you safe.
              </p>

              {showMap && <SiteSketch />}

              {/* Friendly closer / next step */}
              <p
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  lineHeight: '20px',
                  margin: 0,
                }}
              >
                Want me to walk you through how we know?
              </p>
            </>
          )}

          {tone === 'technical' && (
            <>
              {/* Technical headline — same answer, denser */}
              <p
                style={{
                  fontSize: 'var(--modus-wc-font-size-md, 16px)',
                  fontWeight: 600,
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '24px',
                  margin: 0,
                }}
              >
                Site is suitable for construction.
              </p>

              {/* Technical body with inline glossary terms.
                  Acronyms are NEVER used without a tap-to-define affordance. */}
              <p
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '22px',
                  margin: 0,
                }}
              >
                The{' '}
                <JargonTerm
                  term="subgrade"
                  definition={GLOSSARY.subgrade}
                  open={openTerm === 'subgrade'}
                  onToggle={() => toggleTerm('subgrade')}
                />{' '}
                has{' '}
                <JargonTerm
                  term="bearing capacity"
                  definition={GLOSSARY['bearing capacity']}
                  open={openTerm === 'bearing capacity'}
                  onToggle={() => toggleTerm('bearing capacity')}
                />{' '}
                above 150 kPa across 92% of the parcel.{' '}
                <JargonTerm
                  term="SPT"
                  definition={GLOSSARY.SPT}
                  open={openTerm === 'SPT'}
                  onToggle={() => toggleTerm('SPT')}
                />{' '}
                values average 18 — well above the 8-blow threshold — and{' '}
                <JargonTerm
                  term="CBR"
                  definition={GLOSSARY.CBR}
                  open={openTerm === 'CBR'}
                  onToggle={() => toggleTerm('CBR')}
                />{' '}
                is greater than 6. Projected{' '}
                <JargonTerm
                  term="differential settlement"
                  definition={GLOSSARY['differential settlement']}
                  open={openTerm === 'differential settlement'}
                  onToggle={() => toggleTerm('differential settlement')}
                />{' '}
                stays under L/500. The north-east quadrant has lower readings
                and needs a wider spread footing.{' '}
                <button
                  type="button"
                  onClick={() => setShowMap((p) => !p)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--modus-wc-color-primary, #0063a3)',
                    fontSize: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {showMap ? 'Hide location' : 'Show location'}
                </button>
              </p>

              {showMap && <SiteSketch />}

              {/* Hint that defines the interaction */}
              <p
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  lineHeight: '18px',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                Tap any underlined term for a plain-English definition.
              </p>
            </>
          )}

          {/* Source chips — what the answer is based on */}
          <div
            className="flex items-center flex-wrap"
            style={{ gap: '6px', marginTop: '4px' }}
          >
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 600,
                color:
                  'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                marginRight: '2px',
              }}
            >
              Based on
            </span>
            {SOURCES.map((s) => (
              <SourcePill key={s.id} icon={s.icon} label={s.label} />
            ))}
          </div>

          {/* Follow-up suggestions — in casual user voice */}
          <div className="flex flex-col" style={{ gap: '6px', marginTop: '4px' }}>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                fontWeight: 600,
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              You can also ask:
            </span>
            <div className="flex flex-wrap" style={{ gap: '6px' }}>
              {FOLLOWUPS.map((f) => (
                <FollowUpChip
                  key={f.id}
                  label={f.question}
                  asked={askedFollowUp === f.id}
                  onClick={() => handleFollowUp(f.id)}
                />
              ))}
            </div>
            {askedAnswer && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '8px 12px',
                  borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                  backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
                  borderLeft:
                    '3px solid var(--modus-wc-color-primary, #0063a3)',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    lineHeight: '20px',
                    margin: 0,
                  }}
                >
                  {askedAnswer}
                </p>
              </div>
            )}
          </div>

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
              onClick={() =>
                setFeedback((p) => (p === 'down' ? null : 'down'))
              }
            />
            <ActionIconButton
              icon="refresh"
              label="Regenerate"
              onClick={handleReset}
            />
            <ActionIconButton icon="share" label="Share" />
            <ActionIconButton
              icon={copied ? 'check' : 'content_copy'}
              label={copied ? 'Copied' : 'Copy response'}
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
          {/* Text input row */}
          <div className="px-1">
            <ModusWcTextInput
              value={draft}
              placeholder="How can I help you?"
              bordered={false}
              onInputChange={(e: CustomEvent) =>
                setDraft(e.detail?.target?.value || '')
              }
            />
          </div>

          {/* Parameters / actions row */}
          <div className="flex items-center justify-between gap-2 pt-0.5 px-1">
            {/* Left: model + scope */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex items-center gap-1"
                style={{
                  height: '24px',
                  padding: '0 4px 0 8px',
                  borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                  border:
                    '1px solid var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
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

            {/* Right: add source + send */}
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
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = 'underline')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.textDecoration = 'none')
          }
        >
          Acceptable Use
        </button>
      </div>
    </div>
  );
}
