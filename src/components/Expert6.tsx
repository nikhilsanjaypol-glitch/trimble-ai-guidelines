import { useState } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const CONTEXT = {
  scope: 'Utility Model Alignment',
  task: 'Locate the cause of the 6 ft horizontal offset',
  reviewedAt: 'Today, 9:14 AM',
  modelsReviewed: 2,
};

const possibleCauses = [
  'Coordinate System Mismatch',
  'Reference Surface Misalignment',
  'Import / Conversion Errors',
];

const suggestedChecks = [
  { icon: 'globe', label: 'Compare Systems' },
  { icon: 'layers', label: 'Check Surface' },
  { icon: 'document_outline', label: 'Check Import' },
];

/* ── Expert 6 — Highlight Further Investigation ────────────────── */
/**
 * Hero / Branded header layout (ported from Expert 5 — Design 4).
 *
 * Guides users to possible resolutions when the AI is not confident
 * of an outcome by clearly indicating approaches to investigate further.
 */
export default function Expert6() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes expert6-rainbow-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes expert6-rainbow-glow {
          0%, 100% { box-shadow: 0 12px 28px rgba(15, 23, 42, 0.10), 0 0 18px rgba(0, 215, 192, 0.25), 0 0 32px rgba(74, 0, 255, 0.18); }
          50%      { box-shadow: 0 12px 28px rgba(15, 23, 42, 0.10), 0 0 24px rgba(255, 32, 146, 0.30), 0 0 38px rgba(0, 154, 254, 0.22); }
        }
      `}</style>
      <div
        className="rounded-2xl p-[2px] w-[444px] shrink-0"
        style={{
          background:
            'linear-gradient(90deg, #00D7C0 0%, #009AFE 20%, #4A00FF 40%, #FF2092 60%, #FF00D3 80%, #00D7C0 100%)',
          backgroundSize: '200% 100%',
          animation:
            'expert6-rainbow-shimmer 6s linear infinite, expert6-rainbow-glow 4s ease-in-out infinite',
        }}
      >
        <div
          className="rounded-[14px] flex flex-col overflow-hidden w-full"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
          }}
        >
          {/* Hero header */}
          <div
            className="flex flex-col gap-1 px-6 py-5"
            style={{
              background: 'linear-gradient(135deg, #0A1733 0%, #122B5F 60%, #1E3A8A 100%)',
              color: '#ffffff',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                opacity: 0.75,
              }}
            >
              AI Suggestion · Further Investigation
            </span>
            <span className="font-semibold" style={{ fontSize: '22px', lineHeight: 1.15 }}>
              Explore possible causes
            </span>
            <span style={{ fontSize: '13px', opacity: 0.85 }}>
              {CONTEXT.scope} · {CONTEXT.modelsReviewed} models reviewed
            </span>
            <div
              className="self-start flex items-center gap-1 px-2 py-1 rounded-md mt-2"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.14)', backdropFilter: 'blur(2px)' }}
            >
              <ModusWcIcon name="alert_outline" size="xs" decorative style={{ color: '#fff' }} />
              <span className="font-semibold" style={{ fontSize: '11px' }}>
                Low Confidence
              </span>
            </div>
          </div>

          {/* Intro */}
          <div className="flex flex-col gap-1 px-6 py-4">
            <span
              className="font-semibold"
              style={{ fontSize: '14px', color: 'var(--modus-wc-color-base-content, #101828)' }}
            >
              I&apos;m not fully confident about the primary cause
            </span>
            <span
              style={{
                fontSize: '12px',
                lineHeight: 1.5,
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              }}
            >
              Investigate any of the candidates below to narrow the issue and
              confirm a fix.
            </span>
          </div>

          {/* 2-col body */}
          <div className="grid grid-cols-2 gap-3 px-6 pb-4">
            <div
              className="flex flex-col gap-1 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
                border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              }}
            >
              <span
                className="font-semibold"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                Possible causes
              </span>
              {possibleCauses.map((cause) => (
                <span
                  key={cause}
                  style={{
                    fontSize: '12px',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                  }}
                >
                  · {cause}
                </span>
              ))}
            </div>

            <div
              className="flex flex-col gap-1 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
                border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              }}
            >
              <span
                className="font-semibold"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                Try these checks
              </span>
              {suggestedChecks.map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <ModusWcIcon
                    name={icon}
                    size="xs"
                    decorative
                    style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex gap-2 items-center px-6 py-3"
            style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
          >
            <div className="flex-1">
              <ModusWcButton size="sm" color="primary" style={{ width: '100%' }}>
                <span className="flex items-center justify-center gap-1">
                  <ModusWcIcon name="launch" size="xs" decorative />
                  View detailed analysis
                </span>
              </ModusWcButton>
            </div>
            <div className="flex-1">
              <ModusWcButton
                size="sm"
                color="tertiary"
                variant="outlined"
                style={{ width: '100%' }}
                onButtonClick={() => setDismissed(true)}
              >
                Dismiss
              </ModusWcButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
