import { useMemo, useState } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

type CheckStatus = 'idle' | 'running' | 'issues_found' | 'no_issues' | 'resolved';

interface InvestigationItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  likelihood: number;
  evidence: string[];
  why: string;
  recommended: string[];
  affectedArtifacts: { name: string; type: string }[];
  /** Whether this item is shown by default or behind "Show more causes" */
  isPrimary: boolean;
}

const investigations: InvestigationItem[] = [
  {
    id: 'coordinate-system',
    icon: 'globe',
    title: 'Coordinate System Mismatch',
    description: 'Check if both the models are using different coordinate systems.',
    actionLabel: 'Compare Systems',
    likelihood: 62,
    why:
      'The site model uses UTM Zone 10N (EPSG:32610) while the utility model references State Plane California III. The 6 ft horizontal offset matches the typical drift between these systems at this latitude.',
    evidence: [
      'Site model SRS: EPSG:32610 (UTM Zone 10N)',
      'Utility model SRS: EPSG:2227 (NAD83 / California zone 3)',
      'Detected lateral offset: 1.83 m ≈ 6 ft along the easting axis',
    ],
    recommended: [
      'Re-project the utility model into the site coordinate system',
      'Confirm with the surveyor which SRS is authoritative',
    ],
    affectedArtifacts: [
      { name: 'utility-network-v3.dwg', type: 'CAD' },
      { name: 'site-grade-final.ttm', type: 'Surface' },
    ],
    isPrimary: true,
  },
  {
    id: 'reference-surface',
    icon: 'layers',
    title: 'Reference Surface Misalignment',
    description: 'Verify if both models are referencing the same base surface.',
    actionLabel: 'Check Surface',
    likelihood: 41,
    why:
      'Two design surfaces with the same name exist in the project ("Existing Ground" v2 and v4). The utility model snaps to v2 while the latest grading uses v4, producing a 0.4 m vertical drift in the affected area.',
    evidence: [
      'Active surface in grading: Existing Ground (v4)',
      'Surface bound to utility model: Existing Ground (v2)',
      'Vertical delta sampled at 24 stations: avg 0.38 m, max 0.61 m',
    ],
    recommended: [
      'Re-link the utility model to the v4 surface',
      'Archive v2 to prevent future accidental bindings',
    ],
    affectedArtifacts: [
      { name: 'existing-ground-v2.ttm', type: 'Surface' },
      { name: 'existing-ground-v4.ttm', type: 'Surface' },
    ],
    isPrimary: true,
  },
  {
    id: 'import-conversion',
    icon: 'document_outline',
    title: 'Import / Conversion Errors',
    description: 'Review if the utility model was transformed during import.',
    actionLabel: 'Check Import',
    likelihood: 28,
    why:
      'The utility model was imported via the legacy LandXML pipeline 11 days ago. That pipeline is known to apply a unit-of-measure inference step that can silently scale models authored in survey feet.',
    evidence: [
      'Import pipeline: LandXML (legacy)',
      'Import warning logged: "Units inferred as US survey feet"',
      'Scale factor applied during import: 1.000002',
    ],
    recommended: [
      'Re-import using the LandXML 2.0 pipeline with explicit units',
      'Audit any other models imported via the legacy pipeline in the last 30 days',
    ],
    affectedArtifacts: [
      { name: 'import-job-7621.log', type: 'Log' },
    ],
    isPrimary: true,
  },
  {
    id: 'stale-cache',
    icon: 'history',
    title: 'Stale Model Cache',
    description: 'The local viewer may be rendering a cached version of the model.',
    actionLabel: 'Refresh Cache',
    likelihood: 14,
    why:
      'Your local viewer cache is 4 days old. A new utility model was published 2 days ago and may not have propagated to this session.',
    evidence: [
      'Local cache age: 4 days',
      'Server model published: 2 days ago',
      'Cache invalidation: not triggered for this project',
    ],
    recommended: [
      'Clear the local model cache and reload',
      'Subscribe to project model-update notifications',
    ],
    affectedArtifacts: [
      { name: 'project-cache.idx', type: 'Cache' },
    ],
    isPrimary: false,
  },
  {
    id: 'tolerance-config',
    icon: 'settings_outline',
    title: 'Snap Tolerance Configuration',
    description: 'The clash detection tolerance may be too tight for the dataset.',
    actionLabel: 'Adjust Tolerance',
    likelihood: 9,
    why:
      'Clash tolerance is set to 0.05 m, but the source DWG was authored with an internal precision of 0.10 m. Sub-tolerance jitter may be reported as real conflicts.',
    evidence: [
      'Current clash tolerance: 0.05 m',
      'Source CAD precision: 0.10 m',
      'Conflicts within tolerance window: 47 of 112',
    ],
    recommended: [
      'Increase clash tolerance to 0.10 m to match source precision',
      'Re-run the clash report with the relaxed tolerance',
    ],
    affectedArtifacts: [
      { name: 'clash-config.json', type: 'Config' },
    ],
    isPrimary: false,
  },
];

