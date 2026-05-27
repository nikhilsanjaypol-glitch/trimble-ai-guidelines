import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Guideline: OFFER POSSIBILITIES
 *   Inspire professionals as a creative partner, while maintaining
 *   their control. Present multiple options through UI CONTROLS —
 *   not a text conversation — so exploration feels simple and the
 *   professional stays in the driver's seat.
 *
 * Component: 3D DESIGN STUDIO
 *   Left  – an interactive 3D interior (orbit / zoom). A small chat
 *           bar sits below as a secondary "say what's missing"
 *           channel.
 *   Right – panel of UI controls that EACH directly mutate the 3D
 *           scene the professional is looking at:
 *             · Lighting Mood     → swaps key/ambient lights + sky
 *             · Surface Materials → recolors floor / walls / sofa
 *             · Decor Elements    → toggles plant / art / lamp /
 *                                   rug / bookshelf in the room
 *             · Camera View       → tweens the camera between
 *                                   curated angles
 *
 *   No "Render Image" CTA — the act of toggling controls IS the
 *   exploration. Every option is an AI-offered possibility, the
 *   professional steers the result by clicking.
 * ───────────────────────────────────────────────────────────────── */

/* ── Possibility data ─────────────────────────────────────────── */

interface LightingMood {
  id: string;
  label: string;
  ambient: number;
  keyColor: number;
  keyIntensity: number;
  fillColor: number;
  fillIntensity: number;
  background: number;
}

const LIGHTING_MOODS: LightingMood[] = [
  {
    id: 'daylight',
    label: 'Daylight',
    ambient: 0.65,
    keyColor: 0xffffff,
    keyIntensity: 1.25,
    fillColor: 0xc8d8ff,
    fillIntensity: 0.45,
    background: 0x252a30,
  },
  {
    id: 'golden',
    label: 'Golden Hour',
    ambient: 0.4,
    keyColor: 0xffc77a,
    keyIntensity: 1.5,
    fillColor: 0xff8d6a,
    fillIntensity: 0.25,
    background: 0x2a1f1c,
  },
  {
    id: 'evening',
    label: 'Evening',
    ambient: 0.3,
    keyColor: 0xffd6a8,
    keyIntensity: 0.55,
    fillColor: 0x3a3c5a,
    fillIntensity: 0.35,
    background: 0x121317,
  },
  {
    id: 'dramatic',
    label: 'Dramatic',
    ambient: 0.18,
    keyColor: 0xfff1d6,
    keyIntensity: 1.95,
    fillColor: 0x1a1c20,
    fillIntensity: 0.08,
    background: 0x0a0b0d,
  },
];

interface Swatch {
  id: string;
  color: string;
  name: string;
}

const PALETTE: Swatch[] = [
  { id: 'walnut',   color: '#8B5A3C', name: 'Walnut'         },
  { id: 'charcoal', color: '#2A2D33', name: 'Charcoal Stone' },
  { id: 'stone',    color: '#9A9CA3', name: 'Stone'          },
  { id: 'brick',    color: '#B23B2E', name: 'Red Brick'      },
  { id: 'mustard',  color: '#D4A93B', name: 'Brushed Brass'  },
  { id: 'cream',    color: '#F2EDE4', name: 'Glass'          },
  { id: 'fog',      color: '#C9CDD4', name: 'Fog'            },
];

interface DecorElement {
  id: 'rug' | 'plant' | 'art' | 'lamp' | 'shelf';
  label: string;
  icon: string;
}

const DECOR: DecorElement[] = [
  { id: 'rug',   label: 'Rug',         icon: 'layers'        },
  { id: 'plant', label: 'Plant',       icon: 'sustainability'},
  { id: 'art',   label: 'Wall art',    icon: 'image'         },
  { id: 'lamp',  label: 'Floor lamp',  icon: 'lightbulb_on'  },
  { id: 'shelf', label: 'Bookshelf',   icon: 'book'          },
];

interface Atmosphere {
  id: string;
  label: string;
  /** null → no fog. */
  fog: { color: number; density: number } | null;
}

