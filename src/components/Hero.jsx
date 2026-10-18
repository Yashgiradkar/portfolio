import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import { styles } from "../styles";

const DUST_COUNT = 940;
const FIELD_DEPTH = 3.7;
const DUST_DRIFT_SPEED = 0.4;
const DUST_TARGET_ALPHA = 0.68;
const DUST_DRIFT_SPEED = 0.4;
const DUST_TARGET_ALPHA = 0.68;

const hexToVec3 = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const dustVertexShader = `
  attribute float size;
  uniform float iTime; uniform vec3 iShift; uniform vec2 iResolution; uniform vec3 iAnimation; uniform float uDepth;
  varying float transparency; varying float warmness;
  vec3 warp3d(vec3 pos, float t) {
    float flow = t * .075;
    pos *= 2.;
    pos.x += flow;
    pos.y += .46 * sin(1.45 * pos.x + flow) + .18 * sin(3.2 * pos.z - flow * .7);
    pos.z += .35 * sin(.8 * pos.x + flow * .9) + flow * .42;
    return abs(pos);
    float flow = t * .075;
    pos *= 2.;
    pos.x += flow;
    pos.y += .46 * sin(1.45 * pos.x + flow) + .18 * sin(3.2 * pos.z - flow * .7);
    pos.z += .35 * sin(.8 * pos.x + flow * .9) + flow * .42;
    return abs(pos);
  }
  void main() {
    vec3 v = uDepth * (2. * fract(warp3d(position, iTime) + iShift) - 1.) + iAnimation;
    vec4 vpos = modelViewMatrix * vec4(v, 1.); transparency = step(length(v), uDepth);
    warmness = step(.75, fract(size * 7.13));
    float twinkle = .78 + .22 * sin(iTime * 1.4 + size * 3.1);
    gl_PointSize = size * twinkle * iResolution.y / 1000. / -vpos.z;
    warmness = step(.75, fract(size * 7.13));
    float twinkle = .78 + .22 * sin(iTime * 1.4 + size * 3.1);
    gl_PointSize = size * twinkle * iResolution.y / 1000. / -vpos.z;
    gl_Position = projectionMatrix * vpos;
  }
`;

const dustFragmentShader = `
  varying float transparency; varying float warmness; uniform float iAlpha; uniform vec3 uCool; uniform vec3 uWarm;
  void main() { vec3 color = mix(uCool * .8, uWarm * .8, warmness); float tex = smoothstep(1., .3, length(2. * gl_PointCoord - 1.)); gl_FragColor = vec4(tex * color, tex * transparency * iAlpha); }
`;

const CosmicDust = () => {
  const shift = useMemo(() => new THREE.Vector3(), []);
  const { camera, size, viewport } = useThree();

  const geometry = useMemo(() => {
    const positions = [];
    const sizes = [];
    let seed = 481516;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < DUST_COUNT; i += 1) {
      positions.push(2 * random() - 1, 2 * random() - 1, 2 * random() - 1);
      sizes.push(50 + 50 * random());
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    result.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    return result;
  }, []);

  const uniforms = useMemo(() => ({
    iTime: { value: 0 }, iShift: { value: shift }, iAlpha: { value: 0 }, iAnimation: { value: new THREE.Vector3() },
    iResolution: { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) },
    uDepth: { value: FIELD_DEPTH }, uCool: { value: hexToVec3("#b3401f") }, uWarm: { value: hexToVec3("#ffc46b") },
  }), [shift]);

  useEffect(() => {
    uniforms.iResolution.value.set(size.width * (window.devicePixelRatio || 1), size.height * (window.devicePixelRatio || 1));
  }, [size, uniforms]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const fade = THREE.MathUtils.clamp((elapsed - 0.25) / 2.2, 0, 1);
    const easedFade = fade * fade * fade * (fade * (fade * 6 - 15) + 10);
    uniforms.iTime.value = elapsed;
    uniforms.iAlpha.value = easedFade * DUST_TARGET_ALPHA;
    shift.addScaledVector(camera.position, 0.0022 * DUST_DRIFT_SPEED);
    const elapsed = clock.getElapsedTime();
    const fade = THREE.MathUtils.clamp((elapsed - 0.25) / 2.2, 0, 1);
    const easedFade = fade * fade * fade * (fade * (fade * 6 - 15) + 10);
    uniforms.iTime.value = elapsed;
    uniforms.iAlpha.value = easedFade * DUST_TARGET_ALPHA;
    shift.addScaledVector(camera.position, 0.0022 * DUST_DRIFT_SPEED);
  });

  return (
    <points geometry={geometry} position={[0, 0, -1]} scale={[viewport.width / 3.8, viewport.height / 3.8, 1]}>
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={uniforms} vertexShader={dustVertexShader} fragmentShader={dustFragmentShader} />
    </points>
  );
};

