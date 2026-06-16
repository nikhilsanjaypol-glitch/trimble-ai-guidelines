import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 7 — DEFER TO THE PROFESSIONAL
 *
 * To verify high-impact sections.
 *
 * The AI proactively recommends swapping one high-impact detail —
 * the anchor under Column C-3 — from the current cast-in-place pad
 * to a helical pile. The card presents BOTH options visually and
 * defers the final call to the engineer. The 3D model swaps the
 * actual geometry the moment they confirm, so the recommendation
 * lands as a tangible change to the design.
 * ───────────────────────────────────────────────────────────────── */

const ANCHOR_POS = new THREE.Vector3(8, 0.3, 4);

/* ── Isometric SVG illustrations for the two anchor styles ─────── */
function CurrentAnchorSvg({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%">
      <defs>
        <linearGradient id="pro7-pad-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8ebef" />
          <stop offset="100%" stopColor="#c5c9d1" />
        </linearGradient>
        <linearGradient id="pro7-pad-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8bcc5" />
          <stop offset="100%" stopColor="#8b8f98" />
        </linearGradient>
      </defs>
      {/* Ground shadow */}
      <ellipse cx="48" cy="78" rx="36" ry="6" fill="#000" opacity="0.10" />
      {/* Right face */}
      <path
        d="M72 38 L84 32 L84 64 L72 70 Z"
        fill="url(#pro7-pad-side)"
        stroke={accent}
        strokeWidth="1.4"
        opacity="0.95"
      />
      {/* Front face */}
      <path
        d="M12 38 L72 38 L72 70 L12 70 Z"
        fill="url(#pro7-pad-side)"
        stroke={accent}
        strokeWidth="1.4"
      />
      {/* Top face */}
      <path
        d="M12 38 L24 32 L84 32 L72 38 Z"
        fill="url(#pro7-pad-top)"
        stroke={accent}
        strokeWidth="1.4"
      />
      {/* Anchor bolts sticking up from the pad */}
      {[
        [30, 33.5],
        [44, 32.5],
        [58, 31.5],
        [72, 30.5],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - 8}
            stroke="#3a3e44"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle
            cx={cx}
            cy={cy - 9}
            r="1.8"
            fill="#3a3e44"
          />
        </g>
      ))}
      {/* Depth dimension */}
      <line
        x1="6"
        y1="38"
        x2="6"
        y2="70"
        stroke={accent}
        strokeWidth="1"
        opacity="0.8"
      />
      <line
        x1="3"
        y1="38"
        x2="9"
        y2="38"
        stroke={accent}
        strokeWidth="1"
        opacity="0.8"
      />
      <line
        x1="3"
        y1="70"
        x2="9"
        y2="70"
        stroke={accent}
        strokeWidth="1"
        opacity="0.8"
      />
    </svg>
  );
}

function SuggestedAnchorSvg({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%">
      <defs>
        <linearGradient id="pro7-pile-shaft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b8bcc5" />
          <stop offset="50%" stopColor="#e8ebef" />
          <stop offset="100%" stopColor="#8b8f98" />
        </linearGradient>
        <linearGradient id="pro7-pile-cap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8ebef" />
          <stop offset="100%" stopColor="#c5c9d1" />
        </linearGradient>
      </defs>
      {/* Ground shadow */}
      <ellipse cx="48" cy="82" rx="22" ry="4" fill="#000" opacity="0.10" />
      {/* Shaft */}
      <rect
        x="40"
        y="22"
        width="16"
        height="58"
        fill="url(#pro7-pile-shaft)"
        stroke={accent}
        strokeWidth="1.4"
      />
      {/* Helical flanges (three discs) */}
      {[40, 56, 72].map((y, i) => (
        <g key={i}>
          <ellipse
            cx="48"
            cy={y}
            rx="14"
            ry="3.2"
            fill="url(#pro7-pile-cap)"
            stroke={accent}
            strokeWidth="1.2"
          />
        </g>
      ))}
      {/* Pile cap on top */}
      <ellipse
        cx="48"
        cy="22"
        rx="14"
        ry="4"
        fill="url(#pro7-pile-cap)"
        stroke={accent}
        strokeWidth="1.4"
      />
      {/* Bolt circle on top cap */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        const cx = 48 + Math.cos(a) * 9;
        const cy = 22 + Math.sin(a) * 2.4;
        return <circle key={i} cx={cx} cy={cy} r="1.2" fill="#3a3e44" />;
      })}
      {/* Depth dimension */}
      <line
        x1="22"
        y1="22"
        x2="22"
        y2="80"
        stroke={accent}
        strokeWidth="1"
        opacity="0.8"
      />
      <line x1="19" y1="22" x2="25" y2="22" stroke={accent} strokeWidth="1" />
      <line x1="19" y1="80" x2="25" y2="80" stroke={accent} strokeWidth="1" />
    </svg>
  );
}

