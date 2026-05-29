import { useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';
import { TrimbleAiLogo } from './Creative7';

/* ─────────────────────────────────────────────────────────────────
 * TI_M2 — Mobile chat interface
 *   Literal port of Figma node 593:68076 (Trimble AI Experience
 *   UI Components → TI_M2). 375 × 812 mobile shell with:
 *     · Top bar — hamburger (left) + avatar (right)
 *     · Collapsible user-question bubble with expand chevron
 *     · Trimble AI logo + long-form AI response
 *     · Sticky bottom prompt bar with rainbow stroke
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;

const USER_PROMPT_LINES = [
  'What is AI?',
  'Artificial intelligence (AI) is technology that enables computers and machines to simulate human learning, comprehension, problem solving, decision making, creativity and autonomy.',
  'Applications and devices equipped with AI can see and identify objects. They can understand and respond to human language. They can learn from new information and experience. They can make detailed recommendations to users and experts. They can act independently, replacing the need for human intelligence',
];

const AI_RESPONSE_LINES = [
  'The provided text gives a comprehensive explanation of AI and its related concepts.',
  'What is AI?',
  'Artificial Intelligence (AI) is a technology that allows computers and machines to imitate human capabilities such as learning, understanding, problem-solving, decision-making, creativity, and autonomy.\u00B9 AI-equipped applications can identify objects, comprehend and respond to human language, learn from new information, and provide detailed recommendations.\u00B2 A classic example is a self-driving car, which can act independently.\u00B3',
  'Generative AI',
  "In 2024, the focus in AI is on generative AI (gen AI), which is a technology that can create original content such as text, images, and videos.\u2074 To understand generative AI, it's essential to understand the underlying technologies: machine learning and deep learning.",
  'Machine Learning (ML)',
  'Machine learning is a subset of AI.\u2075 It involves creating models by training an algorithm to make predictions or decisions based on data.\u2076 ML uses a range of techniques to enable computers to learn from and make inferences from data without being explicitly programmed for every task.\u2077 Examples of machine learning techniques include linear regression, decision trees, and clustering.',
  'A key component of ML is the neural network, which is modeled after the human brain.\u2078 It consists of interconnected layers of nodes (neurons) that work together to process and analyze complex data.\u2079 The simplest form of machine learning is supervised learning, where a human provides a labeled dataset to train a model to predict outcomes.\u00B9\u2070',
  'Deep Learning',
  'Deep learning is a subset of machine learning that uses deep neural networks.\u00B9\u00B9 These networks have multiple hidden layers (more than two, often hundreds), which allows them to simulate the complex decision-making of the human brain more closely.\u00B9\u00B2',
  'A key feature of deep learning is unsupervised learning, where the network can automatically extract features from large, unlabeled data sets and make its own predictions.\u00B9\u00B3 This process does not require human intervention, allowing for machine learning on a massive scale.\u00B9\u2074 Deep learning is well-suited for tasks like natural language processing (NLP) and computer vision, and it powers most of the AI applications we use today.\u00B9\u2075',
];

/* ── Mobile top bar — hamburger + circular avatar ───────────────── */
function TopBar() {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: '56px',
        padding: '12px 16px',
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
      }}
    >
      <button
        type="button"
        aria-label="Open menu"
        title="Menu"
        className="flex items-center justify-center transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
        style={{
          width: '32px',
          height: '32px',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <ModusWcIcon
          name="menu"
          size="sm"
          decorative
          style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}
        />
      </button>

      <button
        type="button"
        aria-label="Profile"
        title="Profile"
        className="flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: '32px',
          height: '32px',
          backgroundColor: 'var(--modus-wc-color-primary-light, #e8f4fd)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <ModusWcIcon
          name="person"
          size="sm"
          decorative
          style={{ color: 'var(--modus-wc-color-primary, #0063A7)' }}
        />
      </button>
    </div>
  );
}

/* ── Collapsible user-question bubble ───────────────────────────── *
 * Matches Figma corner radii: br/bl/tl rounded, tr sharp (chat tail
 * points up-right toward the avatar in the top-right corner).
 * Clamped to two lines when collapsed, full content when expanded. */
