import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
   Creative 8 — Give professionals control
   Scenario: a surveyor pans the project map and taps the AI marker
   pinned at BM-104. The AI opens a Field Observation card showing
   the photo it just captured at this monument, alongside a draft
   form with the most likely fields prefilled — Project, Issue type,
   Responsible party, Severity, Description.

   The surveyor stays in control: every field is editable, the photo
   is shown alongside the data so they can verify it, and nothing is
   filed until they confirm.
   ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

/* AI's prefilled draft for this observation. */
type Severity = 'low' | 'medium' | 'high';

const AI_OBSERVATION = {
  capturedAt: 'Jun 02 · 14:32',
  coords: '41.205°N · 105.412°W',
  fields: {
    project: 'Pine Ridge Tract 12-A — Boundary & Topo',
    issueType: 'Damaged monument cap',
    responsible: 'Field Maintenance · S. Reyes',
    severity: 'medium' as Severity,
    description:
      'BM-104 cap chipped at NE corner. Visual ID compromised. GNSS sky view still 92% — recommend a re-set or replacement cap before final corner shots.',
  },
};

/* Dropdown choice lists — every AI prefilled value is the first
   option, with reasonable alternatives the surveyor can pick from. */
const PROJECT_OPTIONS = [
  'Pine Ridge Tract 12-A — Boundary & Topo',
  'Pine Ridge Tract 11 — Boundary',
  'Cedar Hollow Subdivision · Phase 2',
  'Mountain View Realignment',
  'Rocky Bluff Topographic Survey',
];

const ISSUE_OPTIONS = [
  'Damaged monument cap',
  'Encroachment on parcel',
  'Missing marker',
  'Boundary discrepancy',
  'Vegetation obstruction',
  'Out-of-tolerance control',
];

const RESPONSIBLE_OPTIONS = [
  'Field Maintenance · S. Reyes',
  'Survey Lead · J. Marquez',
  'Project Manager · A. Khan',
  'Office Drafting Team',
  'Property Owner — coordinate via PM',
];

/* Captured photo — minimal SVG mock (no external image dependency).
   Soft outdoor scene with a tilted, slightly-damaged concrete
   benchmark monument as the subject, framed slightly wider so the
   subject doesn't dominate the frame. */
function CapturedPhoto() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="cp-bg-8" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4ccd3" />
          <stop offset="42%" stopColor="#a59883" />
          <stop offset="100%" stopColor="#766955" />
        </linearGradient>
        {/* Steel rod — silver with a left-side highlight via gradient. */}
        <linearGradient id="cp-rod-8" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#dadcde" />
          <stop offset="50%" stopColor="#9aa0a6" />
          <stop offset="100%" stopColor="#5a5e62" />
        </linearGradient>
        {/* Tag face — light tan concrete / aluminum, matches the
            previous monument styling so the BM-104 plate reads the
            same as before. */}
        <linearGradient id="cp-mon-8" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ddd6c8" />
          <stop offset="100%" stopColor="#a39884" />
        </linearGradient>
      </defs>

      {/* Sky → ground gradient */}
      <rect width="320" height="200" fill="url(#cp-bg-8)" />

      {/* Distant tree line */}
      <path
        d="M 0 78 Q 40 68 80 76 T 160 72 T 240 78 T 320 74 L 320 92 L 0 92 Z"
        fill="#5a6b48"
        opacity="0.7"
      />
      <path
        d="M 0 96 Q 60 90 120 94 T 240 92 T 320 96 L 320 110 L 0 110 Z"
        fill="#4a5e3c"
        opacity="0.45"
      />

      {/* Survey monument — a steel rebar rod driven into the ground
          with a brass benchmark cap fixed to the top. Framed wide so
          the entire cap and rod are visible in the photo. */}
      <g transform="translate(160 178)">
        {/* Ground shadow under the monument */}
        <ellipse cx="0" cy="6" rx="30" ry="5" fill="rgba(20,28,16,0.4)" />
        {/* Disturbed dirt mound at base of rod */}
        <ellipse cx="0" cy="3" rx="24" ry="4" fill="#5a4830" opacity="0.7" />
        <ellipse cx="-9" cy="2" rx="6" ry="2" fill="#3a2c18" opacity="0.6" />
        <ellipse cx="10" cy="3" rx="5" ry="1.5" fill="#3a2c18" opacity="0.55" />

        {/* Steel rod (rebar) */}
        <rect
          x="-3"
          y="-50"
          width="6"
          height="58"
          fill="url(#cp-rod-8)"
          stroke="#3a3d3f"
          strokeWidth="0.4"
        />
        {/* Bright vertical highlight */}
        <line
          x1="-1.7"
          y1="-50"
          x2="-1.7"
          y2="6"
          stroke="#ebedef"
          strokeWidth="0.8"
          opacity="0.7"
        />
        {/* Rust streaks along the rod */}
        <line x1="-3" y1="-30" x2="3" y2="-30" stroke="#7a4d2d" strokeWidth="0.5" opacity="0.55" />
        <line x1="-3" y1="-12" x2="3" y2="-12" stroke="#7a4d2d" strokeWidth="0.5" opacity="0.45" />
        <line x1="-3" y1="2" x2="3" y2="2" stroke="#7a4d2d" strokeWidth="0.4" opacity="0.4" />

        {/* Tag — square benchmark plate fixed to the top of the rod.
            Same visual styling as the previous monument: light tan
            concrete face, damaged top corner, engraved survey cross,
            and the BM-104 inscription. Slightly tilted for realism. */}
        <g transform="translate(0 -52) rotate(-4)">
          {/* Drop shadow under the tag */}
          <rect
            x="-19"
            y="-13"
            width="38"
            height="28"
            fill="rgba(20,20,20,0.35)"
            transform="translate(1 1.5)"
            rx="1.2"
          />
          {/* Tag face */}
          <rect
            x="-19"
            y="-13"
            width="38"
            height="28"
            fill="url(#cp-mon-8)"
            stroke="#5a554a"
            strokeWidth="0.8"
            rx="1.2"
          />
          {/* Damaged top-right corner (chipped) */}
          <polygon
            points="-19,-13 -3,-15 19,-12 19,-10 -19,-10"
            fill="#36383e"
            opacity="0.78"
          />
          {/* Survey cross mark */}
          <line x1="-4" y1="0" x2="4" y2="0" stroke="#2a2f38" strokeWidth="1.4" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="#2a2f38" strokeWidth="1.4" />
          {/* Engraved label */}
          <text
            x="0"
            y="11"
            fontSize="4"
            fill="#3a3f48"
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            BM-104
          </text>
        </g>
      </g>

      {/* Foliage details */}
      <ellipse cx="80" cy="172" rx="14" ry="3" fill="rgba(60,82,42,0.4)" />
      <ellipse cx="245" cy="174" rx="18" ry="3" fill="rgba(60,82,42,0.4)" />
      <ellipse cx="40" cy="186" rx="22" ry="2" fill="rgba(30,44,20,0.32)" />
      <ellipse cx="280" cy="188" rx="18" ry="2" fill="rgba(30,44,20,0.32)" />
    </svg>
  );
}

