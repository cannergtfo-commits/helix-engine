import * as THREE from "three";

export type FinishName = "brick" | "wood" | "drywall" | "concrete" | "roofing" | "glass" | "lot";

type Maps = { color: THREE.CanvasTexture; normal: THREE.CanvasTexture; rough: THREE.CanvasTexture };

const cache = new Map<FinishName, Maps>();

const LOOK: Record<FinishName, { metal: number; rough: number; normal: number; env: number; glass?: boolean }> = {
  brick: { metal: 0.02, rough: 0.82, normal: 0.7, env: 0.35 },
  wood: { metal: 0.04, rough: 0.68, normal: 0.45, env: 0.25 },
  drywall: { metal: 0.01, rough: 0.92, normal: 0.15, env: 0.12 },
  concrete: { metal: 0.03, rough: 0.9, normal: 0.35, env: 0.18 },
  roofing: { metal: 0.12, rough: 0.62, normal: 0.55, env: 0.4 },
  glass: { metal: 0.04, rough: 0.08, normal: 0.05, env: 1.15, glass: true },
  lot: { metal: 0.04, rough: 0.94, normal: 0.4, env: 0.2 },
};

export function finishMaterial(name: FinishName, repeat: "wall" | "flat"): THREE.MeshStandardMaterial {
  const maps = library(name);
  const look = LOOK[name];
  const color = maps.color.clone();
  const normal = maps.normal.clone();
  const rough = maps.rough.clone();
  for (const map of [color, normal, rough]) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, 1);
  }
  color.colorSpace = THREE.SRGBColorSpace;
  const material = look.glass
    ? new THREE.MeshPhysicalMaterial({
        map: color,
        normalMap: normal,
        roughnessMap: rough,
        color: "#d5dee6",
        metalness: look.metal,
        roughness: look.rough,
        transmission: 0.72,
        thickness: 0.08,
        ior: 1.5,
        transparent: true,
        envMapIntensity: look.env,
      })
    : new THREE.MeshStandardMaterial({
        map: color,
        normalMap: normal,
        roughnessMap: rough,
        metalness: look.metal,
        roughness: look.rough,
        envMapIntensity: look.env,
      });
  material.normalScale.set(look.normal, look.normal);
  material.userData.finish = true;
  material.userData.repeat = repeat;
  return material;
}

export function tuneRepeat(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const material = obj.material;
    if (!(material instanceof THREE.MeshStandardMaterial) || material.userData.finish !== true) return;
    const scale = root.scale;
    const across = Math.max(0.25, scale.x);
    const down = material.userData.repeat === "flat" ? Math.max(0.25, scale.z) : Math.max(0.25, scale.y);
    for (const map of [material.map, material.normalMap, material.roughnessMap]) {
      if (!map) continue;
      map.repeat.set(across, down);
    }
  });
}

export function duskEnvironment(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const sky = ctx.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, "#141a28");
  sky.addColorStop(0.42, "#3d4b60");
  sky.addColorStop(0.52, "#e0a15a");
  sky.addColorStop(0.62, "#6a4630");
  sky.addColorStop(1, "#12110e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 256);
  const sun = ctx.createRadialGradient(380, 128, 2, 380, 128, 36);
  sun.addColorStop(0, "#fff1d4");
  sun.addColorStop(1, "rgba(255,241,212,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 512, 256);
  const equirect = new THREE.CanvasTexture(canvas);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(equirect);
  pmrem.dispose();
  equirect.dispose();
  return target.texture;
}

function library(name: FinishName) {
  const cached = cache.get(name);
  if (cached) return cached;
  const size = 256;
  const color = document.createElement("canvas");
  color.width = size;
  color.height = size;
  const rough = document.createElement("canvas");
  rough.width = size;
  rough.height = size;
  const c = color.getContext("2d");
  const r = rough.getContext("2d");
  if (!c || !r) throw new Error("canvas");
  draw(name, c, r, size);
  const height = luminance(c, size, name === "brick" || name === "roofing");
  const maps = {
    color: new THREE.CanvasTexture(color),
    normal: new THREE.CanvasTexture(normalFrom(height, size, name === "drywall" ? 0.6 : 1.6)),
    rough: new THREE.CanvasTexture(rough),
  };
  cache.set(name, maps);
  return maps;
}

function draw(name: FinishName, c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number) {
  if (name === "brick") return bricks(c, r, size);
  if (name === "wood") return planks(c, r, size, "#8a6244", "#5c3e2a");
  if (name === "roofing") return shingles(c, r, size);
  if (name === "drywall") return plaster(c, r, size, "#d7d1c6", 18);
  if (name === "glass") return plaster(c, r, size, "#d5dee6", 8);
  if (name === "lot") return grit(c, r, size, "#2a2d33", "#1a1c20");
  return grit(c, r, size, "#8d8a84", "#6e6b66");
}

function bricks(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number) {
  c.fillStyle = "#c8b7a4";
  r.fillStyle = "#d0d0d0";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  const rows = 8;
  const bh = size / rows;
  const bw = size / 4;
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 ? bw / 2 : 0;
    for (let col = -1; col < 6; col++) {
      const shade = 90 + ((row * 5 + col * 3) % 5) * 8;
      c.fillStyle = `rgb(${shade + 40}, ${shade * 0.42}, ${shade * 0.32})`;
      r.fillStyle = "#8a8a8a";
      const x = col * bw + offset + 1;
      const y = row * bh + 1;
      c.fillRect(x, y, bw - 2, bh - 2);
      r.fillRect(x, y, bw - 2, bh - 2);
    }
  }
}

