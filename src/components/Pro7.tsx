import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 7 — DEFER TO THE PROFESSIONAL
 *
 * To verify high-impact sections.
 *
 * The AI presents a single high-impact value (the anchor-bolt
 * embedment under one specific column) as an e-signature request,
 * with a live 3D model of the structure behind it. The exact
 * foundation being asked about is pulsing red in the model — so the
 * professional can see WHERE the question lives — and turns green
 * the moment they confirm.
 * ───────────────────────────────────────────────────────────────── */

/* World position of the anchor bolt being verified */
const ANCHOR = new THREE.Vector3(8, 0.3, 4);

export default function Pro7() {
  const mountRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<{
    mesh: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
    pulse: THREE.Mesh;
    pulseMaterial: THREE.MeshBasicMaterial;
  } | null>(null);
  const confirmedRef = useRef(false);

  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const confirmed = Boolean(confirmedAt);

  /* Keep the ref in sync so the animation loop can read it. */
  useEffect(() => {
    confirmedRef.current = confirmed;
    if (highlightRef.current) {
      const target = confirmed ? 0x2bbf6a : 0xff3b58;
      highlightRef.current.material.color.setHex(target);
      highlightRef.current.material.emissive.setHex(target);
      highlightRef.current.pulseMaterial.color.setHex(target);
    }
  }, [confirmed]);

  /* ── Three.js scene ──────────────────────────────────────────── */
  useEffect(() => {
    const mount = mountRef.current!;
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef1f5');
    scene.fog = new THREE.FogExp2(0xeef1f5, 0.014);

    const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 500);
    camera.position.set(28, 18, 28);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(2, 5, 0);
    controls.minDistance = 18;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.update();

    /* Lighting */
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    scene.add(new THREE.HemisphereLight(0xddeeff, 0x99a0aa, 0.5));

    const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
    sun.position.set(18, 28, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 90;
    const sc = 30;
    sun.shadow.camera.left = -sc;
    sun.shadow.camera.right = sc;
    sun.shadow.camera.top = sc;
    sun.shadow.camera.bottom = -sc;
    sun.shadow.bias = -0.0008;
    scene.add(sun);

    /* Ground */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({
        color: 0xd9dde4,
        roughness: 0.95,
        metalness: 0,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(120, 60, 0x000000, 0x000000);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.06;
    grid.position.y = 0.02;
    scene.add(grid);

    /* Steel material */
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xe6e9ee,
      roughness: 0.55,
      metalness: 0.35,
    });
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x3a3e44,
      transparent: true,
      opacity: 0.32,
    });

    function steelMember(
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
    ) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, steelMat);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const lines = new THREE.LineSegments(edges, edgeMat);
      lines.position.copy(mesh.position);
      scene.add(lines);
      return mesh;
    }

    /* Foundation pad */
    function pad(x: number, z: number, highlighted = false) {
      const w = 1.6;
      const h = 0.6;
      const geo = new THREE.BoxGeometry(w, h, w);
      const mat = new THREE.MeshStandardMaterial({
        color: highlighted ? 0xff3b58 : 0x9aa0aa,
        emissive: highlighted ? 0xff3b58 : 0x000000,
        emissiveIntensity: highlighted ? 0.25 : 0,
        roughness: 0.85,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const lines = new THREE.LineSegments(edges, edgeMat);
      lines.position.copy(mesh.position);
      scene.add(lines);

      if (highlighted) {
        /* A flat pulse disc at the anchor for visual emphasis */
        const pulseGeo = new THREE.RingGeometry(0.9, 1.2, 48);
        const pulseMat = new THREE.MeshBasicMaterial({
          color: 0xff3b58,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });
        const pulse = new THREE.Mesh(pulseGeo, pulseMat);
        pulse.rotation.x = -Math.PI / 2;
        pulse.position.set(x, 0.04, z);
        scene.add(pulse);

        highlightRef.current = {
          mesh,
          material: mat,
          pulse,
          pulseMaterial: pulseMat,
        };
      }
      return mesh;
    }

    /* ── Build a 3-bay × 2-deep × 3-storey steel frame ──────────── */
    const bay = 6;
    const depth = 5;
    const storey = 3.8;
    const colW = 0.35;
    const beamW = 0.35;
    const beamH = 0.5;

    const colsX = [-bay, 0, bay];
    const colsZ = [-depth / 2, depth / 2];
    const heights = [0, storey, storey * 2, storey * 3];

    /* Foundation pads — one is the highlighted "verify-me" anchor */
    for (const cx of colsX) {
      for (const cz of colsZ) {
        const isAnchor = Math.abs(cx - bay) < 0.01 && Math.abs(cz - depth / 2) < 0.01;
        pad(cx, cz, isAnchor);
      }
    }

    /* Columns */
    for (const cx of colsX) {
      for (const cz of colsZ) {
        steelMember(cx, 0.6, cz, colW, storey * 3, colW);
      }
    }

    /* Beams along X (between columns at each storey) */
    for (let lvl = 1; lvl < heights.length; lvl++) {
      const y = 0.6 + heights[lvl] - beamH;
      for (let i = 0; i < colsX.length - 1; i++) {
        const x = (colsX[i] + colsX[i + 1]) / 2;
        for (const cz of colsZ) {
          steelMember(x, y, cz, bay - colW, beamH, beamW);
        }
      }
    }

    /* Beams along Z (depth direction) */
    for (let lvl = 1; lvl < heights.length; lvl++) {
      const y = 0.6 + heights[lvl] - beamH;
      for (const cx of colsX) {
        steelMember(cx, y, 0, beamW, beamH, depth - colW);
      }
    }

    /* Floor slabs — translucent so the frame stays visible */
    for (let lvl = 1; lvl < heights.length; lvl++) {
      const y = 0.6 + heights[lvl];
      const slabGeo = new THREE.BoxGeometry(bay * 2 + colW, 0.12, depth + colW);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0xcfd4dc,
        roughness: 0.9,
        metalness: 0.05,
        transparent: true,
        opacity: 0.55,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, y, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      scene.add(slab);
    }

    /* Diagonal bracing on the far back bay */
    function brace(x1: number, y1: number, x2: number, y2: number, z: number) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const geo = new THREE.BoxGeometry(0.25, len, 0.25);
      const mesh = new THREE.Mesh(geo, steelMat);
      mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
      mesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
      mesh.castShadow = true;
      scene.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const lines = new THREE.LineSegments(edges, edgeMat);
      lines.position.copy(mesh.position);
      lines.rotation.copy(mesh.rotation);
      scene.add(lines);
    }

    const braceZ = -depth / 2;
    for (let lvl = 0; lvl < heights.length - 1; lvl++) {
      const yLow = 0.6 + heights[lvl];
      const yHigh = 0.6 + heights[lvl + 1] - beamH;
      for (let i = 0; i < colsX.length - 1; i++) {
        brace(colsX[i] + colW / 2, yLow, colsX[i + 1] - colW / 2, yHigh, braceZ);
      }
    }

    /* ── Anchor → screen overlay ─────────────────────────────── */
    const tmp = new THREE.Vector3();

    function updateOverlay() {
      const marker = markerRef.current;
      if (!marker) return;
      tmp.copy(ANCHOR).project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * W;
      const sy = (-tmp.y * 0.5 + 0.5) * H;
      const onScreen = tmp.z < 1 && tmp.x > -1 && tmp.x < 1 && tmp.y > -1 && tmp.y < 1;
      marker.style.transform = `translate(-50%, -50%) translate3d(${sx}px, ${sy}px, 0)`;
      marker.style.opacity = onScreen ? '1' : '0';

      const line = lineRef.current;
      const card = cardRef.current;
      if (line && card) {
        const cr = card.getBoundingClientRect();
        const mountRect = mount.getBoundingClientRect();
        const cx = cr.right - mountRect.left - 12;
        const cy = cr.top + cr.height / 2 - mountRect.top;
        line.setAttribute('x1', String(cx));
        line.setAttribute('y1', String(cy));
        line.setAttribute('x2', String(sx));
        line.setAttribute('y2', String(sy));
      }
    }

    /* Animation loop */
    let frameId = 0;
    const clock = new THREE.Clock();
    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      controls.update();

      /* Pulse animation on the highlighted anchor */
      if (highlightRef.current) {
        const breathe = 0.5 + 0.5 * Math.sin(t * 3);
        const baseEmissive = confirmedRef.current ? 0.25 : 0.45;
        highlightRef.current.material.emissiveIntensity =
          baseEmissive + breathe * 0.35;
        const ringScale = 1 + ((t * 0.8) % 1) * 1.4;
        highlightRef.current.pulse.scale.setScalar(ringScale);
        highlightRef.current.pulseMaterial.opacity = 0.7 * (1 - ((t * 0.8) % 1));
      }

      renderer.render(scene, camera);
      updateOverlay();
    }
    animate();

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
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  function stamp() {
    return new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#eef1f5',
      }}
    >
      {/* 3D scene */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Connector line from card → anchor */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        <line
          ref={lineRef}
          stroke={confirmed ? '#2bbf6a' : '#ff3b58'}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>

      {/* Floating tag at the anchor */}
      <div
        ref={markerRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 5,
          pointerEvents: 'none',
          padding: '4px 10px',
          borderRadius: '1000px',
          backgroundColor: confirmed ? '#2bbf6a' : '#ff3b58',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          boxShadow: '0px 2px 6px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Column C-3 · anchor
      </div>

      {/* Verification card (overlay) */}
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: 56,
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      >
        <VerificationCard
          confirmedAt={confirmedAt}
          onConfirm={() => setConfirmedAt(stamp())}
          onUndo={() => setConfirmedAt(null)}
        />
      </div>

      {/* Camera-controls hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          right: 18,
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(0,0,0,0.55)',
          color: '#fff',
          fontSize: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: 6,
          lineHeight: 1.5,
          backdropFilter: 'blur(4px)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Camera controls</div>
        <div style={{ opacity: 0.85 }}>
          Drag — orbit &nbsp;·&nbsp; Right-drag — pan &nbsp;·&nbsp; Scroll — zoom
        </div>
      </div>
    </div>
  );
}

/* ── Verification card (e-signature for a single value) ────────── */
function VerificationCard({
  confirmedAt,
  onConfirm,
  onUndo,
}: {
  confirmedAt: string | null;
  onConfirm: () => void;
  onUndo: () => void;
}) {
  const confirmed = Boolean(confirmedAt);

  return (
    <div
      className="bg-white flex flex-col overflow-hidden"
      style={{
        width: '360px',
        borderRadius: 'var(--modus-wc-border-radius-lg, 16px)',
        border: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        boxShadow:
          '0px 18px 38px -16px rgba(15,23,42,0.30), 0px 8px 14px -6px rgba(15,23,42,0.12)',
      }}
    >
      {/* Status rail */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{
          backgroundColor: confirmed
            ? 'rgba(43,191,106,0.10)'
            : 'rgba(255,59,88,0.08)',
          borderBottom: confirmed
            ? '1px solid rgba(43,191,106,0.30)'
            : '1px solid rgba(255,59,88,0.25)',
        }}
      >
        <span
          aria-hidden
          className="flex items-center justify-center rounded-full"
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: confirmed ? '#2bbf6a' : '#ff3b58',
            color: '#ffffff',
          }}
        >
          <ModusWcIcon
            name={confirmed ? 'check' : 'alert_outline'}
            size="xs"
            decorative
          />
        </span>
        <span
          className="font-semibold uppercase"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            letterSpacing: '0.10em',
            color: confirmed ? '#1d8b4d' : '#b3243a',
          }}
        >
          {confirmed ? 'Confirmed by you' : "I'm deferring this to you"}
        </span>
      </div>

      {/* Value */}
      <div className="flex flex-col items-center text-center px-5 pt-6 pb-5">
        <span
          className="uppercase mb-2"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Column C-3 · Anchor bolt embedment
        </span>
        <span
          style={{
            fontSize: '40px',
            lineHeight: '44px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--modus-wc-color-base-content, #101828)',
          }}
        >
          350 <span style={{ fontSize: '22px', fontWeight: 500 }}>mm</span>
        </span>
        <span
          className="mt-1"
          style={{
            fontSize: 'var(--modus-wc-font-size-xs, 12px)',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            lineHeight: '18px',
          }}
        >
          into pile cap · 4× M24 Grade 8.8
        </span>
        <div
          className="mt-4 self-stretch"
          style={{
            height: '2px',
            background: confirmed
              ? '#2bbf6a'
              : 'repeating-linear-gradient(90deg, var(--modus-wc-color-base-content-low-contrast, #6a6e79) 0 6px, transparent 6px 10px)',
            transition: 'background 200ms ease',
          }}
        />
      </div>

      {/* Rationale / stamp */}
      {!confirmed ? (
        <div
          className="flex flex-col gap-2 px-5 pb-4"
          style={{
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            paddingTop: '14px',
          }}
        >
          <span
            className="font-semibold"
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
            }}
          >
            Why I&apos;m asking you, not deciding myself
          </span>
          <ul
            className="flex flex-col gap-1.5"
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '18px',
              margin: 0,
              padding: 0,
              listStyle: 'none',
            }}
          >
            <li className="flex gap-2">
              <span
                aria-hidden
                style={{
                  marginTop: '7px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '1000px',
                  backgroundColor: '#ff3b58',
                  flexShrink: 0,
                }}
              />
              <span>
                Sets pull-out capacity for{' '}
                <strong style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}>
                  220 kN factored uplift
                </strong>
                .
              </span>
            </li>
            <li className="flex gap-2">
              <span
                aria-hidden
                style={{
                  marginTop: '7px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '1000px',
                  backgroundColor: '#ff3b58',
                  flexShrink: 0,
                }}
              />
              <span>
                A change here propagates to all{' '}
                <strong style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}>
                  18 perimeter columns
                </strong>
                .
              </span>
            </li>
          </ul>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 px-5 pb-4"
          style={{
            borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
            paddingTop: '14px',
          }}
        >
          <ModusWcIcon
            name="check_circle"
            size="sm"
            decorative
            style={{ color: '#2bbf6a' }}
          />
          <span
            style={{
              fontSize: 'var(--modus-wc-font-size-xs, 12px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              lineHeight: '18px',
            }}
          >
            <strong>Engineer-of-record confirmed</strong> · You · {confirmedAt}
          </span>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{
          borderTop: '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
          backgroundColor: 'var(--modus-wc-color-base-100, #f8f9fa)',
        }}
      >
        {confirmed ? (
          <button
            type="button"
            onClick={onUndo}
            className="flex items-center justify-center gap-1.5 w-full transition-colors"
            style={{
              height: '36px',
              borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
              border:
                '1px solid var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              backgroundColor: 'transparent',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'var(--modus-wc-color-base-200, #e0e1e9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ModusWcIcon name="refresh" size="xs" decorative />
            Undo confirmation
          </button>
        ) : (
          <>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-1.5 transition-colors"
              style={{
                height: '36px',
                borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                border:
                  '1px solid var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                backgroundColor: 'transparent',
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  'var(--modus-wc-color-base-200, #e0e1e9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ModusWcIcon name="edit" size="xs" decorative />
              Edit value
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-1.5"
              style={{
                height: '36px',
                borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
                border: 'none',
                backgroundColor: 'var(--modus-wc-color-primary, #0063a3)',
                color: '#ffffff',
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ModusWcIcon name="check" size="xs" decorative />
              Confirm value
            </button>
          </>
        )}
      </div>
    </div>
  );
}
