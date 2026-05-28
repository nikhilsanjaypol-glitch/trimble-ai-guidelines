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
 * AI Limitations Response Card — communicates what data is missing
 * and what the user can try to resolve the issue.
 */
export default function Expert5() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      {/* Gradient border wrapper — 2px padding matches Expert1/2/4 and the Creative cards */}
      <div
        className="rounded-2xl p-[2px] w-[410px] shrink-0"
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
            <div
              className="shrink-0 flex items-center justify-center size-6"
              aria-hidden="true"
            >
              <ModusWcIcon name="close" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
            </div>
          </div>

          {/* What's missing */}
          <div className="flex flex-col gap-2 px-6 pt-3 pb-3">
            <span
              className="font-semibold leading-6"
              style={{
                fontSize: '13px',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
            >
              What&apos;s missing
            </span>
            <div className="flex flex-col gap-1">
              {missingItems.map((item) => (
                <div key={item} className="flex items-center">
                  <div className="flex items-center justify-center size-6 shrink-0">
                    <span
                      className="rounded-full size-1.5 block"
                      style={{ backgroundColor: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
                    />
                  </div>
                  <span
                    className="leading-6"
                    style={{
                      fontSize: '13px',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* You can try */}
          <div className="flex flex-col gap-3 px-6 pb-6">
            <span
              className="font-semibold leading-6"
              style={{
                fontSize: '13px',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
            >
              You can try
            </span>
            <div
              className="flex flex-col gap-2 p-3 rounded-lg"
              style={{ backgroundColor: 'rgba(241, 241, 246, 0.5)' }}
            >
              {tryItems.map(({ icon, label }) => (
                <div key={label} className="flex gap-3 items-center">
                  <ModusWcIcon name={icon} size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
                  <span
                    className="leading-6"
                    style={{
                      fontSize: '13px',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div
            className="flex gap-[12px] items-center px-6 pt-6 pb-3"
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

      {/* Modals — opened via the existing Upload Data / Contact Support buttons */}
      {uploadOpen && <UploadDataModal onClose={() => setUploadOpen(false)} />}
      {supportOpen && <ContactSupportModal onClose={() => setSupportOpen(false)} />}
    </>
  );
}

