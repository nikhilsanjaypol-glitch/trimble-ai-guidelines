import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ModusWcButton,
  ModusWcIcon,
} from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 6 — VISUALIZE WORK DONE FOR ACCEPTANCE
 *
 * Full-bleed Three.js BIM viewport.  The structural frame renders
 * normally; the four AI-added moment-frame joints on the right wall
 * glow cyan with an emissive pulse so they are unmistakably "the
 * elements AI just edited".  A compact card pinned to the bottom of
 * the viewport explains what changed and offers an Accept Changes
 * action.  Accepting fades the cyan glow, locks the joints into
 * neutral steel, and flips the card to a confirmed state.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

/* Trimble cyan = the AI-edit accent in the 3D scene; its only job is to
 * mark "this is the element AI just changed".  The card mirrors that
 * accent so the link between scene + card is unmistakable.  All other
 * surface, text, and status colours flow from Modus tokens. */
const AI_ACCENT_NUM = 0x1fb1a7;
const STEEL_GREY = new THREE.Color(0x6f7681);
const TOKEN_AI_ACCENT = 'var(--modus-wc-color-info, #1FB1A7)';
const TOKEN_BASE_PAGE = 'var(--modus-wc-color-base-page, #ffffff)';
const TOKEN_BASE_100 = 'var(--modus-wc-color-base-100, #ffffff)';
const TOKEN_BASE_200 = 'var(--modus-wc-color-base-200, #e0e1e9)';
const TOKEN_TEXT = 'var(--modus-wc-color-base-content, #171c1e)';
const TOKEN_TEXT_MUTED =
  'var(--modus-wc-color-base-content-low-contrast, #4a4f59)';
const TOKEN_SUCCESS = 'var(--modus-wc-color-status-success, #1e7e34)';

/* ── Building parameters ───────────────────────────────────────── */
const BAYS_X = 5;
const BAYS_Z = 3;
const STORIES = 5;
const BAY_W = 5;
const BAY_D = 5;
const STORY_H = 3.2;

const BLDG_W = BAYS_X * BAY_W;
const BLDG_D = BAYS_Z * BAY_D;
const BLDG_H = STORIES * STORY_H;
const X0 = -BLDG_W / 2;
const Z0 = -BLDG_D / 2;

const COL_SIZE = 0.42;
const BEAM_SIZE = 0.32;

