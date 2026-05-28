import { useEffect, useRef, useState } from 'react';
import { ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Expert 2 — COMMUNICATE THE WORK
 *
 * To create mutual understanding.
 *
 * Communicate the work done and decisions made, alongside any key
 * rationale. This builds trust in responses, while allowing users to
 * review, learn from and accept recommendations.
 *
 * Pattern (top → bottom):
 *   1. AI Insight header + confidence — signals this is a reasoned
 *      response (not a guess) and how confident the model is.
 *   2. Headline answer with a Project entity pill (hover to inspect).
 *   3. Risk score bar — a quantitative grounding for the headline.
 *   4. "Why this matters" — plain-language rationale.
 *   5. "What I analysed" — expandable rows. Each row reveals the
 *      underlying metric, a mini chart, and the data source so the
 *      user can audit the reasoning.
 *   6. Closing implication — re-states the decision.
 *   7. Suggested follow-ups — clickable chips that pre-fill the next
 *      prompt, helping the user keep the conversation going.
 *   8. Action toolbar — feedback / regenerate / share / copy with
 *      toast confirmation.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

type Severity = 'high' | 'medium' | 'low';

interface AnalysedSection {
  id: string;
  icon: string;
  title: string;
  detail: string;
  /** 0–100 indicator value used for the inline progress bar. */
  value: number;
  /** Short label shown next to the bar (e.g. "−20%", "7 pending"). */
  badge: string;
  severity: Severity;
  source: string;
  updated: string;
}

const ANALYSED_SECTIONS: AnalysedSection[] = [
  {
    id: 'resource',
    icon: 'people_group',
    title: 'Resource Allocation',
    detail:
      'Skilled trades scheduled on Falcon are 20% under target headcount this sprint, with the largest gap on form-work crews.',
    value: 80,
    badge: '80% staffed',
    severity: 'high',
    source: 'Crew schedule',
    updated: 'Updated 2h ago',
  },
  {
    id: 'change',
    icon: 'list_form_outlined',
    title: 'Change Orders',
    detail:
      '7 active change orders are pending owner approval. 3 of them block sequencing on the south facade.',
    value: 65,
    badge: '7 pending',
    severity: 'medium',
    source: 'Change order log',
    updated: 'Updated 4h ago',
  },
  {
    id: 'pricing',
    icon: 'cost_estimate',
    title: 'Material Pricing',
    detail:
      'Concrete suppliers in this region are quoting 30% above the bid baseline, driven by aggregate shortages.',
    value: 90,
    badge: '+30% vs bid',
    severity: 'high',
    source: 'Supplier quotes',
    updated: 'Updated yesterday',
  },
];

const FOLLOW_UPS = [
  { id: 'compare', icon: 'compare', label: 'Compare to other projects' },
  { id: 'mitigate', icon: 'wrench', label: 'Show mitigation steps' },
  { id: 'timeline', icon: 'calendar', label: 'View Falcon timeline' },
];

const SEVERITY_TOKENS: Record<
  Severity,
  { color: string; bg: string; label: string }
> = {
  high: {
    color: 'var(--modus-wc-color-status-danger, #c8102e)',
    bg: 'var(--modus-wc-color-status-danger-light, #fdecea)',
    label: 'High',
  },
  medium: {
    color: 'var(--modus-wc-color-status-warning, #b25d00)',
    bg: 'var(--modus-wc-color-status-warning-light, #fff4e0)',
    label: 'Medium',
  },
  low: {
    color: 'var(--modus-wc-color-status-success, #1e7e34)',
    bg: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
    label: 'Low',
  },
};

/* ── Mini Trimble AI logo ───────────────────────────────────────── */
function TrimbleAiLogo({ size = 24 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 30.002 32.6797" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="expert2-logo" x1="3.7558" y1="10.5251" x2="20.4332" y2="30.2565" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF2BFC" />
            <stop offset="0.628993" stopColor="#0563A7" />
            <stop offset="1" stopColor="#075CA4" />
          </linearGradient>
        </defs>
        <path
          d="M1.69824 24.9697C3.48353 26.9109 5.82653 28.2524 8.4043 28.8096L1.69824 32.6797V24.9697ZM10.6523 5.60742C16.5357 5.60742 21.3057 10.3803 21.3057 16.2676C21.3055 22.1547 16.5356 26.9268 10.6523 26.9268C4.76928 26.9265 0.00017177 22.1545 0 16.2676C0 10.3805 4.76918 5.60766 10.6523 5.60742ZM10.6523 7.69238C5.9201 7.69263 2.08398 11.5321 2.08398 16.2676C2.08416 21.0029 5.92021 24.8416 10.6523 24.8418C15.3847 24.8418 19.2215 21.003 19.2217 16.2676C19.2217 11.532 15.3848 7.69238 10.6523 7.69238ZM30.002 16.3398L23.2803 20.2217C24.0854 17.7019 24.0922 14.9945 23.2998 12.4707L30.002 16.3398ZM8.35547 3.83691C5.79861 4.40439 3.47535 5.73916 1.69824 7.66309V0L8.35547 3.83691Z"
          fill="url(#expert2-logo)"
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

/* ── Project entity pill (hover surfaces a tooltip with metadata) ─ */
function ProjectPill({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 transition-colors"
        style={{
          height: '22px',
          padding: '0 8px',
          borderRadius: '999px',
          border: '1px solid var(--modus-wc-color-primary, #0063a3)',
          background: 'rgba(0, 99, 163, 0.08)',
          color: 'var(--modus-wc-color-primary, #0063a3)',
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          fontWeight: 600,
          lineHeight: '20px',
          cursor: 'pointer',
        }}
      >
        <ModusWcIcon name="construction" size="xs" decorative />
        {name}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-10 flex flex-col"
          style={{
            top: '110%',
            left: 0,
            minWidth: '220px',
            padding: '10px 12px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            gap: '4px',
          }}
        >
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              fontWeight: 600,
              color: 'var(--modus-wc-color-base-content, #171c1e)',
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Mixed-use · 12 floors · Phase 3 of 4
          </span>
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Handover: Aug 14, 2026
          </span>
        </span>
      )}
    </span>
  );
}

/* ── AI Insight header (gradient dot + label + confidence) ──────── */
function InsightHeader({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: TRIMBLE_RAINBOW,
            boxShadow: '0 0 0 3px rgba(74, 0, 255, 0.10)',
          }}
        />
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            fontWeight: 700,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          AI Insight
        </span>
      </span>
      <span
        className="inline-flex items-center gap-1"
        style={{
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        <ModusWcIcon
          name="check_circle"
          size="xs"
          decorative
          style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
        />
        <span style={{ fontWeight: 600 }}>{confidence}% confidence</span>
      </span>
    </div>
  );
}

/* ── Risk score bar ─────────────────────────────────────────────── */
function RiskScore({ score }: { score: number }) {
  const tier: Severity = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
  const token = SEVERITY_TOKENS[tier];

  return (
    <div
      className="flex flex-col"
      style={{
        gap: '6px',
        padding: '10px 12px',
        borderRadius: '10px',
        background: 'var(--modus-wc-color-base-100, #f1f1f6)',
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
          Risk score
        </span>
        <span
          className="inline-flex items-center gap-1.5"
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            fontWeight: 700,
            color: token.color,
          }}
        >
          <span
            aria-hidden
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: token.color,
            }}
          />
          {score} / 100 · {token.label}
        </span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '999px',
          backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            backgroundColor: token.color,
            borderRadius: '999px',
            transition: 'width 600ms ease',
          }}
        />
      </div>
    </div>
  );
}

