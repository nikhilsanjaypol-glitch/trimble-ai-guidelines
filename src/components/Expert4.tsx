import { useEffect, useMemo, useRef, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Expert 4 — EXPLAIN WHY
 *
 * To provide evidence-based clarity & traceability.
 *
 * An expert doesn't just give an answer; they provide the evidence.
 * When providing advice, the AI should highlight specific sources,
 * such as internal legal policies or contract paragraphs, to remove
 * guesswork.
 *
 * Pattern:
 *   1. The user asks a policy / compliance / "am I allowed to…"
 *      question.
 *   2. The AI gives a concise, decisive answer.
 *   3. Inline citation markers (e.g. ¹ ² ³) are anchored to the
 *      exact sentence whose claim each source backs up.
 *   4. Sentences and sources are linked bidirectionally — hovering
 *      either one highlights the other.
 *   5. Clicking a citation reveals an evidence card containing:
 *        • Source title, type, and last-updated date
 *        • The exact paragraph quoted, with the load-bearing
 *          phrase highlighted
 *        • Per-source actions: pin, copy quote, ask follow-up,
 *          open document
 *   6. The user can therefore verify the AI's reasoning at the
 *      paragraph level rather than trusting the model blindly.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

type SourceType = 'policy' | 'contract' | 'standard';

interface CitationEvidence {
  id: string;
  title: string;
  type: SourceType;
  updated: string;
  verified: string;
  section: string;
  /** Quote — text inside double-asterisks is rendered as a highlighted span. */
  quote: string;
  documentLabel?: string;
}

interface AnswerSegment {
  text: string;
  /** ID of the citation that backs up this segment, if any. */
  citationId?: string;
}

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  policy: 'Policy',
  contract: 'Contract',
  standard: 'Standard',
};

const SOURCE_TYPE_ACCENT: Record<SourceType, { bg: string; fg: string }> = {
  policy: { bg: '#e0f2fe', fg: '#0369a1' },
  contract: { bg: '#fef3c7', fg: '#92400e' },
  standard: { bg: '#dcfce7', fg: '#166534' },
};

const CITATIONS: CitationEvidence[] = [
  {
    id: 'c1',
    title: 'Trimble Internal Policy — AI Governance',
    type: 'policy',
    updated: 'Last updated: March 2025',
    verified: 'Verified 2 days ago',
    section: 'Section 4.2 — External Data Sharing',
    quote:
      'AI-generated outputs related to project schedules, forecasts, or recommendations **must be reviewed and approved by an authorized project manager** before being shared with any external party.',
    documentLabel: 'View document',
  },
  {
    id: 'c2',
    title: 'Master Subcontractor Agreement',
    type: 'contract',
    updated: 'Last updated: January 2025',
    verified: 'Verified 5 days ago',
    section: 'Clause 11 — Confidentiality & Data Use',
    quote:
      'Information designated as "automated insight" or "AI-generated forecast" **may not be transmitted to third-party contractors** without prior written approval from the Project Owner.',
    documentLabel: 'View contract',
  },
  {
    id: 'c3',
    title: 'ISO 19650-5 — Security-minded BIM',
    type: 'standard',
    updated: 'Effective: 2020 (current revision)',
    verified: 'Verified 1 week ago',
    section: 'Annex B — Disclosure controls',
    quote:
      'Where automated tools generate project information for distribution, **a documented approval trail shall be maintained** to demonstrate that disclosure complies with the project security plan.',
    documentLabel: 'Open standard',
  },
];

/* Order of segments in the AI response. Each text node either has a
 * citation attached (rendered with a clickable marker) or is plain. */
const ANSWER: AnswerSegment[] = [
  {
    text: 'AI-generated schedule recommendations can be shared with external contractors only after internal validation and approval by the project manager.',
    citationId: 'c1',
  },
  {
    text: ' Automated forecasts and insights are treated as confidential under the subcontractor agreement and require written owner approval before transmission.',
    citationId: 'c2',
  },
  {
    text: ' For projects covered by ISO 19650-5, an audit trail of the approval must also be retained.',
    citationId: 'c3',
  },
];

const RELATED_QUESTIONS = [
  'Who counts as an "authorized project manager"?',
  'What does the approval trail need to contain?',
  'Are AI-generated cost estimates treated the same way?',
];

