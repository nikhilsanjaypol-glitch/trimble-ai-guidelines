import { useRef, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

const missingItems = [
  'Site-specific cost estimates',
  'Material pricing data',
  'Recent grading updates',
  'Labor rate adjustments',
];

const tryItems = [
  { icon: 'upload', label: 'Upload updated project data' },
  { icon: 'document_outline', label: 'Review cost analysis reports' },
  { icon: 'settings_outline', label: 'Adjust input parameters' },
];

const PROJECT = {
  name: 'Highway 47 Expansion',
  phase: 'Phase 2',
  scope: 'Grading & Base Prep',
  task: 'Total cost to complete grading and base prep',
  runAt: 'Today, 9:14 AM',
  coverage: 42,
};

interface DesignProps {
  onUpload: () => void;
  onSupport: () => void;
}

/* ═════════════════════════════════════════════════════════════════
   DESIGN 1 — DOCUMENT REPORT
   Formal printed-page feel: letterhead rule, label/value rows,
   uppercase section titles. Reads like a delivered estimate doc.
   ═════════════════════════════════════════════════════════════════ */
function DocumentReportDesign({ onUpload, onSupport }: DesignProps) {
  return (
    <div
      className="rounded-lg w-[460px] shrink-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ height: '4px', background: TRIMBLE_RAINBOW }} />

      <div className="flex flex-col gap-1 px-7 pt-6 pb-4">
        <span
          className="font-semibold"
          style={{
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Cost Estimate Report
        </span>
        <span
          className="font-semibold"
          style={{
            fontSize: '20px',
            lineHeight: 1.2,
            color: 'var(--modus-wc-color-base-content, #101828)',
          }}
        >
          {PROJECT.phase} — {PROJECT.scope}
        </span>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
          }}
        >
          {PROJECT.name}
        </span>
      </div>

      <div
        className="grid grid-cols-2 gap-y-1 px-7 py-3"
        style={{
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          fontSize: '12px',
        }}
      >
        {[
          ['Estimator', 'AI Cost Engine'],
          ['Run', PROJECT.runAt],
          ['Attempt', '1 of 3'],
          ['Status', 'Incomplete'],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span
              className="font-semibold"
              style={{
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontSize: '10px',
                minWidth: '64px',
                paddingTop: '2px',
              }}
            >
              {k}
            </span>
            <span style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}>
              {v}
            </span>
          </div>
        ))}
      </div>

      <div
        className="flex gap-3 items-start px-7 py-4"
        style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div className="bg-[#fff9ef] flex items-center justify-center rounded-md shrink-0 size-8 mt-0.5">
          <ModusWcIcon name="alert_outline" size="sm" decorative style={{ color: '#b88217' }} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span
            className="font-semibold"
            style={{
              fontSize: '14px',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
            }}
          >
            Estimate could not be completed
          </span>
          <span
            style={{
              fontSize: '12px',
              lineHeight: 1.45,
              color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
            }}
          >
            Insufficient data to provide a reliable answer.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-7 py-4">
        <span
          className="font-semibold"
          style={{
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Required inputs not found
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {missingItems.map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <span
                className="rounded-full size-1 block shrink-0"
                style={{ backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex flex-col gap-2 px-7 py-4"
        style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <span
          className="font-semibold"
          style={{
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Recommended actions
        </span>
        <ol className="flex flex-col gap-1" style={{ paddingLeft: '18px', margin: 0 }}>
          {tryItems.map(({ label }) => (
            <li key={label} style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>
              {label}
            </li>
          ))}
        </ol>
      </div>

      <div
        className="flex gap-2 items-center px-7 py-4"
        style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div className="flex-1">
          <ModusWcButton size="sm" color="primary" style={{ width: '100%' }} onButtonClick={onUpload}>
            <span className="flex items-center justify-center gap-1">
              <ModusWcIcon name="upload" size="xs" decorative />
              Upload Data
            </span>
          </ModusWcButton>
        </div>
        <div className="flex-1">
          <ModusWcButton size="sm" color="tertiary" variant="outlined" style={{ width: '100%' }} onButtonClick={onSupport}>
            <span className="flex items-center justify-center gap-1">
              <ModusWcIcon name="help" size="xs" decorative />
              Contact Support
            </span>
          </ModusWcButton>
        </div>
      </div>

      <div
        className="px-7 py-2"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
          fontSize: '10px',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          letterSpacing: '0.04em',
        }}
      >
        AI responses depend on available project data.
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   DESIGN 2 — DASHBOARD WIDGET
   Status pill, KPI cards (Coverage / Confidence / Staleness),
   2-column missing-vs-actions body. Reads like a workspace tile.
   ═════════════════════════════════════════════════════════════════ */
function DashboardWidgetDesign({ onUpload, onSupport }: DesignProps) {
  const kpis: Array<{ value: string; label: string; tone: 'danger' | 'warning' | 'neutral' }> = [
    { value: `${PROJECT.coverage}%`, label: 'Data coverage', tone: 'danger' },
    { value: 'Low', label: 'Confidence', tone: 'warning' },
    { value: '47d', label: 'Data age', tone: 'warning' },
  ];
  const toneColor = (t: 'danger' | 'warning' | 'neutral') =>
    t === 'danger'
      ? 'var(--modus-wc-color-status-error, #b32026)'
      : t === 'warning'
        ? '#b88217'
        : 'var(--modus-wc-color-base-content, #101828)';

  return (
    <div
      className="rounded-2xl w-[480px] shrink-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className="font-semibold"
            style={{
              fontSize: '15px',
              color: 'var(--modus-wc-color-base-content, #101828)',
              lineHeight: 1.2,
            }}
          >
            {PROJECT.phase} Cost Estimate
          </span>
          <span style={{ fontSize: '11px', color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}>
            {PROJECT.name} · {PROJECT.runAt}
          </span>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md shrink-0"
          style={{ backgroundColor: '#fff9ef', border: '1px solid #f3c870' }}
        >
          <ModusWcIcon name="alert_outline" size="xs" decorative style={{ color: '#b88217' }} />
          <span className="font-semibold" style={{ fontSize: '11px', color: '#b88217' }}>
            Blocked
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-2 px-5 pb-4"
        style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        {kpis.map(({ value, label, tone }) => (
          <div
            key={label}
            className="flex flex-col gap-0.5 p-3 rounded-lg"
            style={{ backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)' }}
          >
            <span className="font-semibold" style={{ fontSize: '18px', color: toneColor(tone), lineHeight: 1 }}>
              {value}
            </span>
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <div
        className="flex items-start gap-2 px-5 py-3"
        style={{
          backgroundColor: 'rgba(255, 184, 0, 0.06)',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <ModusWcIcon name="alert_outline" size="xs" decorative style={{ color: '#b88217', marginTop: 3 }} />
        <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)', lineHeight: 1.45 }}>
          Cannot generate a reliable estimate — key inputs are missing.
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'var(--modus-wc-color-base-200, #e0e1e9)' }}>
        <div className="flex flex-col gap-1.5 p-4">
          <span
            className="font-semibold"
            style={{
              fontSize: '10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Missing
          </span>
          {missingItems.map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <span
                className="rounded-full size-1 block shrink-0"
                style={{ backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>{item}</span>
            </div>
          ))}
        </div>
        <div
          className="flex flex-col gap-1.5 p-4"
          style={{ borderLeft: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
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
            Actions
          </span>
          {tryItems.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <ModusWcIcon
                name={icon}
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex gap-2 items-center px-5 py-3"
        style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div className="flex-1">
          <ModusWcButton size="sm" color="primary" style={{ width: '100%' }} onButtonClick={onUpload}>
            <span className="flex items-center justify-center gap-1">
              <ModusWcIcon name="upload" size="xs" decorative />
              Upload Data
            </span>
          </ModusWcButton>
        </div>
        <div className="flex-1">
          <ModusWcButton size="sm" color="tertiary" variant="outlined" style={{ width: '100%' }} onButtonClick={onSupport}>
            Contact Support
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   DESIGN 3 — COMPACT HORIZONTAL
   Wide single card with 3 columns side-by-side: Project, Missing,
   Try.  Action row across the bottom.  Space-efficient summary.
   ═════════════════════════════════════════════════════════════════ */
function CompactHorizontalDesign({ onUpload, onSupport }: DesignProps) {
  return (
    <div
      className="rounded-2xl p-[2px] w-[680px] shrink-0"
      style={{
        background: TRIMBLE_RAINBOW,
        boxShadow: '0px 4px 10px rgba(0,0,0,0.08)',
      }}
    >
      <div className="bg-white rounded-[14px] flex flex-col w-full overflow-hidden">
        <div
          className="flex items-center justify-between gap-3 px-5 py-3"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-[#fff9ef] flex items-center justify-center rounded-md shrink-0 size-7">
              <ModusWcIcon name="alert_outline" size="xs" decorative style={{ color: '#b88217' }} />
            </div>
            <div className="flex flex-col gap-0">
              <span
                className="font-semibold"
                style={{
                  fontSize: '14px',
                  color: 'var(--modus-wc-color-base-content, #101828)',
                  lineHeight: 1.2,
                }}
              >
                {PROJECT.phase} Cost Estimate · {PROJECT.name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}>
                Unable to complete — insufficient data
              </span>
            </div>
          </div>
          <span
            className="px-2 py-0.5 rounded-md font-semibold"
            style={{
              fontSize: '10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#b88217',
              backgroundColor: '#fff9ef',
              border: '1px solid #f3c870',
            }}
          >
            Incomplete
          </span>
        </div>

        <div
          className="grid grid-cols-3"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div className="flex flex-col gap-1 p-4">
            <span
              className="font-semibold"
              style={{
                fontSize: '10px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              Project
            </span>
            <span
              className="font-semibold"
              style={{ fontSize: '13px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}
            >
              {PROJECT.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)' }}>
              {PROJECT.phase} · {PROJECT.scope}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)', marginTop: '2px' }}>
              {PROJECT.runAt}
            </span>
          </div>

          <div
            className="flex flex-col gap-1 p-4"
            style={{ borderLeft: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
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
              Missing
            </span>
            {missingItems.map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <span
                  className="rounded-full size-1 block shrink-0"
                  style={{ backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>{item}</span>
              </div>
            ))}
          </div>

          <div
            className="flex flex-col gap-1 p-4"
            style={{ borderLeft: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
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
              Try
            </span>
            {tryItems.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <ModusWcIcon
                  name={icon}
                  size="xs"
                  decorative
                  style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3">
          <span style={{ fontSize: '10px', color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}>
            AI responses depend on available project data ·{' '}
            <span className="cursor-pointer hover:underline" style={{ color: 'var(--modus-wc-color-status-info, #004f83)' }}>
              Learn more
            </span>
          </span>
          <div className="flex gap-2">
            <ModusWcButton size="sm" color="tertiary" variant="outlined" onButtonClick={onSupport}>
              Contact Support
            </ModusWcButton>
            <ModusWcButton size="sm" color="primary" onButtonClick={onUpload}>
              <span className="flex items-center gap-1">
                <ModusWcIcon name="upload" size="xs" decorative />
                Upload Data
              </span>
            </ModusWcButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   DESIGN 4 — HERO / SPLIT
   Bold gradient hero header with project title; status banner;
   2-col body for Missing/Try; floating action bar at the bottom.
   ═════════════════════════════════════════════════════════════════ */
function HeroSplitDesign({ onUpload, onSupport }: DesignProps) {
  return (
    <div
      className="rounded-2xl w-[440px] shrink-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.10)',
      }}
    >
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
          Cost Estimate · Report
        </span>
        <span className="font-semibold" style={{ fontSize: '22px', lineHeight: 1.15 }}>
          {PROJECT.name}
        </span>
        <span style={{ fontSize: '13px', opacity: 0.85 }}>
          {PROJECT.phase} · {PROJECT.scope}
        </span>
        <div
          className="self-start flex items-center gap-1 px-2 py-1 rounded-md mt-2"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.14)', backdropFilter: 'blur(2px)' }}
        >
          <ModusWcIcon name="alert_outline" size="xs" decorative style={{ color: '#fff' }} />
          <span className="font-semibold" style={{ fontSize: '11px' }}>
            Cannot complete
          </span>
        </div>
        <div style={{ height: '2px', background: TRIMBLE_RAINBOW, borderRadius: '1px', marginTop: '14px' }} />
      </div>

      <div className="flex flex-col gap-1 px-6 py-4">
        <span
          className="font-semibold"
          style={{ fontSize: '14px', color: 'var(--modus-wc-color-base-content, #101828)' }}
        >
          We&apos;re missing critical project data
        </span>
        <span
          style={{
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
          }}
        >
          Add the inputs below or relax tolerances and we&apos;ll re-run the estimate.
        </span>
      </div>

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
            Missing
          </span>
          {missingItems.map((item) => (
            <span key={item} style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>
              · {item}
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
            You can try
          </span>
          {tryItems.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <ModusWcIcon
                name={icon}
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex gap-2 items-center px-6 py-3"
        style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div className="flex-1">
          <ModusWcButton size="sm" color="primary" style={{ width: '100%' }} onButtonClick={onUpload}>
            <span className="flex items-center justify-center gap-1">
              <ModusWcIcon name="upload" size="xs" decorative />
              Upload Data
            </span>
          </ModusWcButton>
        </div>
        <div className="flex-1">
          <ModusWcButton size="sm" color="tertiary" variant="outlined" style={{ width: '100%' }} onButtonClick={onSupport}>
            Contact Support
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   DESIGN 5 — PIPELINE / PROCESS
   Shows the estimation pipeline as 4 steps with the current step
   flagged BLOCKED.  Resolution details below.  Operational feel.
   ═════════════════════════════════════════════════════════════════ */
function PipelineProcessDesign({ onUpload, onSupport }: DesignProps) {
  const steps = [
    { id: 1, label: 'Data', state: 'done' as const },
    { id: 2, label: 'Compute', state: 'blocked' as const },
    { id: 3, label: 'Review', state: 'pending' as const },
    { id: 4, label: 'Report', state: 'pending' as const },
  ];

  return (
    <div
      className="rounded-2xl w-[500px] shrink-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex flex-col gap-0.5 px-5 pt-4 pb-3">
        <span
          className="font-semibold"
          style={{
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Cost Estimate Pipeline
        </span>
        <span
          className="font-semibold"
          style={{
            fontSize: '15px',
            color: 'var(--modus-wc-color-base-content, #101828)',
            lineHeight: 1.25,
          }}
        >
          {PROJECT.phase} · {PROJECT.name}
        </span>
      </div>

      <div
        className="flex items-center gap-2 px-5 py-4"
        style={{
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          backgroundColor: 'var(--modus-wc-color-base-100, #f7f8fa)',
        }}
      >
        {steps.map((s, i) => {
          const isBlocked = s.state === 'blocked';
          const isDone = s.state === 'done';
          const bg = isBlocked
            ? '#fff9ef'
            : isDone
              ? 'var(--modus-wc-color-status-success-light, #e6f4ea)'
              : 'var(--modus-wc-color-base-200, #e0e1e9)';
          const fg = isBlocked
            ? '#b88217'
            : isDone
              ? 'var(--modus-wc-color-status-success, #1e7e34)'
              : 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)';
          return (
            <span key={s.id} className="flex items-center gap-2 flex-1 min-w-0">
              <span
                className="flex items-center justify-center rounded-full font-semibold shrink-0"
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: bg,
                  color: fg,
                  fontSize: '11px',
                  border: isBlocked ? '1px solid #f3c870' : 'none',
                }}
              >
                {isDone ? '✓' : isBlocked ? '!' : s.id}
              </span>
              <span
                className="font-medium truncate"
                style={{
                  fontSize: '12px',
                  color: isBlocked
                    ? '#b88217'
                    : isDone
                      ? 'var(--modus-wc-color-base-content, #171c1e)'
                      : 'var(--modus-wc-color-base-content-low-contrast, #9aa0a6)',
                }}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span
                  className="flex-1"
                  style={{ height: '1px', backgroundColor: 'var(--modus-wc-color-base-200, #d0d3da)' }}
                />
              )}
            </span>
          );
        })}
      </div>

      <div
        className="flex items-start gap-2 px-5 py-3"
        style={{
          backgroundColor: 'rgba(255, 184, 0, 0.06)',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        <ModusWcIcon name="alert_outline" size="sm" decorative style={{ color: '#b88217', marginTop: 2 }} />
        <div className="flex flex-col gap-0">
          <span
            className="font-semibold"
            style={{ fontSize: '13px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}
          >
            Blocked at Step 2 — Compute
          </span>
          <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)' }}>
            Insufficient data to run the cost rollup reliably.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="flex flex-col gap-1 p-4">
          <span
            className="font-semibold"
            style={{
              fontSize: '10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            Missing inputs
          </span>
          {missingItems.map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <span
                className="rounded-full size-1 block shrink-0"
                style={{ backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>{item}</span>
            </div>
          ))}
        </div>
        <div
          className="flex flex-col gap-1 p-4"
          style={{ borderLeft: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
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
            Unblock with
          </span>
          {tryItems.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <ModusWcIcon
                name={icon}
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--modus-wc-color-base-content, #171c1e)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex gap-2 items-center px-5 py-3"
        style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div className="flex-1">
          <ModusWcButton size="sm" color="primary" style={{ width: '100%' }} onButtonClick={onUpload}>
            <span className="flex items-center justify-center gap-1">
              <ModusWcIcon name="upload" size="xs" decorative />
              Upload Data
            </span>
          </ModusWcButton>
        </div>
        <div className="flex-1">
          <ModusWcButton size="sm" color="tertiary" variant="outlined" style={{ width: '100%' }} onButtonClick={onSupport}>
            Contact Support
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Picker — segmented control at the top of the page
   ═════════════════════════════════════════════════════════════════ */
type DesignVariant = 'document' | 'dashboard' | 'compact' | 'hero' | 'pipeline';

const DESIGN_OPTIONS: { id: DesignVariant; label: string; sub: string }[] = [
  { id: 'document', label: '1 · Document', sub: 'Formal report' },
  { id: 'dashboard', label: '2 · Dashboard', sub: 'KPI widget' },
  { id: 'compact', label: '3 · Compact', sub: 'Wide summary' },
  { id: 'hero', label: '4 · Hero', sub: 'Branded header' },
  { id: 'pipeline', label: '5 · Pipeline', sub: 'Stepper view' },
];

function DesignPicker({
  active,
  onChange,
}: {
  active: DesignVariant;
  onChange: (v: DesignVariant) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="font-semibold"
        style={{
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        Cost Estimate Report · pick a design
      </span>
      <div
        className="flex flex-wrap gap-1 p-1 rounded-lg"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        }}
      >
        {DESIGN_OPTIONS.map(({ id, label, sub }) => {
          const selected = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="flex flex-col items-start px-3 py-1.5 rounded-md transition-colors"
              style={{
                backgroundColor: selected
                  ? 'var(--modus-wc-color-base-page, #ffffff)'
                  : 'transparent',
                boxShadow: selected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span
                className="font-semibold"
                style={{
                  fontSize: '12px',
                  color: selected
                    ? 'var(--modus-wc-color-primary, #0063a3)'
                    : 'var(--modus-wc-color-base-content, #364153)',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                {sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Upload Data Modal ─────────────────────────────────────────── */
function UploadDataModal({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const next = Array.from(incoming).filter(
      (f) => !files.some((existing) => existing.name === f.name),
    );
    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  if (uploaded) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl w-[340px] shadow-xl flex flex-col overflow-hidden">
          <div className="flex flex-col items-center gap-2.5 px-5 py-6 text-center">
            <div
              className="flex items-center justify-center rounded-full size-11"
              style={{ backgroundColor: 'var(--modus-wc-color-status-success-light, #e6f4ea)' }}
            >
              <ModusWcIcon
                name="check_circle"
                size="md"
                decorative
                style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
              />
            </div>
            <span
              className="font-semibold"
              style={{ fontSize: 'var(--modus-wc-font-size-base, 16px)', color: 'var(--modus-wc-color-base-content, #101828)' }}
            >
              Data uploaded successfully
            </span>
            <span
              style={{
                fontSize: '13px',
                lineHeight: 1.45,
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              }}
            >
              Your project data has been received. The AI will use it to refine
              its response.
            </span>
          </div>
          <div
            className="flex justify-end px-4 pb-4"
            style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)', paddingTop: '0.75rem' }}
          >
            <ModusWcButton size="sm" color="primary" onButtonClick={onClose}>
              Done
            </ModusWcButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[440px] shadow-xl flex flex-col overflow-hidden">
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <span
            className="font-semibold"
            style={{ fontSize: 'var(--modus-wc-font-size-lg, 18px)', color: 'var(--modus-wc-color-base-content, #101828)' }}
          >
            Upload Project Data
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-6 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
            aria-label="Close"
          >
            <ModusWcIcon name="close" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
          </button>
        </div>

        {/* Dropzone */}
        <div className="px-6 pt-5 pb-3">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-colors"
            style={{
              borderColor: dragging
                ? 'var(--modus-wc-color-primary, #0063a3)'
                : 'var(--modus-wc-color-base-200, #e0e1e9)',
              backgroundColor: dragging
                ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
                : 'var(--modus-wc-color-base-100, #f8f9fa)',
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <ModusWcIcon
              name="upload"
              size="lg"
              decorative
              style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
            />
            <span
              className="font-medium"
              style={{ fontSize: 'var(--modus-wc-font-size-sm, 14px)', color: 'var(--modus-wc-color-base-content, #364153)' }}
            >
              Drag & drop files here, or{' '}
              <span style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}>browse</span>
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              }}
            >
              Supports CSV, XLSX, PDF
            </span>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.pdf"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="px-6 pb-3 flex flex-col gap-2">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)' }}
              >
                <ModusWcIcon
                  name="document_outline"
                  size="sm"
                  decorative
                  style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
                />
                <span
                  className="flex-1 truncate"
                  style={{ fontSize: 'var(--modus-wc-font-size-sm, 14px)', color: 'var(--modus-wc-color-base-content, #364153)' }}
                >
                  {file.name}
                </span>
                <span
                  className="shrink-0"
                  style={{ fontSize: 'var(--modus-wc-font-size-xs, 12px)', color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
                >
                  {formatBytes(file.size)}
                </span>
                <button
                  onClick={() => removeFile(file.name)}
                  className="shrink-0 flex items-center justify-center size-5 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <ModusWcIcon name="close" size="xs" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex gap-3 items-center justify-end px-6 py-4"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <ModusWcButton size="md" color="tertiary" variant="outlined" onButtonClick={onClose}>
            Cancel
          </ModusWcButton>
          <ModusWcButton
            size="md"
            color="primary"
            disabled={files.length === 0 || undefined}
            onButtonClick={() => { if (files.length > 0) setUploaded(true); }}
          >
            <span className="flex items-center gap-1.5">
              <ModusWcIcon name="upload" size="sm" decorative />
              Upload
            </span>
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ── Contact Support Modal ─────────────────────────────────────── */
function ContactSupportModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl w-[340px] shadow-xl flex flex-col overflow-hidden">
          <div className="flex flex-col items-center gap-2.5 px-5 py-6 text-center">
            <div
              className="flex items-center justify-center rounded-full size-11"
              style={{ backgroundColor: 'var(--modus-wc-color-status-success-light, #e6f4ea)' }}
            >
              <ModusWcIcon
                name="check_circle"
                size="md"
                decorative
                style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
              />
            </div>
            <span
              className="font-semibold"
              style={{ fontSize: 'var(--modus-wc-font-size-base, 16px)', color: 'var(--modus-wc-color-base-content, #101828)' }}
            >
              Message sent
            </span>
            <span
              style={{
                fontSize: '13px',
                lineHeight: 1.45,
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              }}
            >
              Our team will be in touch within 24 hours.
            </span>
          </div>
          <div
            className="flex justify-end px-4 pb-4"
            style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)', paddingTop: '0.75rem' }}
          >
            <ModusWcButton size="sm" color="primary" onButtonClick={onClose}>
              Done
            </ModusWcButton>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = name.trim() !== '' && email.trim() !== '' && message.trim() !== '';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[440px] shadow-xl flex flex-col overflow-hidden">
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <span
            className="font-semibold"
            style={{ fontSize: 'var(--modus-wc-font-size-lg, 18px)', color: 'var(--modus-wc-color-base-content, #101828)' }}
          >
            Contact Support
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-6 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
            aria-label="Close"
          >
            <ModusWcIcon name="close" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
          </button>
        </div>

        {/* Form */}
        <style>{`
          /* Keep Name / Email Modus inputs visually quiet on focus & hover */
          .expert5-quiet-form modus-wc-text-input .modus-wc-input,
          .expert5-quiet-form modus-wc-text-input .modus-wc-input:hover,
          .expert5-quiet-form modus-wc-text-input .modus-wc-input:active,
          .expert5-quiet-form modus-wc-text-input .modus-wc-input:focus,
          .expert5-quiet-form modus-wc-text-input .modus-wc-input:focus-within {
            border-color: var(--modus-wc-color-base-200, #e0e1e9) !important;
            border-bottom-color: var(--modus-wc-color-base-200, #e0e1e9) !important;
            outline: none !important;
            box-shadow: none !important;
          }

          /* Same quiet treatment for the Issue description textarea */
          .expert5-quiet-form textarea.expert5-issue-textarea,
          .expert5-quiet-form textarea.expert5-issue-textarea:focus,
          .expert5-quiet-form textarea.expert5-issue-textarea:focus-visible,
          .expert5-quiet-form textarea.expert5-issue-textarea:hover {
            border-color: var(--modus-wc-color-base-200, #e0e1e9) !important;
            outline: none !important;
            box-shadow: none !important;
          }
        `}</style>
        <div className="expert5-quiet-form flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1">
            <label
              className="font-medium"
              style={{ fontSize: 'var(--modus-wc-font-size-sm, 14px)', color: 'var(--modus-wc-color-base-content, #364153)' }}
            >
              Name
            </label>
            <ModusWcTextInput
              value={name}
              placeholder="Your name"
              onInputChange={(e: CustomEvent) => setName(e.detail?.target?.value || '')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              className="font-medium"
              style={{ fontSize: 'var(--modus-wc-font-size-sm, 14px)', color: 'var(--modus-wc-color-base-content, #364153)' }}
            >
              Email
            </label>
            <ModusWcTextInput
              value={email}
              placeholder="you@company.com"
              type="email"
              onInputChange={(e: CustomEvent) => setEmail(e.detail?.target?.value || '')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              className="font-medium"
              style={{ fontSize: 'var(--modus-wc-font-size-sm, 14px)', color: 'var(--modus-wc-color-base-content, #364153)' }}
            >
              Issue description
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe your issue here..."
              className="expert5-issue-textarea rounded-lg px-3 py-2 resize-none"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
                border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 items-center justify-end px-6 py-4"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <ModusWcButton size="md" color="tertiary" variant="outlined" onButtonClick={onClose}>
            Cancel
          </ModusWcButton>
          <ModusWcButton
            size="md"
            color="primary"
            disabled={!canSubmit || undefined}
            onButtonClick={() => { if (canSubmit) setSubmitted(true); }}
          >
            <span className="flex items-center gap-1.5">
              <ModusWcIcon name="send" size="sm" decorative />
              Send Message
            </span>
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ── Expert 5 — Be Honest About Limitations ────────────────────── */
/**
 * Cost Estimate Report — limitations response.
 *
 * Five redesigns are available via a segmented picker at the top.
 * Pick the direction you like and we'll lock it in.
 */
export default function Expert5() {
  const [variant, setVariant] = useState<DesignVariant>('document');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const openUpload = () => setUploadOpen(true);
  const openSupport = () => setSupportOpen(true);

  return (
    <>
      <div className="flex flex-col gap-5 items-start">
        <DesignPicker active={variant} onChange={setVariant} />

        {variant === 'document' && (
          <DocumentReportDesign onUpload={openUpload} onSupport={openSupport} />
        )}
        {variant === 'dashboard' && (
          <DashboardWidgetDesign onUpload={openUpload} onSupport={openSupport} />
        )}
        {variant === 'compact' && (
          <CompactHorizontalDesign onUpload={openUpload} onSupport={openSupport} />
        )}
        {variant === 'hero' && (
          <HeroSplitDesign onUpload={openUpload} onSupport={openSupport} />
        )}
        {variant === 'pipeline' && (
          <PipelineProcessDesign onUpload={openUpload} onSupport={openSupport} />
        )}
      </div>

      {uploadOpen && <UploadDataModal onClose={() => setUploadOpen(false)} />}
      {supportOpen && <ContactSupportModal onClose={() => setSupportOpen(false)} />}
    </>
  );
}

