import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 3 — BE TRAINABLE, CONTEXT AND DOMAIN AWARE
 *
 * To ensure relevance & usefulness.
 *
 * AI must be able to apply the same constraints, templates, and
 * domain-specific knowledge that a professional would, in order to
 * provide relevant or professionally useful outputs. This includes
 * context around specific project, client, or industry requirements.
 *
 * Composition (modeled on Creative 6 / SiteScene):
 *   • Full-screen interactive 3D canvas (Three.js + OrbitControls).
 *     Drag to orbit, right-drag to pan, scroll to zoom — like a
 *     real modeling tool.
 *   • Quarry pile with terraced steps and a magenta no-fly / no-dig
 *     zone polygon overlaid on the ground.
 *   • Pulsing rainbow AI marker pinned in 3D world space at the
 *     centroid of the no-dig zone. Hover shows a preview pill;
 *     clicking toggles the AI callout.
 *   • Knowledge Manager card pinned top-left (the source files the
 *     AI was trained on).
 *   • A magenta connector line is always drawn from the KM card to
 *     the marker — the visual proof of file → context → grounded
 *     answer.
 *   • The AI callout (rainbow-bordered speech bubble citing the
 *     environmental impact study) anchors near the marker and
 *     follows it as the user orbits.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

const ZONE_MAGENTA = '#E5009E';

const FILES = [
  'Excavator_GNSS_Tolerance_Specs.pdf',
  'Error_Detection_Template.pdf',
  'Environmental_Mitigation_Policy.pdf',
  'Equipment_Pre-Start_Checklist.pdf',
];

/* World-space anchor — center of the magenta no-dig zone. */
const MARKER_ANCHOR = new THREE.Vector3(8.5, 0.05, 7.5);

/* Constants for placement of the popped-up callout relative to marker. */
const CALLOUT_W = 360;
const CALLOUT_OFFSET_X = 36; // distance from marker along x (screen)
const CALLOUT_OFFSET_Y = 12;