/* -------------------------------------------------------------------------- */
/*  Moons                                                                     */
/* -------------------------------------------------------------------------- */
const BADGE_SIZE = 256;
const BADGE_FONT = "700 90px Poppins, Arial, sans-serif";

const polygon = (c, cx, cy, r, sides, rot = -Math.PI / 2) => {
  c.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const a = rot + (i / sides) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
};

// Logos are drawn on a canvas so nothing external has to load (no CORS, no extra files).
// Each moon swaps to a different badge every time it circles round behind the planet.
const BADGES = [
  { name: "React", title: "Component-Driven UI", text: "Composable interfaces with predictable state and fast rendering.", viz: "flow", color: "#61dafb", url: "https://react.dev", draw: (c) => {
    c.strokeStyle = "#61dafb"; c.lineWidth = 9;
    for (let i = 0; i < 3; i += 1) {
      c.save(); c.translate(128, 128); c.rotate((i * Math.PI) / 3);
      c.beginPath(); c.ellipse(0, 0, 84, 32, 0, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    c.fillStyle = "#61dafb"; c.beginPath(); c.arc(128, 128, 13, 0, Math.PI * 2); c.fill();
  } },
  { name: "AWS", title: "Cloud Infrastructure", text: "Managed compute, storage and networking that scales on demand.", viz: "mesh", color: "#ff9900", url: "https://aws.amazon.com", draw: (c) => {
    c.fillStyle = "#ffffff"; c.font = BADGE_FONT; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("aws", 128, 98);
    c.strokeStyle = "#ff9900"; c.lineWidth = 11; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(62, 156); c.quadraticCurveTo(128, 196, 194, 150); c.stroke();
    c.beginPath(); c.moveTo(176, 146); c.lineTo(196, 149); c.lineTo(192, 169); c.stroke();
  } },
  { name: "Node", title: "Event-Driven Backends", text: "Non-blocking I/O so one service handles thousands of requests.", viz: "flow", color: "#7ccf5a", url: "https://nodejs.org", draw: (c) => {
    c.strokeStyle = "#7ccf5a"; c.lineWidth = 11; c.lineJoin = "round";
    polygon(c, 128, 128, 88, 6); c.stroke();
    c.fillStyle = "#7ccf5a"; c.font = "700 74px Poppins, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("JS", 128, 132);
  } },
  { name: "Python", title: "AI and Data Pipelines", text: "Clean pipelines from raw data to models running in production.", viz: "bars", color: "#ffd43b", url: "https://python.org", draw: (c) => {
    const g = c.createLinearGradient(40, 40, 216, 216);
    g.addColorStop(0, "#5b9bd5"); g.addColorStop(1, "#ffd43b");
    c.fillStyle = g; c.font = "700 112px Poppins, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("Py", 128, 132);
  } },
  { name: "AI", title: "Retrieval-Augmented Generation", text: "Ground model answers in your own data with embeddings and reranking.", viz: "tree", color: "#ff8fa8", url: "https://langchain.com", draw: (c) => {
    const layers = [[[58, 78], [58, 128], [58, 178]], [[128, 56], [128, 128], [128, 200]], [[198, 98], [198, 158]]];
    c.strokeStyle = "rgba(255,170,190,.55)"; c.lineWidth = 3;
    for (let l = 0; l < layers.length - 1; l += 1) {
      layers[l].forEach((a) => layers[l + 1].forEach((b) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }));
    }
    c.fillStyle = "#ff8fa8";
    layers.flat().forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 16, 0, Math.PI * 2); c.fill(); });
  } },
  { name: "Kubernetes", title: "Container Orchestration", text: "Deploy, scale and heal services automatically across a cluster.", viz: "mesh", color: "#5b8def", url: "https://kubernetes.io", draw: (c) => {
    c.strokeStyle = "#5b8def"; c.lineWidth = 10; c.lineCap = "round";
    c.beginPath(); c.arc(128, 128, 78, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 7; i += 1) {
      const a = -Math.PI / 2 + (i / 7) * Math.PI * 2;
      c.beginPath(); c.moveTo(128 + Math.cos(a) * 20, 128 + Math.sin(a) * 20); c.lineTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); c.stroke();
    }
    c.fillStyle = "#5b8def"; c.beginPath(); c.arc(128, 128, 18, 0, Math.PI * 2); c.fill();
  } },
  { name: "Security", title: "Zero-Trust Security", text: "Verify every request, grant least privilege and log everything.", viz: "flow", color: "#5be3a0", url: "https://owasp.org", draw: (c) => {
    c.strokeStyle = "#5be3a0"; c.lineWidth = 11; c.lineJoin = "round"; c.lineCap = "round";
    c.beginPath(); c.moveTo(128, 34); c.lineTo(204, 62); c.lineTo(198, 140);
    c.quadraticCurveTo(190, 196, 128, 224); c.quadraticCurveTo(66, 196, 58, 140); c.lineTo(52, 62); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(92, 128); c.lineTo(120, 156); c.lineTo(168, 100); c.stroke();
  } },
  { name: "Encryption", title: "Encryption Everywhere", text: "TLS in transit, strong keys at rest, secrets kept out of code.", viz: "flow", color: "#ffd784", url: "https://developer.mozilla.org/docs/Web/Security", draw: (c) => {
    c.strokeStyle = "#ffd784"; c.lineWidth = 15; c.lineCap = "round";
    c.beginPath(); c.arc(128, 112, 36, Math.PI, 0); c.lineTo(164, 128); c.moveTo(92, 112); c.lineTo(92, 128); c.stroke();
    c.fillStyle = "#ffd784"; c.beginPath(); (c.roundRect || c.rect).call(c, 70, 124, 116, 90, 16); c.fill();
    c.fillStyle = "#0a1018"; c.beginPath(); c.arc(128, 160, 12, 0, Math.PI * 2); c.fill(); c.fillRect(124, 160, 8, 28);
  } },
  { name: "Cloud", title: "Autoscaling and Failover", text: "Capacity follows traffic, and a failed node never takes you down.", viz: "bars", color: "#75d9ff", url: "https://aws.amazon.com/what-is-cloud-computing", draw: (c) => {
    c.fillStyle = "#75d9ff";
    [[88, 152, 38], [130, 116, 50], [176, 150, 36]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
    c.fillRect(88, 150, 90, 40);
  } },
  { name: "Database", title: "Database Sharding", text: "Split data across nodes to scale writes and cut latency.", viz: "tree", color: "#dca65c", url: "https://postgresql.org", draw: (c) => {
    c.strokeStyle = "#dca65c"; c.lineWidth = 10; c.lineCap = "round";
    c.beginPath(); c.ellipse(128, 78, 68, 24, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(60, 78); c.lineTo(60, 182); c.moveTo(196, 78); c.lineTo(196, 182); c.stroke();
    [118, 150, 182].forEach((y) => { c.beginPath(); c.ellipse(128, y, 68, 24, 0, 0, Math.PI); c.stroke(); });
  } },
  { name: "Design", title: "Design Systems", text: "Shared tokens and components from Figma to production.", viz: "mesh", color: "#ffb84d", url: "https://figma.com", draw: (c) => {
    c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.8;
    [["#ff5d7a", 102, 106], ["#ffd784", 154, 106], ["#75d9ff", 128, 150]].forEach(([col, x, y]) => {
      c.fillStyle = col; c.beginPath(); c.arc(x, y, 52, 0, Math.PI * 2); c.fill();
    });
  } },
  { name: "Terminal", title: "CI/CD Automation", text: "Every commit is built, tested and shipped without manual steps.", viz: "flow", color: "#ffd784", url: "https://developer.mozilla.org/docs/Learn/Tools_and_testing/Understanding_client-side_tools/Command_line", draw: (c) => {
    c.strokeStyle = "#ffd784"; c.lineWidth = 10; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); (c.roundRect || c.rect).call(c, 36, 58, 184, 140, 18); c.stroke();
    c.beginPath(); c.moveTo(76, 104); c.lineTo(108, 128); c.lineTo(76, 152); c.moveTo(126, 158); c.lineTo(176, 158); c.stroke();
  } },
  { name: "API", title: "API Design", text: "Clear contracts, versioning and idempotent endpoints.", viz: "flow", color: "#ffb84d", url: "https://developer.mozilla.org/docs/Web/API", draw: (c) => {
    c.fillStyle = "#ffb84d"; c.font = "700 104px Poppins, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("{ }", 128, 130);
  } },
  { name: "LLM", title: "Agentic AI", text: "Agents that plan, call tools and act, with guardrails around them.", viz: "tree", color: "#b89cff", url: "https://anthropic.com", draw: (c) => {
    const star = (cx, cy, s) => {
      c.save(); c.translate(cx, cy); c.scale(s, s);
      c.beginPath(); c.moveTo(0, -98); c.quadraticCurveTo(0, 0, 98, 0); c.quadraticCurveTo(0, 0, 0, 98); c.quadraticCurveTo(0, 0, -98, 0); c.quadraticCurveTo(0, 0, 0, -98);
      c.fill(); c.restore();
    };
    c.fillStyle = "#b89cff"; star(112, 138, 1); star(194, 62, 0.3);
  } },
];