const CITATION_NUMBER: Record<string, number> = CITATIONS.reduce(
  (acc, c, idx) => ({ ...acc, [c.id]: idx + 1 }),
  {} as Record<string, number>,
);

const CITATIONS_BY_ID: Record<string, CitationEvidence> = CITATIONS.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<string, CitationEvidence>,
);

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

/* ── User chat bubble (gray, right-aligned, tail bottom-right) ──── */
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

/* ── Inline citation marker — small numbered pill with hover preview */
function CitationMarker({
  number,
  active,
  hovered,
  citation,
  onActivate,
  onHoverChange,
}: {
  number: number;
  active: boolean;
  hovered: boolean;
  citation: CitationEvidence;
  onActivate: () => void;
  onHoverChange: (hovered: boolean) => void;
}) {
  const accent = SOURCE_TYPE_ACCENT[citation.type];

  function backgroundFor(state: { active: boolean; hovered: boolean }) {
    if (state.active) return 'var(--modus-wc-color-primary, #0063a3)';
    if (state.hovered) return accent.bg;
    return 'var(--modus-wc-color-base-200, #e0e1e9)';
  }

  function colorFor(state: { active: boolean; hovered: boolean }) {
    if (state.active) return '#ffffff';
    if (state.hovered) return accent.fg;
    return 'var(--modus-wc-color-base-content, #171c1e)';
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <button
        type="button"
        onClick={onActivate}
        aria-label={`Show source ${number}: ${citation.title}`}
        className="inline-flex items-center justify-center align-baseline transition-colors"
        style={{
          minWidth: '18px',
          height: '18px',
          padding: '0 5px',
          marginLeft: '4px',
          borderRadius: '999px',
          backgroundColor: backgroundFor({ active, hovered }),
          color: colorFor({ active, hovered }),
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          fontWeight: 700,
          lineHeight: '18px',
          border: 'none',
          cursor: 'pointer',
          verticalAlign: 'middle',
          position: 'relative',
          top: '-1px',
          transition: 'background-color 120ms ease, color 120ms ease',
        }}
      >
        {number}
      </button>

      {/* Tooltip preview on hover (suppressed when popover is open) */}
      {hovered && !active && (
        <span
          role="tooltip"
          className="absolute z-10 pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'calc(100% + 6px)',
            width: '200px',
            padding: '6px 8px',
            borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
            backgroundColor: 'var(--modus-wc-color-base-content, #171c1e)',
            color: '#ffffff',
            fontSize: '11px',
            lineHeight: '14px',
            boxShadow: '0px 4px 12px rgba(0,0,0,0.18)',
          }}
        >
          <span style={{ fontWeight: 700, display: 'block' }}>{citation.title}</span>
          <span style={{ opacity: 0.85 }}>{citation.section}</span>
        </span>
      )}
    </span>
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
                color: 'var(--modus-wc-color-base-content, #171c1e)',
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