export default function Pro3() {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLButtonElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const lineKmRef = useRef<SVGLineElement>(null); // KM card → marker
  const lineCalloutRef = useRef<SVGLineElement>(null); // marker → callout
  const kmCardRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;

    let W = mount.clientWidth;
    let H = mount.clientHeight;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    /* Scene */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef0f3');
    scene.fog = new THREE.FogExp2(0xeef0f3, 0.012);

    /* Camera */
    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 300);
    camera.position.set(28, 22, 28);

    /* OrbitControls — like a 3D modeling tool */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controls.minDistance = 14;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.screenSpacePanning = true;
    controls.update();

    /* Lighting */
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

    /* Helper — terraced "rocky" box with subtle edge lines */
    function rockBox(
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: number,
    ) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshLambertMaterial({ color }),
      );
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({
          color: 0x4a4640,
          transparent: true,
          opacity: 0.18,
        }),
      );
      edges.position.copy(mesh.position);
      scene.add(edges);
      return mesh;
    }

    /* Ground */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshLambertMaterial({ color: 0xd0d4d8 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    /* Subtle grid for that "modeling tool" feel */
    const grid = new THREE.GridHelper(120, 60, 0x000000, 0x000000);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.05;
    grid.position.y = 0.01;
    scene.add(grid);

    /* Quarry pile — concentric stepped terraces */
    const TERRACES: Array<{ size: number; height: number; color: number }> = [
      { size: 16, height: 0.6, color: 0xa9a39a },
      { size: 13, height: 0.6, color: 0xb8b3aa },
      { size: 10, height: 0.6, color: 0xc4bfb6 },
      { size: 7, height: 0.6, color: 0xb0a89c },
      { size: 4.4, height: 0.6, color: 0x96887a },
    ];
    let stack = 0;
    TERRACES.forEach((t) => {
      rockBox(0, stack, 0, t.size, t.height, t.size, t.color);
      stack += t.height;
    });
    rockBox(0, stack, 0, 2.6, 0.3, 2.6, 0x6f6357);

    /* Boulders */
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
      scene.add(mesh);
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

    /* Spoil mound */
    const mound = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 1.4, 7),
      new THREE.MeshLambertMaterial({ color: 0x9a8e7e, flatShading: true }),
    );
    mound.position.set(-10, 0.7, -7);
    mound.castShadow = true;
    mound.receiveShadow = true;
    scene.add(mound);

    /* Power poles + wires */
    function pole(x: number, z: number, height = 7) {
      rockBox(x, 0, z, 0.18, height, 0.18, 0x6e6258);
      rockBox(x, height - 0.6, z, 1.6, 0.12, 0.12, 0x6e6258);
      rockBox(x, height - 1.4, z, 2.0, 0.12, 0.12, 0x6e6258);
      const cap1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xdedcd6 }),
      );
      cap1.position.set(x + 0.8, height - 0.5, z);
      scene.add(cap1);
      const cap2 = cap1.clone();
      cap2.position.x = x - 0.8;
      scene.add(cap2);
    }
    pole(-12, -8);
    pole(-12, -2);
    pole(-12, 4);

    const wireMat = new THREE.LineBasicMaterial({
      color: 0x363636,
      transparent: true,
      opacity: 0.55,
    });
    function wire(x1: number, z1: number, x2: number, z2: number, y: number) {
      const pts: THREE.Vector3[] = [];
      const segs = 16;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const x = THREE.MathUtils.lerp(x1, x2, t);
        const z = THREE.MathUtils.lerp(z1, z2, t);
        const droop = -0.18 * Math.sin(t * Math.PI);
        pts.push(new THREE.Vector3(x, y + droop, z));
      }
      scene.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat),
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

    /* ── Magenta no-dig zone ─────────────────────────────────────── */
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
    scene.add(zoneMesh);

    const outlinePts = zoneShape
      .getPoints()
      .map((p) => new THREE.Vector3(p.x, 0, -p.y));
    const zoneOutline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(outlinePts),
      new THREE.LineBasicMaterial({ color: ZONE_MAGENTA }),
    );
    zoneOutline.position.y = ZONE_Y + 0.02;
    scene.add(zoneOutline);

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
    scene.add(haloMesh);

    /* ── Project marker → screen, update overlays ────────────────── */
    const tmp = new THREE.Vector3();

    function updateOverlay() {
      const marker = markerRef.current;
      const callout = calloutRef.current;
      const km = kmCardRef.current;
      const lineKm = lineKmRef.current;
      const lineCallout = lineCalloutRef.current;
      const pill = previewRef.current;
      if (!marker) return;

      tmp.copy(MARKER_ANCHOR).project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * W;
      const sy = (-tmp.y * 0.5 + 0.5) * H;
      const onScreen =
        tmp.z < 1 && tmp.x > -1 && tmp.x < 1 && tmp.y > -1 && tmp.y < 1;

      marker.style.transform = `translate(-50%, -50%) translate3d(${sx}px, ${sy}px, 0)`;
      marker.style.opacity = onScreen ? '1' : '0';
      marker.style.pointerEvents = onScreen ? 'auto' : 'none';

      if (pill) {
        pill.style.transform = `translate(-50%, -100%) translate3d(${sx}px, ${sy - 28}px, 0)`;
        if (!onScreen || openRef.current) pill.classList.remove('visible');
      }

      /* Callout — anchor to the right of the marker, clamped on-screen. */
      if (callout && openRef.current) {
        const cardW = callout.offsetWidth || CALLOUT_W;
        const cardH = callout.offsetHeight || 80;
        let cardLeft: number;
        if (sx + CALLOUT_OFFSET_X + cardW + 16 <= W) {
          cardLeft = sx + CALLOUT_OFFSET_X;
        } else if (sx - CALLOUT_OFFSET_X - cardW - 16 >= 0) {
          cardLeft = sx - CALLOUT_OFFSET_X - cardW;
        } else {
          cardLeft = Math.max(
            16,
            Math.min(W - cardW - 16, sx - cardW / 2),
          );
        }
        let cardTop = sy - cardH / 2 + CALLOUT_OFFSET_Y;
        cardTop = Math.max(16, Math.min(H - cardH - 16, cardTop));

        callout.style.transform = `translate3d(${Math.round(cardLeft)}px, ${Math.round(cardTop)}px, 0)`;

        /* Line: marker → nearest edge of callout */
        if (lineCallout) {
          const cx = cardLeft + (sx > cardLeft + cardW / 2 ? cardW : 0);
          const cy = cardTop + cardH / 2;
          lineCallout.setAttribute('x1', String(Math.round(sx)));
          lineCallout.setAttribute('y1', String(Math.round(sy)));
          lineCallout.setAttribute('x2', String(Math.round(cx)));
          lineCallout.setAttribute('y2', String(Math.round(cy)));
        }
      }

      /* KM card line — always drawn from card bottom-right to marker. */
      if (km && lineKm && onScreen) {
        const kmRect = km.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const kx = kmRect.right - cRect.left - 16;
        const ky = kmRect.bottom - cRect.top - 16;
        lineKm.setAttribute('x1', String(Math.round(kx)));
        lineKm.setAttribute('y1', String(Math.round(ky)));
        lineKm.setAttribute('x2', String(Math.round(sx)));
        lineKm.setAttribute('y2', String(Math.round(sy)));
      }
    }

    /* Render loop */
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

    /* Resize */
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
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#eef0f3',
      }}
    >
      {/* Three.js mount — fills the whole viewport */}
      <div
        ref={mountRef}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />

      {/* SVG layer — both connector lines */}
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
          <linearGradient
            id="rainbowLine"
            x1="0"
            y1="0"
            x2="2400"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#00D7C0" />
            <stop offset="33%" stopColor="#009AFE" />
            <stop offset="55%" stopColor="#4A00FF" />
            <stop offset="78%" stopColor="#FF2092" />
            <stop offset="100%" stopColor="#FF00D3" />
          </linearGradient>
        </defs>
        {/* KM card → marker — always visible */}
        <line
          ref={lineKmRef}
          stroke={ZONE_MAGENTA}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* Marker → callout — only when callout is open */}
        <line
          ref={lineCalloutRef}
          stroke="url(#rainbowLine)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={open ? 0.9 : 0}
          style={{ transition: 'opacity 200ms ease' }}
        />
      </svg>

      {/* Pulsing AI marker — pinned to the no-dig zone in 3D world space */}
      <button
        ref={markerRef}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={open ? 'Close AI insight' : 'Open AI insight'}
        aria-pressed={open}
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

      {/* Hover preview pill (only when marker is hovered AND callout closed) */}
      <div
        ref={previewRef}
        className={`ai-preview-pill ${hovered && !open ? 'visible' : ''}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 7,
          pointerEvents: 'none',
        }}
      >
        <span className="pill-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z"
              fill="white"
            />
            <circle cx="19" cy="5" r="1.2" fill="white" />
            <circle cx="5" cy="19" r="1.2" fill="white" />
          </svg>
        </span>
        <div className="pill-text">
          <div className="pill-title">No-fly / no-dig zone</div>
          <div className="pill-hint">Click to see why</div>
        </div>
      </div>

      {/* Knowledge Manager card — pinned top-left, always visible */}
      <div
        ref={kmCardRef}
        className="bg-white flex flex-col"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          width: '300px',
          padding: '16px',
          gap: '12px',
          borderRadius: 'var(--modus-wc-border-radius-lg, 12px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
          zIndex: 10,
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            backgroundColor: '#1AB394',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            fontWeight: 700,
            lineHeight: '20px',
            textAlign: 'center',
          }}
        >
          Knowledge Manager - Project Files
        </div>
        <ul
          className="flex flex-col"
          style={{
            listStyle: 'none',
            padding: '4px 4px 0 4px',
            margin: 0,
            gap: '12px',
          }}
        >
          {FILES.map((name) => (
            <li key={name} className="flex items-center gap-3">
              <ModusWcIcon
                name="file"
                size="sm"
                decorative
                style={{
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                }}
              />
              <span
                style={{
                  fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                  fontWeight: 600,
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  lineHeight: '20px',
                }}
              >
                {name}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="w-full transition-colors"
          style={{
            backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
            color: 'var(--modus-wc-color-base-content, #171c1e)',
            padding: '12px 16px',
            borderRadius: 'var(--modus-wc-border-radius-md, 8px)',
            border: 'none',
            fontSize: 'var(--modus-wc-font-size-sm, 14px)',
            fontWeight: 700,
            lineHeight: '20px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--modus-wc-color-base-200, #e0e1e9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--modus-wc-color-base-100, #f1f1f6)';
          }}
        >
          Add files
        </button>
      </div>

      {/* AI callout — anchored near the 3D marker, only visible when open */}
      <div
        ref={calloutRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${CALLOUT_W}px`,
          padding: '2px',
          borderRadius: 'var(--modus-wc-border-radius-lg, 14px)',
          background: TRIMBLE_RAINBOW,
          boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
          zIndex: 11,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 220ms ease',
          willChange: 'transform',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{ width: '24px', height: '24px', marginTop: '1px' }}
          >
            <ModusWcIcon
              name="sparkle"
              size="sm"
              decorative
              style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}
            />
          </span>
          <div className="flex flex-col" style={{ gap: '6px', flex: 1 }}>
            <span
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 14px)',
                fontWeight: 500,
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                lineHeight: '22px',
                fontStyle: 'italic',
              }}
            >
              “This is a no-fly/no-dig zone based on the attached environmental
              impact study.”
            </span>
            {/* Source chip linking back to the KM file */}
            <span
              className="flex items-center gap-1.5 self-start"
              style={{
                marginTop: '4px',
                padding: '4px 8px',
                borderRadius: '1000px',
                backgroundColor: 'var(--modus-wc-color-base-100, #f1f1f6)',
                fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
                fontWeight: 600,
                color: 'var(--modus-wc-color-base-content, #171c1e)',
              }}
            >
              <ModusWcIcon
                name="file"
                size="xs"
                decorative
                style={{
                  color:
                    'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
                }}
              />
              Environmental_Mitigation_Policy.pdf
            </span>
          </div>
          <button
            type="button"
            aria-label="Close AI insight"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center transition-colors shrink-0"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color:
                'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            }}
          >
            <ModusWcIcon name="close" size="sm" decorative />
          </button>
        </div>
      </div>

      {/* Camera-controls hint — bottom-left, like Creative 6 */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 18,
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
          Drag — orbit &nbsp;·&nbsp; Right-drag — pan &nbsp;·&nbsp; Scroll —
          zoom
        </div>
      </div>
    </div>
  );
}
