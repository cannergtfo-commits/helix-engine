import * as THREE from "three";
import type { AnimClip, CharacterKit } from "./types";

export type CharacterRig = {
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  hipBase: number;
};

type Built = {
  group: THREE.Group;
  rig: CharacterRig;
  disposables: Array<{ dispose: () => void }>;
};

export function buildCharacter(kit: CharacterKit, accent: string): Built {
  const disposables: Array<{ dispose: () => void }> = [];
  const group = new THREE.Group();
  const ink = material("#2c2a28", 0.35, 0.55, disposables);
  const cloth = material(kit === "relay" ? "#d9d3c7" : "#3a342c", 0.08, 0.78, disposables);
  const trim = material(accent, 0.72, 0.32, disposables);
  const dark = material("#17181c", 0.2, 0.6, disposables);
  const sage = material("#6e7568", 0.12, 0.7, disposables);

  const hips = new THREE.Group();
  const hipBase = kit === "relay" ? 0.94 : 0.9;
  hips.position.y = hipBase;
  group.add(hips);

  const legL = new THREE.Group();
  legL.position.x = kit === "relay" ? -0.09 : -0.12;
  hips.add(legL);
  const legR = new THREE.Group();
  legR.position.x = kit === "relay" ? 0.09 : 0.12;
  hips.add(legR);

  const torso = new THREE.Group();
  torso.position.y = 0.06;
  hips.add(torso);

  const head = new THREE.Group();
  head.position.y = kit === "relay" ? 0.5 : 0.46;
  torso.add(head);

  const armL = new THREE.Group();
  armL.position.set(kit === "relay" ? -0.22 : -0.32, 0.34, 0);
  torso.add(armL);
  const armR = new THREE.Group();
  armR.position.set(kit === "relay" ? 0.22 : 0.32, 0.34, 0);
  torso.add(armR);

  if (kit === "warden") {
    put(legL, 0.15, 0.4, 0.16, 0, -0.24, 0, cloth, disposables);
    put(legL, 0.16, 0.38, 0.18, 0, -0.62, 0.02, ink, disposables);
    put(legR, 0.15, 0.4, 0.16, 0, -0.24, 0, cloth, disposables);
    put(legR, 0.16, 0.38, 0.18, 0, -0.62, 0.02, ink, disposables);
    put(torso, 0.5, 0.4, 0.28, 0, 0.2, 0, ink, disposables);
    put(torso, 0.54, 0.08, 0.3, 0, 0.38, 0, trim, disposables, true);
    put(torso, 0.36, 0.46, 0.04, 0, 0.12, 0.16, cloth, disposables);
    put(head, 0.28, 0.24, 0.28, 0, 0.14, 0, ink, disposables);
    put(head, 0.18, 0.06, 0.04, 0, 0.12, -0.15, trim, disposables, true);
    put(armL, 0.12, 0.28, 0.12, 0, -0.16, 0, ink, disposables);
    put(armL, 0.11, 0.22, 0.12, 0, -0.38, 0, trim, disposables, true);
    put(armR, 0.12, 0.28, 0.12, 0, -0.16, 0, ink, disposables);
    put(armR, 0.11, 0.22, 0.12, 0, -0.38, 0, trim, disposables, true);
  } else {
    put(legL, 0.1, 0.46, 0.12, 0, -0.26, 0, cloth, disposables);
    put(legL, 0.11, 0.16, 0.16, 0, -0.56, 0.02, dark, disposables);
    put(legR, 0.1, 0.46, 0.12, 0, -0.26, 0, cloth, disposables);
    put(legR, 0.11, 0.16, 0.16, 0, -0.56, 0.02, dark, disposables);
    put(torso, 0.28, 0.4, 0.18, 0, 0.2, 0, cloth, disposables);
    put(torso, 0.3, 0.06, 0.2, 0, 0.08, -0.02, trim, disposables, true);
    put(torso, 0.16, 0.18, 0.1, 0.2, 0.02, 0.02, sage, disposables);
    put(head, 0.18, 0.2, 0.18, 0, 0.12, 0, cloth, disposables);
    put(head, 0.08, 0.03, 0.02, 0, 0.1, -0.1, dark, disposables);
    const hood = new THREE.ConeGeometry(0.16, 0.28, 12);
    disposables.push(hood);
    const hoodMesh = new THREE.Mesh(hood, sage);
    hoodMesh.position.set(0, 0.28, 0.02);
    hoodMesh.castShadow = true;
    head.add(hoodMesh);
    put(armL, 0.08, 0.3, 0.08, 0, -0.16, 0, cloth, disposables);
    put(armR, 0.08, 0.3, 0.08, 0, -0.16, 0, cloth, disposables);
    put(armR, 0.09, 0.1, 0.09, 0, -0.34, 0, trim, disposables, true);
  }

  return {
    group,
    disposables,
    rig: { hips, torso, head, armL, armR, legL, legR, hipBase },
  };
}

