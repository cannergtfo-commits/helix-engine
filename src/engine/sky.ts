import * as THREE from "three";

const vertex = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = `
  uniform float uStorm;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 zenith = mix(vec3(0.10, 0.12, 0.18), vec3(0.03, 0.04, 0.07), uStorm);
    vec3 horizon = mix(vec3(0.45, 0.32, 0.22), vec3(0.08, 0.09, 0.12), uStorm);
    vec3 color = mix(horizon, zenith, smoothstep(0.0, 0.72, h));
    vec3 moonDir = normalize(vec3(-0.35, 0.72, -0.25));
    float moon = smoothstep(0.9975, 0.9992, dot(normalize(vDir), moonDir));
    color += moon * mix(vec3(0.85, 0.88, 0.95), vec3(0.15), uStorm);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createSky() {
  const uniforms = { uStorm: { value: 0 } };
  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(80, 28, 18), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.raycast = () => undefined;
  return {
    mesh,
    setStorm(amount: number) {
      uniforms.uStorm.value = amount;
    },
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