/* ── Pro 7 — Defer to the Professional ─────────────────────────── */
export default function Pro7() {
  const mountRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLButtonElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const padRef = useRef<{
    mesh: THREE.Mesh;
    edges: THREE.LineSegments;
    material: THREE.MeshStandardMaterial;
    pulse: THREE.Mesh;
    pulseMaterial: THREE.MeshBasicMaterial;
  } | null>(null);
  const pileRef = useRef<{
    group: THREE.Group;
    material: THREE.MeshStandardMaterial;
  } | null>(null);

  const confirmedRef = useRef(false);

  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const confirmed = Boolean(confirmedAt);

  /* Sync confirmed state with the 3D scene */
  useEffect(() => {
    confirmedRef.current = confirmed;
    if (padRef.current) {
      padRef.current.mesh.visible = !confirmed;
      padRef.current.edges.visible = !confirmed;
      padRef.current.pulse.visible = !confirmed;
    }
    if (pileRef.current) {
      pileRef.current.group.visible = confirmed;
      pileRef.current.material.color.setHex(confirmed ? 0x2bbf6a : 0x9aa0aa);
      pileRef.current.material.emissive.setHex(confirmed ? 0x2bbf6a : 0x000000);
      pileRef.current.material.emissiveIntensity = confirmed ? 0.25 : 0;
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

    /* Raycaster — click the anchor in 3D to open the card */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let pointerDownAt = { x: 0, y: 0 };

    function onPointerDown(e: PointerEvent) {
      pointerDownAt = { x: e.clientX, y: e.clientY };
    }
    function onPointerUp(e: PointerEvent) {
      const dx = e.clientX - pointerDownAt.x;
      const dy = e.clientY - pointerDownAt.y;
      /* Treat as a click only if pointer barely moved (so orbit drags don't trigger) */
      if (dx * dx + dy * dy > 16) return;

      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);

      const targets: THREE.Object3D[] = [];
      if (padRef.current && padRef.current.mesh.visible) {
        targets.push(padRef.current.mesh);
      }
      if (pileRef.current && pileRef.current.group.visible) {
        targets.push(pileRef.current.group);
      }
      if (targets.length === 0) return;

      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length > 0) setCardOpen(true);
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

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

    /* Steel materials */
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

    /* Plain foundation pad (non-highlighted columns) */
    function basicPad(x: number, z: number) {
      const w = 1.6;
      const h = 0.6;
      const geo = new THREE.BoxGeometry(w, h, w);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x9aa0aa,
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
    }

    /* The "current" highlighted anchor — a red cast-in-place pad */
    function buildCurrentAnchor(x: number, z: number) {
      const w = 1.6;
      const h = 0.6;
      const geo = new THREE.BoxGeometry(w, h, w);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xff3b58,
        emissive: 0xff3b58,
        emissiveIntensity: 0.25,
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

      /* Ground pulse */
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

      padRef.current = {
        mesh,
        edges: lines,
        material: mat,
        pulse,
        pulseMaterial: pulseMat,
      };
    }

    /* The "suggested" helical pile — hidden until confirmed */
    function buildSuggestedAnchor(x: number, z: number) {
      const group = new THREE.Group();
      group.visible = false;
      const mat = new THREE.MeshStandardMaterial({
        color: 0x2bbf6a,
        emissive: 0x2bbf6a,
        emissiveIntensity: 0.25,
        roughness: 0.55,
        metalness: 0.35,
      });

      /* Pile cap (short cylinder at grade) */
      const capGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.45, 32);
      const cap = new THREE.Mesh(capGeo, mat);
      cap.position.set(0, 0.225, 0);
      cap.castShadow = true;
      cap.receiveShadow = true;
      group.add(cap);

      /* Shaft going underground (peeks above ground a bit) */
      const shaftGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.9, 16);
      const shaft = new THREE.Mesh(shaftGeo, mat);
      shaft.position.set(0, 0.7, 0);
      group.add(shaft);

      /* Bolt ring on top of the cap */
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8);
        const bolt = new THREE.Mesh(
          boltGeo,
          new THREE.MeshStandardMaterial({
            color: 0x3a3e44,
            roughness: 0.5,
            metalness: 0.6,
          }),
        );
        bolt.position.set(Math.cos(ang) * 0.72, 0.54, Math.sin(ang) * 0.72);
        group.add(bolt);
      }

      /* Outline ring on the cap for crispness */
      const ringGeo = new THREE.TorusGeometry(0.95, 0.02, 8, 64);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: 0x1c7c4a }),
      );
      ring.position.set(0, 0.45, 0);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      group.position.set(x, 0, z);
      scene.add(group);

      pileRef.current = { group, material: mat };
    }

    /* ── Steel frame: 3-bay × 2-deep × 3-storey ─────────────────── */
    const bay = 6;
    const depth = 5;
    const storey = 3.8;
    const colW = 0.35;
    const beamW = 0.35;
    const beamH = 0.5;

    const colsX = [-bay, 0, bay];
    const colsZ = [-depth / 2, depth / 2];
    const heights = [0, storey, storey * 2, storey * 3];

    /* Foundations */
    for (const cx of colsX) {
      for (const cz of colsZ) {
        const isAnchor =
          Math.abs(cx - bay) < 0.01 && Math.abs(cz - depth / 2) < 0.01;
        if (isAnchor) {
          buildCurrentAnchor(cx, cz);
          buildSuggestedAnchor(cx, cz);
        } else {
          basicPad(cx, cz);
        }
      }
    }

    /* Columns */
    for (const cx of colsX) {
      for (const cz of colsZ) {
        steelMember(cx, 0.6, cz, colW, storey * 3, colW);
      }
    }

    /* Beams along X */
    for (let lvl = 1; lvl < heights.length; lvl++) {
      const y = 0.6 + heights[lvl] - beamH;
      for (let i = 0; i < colsX.length - 1; i++) {
        const x = (colsX[i] + colsX[i + 1]) / 2;
        for (const cz of colsZ) {
          steelMember(x, y, cz, bay - colW, beamH, beamW);
        }
      }
    }

    /* Beams along Z */
    for (let lvl = 1; lvl < heights.length; lvl++) {
      const y = 0.6 + heights[lvl] - beamH;
      for (const cx of colsX) {
        steelMember(cx, y, 0, beamW, beamH, depth - colW);
      }
    }

    /* Translucent slabs */
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

    /* X-bracing on back bay */
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

    /* ── Overlay projection ─────────────────────────────────────── */
    const tmp = new THREE.Vector3();
    function updateOverlay() {
      const marker = markerRef.current;
      if (!marker) return;
      tmp.copy(ANCHOR_POS).project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * W;
      const sy = (-tmp.y * 0.5 + 0.5) * H;
      const onScreen =
        tmp.z < 1 && tmp.x > -1 && tmp.x < 1 && tmp.y > -1 && tmp.y < 1;
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

      /* Pulse on the highlighted anchor (only while pending) */
      if (padRef.current && !confirmedRef.current) {
        const breathe = 0.5 + 0.5 * Math.sin(t * 3);
        padRef.current.material.emissiveIntensity = 0.45 + breathe * 0.35;
        const ringScale = 1 + ((t * 0.8) % 1) * 1.4;
        padRef.current.pulse.scale.setScalar(ringScale);
        padRef.current.pulseMaterial.opacity = 0.7 * (1 - ((t * 0.8) % 1));
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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
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
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Card → anchor dashed connector (only when card is open) */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
          opacity: cardOpen ? 1 : 0,
          transition: 'opacity 200ms ease',
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

      {/* Floating world-anchored tag — click to open the card */}
      <button
        ref={markerRef}
        type="button"
        onClick={() => setCardOpen((o) => !o)}
        aria-label={cardOpen ? 'Close recommendation' : 'Open AI recommendation'}
        aria-pressed={cardOpen}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 5,
          padding: '5px 10px 5px 8px',
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
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'transform 160ms ease, box-shadow 160ms ease',
        }}
        onMouseEnter={(e) => {
          if (cardOpen) return;
          e.currentTarget.style.boxShadow = '0px 3px 12px rgba(0,0,0,0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0px 2px 6px rgba(0,0,0,0.25)';
        }}
      >
        <span
          aria-hidden
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '1000px',
            backgroundColor: '#ffffff',
            display: 'inline-block',
            boxShadow: confirmed
              ? '0 0 0 2px rgba(43,191,106,0.45)'
              : '0 0 0 2px rgba(255,59,88,0.45)',
          }}
        />
        Column C-3 · {confirmed ? 'helical pile' : 'review'}
      </button>

      {/* Verification card */}
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: 56,
          transform: cardOpen
            ? 'translateY(-50%) translateX(0)'
            : 'translateY(-50%) translateX(-32px)',
          opacity: cardOpen ? 1 : 0,
          pointerEvents: cardOpen ? 'auto' : 'none',
          zIndex: 10,
          transition:
            'opacity 220ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <RecommendationCard
          confirmedAt={confirmedAt}
          onConfirm={() => setConfirmedAt(stamp())}
          onUndo={() => setConfirmedAt(null)}
          onClose={() => setCardOpen(false)}
        />
      </div>
    </div>
  );
}