const ATMOSPHERES: Atmosphere[] = [
  { id: 'crisp', label: 'Crisp', fog: null                                        },
  { id: 'hazy',  label: 'Hazy',  fog: { color: 0xc8d8ff, density: 0.045 }         },
  { id: 'foggy', label: 'Foggy', fog: { color: 0xe8eaef, density: 0.085 }         },
  { id: 'moody', label: 'Moody', fog: { color: 0x1a1c20, density: 0.13  }         },
];

const SUGGESTED_PROMPTS = [
  'Brighter lighting',
  'Add a rug',
  'More natural light',
];

/* ── 3D Interior Viewport ──────────────────────────────────────── */

interface SceneMaterials {
  sofa: THREE.MeshLambertMaterial;
  lamp: THREE.MeshLambertMaterial;
  wall: THREE.MeshLambertMaterial;
  floor: THREE.MeshLambertMaterial;
  table: THREE.MeshLambertMaterial;
  art: THREE.MeshLambertMaterial;
}

interface SceneRefs {
  scene?: THREE.Scene;
  camera?: THREE.PerspectiveCamera;
  controls?: OrbitControls;
  ambient?: THREE.AmbientLight;
  key?: THREE.DirectionalLight;
  fill?: THREE.DirectionalLight;
  materials?: SceneMaterials;
  decor?: Partial<Record<DecorElement['id'], THREE.Object3D>>;
}

