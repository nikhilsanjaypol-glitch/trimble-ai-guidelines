import type { ComponentType, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Creative1 from './components/Creative1';
import Creative2 from './components/Creative2';
import Creative3 from './components/Creative3';
import Creative4 from './components/Creative4';
import Creative5 from './components/Creative5';
import Creative7 from './components/Creative7';
import Creative7Mobile from './components/Creative7Mobile';
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
  { path: '/creative7-mobile', label: 'Creative 7 — Mobile (TI_M2)', Component: Creative7Mobile },
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

const categories: { id: string; title: string; match: (path: string) => boolean }[] = [
  { id: 'creative', title: 'Creative', match: (p) => p.startsWith('/creative') },
  { id: 'expert', title: 'Expert', match: (p) => p.startsWith('/expert') },
  { id: 'pro', title: 'Pro', match: (p) => p.startsWith('/pro') },
];

function Index() {
  return (
    <Shell>
      <div className="space-y-8">
        {categories.map(({ id, title, match }) => {
          const items = routes.filter((r) => match(r.path));
          if (items.length === 0) return null;
          return (
            <section key={id}>
              <h2
                className="text-xl font-semibold mb-3"
                style={{ color: 'var(--modus-wc-color-base-content, #1a1a1a)' }}
              >
                {title}
              </h2>
              <ul className="space-y-2 text-lg">
                {items.map(({ path, label }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                      style={{ color: 'var(--modus-wc-color-base-content, #1a1a1a)' }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
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