export default function Pro6() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [accepted, setAccepted] = useState(false);
  const acceptedRef = useRef(false);

  useEffect(() => {
    acceptedRef.current = accepted;
  }, [accepted]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let W = mount.clientWidth;
    let H = mount.clientHeight;

    /* ── Renderer / scene / camera ────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef1f5');
    scene.fog = new THREE.FogExp2(0xeef1f5, 0.013);

    const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 200);
    camera.position.set(28, 18, 30);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, BLDG_H / 2, 0);
    controls.minDistance = 18;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.update();

    /* ── Lighting ─────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    scene.add(new THREE.HemisphereLight(0xddeeff, 0x8899aa, 0.45));

    const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
    sun.position.set(20, 35, 18);
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

    /* ── Ground + grid ────────────────────────────────────────── */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshLambertMaterial({ color: 0xc1c6cd }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(120, 60, 0x000000, 0x000000);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.05;
    grid.position.y = 0.01;
    scene.add(grid);

    /* ── Materials ────────────────────────────────────────────── */
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x6f7681,
      roughness: 0.7,
      metalness: 0.35,
    });
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x6f7681,
      roughness: 0.7,
      metalness: 0.35,
    });
    const faintMat = new THREE.MeshStandardMaterial({
      color: 0xa3a8b0,
      roughness: 0.85,
      metalness: 0.18,
    });
    const slabMat = new THREE.MeshLambertMaterial({
      color: 0xb6bbc3,
      transparent: true,
      opacity: 0.78,
    });

    /* ── Build the structural frame ───────────────────────────── */
    const frameGroup = new THREE.Group();
    scene.add(frameGroup);

    function makeColumn(x: number, z: number, faint: boolean) {
      const geo = new THREE.BoxGeometry(COL_SIZE, BLDG_H, COL_SIZE);
      const mesh = new THREE.Mesh(geo, faint ? faintMat : colMat);
      mesh.position.set(x, BLDG_H / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      frameGroup.add(mesh);
    }
    for (let i = 0; i <= BAYS_X; i++) {
      for (let k = 0; k <= BAYS_Z; k++) {
        const isFront = k === 0;
        const isRight = i === BAYS_X;
        const isCorner = (i === 0 && k === BAYS_Z);
        const visible = isFront || isRight || isCorner;
        makeColumn(X0 + i * BAY_W, Z0 + k * BAY_D, !visible);
      }
    }

    function beamX(y: number, z: number, faint: boolean) {
      const geo = new THREE.BoxGeometry(BLDG_W, BEAM_SIZE, BEAM_SIZE);
      const mesh = new THREE.Mesh(geo, faint ? faintMat : beamMat);
      mesh.position.set(0, y, z);
      mesh.castShadow = true;
      frameGroup.add(mesh);
    }
    function beamZ(x: number, y: number, faint: boolean) {
      const geo = new THREE.BoxGeometry(BEAM_SIZE, BEAM_SIZE, BLDG_D);
      const mesh = new THREE.Mesh(geo, faint ? faintMat : beamMat);
      mesh.position.set(x, y, 0);
      mesh.castShadow = true;
      frameGroup.add(mesh);
    }
    for (let f = 1; f <= STORIES; f++) {
      const y = f * STORY_H;
      for (let k = 0; k <= BAYS_Z; k++) {
        beamX(y, Z0 + k * BAY_D, k === BAYS_Z);
      }
      for (let i = 0; i <= BAYS_X; i++) {
        beamZ(X0 + i * BAY_W, y, i === 0);
      }
    }

    // Top floor slab
    const topSlab = new THREE.Mesh(
      new THREE.BoxGeometry(BLDG_W + 0.4, 0.2, BLDG_D + 0.4),
      slabMat,
    );
    topSlab.position.set(0, BLDG_H + 0.12, 0);
    topSlab.castShadow = true;
    topSlab.receiveShadow = true;
    frameGroup.add(topSlab);

    // X-bracing on the right wall, rear bay (matches reference image)
    function makeBrace(
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
    ) {
      const dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
      const len = dir.length();
      const geo = new THREE.BoxGeometry(0.14, len, 0.14);
      const mesh = new THREE.Mesh(geo, faintMat);
      mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
      // Orient the box along the brace direction.
      const up = new THREE.Vector3(0, 1, 0);
      mesh.quaternion.setFromUnitVectors(up, dir.clone().normalize());
      frameGroup.add(mesh);
    }
    const rightX = X0 + BLDG_W;
    const braceZ1 = Z0 + (BAYS_Z - 1) * BAY_D;
    const braceZ2 = Z0 + BAYS_Z * BAY_D;
    for (let f = 0; f < STORIES; f++) {
      const y1 = f * STORY_H;
      const y2 = (f + 1) * STORY_H;
      makeBrace(rightX, y1, braceZ1, rightX, y2, braceZ2);
      makeBrace(rightX, y2, braceZ1, rightX, y1, braceZ2);
    }

    /* ── AI-added moment-frame joints (the cyan elements) ─────── */
    const jointMaterials: THREE.MeshStandardMaterial[] = [];
    const jointMeshes: THREE.Mesh[] = [];
    for (let f = 1; f < STORIES; f++) {
      const x = X0 + BLDG_W + 0.05;
      const y = f * STORY_H;
      const z = Z0 + 1.5 * BAY_D;
      const mat = new THREE.MeshStandardMaterial({
        color: AI_ACCENT_NUM,
        emissive: AI_ACCENT_NUM,
        emissiveIntensity: 0.7,
        roughness: 0.32,
        metalness: 0.55,
      });
      const geo = new THREE.BoxGeometry(0.55, 1.15, 1.7);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      frameGroup.add(mesh);
      jointMaterials.push(mat);
      jointMeshes.push(mesh);
    }

    /* ── Animation loop ───────────────────────────────────────── */
    let frameId = 0;
    let elapsed = 0;
    const cyanColor = new THREE.Color(AI_ACCENT_NUM);

    function animate(t: number) {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (t - elapsed) / 1000);
      elapsed = t;

      controls.update();

      // Pulse the joints when not accepted; fade to neutral when accepted.
      const pulse = 0.55 + 0.25 * Math.sin(t / 320);
      const targetIntensity = acceptedRef.current ? 0 : pulse;
      const targetColor = acceptedRef.current ? STEEL_GREY : cyanColor;
      const lerpRate = 1 - Math.pow(0.001, dt); // ~smooth easing per second

      jointMaterials.forEach((mat) => {
        mat.emissiveIntensity +=
          (targetIntensity - mat.emissiveIntensity) * lerpRate;
        mat.color.lerp(targetColor, lerpRate * 0.6);
        mat.emissive.lerp(targetColor, lerpRate * 0.6);
      });

      // Subtle bob on the joints when not accepted, drawing the eye.
      jointMeshes.forEach((mesh, idx) => {
        const baseY = (idx + 1) * STORY_H;
        if (!acceptedRef.current) {
          mesh.position.y = baseY + Math.sin(t / 540 + idx * 0.6) * 0.04;
        } else {
          mesh.position.y += (baseY - mesh.position.y) * 0.08;
        }
      });

      renderer.render(scene, camera);
    }
    frameId = requestAnimationFrame(animate);

    /* ── Resize ───────────────────────────────────────────────── */
    function onResize() {
      W = mount.clientWidth;
      H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: TOKEN_BASE_PAGE,
      }}
    >
      {/* Three.js mount */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Project label — top left */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 28,
          zIndex: 6,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 10px)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: TOKEN_TEXT_MUTED,
            lineHeight: '14px',
          }}
        >
          Cedar Hills · Phase 2 · Block C
        </div>
        <div
          style={{
            fontSize: 'var(--modus-wc-font-size-md, 14px)',
            fontWeight: 700,
            color: TOKEN_TEXT,
            lineHeight: '20px',
          }}
        >
          BIM viewport · Structural
        </div>
      </div>

      {/* Camera controls hint — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: 22,
          left: 22,
          padding: '8px 12px',
          borderRadius: 8,
          backgroundColor: TOKEN_BASE_100,
          border: `1px solid ${TOKEN_BASE_200}`,
          color: TOKEN_TEXT,
          fontSize: 'var(--modus-wc-font-size-sm, 12px)',
          zIndex: 6,
          lineHeight: 1.5,
          boxShadow: '0px 4px 12px rgba(20, 24, 32, 0.08)',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 2, color: TOKEN_TEXT }}>
          Camera controls
        </div>
        <div style={{ color: TOKEN_TEXT_MUTED }}>
          Drag — orbit · Right-drag — pan · Scroll — zoom
        </div>
      </div>

      {/* AI changes card — bottom center, with Trimble rainbow gradient border */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          width: 380,
        }}
      >
        <div
          style={{
            background: TRIMBLE_RAINBOW,
            padding: 2,
            borderRadius: 16,
            boxShadow:
              '0px 18px 42px rgba(20, 24, 32, 0.22), 0px 2px 6px rgba(20, 24, 32, 0.10)',
          }}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: TOKEN_BASE_100,
              borderRadius: 14,
              overflow: 'hidden',
              padding: '16px 18px 16px',
            }}
          >
            {/* Title row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <ModusWcIcon
                name={accepted ? 'check_circle' : 'sparkle'}
                size="sm"
                decorative
                style={{
                  color: accepted ? TOKEN_SUCCESS : TOKEN_AI_ACCENT,
                }}
              />
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-md, 14px)',
                  fontWeight: 700,
                  color: TOKEN_TEXT,
                  lineHeight: '20px',
                }}
              >
                {accepted ? 'Changes accepted' : 'Added Structural joints'}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 'var(--modus-wc-font-size-xs, 10px)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: TOKEN_AI_ACCENT,
                  border: `1px solid ${TOKEN_AI_ACCENT}`,
                  borderRadius: 999,
                  padding: '2px 8px',
                  lineHeight: '14px',
                }}
              >
                4 elements
              </span>
            </div>

            {/* Description */}
            <p
              style={{
                margin: 0,
                marginBottom: 14,
                fontSize: 'var(--modus-wc-font-size-sm, 12px)',
                lineHeight: 1.55,
                color: TOKEN_TEXT_MUTED,
              }}
            >
              {accepted
                ? '4 moment-frame connections were applied to the right-wall beam-column intersections.'
                : 'AI added 4 moment-frame connections at right-wall beam-column intersections to satisfy the lateral seismic check.'}
            </p>

            {/* Actions */}
            {!accepted ? (
              <div className="flex items-center" style={{ gap: 8 }}>
                <ModusWcButton
                  color="primary"
                  size="md"
                  onButtonClick={() => setAccepted(true)}
                  style={{ flex: 1 }}
                >
                  <span
                    className="flex items-center justify-center"
                    style={{ gap: 6, width: '100%' }}
                  >
                    <ModusWcIcon name="check" size="sm" decorative />
                    Accept Changes
                  </span>
                </ModusWcButton>
                <ModusWcButton
                  color="secondary"
                  variant="outlined"
                  size="md"
                >
                  Reject
                </ModusWcButton>
              </div>
            ) : (
              <ModusWcButton
                color="tertiary"
                variant="borderless"
                size="sm"
                onButtonClick={() => setAccepted(false)}
              >
                <span className="flex items-center" style={{ gap: 4 }}>
                  <ModusWcIcon name="refresh" size="xs" decorative />
                  Reset demo
                </span>
              </ModusWcButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