function InteriorViewport({
  selectedSwatches,
  lighting,
  activeDecor,
  atmosphere,
}: {
  selectedSwatches: string[];
  lighting: string;
  activeDecor: DecorElement['id'][];
  atmosphere: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const refs = useRef<SceneRefs>({});

  /* Build the scene once. */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let W = mount.clientWidth;
    let H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x252a30);

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(5.5, 3.6, 6.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 3;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.enablePan = false;
    controls.update();

    /* ── Lights (kept in refs so we can swap moods later) ─────── */
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);

    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x2a2d33, 0.35));

    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(6, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 40;
    const sc = 9;
    key.shadow.camera.left = -sc;
    key.shadow.camera.right = sc;
    key.shadow.camera.top = sc;
    key.shadow.camera.bottom = -sc;
    key.shadow.bias = -0.0008;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.45);
    fill.position.set(-4, 5, -2);
    scene.add(fill);

    /* ── Materials ───────────────────────────────────────────── */
    const materials: SceneMaterials = {
      sofa:  new THREE.MeshLambertMaterial({ color: 0x2a2d33 }),
      lamp:  new THREE.MeshLambertMaterial({ color: 0xb23b2e }),
      wall:  new THREE.MeshLambertMaterial({ color: 0xf2ede4 }),
      floor: new THREE.MeshLambertMaterial({ color: 0x8b5a3c }),
      table: new THREE.MeshLambertMaterial({ color: 0x9a9ca3 }),
      art:   new THREE.MeshLambertMaterial({ color: 0xd4a93b }),
    };

    /* ── Geometry helpers ────────────────────────────────────── */
    function addBox(
      w: number, h: number, d: number,
      x: number, y: number, z: number,
      mat: THREE.Material,
      parent: THREE.Object3D = scene,
    ) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y + h / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }

    /* Floor + walls */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      materials.floor,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      materials.wall,
    );
    backWall.position.set(0, 2.5, -5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const sideWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      materials.wall,
    );
    sideWall.rotation.y = Math.PI / 2;
    sideWall.position.set(-5, 2.5, 0);
    sideWall.receiveShadow = true;
    scene.add(sideWall);

    /* Sofa (always visible) */
    addBox(3.4, 0.45, 1.3, 0, 0.4, -3.2, materials.sofa);
    addBox(3.4, 0.95, 0.28, 0, 0.85, -3.78, materials.sofa);
    addBox(0.28, 0.65, 1.3, -1.56, 0.85, -3.2, materials.sofa);
    addBox(0.28, 0.65, 1.3, 1.56, 0.85, -3.2, materials.sofa);

    /* Coffee table (always visible) */
    addBox(1.6, 0.08, 0.9, 0, 0.42, -1.4, materials.table);
    addBox(0.06, 0.42, 0.06, -0.7, 0, -1.05, materials.table);
    addBox(0.06, 0.42, 0.06,  0.7, 0, -1.05, materials.table);
    addBox(0.06, 0.42, 0.06, -0.7, 0, -1.75, materials.table);
    addBox(0.06, 0.42, 0.06,  0.7, 0, -1.75, materials.table);

    /* ── Decor groups (toggleable via .visible) ─────────────── */
    const decor: Partial<Record<DecorElement['id'], THREE.Object3D>> = {};

    /* Rug */
    const rugGroup = new THREE.Group();
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.5),
      materials.lamp,
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.01, -1.4);
    rug.receiveShadow = true;
    rugGroup.add(rug);
    scene.add(rugGroup);
    decor.rug = rugGroup;

    /* Plant (pot + foliage) */
    const plantGroup = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.26, 0.45, 20),
      new THREE.MeshLambertMaterial({ color: 0x8c5a3c }),
    );
    pot.position.set(0, 0.225, 0);
    pot.castShadow = true;
    pot.receiveShadow = true;
    plantGroup.add(pot);
    const foliage1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 12),
      new THREE.MeshLambertMaterial({ color: 0x5d7d3a }),
    );
    foliage1.position.set(0, 0.85, 0);
    foliage1.castShadow = true;
    plantGroup.add(foliage1);
    const foliage2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 14, 10),
      new THREE.MeshLambertMaterial({ color: 0x6e8d48 }),
    );
    foliage2.position.set(0.25, 1.15, 0.15);
    foliage2.castShadow = true;
    plantGroup.add(foliage2);
    plantGroup.position.set(-3.5, 0, -3.5);
    scene.add(plantGroup);
    decor.plant = plantGroup;

    /* Wall art (frame + canvas, on back wall) */
    const artGroup = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.1, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x1f2226 }),
    );
    frame.castShadow = true;
    artGroup.add(frame);
    const canvas = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.92, 0.02),
      materials.art,
    );
    canvas.position.set(0, 0, 0.04);
    artGroup.add(canvas);
    artGroup.position.set(-2.3, 2.7, -4.94);
    scene.add(artGroup);
    decor.art = artGroup;

    /* Floor lamp */
    const lampGroup = new THREE.Group();
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24),
      materials.lamp,
    );
    lampBase.position.set(0, 0.025, 0);
    lampBase.castShadow = true;
    lampGroup.add(lampBase);
    const lampPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 2.3, 16),
      materials.sofa,
    );
    lampPost.position.set(0, 1.15, 0);
    lampPost.castShadow = true;
    lampGroup.add(lampPost);
    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.55, 24, 1, true),
      materials.lamp,
    );
    lampShade.position.set(0, 2.6, 0);
    lampShade.castShadow = true;
    lampGroup.add(lampShade);
    lampGroup.position.set(2.5, 0, -2.4);
    scene.add(lampGroup);
    decor.lamp = lampGroup;

    /* Bookshelf */
    const shelfGroup = new THREE.Group();
    addBox(0.4, 2.0, 1.4, 0, 0, 0, materials.sofa, shelfGroup);
    for (let i = 1; i <= 3; i++) {
      addBox(0.42, 0.04, 1.42, 0, i * 0.55, 0, materials.table, shelfGroup);
    }
    shelfGroup.position.set(-4.6, 0, -2.5);
    scene.add(shelfGroup);
    decor.shelf = shelfGroup;

    /* ── Stash refs for the prop-driven effects ─────────────── */
    refs.current = {
      scene,
      camera,
      controls,
      ambient,
      key,
      fill,
      materials,
      decor,
    };

    /* ── Animation loop ─────────────────────────────────────── */
    let frameId = 0;
    function animate() {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    /* ── Resize ─────────────────────────────────────────────── */
    function onResize() {
      if (!mountRef.current) return;
      W = mountRef.current.clientWidth;
      H = mountRef.current.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      controls.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      refs.current = {};
    };
  }, []);

  /* ── Materials → 3D ────────────────────────────────────────── */
  useEffect(() => {
    const mats = refs.current.materials;
    if (!mats) return;
    const ordered = PALETTE.filter((s) => selectedSwatches.includes(s.id));
    const get = (i: number, fallback: string) => ordered[i]?.color ?? fallback;

    mats.sofa.color.set(get(0, '#2a2d33'));
    mats.lamp.color.set(get(1, '#b23b2e'));
    mats.floor.color.set(get(2, '#8b5a3c'));
    mats.wall.color.set(get(3, '#f2ede4'));
    mats.art.color.set(get(4, '#d4a93b') ?? '#d4a93b');
  }, [selectedSwatches]);

  /* ── Lighting mood → 3D ───────────────────────────────────── */
  useEffect(() => {
    const r = refs.current;
    if (!r.ambient || !r.key || !r.fill || !r.scene) return;
    const mood = LIGHTING_MOODS.find((m) => m.id === lighting) ?? LIGHTING_MOODS[0];
    r.ambient.intensity = mood.ambient;
    r.key.color.setHex(mood.keyColor);
    r.key.intensity = mood.keyIntensity;
    r.fill.color.setHex(mood.fillColor);
    r.fill.intensity = mood.fillIntensity;
    r.scene.background = new THREE.Color(mood.background);
  }, [lighting]);

  /* ── Decor toggles → 3D ───────────────────────────────────── */
  useEffect(() => {
    const decor = refs.current.decor;
    if (!decor) return;
    (Object.keys(decor) as DecorElement['id'][]).forEach((id) => {
      const obj = decor[id];
      if (obj) obj.visible = activeDecor.includes(id);
    });
  }, [activeDecor]);

  /* ── Atmosphere → 3D (scene.fog) ──────────────────────────── */
  useEffect(() => {
    const scene = refs.current.scene;
    if (!scene) return;
    const atm = ATMOSPHERES.find((a) => a.id === atmosphere) ?? ATMOSPHERES[0];
    if (!atm.fog) {
      scene.fog = null;
    } else {
      scene.fog = new THREE.FogExp2(atm.fog.color, atm.fog.density);
    }
  }, [atmosphere]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ cursor: 'grab' }}
      aria-label="Interactive 3D interior – drag to orbit, scroll to zoom"
    />
  );
}