/* ── Source-type pill ───────────────────────────────────────────── */
function SourceTypeBadge({ type }: { type: SourceType }) {
  const accent = SOURCE_TYPE_ACCENT[type];
  return (
    <span
      className="inline-flex items-center"
      style={{
        height: '16px',
        padding: '0 6px',
        borderRadius: '999px',
        backgroundColor: accent.bg,
        color: accent.fg,
        fontSize: '9px',
        fontWeight: 700,
        lineHeight: '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {SOURCE_TYPE_LABEL[type]}
    </span>
  );
}

/* ── Tiny icon-only action button used inside the evidence card ─── */
function MiniIconAction({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
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
          ? 'var(--modus-wc-color-primary-light, #cce6f4)'
          : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: active
          ? 'var(--modus-wc-color-primary, #0063a3)'
          : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
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
      <ModusWcIcon name={icon} size="xs" decorative />
    </button>
  );
}

/* ── Evidence Card — the popover shown next to the answer ───────── */
function EvidenceCard({
  citation,
  number,
  pinned,
  copied,
  onTogglePin,
  onCopyQuote,
  onAskFollowUp,
  onClose,
}: {
  citation: CitationEvidence;
  number: number;
  pinned: boolean;
  copied: boolean;
  onTogglePin: () => void;
  onCopyQuote: () => void;
  onAskFollowUp: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="flex flex-col"
      role="dialog"
      aria-label={`Source ${number}: ${citation.title}`}
      style={{
        width: '100%',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
        padding: '12px',
        gap: '10px',
        boxShadow:
          '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header: number + title + close */}
      <div className="flex items-start gap-2">
        <span
          className="inline-flex items-center justify-center shrink-0"
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '999px',
            backgroundColor: 'var(--modus-wc-color-primary, #0063a3)',
            color: '#ffffff',
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            fontWeight: 700,
            lineHeight: '18px',
            marginTop: '1px',
          }}
        >
          {number}
        </span>
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                fontWeight: 700,
                lineHeight: '20px',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              {citation.title}
            </span>
            <SourceTypeBadge type={citation.type} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                lineHeight: '16px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              {citation.updated}
            </span>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '3px',
                height: '3px',
                borderRadius: '999px',
                backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)',
              }}
            />
            <span
              className="inline-flex items-center gap-1"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                lineHeight: '16px',
                color: 'var(--modus-wc-color-status-success, #166534)',
              }}
            >
              <ModusWcIcon name="check_circle" size="xs" decorative />
              {citation.verified}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close source"
          onClick={onClose}
          className="flex items-center justify-center shrink-0 rounded-md"
          style={{
            width: '20px',
            height: '20px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--modus-wc-color-base-100, #f1f1f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ModusWcIcon name="close" size="xs" decorative />
        </button>
      </div>

      {/* Quote with highlighted excerpt */}
      <div className="flex gap-2">
        <span
          className="shrink-0"
          aria-hidden
          style={{
            width: '2px',
            borderRadius: '2px',
            backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)',
            alignSelf: 'stretch',
          }}
        />
        <div className="flex flex-col gap-1 min-w-0">
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              fontWeight: 600,
              lineHeight: '16px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {citation.section}
          </span>
          <HighlightedQuote text={citation.quote} />
        </div>
      </div>

      {/* Footer: per-source actions + open document */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <MiniIconAction
            icon={pinned ? 'star_filled' : 'star_outlined'}
            label={pinned ? 'Unpin source' : 'Pin source'}
            active={pinned}
            onClick={onTogglePin}
          />
          <MiniIconAction
            icon={copied ? 'check' : 'content_copy'}
            label={copied ? 'Quote copied' : 'Copy quote'}
            active={copied}
            onClick={onCopyQuote}
          />
          <MiniIconAction
            icon="chat"
            label="Ask a follow-up about this source"
            onClick={onAskFollowUp}
          />
        </div>
        <ModusWcButton
          size="sm"
          variant="outlined"
          color="secondary"
          onButtonClick={onClose}
        >
          <span className="flex items-center gap-2">
            <ModusWcIcon name="launch" size="xs" decorative />
            {citation.documentLabel ?? 'View document'}
          </span>
        </ModusWcButton>
      </div>
    </div>
  );
}

/* ── Pill used in the response metadata strip ───────────────────── */
function MetaPill({
  icon,
  text,
  tone = 'neutral',
}: {
  icon: string;
  text: string;
  tone?: 'success' | 'neutral';
}) {
  const fg =
    tone === 'success'
      ? 'var(--modus-wc-color-status-success, #166534)'
      : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)';
  const bg =
    tone === 'success'
      ? 'var(--modus-wc-color-status-success-light, #dcfce7)'
      : 'var(--modus-wc-color-base-100, #f1f1f6)';
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        height: '20px',
        padding: '0 8px',
        borderRadius: '999px',
        backgroundColor: bg,
        color: fg,
        fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
        fontWeight: 600,
        lineHeight: '16px',
      }}
    >
      <ModusWcIcon name={icon} size="xs" decorative />
      {text}
    </span>
  );
}

