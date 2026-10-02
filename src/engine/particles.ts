import * as THREE from "three";
import type { EmitterKind } from "./types";

export type Spray = {
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  life: Float32Array;
  span: Float32Array;
  count: number;
  kind: EmitterKind;
};

let sprite: THREE.CanvasTexture | null = null;

function dotTexture() {
  if (sprite) return sprite;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  sprite = new THREE.CanvasTexture(canvas);
  return sprite;
}

function unit(n: number) {
  const x = Math.sin(n * 127.1 + 19.2) * 43758.5453;
  return x - Math.floor(x);
}

export function mountEmitter(kind: EmitterKind, color: string, rate: number, size: number): Spray {
  const count = Math.max(24, Math.min(180, Math.round(rate)));
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const span = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    life[i] = unit(i + 3) * 0.2;
    span[i] = 0.45 + unit(i + 8) * 0.9;
    respawn(i, positions, velocities, kind, span[i]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    map: dotTexture() ?? undefined,
    size,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.raycast = () => undefined;
  return { points, positions, velocities, life, span, count, kind };
}

function respawn(i: number, positions: Float32Array, velocities: Float32Array, kind: EmitterKind, span: number) {
  const a = unit(i + span * 13);
  const b = unit(i * 1.7 + 2);
  positions[i * 3] = (a - 0.5) * 0.18;
  positions[i * 3 + 1] = 0.35;
  positions[i * 3 + 2] = (b - 0.5) * 0.18;
  if (kind === "fire") {
    velocities[i * 3] = (a - 0.5) * 0.35;
    velocities[i * 3 + 1] = 0.8 + b * 1.3;
    velocities[i * 3 + 2] = (b - 0.5) * 0.35;
  } else if (kind === "sparks") {
    velocities[i * 3] = (a - 0.5) * 2.2;
    velocities[i * 3 + 1] = 1.4 + b * 2.4;
    velocities[i * 3 + 2] = (unit(i + 4) - 0.5) * 2.2;
  } else if (kind === "mist") {
    velocities[i * 3] = (a - 0.5) * 0.45;
    velocities[i * 3 + 1] = 0.15 + b * 0.25;
    velocities[i * 3 + 2] = (b - 0.5) * 0.45;
  } else {
    velocities[i * 3] = Math.cos(a * Math.PI * 2) * 0.55;
    velocities[i * 3 + 1] = 0.45 + b * 0.7;
    velocities[i * 3 + 2] = Math.sin(a * Math.PI * 2) * 0.55;
  }
}

export function stepEmitter(spray: Spray, dt: number, time: number) {
  const { positions, velocities, life, span, count, kind } = spray;
  const lift = kind === "sparks" ? -1.6 : kind === "mist" ? 0.05 : kind === "magic" ? 0.15 : 0.35;
  for (let i = 0; i < count; i += 1) {
    life[i] -= dt;
    if (life[i] <= 0) {
      life[i] = span[i];
      respawn(i, positions, velocities, kind, span[i] + time);
      continue;
    }
    velocities[i * 3 + 1] += lift * dt;
    if (kind === "magic") {
      const spin = time * 2.2 + i;
      positions[i * 3] += Math.cos(spin) * dt * 0.35;
      positions[i * 3 + 2] += Math.sin(spin) * dt * 0.35;
    }
    positions[i * 3] += velocities[i * 3] * dt;
    positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
    positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
  }
  const attr = spray.points.geometry.getAttribute("position") as THREE.BufferAttribute;
  attr.needsUpdate = true;
}