/* ── Recommendation card (current → suggested anchor swap) ─────── */
function RecommendationCard({
  confirmedAt,
  onConfirm,
  onUndo,
  onClose,
}: {
  confirmedAt: string | null;
  onConfirm: () => void;
  onUndo: () => void;
  onClose: () => void;
}) {
  const confirmed = Boolean(confirmedAt);

  return (
    <div
      className="bg-white flex flex-col overflow-hidden"
      style={{
        width: '400px',
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
          className="font-semibold flex-1"
          style={{
            fontSize: 'var(--modus-wc-font-size-base, 16px)',
            lineHeight: '20px',
            letterSpacing: '-0.005em',
            color: confirmed ? '#1d8b4d' : '#b3243a',
          }}
        >
          {confirmed ? 'Replacement applied' : 'Design Review'}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex items-center justify-center transition-colors"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              'rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ModusWcIcon name="close" size="sm" decorative />
        </button>
      </div>

      {/* Context */}
      <div className="px-5 pt-4 pb-2">
        <span
          className="uppercase"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
          }}
        >
          Column C-3 · Foundation anchor
        </span>
      </div>

      {/* Current → Suggested comparison */}
      <div
        className="flex items-stretch gap-2 px-4 pb-4"
        style={{ minHeight: '160px' }}
      >
        <AnchorOption
          tone="current"
          dim={confirmed}
          tag="Current"
          title="Cast-in-place pad"
          stats={[
            { label: 'Depth', value: '350 mm' },
            { label: 'Uplift', value: '220 kN' },
          ]}
          svg={<CurrentAnchorSvg accent="#b3243a" />}
        />

        <div className="flex flex-col items-center justify-center px-1">
          <span
            className="flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '1000px',
              backgroundColor: confirmed ? '#2bbf6a' : '#ff3b58',
              color: '#ffffff',
            }}
          >
            <ModusWcIcon
              name={confirmed ? 'check' : 'arrow_right_bold'}
              size="xs"
              decorative
            />
          </span>
        </div>

        <AnchorOption
          tone="suggested"
          highlight
          tag={confirmed ? 'Applied' : 'AI suggests'}
          title="Helical pile"
          stats={[
            { label: 'Depth', value: '1.2 m' },
            { label: 'Uplift', value: '1100 kN' },
          ]}
          svg={
            <SuggestedAnchorSvg accent={confirmed ? '#1d8b4d' : '#0063a3'} />
          }
        />
      </div>

      {/* Rationale or confirmation stamp */}
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
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content, #171c1e)',
            }}
          >
            Why I&apos;m asking
          </span>
          <ul
            className="flex flex-col gap-1.5"
            style={{
              fontSize: 'var(--modus-wc-font-size-sm, 14px)',
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '20px',
              margin: 0,
              padding: 0,
              listStyle: 'none',
            }}
          >
            <Bullet>
              Current pad is at its{' '}
              <strong style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}>
                220 kN uplift limit
              </strong>{' '}
              — no margin.
            </Bullet>
            <Bullet>
              Helical pile adds{' '}
              <strong style={{ color: 'var(--modus-wc-color-base-content, #171c1e)' }}>
                ~5× safety
              </strong>
              , no redraws.
            </Bullet>
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
            Revert to original anchor
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
              Keep current
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
              Apply suggestion
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Bullet ────────────────────────────────────────────────────── */
function Bullet({ children }: { children: React.ReactNode }) {
  return (
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
      <span>{children}</span>
    </li>
  );
}

