import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* ─────────────────────────────────────────────────────────────────
 * Pro 1 — INTEGRATE WITH PROFESSIONAL TOOLS
 *
 * To allow professionals to work with AI as equals.
 *
 * Exemplar: the AI extracted three curb polylines from a 3D site
 * survey. The result is delivered into the user's professional 3D
 * scene as NATIVE, EDITABLE vector geometry — every vertex is a
 * grab-handle the user can drag. The handles stay glued to the
 * underlying terrain so the curb keeps making sense; lengths
 * update live; there is no form to fill in.
 * ───────────────────────────────────────────────────────────────── */

type Vertex = { x: number; z: number };

interface CurbLine {
  id: string;
  label: string;
  points: Vertex[];
}

/* ── Terrain (shared by the renderer and the React effects) ────── */

function noise(x: number, z: number): number {
  const a = Math.sin(x * 0.13) * Math.cos(z * 0.17) * 0.85;
  const b = Math.sin(x * 0.31 + 1.2) * Math.cos(z * 0.27 + 0.8) * 0.45;
  const c = Math.sin(x * 0.7 + 2.4) * Math.cos(z * 0.65) * 0.22;
  const d = Math.sin(x * 1.4 + 3.5) * 0.11;
  return a + b + c + d;
}

/* Road follows a gentle arc across the scene. */
function roadCenterZ(x: number): number {
  return 2.2 - 0.0085 * x * x;
}

const ROAD_HALF_WIDTH = 4.6;

function elevation(x: number, z: number): number {
  let h = noise(x, z);

  /* Big soil mound on the upper-left, like the dirt heap in the
   * photogrammetry reference. */
  const moundDX = x + 18;
  const moundDZ = (z + 4.5) * 1.3;
  const moundD = Math.sqrt(moundDX * moundDX + moundDZ * moundDZ);
  if (moundD < 8.5) {
    const t = 1 - moundD / 8.5;
    h += t * t * 3.7;
  }

  /* Smaller spoil pile bottom-right. */
  const pileD = Math.sqrt((x - 14) ** 2 + ((z - 4.5) * 1.3) ** 2);
  if (pileD < 4.5) {
    const t = 1 - pileD / 4.5;
    h += t * t * 1.6;
  }

  /* Carve a flatter, lower band along the road. */
  const distFromRoad = Math.abs(z - roadCenterZ(x));
  if (distFromRoad < ROAD_HALF_WIDTH) {
    const t = distFromRoad / ROAD_HALF_WIDTH;
    const eased = t * t * (3 - 2 * t);
    h = h * (0.22 + 0.5 * eased) - (1 - eased) * 0.55;
  }

  return h;
}

/* The curb sits a hair above the local terrain so the line is
 * visible from any angle. */
function lineY(x: number, z: number): number {
  return elevation(x, z) + 0.17;
}

/* Build initial curb geometry by sampling along the carved road.
 *
 * Curbs follow the near bank of the road (the side closer to the
 * camera) so they read as the "lip" of the channel from the opening
 * view, and we keep the sample count low so each line looks like a
 * single deliberate sweep rather than a many-jointed polyline. */
function makeCurbLine(
  id: string,
  label: string,
  offset: number,
  sampleCount = 6,
): CurbLine {
  const points: Vertex[] = [];
  const X_START = -22;
  const X_END = 22;
  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / (sampleCount - 1);
    const x = X_START + t * (X_END - X_START);
    const z = roadCenterZ(x) + offset;
    points.push({ x, z });
  }
  return { id, label, points };
}

/* Four curb lines, evenly spaced across the full carved channel.
 * Offsets step 2.8 m apart so each line clearly stakes out its own
 * lane and the outermost lines ride each bank of the road. */
