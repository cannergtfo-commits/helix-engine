export type SimBody = {
  id: string;
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  half: { x: number; y: number; z: number };
  isStatic: boolean;
  restitution: number;
  friction: number;
  grounded: boolean;
  /** Player body: origin sits on the feet, center is half.y above the root. */
  feet: boolean;
};

type Axis = "x" | "y" | "z";

export function integrate(bodies: SimBody[], gravity: number, dt: number) {
  for (const body of bodies) {
    if (body.isStatic) continue;
    body.vel.y -= gravity * dt;
    body.pos.x += body.vel.x * dt;
    body.pos.y += body.vel.y * dt;
    body.pos.z += body.vel.z * dt;
    body.grounded = false;
  }

  for (let iter = 0; iter < 4; iter += 1) {
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        const left = bodies[i];
        const right = bodies[j];
        if (left && right) resolve(left, right);
      }
    }
  }

  for (const body of bodies) {
    if (body.isStatic || body.feet || !body.grounded) continue;
    const damp = Math.exp(-body.friction * 4 * dt);
    body.vel.x *= damp;
    body.vel.z *= damp;
  }
}

function resolve(a: SimBody, b: SimBody) {
  if (a.isStatic && b.isStatic) return;
  const dx = a.half.x + b.half.x - Math.abs(a.pos.x - b.pos.x);
  const dy = a.half.y + b.half.y - Math.abs(a.pos.y - b.pos.y);
  const dz = a.half.z + b.half.z - Math.abs(a.pos.z - b.pos.z);
  if (dx <= 0 || dy <= 0 || dz <= 0) return;

  let axis: Axis = "x";
  let pen = dx;
  if (dy < pen) {
    axis = "y";
    pen = dy;
  }
  if (dz < pen) {
    axis = "z";
    pen = dz;
  }
  if (pen < 0.001) return;

  const delta = a.pos[axis] - b.pos[axis];
  const sign = delta === 0 ? 1 : Math.sign(delta);
  const invA = a.isStatic ? 0 : 1;
  const invB = b.isStatic ? 0 : 1;
  const inv = invA + invB;
  if (inv === 0) return;
  const push = pen / inv;

  if (!a.isStatic) {
    a.pos[axis] += sign * push;
    bounce(a, axis, sign);
  }
  if (!b.isStatic) {
    b.pos[axis] -= sign * push;
    bounce(b, axis, -sign);
  }
}

function bounce(body: SimBody, axis: Axis, pushDir: number) {
  const velocity = body.vel[axis];
  if (velocity * pushDir < 0) {
    body.vel[axis] = -velocity * body.restitution;
    if (Math.abs(body.vel[axis]) < 0.35) body.vel[axis] = 0;
  }
  if (axis === "y" && pushDir > 0) body.grounded = true;
}