function UserBubble({ lines }: { lines: string[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex justify-end w-full">
      <div
        className="relative w-full"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          borderRadius: '16px 0 16px 16px',
          paddingLeft: '16px',
          paddingRight: '48px',
          paddingTop: '8px',
          paddingBottom: '8px',
        }}
      >
        <div
          style={{
            display: expanded ? 'block' : '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: expanded ? undefined : 2,
            overflow: expanded ? 'visible' : 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '24px',
                margin: 0,
                marginBottom: i === lines.length - 1 ? 0 : '24px',
                wordBreak: 'break-word',
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Expand / collapse chevron — top-right corner */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse message' : 'Expand message'}
          className="absolute flex items-center justify-center transition-colors hover:bg-[var(--modus-wc-color-base-200)]"
          style={{
            top: '8px',
            right: '4px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ModusWcIcon
            name={expanded ? 'expand_less' : 'expand_more'}
            size="sm"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}
          />
        </button>
      </div>
    </div>
  );
}

/* ── AI response — plain text, no visible bubble background ─────── */
function AiResponse({ lines }: { lines: string[] }) {
  return (
    <div
      className="flex flex-col w-full"
      style={{
        padding: '8px 0',
      }}
    >
      {lines.map((line, i) => (
        <p
          key={i}
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            lineHeight: '24px',
            margin: 0,
            marginBottom: i === lines.length - 1 ? 0 : '24px',
            wordBreak: 'break-word',
          }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

/* ── Bottom prompt bar — rainbow stroke + controls row ──────────── */
function PromptBar() {
  const [draft, setDraft] = useState('');
  return (
    <div
      className="rounded-[20px] w-full"
      style={{
        padding: '2px',
        background: TRIMBLE_RAINBOW,
      }}
    >
      <div
        className="relative flex flex-col w-full"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          borderRadius: '18px',
          minHeight: '100px',
          padding: '10px',
          gap: '4px',
        }}
      >
        {/* Text input */}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Let's get more done"
          className="w-full"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            fontFamily: 'inherit',
            lineHeight: '28px',
            padding: '6px 6px',
            minHeight: '40px',
          }}
        />

        {/* Controls row — model dropdown left, add + send right */}
        <div className="flex items-center justify-between w-full" style={{ padding: '0 0px' }}>
          <button
            type="button"
            className="flex items-center gap-2"
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
              boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
              lineHeight: '16px',
            }}
          >
            GPT 5
            <ModusWcIcon name="expand_more" size="xs" decorative />
          </button>

          <div className="flex items-center" style={{ gap: '8px' }}>
            <button
              type="button"
              aria-label="Add attachment"
              title="Add attachment"
              className="flex items-center justify-center transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                padding: 0,
              }}
            >
              <ModusWcIcon name="add" size="sm" decorative />
            </button>
            <button
              type="button"
              aria-label="Send prompt"
              title="Send"
              disabled={draft.trim() === ''}
              className="flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                backgroundColor: 'transparent',
                color:
                  draft.trim() === ''
                    ? 'var(--modus-wc-color-base-content, #171c1e)'
                    : 'var(--modus-wc-color-primary, #0063A7)',
                border: 'none',
                cursor: draft.trim() === '' ? 'default' : 'pointer',
                opacity: draft.trim() === '' ? 0.6 : 1,
                padding: 0,
                transition: 'color 120ms ease',
              }}
            >
              <ModusWcIcon name="send" size="sm" decorative />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TI_M2 — mobile chat shell ──────────────────────────────────── */
export default function Creative7Mobile() {
  return (
    <div
      className="rounded-[40px] overflow-hidden flex flex-col relative"
      style={{
        width: `${MOBILE_WIDTH}px`,
        height: `${MOBILE_HEIGHT}px`,
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow:
          '0 28px 60px rgba(0,0,0,0.16), 0 6px 18px rgba(0,0,0,0.08)',
      }}
    >
      {/* Top bar — fixed */}
      <TopBar />

      {/* Scrollable chat thread */}
      <div
        className="flex-1 flex flex-col overflow-y-auto min-h-0"
        style={{
          padding: '18px 16px 12px 16px',
          gap: '30px',
        }}
      >
        {/* User turn — collapsible question bubble */}
        <UserBubble lines={USER_PROMPT_LINES} />

        {/* AI turn — logo + long-form text response */}
        <div className="flex flex-col" style={{ gap: '5px' }}>
          <div className="shrink-0 flex items-start" style={{ paddingTop: '4px' }}>
            <TrimbleAiLogo size={32} />
          </div>
          <AiResponse lines={AI_RESPONSE_LINES} />
        </div>
      </div>

      {/* Bottom prompt bar */}
      <div
        className="shrink-0"
        style={{
          padding: '8px 16px 16px 16px',
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        }}
      >
        <PromptBar />
      </div>
    </div>
  );
}
