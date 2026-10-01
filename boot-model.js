import * as THREE from "./vendor/three.module.js";

// A fully local, procedural football boot. The toe points along +X and Y is up.
const SHAPE = [
  [-2.48, 0.09, 0.6],
  [-2.35, 0.43, 0.94],
  [-2.12, 0.58, 1.08],
  [-1.65, 0.59, 1.12],
  [-1.1, 0.56, 1.16],
  [-0.6, 0.65, 1.08],
  [0.0, 0.81, 0.88],
  [0.65, 0.87, 0.68],
  [1.25, 0.81, 0.54],
  [1.8, 0.68, 0.43],
  [2.19, 0.48, 0.33],
  [2.43, 0.23, 0.22],
  [2.53, 0.025, 0.06],
];
const BASE = 0.135;
const POWER = 0.78;
const OPENING = { x: -1.53, rx: 0.68, rz: 0.36 };

function profile(x) {
  let i = 0;
  while (i < SHAPE.length - 2 && x > SHAPE[i + 1][0]) i++;
  const a = SHAPE[i],
    b = SHAPE[i + 1];
  const t = THREE.MathUtils.clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
  const result = [];
  for (let field = 1; field <= 2; field++) {
    const prev = SHAPE[Math.max(0, i - 1)];
    const next = SHAPE[Math.min(SHAPE.length - 1, i + 2)];
    const ma = (b[field] - prev[field]) / (b[0] - prev[0]);
    const mb = (next[field] - a[field]) / (next[0] - a[0]);
    const length = b[0] - a[0];
    result.push(
      Math.max(
        0.02,
        (2 * t ** 3 - 3 * t ** 2 + 1) * a[field] +
          (t ** 3 - 2 * t ** 2 + t) * ma * length +
          (-2 * t ** 3 + 3 * t ** 2) * b[field] +
          (t ** 3 - t ** 2) * mb * length,
      ),
    );
  }
  return { width: result[0], height: result[1] };
}

function topY(x, z) {
  const { width, height } = profile(x);
  return (
    BASE +
    height * Math.pow(Math.sqrt(Math.max(0, 1 - (z / width) ** 2)), POWER)
  );
}

function sideZ(x, y, side) {
  const { width, height } = profile(x);
  const sine = Math.pow(
    THREE.MathUtils.clamp((y - BASE) / height, 0, 0.99),
    1 / POWER,
  );
  return side * (width * Math.sqrt(1 - sine ** 2) + 0.018);
}

function materialTexture(kind) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = kind === "carbon" ? "#252a27" : "#dadada";
  ctx.fillRect(0, 0, 256, 256);
  if (kind === "carbon") {
    for (let y = 0; y < 256; y += 12) {
      for (let x = 0; x < 256; x += 12) {
        const alternate = ((x + y) / 12) % 2;
        ctx.fillStyle = alternate ? "#343a36" : "#161c18";
        ctx.fillRect(x, y, 11, 11);
        ctx.strokeStyle = alternate ? "#424842" : "#292e29";
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 10);
        ctx.lineTo(x + 10, y + 2);
        ctx.stroke();
      }
    }
  } else {
    for (let y = 0; y < 256; y += 6) {
      for (let x = 0; x < 256; x += 5) {
        const offset = y % 12 ? 2 : 0;
        ctx.strokeStyle = kind === "knit" ? "#929292" : "#bebebe";
        ctx.lineWidth = kind === "knit" ? 1.5 : 0.7;
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset + 2, y + 3);
        ctx.lineTo(x + offset, y + 5);
        ctx.stroke();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "carbon" ? 3 : 5, kind === "carbon" ? 2 : 3);
  texture.anisotropy = 4;
  return texture;
}