export function poseCharacter(rig: CharacterRig, clip: AnimClip, time: number) {
  const step = Math.sin(time * 6.4);
  rig.hips.rotation.set(0, 0, 0);
  rig.hips.position.y = rig.hipBase;
  rig.torso.rotation.set(0, 0, 0);
  rig.head.rotation.set(0, 0, 0);
  rig.armL.rotation.set(0.15, 0, -0.16);
  rig.armR.rotation.set(0.15, 0, 0.16);
  rig.legL.rotation.set(0, 0, 0);
  rig.legR.rotation.set(0, 0, 0);

  if (clip === "idle") {
    const breath = Math.sin(time * 1.7);
    rig.hips.position.y = rig.hipBase + breath * 0.012;
    rig.torso.rotation.x = breath * 0.025;
    rig.head.rotation.y = Math.sin(time * 0.6) * 0.12;
    rig.armL.rotation.x = 0.15 + breath * 0.04;
    rig.armR.rotation.x = 0.15 - breath * 0.03;
    return;
  }

  if (clip === "walk") {
    rig.legL.rotation.x = step * 0.7;
    rig.legR.rotation.x = -step * 0.7;
    rig.armL.rotation.x = -step * 0.55;
    rig.armR.rotation.x = step * 0.55;
    rig.hips.position.y = rig.hipBase + Math.abs(step) * 0.035;
    rig.torso.rotation.y = step * 0.08;
    rig.head.rotation.y = -step * 0.06;
    return;
  }

  if (clip === "greet" || clip === "wave") {
    const flap = Math.sin(time * (clip === "wave" ? 7 : 3.2));
    rig.armR.rotation.x = 2.45;
    rig.armR.rotation.z = 0.2 + flap * (clip === "wave" ? 0.45 : 0.18);
    rig.torso.rotation.y = -0.25;
    rig.head.rotation.y = -0.3;
    rig.hips.position.y = rig.hipBase + Math.sin(time * 2) * 0.01;
    return;
  }

  if (clip === "strike") {
    const swing = (Math.sin(time * 3.3) + 1) / 2;
    rig.armR.rotation.x = 0.3 + swing * 2.1;
    rig.armL.rotation.x = 0.6;
    rig.torso.rotation.y = (swing - 0.5) * 0.9;
    rig.hips.rotation.y = (swing - 0.5) * 0.25;
    rig.head.rotation.y = (0.5 - swing) * 0.2;
    return;
  }

  rig.torso.rotation.x = -0.62;
  rig.armL.rotation.x = 0.85;
  rig.armR.rotation.x = 0.85;
  rig.legL.rotation.x = 0.45;
  rig.legR.rotation.x = -0.25;
  rig.head.rotation.x = 0.25;
  rig.hips.position.y = rig.hipBase + Math.abs(Math.sin(time * 14)) * 0.04;
}

function material(
  color: string,
  metalness: number,
  roughness: number,
  disposables: Array<{ dispose: () => void }>,
) {
  const next = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  disposables.push(next);
  return next;
}

function put(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  surface: THREE.Material,
  disposables: Array<{ dispose: () => void }>,
  accent = false,
) {
  const geo = new THREE.BoxGeometry(w, h, d);
  disposables.push(geo);
  const mesh = new THREE.Mesh(geo, surface);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (accent) mesh.userData.accent = true;
  parent.add(mesh);
}
