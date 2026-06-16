import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* Pro 3 - BE TRAINABLE, CONTEXT AND DOMAIN AWARE
 *
 * To ensure relevance & usefulness.
 *
 * AI must be able to apply the same constraints, templates, and
 * domain-specific knowledge that a professional would, in order to
 * provide relevant or professionally useful outputs. This includes
 * context around specific project, client, or industry requirements.
 *
 * Composition: a 3D viewer application shell.
 *  - Top toolbar of modeling tools and Save.
 *  - Left rail of icon tabs (model / layers / share).
 *  - "Model Management" panel listing layers; toggling a layer hides
 *    the matching geometry in the 3D scene.
 *  - Center: interactive Three.js viewport (orbit / pan / zoom) with a
 *    realistic civil-engineering earthworks site - an excavator at
 *    work, a magenta wetland-buffer no-dig zone with trees and a
 *    pond, material stockpiles, and a GNSS survey rover.
 *  - "Source Documentation" tab: shows the project files for the
 *    selected layer, the active source citation with the relevant
 *    clause highlighted, the Project / Client / Industry context
 *    pillars driving the layer, the compliance checklist, and the
 *    object calculations.
 */

/* Restricted-zone fill colour. Vivid red sits in a hue family that
 * the rainbow AI marker (cyan / blue / purple / magenta / pink) does
 * not cover, so the marker pops sharply against the polygon. Red
 * also reads as the universal "no-dig / restricted" semantic. The
 * source-citation accents (file rail, SOURCE badge, highlight mark)
 * stay coordinated with the zone via this single constant. */
const ZONE_ALERT = '#DC2626';

/* Trimble brand rainbow used for the AI marker's orb fill, pulse rings,
 * and AIInsightPopup border. Kept identical to Creative 8 so every AI
 * artifact in the app shares the same diagonal gradient. */
const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

/* World-space anchor for the pulsing AI marker (and the popup
 * stem-point). Offset slightly off-pond-centre so the marker reads
 * as a fresh focal point in the camera-right direction rather than
 * sitting dead-on the water. */
const MARKER_ANCHOR = new THREE.Vector3(10, 1.4, 6.5);

type LayerId = 'excavator' | 'wetland' | 'stockpiles' | 'survey';

interface Layer {
  id: LayerId;
  name: string;
  color: string;
  source?: string;
  insight?: string;
}

const LAYERS: Layer[] = [
  {
    id: 'excavator',
    name: 'Excavator (CAT 336)',
    color: '#F2B100',
    source: 'Excavator_GNSS_Tolerance_Specs.pdf',
    insight:
      'GNSS positioning tolerance for the CAT 336 is +/- 25 mm horizontal, +/- 35 mm vertical. Verify the dual-antenna receiver is bonded before grading adjacent to protected zones.',
  },
  {
    id: 'wetland',
    name: 'Wetland Buffer (No-Dig)',
    color: ZONE_ALERT,
    source: 'Environmental_Mitigation_Policy.pdf',
    insight:
      'This wetland buffer is a designated no-dig zone per the environmental impact study. Excavation, drilling, drone flight, and material staging are prohibited inside the highlighted polygon.',
  },
  {
    id: 'stockpiles',
    name: 'Material Stockpiles',
    color: '#A07840',
  },
  {
    id: 'survey',
    name: 'GNSS Survey Rover',
    color: '#2D6FB8',
    source: 'Equipment_Pre-Start_Checklist.pdf',
    insight:
      'Verify tribrach level, antenna height (1.300 m), receiver fix quality (RTK Fixed), and base-rover radio link before logging any control point.',
  },
];

const FILES = [
  'Excavator_GNSS_Tolerance_Specs.pdf',
  'Error_Detection_Template.pdf',
  'Environmental_Mitigation_Policy.pdf',
  'Equipment_Pre-Start_Checklist.pdf',
];

/* ----- Workflow data: pillars, citations, compliance ----- */

type ContextScope = 'project' | 'client' | 'industry';

interface ContextChip {
  scope: ContextScope;
  label: string;
}

interface CitationDetail {
  page: string;
  excerpt: string;
  highlight: string;
}

interface LayerWorkflow {
  pillars: ContextChip[];
}

const CONTEXT_COLORS: Record<
  ContextScope,
  { bg: string; fg: string; dot: string }
> = {
  project: { bg: '#e6f1fa', fg: '#0a5d96', dot: '#0063A7' },
  client: { bg: '#efeaf9', fg: '#5b3aaf', dot: '#7C3AED' },
  industry: { bg: '#e3f4ec', fg: '#0a6d49', dot: '#0F8F5B' },
};

const CONTEXT_LABEL: Record<ContextScope, string> = {
  project: 'Project',
  client: 'Client',
  industry: 'Industry',
};

const LAYER_WORKFLOWS: Record<LayerId, LayerWorkflow> = {
  wetland: {
    pillars: [
      { scope: 'project', label: 'Cedar Hills Phase 2' },
      { scope: 'client', label: 'Acme Construction' },
      { scope: 'industry', label: 'EPA Section 404' },
    ],
  },
  excavator: {
    pillars: [
      { scope: 'project', label: 'Cedar Hills Phase 2' },
      { scope: 'client', label: 'Acme Fleet Standard' },
      { scope: 'industry', label: 'CAT 336 Spec' },
    ],
  },
  stockpiles: {
    pillars: [
      { scope: 'project', label: 'Earthworks Plan' },
      { scope: 'client', label: 'Acme Logistics' },
      { scope: 'industry', label: 'OSHA 1926.250' },
    ],
  },
  survey: {
    pillars: [
      { scope: 'project', label: 'Control Network' },
      { scope: 'client', label: 'Acme QA Procedure' },
      { scope: 'industry', label: 'ISO 17123' },
    ],
  },
};

const FILE_CITATIONS: Record<string, CitationDetail> = {
  'Environmental_Mitigation_Policy.pdf': {
    page: 'Section 3.2 / Page 12',
    excerpt:
      'All designated wetland buffers shall be treated as no-dig zones. Excavation, drilling, drone overflight, and material staging within the polygon boundary are strictly prohibited under federal Section 404 wetland protections.',
    highlight: 'no-dig zones',
  },
  'Excavator_GNSS_Tolerance_Specs.pdf': {
    page: 'Table 4.1 / Page 18',
    excerpt:
      'GNSS positioning tolerance for the CAT 336 class excavator is plus or minus 25 mm horizontal and plus or minus 35 mm vertical. The dual-antenna receiver must be bonded and verified before grading operations adjacent to protected zones.',
    highlight: 'plus or minus 25 mm horizontal and plus or minus 35 mm vertical',
  },
  'Equipment_Pre-Start_Checklist.pdf': {
    page: 'Sheet B / Page 4',
    excerpt:
      'Before logging any control point, verify tribrach level, antenna height (1.300 m), receiver fix quality (RTK Fixed), and base-rover radio link integrity. Repeat the verification at every shift change.',
    highlight: 'antenna height (1.300 m)',
  },
  'Error_Detection_Template.pdf': {
    page: 'Appendix A / Page 22',
    excerpt:
      'Flag positional drift greater than 0.040 m or signal loss exceeding 5 seconds and abort logging until the base-rover link is re-established.',
    highlight: 'positional drift greater than 0.040 m',
  },
};

const TOOL_ICONS: { name: string; label: string }[] = [
  { name: 'cursor', label: 'Select' },
  { name: 'move', label: 'Move' },
  { name: 'undo', label: 'Undo' },
  { name: 'redo', label: 'Redo' },
  { name: 'save_disk', label: 'Save' },
  { name: 'apps', label: 'Applications' },
  { name: 'cube', label: '3D model' },
  { name: 'visibility_on', label: 'Visibility' },
];

type LayerVisibility = Record<LayerId, boolean>;

const ALL_VISIBLE: LayerVisibility = {
  excavator: true,
  wetland: true,
  stockpiles: true,
  survey: true,
};

interface SceneRefs {
  zone: THREE.Group;
  excavator: THREE.Group;
  stockpiles: THREE.Group;
  survey: THREE.Group;
}

type RailTab = 'model' | 'source' | 'share';

/* ============================================================== */
/* Sub-components                                                  */
/* ============================================================== */

function TopToolbar() {
  return (
    <div
      style={{
        height: 48,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '0 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e1e9',
      }}
    >
      <ToolbarButton icon="chevron_left" label="Back" />
      <div style={{ width: 14 }} />
      {TOOL_ICONS.map((t) => (
        <ToolbarButton key={t.label} icon={t.name} label={t.label} />
      ))}
      <div style={{ flex: 1 }} />
    </div>
  );
}

function ToolbarButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      style={{
        width: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        color: '#171c1e',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f1f1f6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <ModusWcIcon name={icon} size="sm" decorative />
    </button>
  );
}

