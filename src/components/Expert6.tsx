import { useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

interface InvestigationItem {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
}

const investigations: InvestigationItem[] = [
  {
    icon: 'globe',
    title: 'Coordinate System Mismatch',
    description: 'Check if both the models are using different coordinate systems.',
    actionLabel: 'Compare Systems',
  },
  {
    icon: 'layers',
    title: 'Reference Surface Misalignment',
    description: 'Verify if both models are referencing the same base surface.',
    actionLabel: 'Check Surface',
  },
  {
    icon: 'document_outline',
    title: 'Import / Conversion Errors',
    description: 'Review if the utility model was transformed during import.',
    actionLabel: 'Check Import',
  },
];

/* ── Expert 6 — Highlight Further Investigation ────────────────── */
/**
 * Guides users to possible resolutions when the AI is not confident
 * of an outcome by clearly indicating approaches to investigate further.
 */
export default function Expert6() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="rounded-2xl p-[3px] w-[580px] shrink-0"
      style={{
        background: TRIMBLE_RAINBOW,
        boxShadow:
          '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)',
      }}
    >
      <div className="bg-white rounded-[14px] flex flex-col w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-2 px-6 pt-5 pb-4">
          <div className="flex gap-3 items-center justify-between w-full">
            <div className="flex gap-3 items-center min-w-0">
              <div className="bg-[#fff9ef] flex items-center justify-center rounded-[10px] shrink-0 size-12">
                <ModusWcIcon
                  name="alert_outline"
                  size="md"
                  decorative
                  style={{ color: '#b88217' }}
                />
              </div>
              <span
                className="font-semibold leading-9 truncate"
                style={{
                  fontSize: 'var(--modus-wc-font-size-2xl, 24px)',
                  color: 'var(--modus-wc-color-base-content, #101828)',
                }}
              >
                Explore possible causes
              </span>
            </div>

            {/* Low Confidence Badge */}
            <div
              className="flex gap-1 items-center px-2.5 py-1 rounded-md shrink-0"
              style={{
                border: '1px solid #f3c870',
                backgroundColor: '#fff9ef',
              }}
            >
              <ModusWcIcon
                name="add"
                size="xs"
                decorative
                style={{ color: '#b88217' }}
              />
              <span
                className="font-semibold whitespace-nowrap"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: '#b88217',
                }}
              >
                Low Confidence
              </span>
            </div>
          </div>

          <span
            className="leading-6"
            style={{
              fontSize: 'var(--modus-wc-font-size-base, 16px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
            }}
          >
            I&apos;m not fully confident about the primary cause, but you can
            investigate the following:
          </span>
        </div>

        {/* Investigation cards */}
        <div
          className="flex flex-col gap-3 px-6 py-4"
          style={{
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          }}
        >
          {investigations.map(({ icon, title, description, actionLabel }) => (
            <div
              key={title}
              className="flex gap-3 items-start p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
              }}
            >
              <div className="flex items-center justify-center size-8 shrink-0 mt-0.5">
                <ModusWcIcon
                  name={icon}
                  size="md"
                  decorative
                  style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-semibold leading-6"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-base, 16px)',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {title}
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 shrink-0 hover:underline transition-colors"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      color: 'var(--modus-wc-color-status-info, #004f83)',
                      fontWeight: 600,
                    }}
                  >
                    {actionLabel}
                    <ModusWcIcon name="chevron_right" size="xs" decorative />
                  </button>
                </div>
                <span
                  className="leading-5"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {description}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* View detailed analysis */}
        <div className="flex items-center px-6 py-3">
          <button
            type="button"
            className="flex items-center gap-1.5 hover:underline transition-colors"
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-status-info, #004f83)',
              fontWeight: 600,
            }}
          >
            View detailed analysis
            <ModusWcIcon name="launch" size="xs" decorative />
          </button>
        </div>

        {/* Footer disclaimer */}
        <div
          className="flex flex-wrap gap-3 items-center px-6 pb-3"
          style={{
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            paddingTop: '0.75rem',
          }}
        >
          <div className="flex gap-2 items-center">
            <ModusWcIcon
              name="alert_outline"
              size="xs"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
            />
            <span
              className="leading-5"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              Results may vary depending on project data and model accuracy.
            </span>
          </div>
          <span
            className="leading-5 cursor-pointer hover:underline whitespace-nowrap"
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: 'var(--modus-wc-color-status-info, #004f83)',
              fontWeight: 600,
            }}
          >
            Learn more..
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="ml-auto flex items-center justify-center size-6 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
            aria-label="Dismiss"
          >
            <ModusWcIcon
              name="close"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
