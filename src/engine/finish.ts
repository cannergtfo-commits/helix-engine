import * as THREE from "three";
import { PACKETS, packetById, paintPacket, type Packet } from "./packets";

export type FinishName = Packet["id"];

type Maps = { color: THREE.CanvasTexture; normal: THREE.CanvasTexture; rough: THREE.CanvasTexture };

const cache = new Map<string, Maps>();

export function finishMaterial(name: string, repeat: "wall" | "flat"): THREE.MeshStandardMaterial {
  const packet = packetById(name) ?? PACKETS[0];
  if (!packet) throw new Error("packet");
  const maps = library(packet);
  const color = maps.color.clone();
  const normal = maps.normal.clone();
  const rough = maps.rough.clone();
  for (const map of [color, normal, rough]) {
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, 1);
  }
  color.colorSpace = THREE.SRGBColorSpace;
  const material = packet.glass
    ? new THREE.MeshPhysicalMaterial({
        map: color,
        normalMap: normal,
        roughnessMap: rough,
        color: packet.color,
        metalness: packet.metal,
        roughness: packet.rough,
        transmission: 0.72,
        thickness: 0.08,
        ior: 1.5,
        transparent: true,
        envMapIntensity: packet.env,
      })
    : new THREE.MeshStandardMaterial({
        map: color,
        normalMap: normal,
        roughnessMap: rough,
        metalness: packet.metal,
        roughness: packet.rough,
        envMapIntensity: packet.env,
      });
  material.normalScale.set(packet.normal, packet.normal);
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

function library(packet: Packet) {
  const cached = cache.get(packet.id);
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
  paintPacket(packet, c, r, size);
  const height = luminance(c, size, Boolean(packet.invert));
  const maps = {
    color: new THREE.CanvasTexture(color),
    normal: new THREE.CanvasTexture(normalFrom(height, size, packet.normal < 0.25 ? 0.6 : 1.6)),
    rough: new THREE.CanvasTexture(rough),
  };
  cache.set(packet.id, maps);
  return maps;
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