const STATUS_LABEL: Record<CheckStatus, string> = {
  idle: 'Not investigated',
  running: 'Running check…',
  issues_found: 'Issues found',
  no_issues: 'No issues',
  resolved: 'Resolved',
};

interface StatusStyles {
  bg: string;
  fg: string;
  border: string;
  icon: string | null;
}

const STATUS_STYLES: Record<CheckStatus, StatusStyles> = {
  idle: {
    bg: 'var(--modus-wc-color-base-100, #f1f1f6)',
    fg: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
    border: 'var(--modus-wc-color-base-200, #e0e1e9)',
    icon: null,
  },
  running: {
    bg: '#eef6fd',
    fg: '#0063a3',
    border: '#9cc8eb',
    icon: 'sparkle',
  },
  issues_found: {
    bg: '#fff4e5',
    fg: '#b54708',
    border: '#fcd9a4',
    icon: 'alert_outline',
  },
  no_issues: {
    bg: '#e8f4eb',
    fg: '#1e7e34',
    border: '#b9dfc1',
    icon: 'check_circle',
  },
  resolved: {
    bg: '#e8f4eb',
    fg: '#1e7e34',
    border: '#b9dfc1',
    icon: 'check_circle',
  },
};

interface ItemState {
  expanded: boolean;
  status: CheckStatus;
  issueCount?: number;
}

