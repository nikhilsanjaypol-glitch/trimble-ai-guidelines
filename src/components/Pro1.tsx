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

/* Build initial curb geometry by sampling along the carved road. */
function makeCurbLine(
  id: string,
  label: string,
  offset: number,
  sampleCount = 9,
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

const INITIAL_LINES: CurbLine[] = [
  makeCurbLine('outer', 'Outer', ROAD_HALF_WIDTH - 0.4),
  makeCurbLine('middle', 'Middle', ROAD_HALF_WIDTH - 1.1),
  makeCurbLine('inner', 'Inner', ROAD_HALF_WIDTH - 1.8),
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
    camera.position.set(8, 22, 34);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 0, 0);
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
  }, [lines, drag, hoverHandle]);

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

      {/* Live readout — top-right frosted chip */}
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

      {/* Drag tooltip — follows the active node in screen space */}
      {drag && tooltip && (
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

      {/* Reset affordance */}
      <button
        type="button"
        onClick={() => setLines(INITIAL_LINES)}
        className="absolute"
        style={{
          bottom: 20,
          right: 20,
          height: 32,
          padding: '0 14px',
          borderRadius: 8,
          backgroundColor: 'rgba(14,22,35,0.72)',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
          fontSize: 'var(--modus-wc-font-size-sm, 13px)',
          fontWeight: 600,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        Reset
      </button>

      {/* Help hint — bottom-left */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 20,
          left: 20,
          padding: '6px 12px',
          borderRadius: 8,
          backgroundColor: 'rgba(14,22,35,0.55)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.82)',
          fontSize: 'var(--modus-wc-font-size-xs, 12px)',
          fontWeight: 500,
          letterSpacing: '0.04em',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        Drag the blue handles to refine · drag the scene to orbit · scroll to zoom
      </div>
    </div>
  );
}
