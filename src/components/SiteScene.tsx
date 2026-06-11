import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Creative6 from './Creative6';

const CARD_WIDTH = 300;
const CARD_MARGIN = 16;
const CARD_GAP = 96;

// Anchor sits just above the top of the retaining wall on the north edge of
// the central dig — that's the slope the Creative 6 strategies are about.
const ANCHOR = new THREE.Vector3(0, 4.5, -12.4);

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

    /* Ground — earth tone */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshLambertMaterial({ color: 0x8a7560 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(160, 80, 0x000000, 0x000000);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.06;
    grid.position.y = 0.02;
    scene.add(grid);

    /* Disturbed earth pad — site working area surrounding the central dig */
    slab(0, 0, 64, 48, 0x9a8268);

    /* Compacted haul roads (dirt/gravel) */
    slab(0, 26, 80, 6, 0x5e5448, 0.12);
    slab(-32, 0, 6, 64, 0x5e5448, 0.12);

    /* Tire tracks down the south haul road */
    for (let i = -5; i <= 5; i++) {
      const mark = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 1.5),
        new THREE.MeshBasicMaterial({ color: 0x3a3024, transparent: true, opacity: 0.45 }),
      );
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(i * 5.5, 0.16, 26);
      scene.add(mark);
    }

    /* ── Pit helpers ─────────────────────────────────────────── */
    function pitFloor(cx: number, y: number, cz: number, w: number, d: number, color: number) {
      const geo = new THREE.BoxGeometry(w, 0.3, d);
      const mat = new THREE.MeshLambertMaterial({ color });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(cx, y - 0.15, cz);
      m.receiveShadow = true;
      m.castShadow = true;
      scene.add(m);
      const edges = new THREE.EdgesGeometry(geo);
      const lines = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x3a2a1a, transparent: true, opacity: 0.35 }),
      );
      lines.position.copy(m.position);
      scene.add(lines);
    }

    function pitWalls(
      cx: number, cz: number, w: number, d: number,
      bottomY: number, h: number, thick: number, color: number,
    ) {
      box(cx, bottomY, cz - d / 2 - thick / 2, w + thick * 2, h, thick, color);
      box(cx, bottomY, cz + d / 2 + thick / 2, w + thick * 2, h, thick, color);
      box(cx - w / 2 - thick / 2, bottomY, cz, thick, h, d, color);
      box(cx + w / 2 + thick / 2, bottomY, cz, thick, h, d, color);
    }

    /* ──★ THE DIG — single big terraced excavation centred under the camera
       target so it reads as the unmistakable focal point of the scene.
       Three terraces step down to the lowest excavated floor: -2, -5, -9. */
    pitFloor(0, -2, 0, 32, 22, 0x8b7050);
    pitFloor(0, -5, 0, 22, 13, 0x7a604a);
    pitFloor(0, -9, 0, 12, 6, 0x5e4530);

    pitWalls(0, 0, 32, 22, -2, 2, 0.3, 0x7d6347); // ground → L1
    pitWalls(0, 0, 22, 13, -5, 3, 0.3, 0x6e5340); // L1 → L2
    pitWalls(0, 0, 12, 6, -9, 4, 0.3, 0x5e4530);  // L2 → L3

    /* Earth ramp on the east side so trucks can drive down into the dig */
    const ramp = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.4, 4),
      new THREE.MeshLambertMaterial({ color: 0x6a5040 }),
    );
    ramp.position.set(15, -1, 0);
    ramp.rotation.z = Math.PI * 0.07;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    scene.add(ramp);

    /* ──★ Concrete foundation for the big building going up in the dig ──
       Three layers of structure, all clearly visible from the default
       camera angle:
         1. Mat / raft slab on the bottom of the deep pit
         2. Basement floor slab on the middle terrace
         3. Tall concrete columns rising from the mat all the way up to
            ~3 m ABOVE ground level, so they read as a building skeleton
            instead of being lost down inside the pit
       Column lines are at x = ±4 (NOT x = 0) so the line of sight from
       the camera to the AI pulse on the wall behind stays clear. */
    const concreteMat = new THREE.MeshLambertMaterial({ color: 0xd6d0c4 });
    const concreteAccent = new THREE.MeshLambertMaterial({ color: 0xc0bab0 });
    const rebarMat = new THREE.MeshLambertMaterial({ color: 0x8a5a3a });

    // Mat / raft foundation slab — covers the entire bottom-terrace floor
    const matSlabH = 0.6;
    const matSlabTopY = -9 + matSlabH; // mat top ≈ y = -8.4
    const matSlab = new THREE.Mesh(
      new THREE.BoxGeometry(11.6, matSlabH, 5.6),
      concreteMat,
    );
    matSlab.position.set(0, -9 + matSlabH / 2, 0);
    matSlab.castShadow = true;
    matSlab.receiveShadow = true;
    scene.add(matSlab);

    // Lighter top finish on the mat
    const matSlabTop = new THREE.Mesh(
      new THREE.PlaneGeometry(11.6, 5.6),
      concreteAccent,
    );
    matSlabTop.rotation.x = -Math.PI / 2;
    matSlabTop.position.set(0, matSlabTopY + 0.01, 0);
    matSlabTop.receiveShadow = true;
    scene.add(matSlabTop);

    // Basement floor slab — covers most of the middle-terrace floor,
    // with the bottom-pit hole left open through it. Built as 4 strips
    // surrounding the bottom-pit footprint so the deep pit stays open.
    function basementStrip(cx: number, cz: number, w: number, d: number) {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.35, d),
        concreteMat,
      );
      slab.position.set(cx, -5 + 0.175, cz);
      slab.castShadow = true;
      slab.receiveShadow = true;
      scene.add(slab);

      const top = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        concreteAccent,
      );
      top.rotation.x = -Math.PI / 2;
      top.position.set(cx, -5 + 0.36, cz);
      top.receiveShadow = true;
      scene.add(top);
    }
    // West / east strips run the full middle-pit depth
    basementStrip(-8.5, 0, 5, 12.6);
    basementStrip( 8.5, 0, 5, 12.6);
    // North / south strips fill the strip between bottom-pit and middle-pit edges
    basementStrip(0, -4.75, 12, 3.1);
    basementStrip(0,  4.75, 12, 3.1);

    // Footing pads + columns + rebar dowels at each grid location.
    // Columns rise from the mat all the way past ground level so they
    // stick up clearly above the top pit and read as a building skeleton.
    const columnTopY = 3.0; // 3 m above ground level
    const columnPositions: [number, number][] = [
      [-4, -2], [-4, 0], [-4, 2],
      [ 4, -2], [ 4, 0], [ 4, 2],
    ];

    for (const [cx, cz] of columnPositions) {
      // Wide footing pad on top of the mat
      const footingH = 0.6;
      const footingY = matSlabTopY + footingH / 2;
      const footing = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, footingH, 1.6),
        concreteAccent,
      );
      footing.position.set(cx, footingY, cz);
      footing.castShadow = true;
      footing.receiveShadow = true;
      scene.add(footing);

      // Column — thick, rises from footing top to columnTopY (~3 m above ground)
      const columnBaseY = matSlabTopY + footingH;
      const columnH = columnTopY - columnBaseY;
      const column = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, columnH, 1.0),
        concreteMat,
      );
      column.position.set(cx, columnBaseY + columnH / 2, cz);
      column.castShadow = true;
      column.receiveShadow = true;
      scene.add(column);

      // Cap on each column to suggest a fresh top-of-pour finish
      const colCap = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.1, 1.1),
        concreteAccent,
      );
      colCap.position.set(cx, columnTopY + 0.05, cz);
      colCap.castShadow = true;
      scene.add(colCap);

      // Vertical rebar protruding from column top — 6 dowels, 1.5 m
      const rebarOffsets: [number, number][] = [
        [-0.32, -0.32], [0, -0.32], [0.32, -0.32],
        [-0.32,  0.32], [0,  0.32], [0.32,  0.32],
      ];
      for (const [rx, rz] of rebarOffsets) {
        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8),
          rebarMat,
        );
        rod.position.set(cx + rx, columnTopY + 0.75, cz + rz);
        rod.castShadow = true;
        scene.add(rod);
      }
    }

    // Perimeter grade beams between column tops on each row — spans
    // from column to column at column-top level so the structure reads
    // as a connected frame, not just isolated posts.
    function gradeBeam(cx: number, cz: number, w: number, d: number) {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.5, d),
        concreteMat,
      );
      b.position.set(cx, columnTopY - 0.25, cz);
      b.castShadow = true;
      b.receiveShadow = true;
      scene.add(b);
    }
    // West column row beams (x = -4)
    gradeBeam(-4, -1, 0.6, 2);
    gradeBeam(-4,  1, 0.6, 2);
    // East column row beams (x = 4)
    gradeBeam( 4, -1, 0.6, 2);
    gradeBeam( 4,  1, 0.6, 2);
    // Cross beams at z = 0 between west and east rows
    gradeBeam(-2, -2, 4, 0.6);
    gradeBeam( 2, -2, 4, 0.6);
    gradeBeam(-2,  2, 4, 0.6);
    gradeBeam( 2,  2, 4, 0.6);
    gradeBeam( 0,  0, 8, 0.6);

    // Stack of plywood formwork waiting on the middle-terrace ledge
    const plywoodGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const sheet = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.045, 1.2),
        new THREE.MeshLambertMaterial({ color: 0xd4a268 }),
      );
      sheet.position.set(0, -5 + 0.025 + i * 0.05, 0);
      sheet.castShadow = true;
      sheet.receiveShadow = true;
      plywoodGroup.add(sheet);
    }
    plywoodGroup.position.set(-9, 0, -4.2);
    scene.add(plywoodGroup);

    // Bundle of vertical rebar staged on the middle ledge for the
    // next column / wall pour
    const stagedRebar = new THREE.Group();
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 3.5, 8),
          rebarMat,
        );
        rod.rotation.z = Math.PI / 2;
        rod.position.set(0, -5 + 0.06 + r * 0.1, c * 0.12 - 0.18);
        rod.castShadow = true;
        stagedRebar.add(rod);
      }
    }
    stagedRebar.position.set(8.5, 0, -4);
    scene.add(stagedRebar);

    /* ── North embankment + retaining wall (Creative 6 anchor reference)
       Sits just behind the dig on the north edge so the AI insight pulse
       has something concrete to point at, but kept smaller and lower than
       the dig so it doesn't compete with the central feature. */
    const embankW = 22;
    const embankD = 13;
    const embankH = 3;
    const embankCx = 0;
    const embankCz = -19;

    const embankBody = new THREE.Mesh(
      new THREE.BoxGeometry(embankW, embankH, embankD),
      new THREE.MeshLambertMaterial({ color: 0x856a4d }),
    );
    embankBody.position.set(embankCx, embankH / 2, embankCz);
    embankBody.castShadow = true;
    embankBody.receiveShadow = true;
    scene.add(embankBody);

    const embankTop = new THREE.Mesh(
      new THREE.PlaneGeometry(embankW, embankD),
      new THREE.MeshLambertMaterial({ color: 0x7a6244 }),
    );
    embankTop.rotation.x = -Math.PI / 2;
    embankTop.position.set(embankCx, embankH + 0.01, embankCz);
    embankTop.receiveShadow = true;
    scene.add(embankTop);

    /* Poured concrete retaining wall on the embankment's south face.
       Slightly narrower and taller than the embankment, with the back
       embedded a hair into the embankment so no two faces are coplanar
       (no z-fighting). */
    const retainColor = 0xb6b0a8;
    const retainAccent = 0xa8a298;
    const wallW = 21.5;
    const wallH = 3.6;
    const wallD = 0.6;
    const wallCx = 0;
    const wallCz = -12.4;

    box(wallCx, 0, wallCz, wallW, wallH, wallD, retainColor, retainAccent);

    box(
      wallCx, wallH + 0.01, wallCz,
      wallW + 0.4, 0.25, wallD + 0.3,
      retainAccent, retainAccent,
    );

    const wallFaceZ = wallCz + wallD / 2;
    const detailOffset = 0.04;

    for (let i = 1; i <= 4; i++) {
      const jointX = wallCx - wallW / 2 + (i * wallW) / 5;
      const jointDepth = 0.05;
      const joint = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, wallH - 0.2, jointDepth),
        new THREE.MeshLambertMaterial({ color: 0x8a8278 }),
      );
      joint.position.set(
        jointX,
        wallH / 2 - 0.1,
        wallFaceZ + detailOffset + jointDepth / 2,
      );
      scene.add(joint);
    }

    const tieDepth = 0.04;
    const tieGeo = new THREE.BoxGeometry(0.12, 0.12, tieDepth);
    const tieMat = new THREE.MeshLambertMaterial({ color: 0x6a6660 });
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        const tx = wallCx - wallW / 2 + 1.5 + (col * (wallW - 3)) / 4;
        const ty = 0.8 + row * 1.4;
        const tie = new THREE.Mesh(tieGeo, tieMat);
        tie.position.set(tx, ty, wallFaceZ + detailOffset + tieDepth / 2);
        scene.add(tie);
      }
    }

    /* ── Stockpile mounds (cut material set aside on the east side) ── */
    function stockpile(x: number, z: number, scale = 1, color = 0x9a8060) {
      const mound = new THREE.Mesh(
        new THREE.ConeGeometry(2.4 * scale, 1.8 * scale, 6),
        new THREE.MeshLambertMaterial({ color }),
      );
      mound.position.set(x, 0.9 * scale, z);
      mound.rotation.y = Math.PI / 6;
      mound.castShadow = true;
      mound.receiveShadow = true;
      scene.add(mound);
    }
    stockpile(22, -10, 1.0, 0x9a8060);
    stockpile(24, -2, 1.2, 0x8e7456);
    stockpile(22, 8, 0.85, 0x826a4d);

    /* ── Excavator working at the east edge of the dig ─────────
       Geometry is computed so the boom pivots up off the body, the stick
       hangs forward-down from the boom end, and the bucket lands on the
       ground at the stick end (no floating parts). */
    function excavator(x: number, z: number, rot = 0) {
      const yellow = 0xe8c840;
      const dark = 0x2a2a2a;
      const accent = 0xcca830;
      const group = new THREE.Group();

      // Tracks
      const trackL = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.7, 0.9),
        new THREE.MeshLambertMaterial({ color: dark }),
      );
      trackL.position.set(0, 0.35, -1.1);
      trackL.castShadow = true;
      trackL.receiveShadow = true;
      group.add(trackL);
      const trackR = trackL.clone();
      trackR.position.z = 1.1;
      group.add(trackR);

      // Body / undercarriage of the rotating house
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.6, 2.6),
        new THREE.MeshLambertMaterial({ color: yellow }),
      );
      body.position.set(0, 1.0, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Engine cover (back of body)
      const engine = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.9, 2.0),
        new THREE.MeshLambertMaterial({ color: accent }),
      );
      engine.position.set(0.8, 1.75, 0);
      engine.castShadow = true;
      engine.receiveShadow = true;
      group.add(engine);

      // Cab
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.4, 1.4),
        new THREE.MeshLambertMaterial({ color: yellow }),
      );
      cab.position.set(-0.6, 2.0, 0);
      cab.castShadow = true;
      cab.receiveShadow = true;
      group.add(cab);

      const cabRoof = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 0.12, 1.45),
        new THREE.MeshLambertMaterial({ color: accent }),
      );
      cabRoof.position.set(-0.6, 2.76, 0);
      cabRoof.castShadow = true;
      group.add(cabRoof);

      // Boom — pivots from the front-top of the body, angled UP and forward.
      const pivotX = 1.4;
      const pivotY = 1.3;
      const boomLen = 3.5;
      const boomAngle = Math.PI / 5; // +36°  (up and forward)
      const boom = new THREE.Mesh(
        new THREE.BoxGeometry(boomLen, 0.5, 0.5),
        new THREE.MeshLambertMaterial({ color: yellow }),
      );
      boom.position.set(
        pivotX + (boomLen / 2) * Math.cos(boomAngle),
        pivotY + (boomLen / 2) * Math.sin(boomAngle),
        0,
      );
      boom.rotation.z = boomAngle;
      boom.castShadow = true;
      group.add(boom);

      // Stick — extends down-and-forward from boom end.
      const boomEndX = pivotX + boomLen * Math.cos(boomAngle);
      const boomEndY = pivotY + boomLen * Math.sin(boomAngle);
      const stickLen = 2.8;
      const stickAngle = -Math.PI * 0.43; // -77°  (mostly down)
      const stick = new THREE.Mesh(
        new THREE.BoxGeometry(stickLen, 0.4, 0.4),
        new THREE.MeshLambertMaterial({ color: yellow }),
      );
      stick.position.set(
        boomEndX + (stickLen / 2) * Math.cos(stickAngle),
        boomEndY + (stickLen / 2) * Math.sin(stickAngle),
        0,
      );
      stick.rotation.z = stickAngle;
      stick.castShadow = true;
      group.add(stick);

      // Bucket — sits at stick end, planted on the ground.
      const stickEndX = boomEndX + stickLen * Math.cos(stickAngle);
      const bucket = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.8, 1.3),
        new THREE.MeshLambertMaterial({ color: dark }),
      );
      bucket.position.set(stickEndX, 0.4, 0);
      bucket.castShadow = true;
      group.add(bucket);

      group.position.set(x, 0, z);
      group.rotation.y = rot;
      scene.add(group);
    }
    // Position the excavator at the east edge of the dig, facing west into
    // it so its bucket reaches over the rim into the pit.
    excavator(18, -3, Math.PI);

    /* ── Dump trucks ───────────────────────────────────────── */
    function dumpTruck(x: number, z: number, rot = 0) {
      const yellow = 0xe8c840;
      const dark = 0x2a2a2a;
      const bedColor = 0x4a4036;
      const group = new THREE.Group();

      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2.2),
        new THREE.MeshLambertMaterial({ color: yellow }),
      );
      cab.position.set(0, 1.2, 0);
      cab.castShadow = true;
      cab.receiveShadow = true;
      group.add(cab);

      const hood = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1, 2.2),
        new THREE.MeshLambertMaterial({ color: yellow }),
      );
      hood.position.set(1.6, 0.7, 0);
      hood.castShadow = true;
      group.add(hood);

      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.5, 2.4),
        new THREE.MeshLambertMaterial({ color: bedColor }),
      );
      bed.position.set(-1.8, 1.5, 0);
      bed.castShadow = true;
      bed.receiveShadow = true;
      group.add(bed);

      const dirtLoad = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 0.7, 6),
        new THREE.MeshLambertMaterial({ color: 0x8a6e50 }),
      );
      dirtLoad.position.set(-1.8, 2.5, 0);
      dirtLoad.rotation.y = Math.PI / 6;
      dirtLoad.castShadow = true;
      group.add(dirtLoad);

      for (let i = 0; i < 6; i++) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.55, 0.55, 16),
          new THREE.MeshLambertMaterial({ color: dark }),
        );
        wheel.rotation.x = Math.PI / 2;
        const wxIdx = Math.floor(i / 2);
        wheel.position.set(1 - wxIdx * 1.6, 0.55, i % 2 === 0 ? -1.3 : 1.3);
        wheel.castShadow = true;
        group.add(wheel);
      }

      group.position.set(x, 0, z);
      group.rotation.y = rot;
      scene.add(group);
    }
    dumpTruck(8, 26, Math.PI / 2);
    dumpTruck(-32, 6, 0);

    /* ── Traffic cone (reused in two zones below) ───────────── */
    function cone(x: number, z: number, scale = 1) {
      const c = new THREE.Mesh(
        new THREE.ConeGeometry(0.22 * scale, 0.7 * scale, 12),
        new THREE.MeshLambertMaterial({ color: 0xe85a18 }),
      );
      c.position.set(x, 0.35 * scale, z);
      c.castShadow = true;
      scene.add(c);
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16 * scale, 0.18 * scale, 0.07 * scale, 12),
        new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }),
      );
      band.position.set(x, 0.42 * scale, z);
      scene.add(band);
    }

    /* ── Materials staged in front of the retaining wall ─────────
       Fills the strip between the wall (z ≈ -12.1) and the pit rim
       (z = -11) with realistic site detail: cones, rebar bundles,
       precast block stacks, and pipe sections. */

    // Safety line of cones along the base of the wall
    for (let i = 0; i < 6; i++) {
      cone(-9 + i * 3.6, -11.5);
    }

    // Rebar bundle — rust-coloured rods laid lengthwise along the wall
    function rebarBundle(x: number, z: number) {
      const group = new THREE.Group();
      const rodMat = new THREE.MeshLambertMaterial({ color: 0x8a5a3a });
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const rod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 4, 8),
            rodMat,
          );
          rod.rotation.z = Math.PI / 2;
          rod.position.set(c * 0.115 - 0.23, 0.06 + r * 0.1, 0);
          rod.castShadow = true;
          group.add(rod);
        }
      }
      group.position.set(x, 0, z);
      scene.add(group);
    }
    rebarBundle(-6, -11.4);
    rebarBundle(-6, -11.75);

    // Precast concrete blocks — stacked like form-work / barrier blocks
    function blockStack(x: number, z: number) {
      const group = new THREE.Group();
      const blockMat = new THREE.MeshLambertMaterial({ color: 0xb6b0a8 });
      const accentMat = new THREE.MeshLambertMaterial({ color: 0xa8a298 });
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.45, 0.5),
          i % 2 === 0 ? blockMat : accentMat,
        );
        b.position.set(i * 0.62, 0.225, 0);
        b.castShadow = true;
        b.receiveShadow = true;
        group.add(b);
      }
      for (let i = 0; i < 2; i++) {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.45, 0.5),
          accentMat,
        );
        b.position.set(0.31 + i * 0.62, 0.675, 0);
        b.castShadow = true;
        group.add(b);
      }
      group.position.set(x, 0, z);
      scene.add(group);
    }
    blockStack(2, -11.6);
    blockStack(5.6, -11.6);

    // Pipe sections — metal cylinders laid on the ground
    function pipe(x: number, z: number, color = 0x505860) {
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 2.4, 14),
        new THREE.MeshLambertMaterial({ color }),
      );
      p.rotation.z = Math.PI / 2;
      p.position.set(x, 0.28, z);
      p.castShadow = true;
      p.receiveShadow = true;
      scene.add(p);
    }
    pipe(8.6, -11.4);
    pipe(8.6, -11.95);
    pipe(8.6, -11.7, 0x6a6e76);

    /* ── Spoil, boulders, and cones around the working excavator ──
       Detail in front of the excavator showing freshly excavated material
       and a marked-out work zone. */

    // Fresh spoil mound east of the excavator (newly dug dirt staged
    // for hauling)
    const freshSpoil = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 0.95, 6),
      new THREE.MeshLambertMaterial({ color: 0x9a7a55 }),
    );
    freshSpoil.position.set(20.5, 0.475, -3);
    freshSpoil.rotation.y = Math.PI / 5;
    freshSpoil.castShadow = true;
    freshSpoil.receiveShadow = true;
    scene.add(freshSpoil);

    const freshSpoilSmall = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 0.55, 6),
      new THREE.MeshLambertMaterial({ color: 0x8e6e4d }),
    );
    freshSpoilSmall.position.set(19.4, 0.275, -5.4);
    freshSpoilSmall.rotation.y = Math.PI / 7;
    freshSpoilSmall.castShadow = true;
    scene.add(freshSpoilSmall);

    // Boulders kicked up by the excavation — some on the rim, some
    // sitting on the top terrace floor of the pit.
    function boulder(x: number, y: number, z: number, r = 0.4) {
      const b = new THREE.Mesh(
        new THREE.DodecahedronGeometry(r),
        new THREE.MeshLambertMaterial({ color: 0x6a5a48, flatShading: true }),
      );
      b.position.set(x, y + r * 0.6, z);
      b.rotation.set(0.6, 0.9, 0.3);
      b.castShadow = true;
      b.receiveShadow = true;
      scene.add(b);
    }
    boulder(15.4, 0, -1.4, 0.42);
    boulder(14.7, 0, -4.6, 0.35);
    boulder(15.6, 0, -5.6, 0.3);
    boulder(13.8, -1.7, -3, 0.4);   // sitting on the top terrace floor
    boulder(12.9, -1.7, -2.2, 0.32);

    // Cones marking the excavator's exclusion zone
    cone(13.5, -0.4, 0.9);
    cone(13.5, -5.6, 0.9);
    cone(16.6, -6.6, 0.9);
    cone(16.6, 0.4, 0.9);

    /* ── Site office trailer (east side, well clear of the dig) ── */
    box(28, 0, 14, 4.5, 2.4, 2.6, 0xc8ccd4, 0xb0b4bc);
    // Door — full height from ground up to ~1.9m so it doesn't float.
    box(28, 0, 15.34, 0.7, 1.9, 0.05, 0x4a4a4a);
    for (let i = 0; i < 3; i++) {
      box(26.4 + i * 0.9, 1.4, 12.66, 0.5, 0.5, 0.05, 0x6a8aa8);
    }

    /* ── Survey stakes with red flags — only around the dig rim and
       on the embankment plateau, to keep the central pit the clear
       focus of the scene. */
    function surveyStake(x: number, z: number, y = 0) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1, 0.08),
        new THREE.MeshLambertMaterial({ color: 0x4a3a2a }),
      );
      post.position.set(x, y + 0.5, z);
      post.castShadow = true;
      scene.add(post);
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.32, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xe83828 }),
      );
      flag.position.set(x + 0.28, y + 0.85, z);
      scene.add(flag);
    }
    // Pit rim — corners + mid-edge stakes mark the cut footprint.
    surveyStake(-16, -11);
    surveyStake(0, -11);
    surveyStake(16, -11);
    surveyStake(-16, 11);
    surveyStake(0, 11);
    surveyStake(16, 11);
    surveyStake(-16, 0);
    surveyStake(16, 0);
    // On top of the embankment plateau (the ground the wall is retaining)
    surveyStake(-8, -22, embankH);
    surveyStake(8, -22, embankH);

    /* ── Trees on the outer perimeter ────────────────────────── */
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
    tree(-30, 18, 5);
    tree(-26, 22, 4);
    tree(-32, -24, 5);
    tree(-26, -28, 4);
    tree(28, 22, 4.5);
    tree(32, 16, 4);
    tree(32, -10, 5);
    tree(28, -22, 4);

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

      // Position the card near the pulse marker (instead of pinning to top-right).
      // Choose the side with more room, then clamp vertically so it stays on-screen.
      // We update on every frame (not just when open) so the line endpoints are
      // already correct on the first frame the SVG fades in — otherwise the
      // line briefly flashes from stale coordinates and looks like a blink.
      if (card) {
        const cardW = card.offsetWidth || CARD_WIDTH;
        const cardH = card.offsetHeight || 480;

        let cardLeft: number;
        if (sx + CARD_GAP + cardW + CARD_MARGIN <= W) {
          cardLeft = sx + CARD_GAP;
        } else if (sx - CARD_GAP - cardW - CARD_MARGIN >= 0) {
          cardLeft = sx - CARD_GAP - cardW;
        } else {
          cardLeft = Math.max(
            CARD_MARGIN,
            Math.min(W - cardW - CARD_MARGIN, sx - cardW / 2),
          );
        }

        let cardTop = sy - cardH / 2;
        cardTop = Math.max(
          CARD_MARGIN,
          Math.min(H - cardH - CARD_MARGIN, cardTop),
        );

        // Round to integers so transform doesn't snap on sub-pixel boundaries.
        const cardLeftPx = Math.round(cardLeft);
        const cardTopPx = Math.round(cardTop);
        card.style.transform = `translate3d(${cardLeftPx}px, ${cardTopPx}px, 0)`;

        if (line) {
          // Compute the card center directly from the rounded transform + size
          // (avoids an extra getBoundingClientRect / layout flush each frame).
          const cx = cardLeftPx + cardW / 2;
          const cy = cardTopPx + cardH / 2;
          line.setAttribute('x1', String(Math.round(sx)));
          line.setAttribute('y1', String(Math.round(sy)));
          line.setAttribute('x2', String(Math.round(cx)));
          line.setAttribute('y2', String(Math.round(cy)));
        }
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
          {/* userSpaceOnUse keeps the gradient anchored to the SVG viewport so
              it doesn't re-map every frame as the line endpoints change —
              objectBoundingBox (the default) caused visible shimmer/flicker. */}
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
        <line
          ref={lineRef}
          stroke="url(#rainbowLine)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.9"
          shapeRendering="geometricPrecision"
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

      {/* Creative6 anchored card — positioned next to the pulse marker via updateOverlay */}
      <div
        ref={cardWrapRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: CARD_WIDTH,
          zIndex: 10,
          pointerEvents: open ? 'auto' : 'none',
          willChange: 'transform',
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