/* ── AI Chat bar (secondary input) ─────────────────────────────── */

function ChatBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 items-center">
        <span
          className="font-medium"
          style={{
            fontSize: '10px',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            marginRight: '4px',
          }}
        >
          Try
        </span>
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className="px-2.5 py-1 rounded-full transition-colors"
            style={{
              fontSize: '11px',
              backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
              border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
              color: 'var(--modus-wc-color-base-content, #252a2e)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'var(--modus-wc-color-base-100, #f1f1f6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                'var(--modus-wc-color-base-page, #fff)';
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit();
        }}
        className="flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{
          backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
          border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z"
            fill="var(--modus-wc-color-primary, #0063A7)"
          />
          <circle cx="19" cy="5" r="1.2" fill="var(--modus-wc-color-primary, #0063A7)" />
          <circle cx="5" cy="19" r="1.2" fill="var(--modus-wc-color-primary, #0063A7)" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask AI for something specific…"
          className="flex-1 bg-transparent outline-none"
          style={{
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            color: 'var(--modus-wc-color-base-content, #101828)',
          }}
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!value.trim()}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{
            width: '30px',
            height: '30px',
            backgroundColor: value.trim()
              ? 'var(--modus-wc-color-primary, #0063A7)'
              : 'var(--modus-wc-color-base-200, #e0e1e9)',
            color: '#ffffff',
            cursor: value.trim() ? 'pointer' : 'not-allowed',
            border: 'none',
          }}
        >
          <ModusWcIcon name="arrow_right" size="xs" decorative style={{ color: '#fff' }} />
        </button>
      </form>
    </div>
  );
}