/* ── Collapsible "What I analysed" row with inline data viz ─────── */
function AnalysedRow({
  section,
  open,
  onToggle,
}: {
  section: AnalysedSection;
  open: boolean;
  onToggle: () => void;
}) {
  const token = SEVERITY_TOKENS[section.severity];
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(open ? 'none' : '0px');

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      const target = contentRef.current.scrollHeight;
      setMaxHeight(`${target}px`);
      const t = window.setTimeout(() => setMaxHeight('none'), 280);
      return () => window.clearTimeout(t);
    }
    if (contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
      requestAnimationFrame(() => setMaxHeight('0px'));
    }
    return undefined;
  }, [open]);

  return (
    <div
      className="flex flex-col w-full"
      style={{
        borderRadius: '8px',
        border: open
          ? '1px solid var(--modus-wc-color-base-200, #e0e1e9)'
          : '1px solid transparent',
        transition: 'border-color 160ms ease',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center w-full transition-colors"
        style={{
          gap: '8px',
          padding: '6px 12px',
          minHeight: '36px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          borderRadius: '8px',
        }}
        onMouseEnter={(e) => {
          if (open) return;
          e.currentTarget.style.backgroundColor =
            'var(--modus-wc-color-base-100, #f1f1f6)';
        }}
        onMouseLeave={(e) => {
          if (open) return;
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <ModusWcIcon
          name={section.icon}
          size="sm"
          decorative
          style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}
        />
        <span
          className="flex-1"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            fontWeight: 700,
            lineHeight: '24px',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
          }}
        >
          {section.title}
        </span>
        <span
          className="inline-flex items-center"
          style={{
            height: '20px',
            padding: '0 8px',
            borderRadius: '999px',
            backgroundColor: token.bg,
            color: token.color,
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            fontWeight: 700,
            lineHeight: '20px',
          }}
        >
          {section.badge}
        </span>
        <ModusWcIcon
          name={open ? 'expand_less' : 'expand_more'}
          size="sm"
          decorative
          style={{
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            transition: 'transform 200ms ease',
          }}
        />
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight,
          overflow: 'hidden',
          transition: 'max-height 240ms ease',
        }}
      >
        <div
          className="flex flex-col"
          style={{
            padding: '4px 12px 8px 36px',
            gap: '8px',
          }}
        >
          <p
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              lineHeight: '20px',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              margin: 0,
            }}
          >
            {section.detail}
          </p>

          {/* Mini data viz */}
          <div className="flex items-center gap-2">
            <div
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '999px',
                backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: open ? `${section.value}%` : '0%',
                  height: '100%',
                  backgroundColor: token.color,
                  borderRadius: '999px',
                  transition: 'width 480ms ease 80ms',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 600,
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                whiteSpace: 'nowrap',
              }}
            >
              {section.value}%
            </span>
          </div>

          {/* Source attribution */}
          <div className="flex items-center gap-1.5">
            <ModusWcIcon
              name="link"
              size="xs"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
            />
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              Source: <span style={{ fontWeight: 600 }}>{section.source}</span>
              {' · '}
              {section.updated}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Toast (transient confirmation message) ─────────────────────── */
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: `translate(-50%, ${visible ? '-8px' : '4px'})`,
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        background: 'var(--modus-wc-color-base-content, #171c1e)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'opacity 180ms ease, transform 180ms ease',
        zIndex: 5,
      }}
    >
      {message}
    </div>
  );
}