function LeftRail({
  activeTab,
  panelOpen,
  onSelect,
}: {
  activeTab: RailTab;
  panelOpen: boolean;
  onSelect: (tab: RailTab) => void;
}) {
  const items: { name: string; label: string; tab: RailTab }[] = [
    { name: 'cube', label: 'Model Management', tab: 'model' },
    { name: 'layers', label: 'Source Documentation', tab: 'source' },
    { name: 'share', label: 'Share', tab: 'share' },
  ];
  return (
    <div
      style={{
        width: 56,
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e0e1e9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 0',
        gap: 4,
        zIndex: 2,
      }}
    >
      {items.map((it) => {
        const isActive = it.tab === activeTab && panelOpen;
        return (
          <button
            key={it.label}
            type="button"
            title={it.label}
            aria-label={it.label}
            aria-pressed={isActive}
            onClick={() => onSelect(it.tab)}
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              backgroundColor: isActive ? '#e8f4fd' : 'transparent',
              color: isActive ? '#0063A7' : '#171c1e',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#f1f1f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <ModusWcIcon name={it.name} size="sm" decorative />
            {isActive && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  right: -10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 22,
                  borderRadius: 2,
                  backgroundColor: '#0063A7',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function ModelManagementPanel({
  searchQuery,
  onSearch,
  layers,
  visibility,
  selected,
  onSelect,
  onToggle,
  onClose,
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
  layers: Layer[];
  visibility: LayerVisibility;
  selected: LayerId;
  onSelect: (id: LayerId) => void;
  onToggle: (id: LayerId) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e0e1e9',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
      }}
    >
      <div
        style={{
          padding: '14px 16px 12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f1f6',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: '#171c1e' }}>
          Model Management
        </span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#6a6e79',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ModusWcIcon name="close" size="sm" decorative />
        </button>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 32,
            padding: '0 10px',
            border: '1px solid #cbcdd6',
            borderRadius: 6,
            backgroundColor: '#ffffff',
          }}
        >
          <ModusWcIcon
            name="search"
            size="xs"
            decorative
            style={{ color: '#6a6e79' }}
          />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              color: '#171c1e',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      <div
        style={{
          padding: '4px 12px 16px 12px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <SectionHeader label="Layers" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {layers.map((l) => (
            <LayerRow
              key={l.id}
              layer={l}
              visible={visibility[l.id]}
              selected={selected === l.id}
              onSelect={() => onSelect(l.id)}
              onToggle={() => onToggle(l.id)}
            />
          ))}
          {layers.length === 0 && (
            <div
              style={{
                padding: '12px 8px',
                fontSize: 12,
                color: '#6a6e79',
              }}
            >
              No matching layers.
            </div>
          )}
        </div>

        <div style={{ height: 12 }} />
        <SectionHeader label="Surfaces" collapsed />
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  collapsed,
}: {
  label: string;
  collapsed?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 4px',
        fontSize: 13,
        fontWeight: 700,
        color: '#171c1e',
      }}
    >
      <span>{label}</span>
      <ModusWcIcon
        name={collapsed ? 'expand_more' : 'expand_less'}
        size="xs"
        decorative
        style={{ color: '#6a6e79' }}
      />
    </div>
  );
}

function LayerRow({
  layer,
  visible,
  selected,
  onSelect,
  onToggle,
}: {
  layer: Layer;
  visible: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 6,
        cursor: 'pointer',
        backgroundColor: selected ? '#e8f4fd' : 'transparent',
        outline: 'none',
        transition: 'background-color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = '#f6f8fa';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <button
        type="button"
        aria-label={visible ? 'Hide layer' : 'Show layer'}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          width: 22,
          height: 22,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: visible ? '#171c1e' : '#cbcdd6',
        }}
      >
        <ModusWcIcon
          name={visible ? 'visibility_on' : 'visibility_off'}
          size="xs"
          decorative
        />
      </button>
      <span
        aria-hidden
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: layer.color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: selected ? 600 : 500,
          color: visible ? '#171c1e' : '#9aa0a8',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {layer.name}
      </span>
    </div>
  );
}

