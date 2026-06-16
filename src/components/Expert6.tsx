import { useRef, useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

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
              style={{
                fontSize: 'var(--modus-wc-font-size-lg, 18px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
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
              its investigation suggestions.
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
            style={{
              fontSize: 'var(--modus-wc-font-size-lg, 18px)',
              color: 'var(--modus-wc-color-base-content, #101828)',
            }}
          >
            Upload Project Data
          </span>
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
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
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
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
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
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    color: 'var(--modus-wc-color-base-content, #364153)',
                  }}
                >
                  {file.name}
                </span>
                <span
                  className="shrink-0"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                  }}
                >
                  {formatBytes(file.size)}
                </span>
                <button
                  onClick={() => removeFile(file.name)}
                  className="shrink-0 flex items-center justify-center size-5 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <ModusWcIcon
                    name="close"
                    size="xs"
                    decorative
                    style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
                  />
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
            onButtonClick={() => {
              if (files.length > 0) setUploaded(true);
            }}
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
              style={{
                fontSize: 'var(--modus-wc-font-size-lg, 18px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
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
            style={{
              fontSize: 'var(--modus-wc-font-size-lg, 18px)',
              color: 'var(--modus-wc-color-base-content, #101828)',
            }}
          >
            Contact Support
          </span>
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

        {/* Form */}
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1">
            <label
              className="font-medium"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
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
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
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
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
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
            onButtonClick={() => {
              if (canSubmit) setSubmitted(true);
            }}
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

/* ── Expert 6 — Highlight Further Investigation ────────────────── */
/**
 * Hero / Branded header layout (ported from Expert 5 — Design 4).
 *
 * Guides users to possible resolutions when the AI is not confident
 * of an outcome by clearly indicating approaches to investigate further.
 */
export default function Expert6() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes expert6-rainbow-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
      <div
        className="rounded-2xl p-[2px] w-[444px] shrink-0"
        style={{
          background:
            'linear-gradient(90deg, #00D7C0 0%, #009AFE 20%, #4A00FF 40%, #FF2092 60%, #FF00D3 80%, #00D7C0 100%)',
          backgroundSize: '200% 100%',
          animation: 'expert6-rainbow-shimmer 6s linear infinite',
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

          {/* Action buttons */}
          <div
            className="flex gap-3 items-center px-6 pt-5 pb-3"
            style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e5e7eb)' }}
          >
            <ModusWcButton
              size="md"
              color="primary"
              onButtonClick={() => setUploadOpen(true)}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ModusWcIcon name="upload" size="sm" decorative />
                Upload Data
              </span>
            </ModusWcButton>
            <ModusWcButton
              size="md"
              color="tertiary"
              variant="outlined"
              onButtonClick={() => setSupportOpen(true)}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ModusWcIcon name="help_outline" size="sm" decorative />
                Contact Support
              </span>
            </ModusWcButton>
          </div>

          {/* Footer disclaimer */}
          <div className="flex flex-wrap gap-3 items-center px-6 pb-3">
            <div className="flex gap-2 items-center">
              <ModusWcIcon
                name="alert_outline"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
              />
              <span
                className="leading-4"
                style={{
                  fontSize: '10px',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                AI responses depend on available project data
              </span>
            </div>
            <span
              className="leading-4 cursor-pointer hover:underline whitespace-nowrap"
              style={{
                fontSize: '10px',
                color: 'var(--modus-wc-color-status-info, #004f83)',
                fontWeight: 600,
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
    </>
  );
}
