import { useEffect, useRef, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

type Severity = 'required' | 'recommended';

interface MissingItem {
  label: string;
  severity: Severity;
  why: string;
}

const missingItems: MissingItem[] = [
  {
    label: 'Site-specific cost estimates',
    severity: 'required',
    why: 'Needed to ground regional pricing and avoid generic national averages.',
  },
  {
    label: 'Material pricing data',
    severity: 'required',
    why: 'Current vendor quotes determine line-item totals within ±2% accuracy.',
  },
  {
    label: 'Recent grading updates',
    severity: 'recommended',
    why: 'Last survey is 47 days old — newer data improves earthwork volume calcs.',
  },
  {
    label: 'Labor rate adjustments',
    severity: 'recommended',
    why: 'Union rate change effective Apr 2026 not yet reflected in the dataset.',
  },
];

interface TryAction {
  icon: string;
  label: string;
  description: string;
  action: 'upload' | 'reports' | 'parameters';
}

const tryItems: TryAction[] = [
  {
    icon: 'upload',
    label: 'Upload updated project data',
    description: 'CSV, XLSX or PDF — typically takes ~2 min',
    action: 'upload',
  },
  {
    icon: 'document_outline',
    label: 'Review cost analysis reports',
    description: '3 archived reports available for this project',
    action: 'reports',
  },
  {
    icon: 'settings_outline',
    label: 'Adjust input parameters',
    description: 'Loosen tolerances to allow a directional estimate',
    action: 'parameters',
  },
];

interface AlternativeHelp {
  icon: string;
  label: string;
}

const alternativeHelp: AlternativeHelp[] = [
  { icon: 'calculator', label: 'Estimate using national averages (±15% accuracy)' },
  { icon: 'history', label: 'Compare against your last 3 similar projects' },
  { icon: 'list_view', label: 'Generate a checklist of data we still need' },
];

const DATA_COVERAGE = 42;
const USER_QUERY =
  'What\u2019s the total cost to complete grading and base prep on Phase 2?';

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
        <div className="bg-white rounded-2xl w-[440px] shadow-xl flex flex-col overflow-hidden">
          <div className="flex flex-col items-center gap-4 px-8 py-10 text-center">
            <div
              className="flex items-center justify-center rounded-full size-14"
              style={{ backgroundColor: 'var(--modus-wc-color-status-success-light, #e6f4ea)' }}
            >
              <ModusWcIcon
                name="check_circle"
                size="lg"
                decorative
                style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
              />
            </div>
            <span
              className="font-semibold"
              style={{ fontSize: 'var(--modus-wc-font-size-lg, 18px)', color: 'var(--modus-wc-color-base-content, #101828)' }}
            >
              Data uploaded successfully
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              }}
            >
              Your project data has been received. The AI will use it to refine
              its response.
            </span>
          </div>
          <div
            className="flex justify-end px-6 pb-6"
            style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)', paddingTop: '1rem' }}
          >
            <ModusWcButton size="md" color="primary" onButtonClick={onClose}>
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
        <div className="bg-white rounded-2xl w-[440px] shadow-xl flex flex-col overflow-hidden">
          <div className="flex flex-col items-center gap-4 px-8 py-10 text-center">
            <div
              className="flex items-center justify-center rounded-full size-14"
              style={{ backgroundColor: 'var(--modus-wc-color-status-success-light, #e6f4ea)' }}
            >
              <ModusWcIcon
                name="check_circle"
                size="lg"
                decorative
                style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
              />
            </div>
            <span
              className="font-semibold"
              style={{ fontSize: 'var(--modus-wc-font-size-lg, 18px)', color: 'var(--modus-wc-color-base-content, #101828)' }}
            >
              Message sent
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              }}
            >
              Our team will be in touch within 24 hours.
            </span>
          </div>
          <div
            className="flex justify-end px-6 pb-6"
            style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)', paddingTop: '1rem' }}
          >
            <ModusWcButton size="md" color="primary" onButtonClick={onClose}>
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
        <div className="flex flex-col gap-4 px-6 py-5">
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
              className="rounded-lg px-3 py-2 resize-none outline-none transition-colors"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
                border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--modus-wc-color-primary, #0063a3)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--modus-wc-color-base-200, #e0e1e9)')}
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

/* ── Toast (transient feedback) ────────────────────────────────── */
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2800);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg"
      style={{
        bottom: '24px',
        backgroundColor: 'var(--modus-wc-color-base-content, #171c1e)',
        color: '#fff',
        animation: 'expert5ToastIn 180ms ease-out',
      }}
      role="status"
    >
      <ModusWcIcon name="check_circle" size="sm" decorative style={{ color: '#7ee2b8' }} />
      <span style={{ fontSize: 'var(--modus-wc-font-size-sm, 14px)' }}>{message}</span>
    </div>
  );
}