/* ── Reusable: section label ───────────────────────────────────── */

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <ModusWcIcon
        name={icon}
        size="xs"
        decorative
        style={{ color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)' }}
      />
      <span
        className="font-medium"
        style={{
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          color: 'var(--modus-wc-color-base-content, #364153)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Lighting mood picker (2×2 chip grid) ──────────────────────── */

function LightingPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LIGHTING_MOODS.map((m) => {
        const sel = m.id === value;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            aria-pressed={sel}
            className="px-3 py-2 rounded-lg text-left transition-colors"
            style={{
              backgroundColor: sel
                ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
                : 'var(--modus-wc-color-base-page, #fff)',
              border: `1px solid ${
                sel
                  ? 'var(--modus-wc-color-primary, #0063A7)'
                  : 'var(--modus-wc-color-base-200, #e0e1e9)'
              }`,
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: sel
                ? 'var(--modus-wc-color-primary, #0063A7)'
                : 'var(--modus-wc-color-base-content, #364153)',
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Material swatch picker ────────────────────────────────────── */

function SwatchPicker({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {PALETTE.map((s) => {
        const selected = selectedIds.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggle(s.id)}
            aria-pressed={selected}
            aria-label={s.name}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '999px',
              padding: 0,
              backgroundColor: s.color,
              cursor: 'pointer',
              boxShadow: selected
                ? '0 0 0 2px var(--modus-wc-color-base-page, #fff), 0 0 0 4px var(--modus-wc-color-primary, #0063A7)'
                : '0 0 0 1px rgba(0,0,0,0.08)',
              transition: 'box-shadow 0.12s ease, transform 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (!selected) e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              if (!selected) e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Decor toggle chips ────────────────────────────────────────── */

function DecorToggles({
  active,
  onToggle,
}: {
  active: DecorElement['id'][];
  onToggle: (id: DecorElement['id']) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DECOR.map((d) => {
        const isActive = active.includes(d.id);
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onToggle(d.id)}
            aria-pressed={isActive}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: isActive
                ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
                : 'var(--modus-wc-color-base-page, #fff)',
              border: `1px solid ${
                isActive
                  ? 'var(--modus-wc-color-primary, #0063A7)'
                  : 'var(--modus-wc-color-base-200, #e0e1e9)'
              }`,
              color: isActive
                ? 'var(--modus-wc-color-primary, #0063A7)'
                : 'var(--modus-wc-color-base-content, #252a2e)',
            }}
          >
            <ModusWcIcon name={d.icon} size="xs" decorative style={{ color: 'inherit' }} />
            <span
              className="font-medium whitespace-nowrap"
              style={{ fontSize: 'var(--modus-wc-font-size-xs, 12px)' }}
            >
              {d.label}
            </span>
            {isActive && (
              <ModusWcIcon name="check" size="xs" decorative style={{ color: 'inherit' }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Atmosphere picker (2×2 chip grid) ─────────────────────────── */

function AtmospherePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ATMOSPHERES.map((a) => {
        const sel = a.id === value;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange(a.id)}
            aria-pressed={sel}
            className="px-3 py-2 rounded-lg text-left transition-colors"
            style={{
              backgroundColor: sel
                ? 'var(--modus-wc-color-primary-light, #e8f4fd)'
                : 'var(--modus-wc-color-base-page, #fff)',
              border: `1px solid ${
                sel
                  ? 'var(--modus-wc-color-primary, #0063A7)'
                  : 'var(--modus-wc-color-base-200, #e0e1e9)'
              }`,
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: sel
                ? 'var(--modus-wc-color-primary, #0063A7)'
                : 'var(--modus-wc-color-base-content, #364153)',
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Action buttons (bottom of right panel) ────────────────────── */

function ActionButton({
  variant,
  icon,
  label,
  flash,
  onClick,
}: {
  variant: 'primary' | 'tertiary';
  icon: React.ReactNode;
  label: string;
  flash?: boolean;
  onClick: () => void;
}) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors"
      style={{
        flex: isPrimary ? 1.4 : 1,
        padding: '13px 10px',
        fontSize: 'var(--modus-wc-font-size-xs, 12px)',
        backgroundColor: flash
          ? 'var(--modus-wc-color-status-success, #1e7e34)'
          : isPrimary
          ? 'var(--modus-wc-color-primary, #0063A7)'
          : 'var(--modus-wc-color-base-page, #fff)',
        color:
          flash || isPrimary
            ? '#ffffff'
            : 'var(--modus-wc-color-base-content, #364153)',
        border: `1px solid ${
          flash
            ? 'var(--modus-wc-color-status-success, #1e7e34)'
            : isPrimary
            ? 'var(--modus-wc-color-primary, #0063A7)'
            : 'var(--modus-wc-color-base-200, #e0e1e9)'
        }`,
      }}
      onMouseEnter={(e) => {
        if (flash) return;
        e.currentTarget.style.filter = isPrimary
          ? 'brightness(1.06)'
          : 'none';
        if (!isPrimary) {
          e.currentTarget.style.backgroundColor =
            'var(--modus-wc-color-base-100, #f1f1f6)';
        }
      }}
      onMouseLeave={(e) => {
        if (flash) return;
        e.currentTarget.style.filter = 'none';
        if (!isPrimary) {
          e.currentTarget.style.backgroundColor =
            'var(--modus-wc-color-base-page, #fff)';
        }
      }}
    >
      {flash ? (
        <ModusWcIcon name="check" size="xs" decorative style={{ color: '#fff' }} />
      ) : (
        icon
      )}
      <span className="whitespace-nowrap">{flash ? 'Applied' : label}</span>
    </button>
  );
}

/* Defaults used for both initial state and the "Reset" button. */
const INITIAL = {
  swatches: ['charcoal', 'brick', 'walnut', 'cream', 'mustard'],
  lighting: 'daylight',
  decor: ['rug', 'lamp', 'shelf'] as DecorElement['id'][],
  atmosphere: 'crisp',
};

/* ── Host: 3D Design Studio ────────────────────────────────────── */

export default function Creative9() {
  const [selectedSwatches, setSelectedSwatches] = useState<string[]>(INITIAL.swatches);
  const [lighting, setLighting] = useState<string>(INITIAL.lighting);
  const [activeDecor, setActiveDecor] = useState<DecorElement['id'][]>(INITIAL.decor);
  const [atmosphere, setAtmosphere] = useState<string>(INITIAL.atmosphere);
  const [chat, setChat] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  function toggleSwatch(id: string) {
    setSelectedSwatches((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleDecor(id: DecorElement['id']) {
    setActiveDecor((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  /* Re-roll every possibility — AI as creative partner. */
  function handleSurprise() {
    const randomLighting =
      LIGHTING_MOODS[Math.floor(Math.random() * LIGHTING_MOODS.length)].id;
    const numSwatches = 2 + Math.floor(Math.random() * 4);
    const shuffledSwatches = [...PALETTE]
      .sort(() => Math.random() - 0.5)
      .slice(0, numSwatches)
      .map((s) => s.id);
    const numDecor = 1 + Math.floor(Math.random() * DECOR.length);
    const shuffledDecor = [...DECOR]
      .sort(() => Math.random() - 0.5)
      .slice(0, numDecor)
      .map((d) => d.id);
    const randomAtmosphere =
      ATMOSPHERES[Math.floor(Math.random() * ATMOSPHERES.length)].id;

    setLighting(randomLighting);
    setSelectedSwatches(shuffledSwatches);
    setActiveDecor(shuffledDecor);
    setAtmosphere(randomAtmosphere);
  }

  function handleReset() {
    setSelectedSwatches(INITIAL.swatches);
    setLighting(INITIAL.lighting);
    setActiveDecor(INITIAL.decor);
    setAtmosphere(INITIAL.atmosphere);
  }

  function handleSave() {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  }

  return (
    <div
      className="flex gap-5 p-5 rounded-2xl"
      style={{
        backgroundColor: 'var(--modus-wc-color-base-100, #f5f6f8)',
        width: '1040px',
      }}
    >
      {/* ── LEFT: 3D viewport + chat bar ─────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Viewport grows to fill — that's what pushes the chat
            bar down to the column's true bottom, so it lines up
            with the action buttons on the right. */}
        <div
          className="relative rounded-xl overflow-hidden flex-1"
          style={{
            minHeight: '420px',
            backgroundColor: '#1d1f24',
            boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
          }}
        >
          <InteriorViewport
            selectedSwatches={selectedSwatches}
            lighting={lighting}
            activeDecor={activeDecor}
            atmosphere={atmosphere}
          />

          {/* Orbit hint */}
          <div
            className="absolute flex items-center gap-1.5 rounded-full"
            style={{
              bottom: '14px',
              right: '14px',
              padding: '4px 10px',
              backgroundColor: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              color: 'rgba(255,255,255,0.92)',
              fontSize: '10px',
              letterSpacing: '0.3px',
            }}
          >
            <ModusWcIcon name="drag" size="xs" decorative style={{ color: '#fff' }} />
            Drag to orbit · scroll to zoom
          </div>
        </div>

        <ChatBar value={chat} onChange={setChat} onSubmit={() => setChat('')} />
      </div>

      {/* ── RIGHT: possibility controls + bottom action row ───── */}
      <div className="flex flex-col gap-3 shrink-0" style={{ width: '320px' }}>
        {/* Panel card — grows to fill, leaving the button row to
            land at the same y as the chat bar on the left. */}
        <div
          className="flex-1 flex flex-col gap-4 p-5 rounded-2xl"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-page, #fff)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Title block */}
          <div className="flex flex-col gap-0.5">
            <span
              className="font-medium"
              style={{
                fontSize: '10px',
                color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                letterSpacing: '0.8px',
              }}
            >
              AI POSSIBILITIES
            </span>
            <span
              className="font-semibold"
              style={{
                fontSize: 'var(--modus-wc-font-size-lg, 18px)',
                color: 'var(--modus-wc-color-base-content, #101828)',
                lineHeight: 1.3,
              }}
            >
              Explore this scene
            </span>
          </div>

          {/* Lighting Mood */}
          <div className="flex flex-col gap-1.5">
            <SectionLabel icon="sun" label="Lighting mood" />
            <LightingPicker value={lighting} onChange={setLighting} />
          </div>

          {/* Surface Materials */}
          <div className="flex flex-col gap-1.5">
            <SectionLabel icon="palette" label="Surface materials" />
            <SwatchPicker
              selectedIds={selectedSwatches}
              onToggle={toggleSwatch}
            />
          </div>

          {/* Decor */}
          <div className="flex flex-col gap-1.5">
            <SectionLabel icon="sustainability" label="Decor elements" />
            <DecorToggles active={activeDecor} onToggle={toggleDecor} />
          </div>

          {/* Atmosphere — wires into scene.fog in the 3D viewport */}
          <div className="flex flex-col gap-1.5">
            <SectionLabel icon="moon" label="Atmosphere" />
            <AtmospherePicker value={atmosphere} onChange={setAtmosphere} />
          </div>
        </div>

        {/* Bottom action row — sits OUTSIDE the panel so its
            baseline aligns with the chat bar on the left. */}
        <div className="flex items-center gap-2">
          <ActionButton
            variant="tertiary"
            onClick={handleSurprise}
            label="Surprise me"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z"
                  fill="var(--modus-wc-color-primary, #0063A7)"
                />
                <circle cx="19" cy="5" r="1.2" fill="var(--modus-wc-color-primary, #0063A7)" />
                <circle cx="5" cy="19" r="1.2" fill="var(--modus-wc-color-primary, #0063A7)" />
              </svg>
            }
          />
          <ActionButton
            variant="tertiary"
            onClick={handleReset}
            label="Reset"
            icon={
              <ModusWcIcon
                name="refresh"
                size="xs"
                decorative
                style={{ color: 'var(--modus-wc-color-base-content, #364153)' }}
              />
            }
          />
          <ActionButton
            variant="primary"
            onClick={handleSave}
            label="Save vision"
            flash={savedFlash}
            icon={
              <ModusWcIcon
                name="bookmark"
                size="xs"
                decorative
                style={{ color: '#fff' }}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
