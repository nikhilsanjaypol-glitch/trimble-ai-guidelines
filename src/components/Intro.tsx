import { Link } from 'react-router-dom';

const RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

function RainbowText({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: RAINBOW,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  );
}

function Section({
  children,
  dark = false,
  fullVh = true,
}: {
  children: React.ReactNode;
  dark?: boolean;
  fullVh?: boolean;
}) {
  return (
    <section
      className={fullVh ? 'min-h-screen' : ''}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        backgroundColor: dark
          ? '#0e1116'
          : 'var(--modus-wc-color-base-page, #f5f6fa)',
        color: dark ? '#f5f6fa' : 'var(--modus-wc-color-base-content, #1a1a1a)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1120 }}>{children}</div>
    </section>
  );
}

/* ── Section 1 — Hero ─────────────────────────────────────────── */
function Hero() {
  return (
    <Section dark>
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-6 text-xs uppercase tracking-[0.3em]"
          style={{ color: '#7a8290' }}
        >
          Trimble · Experience of AI
        </div>
        <h1
          className="font-semibold leading-tight"
          style={{ fontSize: 'clamp(40px, 6vw, 84px)', maxWidth: 900 }}
        >
          The Experience of <RainbowText>AI</RainbowText>
        </h1>
        <p
          className="mt-5"
          style={{ fontSize: 'clamp(18px, 1.6vw, 22px)', maxWidth: 720, color: '#cfd4dc' }}
        >
          Trimble's users demand AI they can trust. Anything short of this results
          in risk, uncertainty, or requires careful oversight.
        </p>

        <a
          href="#why"
          className="mt-12 inline-flex items-center gap-2 text-sm"
          style={{
            padding: '12px 22px',
            borderRadius: 999,
            color: '#0e1116',
            backgroundColor: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Explore the story
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </Section>
  );
}

/* ── Section 2 — Why ──────────────────────────────────────────── */
function Why() {
  return (
    <Section>
      <div id="why" />
      <div
        className="text-xs uppercase tracking-[0.25em] mb-3"
        style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
      >
        AI experience guidelines
      </div>
      <h2 className="font-semibold leading-tight" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
        Trust in AI is highly subjective.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
        <div>
          <div
            className="text-sm uppercase tracking-wide font-semibold mb-2"
            style={{ color: '#FF2092' }}
          >
            The challenge
          </div>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>
            A great AI outcome for a structural engineer wishing to specify key
            building elements is vastly different than a project manager getting
            ideas on writing an email to their client.
          </p>
        </div>
        <div>
          <div
            className="text-sm uppercase tracking-wide font-semibold mb-2"
            style={{ color: '#009AFE' }}
          >
            The need
          </div>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>
            Based on data from 100's of workshops, survey responses & interviews,
            we've created a set of easily applicable guidelines which help teams
            navigate what great AI experiences look like.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ── Section 3 — Pull quote ───────────────────────────────────── */
function PullQuote() {
  return (
    <Section dark>
      <blockquote className="text-center">
        <div
          className="mx-auto"
          style={{
            fontSize: 'clamp(22px, 2.4vw, 34px)',
            lineHeight: 1.5,
            maxWidth: 880,
            fontStyle: 'italic',
            color: '#e6e9ee',
          }}
        >
          "My hope is that AI becomes a{' '}
          <strong style={{ color: '#fff', fontStyle: 'normal' }}>
            trusted partner
          </strong>{' '}
          that handles the{' '}
          <strong style={{ color: '#fff', fontStyle: 'normal' }}>
            time-consuming groundwork
          </strong>{' '}
          — processing data, analyzing trends, and generating options — so our{' '}
          <strong style={{ color: '#fff', fontStyle: 'normal' }}>
            experts can focus on high-value, creative, and strategic tasks.
          </strong>
          "
        </div>
        <footer
          className="mt-8 text-sm uppercase tracking-[0.3em]"
          style={{ color: '#7a8290' }}
        >
          Chief Product Officer
        </footer>
      </blockquote>
    </Section>
  );
}

/* ── Section 4 — Three approaches ─────────────────────────────── */
function ThreeApproaches() {
  const cards = [
    {
      tag: 'Professional',
      title: 'AI as a reliable workhorse',
      body: 'Customers engage AI to support them on tasks where they are the professional and need to remain in control. The AI should be reliable, verifiable, and stay out of the way.',
      color: '#FF2092',
      principles: [
        'AI needs to be trustworthy',
        'Professionals expect accuracy',
        'AI can rely on human expertise',
      ],
    },
    {
      tag: 'Creative',
      title: 'AI as a collaborative partner',
      body: "Users perform creative tasks with multiple options, choices, or directions — looking to AI as a partner who inspires, creates, and guides while they retain creative ownership.",
      color: '#4A00FF',
      principles: [
        'Professionals seek inspiration',
        'Professionals retain creative ownership',
        'Creativity is an iterative process',
      ],
    },
    {
      tag: 'Expert',
      title: 'AI as a guiding authority',
      body: 'Customers turn to AI as a trusted expert when problems fall outside their own area of expertise — looking for confidence, accuracy, and reliability in the AI\'s recommendations.',
      color: '#009AFE',
      principles: [
        'Customers need to be guided by AI',
        'Communication establishes trust',
        'Clear accountability avoids errors',
      ],
    },
  ];

  return (
    <Section>
      <div
        className="text-xs uppercase tracking-[0.25em] mb-3"
        style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
      >
        What good looks like
      </div>
      <h2 className="font-semibold leading-tight" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
        Three relationships between people and AI.
      </h2>
      <p
        className="mt-4"
        style={{
          fontSize: 18,
          lineHeight: 1.6,
          maxWidth: 760,
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        It's all about mindset and expectations. The right design depends on what
        the user is bringing to the task — and what they need AI to be.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
        {cards.map((c) => (
          <article
            key={c.tag}
            className="rounded-xl p-6 flex flex-col"
            style={{
              backgroundColor: 'var(--modus-wc-color-base-100, #fff)',
              boxShadow:
                'inset 0 0 0 1px var(--modus-wc-color-base-200, #eef0f4), 0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="text-xs uppercase tracking-[0.25em] font-semibold mb-3"
              style={{ color: c.color }}
            >
              {c.tag}
            </div>
            <h3 className="font-semibold text-2xl leading-snug">{c.title}</h3>
            <p
              className="mt-3 flex-1"
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              {c.body}
            </p>
            <ul className="mt-5 space-y-2">
              {c.principles.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2 text-sm"
                  style={{ lineHeight: 1.5 }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: c.color,
                      marginTop: 7,
                      flexShrink: 0,
                    }}
                  />
                  {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ── Section 5 — Customer voice ───────────────────────────────── */
function CustomerVoice() {
  const items = [
    {
      n: '01',
      title: 'Customers want AI to do the boring tasks — not take responsibility.',
      sub: 'To leverage demand, target AI at small, repetitive tasks.',
    },
    {
      n: '02',
      title: 'They\'re excited to spend more time on strategic & challenging work.',
      sub: 'To motivate, market the value of reclaiming time.',
    },
    {
      n: '03',
      title: 'They lose confidence when AI makes errors without visibility.',
      sub: 'To build trust, optimize AI for transparency.',
    },
    {
      n: '04',
      title: 'As AI gets good, it risks introducing an accountability void.',
      sub: 'To support professionals, be clear about the relationship.',
    },
  ];

  return (
    <Section dark>
      <div
        className="text-xs uppercase tracking-[0.25em] mb-3"
        style={{ color: '#7a8290' }}
      >
        Customer voice
      </div>
      <h2
        className="font-semibold leading-tight"
        style={{ fontSize: 'clamp(32px, 4vw, 52px)', maxWidth: 900 }}
      >
        What is on our customers' minds?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        {items.map((it) => (
          <div key={it.n}>
            <div
              className="font-semibold"
              style={{ fontSize: 48, lineHeight: 1, color: '#cfd4dc' }}
            >
              {it.n}
            </div>
            <div
              className="mt-4 font-semibold"
              style={{ fontSize: 17, lineHeight: 1.4, color: '#fff' }}
            >
              {it.title}
            </div>
            <div
              className="mt-3 text-sm"
              style={{ color: '#9aa3af', lineHeight: 1.5 }}
            >
              {it.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 pt-10"
        style={{ borderTop: '1px solid #1f242c' }}
      >
        <div>
          <div
            className="font-semibold"
            style={{
              fontSize: 'clamp(48px, 6vw, 80px)',
              lineHeight: 1,
              color: '#00D7C0',
            }}
          >
            25%
          </div>
          <p className="mt-4" style={{ color: '#cfd4dc', maxWidth: 420 }}>
            of customers are concerned over the{' '}
            <strong style={{ color: '#fff' }}>poor accuracy</strong> of outputs,
            making them unreliable and untrustworthy for professional use in
            high-precision fields.
          </p>
        </div>
        <div>
          <div
            className="font-semibold"
            style={{
              fontSize: 'clamp(48px, 6vw, 80px)',
              lineHeight: 1,
              color: '#FF2092',
            }}
          >
            40%
          </div>
          <p className="mt-4" style={{ color: '#cfd4dc', maxWidth: 420 }}>
            of customers express concern over the{' '}
            <strong style={{ color: '#fff' }}>"human cost"</strong> of AI,
            fearing that over-reliance will diminish the expertise of the next
            generation or replace them entirely as professionals.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ── Section 6 — Customer wishlist teaser ─────────────────────── */
function Wishlist() {
  const cards = [
    {
      label: 'Customer goal',
      title: 'Save time & enhance their purpose',
      body: 'Customers are looking towards AI features that save them time so they can shift their focus to strategic, challenging, and valuable work.',
    },
    {
      label: 'Key desire',
      title: 'Automate repetitive & mundane tasks',
      body: 'Professionals perform a myriad of tasks daily which add little value or require minimal thinking — they\'d love these to be automated.',
    },
    {
      label: 'Primary objective',
      title: 'AI that enhances them as professionals',
      body: 'Customers seek AI features that enhance their professional capabilities and support their decision-making — rather than making the decisions for them.',
    },
  ];

  return (
    <Section>
      <div
        className="text-xs uppercase tracking-[0.25em] mb-3"
        style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
      >
        Customer wishlist
      </div>
      <h2 className="font-semibold leading-tight" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
        45 of the most common AI requests, across 11 categories.
      </h2>
      <p
        className="mt-4"
        style={{
          fontSize: 18,
          lineHeight: 1.6,
          maxWidth: 720,
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        Across our sectors, industries & products, we see huge similarity in the
        types of feature requests our customers are making.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl p-6"
            style={{
              backgroundColor: '#0e1116',
              color: '#fff',
            }}
          >
            <div
              className="text-xs uppercase tracking-[0.25em] font-semibold mb-3"
              style={{ color: '#9aa3af' }}
            >
              {c.label}
            </div>
            <div className="font-semibold text-xl leading-snug">{c.title}</div>
            <p className="mt-3 text-sm" style={{ color: '#cfd4dc', lineHeight: 1.5 }}>
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ── Section 7 — CTA into the 22 guidelines ───────────────────── */
function CTA() {
  return (
    <Section dark fullVh={false}>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          position: 'relative',
          padding: '64px 48px',
          background: 'linear-gradient(135deg, #1a1f28 0%, #0e1116 100%)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: RAINBOW,
            opacity: 0.18,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div
            className="text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: '#cfd4dc' }}
          >
            22 reference UIs
          </div>
          <h2
            className="font-semibold leading-tight"
            style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', maxWidth: 760, color: '#fff' }}
          >
            See the guidelines in action.
          </h2>
          <p
            className="mt-4"
            style={{ color: '#cfd4dc', maxWidth: 640, fontSize: 17, lineHeight: 1.5 }}
          >
            9 Creative, 6 Expert, 7 Professional — interactive prototypes that
            translate every guideline into a real UI pattern.
          </p>
          <Link
            to="/guidelines"
            className="inline-flex items-center gap-2 mt-8"
            style={{
              padding: '14px 26px',
              borderRadius: 999,
              backgroundColor: '#fff',
              color: '#0e1116',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Explore the 22 guidelines
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </Section>
  );
}

export default function Intro() {
  return (
    <div style={{ scrollBehavior: 'smooth' }}>
      <Hero />
      <Why />
      <PullQuote />
      <ThreeApproaches />
      <CustomerVoice />
      <Wishlist />
      <CTA />
    </div>
  );
}