/* Compact form row — small uppercase label + an editable input slot. */
function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="font-semibold"
        style={{
          fontSize: '10px',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/* Three-pill severity selector. */
/* Custom dropdown — fully manual UI rendered through a Portal so it
   escapes the card's overflow:hidden. All colors are hardcoded to
   light-mode values so the popup looks identical regardless of the
   user's OS color scheme (the native <select> popup on macOS/Win
   ignores `color-scheme: light` on dark systems and renders dark). */
function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Recalculate the popup position from the trigger's bounding box.
  // Flip above the trigger if there isn't enough room below.
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const desiredHeight = Math.min(options.length * 34 + 8, 220);
      const spaceBelow = window.innerHeight - rect.bottom;
      const flip = spaceBelow < desiredHeight + 12 && rect.top > desiredHeight + 12;
      setPos({
        top: flip ? rect.top - desiredHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };
    reposition();
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(t) &&
        popupRef.current &&
        !popupRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, options.length]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '6px 28px 6px 10px',
          minHeight: '30px',
          border: open ? '1px solid #0063A7' : '1px solid #cbd2d9',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          fontSize: '13px',
          fontFamily: 'inherit',
          color: '#171c1e',
          cursor: 'pointer',
          textAlign: 'left',
          position: 'relative',
          transition: 'border-color 120ms ease',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#171c1e',
          }}
        >
          {value}
        </span>
        <ModusWcIcon
          name="expand_more"
          size="xs"
          decorative
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#6a6e79',
          }}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={popupRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              backgroundColor: '#ffffff',
              color: '#171c1e',
              border: '1px solid #cbd2d9',
              borderRadius: '6px',
              boxShadow:
                '0 12px 28px rgba(15,23,42,0.18), 0 4px 8px rgba(15,23,42,0.08)',
              zIndex: 10000,
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px',
              colorScheme: 'light',
            }}
          >
            {options.map((opt) => {
              const selected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt);
                    setOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = selected
                      ? 'rgba(0,99,167,0.14)'
                      : 'rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selected
                      ? 'rgba(0,99,167,0.08)'
                      : 'transparent';
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '7px 10px',
                    border: 'none',
                    borderRadius: '4px',
                    background: selected ? 'rgba(0,99,167,0.08)' : 'transparent',
                    fontSize: '13px',
                    color: '#171c1e',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

// @ts-expect-error — kept for future use; remove when wired up
function SeverityPills({
  value,
  onChange,
}: {
  value: Severity | null;
  onChange: (v: Severity) => void;
}) {
  const options: Severity[] = ['low', 'medium', 'high'];
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              padding: '5px 10px',
              borderRadius: '6px',
              border: selected
                ? '1px solid var(--modus-wc-color-primary, #0063A7)'
                : '1px solid var(--modus-wc-color-base-200, #cbd2d9)',
              backgroundColor: selected
                ? 'var(--modus-wc-color-primary, #0063A7)'
                : 'var(--modus-wc-color-base-page, #fff)',
              color: selected ? '#ffffff' : 'var(--modus-wc-color-base-content, #171c1e)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 120ms ease, border-color 120ms ease',
              textTransform: 'capitalize',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* Field Observation card — replaces the methodology note. Photo on
   top, AI-prefilled form below. Surveyor reviews / edits / files. */
function FieldObservation({ onClose }: { onClose: () => void }) {
  // Two-state card: collapsed shows just the photo + a single CTA;
  // Form is shown by default with all AI-prefilled values. The
  // surveyor reviews / edits via the dropdowns and then files.
  const [project, setProject] = useState(AI_OBSERVATION.fields.project);
  const [issueType, setIssueType] = useState(AI_OBSERVATION.fields.issueType);
  const [responsible, setResponsible] = useState(AI_OBSERVATION.fields.responsible);
  const [severity, setSeverity] = useState<Severity | null>(
    AI_OBSERVATION.fields.severity,
  );
  const [description, setDescription] = useState(AI_OBSERVATION.fields.description);
  const [filed, setFiled] = useState(false);

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid var(--modus-wc-color-base-200, #cbd2d9)',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    color: 'var(--modus-wc-color-base-content, #171c1e)',
    backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
    outline: 'none',
    transition: 'border-color 120ms ease',
  };

  return (
    <div
      style={{
        width: '360px',
        maxHeight: 'calc(100vh - 80px)',
        overflowY: 'auto',
        backgroundColor: 'var(--modus-wc-color-base-100, #ffffff)',
        borderRadius: '12px',
        boxShadow: '0 16px 36px rgba(15,23,42,0.18), 0 4px 10px rgba(15,23,42,0.08)',
        border: '1px solid var(--modus-wc-color-base-200, #e3e6ec)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--modus-wc-color-base-200, #eef0f4)',
        }}
      >
        <div
          className="font-semibold"
          style={{
            fontSize: '17px',
            color: 'var(--modus-wc-color-base-content, #101828)',
            lineHeight: 1.2,
          }}
        >
          Field observation
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            borderRadius: '6px',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ModusWcIcon
            name="close"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content, #364153)' }}
          />
        </button>
      </div>

      {/* Photo */}
      <div style={{ position: 'relative', backgroundColor: '#1a1f24' }}>
        <div style={{ height: '140px', width: '100%' }}>
          <CapturedPhoto />
        </div>
      </div>

      {/* Form — always visible. Description sits at the top directly
          beneath the photo so the surveyor first reads (and edits)
          the AI's narrative, then verifies the structured metadata
          via dropdowns below. Every field is the AI's draft; clicks
          let the surveyor swap any value. */}
      <div className="flex flex-col gap-2" style={{ padding: '12px 16px' }}>
        <FormRow label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              ...inputBase,
              resize: 'vertical',
              lineHeight: 1.4,
            }}
          />
        </FormRow>
        <FormRow label="Project">
          <Dropdown
            value={project}
            options={PROJECT_OPTIONS}
            onChange={setProject}
          />
        </FormRow>
        <FormRow label="Issue type">
          <Dropdown
            value={issueType}
            options={ISSUE_OPTIONS}
            onChange={setIssueType}
          />
        </FormRow>
        <FormRow label="Responsible party">
          <Dropdown
            value={responsible}
            options={RESPONSIBLE_OPTIONS}
            onChange={setResponsible}
          />
        </FormRow>
        <FormRow label="Severity">
          <Dropdown
            value={
              severity
                ? severity.charAt(0).toUpperCase() + severity.slice(1)
                : 'Medium'
            }
            options={['Low', 'Medium', 'High']}
            onChange={(v) => setSeverity(v.toLowerCase() as Severity)}
          />
        </FormRow>
      </div>

      {/* Footer — Save draft (grey) + Submit (primary → green when
          filed). Both rendered as native <button>s so they share the
          exact same padding and height. */}
      <div
        className="flex items-center justify-end gap-2"
        style={{
          padding: '10px 16px 12px',
          borderTop: '1px solid var(--modus-wc-color-base-200, #eef0f4)',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="creative8-saveDraft-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 14px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            lineHeight: 1,
            transition: 'background-color 120ms ease, transform 80ms ease',
          }}
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (filed) return;
            setFiled(true);
            setTimeout(onClose, 1100);
          }}
          disabled={filed}
          aria-label={filed ? 'Submitted' : 'Submit'}
          className="creative8-submit-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: filed
              ? 'var(--modus-wc-color-success, #1e8a44)'
              : 'var(--modus-wc-color-primary, #0063A7)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: filed ? 'default' : 'pointer',
            lineHeight: 1,
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            transition: 'background-color 200ms ease, transform 80ms ease',
          }}
        >
          {filed && (
            <ModusWcIcon
              name="check"
              size="xs"
              decorative
              style={{ pointerEvents: 'none' }}
            />
          )}
          <span style={{ pointerEvents: 'none' }}>
            {filed ? 'Submitted' : 'Submit'}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Trimble AI logo — the lockup used across the Creative/Expert hosts.
   Rendered inside the pulsing marker's white core.
   ───────────────────────────────────────────────────────────────── */

