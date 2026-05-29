import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Creative6 from './Creative6';

const CARD_RIGHT = 56;
const CARD_TOP = 72;
const CARD_WIDTH = 300;

const ANCHOR = new THREE.Vector3(-4, 15.5, -4);

export default function SiteScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLButtonElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

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
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e6e9ee');
    scene.fog = new THREE.FogExp2(0xe6e9ee, 0.012);

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 500);
    camera.position.set(58, 42, 58);

    /* OrbitControls */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 4, 0);
    controls.minDistance = 25;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.screenSpacePanning = true;
    controls.update();

    /* Lighting */
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    scene.add(new THREE.HemisphereLight(0xddeeff, 0x8899aa, 0.45));

    const sun = new THREE.DirectionalLight(0xfff4e0, 1.45);
    sun.position.set(32, 52, 28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 160;
    const sc = 45;
    sun.shadow.camera.left = -sc;
    sun.shadow.camera.right = sc;
    sun.shadow.camera.top = sc;
    sun.shadow.camera.bottom = -sc;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    /* Helpers */
    function box(
      x: number, y: number, z: number,
      w: number, h: number, d: number,
      color: number,
      roofColor?: number,
    ) {
      const mats = [
        new THREE.MeshLambertMaterial({ color }),
        new THREE.MeshLambertMaterial({ color }),
        new THREE.MeshLambertMaterial({ color: roofColor ?? color }),
        new THREE.MeshLambertMaterial({ color }),
        new THREE.MeshLambertMaterial({ color }),
        new THREE.MeshLambertMaterial({ color }),
      ];
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mats);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const lines = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x3a3e44, transparent: true, opacity: 0.32 }),
      );
      lines.position.copy(mesh.position);
      scene.add(lines);
      return mesh;
    }

    function slab(x: number, z: number, w: number, d: number, color: number, thickness = 0.25) {
      return box(x, 0, z, w, thickness, d, color);
    }

    /* Ground */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshLambertMaterial({ color: 0x7c8088 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(160, 80, 0x000000, 0x000000);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.06;
    grid.position.y = 0.02;
    scene.add(grid);

    /* Site slab */
    slab(0, 0, 48, 38, 0x9096a0);

    /* Roads */
    slab(0, 24, 80, 5, 0x525659, 0.15);
    slab(-30, 0, 5, 60, 0x525659, 0.15);
    slab(12, 12, 16, 3, 0x5c6065, 0.12);

    for (let i = -5; i <= 5; i++) {
      const mark = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 1.6),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }),
      );
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(i * 6, 0.16, 24);
      scene.add(mark);
    }

    /* Main tower */
    box(-4, 0, -4, 10, 14, 10, 0xcdd1da, 0xb8bcc6);
    for (let f = 1; f <= 4; f++) {
      box(-4, f * 2.8 - 0.25, -4, 10.05, 0.6, 10.05, 0x5a7ea0);
    }

    /* North wing */
    box(-4, 0, 9, 14, 5, 7, 0xbdc2cb, 0xa8adb8);
    box(-4, 1.6, 9, 14.05, 0.5, 7.05, 0x607d96);
    box(-4, 3.2, 9, 14.05, 0.5, 7.05, 0x607d96);

    /* Connector bridge */
    box(-4, 4, 3, 6, 1.5, 5, 0xc5c9d2, 0xb0b4be);

    /* East annex */
    box(11, 0, -2, 7, 8, 9, 0xc0c4cc, 0xacb0ba);
    box(11, 2.2, -2, 7.05, 0.5, 9.05, 0x5a7ea0);
    box(11, 5.0, -2, 7.05, 0.5, 9.05, 0x5a7ea0);

    /* Parking */
    box(4, 0, -15, 18, 3.5, 10, 0xb0b5be, 0xa0a5ae);
    for (let i = -2; i <= 2; i++) {
      box(i * 3.8 + 4, 3.5, -15, 0.2, 1.1, 10, 0x90959e);
    }

    /* Excavation pit */
    const pit = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 8),
      new THREE.MeshLambertMaterial({ color: 0x6a5d50 }),
    );
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(-17, 0.03, -4);
    pit.receiveShadow = true;
    scene.add(pit);
    box(-17, -0.5, -4, 10, 1, 8, 0x7a6e60);

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        box(-20 + i * 2.5, 0, -6 + j * 2.5, 0.1, 2.2, 0.1, 0x8a7060);
      }
    }

    /* Crane */
    box(-17, 0, 4, 0.5, 22, 0.5, 0xe8c840);
    box(-11, 22, 4, 12, 0.4, 0.4, 0xe8c840);
    box(-21, 22, 4, 6, 0.4, 0.4, 0xe8c840);
    box(-13, 21.2, 4, 0.6, 0.6, 0.6, 0xcc3333);
    box(-13, 18.5, 4, 0.08, 5.5, 0.08, 0x555555);
    box(-17, 18, 4, 1.2, 1.2, 1.2, 0xe0b820);

    /* Material staging */
    box(19, 0, -4, 2, 0.8, 6, 0x8090a0);
    box(19, 0.8, -4, 2, 0.6, 5.5, 0x7080a0);

    const mound = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 1.8, 6),
      new THREE.MeshLambertMaterial({ color: 0x9a8a70 }),
    );
    mound.position.set(21, 0.9, 7);
    mound.rotation.y = Math.PI / 6;
    mound.castShadow = true;
    scene.add(mound);
    const mound2 = mound.clone();
    mound2.scale.set(0.6, 0.6, 0.6);
    mound2.position.set(23, 0.55, 9);
    scene.add(mound2);

    /* Trees */
    function tree(x: number, z: number, h = 4) {
      box(x, 0, z, 0.3, h * 0.35, 0.3, 0x6a5a40);
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(1.4, h * 0.7, 7),
        new THREE.MeshLambertMaterial({ color: 0x4a7a4a }),
      );
      foliage.position.set(x, h * 0.35 + (h * 0.7) / 2, z);
      foliage.castShadow = true;
      scene.add(foliage);
    }
    tree(-24, 14, 5);
    tree(-22, 18, 4);
    tree(-26, 10, 6);
    tree(23, -15, 4.5);
    tree(25, -11, 3.5);
    tree(-8, 18, 4);
    tree(2, 18, 5);

    /* ── Project anchor → screen, update marker + line ─────────── */
    const tmp = new THREE.Vector3();

    function updateOverlay() {
      const marker = markerRef.current;
      const line = lineRef.current;
      const card = cardWrapRef.current;
      const pill = previewRef.current;
      if (!marker) return;

      tmp.copy(ANCHOR).project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * W;
      const sy = (-tmp.y * 0.5 + 0.5) * H;
      const onScreen = tmp.z < 1 && tmp.x > -1 && tmp.x < 1 && tmp.y > -1 && tmp.y < 1;

      marker.style.transform = `translate(-50%, -50%) translate3d(${sx}px, ${sy}px, 0)`;
      marker.style.opacity = onScreen ? '1' : '0';
      marker.style.pointerEvents = onScreen ? 'auto' : 'none';

      if (pill) {
        pill.style.transform = `translate(-50%, -100%) translate3d(${sx}px, ${sy - 28}px, 0)`;
        if (!onScreen || openRef.current) pill.classList.remove('visible');
      }

      if (line && card && openRef.current) {
        const cr = card.getBoundingClientRect();
        const mountRect = mount.getBoundingClientRect();
        const cx = cr.left + cr.width / 2 - mountRect.left;
        const cy = cr.top + cr.height / 2 - mountRect.top;
        line.setAttribute('x1', String(sx));
        line.setAttribute('y1', String(sy));
        line.setAttribute('x2', String(cx));
        line.setAttribute('y2', String(cy));
      }
    }

    /* Animation loop */
    let frameId = 0;
    function animate() {
      frameId = requestAnimationFrame(animate);
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
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
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
        backgroundColor: '#e6e9ee',
      }}
    >
      {/* Three.js canvas */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Connector line (visible only when card is open) */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
          opacity: open ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        <defs>
          <linearGradient id="rainbowLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D7C0" />
            <stop offset="33%" stopColor="#009AFE" />
            <stop offset="55%" stopColor="#4A00FF" />
            <stop offset="78%" stopColor="#FF2092" />
            <stop offset="100%" stopColor="#FF00D3" />
          </linearGradient>
        </defs>
        <line
          ref={lineRef}
          stroke="url(#rainbowLine)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>

      {/* Pulsing rainbow AI marker (stays visible after click; toggles the card) */}
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

      {/* Hover preview pill */}
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
          <div className="pill-title">Extreme Grade Opportunity</div>
          <div className="pill-hint">Click to explore</div>
        </div>
      </div>

      {/* Creative6 anchored card */}
      <div
        ref={cardWrapRef}
        style={{
          position: 'absolute',
          top: CARD_TOP,
          right: CARD_RIGHT,
          width: CARD_WIDTH,
          zIndex: 10,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <Creative6 open={open} onClose={() => setOpen(false)} />
      </div>

      {/* Controls hint */}
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
          Drag — orbit &nbsp;·&nbsp; Right-drag — pan &nbsp;·&nbsp; Scroll — zoom
        </div>
      </div>
    </div>
  );
}