const TECH_NODES = [
  { name: "Signal", color: "#75d9ff", url: "https://react.dev", layer: 2, angle: 0.2, size: 0.14 },
  { name: "Cloud", color: "#dca65c", url: "https://nodejs.org", layer: 1, angle: 0.63, size: 0.17 },
  { name: "Kernel", color: "#d17887", url: "https://threejs.org", layer: 0, angle: 0.98, size: 0.15 },
  { name: "Pulse", color: "#4d9ec1", url: "https://developer.mozilla.org/docs/Web/JavaScript", layer: 2, angle: 3.48, size: 0.13 },
];

const TechNode = ({ node }) => {
  const openLink = (event) => {
    event.stopPropagation();
    window.open(badge.url, "_blank", "noopener,noreferrer");
  };
  return (
    <group
      /* Shift the entire group slightly to the right/down if needed to match the composition */
      position={node.position}
      onClick={openLink}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      <pointLight color={node.color} intensity={0.8} distance={0.8} />
      <mesh>
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshPhysicalMaterial color="#080d14" metalness={0.65} roughness={0.2} clearcoat={0.8} emissive={node.color} emissiveIntensity={0.16} />
      </mesh>
      <mesh scale={1.13}>
        <sphereGeometry args={[node.size, 20, 20]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.1} depthWrite={false} />
      </mesh>

      {/* UPDATED ROTATION: Tilts the ring forward (X) and leans it significantly down to the left (Z) */}
      <mesh rotation={[0.45, 0.1, -0.35]}>
        <torusGeometry args={[node.size * 1.5, 0.006, 6, 32]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.38} />
      </mesh>
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  Rings                                                                     */
/* -------------------------------------------------------------------------- */
const AI_TERMS = [
  "python", "transformers", "attention", "tokenization", "embeddings", "langchain", "langgraph", "rag", "chunking", "retrieval",
  "reranking", "quantization", "fine-tuning", "rlhf", "agents", "react", "orchestration", "memory", "guardrails", "jailbreaks",
  "inference", "parallelism", "caching", "llmops", "observability", "tracing", "queues",
];
const SYSTEM_TERMS = [
  "scalability", "availability", "reliability", "redundancy", "sharding", "partitioning", "replication", "microservices", "monolith",
  "idempotency", "consensus", "concurrency", "bottleneck", "loadbalancing", "caching", "serialization", "deserialization",
  "provisioning", "autoscaling", "failover", "heartbeat", "throttle", "backpressure", "deadlock", "telemetry",
];
const CLOUD_TERMS = [
  "kubernetes", "docker", "serverless", "terraform", "containers", "cdn", "devops", "cicd", "gitops", "lambda",
  "multicloud", "vpc", "iac", "helm", "observability", "edge", "s3", "ec2", "pubsub", "kafka",
];
const DESIGN_TERMS = [
  "ux", "ui", "typography", "wireframe", "prototype", "accessibility", "responsive", "design-system", "figma",
  "interaction", "layout", "motion", "usability", "components", "tokens",
];
const SECURITY_TERMS = [
  "encryption", "zero-trust", "oauth", "jwt", "sso", "firewall", "pentest", "xss", "csrf", "mfa",
  "hashing", "tls", "rbac", "sandboxing", "threat-model", "vulnerability", "audit", "secrets", "iam", "siem",
];
const FUTURE_TERMS = [...new Set([...AI_TERMS, ...SYSTEM_TERMS, ...CLOUD_TERMS, ...DESIGN_TERMS, ...SECURITY_TERMS])];
const HASHTAGS = [
  "#WEBDEV", "#UX", "#SCALABILITY", "#REACT", "#NODE", "#CLOUD", "#API", "#AI",
  "#DEVOPS", "#CYBERSECURITY", "#ZEROTRUST", "#UIDESIGN", "#LLM", "#AGENTS", "#KUBERNETES", "#SYSTEMDESIGN",
];

// Tilt: negative => bottom of the ring in front of the planet.
// Roll: positive => ring rises to the right (left side low, right side high).
const RING_TILT = -1.25;
const RING_ROLL = 0.37;
const RING_ROTATION = [RING_TILT, 0, RING_ROLL, "ZXY"];

const RING_INNER = 2.05; // planet radius is 1.55
const RING_OUTER = 4.7;

// The three wide text lanes. The moons ride these.
const RING_LAYERS = [
  { radius: 2.9, w: 0.3, rotation: RING_ROTATION, color: "#ffd784" },
  { radius: 3.55, w: 0.3, rotation: RING_ROTATION, color: "#f7d09a" },
  { radius: 4.2, w: 0.3, rotation: RING_ROTATION, color: "#ffb84d" },
];

// Thin, dense data streaks between the wide lanes (the fine "text" texture in the reference).
const DATA_LANES = [
  { radius: 2.38, w: 0.1, dense: true, speed: 0.7, color: "#ffe2a8" },
  { radius: 2.66, w: 0.1, dense: true, speed: 1.3, color: "#ffc46b" },
  { radius: 3.22, w: 0.1, dense: true, speed: 0.9, color: "#ffe2a8" },
  { radius: 3.88, w: 0.1, dense: true, speed: 1.2, color: "#ffc46b" },
  { radius: 4.5, w: 0.1, dense: true, speed: 0.8, color: "#ffe2a8" },
];

const BAND_TEXTURE_WIDTH = 8192; // use 4096 for low-end mobile GPUs

// RingGeometry has planar UVs; remap to polar (u around the ring, v across the band).
const createBandGeometry = (inner, outer, segments = 256) => {
  const geometry = new THREE.RingGeometry(inner, outer, segments, 1);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    const column = i % (segments + 1);
    const row = Math.floor(i / (segments + 1));
    uv.setXY(i, column / segments, 1 - row);
  }
  uv.needsUpdate = true;
  return geometry;
};

/* ---- the ring body: many thin glowing bands, gaps, and streaky grain ------- */
const smoothstep01 = (a, b, t) => {
  const x = Math.min(Math.max((t - a) / (b - a), 0), 1);
  return x * x * (3 - 2 * x);
};
const bandAt = (t, a, b, soft, k) => k * smoothstep01(a - soft, a + soft, t) * (1 - smoothstep01(b - soft, b + soft, t));

// t = 0 inner edge, t = 1 outer edge. The gaps are at ~0.64-0.70 and ~0.86-0.885.
const ringProfile = (t) =>
  bandAt(t, 0.02, 0.14, 0.03, 0.22) +
  bandAt(t, 0.16, 0.34, 0.03, 0.5) +
  bandAt(t, 0.36, 0.64, 0.015, 1.0) +
  bandAt(t, 0.7, 0.86, 0.012, 0.72) +
  bandAt(t, 0.885, 0.97, 0.012, 0.5) +
  bandAt(t, 0.975, 0.995, 0.004, 0.35);

const RING_COLOR_STOPS = [
  [0, [255, 244, 214]],
  [0.35, [255, 206, 120]],
  [0.7, [214, 140, 60]],
  [1, [150, 90, 40]],
];
const ringColorAt = (t) => {
  for (let i = 0; i < RING_COLOR_STOPS.length - 1; i += 1) {
    const [t0, c0] = RING_COLOR_STOPS[i];
    const [t1, c1] = RING_COLOR_STOPS[i + 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return c0.map((v, j) => v + (c1[j] - v) * k);
    }
  }
  return RING_COLOR_STOPS[RING_COLOR_STOPS.length - 1][1];
};

const useTermQueue = (terms) => {
  const queue = useRef([]);
  const previousTerm = useRef(null);

  return useCallback(() => {
    if (queue.current.length === 0) {
      const shuffled = shuffleTerms(terms);
      const differentTermIndex = shuffled.findIndex((term) => term !== previousTerm.current);

      if (previousTerm.current && shuffled[0] === previousTerm.current && differentTermIndex > 0) {
        [shuffled[0], shuffled[differentTermIndex]] = [shuffled[differentTermIndex], shuffled[0]];
      }

      queue.current.push(...shuffled);
    }

    const nextTerm = queue.current.shift();
    previousTerm.current = nextTerm;
    return nextTerm;
  }, [terms]);
};

// Tilt: negative => bottom of the ring in front of the planet, top behind (image 2)
// Roll: positive => major axis climbs to the right (~21°)
const RING_TILT = -1.25;
const RING_ROLL = 0.37;
const RING_ROTATION = [RING_TILT, 0, RING_ROLL, "ZXY"];

const RING_LAYERS = [
  { radius: 3.4, rotation: RING_ROTATION, color: "#ffd784" },
  { radius: 3.55, rotation: RING_ROTATION, color: "#b88b45" },
  { radius: 3.7, rotation: RING_ROTATION, color: "#f7d09a" },
];

const OrbitingTechNode = ({ node, phase, textures, claimBadge, reportRatio, turn, onInfoClosed }) => {
  const outer = useRef();
  const orbit = useRef();
  const probe = useRef();
  const armed = useRef(false);
  const currentBadge = useRef(node.badge);
  const openRef = useRef(false);
  const closeTimer = useRef();
  const hideTimer = useRef();
  const [badgeId, setBadgeId] = useState(node.badge);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [side, setSide] = useState(1);
  const v = useMemo(() => ({ p: new THREE.Vector3(), c: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  const layer = RING_LAYERS[node.layer];

  const closeCard = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    clearTimeout(closeTimer.current);
    setShown(false);                                        // fade + retract the line
    hideTimer.current = setTimeout(() => setMounted(false), 500); // then unmount the DOM
    onInfoClosed();
  }, [onInfoClosed]);

  // The scheduler picked this moon: open its card, close it again after INFO_DURATION.
  useEffect(() => {
    if (!turn || turn.name !== node.name || openRef.current || !probe.current || !outer.current) return;
    probe.current.getWorldPosition(v.p);
    outer.current.getWorldPosition(v.c);
    setSide(v.p.x < v.c.x ? 1 : -1); // open toward the planet, away from the headline text
    openRef.current = true;
    clearTimeout(hideTimer.current);
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    closeTimer.current = setTimeout(closeCard, INFO_DURATION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn]);

  useEffect(() => () => { clearTimeout(closeTimer.current); clearTimeout(hideTimer.current); }, []);

  useFrame(() => {
    if (orbit.current) orbit.current.rotation.z = phase.current + node.angle;
    if (!probe.current || !outer.current) return;

    probe.current.getWorldPosition(v.p);
    outer.current.getWorldPosition(v.c); // ring system origin == planet centre
    outer.current.getWorldScale(v.s);

    const scale = v.s.x;
    const dz = v.p.z - v.c.z;
    const dist = Math.hypot(v.p.x - v.c.x, v.p.y - v.c.y);
    const planetRadius = 1.55 * scale;
    const maxBack = layer.radius * Math.sin(Math.abs(RING_TILT)) * scale;

    // 1 = nearest the camera, -1 = farthest behind the planet
    const ratio = dz / maxBack;
    reportRatio(node.name, ratio);
    if (openRef.current && ratio < 0.1) closeCard(); // moon is heading round the back

    if (dz > 0.3 * maxBack) armed.current = true;
    const hidden = dz < 0 && dist < planetRadius * 0.8;
    const farthestBack = dz < -0.92 * maxBack;
    if (armed.current && (hidden || farthestBack)) {
      armed.current = false;
      closeCard();
      const next = claimBadge(currentBadge.current);
      currentBadge.current = next;
      setBadgeId(next);
    }
  });

  return (
    <group ref={outer} rotation={layer.rotation}>
      <group ref={orbit}>
        <group ref={probe} position={[layer.radius, 0, 0]}>
          <TechNode node={node} badge={BADGES[badgeId]} texture={textures[badgeId]} info={{ mounted, shown, side }} />
        </group>
      </group>
    </group>
  );
};

const DataLabel = ({ word, position, color, index, onPassBehind }) => {
  const label = useRef();
  const content = useRef();
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const laneColor = useMemo(() => new THREE.Color(color), [color]);
  const foregroundColor = useMemo(() => new THREE.Color("#fff5cf"), []);
  const resolvedColor = useMemo(() => new THREE.Color(), []);
  const hasReachedFront = useRef(false);

  useFrame(() => {
    if (!label.current || !content.current) return;
    label.current.getWorldPosition(worldPosition);
    const visibility = THREE.MathUtils.smoothstep(worldPosition.z, -1.35, 0.35);

    if (worldPosition.z > -0.2) hasReachedFront.current = true;
    if (hasReachedFront.current && worldPosition.z < -0.9) {
      hasReachedFront.current = false;
      onPassBehind();
    }
    content.current.style.opacity = `${0.08 + visibility * (0.76 - index * 0.08)}`;
    resolvedColor.copy(laneColor).lerp(foregroundColor, visibility * 0.82);
    content.current.style.color = resolvedColor.getStyle();
    content.current.style.textShadow = visibility > 0.55
      ? "0 0 5px rgba(255,245,207,.85), 0 0 13px rgba(255,182,75,.55)"
      : "0 1px 10px #100604";
  });

  return (
    <group ref={label} position={position}>
      <Html center distanceFactor={18} zIndexRange={[0, 0]} style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
        <span
          ref={content}
          style={{
            color,
            fontSize: "8px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textShadow: "0 1px 10px #100604",
            transition: "opacity 140ms linear",
          }}
        >
          {word}
        </span>
      </Html>
    </group>
  );
};

const RingLayer = ({ layer, index, phase, nextTerm }) => {
  const stream = useRef();
  const [words, setWords] = useState(() => (
    Array.from({ length: VISIBLE_TERMS_PER_RING }, () => nextTerm())
  ));

  const replaceWord = useCallback((wordIndex) => {
    setWords((currentWords) => {
      const nextWords = [...currentWords];
      nextWords[wordIndex] = nextTerm();
      return nextWords;
    });
  }, [nextTerm]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    // sun direction into view space, to match the view-space normals in the shader
    uniforms.uSun.value.copy(sunDir).transformDirection(mesh.current.matrixWorld).transformDirection(camera.matrixWorldInverse);
    const t = clock.getElapsedTime();
    uniforms.uPulse.value = 1 + 0.08 * Math.sin(t * 1.7) + 0.05 * Math.sin(t * 4.3 + 1.2);
  });

  return (
    <mesh ref={mesh} scale={1.014}>
      <sphereGeometry args={[1.55, 96, 64]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={rimVertexShader}
        fragmentShader={rimFragmentShader}
      />
    </mesh>
    <mesh scale={[1, 1, 0.994]}>
      <torusGeometry args={[layer.radius - 0.056, 0.003, 4, 180]} />
      <meshBasicMaterial color={layer.color} transparent opacity={0.22} depthWrite={false} />
    </mesh>
    <group ref={stream}>
    {words.map((word, wordIndex) => {
      const angle = (wordIndex / words.length) * Math.PI * 2 + index * 0.28;
      const x = Math.cos(angle) * layer.radius;
      const y = Math.sin(angle) * layer.radius;
      return (
        <DataLabel
          key={wordIndex}
          position={[x, y, 0.055]}
          word={word}
          color={layer.color}
          index={index}
          onPassBehind={() => replaceWord(wordIndex)}
        />
      );
    })}
    </group>
  </group>
  );
};

const usePlanetTexture = () => useMemo(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const base = context.createLinearGradient(0, 0, canvas.width, 0);
  base.addColorStop(0, "#07090f");
  base.addColorStop(0.32, "#20202c");
  base.addColorStop(0.58, "#492426");
  base.addColorStop(0.82, "#9a5834");
  base.addColorStop(1, "#f4c17c");
  context.fillStyle = base;
  context.fillRect(0, 0, canvas.width, canvas.height);

  let seed = 1977;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let band = 0; band < 54; band += 1) {
    const y = random() * canvas.height;
    const height = 2 + random() * 15;
    context.fillStyle = random() > 0.56 ? "rgba(230,141,86,.12)" : "rgba(2,4,9,.18)";
    context.fillRect(0, y, canvas.width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}, []);

const SolarFlare = () => {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    const glow = context.createRadialGradient(256, 256, 0, 256, 256, 256);
    glow.addColorStop(0, "rgba(255,255,235,1)");
    glow.addColorStop(0.08, "rgba(255,224,130,.96)");
    glow.addColorStop(0.28, "rgba(255,166,36,.34)");
    glow.addColorStop(1, "rgba(255,130,0,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 512, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  return (
    <group position={[1.42, 0.52, 0.82]}>
      <pointLight intensity={18} distance={7} color="#ffc466" />
      <sprite scale={[2.3, 2.3, 1]}><spriteMaterial map={map} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      <mesh rotation={[0, 0, Math.PI / 4]}><planeGeometry args={[3.3, 0.025]} /><meshBasicMaterial color="#ffd27a" transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      <mesh rotation={[0, 0, -Math.PI / 3]}><planeGeometry args={[2.6, 0.018]} /><meshBasicMaterial color="#ffd27a" transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    </group>
  );
};

const RotatableRingSystem = () => {
  const phase = useRef(0);
  const drag = useRef({ active: false, previousX: 0, velocity: 0 });
  const nextAiTerm = useTermQueue(AI_TERMS);
  const nextSystemTerm = useTermQueue(SYSTEM_TERMS);
  const nextFutureTerm = useTermQueue(FUTURE_TERMS);
  const termQueues = [nextAiTerm, nextSystemTerm, nextFutureTerm];

  useFrame((_, delta) => {
    if (drag.current.active) return;
    phase.current += 0.1 * delta + drag.current.velocity * delta * 8;
    drag.current.velocity = THREE.MathUtils.damp(drag.current.velocity, 0, 5, delta);
  });

  const startDrag = (event) => {
    drag.current.active = true;
    drag.current.previousX = event.clientX;
    drag.current.velocity = 0;
    document.body.style.cursor = "grabbing";
  };
  const moveDrag = (event) => {
    if (!drag.current.active) return;
    const deltaX = event.clientX - drag.current.previousX;
    phase.current += deltaX * 0.012;
    drag.current.velocity = deltaX * 0.01;
    drag.current.previousX = event.clientX;
  };
  const endDrag = () => {
    drag.current.active = false;
    document.body.style.cursor = "auto";
  };

  return (
    <group position={[0, 0, 0]}>
      <mesh
        position={[0, 0, -1.85]}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerOut={endDrag}
      >
        <circleGeometry args={[4.0, 64]} />
        <circleGeometry args={[4.4, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* ring body, debris and fine data lanes share one tilted plane */}
      <group rotation={RING_ROTATION}>
        <RingDisc phase={phase} />
        <RingDebris phase={phase} />
        {DATA_LANES.map((lane, i) => <RingTextBand key={lane.radius} layer={lane} index={i + 3} phase={phase} />)}
      </group>
      {RING_LAYERS.map((layer, index) => (
        <RingLayer key={layer.radius} layer={layer} index={index} phase={phase} nextTerm={termQueues[index]} />
      ))}
      {TECH_NODES.map((node) => <OrbitingTechNode key={node.name} node={node} phase={phase} textures={badgeTextures} claimBadge={claimBadge} reportRatio={reportRatio} turn={turn} onInfoClosed={onInfoClosed} />)}
    </group>
  );
};

const DeveloperCore = () => {
  const { size } = useThree();
  const mobile = size.width < 720;
  const planetTexture = usePlanetTexture();
  const scale = mobile ? 0.72 : 1.05;
  const position = mobile ? [0.45, -0.9, 0] : [1.2, -0.25, 0];
  return (
    <group position={position} scale={scale} rotation={[0.04, 0, 0]}>
      <ambientLight intensity={0.18} color="#283149" />
      <pointLight position={[2.5, 1.8, 3]} intensity={22} distance={8} color="#ffc466" />
      <pointLight position={[-2.4, -1.5, 2]} intensity={1.8} distance={6} color="#4a5c8c" />
      <mesh><sphereGeometry args={[1.55, 96, 64]} /><meshPhysicalMaterial map={planetTexture} color="#ffffff" roughness={0.62} metalness={0.08} clearcoat={0.16} clearcoatRoughness={0.68} /></mesh>
      <mesh scale={1.018}><sphereGeometry args={[1.55, 64, 48]} /><meshBasicMaterial color="#c48956" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} /></mesh>
      <SolarFlare />
      <RotatableRingSystem />
    </group>
  );
};

const HeroScene = () => <Canvas camera={{ position: [0, 0, 17.4], fov: 20.2, near: 0.1, far: 80 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
  <ambientLight intensity={0.14} color="#6f7fa6" />
  <CosmicDust />
  <DeveloperCore />
</Canvas>;

const Hero = () => (
  <section className="relative w-full h-screen mx-auto overflow-hidden bg-[#030812]">
    <div className="absolute inset-0 z-0"><HeroScene /></div>
    <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_66%_43%,rgba(230,129,37,0.12),transparent_24%),radial-gradient(circle_at_6%_10%,rgba(8,31,61,0.24),transparent_32%),linear-gradient(180deg,rgba(1,5,13,0.05),rgba(1,5,13,0.6)_92%)]" />
    <div className={`pointer-events-none absolute inset-0 top-[120px] z-10 max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}>
      <div className="flex flex-col justify-center items-center mt-5"><div className="w-5 h-5 rounded-full bg-[#ffc46b] shadow-[0_0_28px_rgba(255,196,107,0.85)]" /><div className="w-1 sm:h-80 h-40 bg-gradient-to-b from-[#ffc46b] via-[#b3401f] to-transparent" /></div>
      <div><p className="mb-3 text-sm font-medium uppercase tracking-[0.28em] text-[#ffd784]/85">Developer Core</p><h1 className={`${styles.heroHeadText} text-white`}>Hi, I'm <span className="text-[#ffd784]">Yash</span></h1><p className={`${styles.heroSubText} mt-2 max-w-xl text-[#e8edf8]`}>I develop Web Applications<br className="sm:block hidden" />and Maintain Developed <br className="sm:block hidden" />Applications</p><p className="mt-6 max-w-sm text-sm leading-6 text-[#d8e0ee]/60">A persistent data plane orbits the core. Drag the system to inspect the moving stream.</p></div>
    </div>
    <div className="absolute xs:bottom-10 bottom-32 z-20 w-full flex justify-center items-center"><a href="#about" aria-label="Scroll to about section"><div className="w-[35px] h-[64px] rounded-3xl border-4 border-[#ffc46b]/70 bg-[#1a0a04]/30 flex justify-center items-start p-2 shadow-[0_0_28px_rgba(255,122,42,0.24)] backdrop-blur-sm"><motion.div animate={{ y: [0, 24, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }} className="w-3 h-3 rounded-full bg-[#ffc46b] mb-1" /></div></a></div>
  </section>
);

export default Hero;
