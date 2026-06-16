import { useEffect, useMemo, useRef, useState } from 'react';
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
 *  - Top toolbar of modeling tools, an AI-insight on/off switch, Save.
 *  - Left rail of icon tabs (model / layers / share).
 *  - "Model Management" panel listing layers; toggling a layer hides
 *    the matching geometry in the 3D scene.
 *  - Center: interactive Three.js viewport (orbit / pan / zoom) with
 *    the quarry pile and the magenta no-dig zone.
 *  - Right "Source Documentation" tab (replaces the floating popup):
 *    shows the project files the AI was trained on, the active source,
 *    the AI insight quote, and the object properties for the selected
 *    layer. This is the dedicated docked tab for source data /
 *    guidance documentation.
 */

const ZONE_MAGENTA = '#E5009E';

type LayerId = 'quarry' | 'pit-floor' | 'no-dig' | 'power' | 'boulders';

interface Layer {
  id: LayerId;
  name: string;
  color: string;
  source?: string;
  insight?: string;
  count: number;
  length?: string;
  area?: string;
}

const LAYERS: Layer[] = [
  {
    id: 'quarry',
    name: 'Quarry Terraces',
    color: '#7C766C',
    count: 5,
    length: '64.000 m',
    area: '432.000 m2',
  },
  {
    id: 'pit-floor',
    name: 'Pit Floor',
    color: '#3C9A6C',
    count: 1,
    area: '6.760 m2',
  },
  {
    id: 'power',
    name: 'Power Infrastructure',
    color: '#2D6FB8',
    count: 3,
    length: '12.000 m',
  },
  {
    id: 'no-dig',
    name: 'No-Dig Zone',
    color: ZONE_MAGENTA,
    source: 'Environmental_Mitigation_Policy.pdf',
    insight:
      'This is a no-fly / no-dig zone based on the attached environmental impact study. Excavation, drilling, drone flight, and material staging are prohibited inside the highlighted polygon.',
    count: 1,
    area: '142.000 m2',
  },
  {
    id: 'boulders',
    name: 'Boulders & Spoil',
    color: '#B07A3A',
    count: 9,
  },
];

const FILES = [
  'Excavator_GNSS_Tolerance_Specs.pdf',
  'Error_Detection_Template.pdf',
  'Environmental_Mitigation_Policy.pdf',
  'Equipment_Pre-Start_Checklist.pdf',
];

const MARKER_ANCHOR = new THREE.Vector3(8.5, 0.05, 7.5);

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
  quarry: true,
  'pit-floor': true,
  power: true,
  'no-dig': true,
  boulders: true,
};

interface SceneRefs {
  zone: THREE.Group;
  quarry: THREE.Group;
  pitFloor: THREE.Mesh;
  power: THREE.Group;
  boulders: THREE.Group;
}

/* ============================================================== */
/* Sub-components                                                  */
/* ============================================================== */

