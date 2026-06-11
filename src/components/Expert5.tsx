import { useState } from 'react';
import { ModusWcButton, ModusWcIcon, ModusWcTextInput } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

/* ── Connect to Support Modal ──────────────────────────────────── */
function ConnectSupportModal({ onClose }: { onClose: () => void }) {
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
              Our support team will be in touch within 24 hours.
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
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <span
            className="font-semibold"
            style={{ fontSize: 'var(--modus-wc-font-size-lg, 18px)', color: 'var(--modus-wc-color-base-content, #101828)' }}
          >
            Connect to Support
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-6 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
            aria-label="Close"
          >
            <ModusWcIcon name="close" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }} />
          </button>
        </div>

        <style>{`
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
              How can we help?
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe what you were trying to do..."
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
 * Direct, transparent limitations response.
 *
 * Instead of listing technical data gaps, this design simply
 * acknowledges the request and hands the user off to a human.
 */
export default function Expert5() {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <div
        className="rounded-2xl p-[2px] shrink-0"
        style={{
          width: '640px',
          background: TRIMBLE_RAINBOW,
          boxShadow:
            '0px 12px 32px -8px rgba(255, 32, 146, 0.16), 0px 6px 14px -4px rgba(74, 0, 255, 0.12)',
        }}
      >
        <div className="bg-white rounded-[14px] flex flex-col items-center gap-7 px-12 py-12 w-full">
          <p
            className="text-center"
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: 'var(--modus-wc-color-base-content, #364153)',
              maxWidth: '460px',
              margin: 0,
            }}
          >
            That sounds like an interesting case! I&apos;m sorry I can&apos;t help you, but reach out
            to further support here.
          </p>

          <ModusWcButton
            size="lg"
            color="primary"
            onButtonClick={() => setSupportOpen(true)}
          >
            <span className="flex items-center gap-2">
              <span className="font-semibold" style={{ fontSize: '15px' }}>
                Connect to Support
              </span>
              <ModusWcIcon name="person" size="sm" decorative />
            </span>
          </ModusWcButton>
        </div>
      </div>

      {supportOpen && <ConnectSupportModal onClose={() => setSupportOpen(false)} />}
    </>
  );
}
