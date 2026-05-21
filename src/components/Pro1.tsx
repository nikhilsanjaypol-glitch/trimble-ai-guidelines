import { useState } from 'react';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 1 — INTEGRATE WITH PROFESSIONAL TOOLS
 *
 * To allow professionals to work with AI as equals.
 *
 * Exemplar: the host professional tool's PROPERTIES INSPECTOR for
 * an AI-generated structural beam. The AI's output is presented
 * exactly the same way the tool presents any object the engineer
 * drew themselves — a typed name, a category, fully editable
 * geometry & material fields. The only difference is a small
 * "AI" provenance chip. That's the guideline made literal:
 * AI outputs arrive as native, editable objects inside the
 * familiar toolset, not as static PDFs/PNGs.
 * ───────────────────────────────────────────────────────────────── */

function BeamGlyph({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="2.5" rx="0.4" fill={color} />
      <rect x="3" y="15.5" width="18" height="2.5" rx="0.4" fill={color} />
      <rect x="10.75" y="8.5" width="2.5" height="7" fill={color} opacity="0.75" />
    </svg>
  );
}

interface FieldDef {
  label: string;
  value: string;
  /** When set, the field renders with a dropdown caret to signal it's a selector. */
  dropdown?: boolean;
  /** Optional suffix shown inside the input (e.g. units). */
  suffix?: string;
}

interface SectionDef {
  title: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    title: 'Geometry',
    fields: [
      { label: 'Length', value: '6 200', suffix: 'mm' },
      { label: 'Section', value: 'W18 × 35', dropdown: true },
      { label: 'Rotation', value: '0', suffix: '°' },
    ],
  },
  {
    title: 'Material',
    fields: [
      { label: 'Grade', value: 'S355', dropdown: true },
      { label: 'Coating', value: 'Hot-dip galv.', dropdown: true },
    ],
  },
];

/* ── Editable field that looks like a native CAD/BIM property ──── */
function PropertyField({
  field,
  initial,
}: {
  field: FieldDef;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <label className="flex items-center gap-3">
      <span
        className="shrink-0"
        style={{
          width: '88px',
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          lineHeight: '20px',
        }}
      >
        {field.label}
      </span>
      <span
        className="flex-1 flex items-center gap-1.5"
        style={{
          height: '28px',
          padding: '0 8px',
          borderRadius: 'var(--modus-wc-border-radius-md, 6px)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          backgroundColor: 'var(--modus-wc-color-base-page, #ffffff)',
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-0 outline-none bg-transparent"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 13px)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            border: 'none',
            padding: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        {field.suffix && (
          <span
            className="shrink-0"
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            {field.suffix}
          </span>
        )}
        {field.dropdown && (
          <ModusWcIcon
            name="expand_more"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
          />
        )}
      </span>
    </label>
  );
}

/* ── Pro 1 — Integrate with Professional Tools ─────────────────── */
export default function Pro1() {
  return (
    <div
      className="bg-white rounded-xl flex flex-col"
      style={{
        width: '320px',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow:
          '0px 8px 24px -6px rgba(16,24,40,0.10), 0px 2px 6px -2px rgba(16,24,40,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Object header — identical layout to any native object inspector */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
      >
        <div
          className="flex items-center justify-center shrink-0 rounded-md"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
          }}
        >
          <BeamGlyph color="var(--modus-wc-color-base-content, #171c1e)" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span
            className="font-semibold truncate"
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '18px',
            }}
          >
            Beam-W18
          </span>
          <span
            className="truncate"
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '16px',
            }}
          >
            Steel Wide-Flange · Level 02
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 shrink-0 font-semibold"
          style={{
            height: '20px',
            padding: '0 8px',
            borderRadius: '1000px',
            backgroundColor: '#f1eafe',
            color: '#4a00ff',
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            letterSpacing: '0.02em',
          }}
        >
          <ModusWcIcon name="sparkle" size="xs" decorative />
          AI
        </span>
      </div>

      {/* Editable property sections — same UI as any native object */}
      <div className="flex flex-col gap-3 px-4 pt-3 pb-3">
        {SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-1.5">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {section.title}
            </span>
            <div className="flex flex-col gap-1.5">
              {section.fields.map((field) => (
                <PropertyField key={field.label} field={field} initial={field.value} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer — the principle, stated plainly */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          backgroundColor: 'var(--modus-wc-color-base-100, #f8f9fa)',
        }}
      >
        <ModusWcIcon
          name="edit"
          size="xs"
          decorative
          style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
        />
        <span
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            lineHeight: '16px',
          }}
        >
          Editable like any native object
        </span>
      </div>
    </div>
  );
}
