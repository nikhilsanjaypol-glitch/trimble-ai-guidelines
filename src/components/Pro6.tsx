import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import {
  ModusWcButton,
  ModusWcIcon,
} from '@trimble-oss/moduswebcomponents-react';

/* ─────────────────────────────────────────────────────────────────
 * Pro 6 — VISUALIZE WORK DONE FOR ACCEPTANCE
 *
 * Full-bleed Three.js BIM viewport.  AI-modified perimeter beams
 * carry a continuously-glittering cyan edge outline (dashed lines
 * with a marching-ants offset + a gentle opacity breath) so the
 * affected members read as "the ones AI changed" from any orbit
 * angle.  Clicking on any of those beams toggles the explanation
 * card open, with an SVG line drawn from the beams' centroid to
 * the card.  Accepting fades all of it to neutral steel.
 * ───────────────────────────────────────────────────────────────── */

const TRIMBLE_RAINBOW =
  'linear-gradient(135deg, #00D7C0 0%, #009AFE 30%, #4A00FF 55%, #FF2092 78%, #FF00D3 100%)';

/* Trimble cyan = the AI-edit accent in the 3D scene; its only job is to
 * mark "this is the element AI just changed".  The card mirrors that
 * accent so the link between scene + card is unmistakable.  All other
 * surface, text, and status colours flow from Modus tokens. */
const AI_ACCENT_NUM = 0x1fb1a7;
const TOKEN_AI_ACCENT = 'var(--modus-wc-color-info, #1FB1A7)';
const TOKEN_BASE_PAGE = 'var(--modus-wc-color-base-page, #ffffff)';
const TOKEN_BASE_100 = 'var(--modus-wc-color-base-100, #ffffff)';
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

/* Card placement constants — mirror SiteScene so the gap/margins
 * read identically across the suite. */
const CARD_WIDTH = 360;
const CARD_MARGIN = 16;
const CARD_GAP = 80;

/* Default anchor for the connector line — centroid of the modified
 * front-face beams in the upper construction zone (floors 4 and 5).
 * The runtime anchor (anchorRef) is updated to the *specific* beam the
 * user clicks so the card always pops up next to that beam. */
const DEFAULT_ANCHOR = new THREE.Vector3(12.5, 4.5 * 3.2, 0);