function SourceDocPanel({
  layer,
  activeFile,
  onClose,
  onSelectLayer,
}: {
  layer: Layer;
  activeFile?: string;
  onClose: () => void;
  onSelectLayer: (id: LayerId) => void;
}) {
  const [layerDropdownOpen, setLayerDropdownOpen] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(
    activeFile ?? null,
  );

  const wf = LAYER_WORKFLOWS[layer.id];

  useEffect(() => {
    setExpandedFile(activeFile ?? null);
    setLayerDropdownOpen(false);
  }, [layer.id, activeFile]);

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e0e1e9',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
      }}
    >
      <div
        style={{
          padding: '14px 16px 12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f1f6',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
          }}
        >
          <ModusWcIcon
            name="layers"
            size="sm"
            decorative
            style={{ color: '#171c1e' }}
          />
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#171c1e',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Source Documentation
          </span>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#6a6e79',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ModusWcIcon name="close" size="sm" decorative />
        </button>
      </div>

      <div
        style={{
          padding: '14px 16px 18px 16px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Layer selector */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            position: 'relative',
          }}
        >
          <FieldLabel>Layer</FieldLabel>
          <button
            type="button"
            onClick={() => setLayerDropdownOpen((v) => !v)}
            aria-expanded={layerDropdownOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              border: '1px solid #cbcdd6',
              borderRadius: 6,
              backgroundColor: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              color: '#171c1e',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: layer.color,
              }}
            />
            <span style={{ flex: 1, minWidth: 0 }}>{layer.name}</span>
            <ModusWcIcon
              name={layerDropdownOpen ? 'expand_less' : 'expand_more'}
              size="xs"
              decorative
              style={{ color: '#6a6e79' }}
            />
          </button>
          {layerDropdownOpen && (
            <div
              role="listbox"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                backgroundColor: '#ffffff',
                border: '1px solid #cbcdd6',
                borderRadius: 6,
                boxShadow: '0 10px 24px rgba(0,0,0,0.10)',
                zIndex: 10,
                overflow: 'hidden',
              }}
            >
              {LAYERS.map((l) => {
                const isActive = l.id === layer.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      onSelectLayer(l.id);
                      setLayerDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      width: '100%',
                      border: 'none',
                      background: isActive ? '#f1f6fb' : '#ffffff',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: l.color,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        color: '#171c1e',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {l.name}
                    </span>
                    {isActive && (
                      <ModusWcIcon
                        name="check"
                        size="xs"
                        decorative
                        style={{ color: '#0063A7' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Context pillars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Context applied</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {wf.pillars.map((p) => (
              <ContextChipView key={p.scope} chip={p} />
            ))}
          </div>
        </div>

        {/* Project knowledge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Project Knowledge</FieldLabel>
          <div
            style={{
              border: '1px solid #e0e1e9',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {FILES.map((f, i) => {
              const active = f === activeFile;
              const expanded = f === expandedFile;
              const cite = FILE_CITATIONS[f];
              return (
                <div
                  key={f}
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid #f1f1f6',
                    backgroundColor: active ? '#fef0f8' : '#ffffff',
                    borderLeft: active
                      ? `3px solid ${ZONE_ALERT}`
                      : '3px solid transparent',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFile((prev) => (prev === f ? null : f))
                    }
                    aria-expanded={expanded}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <ModusWcIcon
                      name="file"
                      size="xs"
                      decorative
                      style={{
                        color: active ? ZONE_ALERT : '#6a6e79',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: active ? 700 : 500,
                        color: '#171c1e',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f}
                    </span>
                    {active && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: ZONE_ALERT,
                        }}
                      >
                        Source
                      </span>
                    )}
                    <ModusWcIcon
                      name={expanded ? 'expand_less' : 'expand_more'}
                      size="xs"
                      decorative
                      style={{ color: '#6a6e79' }}
                    />
                  </button>
                  {expanded && cite && (
                    <CitationCard cite={cite} active={active} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

function ContextChipView({ chip }: { chip: ContextChip }) {
  const c = CONTEXT_COLORS[chip.scope];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 1000,
        backgroundColor: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.2,
        maxWidth: '100%',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 6,
          backgroundColor: c.dot,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: 9,
        }}
      >
        {CONTEXT_LABEL[chip.scope]}
      </span>
      <span
        style={{
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {chip.label}
      </span>
    </span>
  );
}

function CitationCard({
  cite,
  active,
}: {
  cite: CitationDetail;
  active: boolean;
}) {
  const idx = cite.excerpt
    .toLowerCase()
    .indexOf(cite.highlight.toLowerCase());
  const before = idx >= 0 ? cite.excerpt.slice(0, idx) : cite.excerpt;
  const mid =
    idx >= 0 ? cite.excerpt.slice(idx, idx + cite.highlight.length) : '';
  const after =
    idx >= 0 ? cite.excerpt.slice(idx + cite.highlight.length) : '';

  return (
    <div
      style={{
        padding: '10px 14px 12px 14px',
        backgroundColor: active ? 'rgba(220, 38, 38, 0.04)' : '#fafbfc',
        borderTop: '1px solid #f1f1f6',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#6a6e79',
        }}
      >
        {cite.page}
      </span>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.55,
          color: '#171c1e',
        }}
      >
        {idx >= 0 ? (
          <>
            {before}
            <mark
              style={{
                backgroundColor: active
                  ? 'rgba(220, 38, 38, 0.20)'
                  : '#fff3a8',
                padding: '0 2px',
                borderRadius: 2,
                color: '#171c1e',
              }}
            >
              {mid}
            </mark>
            {after}
          </>
        ) : (
          cite.excerpt
        )}
      </p>
      <button
        type="button"
        style={{
          alignSelf: 'flex-start',
          marginTop: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 0',
          fontSize: 11,
          fontWeight: 600,
          color: '#0063A7',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Open full document
        <ModusWcIcon name="launch" size="xs" decorative />
      </button>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#6a6e79',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}

/* Rectangular action button used inside the AIInsightPopup.
 *
 * Follows Modus button hierarchy:
 *   variant="primary"    — filled Trimble primary blue (#0063A7),
 *                          white label. The popup's single call-to-
 *                          action. Once `pressed` (Applied) it flips
 *                          to filled success green (#1E8A2A) so the
 *                          confirmed state reads at a glance.
 *   variant="secondary"  — outlined neutral (white bg, gray border,
 *                          dark label) per the project rule "use
 *                          outline button style for secondary and
 *                          tertiary actions". */
function InsightAction({
  icon,
  label,
  pressed,
  variant = 'secondary',
  onClick,
}: {
  icon: string;
  label: string;
  pressed?: boolean;
  variant?: 'primary' | 'secondary';
  onClick: () => void;
}) {
  const PRIMARY_BLUE = '#0063A7';
  const PRIMARY_BLUE_HOVER = '#004F86';
  const PRIMARY_BLUE_BG_HOVER = 'rgba(0, 99, 167, 0.08)';
  const SUCCESS_GREEN = '#1E8A2A';
  const SUCCESS_GREEN_HOVER = '#156620';

  let bg: string;
  let fg: string;
  let borderColor: string;
  let hoverBg: string;
  let hoverBorderColor: string;
  let hoverFg: string;
  let focusRing: string;

  if (variant === 'primary' && pressed) {
    /* "Applied" state — filled green to confirm the rule is active. */
    bg = SUCCESS_GREEN;
    fg = '#ffffff';
    borderColor = SUCCESS_GREEN;
    hoverBg = SUCCESS_GREEN_HOVER;
    hoverBorderColor = SUCCESS_GREEN_HOVER;
    hoverFg = '#ffffff';
    focusRing = '0 0 0 2px rgba(30, 138, 42, 0.30)';
  } else if (variant === 'primary') {
    /* Trimble primary — solid filled blue. */
    bg = PRIMARY_BLUE;
    fg = '#ffffff';
    borderColor = PRIMARY_BLUE;
    hoverBg = PRIMARY_BLUE_HOVER;
    hoverBorderColor = PRIMARY_BLUE_HOVER;
    hoverFg = '#ffffff';
    focusRing = '0 0 0 2px rgba(0, 99, 167, 0.30)';
  } else {
    /* Trimble secondary — outlined blue, transparent fill. Pairs
     * with the filled-blue primary so the two actions read as a
     * proper primary / secondary set rather than primary + neutral. */
    bg = '#ffffff';
    fg = PRIMARY_BLUE;
    borderColor = PRIMARY_BLUE;
    hoverBg = PRIMARY_BLUE_BG_HOVER;
    hoverBorderColor = PRIMARY_BLUE_HOVER;
    hoverFg = PRIMARY_BLUE_HOVER;
    focusRing = '0 0 0 2px rgba(0, 99, 167, 0.25)';
  }

  return (
    <button
      type="button"
      aria-pressed={pressed ?? undefined}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 36,
        padding: '0 14px',
        borderRadius: 6,
        border: `1px solid ${borderColor}`,
        background: bg,
        color: fg,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition:
          'background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
        e.currentTarget.style.borderColor = hoverBorderColor;
        e.currentTarget.style.color = hoverFg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = bg;
        e.currentTarget.style.borderColor = borderColor;
        e.currentTarget.style.color = fg;
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = focusRing;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <ModusWcIcon name={icon} size="xs" decorative />
      <span>{label}</span>
    </button>
  );
}

/* Floating "AI Insight" callout that sits over the 3D viewport and
 * tracks the rainbow marker's projected position. The user opens it
 * by clicking the wetland marker, then chooses to Apply rule, Show
 * reasoning (opens the source-doc panel), or Open source.            */
const AIInsightPopup = forwardRef<
  HTMLDivElement,
  {
    insight: string;
    applied: boolean;
    onApply: () => void;
    onShowReasoning: () => void;
    onClose: () => void;
  }
>(function AIInsightPopup(
  { insight, applied, onApply, onShowReasoning, onClose },
  ref,
) {
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="AI Insight"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 360,
        padding: 3,
        borderRadius: 12,
        background: TRIMBLE_RAINBOW,
        boxShadow:
          '0 18px 36px -10px rgba(74, 0, 255, 0.28), 0 4px 12px rgba(0, 0, 0, 0.10)',
        opacity: 0,
        transition: 'opacity 160ms ease',
        zIndex: 5,
      }}
    >
      <div
        style={{
          borderRadius: 9,
          padding: '14px 16px 14px 16px',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#171c1e',
            }}
          >
            AI Insight
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#6a6e79',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ModusWcIcon name="close" size="xs" decorative />
          </button>
        </div>
        <p
          style={{
            margin: 0,
            marginBottom: 12,
            fontSize: 13,
            lineHeight: 1.5,
            color: '#171c1e',
            fontStyle: 'italic',
          }}
        >
          {insight}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <InsightAction
            icon={applied ? 'check_circle' : 'check'}
            label={applied ? 'Applied' : 'Apply rule'}
            pressed={applied}
            variant="primary"
            onClick={onApply}
          />
          <InsightAction
            icon="info"
            label="Show reasoning"
            onClick={onShowReasoning}
          />
        </div>
      </div>
    </div>
  );
});

export default function Pro3() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<SceneRefs | null>(null);
  const visibilityRef = useRef<LayerVisibility>(ALL_VISIBLE);
  const markerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const popupOpenRef = useRef<boolean>(false);

  const [visibility, setVisibility] = useState<LayerVisibility>(ALL_VISIBLE);
  const [selected, setSelected] = useState<LayerId>('wetland');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRailTab, setActiveRailTab] = useState<RailTab>('source');
  const [panelOpen, setPanelOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    popupOpenRef.current = popupOpen;
  }, [popupOpen]);

  useEffect(() => {
    visibilityRef.current = visibility;
    const refs = sceneRefs.current;
    if (!refs) return;
    refs.excavator.visible = visibility.excavator;
    refs.zone.visible = visibility.wetland;
    refs.stockpiles.visible = visibility.stockpiles;
    refs.survey.visible = visibility.survey;
  }, [visibility]);

  const selectedLayer = useMemo(
    () => LAYERS.find((l) => l.id === selected) ?? LAYERS[0],
    [selected],
  );

  /* The wetland is the layer the rainbow marker is physically
   * anchored to in the 3-D scene, so the popup's content stays
   * locked to wetland regardless of what the side-panel shows. */
  const wetlandLayer = useMemo(
    () => LAYERS.find((l) => l.id === 'wetland') ?? LAYERS[0],
    [],
  );

  const filteredLayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return LAYERS;
    return LAYERS.filter((l) => l.name.toLowerCase().includes(q));
  }, [searchQuery]);

  function toggleLayer(id: LayerId) {
    setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let W = mount.clientWidth;
    let H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f3f4f7');
    scene.fog = new THREE.FogExp2(0xf3f4f7, 0.012);

    const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 400);
    camera.position.set(34, 26, 32);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, -1, 0);
    controls.minDistance = 16;
    controls.maxDistance = 110;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.screenSpacePanning = true;
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    scene.add(new THREE.HemisphereLight(0xe6ecf2, 0x9aa0a8, 0.55));

    const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
    sun.position.set(18, 28, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 100;
    const sc = 30;
    sun.shadow.camera.left = -sc;
    sun.shadow.camera.right = sc;
    sun.shadow.camera.top = sc;
    sun.shadow.camera.bottom = -sc;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    /* ====== TERRAIN ====== */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshLambertMaterial({ color: 0xd5cab2 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    function tile(
      x: number,
      z: number,
      w: number,
      d: number,
      color: number,
      y = 0.006,
    ) {
      const t = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshLambertMaterial({ color }),
      );
      t.rotation.x = -Math.PI / 2;
      t.position.set(x, y, z);
      t.receiveShadow = true;
      scene.add(t);
      return t;
    }

    /* grass aprons outside the project */
    tile(0, 19, 60, 8, 0xa6c799);
    tile(-22, 0, 14, 30, 0xa6c799);
    tile(22, 6, 14, 30, 0xa6c799);
    tile(0, -19, 50, 6, 0xa6c799);

    /* compacted gravel & dirt zones inside the site */
    tile(-11, 1, 12, 14, 0xc8bda1);
    tile(-3, 8, 12, 8, 0xc1b39a);
    tile(11, -10.5, 11, 7, 0xbcb29a);

    /* asphalt road network with dashed centerline */
    function road(x: number, z: number, w: number, d: number) {
      tile(x, z, w, d, 0x55585d, 0.014);
      const horiz = w > d;
      const len = horiz ? w : d;
      for (let s = -len / 2 + 0.6; s < len / 2 - 0.4; s += 1.7) {
        const dash = new THREE.Mesh(
          new THREE.PlaneGeometry(
            horiz ? 0.6 : 0.12,
            horiz ? 0.12 : 0.6,
          ),
          new THREE.MeshLambertMaterial({ color: 0xf0e36a }),
        );
        dash.rotation.x = -Math.PI / 2;
        if (horiz) dash.position.set(x + s, 0.016, z);
        else dash.position.set(x, 0.016, z + s);
        scene.add(dash);
      }
    }
    road(0, -3, 4.0, 24);
    road(7, -10.5, 12, 3.0);
    road(-7, -3, 12, 3.0);

    const grid = new THREE.GridHelper(160, 80, 0x000000, 0x000000);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.04;
    grid.position.y = 0.004;
    scene.add(grid);

    /* ---------- Wetland buffer no-dig zone ---------- */
    const zoneGroup = new THREE.Group();
    scene.add(zoneGroup);
    const ZONE_Y = 0.04;

    const zoneShape = new THREE.Shape();
    zoneShape.moveTo(3, -3);
    zoneShape.lineTo(14, -1);
    zoneShape.lineTo(15, -9);
    zoneShape.lineTo(8, -13);
    zoneShape.lineTo(2, -10);
    zoneShape.closePath();

    const zoneMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(zoneShape),
      new THREE.MeshBasicMaterial({
        color: ZONE_ALERT,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    zoneMesh.rotation.x = -Math.PI / 2;
    zoneMesh.position.y = ZONE_Y;
    zoneGroup.add(zoneMesh);

    const outlinePts = zoneShape
      .getPoints()
      .map((p) => new THREE.Vector3(p.x, 0, -p.y));
    const zoneOutline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(outlinePts),
      new THREE.LineBasicMaterial({ color: ZONE_ALERT }),
    );
    zoneOutline.position.y = ZONE_Y + 0.02;
    zoneGroup.add(zoneOutline);

    const haloShape = new THREE.Shape();
    haloShape.moveTo(2.2, -2.2);
    haloShape.lineTo(14.6, -0.2);
    haloShape.lineTo(15.7, -9.4);
    haloShape.lineTo(8.2, -13.7);
    haloShape.lineTo(1.2, -10.4);
    haloShape.closePath();
    const haloMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(haloShape),
      new THREE.MeshBasicMaterial({
        color: ZONE_ALERT,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = ZONE_Y - 0.01;
    zoneGroup.add(haloMesh);

    /* Pond inside the wetland */
    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(2.1, 40),
      new THREE.MeshBasicMaterial({
        color: 0x4f86b4,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(9, ZONE_Y + 0.015, 7);
    zoneGroup.add(pond);
    const pondRim = new THREE.Mesh(
      new THREE.RingGeometry(2.05, 2.35, 40),
      new THREE.MeshBasicMaterial({
        color: 0x6da38a,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    pondRim.rotation.x = -Math.PI / 2;
    pondRim.position.set(9, ZONE_Y + 0.012, 7);
    zoneGroup.add(pondRim);

    /* Trees inside the wetland */
    function tree(x: number, z: number, scale = 1) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13 * scale, 0.18 * scale, 0.85 * scale, 6),
        new THREE.MeshLambertMaterial({ color: 0x6a4a2a }),
      );
      trunk.position.set(x, 0.42 * scale, z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      zoneGroup.add(trunk);

      const foliageA = new THREE.Mesh(
        new THREE.ConeGeometry(0.85 * scale, 1.7 * scale, 7),
        new THREE.MeshLambertMaterial({
          color: 0x3a8a4a,
          flatShading: true,
        }),
      );
      foliageA.position.set(x, 1.55 * scale, z);
      foliageA.castShadow = true;
      zoneGroup.add(foliageA);

      const foliageB = new THREE.Mesh(
        new THREE.ConeGeometry(0.6 * scale, 1.1 * scale, 7),
        new THREE.MeshLambertMaterial({
          color: 0x4ea05a,
          flatShading: true,
        }),
      );
      foliageB.position.set(x, 2.25 * scale, z);
      foliageB.castShadow = true;
      zoneGroup.add(foliageB);
    }
    [
      [4.5, 4, 1.0],
      [13, 3, 1.2],
      [14, 11, 0.95],
      [5, 11, 1.05],
      [12.5, 9, 0.85],
      [4, 8, 0.85],
      [11, 5, 0.7],
    ].forEach(([x, z, s]) => tree(x as number, z as number, s as number));

    /* Boundary cones along the edge facing the excavator */
    function safetyCone(x: number, z: number) {
      const c = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.65, 12),
        new THREE.MeshLambertMaterial({ color: 0xff6a00 }),
      );
      c.position.set(x, 0.32, z);
      c.castShadow = true;
      zoneGroup.add(c);
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.21, 0.21, 0.09, 12),
        new THREE.MeshLambertMaterial({ color: 0xfafafa }),
      );
      stripe.position.set(x, 0.45, z);
      zoneGroup.add(stripe);
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.06, 0.55),
        new THREE.MeshLambertMaterial({ color: 0x202020 }),
      );
      base.position.set(x, 0.03, z);
      base.castShadow = true;
      zoneGroup.add(base);
    }
    [
      [3.2, 3.2],
      [6, 2.5],
      [9, 2.0],
      [12, 1.8],
      [14.4, 2.4],
    ].forEach(([x, z]) => safetyCone(x, z));

    /* ---------- Yellow excavator (CAT-style) ---------- */
    const excavatorGroup = new THREE.Group();
    scene.add(excavatorGroup);
    const EX_X = -3.5;
    const EX_Z = 9;
    excavatorGroup.position.set(EX_X, 0, EX_Z);
    excavatorGroup.rotation.y = -0.45; // face toward the wetland edge

    const CAT_YELLOW = 0xf2b100;
    const CAT_DARK = 0x2a2a2a;

    /* Tracks (left + right) */
    function buildTrack(side: number) {
      const trackBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.55, 3.1),
        new THREE.MeshLambertMaterial({ color: CAT_DARK }),
      );
      trackBody.position.set(side * 0.95, 0.275, 0);
      trackBody.castShadow = true;
      trackBody.receiveShadow = true;
      excavatorGroup.add(trackBody);
      for (let i = -6; i <= 6; i++) {
        const tread = new THREE.Mesh(
          new THREE.BoxGeometry(0.74, 0.07, 0.18),
          new THREE.MeshLambertMaterial({ color: 0x141414 }),
        );
        tread.position.set(side * 0.95, 0.58, i * 0.22);
        excavatorGroup.add(tread);
      }
      const wheel1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.55, 16),
        new THREE.MeshLambertMaterial({ color: 0x3b3b3b }),
      );
      wheel1.rotation.z = Math.PI / 2;
      wheel1.position.set(side * 0.95, 0.32, 1.35);
      wheel1.castShadow = true;
      excavatorGroup.add(wheel1);
      const wheel2 = wheel1.clone();
      wheel2.position.z = -1.35;
      excavatorGroup.add(wheel2);
    }
    buildTrack(-1);
    buildTrack(1);

    /* Lower frame */
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.25, 2.6),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a }),
    );
    frame.position.set(0, 0.7, 0);
    frame.castShadow = true;
    excavatorGroup.add(frame);

    /* Upper rotating body */
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.6, 2.5),
      new THREE.MeshLambertMaterial({ color: CAT_YELLOW }),
    );
    body.position.set(0, 1.1, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    excavatorGroup.add(body);

    /* Engine cover (raised, with two stripes) */
    const engine = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.45, 1.6),
      new THREE.MeshLambertMaterial({ color: 0xd49b00 }),
    );
    engine.position.set(0.55, 1.625, 0);
    engine.castShadow = true;
    excavatorGroup.add(engine);

    /* Counterweight at the back */
    const counterweight = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.95, 2.1),
      new THREE.MeshLambertMaterial({ color: 0x303030 }),
    );
    counterweight.position.set(1.5, 1.275, 0);
    counterweight.castShadow = true;
    excavatorGroup.add(counterweight);

    /* Operator cab */
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.15, 1.35),
      new THREE.MeshLambertMaterial({ color: CAT_YELLOW }),
    );
    cab.position.set(-0.55, 1.975, 0.45);
    cab.castShadow = true;
    excavatorGroup.add(cab);

    /* Cab glass (front + side) */
    const glassMat = new THREE.MeshLambertMaterial({
      color: 0x4d6b86,
      transparent: true,
      opacity: 0.75,
    });
    const winFront = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.85, 1.05),
      glassMat,
    );
    winFront.position.set(-1.085, 2.0, 0.45);
    excavatorGroup.add(winFront);
    const winSide = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.7, 0.04),
      glassMat,
    );
    winSide.position.set(-0.55, 2.05, 1.105);
    excavatorGroup.add(winSide);
    const winSide2 = winSide.clone();
    winSide2.position.z = -0.21;
    excavatorGroup.add(winSide2);

    /* Cab roof */
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.07, 1.4),
      new THREE.MeshLambertMaterial({ color: 0xbf8a00 }),
    );
    roof.position.set(-0.55, 2.585, 0.45);
    excavatorGroup.add(roof);

    /* Articulated arm: boom -> stick -> bucket */
    const armPivot = new THREE.Group();
    armPivot.position.set(-0.4, 1.4, -0.6);
    excavatorGroup.add(armPivot);

    const boom = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 0.45, 0.45),
      new THREE.MeshLambertMaterial({ color: CAT_YELLOW }),
    );
    boom.position.set(1.25, 0, 0);
    boom.castShadow = true;
    armPivot.add(boom);
    armPivot.rotation.z = 0.85;

    const stickPivot = new THREE.Group();
    stickPivot.position.set(2.55, 0, 0);
    armPivot.add(stickPivot);

    const stick = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.36, 0.36),
      new THREE.MeshLambertMaterial({ color: CAT_YELLOW }),
    );
    stick.position.set(0.95, 0, 0);
    stick.castShadow = true;
    stickPivot.add(stick);
    stickPivot.rotation.z = -1.55;

    const bucketPivot = new THREE.Group();
    bucketPivot.position.set(1.85, 0, 0);
    stickPivot.add(bucketPivot);

    const bucket = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.55, 0.85),
      new THREE.MeshLambertMaterial({ color: 0x252525 }),
    );
    bucket.position.set(0.18, -0.22, 0);
    bucket.castShadow = true;
    bucketPivot.add(bucket);
    for (let i = -2; i <= 2; i++) {
      const tooth = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.22, 4),
        new THREE.MeshLambertMaterial({ color: 0x131313 }),
      );
      tooth.position.set(0.42, -0.55, i * 0.16);
      tooth.rotation.z = -Math.PI / 2;
      bucketPivot.add(tooth);
    }
    bucketPivot.rotation.z = 0.7;

    /* Hydraulic cylinder linking body -> boom (visual cue) */
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 1.7, 12),
      new THREE.MeshLambertMaterial({ color: 0xb6b6b6 }),
    );
    cyl.position.set(-0.05, 1.95, -0.6);
    cyl.rotation.z = 0.55;
    armPivot.parent?.add(cyl);

    /* ---------- Material stockpiles ---------- */
    const stockpilesGroup = new THREE.Group();
    scene.add(stockpilesGroup);
    function stockpile(x: number, z: number, color: number, h: number, r: number) {
      const pile = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 18, 1),
        new THREE.MeshLambertMaterial({ color, flatShading: true }),
      );
      pile.position.set(x, h / 2, z);
      pile.castShadow = true;
      pile.receiveShadow = true;
      stockpilesGroup.add(pile);
      const ringPad = new THREE.Mesh(
        new THREE.CircleGeometry(r * 1.05, 24),
        new THREE.MeshLambertMaterial({ color: 0x9b958c }),
      );
      ringPad.rotation.x = -Math.PI / 2;
      ringPad.position.set(x, 0.005, z);
      stockpilesGroup.add(ringPad);
    }
    stockpile(-13, -3, 0x9a7a52, 1.7, 1.7); // topsoil
    stockpile(-13, 1.5, 0x8d8884, 1.4, 1.45); // gravel
    stockpile(-13, 5.5, 0xc6ad7e, 1.15, 1.2); // sand

    /* concrete pipes (stack of three) */
    function concretePipe(x: number, y: number, z: number, len: number, r: number) {
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, len, 22),
        new THREE.MeshLambertMaterial({ color: 0xb6b3ad }),
      );
      p.rotation.z = Math.PI / 2;
      p.position.set(x, y, z);
      p.castShadow = true;
      p.receiveShadow = true;
      stockpilesGroup.add(p);
      const cap = new THREE.Mesh(
        new THREE.RingGeometry(r * 0.7, r * 0.95, 22),
        new THREE.MeshBasicMaterial({
          color: 0x4a4a4a,
          side: THREE.DoubleSide,
        }),
      );
      cap.rotation.y = Math.PI / 2;
      cap.position.set(x + len / 2, y, z);
      stockpilesGroup.add(cap);
      const cap2 = cap.clone();
      cap2.position.x = x - len / 2;
      stockpilesGroup.add(cap2);
    }
    concretePipe(-7, 0.55, -7, 2.6, 0.55);
    concretePipe(-7, 0.55, -5.8, 2.6, 0.55);
    concretePipe(-7, 1.5, -6.4, 2.6, 0.55);

    /* rebar bundles (bunched bars wrapped with a strap) */
    function rebarBundle(x: number, z: number) {
      const grp = new THREE.Group();
      stockpilesGroup.add(grp);
      for (let i = 0; i < 7; i++) {
        const r = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 3.4, 6),
          new THREE.MeshLambertMaterial({ color: 0x7a5a3a }),
        );
        r.rotation.z = Math.PI / 2;
        const a = (i / 7) * Math.PI * 2;
        r.position.set(
          x + Math.cos(a) * 0.11,
          0.2 + Math.sin(a) * 0.11,
          z,
        );
        r.castShadow = true;
        grp.add(r);
      }
      [-1.1, 1.1].forEach((sx) => {
        const strap = new THREE.Mesh(
          new THREE.TorusGeometry(0.2, 0.035, 8, 16),
          new THREE.MeshLambertMaterial({ color: 0x202020 }),
        );
        strap.rotation.y = Math.PI / 2;
        strap.position.set(x + sx, 0.22, z);
        grp.add(strap);
      });
    }
    rebarBundle(-9.5, -8);
    rebarBundle(-9.5, -8.6);

    /* pallets of bricks */
    function brickPallet(x: number, z: number) {
      const pallet = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.12, 1.0),
        new THREE.MeshLambertMaterial({ color: 0x8a6a3e }),
      );
      pallet.position.set(x, 0.06, z);
      pallet.castShadow = true;
      stockpilesGroup.add(pallet);
      const bricks = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.6, 0.92),
        new THREE.MeshLambertMaterial({ color: 0xa8553a }),
      );
      bricks.position.set(x, 0.42, z);
      bricks.castShadow = true;
      stockpilesGroup.add(bricks);
      /* mortar lines (vertical) */
      for (let i = -1; i <= 1; i++) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(1.12, 0.62, 0.02),
          new THREE.MeshLambertMaterial({ color: 0x202020 }),
        );
        line.position.set(x, 0.42, z + i * 0.31);
        stockpilesGroup.add(line);
      }
    }
    brickPallet(-5.6, -8.1);
    brickPallet(-4.4, -8.1);
    brickPallet(-5.6, -9.3);

    /* ---------- GNSS survey rover ---------- */
    const surveyGroup = new THREE.Group();
    scene.add(surveyGroup);
    const ROVER = new THREE.Vector3(-1, 0, -6);

    /* Tripod legs */
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 1.4, 6),
        new THREE.MeshLambertMaterial({ color: 0xd9aa1f }),
      );
      const dx = Math.cos(angle) * 0.45;
      const dz = Math.sin(angle) * 0.45;
      leg.position.set(ROVER.x + dx / 2, 0.6, ROVER.z + dz / 2);
      leg.lookAt(new THREE.Vector3(ROVER.x + dx, 0, ROVER.z + dz));
      leg.rotateX(Math.PI / 2);
      leg.castShadow = true;
      surveyGroup.add(leg);
    }
    /* Tripod head */
    const tripodHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.07, 12),
      new THREE.MeshLambertMaterial({ color: 0x222222 }),
    );
    tripodHead.position.set(ROVER.x, 1.2, ROVER.z);
    surveyGroup.add(tripodHead);
    /* GNSS receiver body */
    const receiver = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.16, 16),
      new THREE.MeshLambertMaterial({ color: 0xfafafa }),
    );
    receiver.position.set(ROVER.x, 1.31, ROVER.z);
    receiver.castShadow = true;
    surveyGroup.add(receiver);
    /* GNSS antenna disk */
    const antennaDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.06, 16),
      new THREE.MeshLambertMaterial({ color: 0x2d6fb8 }),
    );
    antennaDisk.position.set(ROVER.x, 1.43, ROVER.z);
    surveyGroup.add(antennaDisk);
    /* Range pole / antenna stub */
    const stub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.32, 6),
      new THREE.MeshLambertMaterial({ color: 0xff6a00 }),
    );
    stub.position.set(ROVER.x, 1.59, ROVER.z);
    surveyGroup.add(stub);
    /* Control point marker on the ground */
    const marker = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 16),
      new THREE.MeshBasicMaterial({ color: 0xff6a00, side: THREE.DoubleSide }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(ROVER.x, 0.011, ROVER.z);
    surveyGroup.add(marker);
    const markerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.32, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff6a00,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    markerRing.rotation.x = -Math.PI / 2;
    markerRing.position.set(ROVER.x, 0.01, ROVER.z);
    surveyGroup.add(markerRing);

    /* =================================================================
     * DUMP TRUCK (parked between excavator and stockpiles, loaded)
     * ================================================================= */
    function buildDumpTruck(
      parent: THREE.Object3D,
      x: number,
      z: number,
      ry: number,
    ) {
      const tr = new THREE.Group();
      tr.position.set(x, 0, z);
      tr.rotation.y = ry;
      parent.add(tr);

      const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.3, 5.4),
        new THREE.MeshLambertMaterial({ color: 0x2a2a2a }),
      );
      chassis.position.set(0, 0.55, 0);
      chassis.castShadow = true;
      tr.add(chassis);

      const wheelMat = new THREE.MeshLambertMaterial({ color: 0x161616 });
      function tw(wx: number, wz: number) {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.4, 18),
          wheelMat,
        );
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.45, wz);
        w.castShadow = true;
        tr.add(w);
      }
      tw(-0.95, 1.7);
      tw(0.95, 1.7);
      tw(-1.05, -1.4);
      tw(0.95, -1.4);
      tw(-1.05, -2.1);
      tw(0.95, -2.1);

      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 1.1, 1.7),
        new THREE.MeshLambertMaterial({ color: 0xe8b400 }),
      );
      cab.position.set(0, 1.35, 1.65);
      cab.castShadow = true;
      tr.add(cab);
      const cabRoof = new THREE.Mesh(
        new THREE.BoxGeometry(1.95, 0.08, 1.75),
        new THREE.MeshLambertMaterial({ color: 0xbf8a00 }),
      );
      cabRoof.position.set(0, 1.94, 1.65);
      tr.add(cabRoof);
      const wsh = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.6, 0.05),
        new THREE.MeshLambertMaterial({
          color: 0x4d6b86,
          transparent: true,
          opacity: 0.78,
        }),
      );
      wsh.position.set(0, 1.55, 2.5);
      tr.add(wsh);
      const grille = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.6, 0.05),
        new THREE.MeshLambertMaterial({ color: 0x222222 }),
      );
      grille.position.set(0, 1.05, 2.5);
      tr.add(grille);
      const hl = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.18, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xfff5cb }),
      );
      hl.position.set(-0.6, 1.2, 2.51);
      tr.add(hl);
      const hl2 = hl.clone();
      hl2.position.x = 0.6;
      tr.add(hl2);

      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 1.0, 3.4),
        new THREE.MeshLambertMaterial({ color: 0x2f5e3e }),
      );
      bed.position.set(0, 1.3, -1.0);
      bed.castShadow = true;
      tr.add(bed);
      const cargo = new THREE.Mesh(
        new THREE.BoxGeometry(1.95, 0.25, 3.25),
        new THREE.MeshLambertMaterial({
          color: 0x8a6a4a,
          flatShading: true,
        }),
      );
      cargo.position.set(0, 1.85, -1.0);
      tr.add(cargo);
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.3 + Math.random() * 0.1, 0),
          new THREE.MeshLambertMaterial({
            color: 0x9a7a5a,
            flatShading: true,
          }),
        );
        m.position.set(-0.7 + i * 0.35, 2.05, -1.9 + i * 0.45);
        m.castShadow = true;
        tr.add(m);
      }

      const exh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 1.4, 8),
        new THREE.MeshLambertMaterial({ color: 0x3a3a3a }),
      );
      exh.position.set(-1.0, 2.3, 1.0);
      tr.add(exh);
      return tr;
    }
    const dumpTruckGroup = new THREE.Group();
    scene.add(dumpTruckGroup);
    buildDumpTruck(dumpTruckGroup, -2, 0.5, -0.45);

    /* =================================================================
     * BULLDOZER (working in background)
     * ================================================================= */
    function buildBulldozer(
      parent: THREE.Object3D,
      x: number,
      z: number,
      ry: number,
    ) {
      const dz = new THREE.Group();
      dz.position.set(x, 0, z);
      dz.rotation.y = ry;
      parent.add(dz);

      const dzDark = 0x1f1f1f;
      function dzTrack(side: number) {
        const tb = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 0.55, 2.6),
          new THREE.MeshLambertMaterial({ color: dzDark }),
        );
        tb.position.set(side * 0.85, 0.275, 0);
        tb.castShadow = true;
        dz.add(tb);
        for (let i = -5; i <= 5; i++) {
          const trEl = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.06, 0.18),
            new THREE.MeshLambertMaterial({ color: 0x111111 }),
          );
          trEl.position.set(side * 0.85, 0.57, i * 0.22);
          dz.add(trEl);
        }
      }
      dzTrack(-1);
      dzTrack(1);

      const dzBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.7, 2.0),
        new THREE.MeshLambertMaterial({ color: 0xf2b100 }),
      );
      dzBody.position.set(0, 0.95, 0);
      dzBody.castShadow = true;
      dz.add(dzBody);
      const dzEng = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.55, 1.4),
        new THREE.MeshLambertMaterial({ color: 0xd49b00 }),
      );
      dzEng.position.set(0, 1.55, -0.1);
      dz.add(dzEng);
      const dzCab = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.15, 1.2),
        new THREE.MeshLambertMaterial({ color: 0xf2b100 }),
      );
      dzCab.position.set(0, 1.95, 0.5);
      dzCab.castShadow = true;
      dz.add(dzCab);
      const glassMatDz = new THREE.MeshLambertMaterial({
        color: 0x4d6b86,
        transparent: true,
        opacity: 0.75,
      });
      const dzG1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.85, 1.05),
        glassMatDz,
      );
      dzG1.position.set(-0.72, 1.95, 0.5);
      dz.add(dzG1);
      const dzG2 = dzG1.clone();
      dzG2.position.x = 0.72;
      dz.add(dzG2);
      const dzGF = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.85, 0.04),
        glassMatDz,
      );
      dzGF.position.set(0, 1.95, 1.1);
      dz.add(dzGF);
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 1.0, 0.18),
        new THREE.MeshLambertMaterial({ color: 0xc23a00 }),
      );
      blade.position.set(0, 0.65, 1.85);
      blade.castShadow = true;
      dz.add(blade);
      const bArm1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 1.2),
        new THREE.MeshLambertMaterial({ color: 0xc23a00 }),
      );
      bArm1.position.set(-0.9, 0.75, 1.25);
      dz.add(bArm1);
      const bArm2 = bArm1.clone();
      bArm2.position.x = 0.9;
      dz.add(bArm2);
      return dz;
    }
    const bulldozerGroup = new THREE.Group();
    scene.add(bulldozerGroup);
    buildBulldozer(bulldozerGroup, -8, -10, 0.7);

    /* =================================================================
     * SITE OFFICE TRAILER + accessories
     * ================================================================= */
    const officeGroup = new THREE.Group();
    scene.add(officeGroup);
    const glassMatOf = new THREE.MeshLambertMaterial({
      color: 0x4d6b86,
      transparent: true,
      opacity: 0.78,
    });

    const skirt = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 0.3, 2.6),
      new THREE.MeshLambertMaterial({ color: 0x5a5a5a }),
    );
    skirt.position.set(11, 0.15, -11);
    skirt.castShadow = true;
    officeGroup.add(skirt);
    const trailer = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 2.4, 2.6),
      new THREE.MeshLambertMaterial({ color: 0xeae6dc }),
    );
    trailer.position.set(11, 1.5, -11);
    trailer.castShadow = true;
    trailer.receiveShadow = true;
    officeGroup.add(trailer);
    const trailerRoof = new THREE.Mesh(
      new THREE.BoxGeometry(5.05, 0.18, 2.65),
      new THREE.MeshLambertMaterial({ color: 0x7a7a7a }),
    );
    trailerRoof.position.set(11, 2.79, -11);
    officeGroup.add(trailerRoof);
    /* horizontal siding lines */
    for (let i = 0; i < 4; i++) {
      const ln = new THREE.Mesh(
        new THREE.BoxGeometry(5.02, 0.03, 2.62),
        new THREE.MeshLambertMaterial({ color: 0xc4bfb1 }),
      );
      ln.position.set(11, 0.4 + i * 0.55, -11);
      officeGroup.add(ln);
    }

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.6, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x3a5b8c }),
    );
    door.position.set(13.51, 1.1, -11);
    officeGroup.add(door);
    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xd6c46a }),
    );
    knob.position.set(13.55, 1.1, -10.7);
    officeGroup.add(knob);
    for (let i = 0; i < 3; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.12, 1.0),
        new THREE.MeshLambertMaterial({ color: 0x6b6b6b }),
      );
      step.position.set(13.85 + i * 0.35, 0.06 + i * 0.12, -11);
      step.castShadow = true;
      officeGroup.add(step);
    }
    function trailerWindow(x: number, z: number) {
      const f = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.7, 0.95),
        new THREE.MeshLambertMaterial({ color: 0x2a2a2a }),
      );
      f.position.set(x, 1.7, z);
      officeGroup.add(f);
      const g = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.55, 0.8),
        glassMatOf,
      );
      g.position.set(x + 0.005, 1.7, z);
      officeGroup.add(g);
    }
    trailerWindow(8.49, -11.7);
    trailerWindow(8.49, -10.3);
    trailerWindow(13.51, -11.7);
    const ac = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.45, 0.9),
      new THREE.MeshLambertMaterial({ color: 0xc4c4c4 }),
    );
    ac.position.set(10, 3.15, -11);
    officeGroup.add(ac);
    const flag = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6),
      new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }),
    );
    flag.position.set(8.5, 4.1, -11);
    officeGroup.add(flag);
    const flagBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.9, 1.4),
      new THREE.MeshLambertMaterial({ color: 0x0063a7 }),
    );
    flagBoard.position.set(8.5, 4.7, -11);
    officeGroup.add(flagBoard);

    /* portable toilet */
    const toilet = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 2.2, 1.0),
      new THREE.MeshLambertMaterial({ color: 0x2c69a8 }),
    );
    toilet.position.set(15, 1.1, -9.4);
    toilet.castShadow = true;
    officeGroup.add(toilet);
    const toiletDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1.6, 0.7),
      new THREE.MeshLambertMaterial({ color: 0x1f4f80 }),
    );
    toiletDoor.position.set(15.51, 1.1, -9.4);
    officeGroup.add(toiletDoor);
    const toiletRoof = new THREE.Mesh(
      new THREE.BoxGeometry(1.06, 0.08, 1.06),
      new THREE.MeshLambertMaterial({ color: 0x1f4f80 }),
    );
    toiletRoof.position.set(15, 2.24, -9.4);
    officeGroup.add(toiletRoof);
    const toiletVent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6),
      new THREE.MeshLambertMaterial({ color: 0x1f4f80 }),
    );
    toiletVent.position.set(15, 2.55, -9.4);
    officeGroup.add(toiletVent);

    /* pickup truck */
    function buildPickup(
      parent: THREE.Object3D,
      x: number,
      z: number,
      ry: number,
    ) {
      const pk = new THREE.Group();
      pk.position.set(x, 0, z);
      pk.rotation.y = ry;
      parent.add(pk);
      const ch = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.25, 3.6),
        new THREE.MeshLambertMaterial({ color: 0x222222 }),
      );
      ch.position.set(0, 0.4, 0);
      pk.add(ch);
      [
        [-0.78, 1.1],
        [0.78, 1.1],
        [-0.78, -1.1],
        [0.78, -1.1],
      ].forEach(([wx, wz]) => {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.32, 0.3, 18),
          new THREE.MeshLambertMaterial({ color: 0x161616 }),
        );
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.32, wz);
        w.castShadow = true;
        pk.add(w);
      });
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 0.85, 1.6),
        new THREE.MeshLambertMaterial({ color: 0xfafafa }),
      );
      cab.position.set(0, 0.95, 0.6);
      cab.castShadow = true;
      pk.add(cab);
      const hood = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 0.55, 1.1),
        new THREE.MeshLambertMaterial({ color: 0xfafafa }),
      );
      hood.position.set(0, 0.8, 1.85);
      pk.add(hood);
      const bedWalls = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 0.65, 1.6),
        new THREE.MeshLambertMaterial({ color: 0xfafafa }),
      );
      bedWalls.position.set(0, 0.85, -0.95);
      pk.add(bedWalls);
      const bedHole = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.55, 1.45),
        new THREE.MeshLambertMaterial({ color: 0x4a4a4a }),
      );
      bedHole.position.set(0, 0.95, -0.95);
      pk.add(bedHole);
      const ws = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.55, 0.05),
        glassMatOf,
      );
      ws.position.set(0, 1.1, 1.4);
      pk.add(ws);
      const back = ws.clone();
      back.position.z = -0.2;
      pk.add(back);
      const sw1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.55, 1.4),
        glassMatOf,
      );
      sw1.position.set(-0.78, 1.1, 0.6);
      pk.add(sw1);
      const sw2 = sw1.clone();
      sw2.position.x = 0.78;
      pk.add(sw2);
    }
    buildPickup(officeGroup, 6.5, -10, 1.57);

    /* =================================================================
     * SITE FENCING + ENTRY GATE
     * ================================================================= */
    const fenceGroup = new THREE.Group();
    scene.add(fenceGroup);
    function fenceSegment(
      x1: number,
      z1: number,
      x2: number,
      z2: number,
    ) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      const segs = Math.max(1, Math.round(len / 2.0));
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 1.4, 0.1),
          new THREE.MeshLambertMaterial({ color: 0x303030 }),
        );
        post.position.set(x1 + dx * t, 0.7, z1 + dz * t);
        post.castShadow = true;
        fenceGroup.add(post);
      }
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(len, 1.3),
        new THREE.MeshLambertMaterial({
          color: 0x9aa0a8,
          transparent: true,
          opacity: 0.42,
          side: THREE.DoubleSide,
        }),
      );
      panel.position.set((x1 + x2) / 2, 0.7, (z1 + z2) / 2);
      panel.rotation.y = -angle;
      fenceGroup.add(panel);
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.06, 0.06),
        new THREE.MeshLambertMaterial({ color: 0x303030 }),
      );
      rail.position.set((x1 + x2) / 2, 1.32, (z1 + z2) / 2);
      rail.rotation.y = -angle;
      fenceGroup.add(rail);
    }
    /* south boundary with gap for gate */
    fenceSegment(-18, -14, -2, -14);
    fenceSegment(2, -14, 18, -14);
    /* west and east boundaries */
    fenceSegment(-18, -14, -18, 12);
    fenceSegment(18, -14, 18, -1.5);

    /* gate posts + sign banner */
    [-2, 2].forEach((gx) => {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 2.0, 0.2),
        new THREE.MeshLambertMaterial({ color: 0xff6a00 }),
      );
      p.position.set(gx, 1.0, -14);
      p.castShadow = true;
      fenceGroup.add(p);
    });
    const gateBanner = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.6, 0.05),
      new THREE.MeshLambertMaterial({ color: 0xff6a00 }),
    );
    gateBanner.position.set(0, 2.3, -14);
    fenceGroup.add(gateBanner);
    const gateBannerStripe = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.1, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xfafafa }),
    );
    gateBannerStripe.position.set(0, 2.3, -13.99);
    fenceGroup.add(gateBannerStripe);

    /* =================================================================
     * LIGHT POLES
     * ================================================================= */
    function lightPole(x: number, z: number) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 5.0, 8),
        new THREE.MeshLambertMaterial({ color: 0x444444 }),
      );
      pole.position.set(x, 2.5, z);
      pole.castShadow = true;
      scene.add(pole);
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.06, 0.06),
        new THREE.MeshLambertMaterial({ color: 0x444444 }),
      );
      arm.position.set(x + 0.3, 4.95, z);
      scene.add(arm);
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.18, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x222222 }),
      );
      head.position.set(x + 0.55, 4.85, z);
      scene.add(head);
      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.04, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xfff5cb }),
      );
      glow.position.set(x + 0.55, 4.74, z);
      scene.add(glow);
    }
    lightPole(-17, -13);
    lightPole(17, -13);
    lightPole(-17, 11);
    lightPole(15, -2);

    /* =================================================================
     * JERSEY BARRIERS (line a stretch of road)
     * ================================================================= */
    function jerseyBarrier(x: number, z: number, ry: number) {
      const grp = new THREE.Group();
      grp.position.set(x, 0, z);
      grp.rotation.y = ry;
      scene.add(grp);
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.25, 0.6),
        new THREE.MeshLambertMaterial({ color: 0xdedcd6 }),
      );
      base.position.set(0, 0.125, 0);
      base.castShadow = true;
      grp.add(base);
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.6, 0.3),
        new THREE.MeshLambertMaterial({ color: 0xdedcd6 }),
      );
      top.position.set(0, 0.55, 0);
      top.castShadow = true;
      grp.add(top);
      [-0.7, 0.7].forEach((sx) => {
        const s = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.18, 0.32),
          new THREE.MeshBasicMaterial({ color: 0xff6a00 }),
        );
        s.position.set(sx, 0.75, 0);
        grp.add(s);
      });
    }
    [4, 6, 8, 10].forEach((bx) => jerseyBarrier(bx, -1, 0));

    /* =================================================================
     * WORKERS (high-vis figures)
     * ================================================================= */
    function worker(
      x: number,
      z: number,
      hatColor: number,
      ry = 0,
    ) {
      const grp = new THREE.Group();
      grp.position.set(x, 0, z);
      grp.rotation.y = ry;
      scene.add(grp);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x202b3a });
      const lL = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.7, 0.16),
        legMat,
      );
      lL.position.set(-0.1, 0.35, 0);
      lL.castShadow = true;
      grp.add(lL);
      const lR = lL.clone();
      lR.position.x = 0.1;
      grp.add(lR);
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.55, 0.2),
        new THREE.MeshLambertMaterial({ color: 0xf2b100 }),
      );
      torso.position.set(0, 1.0, 0);
      torso.castShadow = true;
      grp.add(torso);
      const refl = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.08, 0.21),
        new THREE.MeshBasicMaterial({ color: 0xfafafa }),
      );
      refl.position.set(0, 0.95, 0);
      grp.add(refl);
      const armMat = new THREE.MeshLambertMaterial({ color: 0xf2b100 });
      const aL = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.5, 0.13),
        armMat,
      );
      aL.position.set(-0.27, 1.0, 0);
      grp.add(aL);
      const aR = aL.clone();
      aR.position.x = 0.27;
      grp.add(aR);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 12),
        new THREE.MeshLambertMaterial({ color: 0xe5b89a }),
      );
      head.position.set(0, 1.4, 0);
      head.castShadow = true;
      grp.add(head);
      const hat = new THREE.Mesh(
        new THREE.SphereGeometry(
          0.16,
          12,
          6,
          0,
          Math.PI * 2,
          0,
          Math.PI / 2,
        ),
        new THREE.MeshLambertMaterial({ color: hatColor }),
      );
      hat.position.set(0, 1.46, 0);
      grp.add(hat);
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.03, 12),
        new THREE.MeshLambertMaterial({ color: hatColor }),
      );
      brim.position.set(0, 1.46, 0);
      grp.add(brim);
    }
    worker(0, -7, 0xf2b100, 0.3);
    worker(-2.4, -6, 0xfafafa, -0.4);
    worker(11.5, -10, 0xff6a00, 1.4);
    worker(-1.0, -5.4, 0xf2b100, 1.0);
    worker(13.0, -10.7, 0xfafafa, -1.2);
    worker(-9, -7.5, 0xf2b100, 0.0);

    sceneRefs.current = {
      zone: zoneGroup,
      excavator: excavatorGroup,
      stockpiles: stockpilesGroup,
      survey: surveyGroup,
    };

    /* Project the world-space anchor for the AI marker into screen
     * space every frame so the rainbow orb (and, when open, the
     * floating popup) track the wetland as the camera orbits. */
    const tmp = new THREE.Vector3();
    function updateOverlay() {
      const marker = markerRef.current;
      const popup = popupRef.current;
      if (!marker && !popup) return;
      tmp.copy(MARKER_ANCHOR).project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * W;
      const sy = (-tmp.y * 0.5 + 0.5) * H;
      const onScreen =
        tmp.z < 1 && tmp.x > -1 && tmp.x < 1 && tmp.y > -1 && tmp.y < 1;
      const showMarker = onScreen && visibilityRef.current.wetland;

      if (marker) {
        marker.style.transform = `translate(-50%, -50%) translate3d(${sx}px, ${sy}px, 0)`;
        marker.style.opacity = showMarker ? '1' : '0';
        marker.style.pointerEvents = showMarker ? 'auto' : 'none';
      }
      if (popup) {
        /* Anchor popup so its bottom-right tail sits 18px up-left of
         * the marker; clamped to the viewport so it never escapes
         * the canvas. */
        const popupW = popup.offsetWidth || 360;
        const popupH = popup.offsetHeight || 180;
        let px = sx - popupW - 18;
        let py = sy - popupH - 18;
        px = Math.max(12, Math.min(px, W - popupW - 12));
        py = Math.max(12, Math.min(py, H - popupH - 12));
        popup.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        const showPopup = showMarker && popupOpenRef.current;
        popup.style.opacity = showPopup ? '1' : '0';
        popup.style.pointerEvents = showPopup ? 'auto' : 'none';
      }
    }

    let frameId = 0;
    const start = performance.now();
    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = (performance.now() - start) / 1000;
      (zoneMesh.material as THREE.MeshBasicMaterial).opacity =
        0.45 + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.6));
      (haloMesh.material as THREE.MeshBasicMaterial).opacity =
        0.14 + 0.08 * (0.5 + 0.5 * Math.sin(t * 1.6));
      controls.update();
      updateOverlay();
      renderer.render(scene, camera);
    }
    animate();

    const ro = new ResizeObserver(() => {
      W = mount.clientWidth;
      H = mount.clientHeight;
      if (W === 0 || H === 0) return;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      controls.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sceneRefs.current = null;
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#dadcdf',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Open Sans", system-ui, sans-serif',
      }}
    >
      <TopToolbar />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
        }}
      >
        <LeftRail
          activeTab={activeRailTab}
          panelOpen={panelOpen}
          onSelect={(tab) => {
            if (tab === activeRailTab) {
              setPanelOpen((v) => !v);
            } else {
              setActiveRailTab(tab);
              setPanelOpen(true);
            }
          }}
        />

        {panelOpen && activeRailTab === 'model' && (
          <ModelManagementPanel
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            layers={filteredLayers}
            visibility={visibility}
            selected={selected}
            onSelect={setSelected}
            onToggle={toggleLayer}
            onClose={() => setPanelOpen(false)}
          />
        )}

        {panelOpen && activeRailTab === 'source' && (
          <SourceDocPanel
            layer={selectedLayer}
            activeFile={selectedLayer.source}
            onClose={() => setPanelOpen(false)}
            onSelectLayer={setSelected}
          />
        )}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            backgroundColor: '#f3f4f7',
          }}
        >
          <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />

          {/* Pulsing rainbow AI marker - mirror of Creative 8's marker.
              68 px transparent button hit-area wraps a 36 px rainbow orb
              with a white inner core. Two hollow rainbow gradient pulse
              rings (mask-cut to 3 px thickness) expand outward; the orb
              scales up 1.08x while the popup is open. Inside the white
              core sits the Trimble AI brand mark (replaces Creative 8's
              camera glyph).                                              */}
          <button
            ref={markerRef}
            type="button"
            aria-label="Open AI insight for the wetland buffer"
            aria-pressed={popupOpen}
            className="pro3-marker"
            onClick={() => {
              setSelected('wetland');
              setPopupOpen((v) => !v);
            }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 68,
              height: 68,
              padding: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 160ms ease',
              zIndex: 4,
            }}
          >
            {/* Pulse rings - rainbow border only, transparent center.
                Hidden when the popup is open so they don't compete
                with the AIInsightPopup. */}
            {!popupOpen && (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 36,
                    height: 36,
                    marginTop: -18,
                    marginLeft: -18,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    background: TRIMBLE_RAINBOW,
                    WebkitMaskImage:
                      'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 3px))',
                    maskImage:
                      'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 3px))',
                    opacity: 0.85,
                    animation: 'pro3-rainbow-pulse 1.8s ease-out infinite',
                    zIndex: 1,
                  }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 36,
                    height: 36,
                    marginTop: -18,
                    marginLeft: -18,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    background: TRIMBLE_RAINBOW,
                    WebkitMaskImage:
                      'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 3px))',
                    maskImage:
                      'radial-gradient(circle, transparent calc(50% - 3px), black calc(50% - 3px))',
                    opacity: 0.85,
                    animation:
                      'pro3-rainbow-pulse 1.8s ease-out 0.9s infinite',
                    zIndex: 1,
                  }}
                />
              </>
            )}

            {/* Marker orb - rainbow border around a white core. The
                Trimble AI logo sits in the white center, drawn at
                full colour so its magenta + blue mark reads clearly. */}
            <span
              aria-hidden="true"
              className="pro3-orb"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 36,
                height: 36,
                marginTop: -18,
                marginLeft: -18,
                borderRadius: '50%',
                pointerEvents: 'none',
                background: TRIMBLE_RAINBOW,
                boxShadow:
                  '0 4px 12px rgba(74, 0, 255, 0.28), 0 2px 4px rgba(0, 0, 0, 0.12)',
                transform: popupOpen ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.18s ease',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: 1.5,
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src="/assets/trimble-ai-logo.png"
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  style={{
                    width: 28,
                    height: 28,
                    objectFit: 'contain',
                    userSelect: 'none',
                    /* Nudge the glyph slightly right to visually
                     * center it inside the white core (the logo's
                     * artwork has more whitespace on its left edge,
                     * so a flex-centered position reads as too far
                     * left to the eye). */
                    transform: 'translateX(2px)',
                  }}
                />
              </span>
            </span>

            <style>{`
              @keyframes pro3-rainbow-pulse {
                0%   { transform: scale(1);   opacity: 0.55; }
                100% { transform: scale(2.4); opacity: 0;    }
              }
              .pro3-marker:hover .pro3-orb {
                transform: scale(1.08);
              }
            `}</style>
          </button>

          {/* Floating AI Insight popup (only shown when popupOpen +
              wetland visible). Position is updated each frame in the
              Three.js animation loop via popupRef.                    */}
          {wetlandLayer.insight && (
            <AIInsightPopup
              ref={popupRef}
              insight={wetlandLayer.insight}
              applied={applied}
              onApply={() => setApplied((v) => !v)}
              onShowReasoning={() => {
                setSelected('wetland');
                setActiveRailTab('source');
                setPanelOpen(true);
              }}
              onClose={() => setPopupOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
