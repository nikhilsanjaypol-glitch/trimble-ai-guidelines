import { useState } from 'react';
import { ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

interface Alternative {
  icon: string;
  title: string;
  description: string;
  tags: string[];
  rationale: string;
  pros: string[];
  nextSteps: string[];
}

const alternatives: Alternative[] = [
  {
    icon: 'layers',
    title: 'Extreme Grade Opportunity',
    description:
      "By increasing the site's northern slope by 2%, you can eliminate the need for a $40k retaining wall, though it will require 10% more fill material.",
    tags: ['Cost-saving', 'Trade-off'],
    rationale:
      'The current design calls for a concrete retaining wall to manage grade differential on the north edge. Re-grading to a 2% slope spreads the elevation change across a longer run, removing the need for structural retention entirely.',
    pros: [
      'Eliminates $40k retaining wall cost',
      'Reduces structural complexity on the north edge',
      'Improves natural drainage along the slope',
      'Fewer specialty contractors required',
    ],
    nextSteps: [
      'Run updated grading calculations for the north boundary',
      'Get a quantity takeoff on the additional fill required',
      'Confirm revised slope meets ADA and drainage code',
    ],
  },
  {
    icon: 'map_outline',
    title: 'Segmental Block Retaining Wall',
    description:
      'Swap the poured concrete wall for a segmental block system to cut material costs by 25% while maintaining the same structural performance.',
    tags: ['Cost-effective', 'Low risk'],
    rationale:
      'Segmental retaining wall systems use dry-stacked interlocking blocks that require no formwork or curing time, reducing both material and labor costs without sacrificing load capacity.',
    pros: [
      'Cuts wall material costs by ~25%',
      'No formwork or concrete curing delays',
      'Easier to phase and adjust during construction',
      'Modular system allows future modifications',
    ],
    nextSteps: [
      'Request segmental block supplier quotes for the required run length',
      'Review geotech report for backfill and compaction requirements',
      'Confirm structural engineer sign-off on block system sizing',
    ],
  },
  {
    icon: 'sync',
    title: 'Cut-Fill Balance Optimization',
    description:
      'Re-sequence the earthwork to balance cut and fill volumes on site, reducing truck haul cycles and saving an estimated $18k in material transport.',
    tags: ['Faster', 'Cost-effective'],
    rationale:
      'Current earthwork is unbalanced — excess cut material is being hauled off while fill is imported from off-site. Re-sequencing operations to use on-site spoils as fill in the low areas eliminates this inefficiency.',
    pros: [
      'Saves ~$18k in haul and import costs',
      'Reduces truck traffic and schedule risk',
      'Lower carbon footprint from reduced haulage',
      'Simplifies logistics with fewer off-site movements',
    ],
    nextSteps: [
      'Run a cut-fill mass haul diagram across the full site',
      'Identify areas where spoil from cut zones can be reused',
      'Update the earthwork sequence in the project schedule',
    ],
  },
  {
    icon: 'lightbulb',
    title: 'Terraced Slope Design',
    description:
      'Break the continuous slope into two terraced levels with a planted berm between them, distributing grade change and creating usable flat areas.',
    tags: ['Innovative', 'Long-term value'],
    rationale:
      'A single steep slope is harder to stabilize, maintain, and landscape. Terracing spreads the grade change into manageable steps, reduces erosion risk, and creates flat platform areas that may add functional value to the site program.',
    pros: [
      'Reduces erosion and long-term maintenance costs',
      'Creates usable flat zones on otherwise steep ground',
      'More visually appealing than a bare slope',
      'Planted berms improve stormwater absorption',
    ],
    nextSteps: [
      'Sketch terrace geometry and verify structural stability',
      'Consult landscape architect on berm planting strategy',
      'Model drainage flow across terraced levels',
    ],
  },
  {
    icon: 'analytics',
    title: 'Geosynthetic Reinforced Embankment',
    description:
      'Use geogrid layers within the embankment fill to steepen the slope angle, reducing the overall footprint by up to 30%.',
    tags: ['Innovative', 'Space-saving'],
    rationale:
      'Unreinforced embankments require a shallow angle to remain stable, consuming significant horizontal space. Geosynthetic reinforcement allows steeper slopes, reclaiming footprint that can be used for building or parking area.',
    pros: [
      'Reclaims up to 30% of embankment footprint',
      'Reduces total fill volume required',
      'Proven technique with well-established design standards',
      'Compatible with most site soil types',
    ],
    nextSteps: [
      'Commission geotechnical analysis for reinforced slope sizing',
      'Get geogrid supplier pricing for the required area',
      'Review local authority requirements for reinforced fills',
    ],
  },
];

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'Cost-saving': {
    bg: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
    text: 'var(--modus-wc-color-status-success, #1e7e34)',
  },
  'Trade-off': {
    bg: 'var(--modus-wc-color-status-warning-light, #fff8e1)',
    text: 'var(--modus-wc-color-status-warning, #856404)',
  },
  'Cost-effective': {
    bg: 'var(--modus-wc-color-primary-light, #e8f4fd)',
    text: 'var(--modus-wc-color-primary, #0063a3)',
  },
  'Low risk': {
    bg: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
    text: 'var(--modus-wc-color-status-success, #1e7e34)',
  },
  Faster: {
    bg: 'var(--modus-wc-color-status-success-light, #e6f4ea)',
    text: 'var(--modus-wc-color-status-success, #1e7e34)',
  },
  Innovative: {
    bg: 'var(--modus-wc-color-secondary-light, #f3f0ff)',
    text: 'var(--modus-wc-color-secondary, #6A6E79)',
  },
  'Long-term value': {
    bg: 'var(--modus-wc-color-status-info-light, #e8f4fd)',
    text: 'var(--modus-wc-color-status-info, #004f83)',
  },
  'Space-saving': {
    bg: 'var(--modus-wc-color-primary-light, #e8f4fd)',
    text: 'var(--modus-wc-color-primary, #0063a3)',
  },
};