function upperGeometry() {
  const longitudinal = 112,
    radial = 64;
  const positions = [],
    uv = [],
    indices = [];
  for (let i = 0; i <= longitudinal; i++) {
    const x = THREE.MathUtils.lerp(
      SHAPE[0][0],
      SHAPE.at(-1)[0],
      i / longitudinal,
    );
    const { width, height } = profile(x);
    for (let j = 0; j <= radial; j++) {
      const theta = (j / radial) * Math.PI * 2;
      const sine = Math.sin(theta);
      const y =
        BASE + (sine >= 0 ? height * Math.pow(sine, POWER) : 0.03 * sine);
      positions.push(x, y, width * Math.cos(theta));
      uv.push(i / longitudinal, j / radial);
    }
  }
  for (let i = 0; i < longitudinal; i++) {
    for (let j = 0; j < radial; j++) {
      const x = THREE.MathUtils.lerp(
        SHAPE[0][0],
        SHAPE.at(-1)[0],
        (i + 0.5) / longitudinal,
      );
      const theta = ((j + 0.5) / radial) * Math.PI * 2;
      const z = profile(x).width * Math.cos(theta);
      const insideOpening =
        ((x - OPENING.x) / OPENING.rx) ** 2 + (z / OPENING.rz) ** 2 < 1;
      if (Math.sin(theta) > 0 && insideOpening) continue;
      const a = i * (radial + 1) + j,
        b = a + radial + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
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

function collarGeometry() {
  const points = [],
    uv = [],
    indices = [];
  const around = 100,
    tubeSegments = 16;
  for (let i = 0; i <= around; i++) {
    const phi = (i / around) * Math.PI * 2;
    const x = OPENING.x + OPENING.rx * Math.cos(phi);
    const z = OPENING.rz * Math.sin(phi);
    const y = topY(x, z) + 0.008;
    const outward = new THREE.Vector2(
      Math.cos(phi) / OPENING.rx,
      Math.sin(phi) / OPENING.rz,
    ).normalize();
    for (let j = 0; j <= tubeSegments; j++) {
      const t = (j / tubeSegments) * Math.PI * 2;
      points.push(
        x + outward.x * Math.cos(t) * 0.064,
        y + Math.sin(t) * 0.078,
        z + outward.y * Math.cos(t) * 0.064,
      );
      uv.push(i / around, j / tubeSegments);
    }
  }
  for (let i = 0; i < around; i++) {
    for (let j = 0; j < tubeSegments; j++) {
      const a = i * (tubeSegments + 1) + j,
        b = a + tubeSegments + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function openingInterior() {
  const positions = [],
    indices = [];
  const segments = 96;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = OPENING.x + (OPENING.rx - 0.018) * Math.cos(t);
    const z = (OPENING.rz - 0.018) * Math.sin(t);
    positions.push(x, topY(x, z) - 0.01, z);
    positions.push(OPENING.x + 0.47 * Math.cos(t), 0.54, 0.25 * Math.sin(t));
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function footprint() {
  const points = [];
  for (let i = 0; i <= 80; i++) {
    const x = THREE.MathUtils.lerp(-2.46, 2.5, i / 80);
    points.push(new THREE.Vector2(x, profile(x).width + 0.035));
  }
  for (let i = 80; i >= 0; i--) {
    const x = THREE.MathUtils.lerp(-2.46, 2.5, i / 80);
    points.push(new THREE.Vector2(x, -profile(x).width - 0.035));
  }
  return new THREE.Shape(points);
}

function addTube(group, points, material, radius = 0.018, segments = 30) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, radius, 6, false),
    material,
  );
  group.add(tube);
  return tube;
}

function sidePanel(group, polygon, material, side) {
  const contour = polygon.map(([x, y]) => new THREE.Vector2(x, y));
  const triangles = THREE.ShapeUtils.triangulateShape(contour, []);
  // Subdivide the mark before projecting it onto the curved upper so wide
  // triangles cannot disappear beneath the leather surface.
  const vertices = [],
    indices = [];
  const subdivisions = 10;
  for (const triangle of triangles) {
    const [a, b, c] = triangle.map((index) => contour[index]);
    const rows = [];
    for (let row = 0; row <= subdivisions; row++) {
      rows[row] = [];
      for (let col = 0; col <= subdivisions - row; col++) {
        const u = row / subdivisions,
          v = col / subdivisions;
        const x = a.x * (1 - u - v) + b.x * u + c.x * v;
        const y = a.y * (1 - u - v) + b.y * u + c.y * v;
        rows[row][col] = vertices.length / 3;
        vertices.push(x, y, sideZ(x, y, side));
      }
    }
    for (let row = 0; row < subdivisions; row++) {
      for (let col = 0; col < subdivisions - row; col++) {
        indices.push(rows[row][col], rows[row + 1][col], rows[row][col + 1]);
        if (col < subdivisions - row - 1) {
          indices.push(
            rows[row + 1][col],
            rows[row + 1][col + 1],
            rows[row][col + 1],
          );
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const panel = new THREE.Mesh(geometry, material);
  group.add(panel);
  return panel;
}

function tongueGeometry() {
  const positions = [],
    uvs = [],
    indices = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const x = THREE.MathUtils.lerp(-0.91, 0.55, i / steps);
    const halfWidth = THREE.MathUtils.lerp(0.25, 0.3, i / steps);
    for (let j = 0; j <= 10; j++) {
      const z = THREE.MathUtils.lerp(-halfWidth, halfWidth, j / 10);
      positions.push(x, topY(x, z) + 0.019 + (1 - i / steps) * 0.04, z);
      uvs.push(i / steps, j / 10);
    }
  }
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < 10; j++) {
      const a = i * 11 + j,
        b = a + 11;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createBoot({ color = "#deff55", accent = "#111410" } = {}) {
  const boot = new THREE.Group();
  boot.name = "Breno — BOLT 01";
  const knit = materialTexture("knit");
  const technical = materialTexture("technical");
  const carbon = materialTexture("carbon");
  const upperMaterial = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.54,
    metalness: 0.025,
    clearcoat: 0.16,
    clearcoatRoughness: 0.46,
    bumpMap: technical,
    bumpScale: 0.009,
    side: THREE.DoubleSide,
  });
  const studMaterial = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.28,
    metalness: 0.18,
    clearcoat: 0.7,
  });
  const knitMaterial = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.84,
    bumpMap: knit,
    bumpScale: 0.022,
    side: THREE.DoubleSide,
  });
  const darkMaterial = new THREE.MeshPhysicalMaterial({
    color: accent,
    roughness: 0.32,
    metalness: 0.08,
    clearcoat: 0.35,
    side: THREE.DoubleSide,
  });
  const laceMaterial = new THREE.MeshStandardMaterial({
    color: "#edeede",
    roughness: 0.9,
    bumpMap: knit,
    bumpScale: 0.008,
  });
  const soleMaterial = new THREE.MeshPhysicalMaterial({
    color: "#20271c",
    map: carbon,
    roughness: 0.27,
    metalness: 0.17,
    clearcoat: 0.8,
  });
  const interiorMaterial = new THREE.MeshStandardMaterial({
    color: "#060907",
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const detailMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.48),
    roughness: 0.7,
    transparent: true,
    opacity: 0.36,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: "#c8d4b5",
    metalness: 0.52,
    roughness: 0.31,
  });
  boot.userData.colorMaterials = [upperMaterial, studMaterial];
  boot.userData.detailMaterials = [detailMaterial];

  boot.add(new THREE.Mesh(upperGeometry(), upperMaterial));
  boot.add(new THREE.Mesh(collarGeometry(), knitMaterial));
  boot.add(new THREE.Mesh(openingInterior(), interiorMaterial));
  const insole = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16),
    interiorMaterial,
  );
  insole.scale.set(0.53, 0.08, 0.29);
  insole.position.set(OPENING.x, 0.54, 0);
  boot.add(insole);

  const soleGeometry = new THREE.ExtrudeGeometry(footprint(), {
    depth: 0.105,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 24,
  });
  soleGeometry.rotateX(Math.PI / 2);
  const sole = new THREE.Mesh(soleGeometry, soleMaterial);
  sole.position.y = 0.13;
  boot.add(sole);

  // A fine raised edge reads clearly against the carbon plate.
  for (const side of [-1, 1]) {
    const edge = [];
    for (let i = 0; i <= 60; i++) {
      const x = THREE.MathUtils.lerp(-2.39, 2.43, i / 60);
      edge.push(new THREE.Vector3(x, 0.158, side * (profile(x).width + 0.016)));
    }
    addTube(boot, edge, darkMaterial, 0.019, 72);
  }

  const studPositions = [
    [-1.98, -0.37],
    [-1.98, 0.37],
    [-1.18, -0.39],
    [-1.18, 0.39],
    [0.3, -0.61],
    [0.3, 0.61],
    [1.1, -0.6],
    [1.1, 0.6],
    [1.83, -0.37],
    [1.83, 0.37],
    [0.66, 0],
  ];
  for (const [x, z] of studPositions) {
    const stud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.078, 0.31, 5, 1),
      studMaterial,
    );
    stud.position.set(x, -0.15, z);
    stud.rotation.y = (x > 0 ? 0.2 : -0.2) + (z < 0 ? Math.PI : 0);
    boot.add(stud);
    const mount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.157, 0.135, 0.056, 12),
      darkMaterial,
    );
    mount.position.set(x, -0.006, z);
    boot.add(mount);
    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.068, 0.025, 5),
      trimMaterial,
    );
    tip.position.set(x, -0.315, z);
    tip.rotation.y = stud.rotation.y;
    boot.add(tip);
  }

  boot.add(new THREE.Mesh(tongueGeometry(), knitMaterial));
  for (let i = 0; i < 7; i++) {
    const x = -0.67 + i * 0.165;
    const halfWidth = 0.265 + i * 0.011;
    for (const side of [-1, 1]) {
      const z = side * halfWidth;
      const eyelet = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.012, 8, 16),
        darkMaterial,
      );
      eyelet.rotation.x = -Math.PI / 2;
      eyelet.position.set(x, topY(x, z) + 0.049, z);
      boot.add(eyelet);
    }
    const nextX = x + 0.13;
    for (const direction of [-1, 1]) {
      const points = [];
      for (let j = 0; j <= 10; j++) {
        const t = j / 10;
        const lx = THREE.MathUtils.lerp(x, nextX, t);
        const lz = THREE.MathUtils.lerp(
          -direction * halfWidth,
          direction * halfWidth,
          t,
        );
        points.push(
          new THREE.Vector3(
            lx,
            topY(lx, lz) + 0.058 + Math.sin(t * Math.PI) * 0.022,
            lz,
          ),
        );
      }
      addTube(boot, points, laceMaterial, 0.019, 20);
    }
  }
  // Compact lace knot; no exaggerated dangling loops.
  const knotX = -0.73;
  for (const side of [-1, 1]) {
    const knotPoints = [
      new THREE.Vector3(knotX, topY(knotX, 0) + 0.072, 0),
      new THREE.Vector3(
        knotX - 0.1,
        topY(knotX - 0.1, side * 0.14) + 0.1,
        side * 0.14,
      ),
      new THREE.Vector3(
        knotX + 0.07,
        topY(knotX + 0.07, side * 0.13) + 0.08,
        side * 0.13,
      ),
      new THREE.Vector3(knotX, topY(knotX, 0) + 0.074, 0),
    ];
    addTube(boot, knotPoints, laceMaterial, 0.019, 26);
  }

  for (const side of [-1, 1]) {
    // An original geometric lightning mark, following the upper's curvature.
    sidePanel(
      boot,
      [
        [-1.17, 0.7],
        [0.02, 0.7],
        [-0.43, 0.44],
        [0.86, 0.44],
        [0.68, 0.29],
        [-0.88, 0.29],
        [-0.42, 0.55],
        [-1.33, 0.55],
      ],
      darkMaterial,
      side,
    );
    sidePanel(
      boot,
      [
        [-2.33, 0.25],
        [-2.25, 0.7],
        [-1.93, 0.76],
        [-1.49, 0.3],
        [-1.66, 0.22],
      ],
      knitMaterial,
      side,
    );

    // Stitched heel detailing and very fine relief lines over the forefoot.
    const seam = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = -2.18 + t * 0.49;
      const y = 0.74 - t * 0.43;
      seam.push(new THREE.Vector3(x, y, sideZ(x, y, side) + side * 0.005));
    }
    addTube(boot, seam, trimMaterial, 0.008, 25);
  }

  for (let i = 0; i < 8; i++) {
    const x = 0.72 + i * 0.175;
    const ridge = [];
    for (let j = 0; j <= 24; j++) {
      const theta = THREE.MathUtils.lerp(0.2, Math.PI - 0.2, j / 24);
      const curveX = x + Math.sin(theta) * 0.055;
      const { width, height } = profile(curveX);
      ridge.push(
        new THREE.Vector3(
          curveX,
          BASE + height * Math.sin(theta) ** POWER + 0.005,
          width * Math.cos(theta),
        ),
      );
    }
    addTube(boot, ridge, detailMaterial, 0.007, 36);
  }

  // Small heel pull tab gives the rear silhouette a purposeful finish.
  const pullTab = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.23, 0.19),
    knitMaterial,
  );
  pullTab.position.set(-2.265, 1.07, 0);
  pullTab.rotation.z = 0.28;
  boot.add(pullTab);

  boot.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return boot;
}

export function setBootColor(boot, color) {
  for (const material of boot.userData.colorMaterials || [])
    material.color.set(color);
  for (const material of boot.userData.detailMaterials || [])
    material.color.set(color).multiplyScalar(0.48);
}