function addSiteSurroundings(scene: THREE.Scene): void {
  const site = new THREE.Group();
  scene.add(site);

  const concreteMat = new THREE.MeshLambertMaterial({ color: 0xc4c8d0 });
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xf2c33b,
    roughness: 0.55,
    metalness: 0.25,
  });
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xe06b2a,
    roughness: 0.6,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1f,
    roughness: 0.95,
  });
  const cabGlass = new THREE.MeshStandardMaterial({
    color: 0x7090a8,
    transparent: true,
    opacity: 0.55,
    roughness: 0.1,
  });
  const containerWhite = new THREE.MeshLambertMaterial({ color: 0xe5e6e8 });
  const containerBlue = new THREE.MeshStandardMaterial({
    color: 0x2a5681,
    roughness: 0.7,
  });
  const containerRust = new THREE.MeshStandardMaterial({
    color: 0x83423a,
    roughness: 0.78,
  });
  const containerGreen = new THREE.MeshStandardMaterial({
    color: 0x3a6e3f,
    roughness: 0.7,
  });
  const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8d6a3a });
  const gravelMat = new THREE.MeshLambertMaterial({ color: 0x747983 });
  const sandMat = new THREE.MeshLambertMaterial({ color: 0xc8a96f });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb78a52,
    roughness: 0.9,
  });
  const rebarMat = new THREE.MeshStandardMaterial({
    color: 0xa67d4a,
    roughness: 0.7,
    metalness: 0.2,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x6f7681,
    roughness: 0.7,
    metalness: 0.35,
  });
  const bagMat = new THREE.MeshLambertMaterial({ color: 0xb8a98a });
  const cmuMat = new THREE.MeshLambertMaterial({ color: 0x9ea3aa });
  const treeBark = new THREE.MeshStandardMaterial({
    color: 0x5a3e2c,
    roughness: 0.95,
  });
  const treeLeaves = new THREE.MeshStandardMaterial({
    color: 0x4f8a4a,
    roughness: 0.85,
  });
  const fenceFrameMat = new THREE.MeshStandardMaterial({
    color: 0x5a5e64,
    roughness: 0.7,
  });
  const meshMat = new THREE.MeshBasicMaterial({
    color: 0x9ea2a8,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x2a2d33,
    roughness: 0.7,
  });
  const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x4a4d52 });
  const dumpsterMat = new THREE.MeshStandardMaterial({
    color: 0x44663a,
    roughness: 0.85,
  });
  const truckRedMat = new THREE.MeshStandardMaterial({
    color: 0xa1322a,
    roughness: 0.55,
  });
  const truckWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.5,
  });

  function box(
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = site,
    ry = 0,
  ): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function cyl(
    r: number,
    h: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    axis: 'y' | 'x' | 'z' = 'y',
    parent: THREE.Object3D = site,
  ): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), mat);
    m.position.set(x, y, z);
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    if (axis === 'z') m.rotation.x = Math.PI / 2;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  /* === Asphalt access road in front of the building === */
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(110, 14),
    asphaltMat,
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 28);
  road.receiveShadow = true;
  site.add(road);
  for (let i = -50; i <= 50; i += 4) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xf2c33b }),
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(i, 0.03, 28);
    site.add(stripe);
  }

  /* === Tower crane (left-rear) === */
  {
    const cx = -34;
    const cz = -22;
    box(3.8, 0.6, 3.8, concreteMat, cx, 0.3, cz);
    const mastH = 26;
    box(1.0, mastH, 1.0, yellowMat, cx, 0.6 + mastH / 2, cz);
    for (let i = 0; i < 9; i++) {
      box(1.06, 0.06, 1.06, blackMat, cx, 0.6 + (i + 0.5) * (mastH / 9), cz);
    }
    box(1.7, 1.6, 1.9, yellowMat, cx, 0.6 + mastH + 0.8, cz);
    box(1.5, 0.75, 1.5, cabGlass, cx, 0.6 + mastH + 1.4, cz);
    const jibLen = 24;
    box(jibLen, 0.5, 0.5, yellowMat, cx + jibLen / 2 - 4, 0.6 + mastH + 1.55, cz);
    box(jibLen, 0.06, 0.06, blackMat, cx + jibLen / 2 - 4, 0.6 + mastH + 2.1, cz);
    box(8, 0.5, 0.5, yellowMat, cx - 5, 0.6 + mastH + 1.55, cz);
    box(2.6, 1.4, 1.7, concreteMat, cx - 8.5, 0.6 + mastH + 2.1, cz);
    const trolleyX = cx + 9;
    box(0.7, 0.4, 0.8, blackMat, trolleyX, 0.6 + mastH + 1.15, cz);
    const cableH = 17;
    box(0.06, cableH, 0.06, blackMat, trolleyX, 0.6 + mastH + 0.95 - cableH / 2, cz);
    box(0.55, 0.55, 0.55, blackMat, trolleyX, 0.6 + mastH + 0.95 - cableH, cz);
    box(0.45, 4.5, 0.45, yellowMat, cx, 0.6 + mastH + 3.6, cz);
  }

  /* === Mobile crane (right-rear) === */
  {
    const cx = 30;
    const cz = -16;
    box(7.5, 1.0, 2.6, orangeMat, cx, 1.1, cz);
    for (let w = -1; w <= 1; w += 2) {
      for (let i = -3; i <= 3; i += 1.6) {
        cyl(0.55, 0.4, tireMat, cx + i, 0.55, cz + w * 1.2, 'x');
      }
    }
    box(1.8, 1.4, 2.2, orangeMat, cx + 2.6, 2.3, cz);
    box(1.5, 0.8, 1.9, cabGlass, cx + 2.6, 3.0, cz);
    box(1.4, 1.0, 1.0, blackMat, cx, 2.1, cz);
    const boom = new THREE.Group();
    boom.position.set(cx - 1, 2.5, cz);
    boom.rotation.z = Math.PI / 5;
    site.add(boom);
    box(11, 0.6, 0.6, orangeMat, 5.5, 0, 0, boom);
    box(8, 0.45, 0.45, yellowMat, 4, 0, 0, boom);
    box(6, 0.32, 0.32, yellowMat, 3, 0, 0, boom);
    for (let i = 0; i < 4; i++) {
      box(0.8, 0.2, 0.4, blackMat, cx - 3.5 + i * 2.3, 0.2, cz + 1.6);
      box(0.8, 0.2, 0.4, blackMat, cx - 3.5 + i * 2.3, 0.2, cz - 1.6);
    }
  }

  /* === Excavator (front-right) === */
  {
    const cx = 24;
    const cz = 18;
    box(4.4, 0.5, 1.2, blackMat, cx, 0.35, cz - 1.0);
    box(4.4, 0.5, 1.2, blackMat, cx, 0.35, cz + 1.0);
    for (let w = -1; w <= 1; w += 2) {
      for (let i = -1.6; i <= 1.6; i += 0.8) {
        cyl(0.35, 0.45, blackMat, cx + i, 0.35, cz + w * 1.0, 'x');
      }
    }
    box(3.2, 0.6, 2.4, yellowMat, cx, 0.95, cz);
    box(2.4, 1.6, 1.8, yellowMat, cx - 0.4, 1.95, cz - 0.2);
    box(1.6, 1.0, 1.6, cabGlass, cx + 0.6, 2.05, cz);
    const arm = new THREE.Group();
    arm.position.set(cx + 1.2, 1.6, cz);
    site.add(arm);
    const boom1 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 0.5), yellowMat);
    boom1.rotation.z = Math.PI / 4;
    boom1.position.set(1.4, 1.4, 0);
    boom1.castShadow = true;
    arm.add(boom1);
    const boom2 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 0.4), yellowMat);
    boom2.rotation.z = -Math.PI / 5;
    boom2.position.set(3.4, 2.6, 0);
    boom2.castShadow = true;
    arm.add(boom2);
    const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.4), blackMat);
    bucket.position.set(4.6, 1.6, 0);
    bucket.castShadow = true;
    arm.add(bucket);
  }

  /* === Wheel loader (front) === */
  {
    const cx = 12;
    const cz = 22;
    box(3.4, 1.0, 1.8, yellowMat, cx, 1.0, cz);
    box(1.5, 1.2, 1.5, yellowMat, cx + 0.4, 2.1, cz);
    box(1.3, 0.8, 1.3, cabGlass, cx + 0.4, 2.6, cz);
    for (let w = -1; w <= 1; w += 2) {
      for (let i = -1; i <= 1; i += 2) {
        cyl(0.65, 0.45, tireMat, cx + i * 1.2, 0.65, cz + w * 1.0, 'x');
      }
    }
    const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 1.9), yellowMat);
    bucket.position.set(cx - 2.4, 0.7, cz);
    bucket.rotation.z = -Math.PI / 8;
    bucket.castShadow = true;
    site.add(bucket);
    box(0.2, 0.2, 1.6, yellowMat, cx - 2.0, 0.7, cz);
  }

  /* === Cement mixer truck (front) === */
  {
    const cx = -2;
    const cz = 24;
    box(7.5, 1.2, 2.4, truckRedMat, cx, 1.0, cz);
    box(2.0, 1.4, 2.2, truckWhiteMat, cx + 2.8, 2.0, cz);
    box(1.6, 0.8, 1.8, cabGlass, cx + 2.8, 2.6, cz);
    for (let w = -1; w <= 1; w += 2) {
      for (const i of [-2.5, 0.5, 1.7]) {
        cyl(0.55, 0.4, tireMat, cx + i, 0.55, cz + w * 1.2, 'x');
      }
    }
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.1, 3.5, 24),
      yellowMat,
    );
    drum.position.set(cx - 1.5, 2.6, cz);
    drum.rotation.z = Math.PI / 2.5;
    drum.castShadow = true;
    drum.receiveShadow = true;
    site.add(drum);
  }

  /* === Concrete pump truck (front-left) === */
  {
    const cx = -16;
    const cz = 22;
    box(7.0, 1.0, 2.4, truckWhiteMat, cx, 1.0, cz);
    box(1.8, 1.4, 2.2, truckWhiteMat, cx + 2.5, 2.1, cz);
    box(1.5, 0.8, 1.8, cabGlass, cx + 2.5, 2.7, cz);
    for (let w = -1; w <= 1; w += 2) {
      for (const i of [-2.4, -0.6, 0.8, 2.0]) {
        cyl(0.55, 0.4, tireMat, cx + i, 0.55, cz + w * 1.2, 'x');
      }
    }
    box(2.2, 1.0, 2.0, blackMat, cx - 2.4, 2.1, cz);
    const folded = new THREE.Group();
    folded.position.set(cx - 1, 2.7, cz);
    site.add(folded);
    box(5.0, 0.4, 0.4, yellowMat, 1.2, 0.5, 0, folded);
    box(3.6, 0.32, 0.32, yellowMat, 2.2, 1.2, 0, folded, Math.PI / 8);
  }

  /* === Forklift === */
  {
    const cx = 8;
    const cz = 14;
    box(1.6, 1.0, 1.0, orangeMat, cx, 0.7, cz);
    box(1.0, 1.4, 1.0, orangeMat, cx + 0.1, 1.7, cz);
    box(0.9, 0.8, 0.9, cabGlass, cx + 0.1, 2.2, cz);
    for (let w = -1; w <= 1; w += 2) {
      for (const i of [-0.6, 0.6]) {
        cyl(0.35, 0.3, tireMat, cx + i, 0.35, cz + w * 0.5, 'x');
      }
    }
    box(0.1, 1.6, 0.6, blackMat, cx - 0.6, 0.9, cz - 0.3);
    box(0.1, 1.6, 0.6, blackMat, cx - 0.6, 0.9, cz + 0.3);
    box(1.2, 0.08, 0.18, blackMat, cx - 1.3, 0.15, cz - 0.3);
    box(1.2, 0.08, 0.18, blackMat, cx - 1.3, 0.15, cz + 0.3);
  }

  /* === Site office (white container with windows) === */
  {
    const cx = -28;
    const cz = 20;
    box(7.5, 2.6, 2.6, containerWhite, cx, 1.45, cz);
    box(0.05, 1.0, 0.7, cabGlass, cx + 1.5, 1.7, cz - 1.32);
    box(0.05, 1.0, 0.7, cabGlass, cx - 0.5, 1.7, cz - 1.32);
    box(0.05, 1.0, 0.7, cabGlass, cx - 2.5, 1.7, cz - 1.32);
    box(0.5, 1.6, 0.05, blackMat, cx + 2.6, 0.95, cz - 1.32);
    box(0.5, 0.05, 1.6, woodMat, cx + 2.6, 0.18, cz - 2.0);
    box(0.5, 0.05, 1.6, woodMat, cx + 2.6, 0.5, cz - 2.0);
  }

  /* === Storage container (rust) === */
  box(6.0, 2.6, 2.4, containerRust, 30, 1.45, 22);
  box(6.0, 2.6, 2.4, containerBlue, 30, 4.05, 22);

  /* === Tool shed (smaller container) === */
  box(4.0, 2.4, 2.2, containerGreen, -32, 1.35, 6);

  /* === Porta potties === */
  for (let i = 0; i < 3; i++) {
    box(1.1, 2.2, 1.1, containerBlue, -34, 1.15, -2 + i * 1.3);
    box(0.05, 0.7, 0.6, blackMat, -33.4, 1.15, -2 + i * 1.3);
  }

  /* === Dumpsters === */
  box(3.6, 1.4, 2.0, dumpsterMat, 30, 0.75, 8);
  box(3.6, 1.4, 2.0, dumpsterMat, 30, 0.75, 4);

  /* === Stockpile: rebar bundles === */
  {
    const cx = -22;
    const cz = 4;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        const bundle = new THREE.Group();
        bundle.position.set(cx + c * 0.7, 0.25 + r * 0.45, cz);
        site.add(bundle);
        for (let b = 0; b < 7; b++) {
          cyl(0.05, 6, rebarMat, -0.2 + (b % 3) * 0.13, (Math.floor(b / 3)) * 0.13, 0, 'z', bundle);
        }
        box(0.6, 0.04, 0.05, blackMat, 0, 0.2, -2.5, bundle);
        box(0.6, 0.04, 0.05, blackMat, 0, 0.2, 2.5, bundle);
      }
    }
  }

  /* === Stockpile: lumber/plywood sheets === */
  {
    const cx = -20;
    const cz = 12;
    for (let r = 0; r < 8; r++) {
      box(4, 0.05, 2.2, woodMat, cx, 0.1 + r * 0.06, cz);
    }
  }

  /* === Stockpile: CMU blocks === */
  {
    const cx = -28;
    const cz = 14;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        for (let h = 0; h < 3; h++) {
          box(0.4, 0.2, 0.4, cmuMat, cx + c * 0.45 - 0.5, 0.1 + h * 0.21, cz + r * 0.45);
        }
      }
    }
  }

  /* === Stockpile: bagged cement on pallets === */
  {
    const cx = 22;
    const cz = 4;
    for (let p = 0; p < 2; p++) {
      const px = cx + p * 1.6;
      box(1.4, 0.15, 1.2, woodMat, px, 0.075, cz);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          for (let h = 0; h < 4; h++) {
            box(0.4, 0.18, 0.32, bagMat, px - 0.45 + c * 0.45, 0.18 + h * 0.18, cz - 0.45 + r * 0.45);
          }
        }
      }
    }
  }

  /* === Stack of pipes === */
  {
    const cx = 28;
    const cz = -4;
    for (let r = 0; r < 3; r++) {
      const yOff = 0.32 + r * 0.5;
      for (let c = 0; c < 4 - r; c++) {
        cyl(0.22, 5, blackMat, cx + c * 0.5 + r * 0.25 - 0.5, yOff, cz, 'z');
      }
    }
  }

  /* === Stack of I-beams === */
  {
    const cx = -28;
    const cz = -10;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        box(7, 0.25, 0.25, steelMat, cx, 0.15 + r * 0.32, cz - 0.6 + c * 0.32);
      }
    }
  }

  /* === Pallet pile === */
  {
    const cx = 18;
    const cz = 12;
    for (let r = 0; r < 6; r++) {
      box(1.2, 0.14, 1.2, woodMat, cx, 0.07 + r * 0.16, cz);
    }
  }

  /* === Earth mounds === */
  function mound(r: number, h: number, mat: THREE.Material, x: number, z: number) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), mat);
    m.position.set(x, 0, z);
    m.scale.set(1, h / r, 1);
    m.castShadow = true;
    m.receiveShadow = true;
    site.add(m);
  }
  mound(3.5, 1.6, dirtMat, -40, -10);
  mound(3.0, 1.4, dirtMat, -42, -16);
  mound(3.6, 1.5, gravelMat, 38, -22);
  mound(2.8, 1.3, sandMat, -38, -22);
  mound(2.4, 1.0, gravelMat, 42, -10);

  /* === Generator on trailer === */
  {
    const cx = 28;
    const cz = 14;
    box(2.4, 1.0, 1.4, yellowMat, cx, 0.7, cz);
    box(0.4, 0.6, 0.4, blackMat, cx - 0.6, 1.4, cz);
    cyl(0.3, 0.2, tireMat, cx - 1.0, 0.3, cz + 0.7, 'x');
    cyl(0.3, 0.2, tireMat, cx - 1.0, 0.3, cz - 0.7, 'x');
  }

  /* === Light towers (4 corners) === */
  function lightTower(x: number, z: number) {
    box(1.2, 0.4, 0.8, yellowMat, x, 0.2, z);
    box(0.2, 6, 0.2, fenceFrameMat, x, 3.2, z);
    box(1.6, 0.2, 1.0, blackMat, x, 6.3, z);
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        box(0.5, 0.3, 0.4, new THREE.MeshBasicMaterial({ color: 0xfff5cc }), x + i * 0.5, 6.3, z + j * 0.3);
      }
    }
  }
  lightTower(-40, 30);
  lightTower(40, 30);
  lightTower(-40, -30);
  lightTower(40, -30);

  /* === Jersey barriers (line the inner road edge) === */
  for (let i = -22; i <= 22; i += 3.2) {
    const top = new THREE.Mesh(new THREE.BoxGeometry(3, 0.55, 0.35), concreteMat);
    top.position.set(i, 0.85, 21);
    top.castShadow = true;
    top.receiveShadow = true;
    site.add(top);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(3, 0.55, 0.6), concreteMat);
    bot.position.set(i, 0.275, 21);
    bot.castShadow = true;
    bot.receiveShadow = true;
    site.add(bot);
  }

  /* === Traffic cones === */
  function cone(x: number, z: number) {
    const c = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.7, 12),
      new THREE.MeshStandardMaterial({ color: 0xff6a18, roughness: 0.6 }),
    );
    c.position.set(x, 0.35, z);
    c.castShadow = true;
    site.add(c);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.45), blackMat);
    base.position.set(x, 0.03, z);
    site.add(base);
  }
  for (let i = -20; i <= 20; i += 2.5) {
    cone(i, 19.6);
  }
  cone(14, 16);
  cone(16, 16);
  cone(-14, 16);
  cone(-10, 14);

  /* === Site fence (chain-link panels around the perimeter) === */
  const FX = 46;
  const FZ = 32;
  function fencePanel(x1: number, z1: number, x2: number, z2: number) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const ang = Math.atan2(z2 - z1, x2 - x1);
    const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), fenceFrameMat);
    top.position.set(cx, 2.0, cz);
    top.rotation.y = -ang;
    top.castShadow = true;
    site.add(top);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), fenceFrameMat);
    bot.position.set(cx, 0.1, cz);
    bot.rotation.y = -ang;
    site.add(bot);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.85), meshMat);
    mesh.position.set(cx, 1.05, cz);
    mesh.rotation.y = -ang + Math.PI / 2;
    site.add(mesh);
  }
  function fencePost(x: number, z: number) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.1, 0.1), fenceFrameMat);
    p.position.set(x, 1.05, z);
    p.castShadow = true;
    site.add(p);
  }
  const segCount = 20;
  for (let i = 0; i < segCount; i++) {
    const t1 = i / segCount;
    const t2 = (i + 1) / segCount;
    fencePanel(-FX + 2 * FX * t1, -FZ, -FX + 2 * FX * t2, -FZ);
    fencePanel(-FX + 2 * FX * t1, FZ, -FX + 2 * FX * t2, FZ);
    fencePost(-FX + 2 * FX * t1, -FZ);
    fencePost(-FX + 2 * FX * t1, FZ);
  }
  const segCountZ = 14;
  for (let i = 0; i < segCountZ; i++) {
    const t1 = i / segCountZ;
    const t2 = (i + 1) / segCountZ;
    fencePanel(-FX, -FZ + 2 * FZ * t1, -FX, -FZ + 2 * FZ * t2);
    fencePanel(FX, -FZ + 2 * FZ * t1, FX, -FZ + 2 * FZ * t2);
    fencePost(-FX, -FZ + 2 * FZ * t1);
    fencePost(FX, -FZ + 2 * FZ * t1);
  }
  fencePost(-FX, FZ);
  fencePost(FX, FZ);

  /* === Site entry gate cutout (skip a panel near front-center) === */

  /* === Pickup trucks (parked outside the building) === */
  function pickup(cx: number, cz: number, mat: THREE.Material, ry = 0) {
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    g.rotation.y = ry;
    site.add(g);
    box(4.2, 1.0, 1.8, mat, 0, 0.85, 0, g);
    box(1.6, 1.0, 1.7, mat, 0.8, 1.85, 0, g);
    box(1.4, 0.7, 1.5, cabGlass, 0.8, 2.0, 0, g);
    for (let w = -1; w <= 1; w += 2) {
      for (const i of [-1.4, 1.0]) {
        cyl(0.45, 0.35, tireMat, i, 0.45, w * 0.85, 'x', g);
      }
    }
  }
  pickup(-22, 26, truckRedMat);
  pickup(-16, 26, truckWhiteMat);
  pickup(20, 26, new THREE.MeshStandardMaterial({ color: 0x2a3550 }), 0);
  pickup(28, -26, new THREE.MeshStandardMaterial({ color: 0x1f6f4f }));

  /* === Trees outside the fence === */
  function tree(x: number, z: number, scale = 1) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 * scale, 0.22 * scale, 1.6 * scale, 10),
      treeBark,
    );
    trunk.position.set(x, 0.8 * scale, z);
    trunk.castShadow = true;
    site.add(trunk);
    const cone1 = new THREE.Mesh(
      new THREE.ConeGeometry(1.6 * scale, 4.5 * scale, 12),
      treeLeaves,
    );
    cone1.position.set(x, (1.6 + 2.25) * scale, z);
    cone1.castShadow = true;
    site.add(cone1);
  }
  tree(-50, 0, 1.1);
  tree(-50, 10, 0.9);
  tree(-50, -10, 1.0);
  tree(50, 0, 1.0);
  tree(50, 12, 1.2);
  tree(50, -8, 0.95);
  tree(-30, 38, 1.1);
  tree(-15, 38, 0.95);
  tree(0, 38, 1.0);
  tree(15, 38, 1.05);
  tree(30, 38, 1.0);
  tree(-25, -38, 1.0);
  tree(0, -38, 1.05);
  tree(25, -38, 1.0);

  /* === Bushes (low spheres) === */
  function bush(x: number, z: number, r = 0.7) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), treeLeaves);
    m.position.set(x, r * 0.85, z);
    m.castShadow = true;
    site.add(m);
  }
  for (let i = 0; i < 14; i++) {
    bush(-50 + (i % 7) * 16, i < 7 ? 36 : -36, 0.6 + Math.random() * 0.4);
  }
  bush(-44, 4, 0.8);
  bush(-44, -8, 0.9);
  bush(44, 6, 0.7);
  bush(44, -6, 0.8);

}