/* ── Expert 2 — Communicate the Work ────────────────────────────── */
export default function Expert2() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    resource: true,
  });
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setRevealed(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const allOpen = ANALYSED_SECTIONS.every((s) => openSections[s.id]);
  const anyOpen = ANALYSED_SECTIONS.some((s) => openSections[s.id]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  }

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAllSections() {
    const next = !allOpen;
    setOpenSections(
      ANALYSED_SECTIONS.reduce<Record<string, boolean>>((acc, s) => {
        acc[s.id] = next;
        return acc;
      }, {}),
    );
  }

  function handleFollowUp(label: string) {
    setDraft(label);
  }

  function handleCopy() {
    const sections = ANALYSED_SECTIONS.map(
      (s) => `• ${s.title} (${s.badge}): ${s.detail} — ${s.source}, ${s.updated}`,
    ).join('\n');
    const text = [
      'Project Falcon is currently at the highest risk of missing its handover date.',
      'Primary drivers are 20% shortage in skilled labor and 30% cost increase in concrete.',
      '',
      'Why this matters: These factors are already impacting both schedule and budget stability.',
      '',
      'What I analysed:',
      sections,
    ].join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
    showToast('Response copied');
  }

  function handleShare() {
    showToast('Share link copied');
  }

  function handleFeedback(next: 'up' | 'down') {
    setFeedback((p) => {
      const value = p === next ? null : next;
      if (value) showToast(value === 'up' ? 'Thanks — feedback noted' : 'Thanks — we\u2019ll improve');
      return value;
    });
  }

  return (
    <div
      className="bg-white rounded-xl flex flex-col"
      style={{
        width: '440px',
        boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.15)',
        padding: '24px 24px 8px 24px',
        gap: '24px',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 320ms ease, transform 320ms ease',
      }}
    >
      {/* User prompt */}
      <UserBubble text="Which of my projects is currently at highest risk of missing handover date?" />

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
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: '12px', padding: '8px 0' }}>
          {/* AI Insight header + confidence */}
          <InsightHeader confidence={92} />

          {/* Headline answer with project entity pill */}
          <p
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '24px',
              margin: 0,
            }}
          >
            <ProjectPill name="Project Falcon" />
            {' '}is currently at the highest risk of missing its handover date.
            Primary drivers are a{' '}
            <strong style={{ fontWeight: 600 }}>20% shortage in skilled labor</strong>
            {' '}and a{' '}
            <strong style={{ fontWeight: 600 }}>30% cost increase in concrete</strong>.
          </p>

          {/* Risk score */}
          <RiskScore score={87} />

          {/* Why this matters */}
          <div className="flex flex-col">
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 600,
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '24px',
              }}
            >
              Why this matters:
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '24px',
              }}
            >
              These factors are already impacting both schedule and budget
              stability.
            </span>
          </div>

          {/* What I analysed */}
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  fontWeight: 600,
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '24px',
                }}
              >
                What I analysed:
              </span>
              <button
                type="button"
                onClick={toggleAllSections}
                className="cursor-pointer"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 4px',
                  color: 'var(--modus-wc-color-primary, #0063a3)',
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  fontWeight: 600,
                  lineHeight: '20px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                {anyOpen && allOpen ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
            <div className="flex flex-col" style={{ gap: '4px' }}>
              {ANALYSED_SECTIONS.map((section) => (
                <AnalysedRow
                  key={section.id}
                  section={section}
                  open={!!openSections[section.id]}
                  onToggle={() => toggleSection(section.id)}
                />
              ))}
            </div>
          </div>

          {/* Closing implication */}
          <p
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '24px',
              margin: 0,
            }}
          >
            Based on these factors, this project is more likely to experience
            delays compared to others.
          </p>

          {/* Suggested follow-ups */}
          <div className="flex flex-col" style={{ gap: '6px' }}>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 700,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              Suggested follow-ups
            </span>
            <div className="flex flex-wrap gap-2">
              {FOLLOW_UPS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFollowUp(f.label)}
                  className="inline-flex items-center transition-colors"
                  style={{
                    gap: '6px',
                    height: '28px',
                    padding: '0 12px',
                    borderRadius: '999px',
                    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                    background: 'var(--modus-wc-color-base-page, #fff)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'var(--modus-wc-color-base-100, #f1f1f6)';
                    e.currentTarget.style.borderColor =
                      'var(--modus-wc-color-primary, #0063a3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'var(--modus-wc-color-base-page, #fff)';
                    e.currentTarget.style.borderColor =
                      'var(--modus-wc-color-base-200, #e0e1e9)';
                  }}
                >
                  <ModusWcIcon
                    name={f.icon}
                    size="xs"
                    decorative
                    style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
                  />
                  {f.label}
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
              onClick={() => handleFeedback('up')}
            />
            <ActionIconButton
              icon="thumbs_down"
              label="Not helpful"
              active={feedback === 'down'}
              onClick={() => handleFeedback('down')}
            />
            <ActionIconButton
              icon="refresh"
              label="Regenerate"
              onClick={() => {
                setOpenSections({ resource: true });
                showToast('Regenerated');
              }}
            />
            <ActionIconButton icon="share" label="Share" onClick={handleShare} />
            <ActionIconButton
              icon="content_copy"
              label="Copy response"
              onClick={handleCopy}
            />
          </div>
        </div>
      </div>

      {/* Prompt input with rainbow gradient border + toast anchor */}
      <div className="relative">
        <Toast message={toast ?? ''} visible={!!toast} />
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
                onInputChange={(e: CustomEvent) => setDraft(e.detail?.target?.value || '')}
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
                  onClick={() => {
                    if (draft.trim() === '') return;
                    showToast('Question sent');
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
    </div>
  );
}
