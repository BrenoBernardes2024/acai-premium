import * as THREE from "./vendor/three.module.js";
import { createBoot } from "./boot-model.js";

// Original, articulated digital athlete. Coordinates are in metres; +Z is forward.
function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function ellipsoid(parent, material, position, scale) {
  const object = mesh(
    new THREE.SphereGeometry(1, 24, 16),
    material,
    parent,
    ...position,
  );
  object.scale.set(...scale);
  return object;
}

function torsoGeometry() {
  const rings = [
    [0, 0.29, 0.19],
    [0.1, 0.31, 0.215],
    [0.27, 0.32, 0.22],
    [0.48, 0.38, 0.225],
    [0.7, 0.465, 0.245],
    [0.84, 0.48, 0.22],
    [0.94, 0.34, 0.19],
    [1.01, 0.16, 0.15],
  ];
  const positions = [],
    uv = [],
    indices = [];
  const sides = 48;
  rings.forEach(([y, width, depth], row) => {
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      positions.push(Math.cos(angle) * width, y, Math.sin(angle) * depth);
      uv.push(i / sides, row / (rings.length - 1));
      if (row < rings.length - 1 && i < sides) {
        const a = row * (sides + 1) + i,
          b = a + sides + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function jerseyGraphic(back = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#d7f65b";
  ctx.textAlign = "center";
  ctx.font = "bold 23px Arial";
  ctx.fillText(back ? "BRENO" : "KICK", 128, 39);
  ctx.font = "bold 162px Arial";
  ctx.fillText("10", 128, 192);
  ctx.font = "10px Arial";
  ctx.fillText("YOUR GAME. YOUR SIGNATURE.", 128, 229);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function curve(parent, points, radius, material) {
  const geometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    12,
    radius,
    5,
    false,
  );
  return mesh(geometry, material, parent);
}

export function createAthlete() {
  const root = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({
    color: "#667260",
    roughness: 0.46,
    metalness: 0.32,
  });
  const hair = new THREE.MeshStandardMaterial({
    color: "#121912",
    roughness: 0.83,
  });
  const kit = new THREE.MeshStandardMaterial({
    color: "#252e23",
    roughness: 0.72,
    metalness: 0.08,
  });
  const knit = new THREE.MeshStandardMaterial({
    color: "#182017",
    roughness: 0.88,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: "#d7f65b",
    roughness: 0.47,
    emissive: "#30410d",
    emissiveIntensity: 0.12,
  });
  const eye = new THREE.MeshStandardMaterial({
    color: "#1b2119",
    roughness: 0.2,
  });

  const torso = new THREE.Group();
  torso.position.y = 1.58;
  root.add(torso);
  mesh(torsoGeometry(), kit, torso);
  ellipsoid(root, kit, [0, 1.58, 0], [0.33, 0.18, 0.225]);
  mesh(
    new THREE.CylinderGeometry(0.13, 0.145, 0.19, 24),
    skin,
    torso,
    0,
    1.02,
    0,
  );
  const collar = mesh(
    new THREE.TorusGeometry(0.15, 0.018, 8, 32),
    knit,
    torso,
    0,
    1.025,
    0.01,
  );
  collar.rotation.x = Math.PI / 2;
  const crest = mesh(
    new THREE.PlaneGeometry(0.37, 0.39),
    jerseyGraphic(),
    torso,
    0,
    0.54,
    0.25,
  );
  crest.rotation.x = -0.06;
  const backCrest = mesh(
    new THREE.PlaneGeometry(0.4, 0.46),
    jerseyGraphic(true),
    torso,
    0,
    0.54,
    -0.245,
  );
  backCrest.rotation.y = Math.PI;
  for (const side of [-1, 1]) {
    curve(
      torso,
      [
        [side * 0.36, 0.24, 0.17],
        [side * 0.42, 0.5, 0.18],
        [side * 0.46, 0.73, 0.15],
      ],
      0.007,
      accent,
    );
  }

  const head = new THREE.Group();
  head.position.set(0, 1.19, 0);
  head.scale.setScalar(0.89);
  torso.add(head);
  ellipsoid(head, skin, [0, 0.17, 0.005], [0.215, 0.28, 0.23]);
  ellipsoid(head, skin, [0, 0.045, 0.07], [0.16, 0.115, 0.18]);
  const scalp = mesh(
    new THREE.SphereGeometry(0.23, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    hair,
    head,
    0,
    0.245,
    -0.02,
  );
  scalp.scale.set(1, 1, 1.06);
  for (const side of [-1, 1]) {
    ellipsoid(head, skin, [side * 0.213, 0.15, 0.002], [0.035, 0.058, 0.034]);
    ellipsoid(head, eye, [side * 0.078, 0.186, 0.221], [0.033, 0.013, 0.008]);
    curve(
      head,
      [
        [side * 0.035, 0.218, 0.216],
        [side * 0.081, 0.228, 0.216],
        [side * 0.122, 0.211, 0.194],
      ],
      0.009,
      hair,
    );
  }
  ellipsoid(head, skin, [0, 0.14, 0.242], [0.021, 0.05, 0.034]);
  curve(
    head,
    [
      [-0.057, 0.066, 0.226],
      [0, 0.061, 0.244],
      [0.057, 0.066, 0.226],
    ],
    0.007,
    eye,
  );
  for (let i = -2; i <= 2; i++) {
    curve(
      head,
      [
        [i * 0.034, 0.324, 0.151],
        [i * 0.037, 0.387, 0.045],
        [i * 0.03, 0.33, -0.16],
      ],
      0.006,
      hair,
    );
  }

  const shoulders = {},
    elbows = {},
    hips = {},
    knees = {},
    ankles = {};
  for (const [name, side] of [
    ["left", -1],
    ["right", 1],
  ]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.46, 0.79, 0);
    torso.add(shoulder);
    shoulders[name] = shoulder;
    mesh(
      new THREE.CapsuleGeometry(0.14, 0.35, 6, 16),
      skin,
      shoulder,
      0,
      -0.32,
      0,
    );
    const sleeve = mesh(
      new THREE.CapsuleGeometry(0.19, 0.12, 6, 20),
      kit,
      shoulder,
      0,
      -0.11,
      0,
    );
    sleeve.scale.z = 0.93;
    mesh(
      new THREE.CylinderGeometry(0.172, 0.172, 0.026, 20),
      accent,
      shoulder,
      0,
      -0.215,
      0,
    );
    const elbow = new THREE.Group();
    elbow.position.y = -0.61;
    shoulder.add(elbow);
    elbows[name] = elbow;
    mesh(
      new THREE.CapsuleGeometry(0.101, 0.37, 6, 16),
      skin,
      elbow,
      0,
      -0.25,
      0,
    );
    ellipsoid(elbow, skin, [0, -0.56, 0.009], [0.078, 0.116, 0.048]);
    for (let i = 0; i < 4; i++) {
      const finger = mesh(
        new THREE.CapsuleGeometry(0.015, 0.078, 3, 7),
        skin,
        elbow,
        -0.043 + i * 0.027,
        -0.661 + Math.abs(i - 1.5) * 0.01,
        0.023,
      );
      finger.rotation.x = -0.16;
    }
    const thumb = mesh(
      new THREE.CapsuleGeometry(0.021, 0.057, 3, 8),
      skin,
      elbow,
      side * 0.072,
      -0.584,
      0.026,
    );
    thumb.rotation.z = side * 0.5;

    const hip = new THREE.Group();
    hip.position.set(side * 0.205, 1.58, 0);
    root.add(hip);
    hips[name] = hip;
    mesh(new THREE.CapsuleGeometry(0.172, 0.38, 6, 18), skin, hip, 0, -0.39, 0);
    const short = mesh(
      new THREE.CylinderGeometry(0.235, 0.217, 0.42, 24),
      kit,
      hip,
      0,
      -0.18,
      0.005,
    );
    short.scale.z = 0.9;
    const stripe = mesh(
      new THREE.BoxGeometry(0.015, 0.33, 0.09),
      accent,
      hip,
      side * 0.226,
      -0.18,
      0.035,
    );
    stripe.rotation.z = side * 0.03;
    const knee = new THREE.Group();
    knee.position.y = -0.79;
    hip.add(knee);
    knees[name] = knee;
    ellipsoid(knee, skin, [0, -0.015, 0.017], [0.115, 0.12, 0.12]);
    mesh(
      new THREE.CapsuleGeometry(0.115, 0.42, 6, 16),
      skin,
      knee,
      0,
      -0.35,
      -0.025,
    );
    mesh(
      new THREE.CylinderGeometry(0.135, 0.084, 0.46, 20),
      knit,
      knee,
      0,
      -0.47,
      -0.018,
    );
    mesh(
      new THREE.CylinderGeometry(0.137, 0.137, 0.023, 20),
      accent,
      knee,
      0,
      -0.265,
      -0.018,
    );
    mesh(
      new THREE.CylinderGeometry(0.131, 0.131, 0.012, 20),
      accent,
      knee,
      0,
      -0.307,
      -0.018,
    );
    const ankle = new THREE.Group();
    ankle.position.set(0, -0.72, 0);
    knee.add(ankle);
    ankles[name] = ankle;
  }
  const prototypeBoot = createBoot({ color: "#d7f65b" });
  for (const name of ["left", "right"]) {
    const boot = name === "left" ? prototypeBoot : prototypeBoot.clone();
    boot.scale.setScalar(0.12);
    boot.rotation.y = -Math.PI / 2;
    boot.position.set(0, 0.04, 0.15);
    ankles[name].add(boot);
  }
  const kickingToe = new THREE.Object3D();
  kickingToe.position.set(0, 0.075, 0.453);
  ankles.right.add(kickingToe);
  return {
    root,
    torso,
    head,
    shoulders,
    elbows,
    hips,
    knees,
    ankles,
    kickingToe,
  };
}

// A spherical truncated icosahedron: twelve pentagons and twenty hexagons.
// Panel geometry, seams, and finish are generated locally, without a model download.
export function createFootball(radius = 0.285) {
  const ball = new THREE.Group();
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw = [
    [0, 1, phi],
    [0, -1, phi],
    [0, 1, -phi],
    [0, -1, -phi],
    [1, phi, 0],
    [-1, phi, 0],
    [1, -phi, 0],
    [-1, -phi, 0],
    [phi, 0, 1],
    [-phi, 0, 1],
    [phi, 0, -1],
    [-phi, 0, -1],
  ];
  const vertices = raw.map((v) => new THREE.Vector3(...v).normalize());
  const distance = vertices[0].distanceTo(vertices[1]);
  const adjacent = (a, b) =>
    Math.abs(vertices[a].distanceTo(vertices[b]) - distance) < 0.001;
  const point = (a, b) =>
    vertices[a].clone().multiplyScalar(2).add(vertices[b]).normalize();
  const panels = [];
  for (let a = 0; a < 12; a++) {
    const axis = vertices[a];
    const neighbours = vertices.map((_, b) => b).filter((b) => adjacent(a, b));
    const u = point(a, neighbours[0])
      .sub(axis.clone().multiplyScalar(point(a, neighbours[0]).dot(axis)))
      .normalize();
    const v = axis.clone().cross(u).normalize();
    const corners = neighbours.map((b) => point(a, b));
    corners.sort(
      (a, b) => Math.atan2(a.dot(v), a.dot(u)) - Math.atan2(b.dot(v), b.dot(u)),
    );
    panels.push({ corners, material: a === 4 ? 2 : 1 });
    for (let b = a + 1; b < 12; b++)
      for (let c = b + 1; c < 12; c++) {
        if (adjacent(a, b) && adjacent(b, c) && adjacent(c, a)) {
          panels.push({
            corners: [
              point(a, b),
              point(b, a),
              point(b, c),
              point(c, b),
              point(c, a),
              point(a, c),
            ],
            material: 0,
          });
        }
      }
  }
  const materials = [
    new THREE.MeshStandardMaterial({
      color: "#f1f3e4",
      roughness: 0.43,
      metalness: 0.08,
    }),
    new THREE.MeshStandardMaterial({
      color: "#1e271b",
      roughness: 0.36,
      metalness: 0.13,
    }),
    new THREE.MeshStandardMaterial({
      color: "#d7f65b",
      roughness: 0.42,
      metalness: 0.08,
    }),
  ];
  const buckets = [[], [], []];
  const seams = [];
  const divisions = 7;
  const writeTriangle = (positions, a, b, c) => {
    const outward = b.clone().sub(a).cross(c.clone().sub(a)).dot(a);
    const list = outward >= 0 ? [a, b, c] : [a, c, b];
    for (const point of list)
      positions.push(
        ...point.clone().normalize().multiplyScalar(radius).toArray(),
      );
  };
  for (const { corners, material } of panels) {
    const center = corners
      .reduce((sum, v) => sum.add(v), new THREE.Vector3())
      .normalize();
    for (let edge = 0; edge < corners.length; edge++) {
      const a = corners[edge],
        b = corners[(edge + 1) % corners.length];
      for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions - i; j++) {
          const sample = (u, v) =>
            center
              .clone()
              .multiplyScalar(1 - u - v)
              .addScaledVector(a, u)
              .addScaledVector(b, v);
          const x = i / divisions,
            y = j / divisions,
            step = 1 / divisions;
          writeTriangle(
            buckets[material],
            sample(x, y),
            sample(x + step, y),
            sample(x, y + step),
          );
          if (i + j < divisions - 1)
            writeTriangle(
              buckets[material],
              sample(x + step, y),
              sample(x + step, y + step),
              sample(x, y + step),
            );
        }
      }
      for (let step = 0; step < 8; step++) {
        seams.push(
          ...a
            .clone()
            .lerp(b, step / 8)
            .normalize()
            .multiplyScalar(radius + 0.0007)
            .toArray(),
        );
        seams.push(
          ...a
            .clone()
            .lerp(b, (step + 1) / 8)
            .normalize()
            .multiplyScalar(radius + 0.0007)
            .toArray(),
        );
      }
    }
  }
  buckets.forEach((positions, i) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(
        positions.map((value) => value / radius),
        3,
      ),
    );
    mesh(geometry, materials[i], ball);
  });
  const seamGeometry = new THREE.BufferGeometry();
  seamGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(seams, 3),
  );
  ball.add(
    new THREE.LineSegments(
      seamGeometry,
      new THREE.LineBasicMaterial({
        color: "#4c5644",
        transparent: true,
        opacity: 0.48,
      }),
    ),
  );
  return ball;
}