/* ── Anchor option block (one of the two side-by-side cards) ───── */
function AnchorOption({
  tone,
  tag,
  title,
  stats,
  svg,
  highlight = false,
  dim = false,
}: {
  tone: 'current' | 'suggested';
  tag: string;
  title: string;
  stats: { label: string; value: string }[];
  svg: React.ReactNode;
  highlight?: boolean;
  dim?: boolean;
}) {
  const isCurrent = tone === 'current';
  return (
    <div
      className="flex flex-col items-center text-center flex-1 transition-opacity"
      style={{
        padding: '10px 8px 12px 8px',
        borderRadius: 'var(--modus-wc-border-radius-md, 12px)',
        border: highlight
          ? '1.5px solid var(--modus-wc-color-primary, #0063a3)'
          : '1px solid var(--modus-wc-color-base-200, #e0e1e9)',
        backgroundColor: highlight
          ? 'rgba(0,99,163,0.05)'
          : 'var(--modus-wc-color-base-100, #f8f9fa)',
        opacity: dim ? 0.55 : 1,
        position: 'relative',
      }}
    >
      <span
        className="uppercase mb-1"
        style={{
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.10em',
          color: isCurrent
            ? '#b3243a'
            : 'var(--modus-wc-color-primary, #0063a3)',
        }}
      >
        {tag}
      </span>
      <div
        className="mb-1.5"
        style={{
          width: '78px',
          height: '78px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {svg}
      </div>
      <span
        className="font-semibold"
        style={{
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          color: 'var(--modus-wc-color-base-content, #171c1e)',
          lineHeight: '16px',
        }}
      >
        {title}
      </span>
      <div
        className="mt-1.5 flex flex-col gap-0.5 items-center"
        style={{ fontSize: '10px' }}
      >
        {stats.map((s) => (
          <span
            key={s.label}
            style={{
              color: 'var(--modus-wc-color-base-content-low-contrast, #6a6e79)',
              lineHeight: '14px',
            }}
          >
            {s.label}:{' '}
            <strong
              style={{
                color: 'var(--modus-wc-color-base-content, #171c1e)',
                fontWeight: 600,
              }}
            >
              {s.value}
            </strong>
          </span>
        ))}
      </div>
    </div>
  );
}
