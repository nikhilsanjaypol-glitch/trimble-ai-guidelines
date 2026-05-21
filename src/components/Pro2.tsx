import { useState } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 2 — PERFORM BITE-SIZED TASKS
 *
 * Checkpoint card: the AI has just finished a small chunk and has
 * paused itself. Nothing happens next until the professional
 * reviews. The pause is the entire point of the component.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

const SUMMARY_STATS = [
  { label: 'Curves drafted', value: '4' },
  { label: 'Stations covered', value: '12+50 → 38+20' },
  { label: 'AASHTO checks', value: 'All pass' },
];

export default function Pro2() {
  const [hovered, setHovered] = useState<'review' | 'continue' | null>(null);

  return (
    <div
      className="rounded-2xl p-[2px] w-[380px] shrink-0"
      style={{
        background: TRIMBLE_RAINBOW,
        boxShadow: '0px 8px 20px -6px rgba(0,0,0,0.18)',
      }}
    >
      <div className="bg-white rounded-[14px] flex flex-col">
        {/* Header — pause indicator */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'rgba(0, 99, 163, 0.10)',
            }}
          >
            <ModusWcIcon
              name="pause"
              size="md"
              decorative
              style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span
              className="font-semibold leading-5"
              style={{
                fontSize: 'var(--modus-wc-font-size-md, 16px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
            >
              Paused for your review
            </span>
            <span
              className="leading-4"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              I won&apos;t continue until you take a look.
            </span>
          </div>
        </div>

        {/* Step pill row */}
        <div className="flex items-center gap-1.5 px-5 pb-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: '4px',
                backgroundColor:
                  i < 2
                    ? 'var(--modus-wc-color-status-success, #1e7e34)'
                    : i === 2
                      ? 'var(--modus-wc-color-primary, #0063a3)'
                      : 'var(--modus-wc-color-base-200, #e0e1e9)',
              }}
            />
          ))}
          <span
            className="ml-2 shrink-0"
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Step 2 of 4
          </span>
        </div>

        {/* What was just done */}
        <div
          className="mx-5 mb-3 rounded-lg flex flex-col gap-3 px-4 py-3"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-100, #f8f9fa)',
            border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          }}
        >
          <div className="flex items-center gap-2">
            <ModusWcIcon
              name="check_circle"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
            />
            <span
              className="font-semibold flex-1"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              Drafted corridor alignment
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {SUMMARY_STATS.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {label}
                </span>
                <span
                  className="font-medium"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coming next — sets up the bite-sized pattern */}
        <div className="flex items-center gap-2 px-5 pb-4">
          <ModusWcIcon
            name="chevron_double_right"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
          />
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Next:{' '}
            <span
              style={{
                fontWeight: 600,
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              draft vertical profile
            </span>
          </span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div
            className="flex-1"
            onMouseEnter={() => setHovered('review')}
            onMouseLeave={() => setHovered(null)}
          >
            <ModusWcButton
              size="md"
              color="tertiary"
              variant="outlined"
              style={{ width: '100%' }}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ModusWcIcon name="visibility_on" size="sm" decorative />
                Review
              </span>
            </ModusWcButton>
          </div>
          <div
            className="flex-1"
            onMouseEnter={() => setHovered('continue')}
            onMouseLeave={() => setHovered(null)}
          >
            <ModusWcButton size="md" color="primary" style={{ width: '100%' }}>
              <span className="flex items-center justify-center gap-1.5">
                Continue
                <ModusWcIcon name="arrow_right" size="sm" decorative />
              </span>
            </ModusWcButton>
          </div>
        </div>

        {/* Hover hint — reinforces oversight */}
        <div
          className="px-5 pb-3 transition-opacity duration-150"
          style={{ opacity: hovered ? 1 : 0, minHeight: '16px' }}
        >
          <span
            style={{
              fontSize: '10px',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              fontStyle: 'italic',
            }}
          >
            {hovered === 'review'
              ? 'Open the alignment in the model viewer.'
              : hovered === 'continue'
                ? 'Approves this step and starts the next bite.'
                : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