interface ActivityEntry {
  id: number;
  time: string;
  text: string;
}

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Detailed Analysis Modal ───────────────────────────────────── */
function DetailedAnalysisModal({
  onClose,
  items,
  itemStates,
}: {
  onClose: () => void;
  items: InvestigationItem[];
  itemStates: Record<string, ItemState>;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[560px] max-h-[85vh] shadow-xl flex flex-col overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div className="flex flex-col gap-0.5">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-lg, 18px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
            >
              Detailed Analysis
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              How the AI arrived at these candidates
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-6 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
            aria-label="Close"
          >
            <ModusWcIcon
              name="close"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
            />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto">
          <div
            className="flex flex-col gap-2 p-4 rounded-lg"
            style={{ backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)' }}
          >
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
            >
              Inputs reviewed
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                ['Models compared', '2'],
                ['Surface samples', '24 stations'],
                ['Conflicts detected', '112'],
                ['Source pipelines', '3'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    }}
                  >
                    {k}
                  </span>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
            >
              Confidence by candidate
            </span>
            <div className="flex flex-col gap-2.5">
              {items.map((it) => {
                const status = itemStates[it.id]?.status ?? 'idle';
                return (
                  <div key={it.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        style={{
                          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                          color: 'var(--modus-wc-color-base-content, #171c1e)',
                        }}
                      >
                        {it.title}
                      </span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{
                          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                          color: 'var(--modus-wc-color-base-content, #171c1e)',
                        }}
                      >
                        {it.likelihood}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${it.likelihood}%`,
                          backgroundColor:
                            status === 'resolved' || status === 'no_issues'
                              ? 'var(--modus-wc-color-status-success, #1e7e34)'
                              : status === 'issues_found'
                                ? '#b54708'
                                : 'var(--modus-wc-color-primary, #0063a3)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="flex gap-2 items-start p-3 rounded-lg"
            style={{
              backgroundColor: '#eef6fd',
              border: '1px solid #9cc8eb',
            }}
          >
            <ModusWcIcon
              name="sparkle"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
            />
            <span
              className="leading-5"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              Confidence below 50% means the AI couldn&apos;t isolate a single root
              cause. Running checks on each candidate refines these scores in
              real time.
            </span>
          </div>
        </div>

        <div
          className="flex gap-3 items-center justify-end px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <ModusWcButton size="md" color="primary" onButtonClick={onClose}>
            Done
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ── Investigation Card (one row) ──────────────────────────────── */
function InvestigationCard({
  item,
  state,
  onToggle,
  onRunCheck,
  onMarkResolved,
  onDismiss,
}: {
  item: InvestigationItem;
  state: ItemState;
  onToggle: () => void;
  onRunCheck: () => void;
  onMarkResolved: () => void;
  onDismiss: () => void;
}) {
  const styles = STATUS_STYLES[state.status];

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden transition-colors"
      style={{
        backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
        border:
          state.status === 'idle'
            ? '1px solid transparent'
            : `1px solid ${styles.border}`,
      }}
    >
      {/* Row header (collapsed view) */}
      <button
        type="button"
        onClick={onToggle}
        className="flex gap-3 items-start p-3 text-left hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
      >
        <div className="flex items-center justify-center size-8 shrink-0 mt-0.5">
          <ModusWcIcon
            name={item.icon}
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
              {item.title}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {/* Status pill */}
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: styles.fg,
                  backgroundColor: styles.bg,
                  border: `1px solid ${styles.border}`,
                  fontWeight: 600,
                }}
              >
                {styles.icon && (
                  <ModusWcIcon
                    name={styles.icon}
                    size="xs"
                    decorative
                    style={{ color: styles.fg }}
                  />
                )}
                {STATUS_LABEL[state.status]}
                {state.status === 'issues_found' && state.issueCount != null && (
                  <> · {state.issueCount}</>
                )}
              </span>
              <span
                className="flex items-center justify-center size-6 rounded transition-transform"
                style={{
                  transform: state.expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ModusWcIcon
                  name="expand_more"
                  size="sm"
                  decorative
                  style={{
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)',
                  }}
                />
              </span>
            </div>
          </div>
          <span
            className="leading-5"
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            {item.description}
          </span>

          {/* Likelihood bar */}
          <div className="flex items-center gap-2 mt-1">
            <div
              className="h-1 flex-1 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.likelihood}%`,
                  backgroundColor:
                    state.status === 'resolved' || state.status === 'no_issues'
                      ? 'var(--modus-wc-color-status-success, #1e7e34)'
                      : state.status === 'issues_found'
                        ? '#b54708'
                        : 'var(--modus-wc-color-primary, #0063a3)',
                }}
              />
            </div>
            <span
              className="tabular-nums shrink-0"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                fontWeight: 600,
              }}
            >
              {item.likelihood}% likely
            </span>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {state.expanded && (
        <div
          className="flex flex-col gap-4 px-3 pb-3"
          style={{
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            paddingTop: '0.75rem',
          }}
        >
          {/* Why */}
          <div className="flex flex-col gap-1">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Why this might be the cause
            </span>
            <span
              className="leading-5"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              {item.why}
            </span>
          </div>

          {/* Evidence */}
          <div className="flex flex-col gap-1.5">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Evidence
            </span>
            <ul className="flex flex-col gap-1">
              {item.evidence.map((e) => (
                <li key={e} className="flex gap-2 items-start">
                  <span
                    className="rounded-full size-1.5 mt-2 shrink-0"
                    style={{
                      backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    }}
                  />
                  <span
                    className="leading-5"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {e}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Affected artifacts */}
          <div className="flex flex-col gap-1.5">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Affected items
            </span>
            <div className="flex flex-wrap gap-1.5">
              {item.affectedArtifacts.map((a) => (
                <span
                  key={a.name}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
                    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                  }}
                >
                  <ModusWcIcon
                    name="document_outline"
                    size="xs"
                    decorative
                    style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                  />
                  <span className="font-medium">{a.name}</span>
                  <span
                    style={{
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    }}
                  >
                    · {a.type}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Recommended */}
          <div className="flex flex-col gap-1.5">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Recommended next steps
            </span>
            <ul className="flex flex-col gap-1">
              {item.recommended.map((r) => (
                <li key={r} className="flex gap-2 items-start">
                  <ModusWcIcon
                    name="arrow_right"
                    size="xs"
                    decorative
                    style={{
                      color: 'var(--modus-wc-color-primary, #0063a3)',
                    }}
                  />
                  <span
                    className="leading-5"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {r}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 items-center pt-1">
            <ModusWcButton
              size="sm"
              color="primary"
              disabled={state.status === 'running' || state.status === 'resolved' || undefined}
              onButtonClick={onRunCheck}
            >
              <span className="flex items-center gap-1.5">
                <ModusWcIcon
                  name={state.status === 'running' ? 'sparkle' : 'sparkle'}
                  size="xs"
                  decorative
                />
                {state.status === 'running'
                  ? 'Running…'
                  : state.status === 'issues_found' || state.status === 'no_issues'
                    ? 'Re-run check'
                    : item.actionLabel}
              </span>
            </ModusWcButton>
            <ModusWcButton
              size="sm"
              color="tertiary"
              variant="outlined"
              disabled={state.status === 'resolved' || undefined}
              onButtonClick={onMarkResolved}
            >
              <span className="flex items-center gap-1.5">
                <ModusWcIcon name="check" size="xs" decorative />
                {state.status === 'resolved' ? 'Resolved' : 'Mark as resolved'}
              </span>
            </ModusWcButton>
            <button
              type="button"
              onClick={onDismiss}
              className="ml-auto px-2 py-1 rounded transition-colors hover:bg-[var(--modus-wc-color-base-200)]"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                fontWeight: 600,
              }}
            >
              Not the cause
            </button>
          </div>

          {/* Live result banner */}
          {state.status === 'issues_found' && (
            <div
              className="flex gap-2 items-start p-2.5 rounded-md"
              style={{
                backgroundColor: '#fff4e5',
                border: '1px solid #fcd9a4',
              }}
            >
              <ModusWcIcon
                name="alert_outline"
                size="sm"
                decorative
                style={{ color: '#b54708' }}
              />
              <span
                className="leading-5"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: '#7a3a09',
                }}
              >
                Check completed — {state.issueCount} potential conflict
                {state.issueCount === 1 ? '' : 's'} found. Review the affected
                items above and apply a recommended next step.
              </span>
            </div>
          )}
          {state.status === 'no_issues' && (
            <div
              className="flex gap-2 items-start p-2.5 rounded-md"
              style={{
                backgroundColor: '#e8f4eb',
                border: '1px solid #b9dfc1',
              }}
            >
              <ModusWcIcon
                name="check_circle"
                size="sm"
                decorative
                style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
              />
              <span
                className="leading-5"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: '#155724',
                }}
              >
                Check completed — no issues detected. This is unlikely to be the
                cause; consider another candidate.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Expert 6 — Highlight Further Investigation ────────────────── */
/**
 * Guides users to possible resolutions when the AI is not confident
 * of an outcome by clearly indicating approaches to investigate further.
 */
export default function Expert6() {
  const [dismissed, setDismissed] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([
    {
      id: 0,
      time: nowLabel(),
      text: 'Analysis run — 3 candidate causes identified',
    },
  ]);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      investigations.map((i) => [
        i.id,
        { expanded: false, status: 'idle' as CheckStatus },
      ]),
    ),
  );
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  const visibleItems = useMemo(
    () =>
      investigations.filter(
        (i) => (showMore || i.isPrimary) && !hiddenItems.has(i.id),
      ),
    [showMore, hiddenItems],
  );
  const moreCount = useMemo(
    () => investigations.filter((i) => !i.isPrimary).length,
    [],
  );

  const investigated = useMemo(
    () =>
      Object.values(itemStates).filter(
        (s) =>
          s.status === 'issues_found' ||
          s.status === 'no_issues' ||
          s.status === 'resolved',
      ).length,
    [itemStates],
  );
  const totalVisible = visibleItems.length;
  const progressPct =
    totalVisible === 0 ? 0 : Math.round((investigated / totalVisible) * 100);

  function logActivity(text: string) {
    setActivity((prev) => [
      ...prev,
      { id: prev.length, time: nowLabel(), text },
    ]);
  }

  function toggleItem(id: string) {
    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: !prev[id].expanded },
    }));
  }

  function runCheck(id: string) {
    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'running' },
    }));
    const item = investigations.find((i) => i.id === id);
    logActivity(`Running diagnostic on "${item?.title}"`);

    setTimeout(() => {
      const found = Math.random() > 0.35;
      const count = found ? Math.max(1, Math.round(item!.likelihood / 8)) : 0;
      setItemStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: found ? 'issues_found' : 'no_issues',
          issueCount: found ? count : 0,
        },
      }));
      logActivity(
        found
          ? `Found ${count} conflict${count === 1 ? '' : 's'} in "${item?.title}"`
          : `No issues found for "${item?.title}"`,
      );
    }, 1400);
  }

  function markResolved(id: string) {
    const item = investigations.find((i) => i.id === id);
    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'resolved' },
    }));
    logActivity(`Marked "${item?.title}" as resolved`);
  }

  function dismissItem(id: string) {
    const item = investigations.find((i) => i.id === id);
    setHiddenItems((prev) => new Set(prev).add(id));
    logActivity(`Ruled out "${item?.title}"`);
  }

  function submitFeedback(value: 'helpful' | 'not_helpful') {
    setFeedback(value);
    setFeedbackSent(true);
    logActivity(
      value === 'helpful'
        ? 'Marked these suggestions as helpful'
        : 'Marked these suggestions as not helpful',
    );
  }

  if (dismissed) return null;

  return (
    <>
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
          <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
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
                title="Confidence in the primary cause is below 50%."
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
                  Low Confidence · 28%
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

            {/* Context summary chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: 'layers', label: '2 models compared' },
                { icon: 'alert_outline', label: '112 conflicts detected' },
                { icon: 'document_outline', label: '3 candidate causes' },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
                    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                  }}
                >
                  <ModusWcIcon
                    name={icon}
                    size="xs"
                    decorative
                    style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                  />
                  {label}
                </span>
              ))}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div
                className="h-1.5 flex-1 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: 'var(--modus-wc-color-primary, #0063a3)',
                  }}
                />
              </div>
              <span
                className="tabular-nums whitespace-nowrap"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  fontWeight: 600,
                }}
              >
                {investigated} of {totalVisible} investigated
              </span>
            </div>
          </div>

          {/* Investigation cards */}
          <div
            className="flex flex-col gap-3 px-6 py-4"
            style={{
              borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            }}
          >
            {visibleItems.map((item) => (
              <InvestigationCard
                key={item.id}
                item={item}
                state={itemStates[item.id]}
                onToggle={() => toggleItem(item.id)}
                onRunCheck={() => runCheck(item.id)}
                onMarkResolved={() => markResolved(item.id)}
                onDismiss={() => dismissItem(item.id)}
              />
            ))}

            {/* Show more / fewer toggle */}
            {moreCount > 0 && (
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-[var(--modus-wc-color-base-100)] transition-colors"
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-status-info, #004f83)',
                  fontWeight: 600,
                }}
              >
                <ModusWcIcon
                  name="expand_more"
                  size="xs"
                  decorative
                  style={{
                    transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms ease',
                  }}
                />
                {showMore
                  ? 'Show fewer causes'
                  : `Show ${moreCount} more possible cause${moreCount === 1 ? '' : 's'}`}
              </button>
            )}
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-3 px-6 py-3">
            <button
              type="button"
              onClick={() => setAnalysisOpen(true)}
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
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              ·
            </span>
            <button
              type="button"
              onClick={() => setLogOpen((v) => !v)}
              className="flex items-center gap-1.5 hover:underline transition-colors"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-status-info, #004f83)',
                fontWeight: 600,
              }}
            >
              <ModusWcIcon name="bookmark" size="xs" decorative />
              {logOpen ? 'Hide' : 'Show'} activity ({activity.length})
            </button>
          </div>

          {/* Activity timeline */}
          {logOpen && (
            <div
              className="flex flex-col gap-2 px-6 py-3"
              style={{
                backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
                borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              }}
            >
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: 'var(--modus-wc-color-base-content, #364153)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Investigation activity
              </span>
              <ul className="flex flex-col gap-1">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex gap-2 items-start">
                    <span
                      className="tabular-nums shrink-0"
                      style={{
                        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                        color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                        minWidth: '3.5rem',
                      }}
                    >
                      {entry.time}
                    </span>
                    <span
                      className="leading-5"
                      style={{
                        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                        color: 'var(--modus-wc-color-base-content, #171c1e)',
                      }}
                    >
                      {entry.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback row */}
          <div
            className="flex flex-wrap items-center gap-3 px-6 py-3"
            style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
          >
            {!feedbackSent ? (
              <>
                <span
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  Were these suggestions helpful?
                </span>
                <button
                  type="button"
                  onClick={() => submitFeedback('helpful')}
                  className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                    fontWeight: 600,
                  }}
                >
                  <ModusWcIcon
                    name="check"
                    size="xs"
                    decorative
                    style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
                  />
                  Helpful
                </button>
                <button
                  type="button"
                  onClick={() => submitFeedback('not_helpful')}
                  className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                    fontWeight: 600,
                  }}
                >
                  <ModusWcIcon
                    name="close"
                    size="xs"
                    decorative
                    style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                  />
                  Not helpful
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <ModusWcIcon
                  name="check_circle"
                  size="xs"
                  decorative
                  style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
                />
                <span
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                  }}
                >
                  Thanks — your feedback helps the AI improve future
                  investigations.
                  {feedback === 'not_helpful' && (
                    <>
                      {' '}
                      <button
                        type="button"
                        className="hover:underline"
                        style={{
                          color: 'var(--modus-wc-color-status-info, #004f83)',
                          fontWeight: 600,
                        }}
                      >
                        Tell us more
                      </button>
                    </>
                  )}
                </span>
              </div>
            )}
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

      {analysisOpen && (
        <DetailedAnalysisModal
          onClose={() => setAnalysisOpen(false)}
          items={investigations.filter((i) => !hiddenItems.has(i.id))}
          itemStates={itemStates}
        />
      )}
    </>
  );
}