// @ts-expect-error — kept for future use; remove when wired up
function TrimbleAiLogo({
  size = 22,
  mono = false,
}: {
  size?: number;
  mono?: boolean;
}) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: `${size}px`, height: `${size}px`, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 30.002 32.6797"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {!mono && (
          <defs>
            <linearGradient
              id="tlogo-8"
              x1="3.7558"
              y1="10.5251"
              x2="20.4332"
              y2="30.2565"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FF2BFC" />
              <stop offset="0.628993" stopColor="#0563A7" />
              <stop offset="1" stopColor="#075CA4" />
            </linearGradient>
          </defs>
        )}
        <path
          d="M1.69824 24.9697C3.48353 26.9109 5.82653 28.2524 8.4043 28.8096L1.69824 32.6797V24.9697ZM10.6523 5.60742C16.5357 5.60742 21.3057 10.3803 21.3057 16.2676C21.3055 22.1547 16.5356 26.9268 10.6523 26.9268C4.76928 26.9265 0.00017177 22.1545 0 16.2676C0 10.3805 4.76918 5.60766 10.6523 5.60742ZM10.6523 7.69238C5.9201 7.69263 2.08398 11.5321 2.08398 16.2676C2.08416 21.0029 5.92021 24.8416 10.6523 24.8418C15.3847 24.8418 19.2215 21.003 19.2217 16.2676C19.2217 11.532 15.3848 7.69238 10.6523 7.69238ZM30.002 16.3398L23.2803 20.2217C24.0854 17.7019 24.0922 14.9945 23.2998 12.4707L30.002 16.3398ZM8.35547 3.83691C5.79861 4.40439 3.47535 5.73916 1.69824 7.66309V0L8.35547 3.83691Z"
          fill={mono ? '#ffffff' : 'url(#tlogo-8)'}
        />
      </svg>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Pulsing rainbow marker — the entry point.
   Visually identical to the Creative 6 / SiteScene "AI insight"
   marker: a 36px solid rainbow orb with a small white sparkle icon
   inside, plus two filled rainbow gradient pulse rings that expand
   outward. Wrapped in a 68×68 transparent button so the whole halo
   is clickable.
   ───────────────────────────────────────────────────────────────── */