/* ── Expert 4 — Explain Why ─────────────────────────────────────── */
export default function Expert4() {
  const [activeCitation, setActiveCitation] = useState<string | null>('c1');
  const [hoveredCitation, setHoveredCitation] = useState<string | null>(null);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [perSourceCopied, setPerSourceCopied] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState('');

  const responseRef = useRef<HTMLDivElement>(null);

  /* The "spotlight" citation drives the bidirectional highlight:
   * any sentence whose citation matches gets highlighted, and the
   * corresponding chip + marker glow. Hover takes precedence over
   * the click-pinned active citation. */
  const spotlight = hoveredCitation ?? activeCitation;

  /* Click outside the response block closes the evidence card. */
  useEffect(() => {
    if (!activeCitation) return;
    function handleClick(event: MouseEvent) {
      if (!responseRef.current) return;
      if (!responseRef.current.contains(event.target as Node)) {
        setActiveCitation(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeCitation]);

  /* Escape closes the evidence card. */
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveCitation(null);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  function activateCitation(id: string) {
    setActiveCitation((prev) => (prev === id ? null : id));
  }

  function togglePin(id: string) {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function copyQuote(citation: CitationEvidence) {
    const cleanQuote = citation.quote.replace(/\*\*/g, '');
    const text = `"${cleanQuote}"\n— ${citation.title}, ${citation.section}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setPerSourceCopied(citation.id);
    window.setTimeout(
      () =>
        setPerSourceCopied((prev) => (prev === citation.id ? null : prev)),
      1500,
    );
  }

  function askFollowUp(citation: CitationEvidence) {
    setDraft(
      `Can you explain ${citation.title} — ${citation.section} in more detail?`,
    );
  }

  function askRelated(question: string) {
    setDraft(question);
  }

  function handleCopy() {
    const text = [
      ANSWER.map((s) => s.text).join(''),
      '',
      'Sources:',
      ...CITATIONS.map(
        (c, i) =>
          `[${i + 1}] ${c.title} — ${c.section} (${c.updated.replace(
            'Last updated: ',
            '',
          )})`,
      ),
    ].join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const activeCitationData = activeCitation
    ? CITATIONS_BY_ID[activeCitation]
    : null;

  const pinnedList = useMemo(
    () => CITATIONS.filter((c) => pinned.has(c.id)),
    [pinned],
  );

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
          {/* Response metadata strip */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <MetaPill icon="check_circle" text="High confidence" tone="success" />
            <MetaPill icon="document_outline" text={`${CITATIONS.length} sources cited`} />
            <MetaPill icon="history" text="Verified 2d ago" />
            <span
              style={{
                fontSize: '10px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                marginLeft: '2px',
              }}
            >
              · responded in 1.2s
            </span>
          </div>

          {/* Answer with inline citation markers + sentence-level hover sync */}
          <p
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '24px',
              margin: 0,
            }}
          >
            {ANSWER.map((segment, idx) => {
              const isLit =
                segment.citationId !== undefined &&
                spotlight === segment.citationId;
              const accent = segment.citationId
                ? SOURCE_TYPE_ACCENT[CITATIONS_BY_ID[segment.citationId].type]
                : null;
              return (
                <span
                  key={idx}
                  onMouseEnter={() =>
                    segment.citationId && setHoveredCitation(segment.citationId)
                  }
                  onMouseLeave={() => setHoveredCitation(null)}
                  style={{
                    backgroundColor:
                      isLit && accent ? accent.bg : 'transparent',
                    borderRadius: '3px',
                    padding: isLit ? '1px 2px' : '1px 0',
                    margin: isLit ? '0 -2px' : '0',
                    transition: 'background-color 140ms ease',
                    cursor: segment.citationId ? 'pointer' : 'default',
                  }}
                >
                  {segment.text}
                  {segment.citationId && (
                    <CitationMarker
                      number={CITATION_NUMBER[segment.citationId]}
                      active={activeCitation === segment.citationId}
                      hovered={hoveredCitation === segment.citationId}
                      citation={CITATIONS_BY_ID[segment.citationId]}
                      onActivate={() => activateCitation(segment.citationId!)}
                      onHoverChange={(h) =>
                        setHoveredCitation(h ? segment.citationId! : null)
                      }
                    />
                  )}
                </span>
              );
            })}
          </p>

          {/* Sources strip — quick access to all citations */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 600,
                lineHeight: '16px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Sources
            </span>
            {CITATIONS.map((c, idx) => {
              const isActive = activeCitation === c.id;
              const isHover = hoveredCitation === c.id;
              const isLit = isActive || isHover;
              const isPinned = pinned.has(c.id);
              const accent = SOURCE_TYPE_ACCENT[c.type];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => activateCitation(c.id)}
                  onMouseEnter={() => setHoveredCitation(c.id)}
                  onMouseLeave={() => setHoveredCitation(null)}
                  className="flex items-center gap-1 transition-colors"
                  style={{
                    height: '22px',
                    padding: '0 8px 0 4px',
                    borderRadius: '999px',
                    backgroundColor: isActive
                      ? 'var(--modus-wc-color-primary-light, #cce6f4)'
                      : isHover
                        ? accent.bg
                        : 'var(--modus-wc-color-base-100, #f1f1f6)',
                    border: `1px solid ${
                      isActive
                        ? 'var(--modus-wc-color-primary, #0063a3)'
                        : isPinned
                          ? 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)'
                          : 'transparent'
                    }`,
                    color: isActive
                      ? 'var(--modus-wc-color-primary, #0063a3)'
                      : isHover
                        ? accent.fg
                        : 'var(--modus-wc-color-base-content, #171c1e)',
                    fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    maxWidth: '200px',
                    transition: 'background-color 140ms ease, color 140ms ease',
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center shrink-0"
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '999px',
                      backgroundColor: isLit
                        ? 'var(--modus-wc-color-primary, #0063a3)'
                        : 'var(--modus-wc-color-base-200, #e0e1e9)',
                      color: isLit
                        ? '#ffffff'
                        : 'var(--modus-wc-color-base-content, #171c1e)',
                      fontSize: '9px',
                      fontWeight: 700,
                      lineHeight: '16px',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="overflow-hidden whitespace-nowrap"
                    style={{ textOverflow: 'ellipsis' }}
                  >
                    {c.title}
                  </span>
                  {isPinned && (
                    <ModusWcIcon
                      name="star_filled"
                      size="xs"
                      decorative
                      style={{ color: 'var(--modus-wc-color-warning, #ca8a04)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pinned bar — appears only when at least one source is pinned */}
          {pinnedList.length > 0 && (
            <div
              className="flex items-center gap-1.5 flex-wrap"
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
                border: '1px dashed var(--modus-wc-color-base-200, #e0e1e9)',
              }}
            >
              <ModusWcIcon
                name="star_filled"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-warning, #ca8a04)' }}
              />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  marginRight: '4px',
                }}
              >
                Pinned
              </span>
              {pinnedList.map((c) => (
                <span
                  key={c.id}
                  style={{
                    fontSize: '11px',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                  }}
                >
                  [{CITATION_NUMBER[c.id]}] {c.title}
                </span>
              ))}
            </div>
          )}

          {/* Evidence card — appears when a citation is active */}
          {activeCitationData && (
            <div
              style={{
                animation:
                  'expert4-evidence-in 180ms cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            >
              <EvidenceCard
                citation={activeCitationData}
                number={CITATION_NUMBER[activeCitationData.id]}
                pinned={pinned.has(activeCitationData.id)}
                copied={perSourceCopied === activeCitationData.id}
                onTogglePin={() => togglePin(activeCitationData.id)}
                onCopyQuote={() => copyQuote(activeCitationData)}
                onAskFollowUp={() => askFollowUp(activeCitationData)}
                onClose={() => setActiveCitation(null)}
              />
            </div>
          )}

          {/* You can also ask */}
          <div className="flex flex-col gap-1">
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 600,
                lineHeight: '16px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              You can also ask
            </span>
            <div className="flex flex-wrap gap-1.5">
              {RELATED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => askRelated(q)}
                  className="flex items-center gap-1 transition-colors"
                  style={{
                    minHeight: '22px',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    backgroundColor: 'transparent',
                    border:
                      '1px solid var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                    fontWeight: 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'var(--modus-wc-color-base-100, #f1f1f6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ModusWcIcon name="add" size="xs" decorative />
                  {q}
                </button>
              ))}
            </div>
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
              onClick={() => setFeedback((p) => (p === 'down' ? null : 'down'))}
            />
            <ActionIconButton
              icon="refresh"
              label="Regenerate"
              onClick={() => {
                setActiveCitation(null);
                setHoveredCitation(null);
              }}
            />
            <ActionIconButton icon="share" label="Share" />
            <ActionIconButton
              icon={copied ? 'check' : 'content_copy'}
              label={copied ? 'Copied' : 'Copy response with sources'}
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

      {/* Keyframes for evidence card entrance */}
      <style>{`
        @keyframes expert4-evidence-in {
          0% { opacity: 0; transform: translateY(-4px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