/* ── Severity badge ────────────────────────────────────────────── */
function SeverityBadge({ severity }: { severity: Severity }) {
  const isRequired = severity === 'required';
  return (
    <span
      className="inline-flex items-center px-1.5 py-px rounded font-medium uppercase tracking-wide"
      style={{
        fontSize: '10px',
        lineHeight: '14px',
        color: isRequired
          ? 'var(--modus-wc-color-status-error, #b32026)'
          : 'var(--modus-wc-color-status-warning, #a26b00)',
        backgroundColor: isRequired ? 'rgba(179, 32, 38, 0.08)' : 'rgba(255, 184, 0, 0.14)',
      }}
    >
      {isRequired ? 'Required' : 'Recommended'}
    </span>
  );
}

/* ── Expert 5 — Be Honest About Limitations ────────────────────── */
/**
 * AI Limitations Response Card — communicates what data is missing,
 * why it matters, what the user can try, and what the AI *can* still help with.
 */
export default function Expert5() {
  const [dismissed, setDismissed] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showQuery, setShowQuery] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  if (dismissed) return null;

  function flashToast(msg: string) {
    setToast(null);
    requestAnimationFrame(() => setToast(msg));
  }

  function handleTryAction(action: TryAction['action'], label: string) {
    if (action === 'upload') {
      setUploadOpen(true);
      return;
    }
    if (action === 'reports') {
      flashToast('Opening cost analysis reports\u2026');
      return;
    }
    if (action === 'parameters') {
      flashToast('Adjust parameters panel coming up\u2026');
      return;
    }
    flashToast(label);
  }

  function handleAlternative(label: string) {
    flashToast(`Running: ${label}`);
  }

  const coverageColor =
    DATA_COVERAGE < 50
      ? 'var(--modus-wc-color-status-error, #b32026)'
      : DATA_COVERAGE < 80
        ? 'var(--modus-wc-color-status-warning, #a26b00)'
        : 'var(--modus-wc-color-status-success, #1e7e34)';

  return (
    <>
      <style>{`
        @keyframes expert5ToastIn {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {/* Gradient border wrapper — 3px padding exposes the rainbow gradient as a stroke */}
      <div
        className="rounded-2xl p-[3px] w-[410px] shrink-0"
        style={{
          background: TRIMBLE_RAINBOW,
          boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)',
        }}
      >
        <div className="bg-white rounded-[14px] flex flex-col w-full">
          {/* Header */}
          <div
            className="flex gap-3 items-center justify-center px-6 pt-6 pb-3"
            style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
          >
            <div className="bg-[#fff9ef] flex items-center justify-center rounded-[10px] shrink-0 size-10">
              <ModusWcIcon name="alert_outline" size="md" decorative style={{ color: 'var(--modus-wc-color-secondary, #6A6E79)' }} />
            </div>
            <div className="flex flex-col gap-0 flex-1">
              <span
                className="font-semibold text-[#101828] leading-8"
                style={{ fontSize: 'var(--modus-wc-font-size-lg, 18px)' }}
              >
                Unable to complete this request
              </span>
              <span
                className="leading-6"
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                }}
              >
                Insufficient data to provide a reliable answer
              </span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 flex items-center justify-center size-6 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
              aria-label="Dismiss"
            >
              <ModusWcIcon name="close" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
            </button>
          </div>

          {/* User query echo — context for why this limitation appeared */}
          {showQuery && (
            <div
              className="flex gap-2 items-start px-6 py-3"
              style={{
                backgroundColor: 'rgba(0, 99, 163, 0.04)',
                borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              }}
            >
              <ModusWcIcon
                name="comment"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-status-info, #004f83)', marginTop: 4 }}
              />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span
                  className="font-medium"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  You asked
                </span>
                <span
                  className="leading-5 italic"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    color: 'var(--modus-wc-color-base-content, #364153)',
                  }}
                >
                  &ldquo;{USER_QUERY}&rdquo;
                </span>
              </div>
              <button
                onClick={() => setShowQuery(false)}
                className="shrink-0 flex items-center justify-center size-5 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
                aria-label="Hide query"
              >
                <ModusWcIcon name="close" size="xs" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
              </button>
            </div>
          )}

          {/* Data coverage transparency bar */}
          <div className="flex flex-col gap-1.5 px-6 pt-3">
            <div className="flex items-center justify-between">
              <span
                className="font-medium"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                }}
              >
                Data coverage for this estimate
              </span>
              <span
                className="font-semibold"
                style={{ fontSize: 'var(--modus-wc-font-size-xs, 12px)', color: coverageColor }}
              >
                {DATA_COVERAGE}%
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--modus-wc-color-base-200, #e0e1e9)' }}
              role="progressbar"
              aria-valuenow={DATA_COVERAGE}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Data coverage"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${DATA_COVERAGE}%`,
                  backgroundColor: coverageColor,
                  transition: 'width 400ms ease-out',
                }}
              />
            </div>
          </div>

          {/* What's missing — expandable */}
          <div className="flex flex-col gap-2 px-6 pt-3 pb-3">
            <span
              className="font-semibold leading-6"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
            >
              What&apos;s missing
            </span>
            <div className="flex flex-col gap-1">
              {missingItems.map((item) => {
                const isOpen = expanded === item.label;
                return (
                  <div key={item.label} className="flex flex-col">
                    <button
                      onClick={() => setExpanded(isOpen ? null : item.label)}
                      className="flex items-center gap-2 text-left rounded-md px-1 -mx-1 py-0.5 transition-colors hover:bg-[var(--modus-wc-color-base-100,#f5f6fa)]"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center justify-center size-6 shrink-0">
                        <span
                          className="rounded-full size-1.5 block"
                          style={{ backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
                        />
                      </div>
                      <span
                        className="leading-6 flex-1"
                        style={{
                          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                          color: 'var(--modus-wc-color-base-content, #171c1e)',
                        }}
                      >
                        {item.label}
                      </span>
                      <SeverityBadge severity={item.severity} />
                      <ModusWcIcon
                        name={isOpen ? 'chevron_up' : 'chevron_down'}
                        size="xs"
                        decorative
                        style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                      />
                    </button>
                    {isOpen && (
                      <div
                        className="ml-8 mr-1 mt-1 mb-1 px-3 py-2 rounded-md"
                        style={{
                          backgroundColor: 'var(--modus-wc-color-base-100, #f5f6fa)',
                          borderLeft: '2px solid var(--modus-wc-color-status-info, #004f83)',
                        }}
                      >
                        <span
                          className="leading-5"
                          style={{
                            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                            color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                          }}
                        >
                          {item.why}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* You can try — actionable rows */}
          <div className="flex flex-col gap-3 px-6 pb-3">
            <span
              className="font-semibold leading-6"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
            >
              You can try
            </span>
            <div
              className="flex flex-col gap-1 p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(241, 241, 246, 0.5)' }}
            >
              {tryItems.map(({ icon, label, description, action }) => (
                <button
                  key={label}
                  onClick={() => handleTryAction(action, label)}
                  className="flex gap-3 items-center text-left px-2 py-1.5 rounded-md transition-colors hover:bg-white group"
                >
                  <ModusWcIcon
                    name={icon}
                    size="sm"
                    decorative
                    style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span
                      className="leading-5"
                      style={{
                        fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                        color: 'var(--modus-wc-color-base-content, #171c1e)',
                      }}
                    >
                      {label}
                    </span>
                    <span
                      className="leading-4"
                      style={{
                        fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                        color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                      }}
                    >
                      {description}
                    </span>
                  </div>
                  <ModusWcIcon
                    name="chevron_right"
                    size="xs"
                    decorative
                    style={{
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)',
                      opacity: 0.6,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* What I can still help with — alternative suggestions */}
          <div className="flex flex-col gap-2 px-6 pb-6">
            <div className="flex items-center gap-1.5">
              <ModusWcIcon
                name="lightbulb_on"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
              />
              <span
                className="font-semibold leading-6"
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  color: 'var(--modus-wc-color-base-content, #364153)',
                }}
              >
                What I can still help with
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {alternativeHelp.map(({ icon, label }) => (
                <button
                  key={label}
                  onClick={() => handleAlternative(label)}
                  className="flex gap-2 items-center text-left px-2 py-1.5 -mx-2 rounded-md transition-colors hover:bg-[var(--modus-wc-color-base-100,#f5f6fa)]"
                >
                  <ModusWcIcon
                    name={icon}
                    size="xs"
                    decorative
                    style={{ color: 'var(--modus-wc-color-status-success, #1e7e34)' }}
                  />
                  <span
                    className="leading-5 flex-1"
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {label}
                  </span>
                  <ModusWcIcon
                    name="chevron_right"
                    size="xs"
                    decorative
                    style={{
                      color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)',
                      opacity: 0.6,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div
            className="flex gap-[12px] items-center px-6 pt-4 pb-3"
            style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e5e7eb)' }}
          >
            <div className="flex-1">
              <ModusWcButton
                size="md"
                color="primary"
                style={{ width: '100%' }}
                onButtonClick={() => setUploadOpen(true)}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <ModusWcIcon name="upload" size="sm" decorative />
                  Upload Data
                </span>
              </ModusWcButton>
            </div>
            <div className="flex-1">
              <ModusWcButton
                size="md"
                color="tertiary"
                variant="outlined"
                style={{ width: '100%' }}
                onButtonClick={() => setSupportOpen(true)}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <ModusWcIcon name="help" size="sm" decorative />
                  Contact Support
                </span>
              </ModusWcButton>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex gap-3 items-start px-6 pb-3">
            <div className="flex gap-2 items-start justify-start">
              <ModusWcIcon name="alert_outline" size="xs" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
              <span
                className="leading-4"
                style={{
                  fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                AI responses depend on available project data
              </span>
            </div>
            <span
              className="leading-4 cursor-pointer hover:underline whitespace-nowrap"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: 'var(--modus-wc-color-status-info, #004f83)',
              }}
            >
              Learn more..
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {uploadOpen && <UploadDataModal onClose={() => setUploadOpen(false)} />}
      {supportOpen && <ContactSupportModal onClose={() => setSupportOpen(false)} />}

      {/* Toast */}
      {toast && <Toast key={toast} message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}

