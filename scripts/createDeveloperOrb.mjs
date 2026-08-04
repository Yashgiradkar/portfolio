import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      const base64 = Buffer.from(buffer).toString("base64");
      this.result = `data:${blob.type || "application/octet-stream"};base64,${base64}`;
      this.onloadend?.();
    });
  }
};

const outputDir = new URL("../public/developer_orb/", import.meta.url);
const outputFile = new URL("./scene.gltf", outputDir);
const fontFile = new URL("../node_modules/three/examples/fonts/helvetiker_bold.typeface.json", import.meta.url);

const fontJson = JSON.parse(await readFile(fontFile, "utf8"));
const font = new FontLoader().parse(fontJson);

const scene = new THREE.Scene();
scene.name = "System_Design_Saturn_Showcase";

const materials = {
  planet: new THREE.MeshStandardMaterial({
    name: "dark_rust_planet",
    color: "#3f120a",
    emissive: "#230802",
    emissiveIntensity: 0.28,
    roughness: 0.56,
    metalness: 0.12,
  }),
  continent: new THREE.MeshStandardMaterial({
    name: "planet_surface_contours",
    color: "#b3401f",
    emissive: "#431006",
    emissiveIntensity: 0.32,
    roughness: 0.7,
    metalness: 0.08,
  }),
  amber: new THREE.MeshStandardMaterial({
    name: "amber_system_ring_glow",
    color: "#ffc46b",
    emissive: "#ff7a2a",
    emissiveIntensity: 1.65,
    roughness: 0.2,
    metalness: 0.35,
  }),
  gold: new THREE.MeshStandardMaterial({
    name: "gold_data_stream",
    color: "#ffe2a6",
    emissive: "#ffce5a",
    emissiveIntensity: 1.35,
    roughness: 0.24,
    metalness: 0.32,
    transparent: true,
    opacity: 0.78,
  }),
  cyan: new THREE.MeshStandardMaterial({
    name: "cyan_future_signal",
    color: "#7be8ff",
    emissive: "#24c8ff",
    emissiveIntensity: 2.2,
    roughness: 0.18,
    metalness: 0.25,
  }),
  rustGlass: new THREE.MeshStandardMaterial({
    name: "rust_translucent_orbit",
    color: "#b3401f",
    emissive: "#6b1c0d",
    emissiveIntensity: 0.9,
    roughness: 0.22,
    metalness: 0.26,
    transparent: true,
    opacity: 0.58,
  }),
  rock: new THREE.MeshStandardMaterial({
    name: "dark_moon_asteroid",
    color: "#24110c",
    emissive: "#120604",
    emissiveIntensity: 0.3,
    roughness: 0.82,
    metalness: 0.04,
  }),
  text: new THREE.MeshStandardMaterial({
    name: "system_design_text",
    color: "#fff2d4",
    emissive: "#ffc46b",
    emissiveIntensity: 1.15,
    roughness: 0.34,
    metalness: 0.08,
  }),
  microText: new THREE.MeshStandardMaterial({
    name: "micro_label_text",
    color: "#9eefff",
    emissive: "#24c8ff",
    emissiveIntensity: 1.4,
    roughness: 0.28,
    metalness: 0.06,
  }),
  labelPanel: new THREE.MeshStandardMaterial({
    name: "frosted_ring_ui_label_panel",
    color: "#17242a",
    emissive: "#12333c",
    emissiveIntensity: 0.22,
    roughness: 0.18,
    metalness: 0.18,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
  }),
  sun: new THREE.MeshBasicMaterial({
    name: "eclipse_sun_flare",
    color: "#ffce5a",
    transparent: true,
    opacity: 0.92,
  }),
};

const root = new THREE.Group();
root.name = "Future_Technology_System_Design_Saturn";
scene.add(root);

const addMesh = (
  name,
  geometry,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  parent = root
) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
};

const addCenteredText = (label, size, material) => {
  const geometry = new TextGeometry(label, {
    font,
    size,
    height: 0.006,
    curveSegments: 1,
    bevelEnabled: false,
  });

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const width = box.max.x - box.min.x;
  const height = box.max.y - box.min.y;
  geometry.translate(-width / 2, -height / 2, 0);

  return new THREE.Mesh(geometry, material);
};

const planet = addMesh(
  "central_future_technology_planet",
  new THREE.SphereGeometry(0.92, 48, 32),
  materials.planet,
  [0, 0, 0],
  [0.12, -0.24, 0]
);