function planks(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, seam: string) {
  c.fillStyle = face;
  r.fillStyle = "#9a9a9a";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  const boards = 6;
  for (let i = 0; i < boards; i++) {
    const y = (i * size) / boards;
    c.fillStyle = seam;
    r.fillStyle = "#e4e4e4";
    c.fillRect(0, y, size, 2);
    r.fillRect(0, y, size, 2);
    c.strokeStyle = "rgba(40,22,12,0.25)";
    for (let g = 0; g < 4; g++) {
      c.beginPath();
      c.moveTo(0, y + 6 + g * 8);
      c.lineTo(size, y + 8 + g * 8);
      c.stroke();
    }
  }
}

function shingles(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number) {
  c.fillStyle = "#2e3238";
  r.fillStyle = "#7a7a7a";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  const rows = 8;
  const rh = size / rows;
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 ? size / 8 : 0;
    for (let col = -1; col < 5; col++) {
      c.fillStyle = row % 2 ? "#3a3e46" : "#32363c";
      c.fillRect(col * (size / 4) + offset, row * rh, size / 4 - 2, rh - 2);
      c.strokeStyle = "#1c1e22";
      c.strokeRect(col * (size / 4) + offset, row * rh, size / 4 - 2, rh - 2);
    }
  }
}

function plaster(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, color: string, grain: number) {
  c.fillStyle = color;
  r.fillStyle = "#bdbdbd";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  for (let i = 0; i < grain * 40; i++) {
    const x = (i * 47) % size;
    const y = (i * 91) % size;
    c.fillStyle = `rgba(80,70,60,${0.04 + (i % 5) * 0.02})`;
    c.fillRect(x, y, 2, 2);
  }
}

function grit(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, size: number, face: string, pit: string) {
  c.fillStyle = face;
  r.fillStyle = "#a3a3a3";
  c.fillRect(0, 0, size, size);
  r.fillRect(0, 0, size, size);
  for (let i = 0; i < 700; i++) {
    const x = (i * 53) % size;
    const y = (i * 97) % size;
    c.fillStyle = i % 3 ? pit : "rgba(232,165,75,0.08)";
    r.fillStyle = i % 4 ? "#cfcfcf" : "#8d8d8d";
    c.fillRect(x, y, 2, 2);
    r.fillRect(x, y, 2, 2);
  }
}

function luminance(ctx: CanvasRenderingContext2D, size: number, invert: boolean) {
  const data = ctx.getImageData(0, 0, size, size).data;
  const height = new Float32Array(size * size);
  for (let i = 0; i < height.length; i++) {
    const tone = data[i * 4] * 0.3 + data[i * 4 + 1] * 0.5 + data[i * 4 + 2] * 0.2;
    height[i] = invert ? 255 - tone : tone;
  }
  return height;
}

function normalFrom(height: Float32Array, size: number, strength: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const image = ctx.createImageData(size, size);
  const at = (x: number, y: number) => height[(((y + size) % size) * size + ((x + size) % size))];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) / 255;
      const dy = (at(x, y - 1) - at(x, y + 1)) / 255;
      const i = (y * size + x) * 4;
      image.data[i] = Math.max(0, Math.min(255, (dx * strength * 0.5 + 0.5) * 255));
      image.data[i + 1] = Math.max(0, Math.min(255, (dy * strength * 0.5 + 0.5) * 255));
      image.data[i + 2] = 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