function TagPill({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag] ?? {
    bg: 'var(--modus-wc-color-base-100)',
    text: 'var(--modus-wc-color-base-content)',
  };
  return (
    <span
      className="px-2 py-0.5 rounded-full font-medium"
      style={{
        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {tag}
    </span>
  );
}

/* ── Detail Modal ───────────────────────────────────────────────── */
function DetailModal({
  item,
  onClose,
}: {
  item: Alternative;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="rounded-2xl w-[480px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--modus-wc-color-base-page, #fff)' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl shrink-0 size-9"
              style={{ backgroundColor: 'var(--modus-wc-color-primary-light, #e8f4fd)' }}
            >
              <ModusWcIcon
                name={item.icon}
                size="sm"
                decorative
                style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
              />
            </div>
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-lg, 18px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
              }}
            >
              {item.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-7 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
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
          <div className="flex flex-col gap-2">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
            >
              Why consider this?
            </span>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                lineHeight: '1.6',
              }}
            >
              {item.rationale}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
            >
              Key benefits
            </span>
            <div className="flex flex-col gap-1.5">
              {item.pros.map((pro) => (
                <div key={pro} className="flex items-start gap-2">
                  <ModusWcIcon
                    name="check_circle"
                    size="sm"
                    decorative
                    style={{
                      color: 'var(--modus-wc-color-status-success, #1e7e34)',
                      marginTop: '2px',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                      color: 'var(--modus-wc-color-base-content, #171c1e)',
                    }}
                  >
                    {pro}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex flex-col gap-3 p-4 rounded-xl"
            style={{ backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)' }}
          >
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                color: 'var(--modus-wc-color-base-content, #364153)',
              }}
            >
              Suggested next steps
            </span>
            {item.nextSteps.map((step, i) => (
              <div key={step} className="flex items-start gap-2.5">
                <span
                  className="flex items-center justify-center rounded-full shrink-0 font-semibold"
                  style={{
                    width: '20px',
                    height: '20px',
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    backgroundColor: 'var(--modus-wc-color-primary, #0063a3)',
                    color: '#fff',
                    marginTop: '1px',
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                    color: 'var(--modus-wc-color-base-content, #171c1e)',
                  }}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex justify-end px-6 py-4"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <ModusWcButton size="md" color="primary" onButtonClick={onClose}>
            Got it
          </ModusWcButton>
        </div>
      </div>
    </div>
  );
}

/* ── Alternatives List Modal ────────────────────────────────────── */
function AlternativesListModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (item: Alternative) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div
        className="rounded-2xl w-[500px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--modus-wc-color-base-page, #fff)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl shrink-0 size-9"
              style={{ backgroundColor: 'var(--modus-wc-color-primary-light, #e8f4fd)' }}
            >
              <ModusWcIcon
                name="lightbulb"
                size="sm"
                decorative
                style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
              />
            </div>
            <div className="flex flex-col">
              <span
                className="font-semibold"
                style={{
                  fontSize: 'var(--modus-wc-font-size-lg, 18px)',
                  color: 'var(--modus-wc-color-base-content, #101828)',
                }}
              >
                Alternative approaches
              </span>
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                  color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              >
                {alternatives.length} options to explore
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-7 rounded hover:bg-[var(--modus-wc-color-base-200)] transition-colors"
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

        {/* List */}
        <div className="flex flex-col gap-2 px-4 py-4 overflow-y-auto">
          {alternatives.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  'var(--modus-wc-color-base-200, #e0e1e9)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  'var(--modus-wc-color-base-100, #f1f1f6)')
              }
              onClick={() => onSelect(item)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-lg shrink-0 size-8"
                  style={{ backgroundColor: 'var(--modus-wc-color-primary-light, #e8f4fd)' }}
                >
                  <ModusWcIcon
                    name={item.icon}
                    size="sm"
                    decorative
                    style={{ color: 'var(--modus-wc-color-primary, #0063a3)' }}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-semibold"
                      style={{
                        fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                        color: 'var(--modus-wc-color-base-content, #101828)',
                      }}
                    >
                      {item.title}
                    </span>
                    <ModusWcIcon
                      name="chevron_right"
                      size="sm"
                      decorative
                      style={{
                        color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                      color: 'var(--modus-wc-color-base-content-low-contrast, #4a5565)',
                      lineHeight: '1.5',
                    }}
                  >
                    {item.description}
                  </span>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {item.tags.map((tag) => (
                      <TagPill key={tag} tag={tag} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)' }}
        >
          <ModusWcIcon
            name="alert_outline"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)', flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            AI-generated suggestions — review with your team before acting
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Creative 6 — Suggest Alternatives ─────────────────────────── */
interface Creative6Props {
  open?: boolean;
  onClose?: () => void;
}

export default function Creative6({ open = true, onClose }: Creative6Props = {}) {
  const [listOpen, setListOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Alternative | null>(null);

  if (!open) return null;

  const spotlight = alternatives[0];

  function handleSelectFromList(item: Alternative) {
    setListOpen(false);
    setDetailItem(item);
  }

  /* Split the existing description into heading (first sentence) + subtext (rest)
     to match the Figma "key finding + explanation" pattern. */
  const firstSplit = spotlight.description.indexOf(',');
  const heading = firstSplit > 0
    ? spotlight.description.slice(0, firstSplit) + '.'
    : spotlight.description;
  const subtext = firstSplit > 0
    ? spotlight.description.slice(firstSplit + 2)
    : '';

  return (
    <>
      {/* Main card with rainbow gradient border */}
      <div
        className="rounded-2xl p-[2px] shrink-0 relative"
        style={{
          background: TRIMBLE_RAINBOW,
          boxShadow:
            '0px 8px 24px rgba(0,0,0,0.18), 0px 2px 6px rgba(0,0,0,0.1)',
          width: '260px',
        }}
      >
        {/* Dismiss button (floating top-right outside the inner card) */}
        <button
          onClick={() => onClose?.()}
          className="absolute -top-2 -right-2 z-10 flex items-center justify-center size-6 rounded-full transition-transform hover:scale-110"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
          aria-label="Dismiss"
        >
          <ModusWcIcon
            name="close"
            size="xs"
            decorative
            style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6A6E79)' }}
          />
        </button>

        <div
          className="rounded-[14px] flex flex-col w-full overflow-hidden"
          style={{ backgroundColor: 'var(--modus-wc-color-base-page, #fff)' }}
        >
          {/* Top row: TI Logo + High Confidence chip */}
          <div className="flex flex-col px-6 pt-3 pb-2 gap-1">
            <div className="flex items-center justify-between">
              {/* Trimble AI logo */}
              <span className="flex items-center justify-center" style={{ width: '30px', height: '30px' }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 30.002 32.6797"
                  fill="none"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="trimbleAiLogo"
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
                  <path
                    d="M1.69824 24.9697C3.48353 26.9109 5.82653 28.2524 8.4043 28.8096L1.69824 32.6797V24.9697ZM10.6523 5.60742C16.5357 5.60742 21.3057 10.3803 21.3057 16.2676C21.3055 22.1547 16.5356 26.9268 10.6523 26.9268C4.76928 26.9265 0.00017177 22.1545 0 16.2676C0 10.3805 4.76918 5.60766 10.6523 5.60742ZM10.6523 7.69238C5.9201 7.69263 2.08398 11.5321 2.08398 16.2676C2.08416 21.0029 5.92021 24.8416 10.6523 24.8418C15.3847 24.8418 19.2215 21.003 19.2217 16.2676C19.2217 11.532 15.3848 7.69238 10.6523 7.69238ZM30.002 16.3398L23.2803 20.2217C24.0854 17.7019 24.0922 14.9945 23.2998 12.4707L30.002 16.3398ZM8.35547 3.83691C5.79861 4.40439 3.47535 5.73916 1.69824 7.66309V0L8.35547 3.83691Z"
                    fill="url(#trimbleAiLogo)"
                  />
                </svg>
              </span>

              {/* High Confidence chip */}
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-[var(--modus-wc-color-base-100)]"
                style={{
                  border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
                  backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
                }}
              >
                <ModusWcIcon
                  name="add"
                  size="xs"
                  decorative
                  style={{ color: 'var(--modus-wc-color-base-content, #252a2e)' }}
                />
                <span
                  className="font-semibold"
                  style={{
                    fontSize: 'var(--modus-wc-font-size-xs, 12px)',
                    color: 'var(--modus-wc-color-base-content, #252a2e)',
                    letterSpacing: '0.1px',
                  }}
                >
                  High Confidence
                </span>
              </button>
            </div>
            <span
              className="text-right"
              style={{
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                lineHeight: '16px',
              }}
            >
              5 minute ago
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2 px-6 pb-3">
            <p
              className="font-semibold"
              style={{
                fontSize: '16px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                lineHeight: '24px',
                wordBreak: 'break-word',
              }}
            >
              {heading}
            </p>
            <p
              style={{
                fontSize: '12px',
                color: 'rgba(143, 143, 143, 1)',
                lineHeight: '20px',
                wordBreak: 'break-word',
              }}
            >
              {subtext}
            </p>
          </div>

          {/* CTA — aligned with content above */}
          <div className="px-6 pb-5">
            <ModusWcButton
              size="md"
              color="primary"
              style={{
                width: '100%',
                display: 'block',
                ['--modus-wc-color-primary' as string]:
                  'var(--modus-wc-color-base-100, #f1f1f6)',
              } as React.CSSProperties}
              onButtonClick={() => setListOpen(true)}
            >
              View Other Alternatives
            </ModusWcButton>
          </div>
        </div>
      </div>

      {/* Alternatives list modal */}
      {listOpen && (
        <AlternativesListModal
          onClose={() => setListOpen(false)}
          onSelect={handleSelectFromList}
        />
      )}

      {/* Detail modal */}
      {detailItem && (
        <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}
    </>
  );
}
