import { useState, type ComponentType, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import {
  Creative3VariantProvider,
  useCreative3Variant,
  type Creative3Variant,
} from './context/Creative3VariantContext';
import {
  Creative7VariantProvider,
  useCreative7Variant,
  type Creative7Variant,
} from './context/Creative7VariantContext';
import {
  Expert1VariantProvider,
  useExpert1Variant,
  type Expert1Variant,
} from './context/Expert1VariantContext';
import Creative1 from './components/Creative1';
import Creative2 from './components/Creative2';
import Creative3 from './components/Creative3';
import Creative4 from './components/Creative4';
import Creative5 from './components/Creative5';
import Creative7 from './components/Creative7';
import Creative8 from './components/Creative8';
import Creative9 from './components/Creative9';
import Expert1 from './components/Expert1';
import Expert2 from './components/Expert2';
import Expert3 from './components/Expert3';
import Expert4 from './components/Expert4';
import Expert5 from './components/Expert5';
import Expert6 from './components/Expert6';
import Pro1 from './components/Pro1';
import Pro2 from './components/Pro2';
import Pro3 from './components/Pro3';
import Pro4 from './components/Pro4';
import Pro5 from './components/Pro5';
import Pro6 from './components/Pro6';
import Pro7 from './components/Pro7';
import SiteScene from './components/SiteScene';
import Intro from './components/Intro';

interface RouteDef {
  path: string;
  label: string;
  Component: ComponentType;
  fullBleed?: boolean;
}

const routes: RouteDef[] = [
  { path: '/creative1', label: 'Creative 1 — Allow Editable Outputs', Component: Creative1 },
  { path: '/creative2', label: 'Creative 2 — Build Upon Existing Work', Component: Creative2 },
  { path: '/creative3', label: 'Creative 3 — Provide Options', Component: Creative3 },
  { path: '/creative4', label: 'Creative 4 — Present Relevant Information', Component: Creative4 },
  { path: '/creative5', label: 'Creative 5 — Offer Breadth', Component: Creative5 },
  { path: '/creative6', label: 'Creative 6 — Suggest Alternatives', Component: SiteScene, fullBleed: true },
  { path: '/creative7', label: 'Creative 7 — Reiterate the Plan', Component: Creative7 },
  { path: '/creative8', label: 'Creative 8 — Give Professionals Control', Component: Creative8, fullBleed: true },
  { path: '/creative9', label: 'Creative 9 — Offer Possibilities', Component: Creative9 },
  { path: '/expert1', label: 'Expert 1 — Lead the Conversation', Component: Expert1 },
  { path: '/expert2', label: 'Expert 2 — Communicate the Work', Component: Expert2 },
  { path: '/expert3', label: 'Expert 3 — Prioritize Clarity Over Complexity', Component: Expert3 },
  { path: '/expert4', label: 'Expert 4 — Explain Why', Component: Expert4, fullBleed: true },
  { path: '/expert5', label: 'Expert 5 — Be Honest About Limitations', Component: Expert5 },
  { path: '/expert6', label: 'Expert 6 — Highlight Further Investigation', Component: Expert6 },
  { path: '/pro1', label: 'Pro 1 — Integrate with Professional Tools', Component: Pro1 },
  { path: '/pro2', label: 'Pro 2 — Perform Bite-Sized Tasks', Component: Pro2 },
  { path: '/pro3', label: 'Pro 3 — Be Trainable, Context and Domain Aware', Component: Pro3, fullBleed: true },
  { path: '/pro4', label: 'Pro 4 — Support Intervention', Component: Pro4 },
  { path: '/pro5', label: 'Pro 5 — Provide Context and Citations', Component: Pro5 },
  { path: '/pro6', label: 'Pro 6 — Visualize Work Done for Acceptance', Component: Pro6, fullBleed: true },
  { path: '/pro7', label: 'Pro 7 — Defer to the Professional', Component: Pro7, fullBleed: true },
];

function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--modus-wc-color-base-page, #f5f6fa)' }}
    >
      {children}
    </div>
  );
}