export default function Pro6() {
  const mountRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);

  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const acceptedRef = useRef(false);

  /* Runtime card anchor — updated on click to the centroid of the
   * specific beam the user picked, so the connector line and card pop
   * up *next to that beam* rather than at a fixed centroid. */
  const anchorRef = useRef<THREE.Vector3>(DEFAULT_ANCHOR.clone());
  /* Index (into modifiedBeamMeshes) of the beam currently driving the
   * card. -1 means "card not bound to a beam" (closed). Re-clicking the
   * same beam closes the card; clicking a different beam moves it. */
  const activeBeamIdxRef = useRef<number>(-1);

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
    /* Front-RIGHT ISO framing — camera primarily on the +x side
     * (the front elevation that carries the AI highlights), rotated
     * ~30° toward -z so the front face and the right-hand (-z) side
     * face read together as a classic front-right iso. */
    camera.position.set(44, 23, -24);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, BLDG_H / 2, 0);
    controls.minDistance = 18;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.update();

    /* ── Lighting ─────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    scene.add(new THREE.HemisphereLight(0xddeeff, 0x8899aa, 0.45));

    const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
    sun.position.set(40, 60, 28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 220;
    const sc = 80;
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
    const concreteMat = new THREE.MeshLambertMaterial({ color: 0xb6bbc3 });
    const spandrelMat = new THREE.MeshLambertMaterial({ color: 0xc8ccd2 });
    const podiumMat = new THREE.MeshLambertMaterial({ color: 0x8e9298 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x96b6cc,
      transparent: true,
      opacity: 0.32,
      roughness: 0.06,
      metalness: 0.1,
    });
    const mullionMat = new THREE.MeshStandardMaterial({
      color: 0x3a3e44,
      roughness: 0.55,
      metalness: 0.45,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x6f7681,
      roughness: 0.7,
      metalness: 0.35,
    });
    const faintMat = new THREE.MeshStandardMaterial({
      color: 0xa3a8b0,
      roughness: 0.85,
      metalness: 0.18,
    });
    const rebarMat = new THREE.MeshStandardMaterial({
      color: 0xa67d4a,
      roughness: 0.7,
      metalness: 0.2,
    });
    const formworkMat = new THREE.MeshStandardMaterial({
      color: 0xb78a52,
      roughness: 0.9,
      metalness: 0.0,
    });
    const guardMat = new THREE.MeshStandardMaterial({
      color: 0xff8a3c,
      roughness: 0.7,
    });

    /* Floors 1 and 2 are the FINISHED building.  Floors 3, 4 and 5
     * are the under-construction zone above it, separated by a
     * structural slab (the construction deck). */
    const BOUNDARY_FLOORS = 2; // # of completed storeys
    const BOUNDARY_Y = BOUNDARY_FLOORS * STORY_H;

    const frameGroup = new THREE.Group();
    scene.add(frameGroup);

    /* ── 1.  Foundation podium ────────────────────────────────── */
    const podium = new THREE.Mesh(
      new THREE.BoxGeometry(BLDG_W + 0.7, 0.4, BLDG_D + 0.7),
      podiumMat,
    );
    podium.position.set(0, 0.2, 0);
    podium.castShadow = true;
    podium.receiveShadow = true;
    frameGroup.add(podium);

    /* ── 2.  Steel columns rising the FULL height ────────────── */
    function makeColumn(x: number, z: number, faint: boolean) {
      const geo = new THREE.BoxGeometry(COL_SIZE, BLDG_H, COL_SIZE);
      const mesh = new THREE.Mesh(geo, faint ? faintMat : steelMat);
      mesh.position.set(x, BLDG_H / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      frameGroup.add(mesh);
    }
    for (let i = 0; i <= BAYS_X; i++) {
      for (let k = 0; k <= BAYS_Z; k++) {
        const isFront = k === 0;
        const isRight = i === BAYS_X;
        const isCorner = i === 0 && k === BAYS_Z;
        const visible = isFront || isRight || isCorner;
        makeColumn(X0 + i * BAY_W, Z0 + k * BAY_D, !visible);
      }
    }

    /* ── 3.  Beams at every floor level ───────────────────────
     *  Track which beams are AI-modified for raycasting / FX.
     *  In the new layout, the AI is reinforcing 3 beams on the
     *  upper construction zone: the FRONT-FACE beams at floors
     *  3, 4 and 5 (the three storeys still being built). */
    function beamX(y: number, z: number, faint: boolean): THREE.Mesh {
      const geo = new THREE.BoxGeometry(BLDG_W, BEAM_SIZE, BEAM_SIZE);
      const mesh = new THREE.Mesh(geo, faint ? faintMat : steelMat);
      mesh.position.set(0, y, z);
      mesh.castShadow = true;
      frameGroup.add(mesh);
      return mesh;
    }
    function beamZ(x: number, y: number, faint: boolean): THREE.Mesh {
      const geo = new THREE.BoxGeometry(BEAM_SIZE, BEAM_SIZE, BLDG_D);
      const mesh = new THREE.Mesh(geo, faint ? faintMat : steelMat);
      mesh.position.set(x, y, 0);
      mesh.castShadow = true;
      frameGroup.add(mesh);
      return mesh;
    }
    const modifiedBeamMeshes: THREE.Mesh[] = [];
    for (let f = 1; f <= STORIES; f++) {
      const y = f * STORY_H;
      for (let k = 0; k <= BAYS_Z; k++) {
        beamX(y, Z0 + k * BAY_D, k === 0);
      }
      for (let i = 0; i <= BAYS_X; i++) {
        const m = beamZ(X0 + i * BAY_W, y, i === 0);
        if (f >= BOUNDARY_FLOORS + 2 && i === BAYS_X) modifiedBeamMeshes.push(m);
      }
    }

    /* ── 4.  COMPLETED building (floors 1 & 2) ────────────────
     *  Solid concrete floor slabs + glass curtain wall on every
     *  face, with horizontal/vertical mullions framing the glass
     *  at every column line and at each floor break.  This is the
     *  obviously-finished shell beneath the construction zone. */

    // Concrete floor slabs on completed floors
    for (let f = 1; f <= BOUNDARY_FLOORS; f++) {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(BLDG_W + 0.4, 0.18, BLDG_D + 0.4),
        concreteMat,
      );
      slab.position.set(0, f * STORY_H - 0.09, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      frameGroup.add(slab);
    }

    // Concrete spandrel band at the top of each finished floor
    // (the visible concrete strip between the windows)
    const spandrelH = 0.55;
    function makeSpandrel(
      width: number,
      depth: number,
      pos: THREE.Vector3,
    ) {
      const sp = new THREE.Mesh(
        new THREE.BoxGeometry(width, spandrelH, depth),
        spandrelMat,
      );
      sp.position.copy(pos);
      sp.castShadow = true;
      sp.receiveShadow = true;
      frameGroup.add(sp);
    }
    for (let f = 1; f <= BOUNDARY_FLOORS; f++) {
      const yTop = f * STORY_H;
      const spY = yTop - 0.45;
      // Front + rear spandrels (run along x)
      makeSpandrel(
        BLDG_W + 0.3,
        0.2,
        new THREE.Vector3(0, spY, Z0),
      );
      makeSpandrel(
        BLDG_W + 0.3,
        0.2,
        new THREE.Vector3(0, spY, Z0 + BLDG_D),
      );
      // Left + right spandrels (run along z)
      makeSpandrel(
        0.2,
        BLDG_D - 0.05,
        new THREE.Vector3(X0, spY, 0),
      );
      makeSpandrel(
        0.2,
        BLDG_D - 0.05,
        new THREE.Vector3(X0 + BLDG_W, spY, 0),
      );
    }

    // Glass curtain wall — one panel per face per finished floor.
    // Sits between the floor slab below and the spandrel above,
    // recessed slightly so the slab/spandrel read as projecting.
    const glassH = STORY_H - 0.55 - 0.18; // story – spandrel – slab
    function makeGlass(
      width: number,
      depth: number,
      pos: THREE.Vector3,
    ) {
      const gl = new THREE.Mesh(
        new THREE.BoxGeometry(width, glassH, depth),
        glassMat,
      );
      gl.position.copy(pos);
      gl.receiveShadow = true;
      frameGroup.add(gl);
    }
    for (let f = 1; f <= BOUNDARY_FLOORS; f++) {
      const slabTop = (f - 1) * STORY_H + 0.09;
      const glassY = slabTop + glassH / 2;
      // Front
      makeGlass(BLDG_W - 0.1, 0.06, new THREE.Vector3(0, glassY, Z0));
      // Rear
      makeGlass(
        BLDG_W - 0.1,
        0.06,
        new THREE.Vector3(0, glassY, Z0 + BLDG_D),
      );
      // Left
      makeGlass(
        0.06,
        BLDG_D - 0.1,
        new THREE.Vector3(X0, glassY, 0),
      );
      // Right
      makeGlass(
        0.06,
        BLDG_D - 0.1,
        new THREE.Vector3(X0 + BLDG_W, glassY, 0),
      );
    }

    // Vertical mullions at every column line on every face,
    // running floor-1 floor-level → boundary deck.
    function makeMullion(
      pos: THREE.Vector3,
      face: 'x' | 'z',
    ) {
      const w = face === 'x' ? 0.08 : 0.16;
      const d = face === 'x' ? 0.16 : 0.08;
      const mu = new THREE.Mesh(
        new THREE.BoxGeometry(w, BOUNDARY_Y - 0.18, d),
        mullionMat,
      );
      mu.position.copy(pos);
      mu.position.y = BOUNDARY_Y / 2 + 0.09;
      frameGroup.add(mu);
    }
    for (let i = 0; i <= BAYS_X; i++) {
      const x = X0 + i * BAY_W;
      makeMullion(new THREE.Vector3(x, 0, Z0), 'z'); // front face
      makeMullion(new THREE.Vector3(x, 0, Z0 + BLDG_D), 'z'); // rear face
    }
    for (let k = 0; k <= BAYS_Z; k++) {
      const z = Z0 + k * BAY_D;
      makeMullion(new THREE.Vector3(X0, 0, z), 'x'); // left face
      makeMullion(new THREE.Vector3(X0 + BLDG_W, 0, z), 'x'); // right face
    }

    /* ── 5.  CONSTRUCTION DECK at the boundary (top of floor 2) ──
     *  Slightly thicker, slightly oversized slab — reads as the
     *  hand-off between the finished envelope below and the bare
     *  steel skeleton above. */
    const deckSlab = new THREE.Mesh(
      new THREE.BoxGeometry(BLDG_W + 0.6, 0.3, BLDG_D + 0.6),
      concreteMat,
    );
    deckSlab.position.set(0, BOUNDARY_Y - 0.15, 0);
    deckSlab.castShadow = true;
    deckSlab.receiveShadow = true;
    frameGroup.add(deckSlab);

    /* ── 6.  Safety railing around the construction deck ─────── */
    const guardYBase = BOUNDARY_Y;
    const guardOffset = 0.05;
    function makeGuardRail(
      length: number,
      orientation: 'x' | 'z',
      pos: THREE.Vector3,
    ) {
      const w = orientation === 'x' ? length : 0.04;
      const d = orientation === 'x' ? 0.04 : length;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.05, d),
        guardMat,
      );
      top.position.copy(pos);
      top.position.y = guardYBase + 1.05;
      frameGroup.add(top);
      const mid = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.05, d),
        guardMat,
      );
      mid.position.copy(pos);
      mid.position.y = guardYBase + 0.55;
      frameGroup.add(mid);
    }
    // Top rails on all 4 sides
    makeGuardRail(
      BLDG_W + 0.6,
      'x',
      new THREE.Vector3(0, 0, Z0 - guardOffset),
    );
    makeGuardRail(
      BLDG_W + 0.6,
      'x',
      new THREE.Vector3(0, 0, Z0 + BLDG_D + guardOffset),
    );
    makeGuardRail(
      BLDG_D + 0.6,
      'z',
      new THREE.Vector3(X0 - guardOffset, 0, 0),
    );
    makeGuardRail(
      BLDG_D + 0.6,
      'z',
      new THREE.Vector3(X0 + BLDG_W + guardOffset, 0, 0),
    );
    // Posts at every column line on the perimeter
    for (let i = 0; i <= BAYS_X; i++) {
      const x = X0 + i * BAY_W;
      for (const z of [Z0 - guardOffset, Z0 + BLDG_D + guardOffset]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 1.1, 0.05),
          guardMat,
        );
        post.position.set(x, guardYBase + 0.55, z);
        post.castShadow = true;
        frameGroup.add(post);
      }
    }
    for (let k = 0; k <= BAYS_Z; k++) {
      const z = Z0 + k * BAY_D;
      for (const x of [X0 - guardOffset, X0 + BLDG_W + guardOffset]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 1.1, 0.05),
          guardMat,
        );
        post.position.set(x, guardYBase + 0.55, z);
        post.castShadow = true;
        frameGroup.add(post);
      }
    }

    /* ── 7.  Construction-in-progress on floor 3 ──────────────
     *  Left half is poured concrete deck.  Right half is exposed
     *  rebar mat awaiting the next pour.  A wooden form holds the
     *  live edge of the pour, with rebar protrusions sticking up. */
    const wipFloor = BOUNDARY_FLOORS + 1; // floor 3
    const wipY = wipFloor * STORY_H;

    const wipDeckMat = new THREE.MeshLambertMaterial({ color: 0x8c9097 });
    const partialDeck = new THREE.Mesh(
      new THREE.BoxGeometry(BLDG_W * 0.55, 0.12, BLDG_D + 0.3),
      wipDeckMat,
    );
    partialDeck.position.set(-BLDG_W * 0.225, wipY - 0.06, 0);
    partialDeck.castShadow = true;
    partialDeck.receiveShadow = true;
    frameGroup.add(partialDeck);

    // Wooden edge formwork at the live edge of the pour
    const wipEdge = -BLDG_W / 2 + BLDG_W * 0.55;
    const formwork = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.3, BLDG_D + 0.3),
      formworkMat,
    );
    formwork.position.set(wipEdge, wipY + 0.06, 0);
    formwork.castShadow = true;
    frameGroup.add(formwork);

    // Vertical rebar protrusions just past the formwork
    for (let r = 0; r < 6; r++) {
      const rebar = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.55, 0.06),
        rebarMat,
      );
      rebar.position.set(
        wipEdge + 0.4,
        wipY + 0.18,
        Z0 + 1 + r * (BLDG_D / 6),
      );
      rebar.castShadow = true;
      frameGroup.add(rebar);
    }

    // Horizontal rebar mat on the un-poured right side
    const wipDeckLength = BLDG_W / 2 - wipEdge;
    const wipDeckCenterX = (wipEdge + BLDG_W / 2) / 2;
    const rebarY = wipY + 0.04;
    for (let r = 0; r < 8; r++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(wipDeckLength + 0.4, 0.04, 0.04),
        rebarMat,
      );
      bar.position.set(
        wipDeckCenterX,
        rebarY,
        Z0 + 0.4 + r * ((BLDG_D - 0.8) / 7),
      );
      frameGroup.add(bar);
    }
    const transverseCount = Math.max(3, Math.round(wipDeckLength / 1.1));
    for (let r = 0; r < transverseCount; r++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, BLDG_D - 0.4),
        rebarMat,
      );
      const tx = wipEdge + (wipDeckLength * (r + 0.5)) / transverseCount;
      bar.position.set(tx, rebarY + 0.05, 0);
      frameGroup.add(bar);
    }

    /* ── 8.  Construction site surroundings ─────────────────────────
     *  Heavy equipment, material stockpiles, site facilities, safety
     *  perimeter and landscaping — composed from primitive geometry
     *  so the building reads as part of an active jobsite. */
    addSiteSurroundings(scene);

    /* ── AI-modified beams — solid neon border outline ──────────────
     *  Each modified beam gets four steady cyan border lines (the
     *  long edges of the beam, screen-space anti-aliased) wrapped
     *  tight to the steel.  Lines fade to invisible when the user
     *  accepts. */

    const INFLATE = 0.04;
    const beamYs: number[] = [];
    for (let f = BOUNDARY_FLOORS + 2; f <= STORIES; f++) {
      beamYs.push(f * STORY_H);
    }
    const aiBeamX = X0 + BAYS_X * BAY_W; // +x face

    /* Geometry: only the FOUR long edges of a unit cube along the
     * z-axis (the beam's length axis), so the outline traces just
     * the beam's borders without drawing end-cap rectangles that
     * would overlap the corner columns. */
    const longBorderEdges = [
      // bottom-front edge (x = -0.5, y = -0.5)
      -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,
      // bottom-back  edge (x = +0.5, y = -0.5)
       0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
      // top-front    edge (x = -0.5, y = +0.5)
      -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,
      // top-back     edge (x = +0.5, y = +0.5)
       0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
    ];
    const borderEdgeGeometry = new LineSegmentsGeometry();
    borderEdgeGeometry.setPositions(longBorderEdges);

    const neonGroup = new THREE.Group();
    scene.add(neonGroup);
    const solidMaterials: LineMaterial[] = [];

    for (const y of beamYs) {
      const mat = new LineMaterial({
        color: AI_ACCENT_NUM,
        linewidth: 3.0, // pixels (screen-space)
        transparent: true,
        opacity: 1.0,
        depthTest: true,
        worldUnits: false,
        dashed: false,
      });
      mat.resolution.set(W, H);
      solidMaterials.push(mat);

      const outline = new LineSegments2(borderEdgeGeometry, mat);
      outline.scale.set(
        BEAM_SIZE + INFLATE,
        BEAM_SIZE + INFLATE,
        BLDG_D + INFLATE,
      );
      outline.position.set(aiBeamX, y, 0);
      outline.renderOrder = 5;
      neonGroup.add(outline);
    }

    /* ── Raycaster — click on a modified beam to toggle the card ── */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const dragMonitor = { downX: 0, downY: 0, dragging: false };

    function setNDCFromEvent(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    /** Raycast against modified beams and return the first hit (mesh +
     *  its index in modifiedBeamMeshes) or null when nothing is hit.
     *  Returning the actual hit lets us anchor the card to the *specific*
     *  beam the user clicked instead of a fixed centroid. */
    function hitsModifiedBeam():
      | { mesh: THREE.Mesh; idx: number }
      | null {
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(modifiedBeamMeshes, false);
      if (hits.length === 0) return null;
      const mesh = hits[0].object as THREE.Mesh;
      const idx = modifiedBeamMeshes.indexOf(mesh);
      return { mesh, idx };
    }

    function onPointerDown(event: PointerEvent) {
      dragMonitor.downX = event.clientX;
      dragMonitor.downY = event.clientY;
      dragMonitor.dragging = false;
    }
    function onPointerMove(event: PointerEvent) {
      // Distinguish a click from an OrbitControls drag.
      if (event.buttons !== 0) {
        const dx = event.clientX - dragMonitor.downX;
        const dy = event.clientY - dragMonitor.downY;
        if (dx * dx + dy * dy > 25) dragMonitor.dragging = true;
      }
      if (acceptedRef.current) {
        renderer.domElement.style.cursor = '';
        return;
      }
      setNDCFromEvent(event);
      renderer.domElement.style.cursor =
        hitsModifiedBeam() != null ? 'pointer' : '';
    }
    function onPointerUp(event: PointerEvent) {
      if (dragMonitor.dragging) return;
      if (acceptedRef.current) return;
      setNDCFromEvent(event);
      const hit = hitsModifiedBeam();
      if (!hit) return;

      if (activeBeamIdxRef.current === hit.idx) {
        // Re-clicking the active beam closes the card.
        activeBeamIdxRef.current = -1;
        setOpen(false);
      } else {
        // Move the anchor to the clicked beam's world centroid so the
        // connector line and card pop up right next to that beam.
        hit.mesh.getWorldPosition(anchorRef.current);
        activeBeamIdxRef.current = hit.idx;
        setOpen(true);
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    /* ── Card / line projection ───────────────────────────────────
     *  Project the centroid anchor every frame; place the card
     *  next to its screen position (right side preferred, left if
     *  no room, otherwise clamped vertically) and rewrite the SVG
     *  line endpoints from anchor → card centre. */
    const tmp = new THREE.Vector3();
    function updateOverlay() {
      const card = cardWrapRef.current;
      const line = lineRef.current;
      if (!card) return;

      tmp.copy(anchorRef.current).project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * W;
      const sy = (-tmp.y * 0.5 + 0.5) * H;

      const cardW = card.offsetWidth || CARD_WIDTH;
      const cardH = card.offsetHeight || 360;

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

      const cardLeftPx = Math.round(cardLeft);
      const cardTopPx = Math.round(cardTop);
      card.style.transform = `translate3d(${cardLeftPx}px, ${cardTopPx}px, 0)`;

      if (line) {
        const cx = cardLeftPx + cardW / 2;
        const cy = cardTopPx + cardH / 2;
        line.setAttribute('x1', String(Math.round(sx)));
        line.setAttribute('y1', String(Math.round(sy)));
        line.setAttribute('x2', String(Math.round(cx)));
        line.setAttribute('y2', String(Math.round(cy)));
      }
    }

    /* ── Animation loop ───────────────────────────────────────── */
    let frameId = 0;

    function animate() {
      frameId = requestAnimationFrame(animate);

      controls.update();

      const acceptedNow = acceptedRef.current;

      /* Solid neon outline — fade opacity to 0 once accepted. */
      solidMaterials.forEach((mat) => {
        const target = acceptedNow ? 0 : 0.95;
        mat.opacity += (target - mat.opacity) * 0.10;
        mat.visible = mat.opacity > 0.02;
      });

      updateOverlay();
      renderer.render(scene, camera);
    }
    frameId = requestAnimationFrame(animate);

    /* ── Resize ───────────────────────────────────────────────── */
    function onResize() {
      W = mount!.clientWidth;
      H = mount!.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      // Screen-space LineMaterial needs the latest viewport size to
      // keep the linewidth at a constant pixel thickness.
      solidMaterials.forEach((mat) => mat.resolution.set(W, H));
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      scene.remove(neonGroup);
      solidMaterials.forEach((m) => m.dispose());
      borderEdgeGeometry.dispose();
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

      {/* SVG connector line — only visible when the card is open */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
          opacity: open && !accepted ? 1 : 0,
          transition: 'opacity 0.18s ease',
        }}
      >
        <line
          ref={lineRef}
          stroke={TOKEN_AI_ACCENT}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="4 4"
          opacity={0.85}
          shapeRendering="geometricPrecision"
        />
      </svg>

      {/* AI changes card — positioned next to the modified beams' centroid via updateOverlay */}
      <div
        ref={cardWrapRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 10,
          width: CARD_WIDTH,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
          willChange: 'transform',
        }}
      >
        <div
          className="pro6-card-glow"
          style={{
            background: TRIMBLE_RAINBOW,
            backgroundSize: '200% 200%',
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
            {/* Header meta row — sparkle/accepted icon on the left,
             *  count badge on the right. Lives in its own row so the
             *  title beneath it can sit flush against the card's left
             *  padding (aligning with the description paragraph). */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 6,
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
                2 beams
              </span>
            </div>

            {/* Title — flush left so it aligns with the description. */}
            <div
              style={{
                fontSize: 'var(--modus-wc-font-size-md, 14px)',
                fontWeight: 700,
                color: TOKEN_TEXT,
                lineHeight: '20px',
                marginBottom: 8,
              }}
            >
              {accepted ? 'Changes accepted' : 'Reinforced perimeter beams'}
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
                ? '2 perimeter beams at the top of the structure were upsized to W14×38 sections.'
                : 'AI upsized 2 perimeter beams at the top of the structure (floors 4-5) to W14×38 sections to satisfy the lateral seismic check.'}
            </p>

            {/* Actions — both buttons share the card's full width 50/50,
             *  with Reject (grey) on the left and primary Accept Changes
             *  on the right. */}
            {!accepted ? (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ModusWcButton
                    size="md"
                    customClass="pro6-reject-grey"
                    style={{ width: '100%' }}
                    onButtonClick={() => {
                      // Detach the card from any specific beam so the
                      // next click on a beam (even the same one)
                      // re-opens it at that beam's position.
                      activeBeamIdxRef.current = -1;
                      setOpen(false);
                    }}
                  >
                    Reject
                  </ModusWcButton>
                </div>
                <div className="flex-1">
                  <ModusWcButton
                    size="md"
                    color="primary"
                    style={{ width: '100%' }}
                    onButtonClick={() => setAccepted(true)}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <ModusWcIcon name="check" size="sm" decorative />
                      Accept Changes
                    </span>
                  </ModusWcButton>
                </div>
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