function TopToolbar({
  aiInsightOn,
  onToggleAiInsight,
}: {
  aiInsightOn: boolean;
  onToggleAiInsight: () => void;
}) {
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
      <button
        type="button"
        onClick={onToggleAiInsight}
        aria-label="Toggle AI insights"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          height: 28,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 36,
            height: 20,
            borderRadius: 1000,
            backgroundColor: aiInsightOn ? '#0063A7' : '#cbcdd6',
            position: 'relative',
            transition: 'background-color 160ms ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: aiInsightOn ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: 1000,
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              transition: 'left 160ms ease',
            }}
          />
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#171c1e' }}>
          {aiInsightOn ? 'ON' : 'OFF'}
        </span>
      </button>
      <div style={{ width: 8 }} />
      <button
        type="button"
        style={{
          height: 30,
          padding: '0 16px',
          borderRadius: 6,
          border: '1px solid #0063A7',
          backgroundColor: '#ffffff',
          color: '#0063A7',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Save
      </button>
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

function LeftRail() {
  const items: { name: string; label: string; active?: boolean }[] = [
    { name: 'cube', label: 'Model', active: true },
    { name: 'layers', label: 'Layers' },
    { name: 'share', label: 'Share' },
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
      }}
    >
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          title={it.label}
          aria-label={it.label}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            backgroundColor: it.active ? '#e8f4fd' : 'transparent',
            color: it.active ? '#0063A7' : '#171c1e',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ModusWcIcon name={it.name} size="sm" decorative />
        </button>
      ))}
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
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
  layers: Layer[];
  visibility: LayerVisibility;
  selected: LayerId;
  onSelect: (id: LayerId) => void;
  onToggle: (id: LayerId) => void;
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
  aiInsightOn,
  activeFile,
}: {
  layer: Layer;
  aiInsightOn: boolean;
  activeFile?: string;
}) {
  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e0e1e9',
        display: 'flex',
        flexDirection: 'column',
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
            name="info"
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
          padding: '14px 16px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Selected layer summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Layer</FieldLabel>
          <div
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
              name="expand_more"
              size="xs"
              decorative
              style={{ color: '#6a6e79' }}
            />
          </div>
        </div>

        {/* Project knowledge files */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Project Knowledge</FieldLabel>
          <div
            style={{
              border: '1px solid #e0e1e9',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {FILES.map((f) => {
              const active = f === activeFile;
              return (
                <div
                  key={f}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    backgroundColor: active ? '#fef0f8' : '#ffffff',
                    borderTop:
                      f === FILES[0] ? 'none' : '1px solid #f1f1f6',
                    borderLeft: active
                      ? `3px solid ${ZONE_MAGENTA}`
                      : '3px solid transparent',
                  }}
                >
                  <ModusWcIcon
                    name="file"
                    size="xs"
                    decorative
                    style={{
                      color: active ? ZONE_MAGENTA : '#6a6e79',
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
                        color: ZONE_MAGENTA,
                      }}
                    >
                      Source
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI insight section */}
        {aiInsightOn && layer.insight && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>AI Insight</FieldLabel>
            <div
              style={{
                position: 'relative',
                padding: 1,
                borderRadius: 10,
                background:
                  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)',
              }}
            >
              <div
                style={{
                  borderRadius: 9,
                  padding: '12px 14px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <ModusWcIcon
                    name="sparkle"
                    size="sm"
                    decorative
                    style={{ color: '#171c1e', marginTop: 1 }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: '#171c1e',
                      fontStyle: 'italic',
                      fontWeight: 500,
                    }}
                  >
                    {layer.insight}
                  </span>
                </div>
                {layer.source && (
                  <button
                    type="button"
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      borderRadius: 1000,
                      backgroundColor: '#f1f1f6',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#171c1e',
                    }}
                  >
                    <ModusWcIcon
                      name="file"
                      size="xs"
                      decorative
                      style={{ color: '#6a6e79' }}
                    />
                    {layer.source}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!aiInsightOn && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              backgroundColor: '#f6f8fa',
              border: '1px dashed #cbcdd6',
              fontSize: 12,
              color: '#6a6e79',
              lineHeight: 1.5,
            }}
          >
            AI insights are turned off. Toggle them on in the toolbar to see
            the AI&apos;s reasoning grounded in the project files.
          </div>
        )}

        {/* Object properties */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FieldLabel>Object Calculations</FieldLabel>
          <PropRow label="Object Count" value={String(layer.count)} />
          {layer.length && (
            <PropRow label="Length" value={layer.length} />
          )}
          {layer.area && (
            <PropRow label="Planar Area (xy)" value={layer.area} />
          )}
        </div>
      </div>
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

function PropRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: '1px solid #f1f1f6',
      }}
    >
      <span style={{ fontSize: 12, color: '#171c1e' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#171c1e' }}>
        {value}
      </span>
    </div>
  );
}

export default function Pro3() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<SceneRefs | null>(null);
  const markerRef = useRef<HTMLButtonElement>(null);
  const visibilityRef = useRef<LayerVisibility>(ALL_VISIBLE);

  const [visibility, setVisibility] = useState<LayerVisibility>(ALL_VISIBLE);
  const [selected, setSelected] = useState<LayerId>('no-dig');
  const [aiInsightOn, setAiInsightOn] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const aiInsightOnRef = useRef(true);
  useEffect(() => {
    aiInsightOnRef.current = aiInsightOn;
  }, [aiInsightOn]);

  useEffect(() => {
    visibilityRef.current = visibility;
    const refs = sceneRefs.current;
    if (!refs) return;
    refs.quarry.visible = visibility.quarry;
    refs.pitFloor.visible = visibility['pit-floor'];
    refs.power.visible = visibility.power;
    refs.zone.visible = visibility['no-dig'];
    refs.boulders.visible = visibility.boulders;
  }, [visibility]);

  const selectedLayer = useMemo(
    () => LAYERS.find((l) => l.id === selected) ?? LAYERS[0],
    [selected],
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

    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 300);
    camera.position.set(28, 22, 28);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controls.minDistance = 14;
    controls.maxDistance = 80;
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

    function rockBox(
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: number,
      group: THREE.Group,
    ) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshLambertMaterial({ color }),
      );
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({
          color: 0x4a4640,
          transparent: true,
          opacity: 0.18,
        }),
      );
      edges.position.copy(mesh.position);
      group.add(edges);
      return mesh;
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshLambertMaterial({ color: 0xe2e4e8 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(120, 60, 0x000000, 0x000000);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.05;
    grid.position.y = 0.01;
    scene.add(grid);

    const quarryGroup = new THREE.Group();
    scene.add(quarryGroup);
    const TERRACES: Array<{ size: number; height: number; color: number }> = [
      { size: 16, height: 0.6, color: 0xa9a39a },
      { size: 13, height: 0.6, color: 0xb8b3aa },
      { size: 10, height: 0.6, color: 0xc4bfb6 },
      { size: 7, height: 0.6, color: 0xb0a89c },
      { size: 4.4, height: 0.6, color: 0x96887a },
    ];
    let stack = 0;
    TERRACES.forEach((t) => {
      rockBox(0, stack, 0, t.size, t.height, t.size, t.color, quarryGroup);
      stack += t.height;
    });

    const pitFloorMesh = rockBox(
      0,
      stack,
      0,
      2.6,
      0.3,
      2.6,
      0x6f6357,
      new THREE.Group(),
    );
    scene.add(pitFloorMesh);

    const bouldersGroup = new THREE.Group();
    scene.add(bouldersGroup);
    function boulder(x: number, z: number, scale = 1, color = 0x9a8e7e) {
      const radius = 0.6 * scale;
      const geo = new THREE.IcosahedronGeometry(radius, 0);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshLambertMaterial({ color, flatShading: true }),
      );
      mesh.position.set(x, radius * 0.85, z);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bouldersGroup.add(mesh);
    }
    [
      [-9, 7, 0.9],
      [-11, -3, 1.1],
      [8, -10, 1.0],
      [-7, -10, 0.8],
      [-12, 2, 0.7],
      [-10, -7, 0.9],
      [-13, -10, 0.8],
      [11, -13, 0.7],
    ].forEach(([x, z, s]) => boulder(x, z, s));

    const mound = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 1.4, 7),
      new THREE.MeshLambertMaterial({ color: 0x9a8e7e, flatShading: true }),
    );
    mound.position.set(-10, 0.7, -7);
    mound.castShadow = true;
    mound.receiveShadow = true;
    bouldersGroup.add(mound);

    const powerGroup = new THREE.Group();
    scene.add(powerGroup);
    function pole(x: number, z: number, height = 7) {
      rockBox(x, 0, z, 0.18, height, 0.18, 0x6e6258, powerGroup);
      rockBox(
        x,
        height - 0.6,
        z,
        1.6,
        0.12,
        0.12,
        0x6e6258,
        powerGroup,
      );
      rockBox(
        x,
        height - 1.4,
        z,
        2.0,
        0.12,
        0.12,
        0x6e6258,
        powerGroup,
      );
      const cap1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xdedcd6 }),
      );
      cap1.position.set(x + 0.8, height - 0.5, z);
      powerGroup.add(cap1);
      const cap2 = cap1.clone();
      cap2.position.x = x - 0.8;
      powerGroup.add(cap2);
    }
    pole(-12, -8);
    pole(-12, -2);
    pole(-12, 4);

    const wireMat = new THREE.LineBasicMaterial({
      color: 0x363636,
      transparent: true,
      opacity: 0.55,
    });
    function wire(
      x1: number,
      z1: number,
      x2: number,
      z2: number,
      y: number,
    ) {
      const pts: THREE.Vector3[] = [];
      const segs = 16;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const x = THREE.MathUtils.lerp(x1, x2, t);
        const z = THREE.MathUtils.lerp(z1, z2, t);
        const droop = -0.18 * Math.sin(t * Math.PI);
        pts.push(new THREE.Vector3(x, y + droop, z));
      }
      powerGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          wireMat,
        ),
      );
    }
    [
      [-12, -8, -12, -2],
      [-12, -2, -12, 4],
    ].forEach(([x1, z1, x2, z2]) => {
      wire(x1, z1, x2, z2, 6.4);
      wire(x1 + 0.8, z1, x2 + 0.8, z2, 6.5);
      wire(x1 - 0.8, z1, x2 - 0.8, z2, 6.5);
    });

    const zoneGroup = new THREE.Group();
    scene.add(zoneGroup);
    const ZONE_Y = 0.04;
    const zoneShape = new THREE.Shape();
    zoneShape.moveTo(3, -4);
    zoneShape.lineTo(13, -2);
    zoneShape.lineTo(14, -10);
    zoneShape.lineTo(7, -13);
    zoneShape.lineTo(2, -9);
    zoneShape.closePath();

    const zoneMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(zoneShape),
      new THREE.MeshBasicMaterial({
        color: ZONE_MAGENTA,
        transparent: true,
        opacity: 0.5,
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
      new THREE.LineBasicMaterial({ color: ZONE_MAGENTA }),
    );
    zoneOutline.position.y = ZONE_Y + 0.02;
    zoneGroup.add(zoneOutline);

    const haloShape = new THREE.Shape();
    haloShape.moveTo(2.2, -3.2);
    haloShape.lineTo(13.6, -1.2);
    haloShape.lineTo(14.7, -10.4);
    haloShape.lineTo(7.2, -13.7);
    haloShape.lineTo(1.2, -9.4);
    haloShape.closePath();
    const haloMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(haloShape),
      new THREE.MeshBasicMaterial({
        color: ZONE_MAGENTA,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = ZONE_Y - 0.01;
    zoneGroup.add(haloMesh);

    sceneRefs.current = {
      zone: zoneGroup,
      quarry: quarryGroup,
      pitFloor: pitFloorMesh,
      power: powerGroup,
      boulders: bouldersGroup,
    };

    const tmp = new THREE.Vector3();
    function updateOverlay() {
      const marker = markerRef.current;
      if (!marker) return;
      const showMarker = aiInsightOnRef.current && visibilityRef.current['no-dig'];
      tmp.copy(MARKER_ANCHOR).project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * W;
      const sy = (-tmp.y * 0.5 + 0.5) * H;
      const onScreen =
        tmp.z < 1 && tmp.x > -1 && tmp.x < 1 && tmp.y > -1 && tmp.y < 1;
      marker.style.transform = `translate(-50%, -50%) translate3d(${sx}px, ${sy}px, 0)`;
      const visible = onScreen && showMarker;
      marker.style.opacity = visible ? '1' : '0';
      marker.style.pointerEvents = visible ? 'auto' : 'none';
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
      renderer.render(scene, camera);
      updateOverlay();
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
      <TopToolbar
        aiInsightOn={aiInsightOn}
        onToggleAiInsight={() => setAiInsightOn((v) => !v)}
      />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
        }}
      >
        <LeftRail />

        <ModelManagementPanel
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          layers={filteredLayers}
          visibility={visibility}
          selected={selected}
          onSelect={setSelected}
          onToggle={toggleLayer}
        />

        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            backgroundColor: '#f3f4f7',
          }}
        >
          <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />

          <button
            ref={markerRef}
            onClick={() => setSelected('no-dig')}
            aria-label="Show source documentation for the no-dig zone"
            className="ai-marker"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: 6,
              transition: 'opacity 0.2s ease',
            }}
          >
            <span className="rainbow-pulse-ring" />
            <span className="rainbow-pulse-ring rainbow-pulse-ring-delay" />
            <span className="rainbow-orb">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z"
                  fill="white"
                />
                <circle cx="19" cy="5" r="1.2" fill="white" />
                <circle cx="5" cy="19" r="1.2" fill="white" />
              </svg>
            </span>
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 14,
              padding: '7px 11px',
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontSize: 11,
              lineHeight: 1.45,
              backdropFilter: 'blur(4px)',
              zIndex: 4,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              Camera controls
            </div>
            <div style={{ opacity: 0.85 }}>
              Drag - orbit &nbsp;&middot;&nbsp; Right-drag - pan
              &nbsp;&middot;&nbsp; Scroll - zoom
            </div>
          </div>
        </div>

        <SourceDocPanel
          layer={selectedLayer}
          aiInsightOn={aiInsightOn}
          activeFile={selectedLayer.source}
        />
      </div>
    </div>
  );
}