const INITIAL_LINES: CurbLine[] = [
  makeCurbLine('outer', 'Outer', -4.2),
  makeCurbLine('mid_out', 'Mid out', -1.4),
  makeCurbLine('mid_in', 'Mid in', 1.4),
  makeCurbLine('inner', 'Inner', 4.2),
];

function totalLength(points: Vertex[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dz = points[i].z - points[i - 1].z;
    /* 3D length including terrain rise/fall. */
    const dy = lineY(points[i].x, points[i].z) - lineY(points[i - 1].x, points[i - 1].z);
    sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return sum;
}

/* Shared materials so geometry rebuilds during drag don't leak. */
const LINE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x2bdfd0 });
const HANDLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x2563eb });
const ACTIVE_HANDLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x60a5fa });

const TRIMBLE_RAINBOW =
  'linear-gradient(90deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)';

/* Mini Trimble AI logo — used inside the extract button. */
function TrimbleAiLogo({ size = 22 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 30.002 32.6797"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="pro1-ai-logo"
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
          fill="url(#pro1-ai-logo)"
        />
      </svg>
    </span>
  );
}

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  lineGroup: THREE.Group;
  handleGroup: THREE.Group;
  raycaster: THREE.Raycaster;
  dragPlane: THREE.Plane;
}

export default function Pro1() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<SceneRefs | null>(null);

  const [lines, setLines] = useState<CurbLine[]>(INITIAL_LINES);
  const [drag, setDrag] = useState<{ lineId: string; pointIdx: number } | null>(
    null,
  );
  const [hoverHandle, setHoverHandle] = useState<{
    lineId: string;
    pointIdx: number;
  } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const [extracted, setExtracted] = useState(false);
  const [extracting, setExtracting] = useState(false);

  function handleExtract() {
    if (extracting || extracted) return;
    setExtracting(true);
    window.setTimeout(() => {
      setExtracting(false);
      setExtracted(true);
    }, 900);
  }

  /* Refs mirror state so three.js event closures see current values. */
  const dragRef = useRef(drag);
  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  /* ── Scene initialization (runs once) ─────────────────────────── */
  useEffect(() => {
    if (!mountRef.current) return undefined;
    const mount: HTMLDivElement = mountRef.current;

    let W = mount.clientWidth;
    let H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#c9d5e2');
    scene.fog = new THREE.FogExp2(0xc9d5e2, 0.010);

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 500);
    /* Opening shot: low, along the carved road from the east end
     * looking back west toward the mound. */
    camera.position.set(50, 12, -8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(10, 0, -1);
    controls.minDistance = 10;
    controls.maxDistance = 95;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    scene.add(new THREE.HemisphereLight(0xcadbed, 0x4a3a2a, 0.5));
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.4);
    sun.position.set(22, 32, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 90;
    const sc = 32;
    sun.shadow.camera.left = -sc;
    sun.shadow.camera.right = sc;
    sun.shadow.camera.top = sc;
    sun.shadow.camera.bottom = -sc;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.04;
    scene.add(sun);

    const WORLD_X = 40;
    const WORLD_Z = 24;

    /* ── Solid 3D terrain mesh ──────────────────────────────────── */
    const TERRAIN_SEG_W = 320;
    const TERRAIN_SEG_D = 180;
    const terrainGeo = new THREE.PlaneGeometry(
      WORLD_X * 2,
      WORLD_Z * 2,
      TERRAIN_SEG_W,
      TERRAIN_SEG_D,
    );
    terrainGeo.rotateX(-Math.PI / 2);

    const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
    const tColorArr = new Float32Array(tPos.count * 3);

    const tmpColor = new THREE.Color();
    /* Light direction baked into per-vertex tint so the surface has
     * subtle directional shading on top of the real PBR pass. */
    const tintLight = new THREE.Vector3(0.45, 0.78, -0.45).normalize();
    const eps = 0.6;

    for (let i = 0; i < tPos.count; i += 1) {
      const x = tPos.getX(i);
      const z = tPos.getZ(i);
      const y = elevation(x, z);
      tPos.setY(i, y);

      const e0 = y;
      const dhdx = (elevation(x + eps, z) - e0) / eps;
      const dhdz = (elevation(x, z + eps) - e0) / eps;
      const nx = -dhdx;
      const nz = -dhdz;
      const nl = Math.sqrt(nx * nx + 1 + nz * nz);
      const lambert =
        ((nx * tintLight.x + 1 * tintLight.y + nz * tintLight.z) / nl) * 0.5 +
        0.5;
      const slope = Math.sqrt(dhdx * dhdx + dhdz * dhdz);

      const distFromRoad = Math.abs(z - roadCenterZ(x));
      const onRoad = distFromRoad < ROAD_HALF_WIDTH;

      /* Hue + saturation: warm earth, slightly cooler on the road. */
      const hue = onRoad ? 0.085 : 0.07;
      const sat = Math.max(0.04, (onRoad ? 0.06 : 0.16) - slope * 0.04);
      /* Lightness: higher on tops, lower in carved zones, with
       * subtle directional shading on top. */
      const baseL =
        (onRoad ? 0.38 : 0.5) +
        y * 0.018 -
        slope * 0.05;
      const shaded = baseL * (0.78 + 0.28 * lambert);
      const lightness = Math.max(0.08, Math.min(0.85, shaded));

      tmpColor.setHSL(hue, sat, lightness);
      tColorArr[i * 3] = tmpColor.r;
      tColorArr[i * 3 + 1] = tmpColor.g;
      tColorArr[i * 3 + 2] = tmpColor.b;
    }

    tPos.needsUpdate = true;
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(tColorArr, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.96,
      metalness: 0,
      flatShading: false,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    scene.add(terrain);

    /* ── Scattered rocks for character ──────────────────────────── */
    const rockMats: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({
        color: 0x6b5a48,
        roughness: 0.94,
        metalness: 0,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x564a3c,
        roughness: 0.92,
        metalness: 0,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x7a6a55,
        roughness: 0.96,
        metalness: 0,
        flatShading: true,
      }),
    ];
    const rocks: THREE.Mesh[] = [];
    /* Seeded-ish pseudo-random scatter — deterministic per render so
     * the scene doesn't twitch across HMRs. */
    const rng = (function () {
      let s = 12345;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
      };
    })();

    for (let i = 0; i < 38; i += 1) {
      const x = (rng() - 0.5) * (WORLD_X * 2 - 4);
      const z = (rng() - 0.5) * (WORLD_Z * 2 - 4);
      /* Skip the road surface so the curb path stays clean. */
      if (Math.abs(z - roadCenterZ(x)) < ROAD_HALF_WIDTH * 1.05) continue;
      const size = 0.28 + rng() * 0.7;
      const geo = new THREE.DodecahedronGeometry(size, 0);
      const mat = rockMats[Math.floor(rng() * rockMats.length)];
      const rock = new THREE.Mesh(geo, mat);
      const y = elevation(x, z);
      rock.position.set(x, y + size * 0.55, z);
      rock.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      rock.scale.set(
        1,
        0.55 + rng() * 0.4,
        0.85 + rng() * 0.3,
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      rocks.push(rock);
    }

    /* ── Containers for line tubes and vertex handles ────────────── */
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);
    const handleGroup = new THREE.Group();
    scene.add(handleGroup);

    const raycaster = new THREE.Raycaster();
    /* Plane Y is updated per-drag based on the picked handle. */
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    sceneRefs.current = {
      renderer,
      scene,
      camera,
      controls,
      lineGroup,
      handleGroup,
      raycaster,
      dragPlane,
    };

    /* ── Pointer interaction ─────────────────────────────────────── */
    function ndc(e: PointerEvent): THREE.Vector2 {
      const rect = renderer.domElement.getBoundingClientRect();
      return new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
    }

    function handleAtPointer(p: THREE.Vector2) {
      raycaster.setFromCamera(p, camera);
      const hits = raycaster.intersectObjects(handleGroup.children, false);
      if (hits.length === 0) return null;
      const mesh = hits[0].object as THREE.Mesh;
      return {
        lineId: mesh.userData.lineId as string,
        pointIdx: mesh.userData.pointIdx as number,
      };
    }

    function projectToScreen(world: THREE.Vector3) {
      const v = world.clone().project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: (v.x * 0.5 + 0.5) * rect.width,
        y: (-v.y * 0.5 + 0.5) * rect.height,
      };
    }

    function onPointerDown(e: PointerEvent) {
      const hit = handleAtPointer(ndc(e));
      if (!hit) return;
      e.preventDefault();

      /* Lock the drag plane to the picked handle's Y. */
      const line = linesRef.current.find((l) => l.id === hit.lineId);
      if (line) {
        const pt = line.points[hit.pointIdx];
        const y = lineY(pt.x, pt.z);
        dragPlane.set(new THREE.Vector3(0, 1, 0), -y);
      }

      renderer.domElement.setPointerCapture(e.pointerId);
      controls.enabled = false;
      setDrag(hit);
    }

    function onPointerMove(e: PointerEvent) {
      const p = ndc(e);

      if (dragRef.current) {
        e.preventDefault();
        raycaster.setFromCamera(p, camera);
        const intersection = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(dragPlane, intersection)) return;

        const { lineId, pointIdx } = dragRef.current;
        const x = Math.max(-WORLD_X + 1, Math.min(WORLD_X - 1, intersection.x));
        const z = Math.max(-WORLD_Z + 1, Math.min(WORLD_Z - 1, intersection.z));
        setLines((prev) =>
          prev.map((line) =>
            line.id !== lineId
              ? line
              : {
                  ...line,
                  points: line.points.map((pt, i) =>
                    i === pointIdx ? { x, z } : pt,
                  ),
                },
          ),
        );

        const screen = projectToScreen(
          new THREE.Vector3(x, lineY(x, z) + 0.5, z),
        );
        setTooltip({ x: screen.x, y: screen.y });
      } else {
        const hover = handleAtPointer(p);
        setHoverHandle(hover);
        renderer.domElement.style.cursor = hover ? 'grab' : 'default';
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (dragRef.current) {
        renderer.domElement.releasePointerCapture(e.pointerId);
        controls.enabled = true;
        setDrag(null);
        setTooltip(null);
      }
    }

    function onPointerLeave() {
      if (!dragRef.current) {
        setHoverHandle(null);
        renderer.domElement.style.cursor = 'default';
      }
    }

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('pointerleave', onPointerLeave);

    /* ── Render loop ─────────────────────────────────────────────── */
    let frame = 0;
    function animate() {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    /* ── Resize ──────────────────────────────────────────────────── */
    function onResize() {
      W = mount.clientWidth;
      H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener('resize', onResize);

    /* ── Cleanup ─────────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('pointerleave', onPointerLeave);
      controls.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      rocks.forEach((r) => r.geometry.dispose());
      rockMats.forEach((m) => m.dispose());
      handleGroup.children.forEach((c) => {
        (c as THREE.Mesh).geometry.dispose();
      });
      lineGroup.children.forEach((c) => {
        (c as THREE.Mesh).geometry.dispose();
      });
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
      sceneRefs.current = null;
    };
  }, []);

  /* ── Sync three.js geometry whenever React state changes ───────── */
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;

    refs.lineGroup.children.slice().forEach((child) => {
      refs.lineGroup.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    });
    refs.handleGroup.children.slice().forEach((child) => {
      refs.handleGroup.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    });

    /* Geometry is only created after the AI has "extracted" the
     * curb lines from the point cloud. */
    if (!extracted) return;

    lines.forEach((line) => {
      const path = line.points.map(
        (p) => new THREE.Vector3(p.x, lineY(p.x, p.z), p.z),
      );
      const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
      const tube = new THREE.TubeGeometry(curve, 128, 0.07, 12, false);
      const tubeMesh = new THREE.Mesh(tube, LINE_MATERIAL);
      refs.lineGroup.add(tubeMesh);

      line.points.forEach((p, idx) => {
        const isActive =
          (drag?.lineId === line.id && drag.pointIdx === idx) ||
          (hoverHandle?.lineId === line.id && hoverHandle.pointIdx === idx);
        const size = isActive ? 0.46 : 0.32;
        const geo = new THREE.BoxGeometry(size, size, size);
        const mesh = new THREE.Mesh(
          geo,
          isActive ? ACTIVE_HANDLE_MATERIAL : HANDLE_MATERIAL,
        );
        mesh.position.set(p.x, lineY(p.x, p.z) + size / 2, p.z);
        mesh.userData.lineId = line.id;
        mesh.userData.pointIdx = idx;
        refs.handleGroup.add(mesh);
      });
    });
  }, [lines, drag, hoverHandle, extracted]);

  /* ── Live values ──────────────────────────────────────────────── */
  const lengths = lines.map((line) => ({
    id: line.id,
    label: line.label,
    length: totalLength(line.points),
  }));

  const activeId = drag?.lineId ?? hoverHandle?.lineId ?? null;
  const activeLength = activeId
    ? lengths.find((l) => l.id === activeId)?.length ?? 0
    : 0;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#c9d5e2',
      }}
    >
      {/* WebGL canvas mount */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Keyframes for the AI extract button */}
      <style>
        {`@keyframes pro1-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pro1-fadein {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes pro1RainbowShimmer {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes pro1ConnectorShimmer {
            0%   { background-position: 50% 0%; }
            50%  { background-position: 50% 100%; }
            100% { background-position: 50% 0%; }
          }
          @keyframes pro1ConnectorFade {
            from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          @keyframes pro1DotPulse {
            0%, 100% {
              transform: translateX(-50%) scale(1);
              box-shadow:
                0 0 4px rgba(43, 223, 208, 0.9),
                0 0 10px rgba(43, 223, 208, 0.55),
                0 0 18px rgba(43, 223, 208, 0.25);
            }
            50% {
              transform: translateX(-50%) scale(1.45);
              box-shadow:
                0 0 8px rgba(43, 223, 208, 1),
                0 0 18px rgba(43, 223, 208, 0.85),
                0 0 30px rgba(43, 223, 208, 0.45);
            }
          }`}
      </style>

      {/* AI-powered extract button — only shown before extraction */}
      {!extracted && (
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'pro1-fadein 240ms ease-out',
          }}
        >
          <div
            style={{
              padding: '1.5px',
              borderRadius: 13,
              backgroundImage: TRIMBLE_RAINBOW,
              backgroundSize: '200% 100%',
              animation: 'pro1RainbowShimmer 3.6s ease-in-out infinite',
            }}
          >
            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting}
              style={{
                background: '#ffffff',
                border: 'none',
                borderRadius: 11,
                padding: '13px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: extracting ? 'progress' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {extracting ? (
                <span
                  style={{
                    width: 22,
                    height: 22,
                    display: 'inline-block',
                    borderRadius: '50%',
                    border: '2px solid rgba(74,0,255,0.18)',
                    borderTopColor: '#4A00FF',
                    animation: 'pro1-spin 0.9s linear infinite',
                  }}
                />
              ) : (
                <TrimbleAiLogo size={24} />
              )}
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--modus-wc-font-size-md, 16px)',
                  color: 'var(--modus-wc-color-base-content, #171c1e)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.005em',
                }}
              >
                {extracting
                  ? 'Extracting curb lines…'
                  : 'Extract curb lines from 3D point cloud'}
              </span>
            </button>
          </div>

          {/* AI scanner connector — a single thin rainbow line that
           * shares the card's border style, capped with a small dot
           * showing where on the 3D model it's pointing. */}
          <div
            aria-hidden
            className="pointer-events-none"
            style={{
              position: 'absolute',
              top: 'calc(100% + 2px)',
              left: '50%',
              width: 1.5,
              height: 110,
              borderRadius: 1,
              backgroundImage:
                'linear-gradient(180deg, #00D7C0 0%, #009AFE 33%, #4A00FF 55%, #FF2092 78%, #FF00D3 96%)',
              backgroundSize: '100% 200%',
              animation: extracting
                ? 'pro1ConnectorShimmer 0.9s ease-in-out infinite, pro1ConnectorFade 240ms ease-out both'
                : 'pro1ConnectorShimmer 3.6s ease-in-out infinite, pro1ConnectorFade 360ms ease-out 180ms both',
              transform: 'translateX(-50%)',
            }}
          />

          {/* Dot at the end of the connector line. */}
          <div
            aria-hidden
            className="pointer-events-none"
            style={{
              position: 'absolute',
              /* line is anchored at calc(100% + 2px) and is 110px tall;
               * subtract half the dot height to center the dot on the
               * line's terminus. */
              top: 'calc(100% + 2px + 110px - 4.5px)',
              left: '50%',
              width: 9,
              height: 9,
              borderRadius: '50%',
              backgroundImage: TRIMBLE_RAINBOW,
              backgroundSize: '200% 100%',
              animation: extracting
                ? 'pro1RainbowShimmer 0.9s ease-in-out infinite, pro1ConnectorFade 240ms ease-out both'
                : 'pro1RainbowShimmer 3.6s ease-in-out infinite, pro1ConnectorFade 360ms ease-out 220ms both',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 6px rgba(255, 0, 211, 0.5)',
            }}
          />
        </div>
      )}

      {/* Live readout — top-right frosted chip */}
      {extracted && (
      <div
        className="absolute flex flex-col gap-1.5 px-4 py-3 rounded-xl"
        style={{
          top: 20,
          right: 20,
          backgroundColor: 'rgba(14,22,35,0.72)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#ffffff',
          minWidth: 200,
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="font-semibold"
          style={{
            fontSize: 'var(--modus-wc-font-size-xxs, 10px)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            marginBottom: 2,
          }}
        >
          Curb lengths
        </div>
        {lengths.map(({ id, label, length }) => {
          const isActive = id === activeId;
          return (
            <div
              key={id}
              className="flex items-center gap-3"
              style={{
                fontSize: 'var(--modus-wc-font-size-sm, 13px)',
                opacity: isActive || !activeId ? 1 : 0.55,
                transition: 'opacity 120ms ease',
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="block rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: '#2bdfd0',
                    boxShadow: isActive ? '0 0 8px rgba(43,223,208,0.7)' : 'none',
                  }}
                />
                <span style={{ fontWeight: isActive ? 700 : 500 }}>
                  {label}
                </span>
              </span>
              <span
                className="ml-auto font-semibold"
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  color: isActive ? '#2bdfd0' : '#ffffff',
                }}
              >
                {length.toFixed(2)} m
              </span>
            </div>
          );
        })}
      </div>
      )}

      {/* Drag tooltip — follows the active node in screen space */}
      {extracted && drag && tooltip && (
        <div
          className="absolute pointer-events-none font-semibold"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 36,
            padding: '5px 10px',
            borderRadius: 8,
            backgroundColor: 'rgba(14,22,35,0.96)',
            border: '1px solid rgba(43,223,208,0.55)',
            color: '#ffffff',
            fontSize: 'var(--modus-wc-font-size-sm, 13px)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px -4px rgba(0,0,0,0.5)',
          }}
        >
          {activeLength.toFixed(2)} m
        </div>
      )}

    </div>
  );
}