addMesh(
  "planet_geodesic_design_mesh",
  new THREE.IcosahedronGeometry(0.935, 3),
  new THREE.MeshBasicMaterial({
    name: "planet_thin_geodesic_lines",
    color: "#ffd7a1",
    transparent: true,
    opacity: 0.18,
    wireframe: true,
  }),
  [0, 0, 0.01],
  [0.12, -0.24, 0],
  [1, 1, 1]
);

for (let i = 0; i < 11; i += 1) {
  const angle = (i / 11) * Math.PI * 2;
  const y = -0.36 + (i % 5) * 0.18;
  const radius = 0.72 + (i % 3) * 0.08;
  addMesh(
    `planet_architecture_contour_${String(i + 1).padStart(2, "0")}`,
    new THREE.SphereGeometry(0.09 + (i % 2) * 0.035, 12, 8),
    materials.continent,
    [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
    [0, 0, 0],
    [1.8, 0.18, 0.62],
    planet
  );
}

addMesh(
  "sunrise_edge_highlight",
  new THREE.TorusGeometry(0.96, 0.016, 16, 128, Math.PI * 1.08),
  materials.gold,
  [0.04, 0, 0.03],
  [0, 1.16, -0.2]
);

const flareGroup = new THREE.Group();
flareGroup.name = "bright_eclipse_sunburst";
flareGroup.position.set(0.92, -0.04, -0.34);
root.add(flareGroup);

addMesh("eclipse_sun_core", new THREE.SphereGeometry(0.22, 32, 18), materials.sun, [0, 0, 0], [0, 0, 0], [1, 1, 0.18], flareGroup);

for (let i = 0; i < 18; i += 1) {
  const angle = (i / 18) * Math.PI * 2;
  addMesh(
    `eclipse_light_ray_${String(i + 1).padStart(2, "0")}`,
    new THREE.ConeGeometry(0.025, 0.74 + (i % 3) * 0.16, 3),
    materials.sun,
    [Math.cos(angle) * 0.32, Math.sin(angle) * 0.32, -0.02],
    [Math.PI / 2, 0, angle - Math.PI / 2],
    [1, 1, 0.18],
    flareGroup
  );
}

const ringGroup = new THREE.Group();
ringGroup.name = "rotating_system_design_rings";
ringGroup.rotation.set(1.12, 0.02, -0.16);
root.add(ringGroup);

const ringSpecs = [
  ["ring_inner_data_track", 1.55, 0.006, materials.gold],
  ["ring_scalability_track", 1.9, 0.009, materials.gold],
  ["ring_reliability_track", 2.22, 0.005, materials.rustGlass],
  ["ring_observability_track", 2.58, 0.007, materials.gold],
  ["ring_security_track", 3.02, 0.005, materials.amber],
  ["ring_future_signal_track", 3.48, 0.004, materials.cyan],
  ["ring_outer_depth_track", 4.05, 0.005, materials.gold],
  ["ring_far_background_track", 4.7, 0.0035, materials.rustGlass],
];

ringSpecs.forEach(([name, radius, tube, material]) => {
  addMesh(name, new THREE.TorusGeometry(radius, tube, 12, 192), material, [0, 0, 0], [0, 0, 0], [1, 0.32, 1], ringGroup);
});

const circulatingTextGroup = new THREE.Group();
circulatingTextGroup.name = "circulating_ring_microcopy";
ringGroup.add(circulatingTextGroup);

const ringCopyLanes = [
  {
    radius: 1.62,
    size: 0.015,
    z: 0.075,
    material: materials.text,
    copy: ["DATA FLOW", "MESSAGE BUS", "API GATEWAY", "EDGE CACHE", "CDN ROUTE", "RATE LIMIT"],
  },
  {
    radius: 1.92,
    size: 0.013,
    z: 0.062,
    material: materials.microText,
    copy: ["CONSISTENCY MODEL", "EVENT LOG", "IDEMPOTENCY", "BACKPRESSURE", "RETRY BUDGET", "CIRCUIT BREAKER"],
  },
  {
    radius: 2.28,
    size: 0.014,
    z: 0.08,
    material: materials.text,
    copy: ["LOAD BALANCING", "SHARDING", "REPLICATION", "FAILOVER", "PARTITION TOLERANCE", "OBSERVABILITY"],
  },
  {
    radius: 2.66,
    size: 0.012,
    z: 0.052,
    material: materials.gold,
    copy: ["TRACE ID", "P99 LATENCY", "SLO", "CACHE HIT RATIO", "QUEUE DEPTH", "ERROR BUDGET"],
  },
  {
    radius: 3.1,
    size: 0.013,
    z: 0.07,
    material: materials.microText,
    copy: ["AUTHN", "AUTHZ", "ZERO TRUST", "SECRETS", "ENCRYPTION", "THREAT MODEL"],
  },
  {
    radius: 3.62,
    size: 0.0115,
    z: 0.048,
    material: materials.text,
    copy: ["SCALABILITY", "RELIABILITY", "AVAILABILITY", "LOW LATENCY", "RESILIENCE", "CAPACITY PLANNING"],
  },
];

ringCopyLanes.forEach((lane, laneIndex) => {
  const count = laneIndex % 2 === 0 ? 24 : 28;

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + laneIndex * 0.18;
    const label = lane.copy[i % lane.copy.length];
    const text = addCenteredText(label, lane.size, lane.material);
    const tangent = angle + Math.PI / 2;
    const upright = Math.cos(angle) < 0 ? tangent + Math.PI : tangent;

    text.name = `ring_microcopy_lane_${laneIndex + 1}_${String(i + 1).padStart(2, "0")}`;
    text.position.set(
      Math.cos(angle) * lane.radius,
      Math.sin(angle) * lane.radius * 0.32,
      lane.z + (i % 3) * 0.004
    );
    text.rotation.set(0, 0, upright);
    text.castShadow = false;
    text.receiveShadow = false;
    circulatingTextGroup.add(text);
  }
});

