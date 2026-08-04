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
    color: "#5d1409",
    emissive: "#230802",
    emissiveIntensity: 0.5,
    roughness: 0.48,
    metalness: 0.18,
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
    emissiveIntensity: 2.75,
    roughness: 0.2,
    metalness: 0.35,
  }),
  gold: new THREE.MeshStandardMaterial({
    name: "gold_data_stream",
    color: "#ffe2a6",
    emissive: "#ffce5a",
    emissiveIntensity: 2.1,
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
    emissiveIntensity: 1.65,
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
    height: 0.012,
    curveSegments: 3,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.002,
    bevelSegments: 1,
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
  new THREE.SphereGeometry(0.92, 72, 48),
  materials.planet,
  [0, 0, 0],
  [0.12, -0.24, 0]
);

for (let i = 0; i < 11; i += 1) {
  const angle = (i / 11) * Math.PI * 2;
  const y = -0.36 + (i % 5) * 0.18;
  const radius = 0.72 + (i % 3) * 0.08;
  addMesh(
    `planet_architecture_contour_${String(i + 1).padStart(2, "0")}`,
    new THREE.SphereGeometry(0.09 + (i % 2) * 0.035, 18, 12),
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

const ringGroup = new THREE.Group();
ringGroup.name = "rotating_system_design_rings";
ringGroup.rotation.set(1.12, 0.02, -0.16);
root.add(ringGroup);

const ringSpecs = [
  ["ring_scalability_track", 1.28, 0.015, materials.amber],
  ["ring_reliability_track", 1.56, 0.012, materials.gold],
  ["ring_observability_track", 1.88, 0.01, materials.rustGlass],
  ["ring_security_track", 2.22, 0.012, materials.amber],
  ["ring_future_signal_track", 2.56, 0.008, materials.cyan],
];

ringSpecs.forEach(([name, radius, tube, material]) => {
  addMesh(name, new THREE.TorusGeometry(radius, tube, 16, 192), material, [0, 0, 0], [0, 0, 0], [1, 0.42, 1], ringGroup);
});

const concepts = [
  "SCALABILITY",
  "RELIABILITY",
  "AVAILABILITY",
  "LOW LATENCY",
  "CACHING",
  "LOAD BALANCING",
  "DATABASES",
  "QUEUES",
  "CONSISTENCY",
  "OBSERVABILITY",
  "SECURITY",
  "API DESIGN",
];

concepts.forEach((concept, index) => {
  const angle = (index / concepts.length) * Math.PI * 2;
  const radius = index % 2 === 0 ? 1.74 : 2.18;
  const text = addCenteredText(concept, concept.length > 11 ? 0.082 : 0.095, materials.text);
  text.name = `ring_topic_${concept.toLowerCase().replaceAll(" ", "_")}`;
  text.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.42, 0.07);
  text.rotation.set(0, 0, angle + Math.PI / 2);
  text.castShadow = false;
  text.receiveShadow = false;
  ringGroup.add(text);
});

for (let i = 0; i < 96; i += 1) {
  const angle = (i / 96) * Math.PI * 2;
  const radius = 1.2 + (i % 5) * 0.28 + Math.sin(i * 7.13) * 0.025;
  const size = 0.012 + (i % 4) * 0.004;
  const material = i % 7 === 0 ? materials.cyan : materials.gold;

  addMesh(
    `ring_data_particle_${String(i + 1).padStart(3, "0")}`,
    new THREE.SphereGeometry(size, 8, 6),
    material,
    [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.42, 0.02 + (i % 3) * 0.015],
    [0, 0, 0],
    [1, 1, 1],
    ringGroup
  );
}

const moons = [
  ["API", 2.95, 0.16, materials.cyan],
  ["DB", 3.18, 0.2, materials.rustGlass],
  ["CACHE", 2.72, 0.13, materials.amber],
  ["QUEUE", 3.36, 0.12, materials.gold],
  ["LB", 2.88, 0.11, materials.cyan],
  ["SLO", 3.08, 0.13, materials.amber],
  ["AUTH", 3.28, 0.1, materials.rustGlass],
  ["LOGS", 2.62, 0.115, materials.cyan],
];

moons.forEach(([label, radius, size, material], index) => {
  const angle = (index / moons.length) * Math.PI * 2 + 0.18;
  const z = index % 2 === 0 ? 0.34 : -0.28;
  const moon = addMesh(
    `system_moon_${label.toLowerCase()}`,
    new THREE.IcosahedronGeometry(size, 1),
    material,
    [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.46, z],
    [0.4, 0.1, angle],
    [1, 1, 1],
    ringGroup
  );

  const tag = addCenteredText(label, 0.075, materials.microText);
  tag.name = `moon_label_${label.toLowerCase()}`;
  tag.position.set(moon.position.x, moon.position.y - size - 0.1, z + 0.035);
  tag.castShadow = false;
  tag.receiveShadow = false;
  ringGroup.add(tag);
});

const caption = addCenteredText("THE FLOW OF IDEAS & CODE", 0.12, materials.text);
caption.name = "portfolio_caption_flow_of_ideas_and_code";
caption.position.set(0, -1.58, 0.5);
caption.rotation.set(-0.12, 0, 0);
root.add(caption);

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