function Marker({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  const HIT_SIZE = 68;
  const ORB_SIZE = 36;

  // Centered absolute positioning helpers shared by orb + pulse rings.
  const centerStack: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: `${ORB_SIZE}px`,
    height: `${ORB_SIZE}px`,
    marginTop: `-${ORB_SIZE / 2}px`,
    marginLeft: `-${ORB_SIZE / 2}px`,
    borderRadius: '50%',
    pointerEvents: 'none',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close AI field observation' : 'Open AI field observation'}
      aria-expanded={open}
      className="creative8-marker"
      style={{
        position: 'relative',
        width: `${HIT_SIZE}px`,
        height: `${HIT_SIZE}px`,
        padding: 0,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {/* Pulse rings — rainbow border only, transparent center.
          A radial-gradient mask hollows out the inside so each ring
          reads as an outline that expands and fades. */}
      {!open && (
        <>
          <span
            aria-hidden="true"
            style={{
              ...centerStack,
              background: TRIMBLE_RAINBOW,
              WebkitMaskImage:
                'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 3px))',
              maskImage:
                'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 3px))',
              opacity: 0.85,
              animation: 'creative8-rainbow-pulse 1.8s ease-out infinite',
              zIndex: 1,
            }}
          />
          <span
            aria-hidden="true"
            style={{
              ...centerStack,
              background: TRIMBLE_RAINBOW,
              WebkitMaskImage:
                'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 3px))',
              maskImage:
                'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 3px))',
              opacity: 0.85,
              animation: 'creative8-rainbow-pulse 1.8s ease-out 0.9s infinite',
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Marker orb — rainbow border around a white core. The camera
          icon sits inside the white center, drawn in Modus primary
          blue so it reads cleanly against white. */}
      <span
        aria-hidden="true"
        className="creative8-orb"
        style={{
          ...centerStack,
          background: TRIMBLE_RAINBOW,
          boxShadow: '0 4px 12px rgba(74,0,255,0.28), 0 2px 4px rgba(0,0,0,0.12)',
          transform: open ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.18s ease',
          zIndex: 2,
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: '1.5px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 4l-1.4 2H4a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 4 20h16a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 20 6h-3.6L15 4H9zm3 4.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
              fill="var(--modus-wc-color-primary, #0063A7)"
            />
          </svg>
        </span>
      </span>

      <style>{`
        @keyframes creative8-rainbow-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(2.4); opacity: 0;    }
        }
        .creative8-marker:hover .creative8-orb {
          transform: scale(1.08);
        }
      `}</style>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Interactive site-plan map — the full-canvas background
   Pan: drag · Zoom: scroll wheel · Reset: button
   World coordinates are SVG coordinates. Marker + note overlay in
   screen space, anchored to the AI's recommended primary control
   monument (BM-104).
   ───────────────────────────────────────────────────────────────── */

/* The original 2400×1600 site plan is wrapped in a translate(800 600)
   group so the surveyed parcel sits in the bottom-right of the larger
   canvas. BM_104 is the position inside that group (original design
   coords); PRIMARY_CONTROL_WORLD is the same point in absolute world
   coords — used by the marker overlay outside the SVG. */
const SHIFT_X = 800;
const SHIFT_Y = 600;
const BM_104 = { x: 1080, y: 360 };
const PRIMARY_CONTROL_WORLD = { x: BM_104.x + SHIFT_X, y: BM_104.y + SHIFT_Y };

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const INITIAL_ZOOM = 0.65;

const PARCEL_POLYGON =
  '520,340 1080,360 1180,560 1140,840 660,900 440,720 400,500';

const SECONDARY_CONTROLS = [
  { id: 'BM-208', x: 460, y: 760, label: 'BM-208', sub: 'SW iron pin' },
  { id: 'CP-201', x: 1240, y: 580, label: 'CP-201', sub: 'Road mon.' },
  { id: 'CP-302', x: 800, y: 600, label: 'CP-302', sub: 'Interior' },
];

/* Expansive canvas (3200×2200 world units) styled like Google Maps'
   default Terrain layer. The original 2400×1600 site plan (parcel,
   roads, BM-104, etc.) is wrapped in a translate(SHIFT_X SHIFT_Y)
   group so it sits in the bottom-right of the larger canvas. The
   top + left bands are filled with new terrain (Mountain View State
   Forest, Mirror Lake, Stonegate village, Old Forest Rd) so the
   surveyor can pan north / west to see the broader area before
   zeroing in on the field site. */
function SitePlan() {
  return (
    <svg
      width="3200"
      height="2200"
      viewBox="0 0 3200 2200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Soft hill-shading fill */}
        <radialGradient id="hill8" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(184,158,115,0.16)" />
          <stop offset="100%" stopColor="rgba(184,158,115,0)" />
        </radialGradient>

        {/* Forest fill — soft pale green */}
        <linearGradient id="forest8" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cfe5c5" />
          <stop offset="100%" stopColor="#bbd6ad" />
        </linearGradient>

        {/* Water — pale blue with soft top-light */}
        <linearGradient id="water8" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bcdcec" />
          <stop offset="100%" stopColor="#a8cee0" />
        </linearGradient>

        {/* Drop shadow for buildings (very subtle, Google-like) */}
        <filter id="bldShadow8" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Base land ─────────────────────────────────────────────── */}
      <rect x="0" y="0" width="3200" height="2200" fill="#f5f1e6" />

      {/* ─────────────────────────────────────────────────────────────
          NORTH / WEST EXPANSION — terrain up-and-to-the-left of the
          surveyed area. Drawn in absolute world coordinates so it
          lives outside the translate group below.
          ───────────────────────────────────────────────────────────── */}

      {/* Hill shading — northern ridge + western foothills */}
      <ellipse cx="1300" cy="180" rx="1000" ry="380" fill="url(#hill8)" />
      <ellipse cx="2700" cy="280" rx="700" ry="320" fill="url(#hill8)" />
      <ellipse cx="280" cy="1300" rx="500" ry="700" fill="url(#hill8)" />
      <ellipse cx="500" cy="780" rx="600" ry="380" fill="url(#hill8)" />

      {/* Contour lines — northern band + western band */}
      {[
        'M -20 80 Q 600 40 1200 100 T 2200 120 T 3220 100',
        'M -20 200 Q 600 160 1200 220 T 2200 240 T 3220 220',
        'M -20 320 Q 600 280 1200 340 T 2200 360 T 3220 340',
        'M -20 440 Q 600 400 1200 460 T 2200 480 T 3220 460',
        'M 60 660 Q 200 880 240 1100 T 320 1500 T 380 1900',
        'M 180 700 Q 320 920 360 1140 T 440 1540 T 500 1960',
        'M 300 720 Q 440 960 480 1180 T 560 1580 T 620 1980',
      ].map((d, i) => (
        <path
          key={`exp-contour-${i}`}
          d={d}
          stroke="#b89e73"
          strokeWidth="0.8"
          fill="none"
          opacity="0.42"
        />
      ))}

      {/* Mountain View State Forest — large forested area in the NW */}
      <path
        d="M 0 0 L 540 0 L 720 100 L 800 280 L 760 460 L 580 540 L 380 520 L 200 440 L 0 360 Z"
        fill="url(#forest8)"
      />
      {/* Northern ridge forest band */}
      <path
        d="M 1100 0 L 1480 0 L 1700 60 L 1820 180 L 1880 320 L 1740 440 L 1480 480 L 1240 420 L 1080 280 L 1080 100 Z"
        fill="url(#forest8)"
      />
      {/* North-east forest patch — Cedar Ridge */}
      <path
        d="M 2380 0 L 2820 0 L 3060 80 L 3200 220 L 3200 460 L 2980 520 L 2740 460 L 2520 360 L 2400 220 L 2380 80 Z"
        fill="url(#forest8)"
      />
      {/* Western forest band — flanks the parcel on the west */}
      <path
        d="M 0 760 L 240 740 L 380 880 L 420 1080 L 380 1280 L 280 1480 L 160 1620 L 0 1640 Z"
        fill="url(#forest8)"
      />
      {/* Lower-left forest */}
      <path
        d="M 0 1860 L 220 1840 L 380 1960 L 420 2120 L 320 2200 L 0 2200 Z"
        fill="url(#forest8)"
      />

      {/* Tree clusters scattered across the new area */}
      {[
        { x: 920, y: 200, r: 22 },
        { x: 1980, y: 240, r: 18 },
        { x: 2160, y: 320, r: 14 },
        { x: 580, y: 360, r: 22 },
        { x: 700, y: 460, r: 16 },
        { x: 980, y: 460, r: 18 },
        { x: 480, y: 1080, r: 20 },
        { x: 540, y: 1380, r: 24 },
        { x: 360, y: 1560, r: 16 },
        { x: 480, y: 1740, r: 18 },
        { x: 720, y: 1880, r: 22 },
        { x: 600, y: 2080, r: 14 },
        { x: 220, y: 2080, r: 18 },
      ].map((t, i) => (
        <circle key={`exp-grove-${i}`} cx={t.x} cy={t.y} r={t.r} fill="#bdd5af" />
      ))}

      {/* Mirror Lake — water body in the upper-left */}
      <ellipse cx="400" cy="280" rx="200" ry="120" fill="url(#water8)" />
      <ellipse cx="400" cy="280" rx="200" ry="120" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      <text x="400" y="284" fontSize="13" fontStyle="italic" fontWeight="600" fill="#4f7e96" textAnchor="middle">
        Mirror Lake
      </text>

      {/* Mirror Brook — flows south from Mirror Lake toward the survey area */}
      <path
        d="M 540 360 Q 580 540 540 740 T 580 1100 T 660 1480 T 760 1900"
        stroke="url(#water8)"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 540 360 Q 580 540 540 740 T 580 1100 T 660 1480 T 760 1900"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <text x="510" y="1240" fontSize="10" fontStyle="italic" fontWeight="600" fill="#4f7e96" transform="rotate(80 510 1240)">
        Mirror Brook
      </text>

      {/* Old Forest Rd — north-south rural road from Stonegate down to Hwy 41 */}
      <path
        d="M 1200 0 Q 1240 200 1180 480 T 1100 880 T 1080 1200"
        stroke="#cccccc"
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 1200 0 Q 1240 200 1180 480 T 1100 880 T 1080 1200"
        stroke="#ffffff"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
      />
      <text x="1140" y="640" fontSize="11" fontWeight="600" fill="#5a5f67" fontStyle="italic" transform="rotate(86 1140 640)">
        Old Forest Rd
      </text>

      {/* Stonegate — small village cluster in the upper-center */}
      {[
        { x: 1140, y: 360, w: 56, h: 40 },
        { x: 1220, y: 400, w: 44, h: 30 },
        { x: 1180, y: 440, w: 48, h: 32 },
        { x: 1100, y: 420, w: 40, h: 28 },
        { x: 1240, y: 460, w: 52, h: 36 },
      ].map((b, i) => (
        <rect
          key={`exp-bld-${i}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill="#ebe8e0"
          stroke="#c8c4b8"
          strokeWidth="1"
          filter="url(#bldShadow8)"
        />
      ))}
      <text x="1180" y="340" fontSize="13" fontWeight="600" fill="#666" letterSpacing="1" textAnchor="middle">
        Stonegate
      </text>
      <text x="1180" y="356" fontSize="10" fill="#888" letterSpacing="0.5" textAnchor="middle">
        Pop. 86
      </text>

      {/* Place labels for the new area */}
      <text x="240" y="200" fontSize="14" fontWeight="600" fill="#5a7048" letterSpacing="1.5">
        MOUNTAIN VIEW
      </text>
      <text x="240" y="220" fontSize="11" fill="#5a7048" letterSpacing="1">
        STATE FOREST
      </text>
      <text x="2680" y="240" fontSize="14" fontWeight="600" fill="#5a7048" letterSpacing="1.5">
        CEDAR RIDGE
      </text>
      <text x="180" y="1180" fontSize="13" fontWeight="600" fill="#666" letterSpacing="1">
        Pine Hollow
      </text>
      <text x="180" y="1200" fontSize="10" fill="#888" letterSpacing="0.5">
        Conservation Area
      </text>

      {/* ─────────────────────────────────────────────────────────────
          ORIGINAL SURVEYED AREA — shifted +800 / +600 so the parcel
          sits in the bottom-right. All coordinates inside this group
          are in the original 2400×1600 design space.
          ───────────────────────────────────────────────────────────── */}
      <g transform={`translate(${SHIFT_X} ${SHIFT_Y})`}>
        {/* Hill shading — three soft mounds (original) */}
        <ellipse cx="1850" cy="420" rx="700" ry="500" fill="url(#hill8)" />
        <ellipse cx="500" cy="1280" rx="800" ry="540" fill="url(#hill8)" />
        <ellipse cx="2200" cy="1300" rx="500" ry="380" fill="url(#hill8)" />

        {/* Contour lines */}
        {[
          'M -20 240 Q 400 200 800 280 T 1700 320 T 2420 280',
          'M -20 380 Q 460 340 880 420 T 1780 460 T 2420 440',
          'M -20 520 Q 520 480 940 560 T 1850 600 T 2420 600',
          'M -20 680 Q 480 640 920 720 T 1820 780 T 2420 780',
          'M -20 1100 Q 520 1060 980 1140 T 1860 1180 T 2420 1180',
          'M -20 1260 Q 540 1220 1000 1300 T 1900 1320 T 2420 1340',
          'M -20 1420 Q 560 1380 1020 1460 T 1920 1480 T 2420 1480',
        ].map((d, i) => (
          <path
            key={`contour-${i}`}
            d={d}
            stroke="#b89e73"
            strokeWidth="0.8"
            fill="none"
            opacity="0.42"
          />
        ))}

        {/* Forest / park patches */}
        <path
          d="M 0 60 L 360 40 L 460 220 L 380 380 L 220 420 L 40 360 L 0 280 Z"
          fill="url(#forest8)"
        />
        <path
          d="M 1500 100 L 1880 60 L 2200 140 L 2380 280 L 2400 460 L 2200 500 L 1900 420 L 1620 360 L 1500 240 Z"
          fill="url(#forest8)"
        />
        <path
          d="M 0 880 L 240 860 L 360 1020 L 280 1160 L 100 1180 L 0 1100 Z"
          fill="url(#forest8)"
        />
        <path
          d="M 1880 880 L 2200 860 L 2400 980 L 2400 1240 L 2160 1280 L 1980 1180 L 1880 1040 Z"
          fill="url(#forest8)"
        />

        {/* Tree clusters */}
        {[
          { x: 280, y: 480, r: 26 },
          { x: 220, y: 580, r: 18 },
          { x: 320, y: 540, r: 14 },
          { x: 1380, y: 520, r: 22 },
          { x: 1560, y: 560, r: 16 },
          { x: 360, y: 1240, r: 20 },
          { x: 480, y: 1300, r: 14 },
          { x: 2080, y: 540, r: 22 },
          { x: 2200, y: 700, r: 26 },
          { x: 1820, y: 1080, r: 18 },
          { x: 2120, y: 1100, r: 20 },
        ].map((t, i) => (
          <circle key={`grove-${i}`} cx={t.x} cy={t.y} r={t.r} fill="#bdd5af" />
        ))}

        {/* Pine Creek */}
        <path
          d="M -40 1340 Q 240 1280 460 1380 T 880 1440 T 1320 1400 Q 1620 1360 1880 1460 T 2440 1500"
          stroke="url(#water8)"
          strokeWidth="34"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M -40 1340 Q 240 1280 460 1380 T 880 1440 T 1320 1400 Q 1620 1360 1880 1460 T 2440 1500"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <text x="540" y="1330" fontSize="13" fontStyle="italic" fontWeight="600" fill="#4f7e96">
          Pine Creek
        </text>

        {/* Small pond on the right */}
        <ellipse cx="2200" cy="1380" rx="80" ry="48" fill="url(#water8)" />
        <ellipse cx="2200" cy="1380" rx="80" ry="48" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />

        {/* State Hwy 41 — east-west, with yellow casing + white core */}
        <g transform="rotate(-2 1200 410)">
          <rect x="-40" y="386" width="2480" height="48" fill="#f4b400" />
          <rect x="-40" y="394" width="2480" height="32" fill="#ffffff" />
          {Array.from({ length: 32 }).map((_, i) => (
            <rect
              key={`hwy-line-${i}`}
              x={-20 + i * 80}
              y={408}
              width="40"
              height="4"
              fill="#f4b400"
              opacity="0.85"
            />
          ))}
        </g>
        {/* Highway shield */}
        <g transform="translate(2100 360)">
          <rect x="-22" y="-16" width="44" height="32" rx="6" fill="#ffffff" stroke="#3a3f48" strokeWidth="1.5" />
          <text x="0" y="2" fontSize="9" fontWeight="800" fill="#3a3f48" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace">
            STATE
          </text>
          <text x="0" y="13" fontSize="11" fontWeight="800" fill="#3a3f48" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace">
            41
          </text>
        </g>

        {/* Local road — Lincoln Lane heading south, casing+core */}
        <path
          d="M 760 400 Q 800 600 720 800 T 660 1180 T 700 1500"
          stroke="#cccccc"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 760 400 Q 800 600 720 800 T 660 1180 T 700 1500"
          stroke="#ffffff"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <text
          x="700"
          y="1100"
          fontSize="11"
          fontWeight="600"
          fill="#5a5f67"
          fontStyle="italic"
          transform="rotate(82 700 1100)"
        >
          Lincoln Ln
        </text>

        {/* Dirt access path */}
        <path
          d="M 660 880 Q 980 1000 1300 980 T 1820 920"
          stroke="#a89878"
          strokeWidth="6"
          strokeDasharray="4 6"
          fill="none"
        />

        {/* Buildings */}
        {[
          { x: 700, y: 280, w: 60, h: 44 },
          { x: 1340, y: 740, w: 80, h: 56 },
          { x: 160, y: 740, w: 50, h: 36 },
          { x: 240, y: 820, w: 40, h: 28 },
          { x: 2020, y: 760, w: 70, h: 50 },
          { x: 2080, y: 1080, w: 56, h: 40 },
          { x: 540, y: 1340, w: 44, h: 30 },
          { x: 1740, y: 480, w: 52, h: 36 },
        ].map((b, i) => (
          <rect
            key={`bld-${i}`}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill="#ebe8e0"
            stroke="#c8c4b8"
            strokeWidth="1"
            filter="url(#bldShadow8)"
          />
        ))}

        {/* Place labels */}
        <text x="2080" y="640" fontSize="13" fontWeight="600" fill="#666" letterSpacing="1">
          Pine Ridge
        </text>
        <text x="2080" y="660" fontSize="10" fill="#888" letterSpacing="0.5">
          Unincorporated
        </text>

        {/* ───── SURVEY OVERLAY ───── */}

        {/* Subject parcel — yellow fill, red dashed boundary */}
        <polygon
          points={PARCEL_POLYGON}
          fill="rgba(242,201,76,0.22)"
          stroke="#c73838"
          strokeWidth="3"
          strokeDasharray="10 5"
        />

        {/* Parcel corner ticks */}
        {PARCEL_POLYGON.split(' ').map((p) => {
          const [x, y] = p.split(',').map(Number);
          return (
            <g key={`corner-${x}-${y}`}>
              <circle cx={x} cy={y} r="5" fill="#fff" stroke="#c73838" strokeWidth="2" />
            </g>
          );
        })}

        {/* Bearing/distance labels */}
        <g>
          <rect x="772" y="320" width="148" height="20" rx="3" fill="rgba(255,255,255,0.92)" stroke="rgba(199,56,56,0.35)" strokeWidth="1" />
          <text x="780" y="335" fontSize="10" fontWeight="700" fill="#7a1f1f" fontFamily="ui-monospace, SFMono-Regular, monospace">
            N 87°12' E · 560.4 ft
          </text>
        </g>
        <g transform="rotate(72 1240 500)">
          <rect x="1232" y="486" width="148" height="20" rx="3" fill="rgba(255,255,255,0.92)" stroke="rgba(199,56,56,0.35)" strokeWidth="1" />
          <text x="1240" y="500" fontSize="10" fontWeight="700" fill="#7a1f1f" fontFamily="ui-monospace, SFMono-Regular, monospace">
            S 14°08' E · 412.6 ft
          </text>
        </g>

        {/* Parcel label */}
        <text x="780" y="600" fontSize="26" fontWeight="800" fill="rgba(74,32,32,0.55)" textAnchor="middle" letterSpacing="3">
          TRACT 12-A
        </text>
        <text x="780" y="624" fontSize="11" fontWeight="600" fill="rgba(74,32,32,0.6)" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, monospace">
          12.4 AC · PINE RIDGE SUBDIVISION
        </text>

        {/* Secondary control points */}
        {SECONDARY_CONTROLS.map((cp) => (
          <g key={cp.id}>
            <circle cx={cp.x} cy={cp.y} r="14" fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
            <polygon
              points={`${cp.x},${cp.y - 9} ${cp.x - 8},${cp.y + 6} ${cp.x + 8},${cp.y + 6}`}
              fill="#ffffff"
              stroke="#3a3f48"
              strokeWidth="1.5"
            />
            <circle cx={cp.x} cy={cp.y} r="1.8" fill="#3a3f48" />
            <rect
              x={cp.x + 14}
              y={cp.y - 14}
              width="76"
              height="28"
              rx="4"
              fill="rgba(255,255,255,0.96)"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="1"
            />
            <text x={cp.x + 22} y={cp.y - 2} fontSize="10" fontWeight="800" fill="#1f242c" fontFamily="ui-monospace, SFMono-Regular, monospace">
              {cp.label}
            </text>
            <text x={cp.x + 22} y={cp.y + 10} fontSize="9" fill="rgba(60,70,90,0.85)" fontFamily="ui-monospace, SFMono-Regular, monospace">
              {cp.sub}
            </text>
          </g>
        ))}

        {/* Primary control BM-104 — where the AI marker anchors */}
        <g>
          <circle
            cx={BM_104.x}
            cy={BM_104.y}
            r={140}
            fill="rgba(0,99,167,0.08)"
            stroke="rgba(0,99,167,0.4)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <rect x={BM_104.x + 86} y={BM_104.y - 122} width="138" height="20" rx="3" fill="rgba(255,255,255,0.92)" />
          <text
            x={BM_104.x + 92}
            y={BM_104.y - 107}
            fontSize="10"
            fontWeight="700"
            fill="#0063a3"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            GNSS sky view · 92%
          </text>
          <circle cx={BM_104.x} cy={BM_104.y} r="22" fill="rgba(255,255,255,0.85)" />
          <rect
            x={BM_104.x - 11}
            y={BM_104.y - 11}
            width="22"
            height="22"
            fill="#ffffff"
            stroke="#0063a3"
            strokeWidth="2"
          />
          <line
            x1={BM_104.x - 7}
            y1={BM_104.y - 7}
            x2={BM_104.x + 7}
            y2={BM_104.y + 7}
            stroke="#0063a3"
            strokeWidth="2"
          />
          <line
            x1={BM_104.x + 7}
            y1={BM_104.y - 7}
            x2={BM_104.x - 7}
            y2={BM_104.y + 7}
            stroke="#0063a3"
            strokeWidth="2"
          />
          <rect x={BM_104.x - 60} y={BM_104.y + 30} width="120" height="34" rx="4" fill="rgba(255,255,255,0.96)" stroke="rgba(0,99,167,0.45)" strokeWidth="1" />
          <text
            x={BM_104.x}
            y={BM_104.y + 46}
            fontSize="11"
            fontWeight="800"
            fill="#0a3a5a"
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            BM-104
          </text>
          <text
            x={BM_104.x}
            y={BM_104.y + 58}
            fontSize="9"
            fill="rgba(10,58,90,0.85)"
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            14,237.92 E · 5,892.18 N
          </text>
        </g>
      </g>

      {/* North arrow — top-right */}
      <g transform="translate(3100 110)">
        <circle cx="0" cy="0" r="28" fill="rgba(255,255,255,0.95)" stroke="#3a3f48" strokeWidth="1.2" />
        <polygon points="0,-20 8,8 0,2 -8,8" fill="#b3261e" />
        <polygon points="0,20 8,-8 0,-2 -8,-8" fill="#3a3f48" />
        <text x="0" y="-32" fontSize="11" fontWeight="800" fill="#3a3f48" textAnchor="middle">
          N
        </text>
      </g>

      {/* Scale bar — bottom-left */}
      <g transform="translate(60 2140)">
        <rect x="-6" y="-6" width="200" height="44" rx="3" fill="rgba(255,255,255,0.92)" />
        <rect x="0" y="0" width="46" height="8" fill="#1f242c" />
        <rect x="46" y="0" width="46" height="8" fill="#ffffff" stroke="#1f242c" strokeWidth="1" />
        <rect x="92" y="0" width="46" height="8" fill="#1f242c" />
        <rect x="138" y="0" width="46" height="8" fill="#ffffff" stroke="#1f242c" strokeWidth="1" />
        <text x="0" y="26" fontSize="10" fontWeight="700" fill="#1f242c">0</text>
        <text x="92" y="26" fontSize="10" fontWeight="700" fill="#1f242c" textAnchor="middle">100 ft</text>
        <text x="184" y="26" fontSize="10" fontWeight="700" fill="#1f242c" textAnchor="middle">200 ft</text>
      </g>
    </svg>
  );
}

// @ts-expect-error — kept for future use; remove when wired up
function MapControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  const btnStyle: React.CSSProperties = {
    width: '34px',
    height: '34px',
    background: 'var(--modus-wc-color-base-page, #fff)',
    border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  };
  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={onZoomIn} style={btnStyle} aria-label="Zoom in">
        <ModusWcIcon name="add" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content, #364153)' }} />
      </button>
      <button type="button" onClick={onZoomOut} style={btnStyle} aria-label="Zoom out">
        <ModusWcIcon name="remove" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content, #364153)' }} />
      </button>
      <button type="button" onClick={onReset} style={btnStyle} aria-label="Reset view">
        <ModusWcIcon name="compass" size="sm" decorative style={{ color: 'var(--modus-wc-color-base-content, #364153)' }} />
      </button>
      <div
        className="flex items-center justify-center font-semibold"
        style={{
          ...btnStyle,
          cursor: 'default',
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

function TitleBlock() {
  return (
    <div
      className="rounded-lg px-3 py-2 flex flex-col gap-0.5"
      style={{
        background: 'var(--modus-wc-color-base-page, #fff)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          letterSpacing: '0.3px',
        }}
      >
        FIELD SHEET F-100 · BOUNDARY &amp; TOPO
      </span>
      <span
        className="font-semibold"
        style={{
          fontSize: 'var(--modus-wc-font-size-sm, 14px)',
          color: 'var(--modus-wc-color-base-content, #101828)',
        }}
      >
        Pine Ridge Tract 12-A — Survey
      </span>
      <span
        style={{
          fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
        }}
      >
        1 : 1000 · NAD 83 (2011) · State Plane CO Central
      </span>
    </div>
  );
}

// @ts-expect-error — kept for future use; remove when wired up
function ControlsHint() {
  return (
    <div
      className="rounded-md px-3 py-1.5 flex items-center gap-3"
      style={{
        background: 'rgba(20, 24, 32, 0.78)',
        backdropFilter: 'blur(6px)',
        color: '#ffffff',
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        lineHeight: 1.4,
        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      }}
    >
      <span><strong>Drag</strong> — pan</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span><strong>Scroll</strong> — zoom</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span><strong>Tap marker</strong> — open methodology</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Default export — Map canvas + pulsing marker → Methodology Note
   The map fills the viewport. The marker is pinned to BM-104 in
   world space and stays anchored as the map pans/zooms.
   ───────────────────────────────────────────────────────────────── */

export default function Creative8() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, didMove: false });

  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1200,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  // Track viewport size so the FieldObservation card can clamp its
  // position — it has to fit on-screen even when expanded so the user
  // never has to scroll to reach the form or the commit buttons.
  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Center on BM-104 on first mount.
  useEffect(() => {
    if (initialized) return;
    const el = containerRef.current;
    if (!el) return;
    setPan({
      x: el.clientWidth / 2 - PRIMARY_CONTROL_WORLD.x * INITIAL_ZOOM,
      y: el.clientHeight / 2 - PRIMARY_CONTROL_WORLD.y * INITIAL_ZOOM,
    });
    setInitialized(true);
  }, [initialized]);

  const markerScreen = {
    x: PRIMARY_CONTROL_WORLD.x * zoom + pan.x,
    y: PRIMARY_CONTROL_WORLD.y * zoom + pan.y,
  };

  /* FieldObservation card position (clamped to viewport).
     ── Card is always at full height (header + 140px photo +
        Description textarea + 3 dropdowns + Severity pills + footer).
        Reserving the full height on open so the card never has to
        scroll within the viewport. */
  const CARD_EXPANDED_HEIGHT = 580;
  const CARD_WIDTH = 360;
  const VIEWPORT_PADDING = 24;
  const idealCardLeft = markerScreen.x + 38;
  // Open well above the marker so the expanded form has plenty of
  // room below — no scrolling required to reach the commit buttons.
  const idealCardTop = markerScreen.y - 280;
  const maxCardLeft = Math.max(
    VIEWPORT_PADDING,
    viewport.w - CARD_WIDTH - VIEWPORT_PADDING,
  );
  const maxCardTop = Math.max(
    VIEWPORT_PADDING,
    viewport.h - CARD_EXPANDED_HEIGHT - VIEWPORT_PADDING,
  );
  const cardLeft = Math.max(
    VIEWPORT_PADDING,
    Math.min(idealCardLeft, maxCardLeft),
  );
  const cardTop = Math.max(
    VIEWPORT_PADDING,
    Math.min(idealCardTop, maxCardTop),
  );
  // Endpoint for the rainbow connector line — anchor at the vertical
  // middle of the card's left edge so the line draws as a clear
  // leader from the marker into the card.
  const connectorEndY = cardTop + CARD_EXPANDED_HEIGHT / 2;

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setDragging(true);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      didMove: false,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (!dragRef.current.didMove && Math.hypot(dx, dy) > 3) {
      dragRef.current.didMove = true;
    }
    setPan({
      x: dragRef.current.panX + dx,
      y: dragRef.current.panY + dy,
    });
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragging) return;
    setDragging(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  }

  function handleWheel(e: React.WheelEvent) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    if (newZoom === zoom) return;
    const wx = (mx - pan.x) / zoom;
    const wy = (my - pan.y) / zoom;
    setPan({ x: mx - wx * newZoom, y: my - wy * newZoom });
    setZoom(newZoom);
  }

  // @ts-expect-error — kept for future use; remove when wired up
  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, z * 1.2));
  }
  // @ts-expect-error — kept for future use; remove when wired up
  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, z / 1.2));
  }
  // @ts-expect-error — kept for future use; remove when wired up
  function resetView() {
    const el = containerRef.current;
    if (!el) return;
    setZoom(INITIAL_ZOOM);
    setPan({
      x: el.clientWidth / 2 - PRIMARY_CONTROL_WORLD.x * INITIAL_ZOOM,
      y: el.clientHeight / 2 - PRIMARY_CONTROL_WORLD.y * INITIAL_ZOOM,
    });
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#e9ecf2',
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Pan/zoomed map content */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      >
        <SitePlan />
      </div>

      {/* Connector line from marker to opened card. Sits below the
          marker (zIndex 5) so the orb covers the line origin — the
          line reads as trailing out of the marker and landing near
          the card's top-left corner. */}
      {open && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <defs>
            <linearGradient id="rainbowLine8" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D7C0" />
              <stop offset="33%" stopColor="#009AFE" />
              <stop offset="55%" stopColor="#4A00FF" />
              <stop offset="78%" stopColor="#FF2092" />
              <stop offset="100%" stopColor="#FF00D3" />
            </linearGradient>
          </defs>
          {/* Faint white underlay so the line stays legible over busy
              terrain without becoming its own visual element. */}
          <line
            x1={markerScreen.x}
            y1={markerScreen.y}
            x2={cardLeft}
            y2={connectorEndY}
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.45"
          />
          <line
            x1={markerScreen.x}
            y1={markerScreen.y}
            x2={cardLeft}
            y2={connectorEndY}
            stroke="url(#rainbowLine8)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.95"
          />
        </svg>
      )}

      {/* Marker — anchored to BM-104's projected screen position.
          Pointer events on this wrapper are stopped so they never
          reach the outer pan handler. didMove is also reset so a
          stale flag from a prior canvas drag can't suppress the
          click. */}
      <div
        style={{
          position: 'absolute',
          left: markerScreen.x,
          top: markerScreen.y,
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          dragRef.current.didMove = false;
        }}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <Marker open={open} onClick={() => setOpen((o) => !o)} />
      </div>

      {/* Field observation card — opens beside the marker, but is
          clamped within the viewport so the expanded form never
          requires the user to scroll. */}
      {open && (
        <div
          style={{
            position: 'absolute',
            left: cardLeft,
            top: cardTop,
            zIndex: 20,
            animation: 'creative8-fade-in 0.2s ease-out',
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <FieldObservation onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Title block — top-left */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      >
        <TitleBlock />
      </div>

      <style>{`
        @keyframes creative8-fade-in {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
        .creative8-submit-btn:not(:disabled):hover {
          background-color: var(--modus-wc-color-primary-hover, #0066cc);
        }
        .creative8-submit-btn:not(:disabled):active {
          transform: scale(0.98);
        }
        .creative8-submit-btn:focus-visible {
          outline: 2px solid var(--modus-wc-color-primary, #0063A7);
          outline-offset: 2px;
        }
        .creative8-saveDraft-btn:hover {
          background-color: #d1d5db;
        }
        .creative8-saveDraft-btn:active {
          transform: scale(0.98);
        }
        .creative8-saveDraft-btn:focus-visible {
          outline: 2px solid #9aa0a6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
