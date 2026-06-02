import type { ComponentType, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
  { path: '/creative6', label: 'Creative 6 — Ground Insights in Context', Component: SiteScene, fullBleed: true },
  { path: '/creative7', label: 'Creative 7 — Reiterate the Plan', Component: Creative7 },
  { path: '/creative8', label: 'Creative 8 — Give Professionals Control', Component: Creative8, fullBleed: true },
  { path: '/creative9', label: 'Creative 9 — Offer Possibilities', Component: Creative9 },
  { path: '/expert1', label: 'Expert 1 — Lead the Conversation', Component: Expert1 },
  { path: '/expert2', label: 'Expert 2 — Communicate the Work', Component: Expert2 },
  { path: '/expert3', label: 'Expert 3 — Prioritize Clarity Over Complexity', Component: Expert3 },
  { path: '/expert4', label: 'Expert 4 — Explain Why', Component: Expert4 },
  { path: '/expert5', label: 'Expert 5 — Be Honest About Limitations', Component: Expert5 },
  { path: '/expert6', label: 'Expert 6 — Highlight Further Investigation', Component: Expert6 },
  { path: '/pro1', label: 'Pro 1 — Integrate with Professional Tools', Component: Pro1 },
  { path: '/pro2', label: 'Pro 2 — Perform Bite-Sized Tasks', Component: Pro2 },
  { path: '/pro3', label: 'Pro 3 — Be Trainable, Context and Domain Aware', Component: Pro3 },
  { path: '/pro4', label: 'Pro 4 — Support Intervention', Component: Pro4 },
  { path: '/pro5', label: 'Pro 5 — Provide Context and Citations', Component: Pro5 },
  { path: '/pro6', label: 'Pro 6 — Visualize Work Done for Acceptance', Component: Pro6 },
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
  match: (path: string) => boolean;
}[] = [
  { id: 'creative', title: 'Creative', color: '#FF2092', match: (p) => p.startsWith('/creative') },
  { id: 'expert', title: 'Expert', color: '#009AFE', match: (p) => p.startsWith('/expert') },
  { id: 'pro', title: 'Pro', color: '#4A00FF', match: (p) => p.startsWith('/pro') },
];

const IN_PROGRESS_SLUGS = new Set([
  'creative1',
  'creative2',
  'expert2',
  'expert6',
  'pro1',
  'pro2',
  'pro3',
  'pro4',
]);

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
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
          >
            22 reference UIs exploring AI design guidelines. Click a card to open the
            guideline in a new tab.
          </p>
        </header>

        {categories.map(({ id, title, color, match }) => {
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
                        backgroundColor:
                          'var(--modus-wc-color-base-100, #ffffff)',
                        color:
                          'var(--modus-wc-color-base-content, #1a1a1a)',
                        textDecoration: 'none',
                        ['--thumb-accent' as never]: color,
                      }}
                    >
                      <div
                        className="overflow-hidden flex items-center justify-center"
                        style={{
                          aspectRatio: '16 / 10',
                          backgroundColor:
                            'var(--modus-wc-color-base-200, #eef0f4)',
                        }}
                      >
                        {IN_PROGRESS_SLUGS.has(slug) ? (
                          <span
                            className="text-[11px] uppercase tracking-[0.25em] font-semibold"
                            style={{
                              color:
                                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                            }}
                          >
                            In progress
                          </span>
                        ) : (
                          <img
                            src={`/thumbnails/${slug}.png`}
                            alt={`${pre} preview`}
                            loading="lazy"
                            className="thumb-img w-full h-full object-cover object-top"
                          />
                        )}
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
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/guidelines" element={<Index />} />
        {routes.map(({ path, Component, fullBleed }) => (
          <Route
            key={path}
            path={path}
            element={
              fullBleed ? (
                <Component />
              ) : (
                <Shell>
                  <Component />
                </Shell>
              )
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
