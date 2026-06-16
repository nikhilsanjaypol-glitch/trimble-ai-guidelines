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

const ESCALATION_MESSAGE =
  'If these persist, loop in your engineering team to verify the coordinate systems.';

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
          <div className="flex flex-col items-center gap-2 px-6 py-6 text-center">
            <div
              className="flex items-center justify-center rounded-full size-10"
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
              style={{
                fontSize: '15px',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
            >
              Data uploaded successfully
            </span>
            <span
              style={{
                fontSize: '13px',
                lineHeight: '18px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              }}
            >
              Your project data has been received. The AI will use it to refine
              its investigation suggestions.
            </span>
          </div>
          <div
            className="flex justify-end px-6 py-3"
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
          <div className="flex flex-col items-center gap-2 px-6 py-6 text-center">
            <div
              className="flex items-center justify-center rounded-full size-10"
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
              style={{
                fontSize: '15px',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
            >
              Message sent
            </span>
            <span
              style={{
                fontSize: '13px',
                lineHeight: '18px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
              }}
            >
              Our team will be in touch within 24 hours.
            </span>
          </div>
          <div
            className="flex justify-end px-6 py-3"
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
        <div className="flex flex-col gap-3 px-6 py-4">
          <ModusWcTextInput
            value={name}
            placeholder="Your name"
            onInputChange={(e: CustomEvent) => setName(e.detail?.target?.value || '')}
          />
          <ModusWcTextInput
            value={email}
            placeholder="you@company.com"
            type="email"
            onInputChange={(e: CustomEvent) => setEmail(e.detail?.target?.value || '')}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Describe your issue..."
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
 * Soft Amber design — warm warning header that signals low confidence
 * without a heavy color block. Body explains the possible causes and
 * suggests escalating to a human teammate. Contact Support is the
 * primary action because the guideline is about routing the user
 * outside AI; Upload Data is the secondary alternate path.
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
        className="rounded-2xl p-[2px] w-[400px] shrink-0"
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
          {/* Soft Amber header */}
          <div
            className="flex gap-3 items-start px-6 pt-5 pb-4"
            style={{ backgroundColor: '#fff9ef' }}
          >
            <div
              className="flex items-center justify-center rounded-[10px] shrink-0 size-10"
              style={{ backgroundColor: '#fff', border: '1px solid #f3c870' }}
            >
              <ModusWcIcon
                name="alert_outline"
                size="md"
                decorative
                style={{ color: '#b88217' }}
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span
                className="font-semibold"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#b88217',
                  marginBottom: '4px',
                }}
              >
                Low confidence
              </span>
              <span
                className="font-semibold"
                style={{
                  fontSize: '22px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  color: 'var(--modus-wc-color-base-content, #101828)',
                }}
              >
                Explore possible causes
              </span>
              <span
                style={{
                  fontSize: '13px',
                  lineHeight: '20px',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                  marginTop: '2px',
                }}
              >
                {CONTEXT.scope} · {CONTEXT.modelsReviewed} models reviewed
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 px-6 pt-4 pb-4">
            {/* Possible causes */}
            <div className="flex flex-col gap-2">
              <span
                className="font-semibold"
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                }}
              >
                Possible causes
              </span>
              <ul
                className="flex flex-col gap-1.5 m-0 pl-0"
                style={{ listStyle: 'none' }}
              >
                {possibleCauses.map((cause) => (
                  <li
                    key={cause}
                    className="flex items-start gap-2"
                    style={{
                      fontSize: '14px',
                      lineHeight: '22px',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    <span
                      aria-hidden
                      className="shrink-0"
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '9999px',
                        backgroundColor:
                          'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                        marginTop: '10px',
                      }}
                    />
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested next step — direct the user outside of AI */}
            <div
              className="flex flex-col gap-2 p-3 rounded-lg"
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
              }}
            >
              <span
                className="font-semibold flex items-center gap-1.5"
                style={{
                  fontSize: '13px',
                  lineHeight: '18px',
                  color: 'var(--modus-wc-color-primary, #0063a3)',
                }}
              >
                <ModusWcIcon
                  name="lightbulb_on"
                  size="xs"
                  decorative
                  style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
                />
                Suggested next step
              </span>
              <p
                style={{
                  fontSize: '13px',
                  lineHeight: '20px',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                }}
              >
                {ESCALATION_MESSAGE}
              </p>
            </div>
          </div>

          {/* Action buttons — Contact Support primary, Upload Data secondary */}
          <div
            className="flex gap-3 items-center px-6 py-4"
            style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e5e7eb)' }}
          >
            <ModusWcButton
              size="md"
              color="tertiary"
              variant="outlined"
              onButtonClick={() => setUploadOpen(true)}
              style={{ flex: 1, width: '100%' }}
            >
              <span
                className="flex items-center justify-center gap-1.5"
                style={{ whiteSpace: 'nowrap' }}
              >
                <ModusWcIcon name="upload" size="sm" decorative />
                Upload Data
              </span>
            </ModusWcButton>
            <ModusWcButton
              size="md"
              color="primary"
              onButtonClick={() => setSupportOpen(true)}
              style={{ flex: 1, width: '100%' }}
            >
              <span
                className="flex items-center justify-center gap-1.5"
                style={{ whiteSpace: 'nowrap' }}
              >
                <ModusWcIcon name="help_outline" size="sm" decorative />
                Contact Support
              </span>
            </ModusWcButton>
          </div>
        </div>
      </div>

      {/* Modals */}
      {uploadOpen && <UploadDataModal onClose={() => setUploadOpen(false)} />}
      {supportOpen && <ContactSupportModal onClose={() => setSupportOpen(false)} />}
    </>
  );
}