for (let i = 0; i < 160; i += 1) {
  const angle = (i / 160) * Math.PI * 2;
  const radius = 1.48 + (i % 9) * 0.34 + Math.sin(i * 7.13) * 0.018;
  const size = 0.005 + (i % 4) * 0.0025;
  const material = i % 7 === 0 ? materials.cyan : materials.gold;

  addMesh(
    `ring_data_particle_${String(i + 1).padStart(3, "0")}`,
    new THREE.SphereGeometry(size, 8, 6),
    material,
    [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.32, 0.02 + (i % 3) * 0.015],
    [0, 0, 0],
    [1, 1, 1],
    ringGroup
  );
}

for (let i = 0; i < 30; i += 1) {
  const angle = (i / 30) * Math.PI * 2 + Math.sin(i * 1.91) * 0.08;
  const radius = 1.6 + (i % 10) * 0.3;
  const z = -0.08 + (i % 5) * 0.04;
  const size = 0.014 + (i % 4) * 0.008;

  addMesh(
    `ring_asteroid_${String(i + 1).padStart(2, "0")}`,
    new THREE.IcosahedronGeometry(size, 0),
    materials.rock,
    [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.33, z],
    [angle, i * 0.37, i * 0.19],
    [1.4, 0.85, 1],
    ringGroup
  );
}

const moons = [
  ["API", 3.05, 0.07, materials.cyan],
  ["DB", 3.65, 0.09, materials.rustGlass],
  ["CACHE", 2.62, 0.06, materials.amber],
  ["QUEUE", 4.1, 0.06, materials.gold],
  ["LB", 3.32, 0.055, materials.cyan],
  ["SLO", 3.82, 0.062, materials.amber],
  ["AUTH", 4.38, 0.055, materials.rustGlass],
  ["LOGS", 2.82, 0.055, materials.cyan],
];

moons.forEach(([label, radius, size, material], index) => {
  const angle = (index / moons.length) * Math.PI * 2 + 0.18;
  const z = index % 2 === 0 ? 0.34 : -0.28;
  addMesh(
    `system_moon_${label.toLowerCase()}`,
    new THREE.IcosahedronGeometry(size, 1),
    material,
    [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.34, z],
    [0.4, 0.1, angle],
    [1, 1, 1],
    ringGroup
  );
});

root.rotation.set(-0.08, 0.18, -0.08);
root.scale.set(1.08, 1.08, 1.08);

await mkdir(outputDir, { recursive: true });

const exporter = new GLTFExporter();
const gltf = await new Promise((resolve, reject) => {
  exporter.parse(scene, resolve, reject, {
    binary: false,
    onlyVisible: true,
    trs: false,
  });
});

await writeFile(outputFile, `${JSON.stringify(gltf, null, 2)}\n`, "utf8");
console.log(`Generated ${outputFile.pathname}`);