const categories: {
  id: string;
  title: string;
  color: string;
  tint: string;
  match: (path: string) => boolean;
}[] = [
  {
    id: 'creative',
    title: 'Creative',
    color: '#FF2092',
    tint: '#FFE6F2',
    match: (p) => p.startsWith('/creative'),
  },
  {
    id: 'expert',
    title: 'Expert',
    color: '#009AFE',
    tint: '#E5F3FF',
    match: (p) => p.startsWith('/expert'),
  },
  {
    id: 'pro',
    title: 'Pro',
    color: '#4A00FF',
    tint: '#ECE5FF',
    match: (p) => p.startsWith('/pro'),
  },
];

/* Per-guideline content for the top-left overlay shown when viewing
 * an individual guideline. `purpose` is the short "To …" sub-line;
 * `body` is the longer explanation. */
interface GuidelineInfo {
  purpose?: string;
  body: string;
}

const GUIDELINE_EXPLANATIONS: Record<string, GuidelineInfo> = {
  creative1: {
    purpose: "To keep the professional in control of the result.",
    body: "AI outputs should be returned in formats the professional can directly edit and refine, so they can shape the work to their standards rather than starting over.",
  },
  creative2: {
    purpose: "To respect the work already done.",
    body: "The AI should treat the professional\u2019s in-progress work as the starting point, extending and building on it instead of replacing it with something generated from scratch.",
  },
  creative3: {
    purpose: "To support the creative process.",
    body: "The AI should provide multiple divergent options which allow for the professional to provide creative direction, and retain a sense of creative control.",
  },
  creative4: {
    purpose: "To support informed decision making.",
    body: "AI tools should present & communicate options which are optimized for different criteria, allowing the professional to make effective trade-offs based on their priorities.",
  },
  creative5: {
    purpose: "To offer divergent creative options.",
    body: "The AI should offer distinct, diverse options \u2014 not tiny variations \u2014 so users feel they are truly in a position to steer the creative direction of work.",
  },
  creative6: {
    purpose: "To encourage alternative or un-explored avenues.",
    body: "The AI should encourage exploration of new directions, styles, ideas, or approaches that the professional may not have initially considered.",
  },
  creative7: {
    purpose: "To ensure mutual understanding of the key factors.",
    body: "The AI should communicate its plan, and expand areas of ambiguity. This might look like paraphrasing its understanding allowing you to iterate the plan before receiving results.",
  },
  creative8: {
    purpose: "To give professionals control while maintaining their ownership & accountability.",
    body: "The AI should extract and elevate key details and professional decisions such as references, colors, feelings, or materials into clear reviewable choices.",
  },
  creative9: {
    purpose: "To inspire professionals as a creative partner, while maintaining their control.",
    body: "AI workflows should consider presenting multiple options which can guide exploration in a way which is simple for professionals to interact with. Consider UI controls instead of text conversations.",
  },
  expert1: {
    purpose: "To guide user requests.",
    body: "Don\u2019t force the user to guess how to talk to the expert. Use clarifying questions to help the user formulate their request, especially if the initial prompt is vague or lacks technical detail.",
  },
  expert2: {
    purpose: "To create mutual understanding.",
    body: "Communicate the work done and decisions made, alongside any key rationale. This builds trust in responses, while allowing users to review, learn from and accept recommendations.",
  },
  expert3: {
    purpose: "To provide digestible information.",
    body: "Because the user is not an expert, AI must deliver that information concisely while presenting information in a digestible way. This could involve using a casual, conversational, human tone and avoiding technical jargon or acronyms unless clearly defined.",
  },
  expert4: {
    purpose: "To provide evidence-based clarity & traceability.",
    body: "An expert doesn\u2019t just give an answer; they provide the evidence. When providing advice, the AI should highlight specific sources, such as internal legal policies or contract paragraphs, to remove guesswork.",
  },
  expert5: {
    purpose: "To identify knowledge gaps.",
    body: "When AI doesn\u2019t know how to address a request, customers need it to explicitly mention this rather than hallucinating or providing generic or incorrect filler.",
  },
  expert6: {
    purpose: "To guide users to possible resolutions.",
    body: "To ease user frustration when the AI is not confident of an outcome. It should clearly indicate approaches the user can take to investigate further to find the solution.",
  },
  pro1: {
    purpose: "To allow professionals to work with AI as equals.",
    body: "AI should live inside the tools professionals already use, performing the same actions they can perform and producing outputs that flow naturally back into their established workflows.",
  },
  pro2: {
    purpose: "To support professional oversight.",
    body: "AI should take on small, well-scoped tasks the professional can quickly verify, rather than long, opaque chains of work that are hard to audit or correct.",
  },
  pro3: {
    purpose: "To ensure relevance & usefulness.",
    body: "AI should learn from the professional\u2019s context \u2014 their project, their domain, their conventions \u2014 so its suggestions are grounded in the specifics of the work, not generic best practice.",
  },
  pro4: {
    purpose: "To preserve professional authority.",
    body: "Professionals must be able to step in at any moment to adjust, override, or stop the AI. Their judgement always takes priority over the AI\u2019s output.",
  },
  pro5: {
    purpose: "To ensure traceability & integrity.",
    body: "Professionals must be able to feel confident of the \u201cwhy\u201d behind the \u201cwhat.\u201d Citations to specific sources allow the professional to easily trace the AI\u2019s logic to confirm accuracy, or to intervene with different interpretations.",
  },
  pro6: {
    purpose: "To focus professional attention.",
    body: "Professionals need to quickly identify areas that require their expertise. Visual cues such as highlighting areas where AI has performed edits help to direct a user\u2019s attention so they can quickly validate & accept the work.",
  },
  pro7: {
    purpose: "To verify high-impact sections.",
    body: "Don\u2019t wait for the user to find the hard parts; proactively ask them to verify high-impact sections. These prompts act as a safety net, ensuring nothing important is missed and reducing the need for manual triple-checking.",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  creative: '#FF2092',
  expert: '#009AFE',
  pro: '#4A00FF',
};

function categoryOf(slug: string): keyof typeof CATEGORY_COLORS | null {
  if (slug.startsWith('creative')) return 'creative';
  if (slug.startsWith('expert')) return 'expert';
  if (slug.startsWith('pro')) return 'pro';
  return null;
}

/* ── Top-left guideline overlay ────────────────────────────────── */
function GuidelineOverlay({
  slug,
  label,
  info,
  color,
}: {
  slug: string;
  label: string;
  info: GuidelineInfo;
  color: string;
}) {
  const [open, setOpen] = useState(false);
  const dashIdx = label.indexOf(' — ');
  const pre = dashIdx >= 0 ? label.slice(0, dashIdx) : label;
  const name = dashIdx >= 0 ? label.slice(dashIdx + 3) : '';

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show guideline info"
        className="fixed top-4 right-4 z-[60] inline-flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: '#fff',
          color,
          border: 'none',
          boxShadow:
            '0 6px 16px -6px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.08)',
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        i
      </button>
    );
  }

  return (
    <div
      className="fixed top-4 right-4 z-[60] rounded-lg"
      style={{
        maxWidth: 320,
        backgroundColor: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow:
          '0 12px 28px -10px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)',
        borderTop: `3px solid ${color}`,
        padding: '14px 16px 14px 16px',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Hide guideline info"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <div
        className="text-[10px] uppercase tracking-[0.25em] font-semibold"
        style={{ color }}
      >
        {pre}
      </div>
      {name && (
        <div
          className="font-semibold mt-1 leading-snug"
          style={{
            fontSize: 14,
            color: 'var(--modus-wc-color-base-content, #1a1a1a)',
            paddingRight: 18,
          }}
        >
          {name}
        </div>
      )}
      {info.purpose && (
        <div
          className="mt-2"
          style={{
            fontSize: 11,
            lineHeight: 1.4,
            fontStyle: 'italic',
            color,
            fontWeight: 600,
          }}
        >
          {info.purpose}
        </div>
      )}
      <p
        className="mt-2"
        style={{
          fontSize: 12,
          lineHeight: 1.55,
          color: 'var(--modus-wc-color-base-content-low-contrast, #4a4f59)',
          margin: 0,
        }}
      >
        {info.body}
      </p>

      {slug === 'creative3' && <Creative3VariantPicker color={color} />}
      {slug === 'creative7' && <Creative7VariantPicker color={color} />}
      {slug === 'expert1' && <Expert1VariantPicker color={color} />}
    </div>
  );
}

/* ── Creative-3 specific: pick between the two variants of the
 *    "Provide options" guideline (with / without signature moves).
 *    Renders inside the GuidelineOverlay only when on /creative3.
 *    Reads + writes the variant via Creative3VariantContext.       */
function Creative3VariantPicker({ color }: { color: string }) {
  const ctx = useCreative3Variant();
  if (!ctx) return null;
  const { variant, setVariant } = ctx;

  const options: { id: Creative3Variant; title: string; desc: string }[] = [
    {
      id: 'with-moves',
      title: 'With signature moves',
      desc: 'Toggle each move on/off to customize a direction.',
    },
    {
      id: 'no-moves',
      title: 'Without signature moves',
      desc: 'See each direction as a complete plan — no toggles.',
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Guideline version"
      className="mt-3 pt-3"
      style={{
        borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
      }}
    >
      <div
        className="uppercase font-semibold"
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          marginBottom: 6,
        }}
      >
        Guideline version
      </div>

      <div className="flex flex-col" style={{ gap: 4 }}>
        {options.map((opt) => {
          const isCurrent = variant === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isCurrent}
              onClick={() => setVariant(opt.id)}
              className="flex items-start"
              style={{
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                background: isCurrent
                  ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                  : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--modus-wc-color-base-content, #1a1a1a)',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background =
                    'var(--modus-wc-color-base-100, #f1f1f6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${isCurrent ? color : 'var(--modus-wc-color-base-200, #c8c9d2)'}`,
                  background: isCurrent ? color : 'transparent',
                  marginTop: 2,
                  flexShrink: 0,
                  boxShadow: isCurrent
                    ? 'inset 0 0 0 2px #fff'
                    : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
              <span className="flex flex-col" style={{ gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {opt.title}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1.4,
                    color:
                      'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {opt.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Creative-7 specific: pick between the two variants of the
 *    "Reiterate the plan" guideline (full tablet shell / plan-only).
 *    Renders inside the GuidelineOverlay only when on /creative7.    */
function Creative7VariantPicker({ color }: { color: string }) {
  const ctx = useCreative7Variant();
  if (!ctx) return null;
  const { variant, setVariant } = ctx;

  const options: { id: Creative7Variant; title: string; desc: string }[] = [
    {
      id: 'plan-only',
      title: 'Plan card only',
      desc: 'Just the centered chat thread — no shell, no prompt bar.',
    },
    {
      id: 'tablet',
      title: 'Full tablet view',
      desc: 'Chat shell with side nav, avatar, plan card, and prompt bar.',
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Guideline version"
      className="mt-3 pt-3"
      style={{
        borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
      }}
    >
      <div
        className="uppercase font-semibold"
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          marginBottom: 6,
        }}
      >
        Guideline version
      </div>

      <div className="flex flex-col" style={{ gap: 4 }}>
        {options.map((opt) => {
          const isCurrent = variant === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isCurrent}
              onClick={() => setVariant(opt.id)}
              className="flex items-start"
              style={{
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                background: isCurrent
                  ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                  : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--modus-wc-color-base-content, #1a1a1a)',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background =
                    'var(--modus-wc-color-base-100, #f1f1f6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${isCurrent ? color : 'var(--modus-wc-color-base-200, #c8c9d2)'}`,
                  background: isCurrent ? color : 'transparent',
                  marginTop: 2,
                  flexShrink: 0,
                  boxShadow: isCurrent ? 'inset 0 0 0 2px #fff' : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
              <span className="flex flex-col" style={{ gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {opt.title}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1.4,
                    color:
                      'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {opt.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Expert-1 specific: pick between the two variants of the
 *    "Lead the conversation" guideline (phone shell / screen only).
 *    Renders inside the GuidelineOverlay only when on /expert1.     */
function Expert1VariantPicker({ color }: { color: string }) {
  const ctx = useExpert1Variant();
  if (!ctx) return null;
  const { variant, setVariant } = ctx;

  const options: { id: Expert1Variant; title: string; desc: string }[] = [
    {
      id: 'screen-only',
      title: 'Screen only',
      desc: 'Landscape conversation card — no phone bezel, top bar, or prompt bar.',
    },
    {
      id: 'phone',
      title: 'Phone shell',
      desc: '375 × 720 mobile bezel — rounded corners, drop shadow, sticky prompt bar.',
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Guideline version"
      className="mt-3 pt-3"
      style={{
        borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
      }}
    >
      <div
        className="uppercase font-semibold"
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          marginBottom: 6,
        }}
      >
        Guideline version
      </div>

      <div className="flex flex-col" style={{ gap: 4 }}>
        {options.map((opt) => {
          const isCurrent = variant === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isCurrent}
              onClick={() => setVariant(opt.id)}
              className="flex items-start"
              style={{
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                background: isCurrent
                  ? 'var(--modus-wc-color-base-100, #f1f1f6)'
                  : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--modus-wc-color-base-content, #1a1a1a)',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background =
                    'var(--modus-wc-color-base-100, #f1f1f6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${isCurrent ? color : 'var(--modus-wc-color-base-200, #c8c9d2)'}`,
                  background: isCurrent ? color : 'transparent',
                  marginTop: 2,
                  flexShrink: 0,
                  boxShadow: isCurrent ? 'inset 0 0 0 2px #fff' : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
              <span className="flex flex-col" style={{ gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {opt.title}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1.4,
                    color:
                      'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {opt.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Index() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: 'var(--modus-wc-color-base-page, #f5f6fa)' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <header>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-wide mb-4"
            style={{
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              textDecoration: 'none',
            }}
          >
            <span aria-hidden="true">←</span> Back to overview
          </Link>
          <h1
            className="text-3xl font-semibold mb-1"
            style={{ color: 'var(--modus-wc-color-base-content, #1a1a1a)' }}
          >
            Trimble AI Guidelines
          </h1>
          <p
            className="text-sm"
            style={{
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            22 reference UIs exploring AI design guidelines. Click a card to open the
            guideline in a new tab.
          </p>
        </header>

        {categories.map(({ id, title, color, tint, match }) => {
          const items = routes.filter((r) => match(r.path));
          if (items.length === 0) return null;
          return (
            <section key={id}>
              <h2
                className="text-base font-semibold mb-3 uppercase tracking-wide inline-flex items-center gap-2"
                style={{
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: color,
                  }}
                />
                {title}
              </h2>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {items.map(({ path, label }) => {
                  const slug = path.slice(1);
                  const dashIdx = label.indexOf(' — ');
                  const pre = dashIdx >= 0 ? label.slice(0, dashIdx) : label;
                  const name = dashIdx >= 0 ? label.slice(dashIdx + 3) : '';
                  return (
                    <Link
                      key={path}
                      to={path}
                      target="_blank"
                      rel="noreferrer"
                      className="thumb-card thumb-card--highlight block overflow-hidden rounded-md"
                      style={{
                        backgroundColor: tint,
                        color:
                          'var(--modus-wc-color-base-content, #1a1a1a)',
                        textDecoration: 'none',
                        ['--thumb-accent' as never]: color,
                      }}
                    >
                      <div
                        className="overflow-hidden"
                        style={{
                          aspectRatio: '16 / 10',
                          backgroundColor: tint,
                        }}
                      >
                        <img
                          src={`/thumbnails/${slug}.png`}
                          alt={`${pre} preview`}
                          loading="lazy"
                          className="thumb-img w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="px-2.5 py-2">
                        <div
                          className="text-[10px] uppercase tracking-wide font-semibold leading-none"
                          style={{ color }}
                        >
                          {pre}
                        </div>
                        {name && (
                          <div className="mt-1 text-xs font-semibold leading-snug line-clamp-2">
                            {name}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Creative3VariantProvider>
        <Creative7VariantProvider>
          <Expert1VariantProvider>
          <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/guidelines" element={<Index />} />
        {routes.map(({ path, label, Component, fullBleed }) => {
          const slug = path.slice(1);
          const cat = categoryOf(slug);
          const info = GUIDELINE_EXPLANATIONS[slug];
          const overlay =
            info && cat ? (
              <GuidelineOverlay
                slug={slug}
                label={label}
                info={info}
                color={CATEGORY_COLORS[cat]}
              />
            ) : null;

          return (
            <Route
              key={path}
              path={path}
              element={
                fullBleed ? (
                  <>
                    {overlay}
                    <Component />
                  </>
                ) : (
                  <Shell>
                    {overlay}
                    <Component />
                  </Shell>
                )
              }
            />
          );
        })}
          </Routes>
          </Expert1VariantProvider>
        </Creative7VariantProvider>
      </Creative3VariantProvider>
    </BrowserRouter>
  );
}
