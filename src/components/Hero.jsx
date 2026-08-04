import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import { styles } from "../styles";

/* -------------------------------------------------------------------------- */
/*  Headlines (unchanged from your current Hero)                              */
/* -------------------------------------------------------------------------- */
const headlines = [
  { lead: "Because if you have an AI idea, I turn it into a", prefix: "Reliable & Scalable", highlight: "Production-Ready System." },
  { lead: "Because you need real results and ask yourself,", prefix: "How do I get AI That Actually Works in", highlight: "Production?" },
  { lead: "Because you know that,", prefix: "Your AI Idea Deserves More Than a", highlight: "Prototype." },
  { lead: "Because you're exploring the question,", prefix: "What If Your Software Could", highlight: "Think, Search & Act?" },
  { lead: "Because you need a specialist where,", prefix: "Robust Backend Engineering Meets", highlight: "Agentic AI." },
];

/* -------------------------------------------------------------------------- */
/*  Cosmic dust                                                               */
/* -------------------------------------------------------------------------- */
const DUST_COUNT = 940;
const FIELD_DEPTH = 3.7;
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
  }
  void main() {
    vec3 v = uDepth * (2. * fract(warp3d(position, iTime) + iShift) - 1.) + iAnimation;
    vec4 vpos = modelViewMatrix * vec4(v, 1.); transparency = step(length(v), uDepth);
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
      sizes.push(50 + 50 * random()); // doubled: camera is farther away now
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
  {
    name: "React", title: "Component-Driven UI", text: "Composable interfaces with predictable state and fast rendering.", viz: "flow", color: "#61dafb", url: "https://react.dev", draw: (c) => {
      c.strokeStyle = "#61dafb"; c.lineWidth = 9;
      for (let i = 0; i < 3; i += 1) {
        c.save(); c.translate(128, 128); c.rotate((i * Math.PI) / 3);
        c.beginPath(); c.ellipse(0, 0, 84, 32, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      }
      c.fillStyle = "#61dafb"; c.beginPath(); c.arc(128, 128, 13, 0, Math.PI * 2); c.fill();
    }
  },
  {
    name: "AWS", title: "Cloud Infrastructure", text: "Managed compute, storage and networking that scales on demand.", viz: "mesh", color: "#ff9900", url: "https://aws.amazon.com", draw: (c) => {
      c.fillStyle = "#ffffff"; c.font = BADGE_FONT; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("aws", 128, 98);
      c.strokeStyle = "#ff9900"; c.lineWidth = 11; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); c.moveTo(62, 156); c.quadraticCurveTo(128, 196, 194, 150); c.stroke();
      c.beginPath(); c.moveTo(176, 146); c.lineTo(196, 149); c.lineTo(192, 169); c.stroke();
    }
  },
  {
    name: "Node", title: "Event-Driven Backends", text: "Non-blocking I/O so one service handles thousands of requests.", viz: "flow", color: "#7ccf5a", url: "https://nodejs.org", draw: (c) => {
      c.strokeStyle = "#7ccf5a"; c.lineWidth = 11; c.lineJoin = "round";
      polygon(c, 128, 128, 88, 6); c.stroke();
      c.fillStyle = "#7ccf5a"; c.font = "700 74px Poppins, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("JS", 128, 132);
    }
  },
  {
    name: "Python", title: "AI and Data Pipelines", text: "Clean pipelines from raw data to models running in production.", viz: "bars", color: "#ffd43b", url: "https://python.org", draw: (c) => {
      const g = c.createLinearGradient(40, 40, 216, 216);
      g.addColorStop(0, "#5b9bd5"); g.addColorStop(1, "#ffd43b");
      c.fillStyle = g; c.font = "700 112px Poppins, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("Py", 128, 132);
    }
  },
  {
    name: "AI", title: "Retrieval-Augmented Generation", text: "Ground model answers in your own data with embeddings and reranking.", viz: "tree", color: "#ff8fa8", url: "https://langchain.com", draw: (c) => {
      const layers = [[[58, 78], [58, 128], [58, 178]], [[128, 56], [128, 128], [128, 200]], [[198, 98], [198, 158]]];
      c.strokeStyle = "rgba(255,170,190,.55)"; c.lineWidth = 3;
      for (let l = 0; l < layers.length - 1; l += 1) {
        layers[l].forEach((a) => layers[l + 1].forEach((b) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }));
      }
      c.fillStyle = "#ff8fa8";
      layers.flat().forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 16, 0, Math.PI * 2); c.fill(); });
    }
  },
  {
    name: "Kubernetes", title: "Container Orchestration", text: "Deploy, scale and heal services automatically across a cluster.", viz: "mesh", color: "#5b8def", url: "https://kubernetes.io", draw: (c) => {
      c.strokeStyle = "#5b8def"; c.lineWidth = 10; c.lineCap = "round";
      c.beginPath(); c.arc(128, 128, 78, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 7; i += 1) {
        const a = -Math.PI / 2 + (i / 7) * Math.PI * 2;
        c.beginPath(); c.moveTo(128 + Math.cos(a) * 20, 128 + Math.sin(a) * 20); c.lineTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); c.stroke();
      }
      c.fillStyle = "#5b8def"; c.beginPath(); c.arc(128, 128, 18, 0, Math.PI * 2); c.fill();
    }
  },
  {
    name: "Security", title: "Zero-Trust Security", text: "Verify every request, grant least privilege and log everything.", viz: "flow", color: "#5be3a0", url: "https://owasp.org", draw: (c) => {
      c.strokeStyle = "#5be3a0"; c.lineWidth = 11; c.lineJoin = "round"; c.lineCap = "round";
      c.beginPath(); c.moveTo(128, 34); c.lineTo(204, 62); c.lineTo(198, 140);
      c.quadraticCurveTo(190, 196, 128, 224); c.quadraticCurveTo(66, 196, 58, 140); c.lineTo(52, 62); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(92, 128); c.lineTo(120, 156); c.lineTo(168, 100); c.stroke();
    }
  },
  {
    name: "Encryption", title: "Encryption Everywhere", text: "TLS in transit, strong keys at rest, secrets kept out of code.", viz: "flow", color: "#ffd784", url: "https://developer.mozilla.org/docs/Web/Security", draw: (c) => {
      c.strokeStyle = "#ffd784"; c.lineWidth = 15; c.lineCap = "round";
      c.beginPath(); c.arc(128, 112, 36, Math.PI, 0); c.lineTo(164, 128); c.moveTo(92, 112); c.lineTo(92, 128); c.stroke();
      c.fillStyle = "#ffd784"; c.beginPath(); (c.roundRect || c.rect).call(c, 70, 124, 116, 90, 16); c.fill();
      c.fillStyle = "#0a1018"; c.beginPath(); c.arc(128, 160, 12, 0, Math.PI * 2); c.fill(); c.fillRect(124, 160, 8, 28);
    }
  },
  {
    name: "Cloud", title: "Autoscaling and Failover", text: "Capacity follows traffic, and a failed node never takes you down.", viz: "bars", color: "#75d9ff", url: "https://aws.amazon.com/what-is-cloud-computing", draw: (c) => {
      c.fillStyle = "#75d9ff";
      [[88, 152, 38], [130, 116, 50], [176, 150, 36]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
      c.fillRect(88, 150, 90, 40);
    }
  },
  {
    name: "Database", title: "Database Sharding", text: "Split data across nodes to scale writes and cut latency.", viz: "tree", color: "#dca65c", url: "https://postgresql.org", draw: (c) => {
      c.strokeStyle = "#dca65c"; c.lineWidth = 10; c.lineCap = "round";
      c.beginPath(); c.ellipse(128, 78, 68, 24, 0, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(60, 78); c.lineTo(60, 182); c.moveTo(196, 78); c.lineTo(196, 182); c.stroke();
      [118, 150, 182].forEach((y) => { c.beginPath(); c.ellipse(128, y, 68, 24, 0, 0, Math.PI); c.stroke(); });
    }
  },
  {
    name: "Design", title: "Design Systems", text: "Shared tokens and components from Figma to production.", viz: "mesh", color: "#ffb84d", url: "https://figma.com", draw: (c) => {
      c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.8;
      [["#ff5d7a", 102, 106], ["#ffd784", 154, 106], ["#75d9ff", 128, 150]].forEach(([col, x, y]) => {
        c.fillStyle = col; c.beginPath(); c.arc(x, y, 52, 0, Math.PI * 2); c.fill();
      });
    }
  },
  {
    name: "Terminal", title: "CI/CD Automation", text: "Every commit is built, tested and shipped without manual steps.", viz: "flow", color: "#ffd784", url: "https://developer.mozilla.org/docs/Learn/Tools_and_testing/Understanding_client-side_tools/Command_line", draw: (c) => {
      c.strokeStyle = "#ffd784"; c.lineWidth = 10; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); (c.roundRect || c.rect).call(c, 36, 58, 184, 140, 18); c.stroke();
      c.beginPath(); c.moveTo(76, 104); c.lineTo(108, 128); c.lineTo(76, 152); c.moveTo(126, 158); c.lineTo(176, 158); c.stroke();
    }
  },
  {
    name: "API", title: "API Design", text: "Clear contracts, versioning and idempotent endpoints.", viz: "flow", color: "#ffb84d", url: "https://developer.mozilla.org/docs/Web/API", draw: (c) => {
      c.fillStyle = "#ffb84d"; c.font = "700 104px Poppins, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("{ }", 128, 130);
    }
  },
  {
    name: "LLM", title: "Agentic AI", text: "Agents that plan, call tools and act, with guardrails around them.", viz: "tree", color: "#b89cff", url: "https://anthropic.com", draw: (c) => {
      const star = (cx, cy, s) => {
        c.save(); c.translate(cx, cy); c.scale(s, s);
        c.beginPath(); c.moveTo(0, -98); c.quadraticCurveTo(0, 0, 98, 0); c.quadraticCurveTo(0, 0, 0, 98); c.quadraticCurveTo(0, 0, -98, 0); c.quadraticCurveTo(0, 0, 0, -98);
        c.fill(); c.restore();
      };
      c.fillStyle = "#b89cff"; star(112, 138, 1); star(194, 62, 0.3);
    }
  },
];

const TECH_NODES = [
  { name: "Signal", layer: 2, angle: 0.2, size: 0.21, badge: 0 },
  { name: "Cloud", layer: 1, angle: 0.63, size: 0.24, badge: 1 },
  { name: "Kernel", layer: 0, angle: 0.98, size: 0.22, badge: 4 },
  { name: "Pulse", layer: 2, angle: 3.48, size: 0.2, badge: 6 },
];

const useBadgeTextures = () => {
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const done = () => alive && setFontReady(true);
    if (document.fonts?.load) document.fonts.load("700 20px Poppins").then(done, done);
    else done();
    return () => { alive = false; };
  }, []);

  const textures = useMemo(() => BADGES.map((badge) => {
    const canvas = document.createElement("canvas");
    canvas.width = BADGE_SIZE;
    canvas.height = BADGE_SIZE;
    const c = canvas.getContext("2d");
    c.shadowColor = badge.color;
    c.shadowBlur = 14;
    badge.draw(c);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [fontReady]);

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  return textures;
};

/* ---------------------------- info cards ---------------------------------- */
const INFO_FIRST_DELAY = 4000; // first card appears after 4s
const INFO_DURATION = 6000;    // each card stays for 6s, then closes by itself
const INFO_GAP = 5000;         // pause before the next moon opens its card

const MiniDiagram = ({ kind, color }) => {
  const line = { stroke: color, strokeWidth: 1.4, fill: "none", strokeOpacity: 0.9 };
  let body = null;

  if (kind === "flow") {
    body = (
      <>
        {[8, 84, 160].map((x) => <rect key={x} x={x} y={19} width={52} height={26} rx={6} {...line} fill={`${color}22`} />)}
        <path d="M60 32 H84 M136 32 H160" {...line} />
        <circle r="3" fill={color}><animateMotion dur="2.2s" repeatCount="indefinite" path="M60 32 H84" /></circle>
        <circle r="3" fill={color}><animateMotion dur="2.2s" begin="1.1s" repeatCount="indefinite" path="M136 32 H160" /></circle>
      </>
    );
  } else if (kind === "mesh") {
    const pts = [[20, 14], [20, 50], [62, 32], [104, 12], [104, 52], [146, 32], [188, 16], [188, 48]];
    const links = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7]];
    body = (
      <>
        {links.map(([a, b]) => <line key={`${a}-${b}`} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} {...line} strokeOpacity={0.55} />)}
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={5} fill={color}>
            <animate attributeName="opacity" values="1;.35;1" dur={`${2 + (i % 3) * 0.6}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </>
    );
  } else if (kind === "bars") {
    body = [18, 30, 24, 44, 36, 52, 40].map((h, i) => (
      <rect key={i} x={14 + i * 28} y={60 - h} width={16} height={h} rx={3} fill={`${color}55`} stroke={color} strokeWidth={1.2} />
    ));
  } else {
    const leaves = [10, 26, 42, 58];
    body = (
      <>
        {leaves.map((y) => <path key={y} d={`M26 34 C 90 34, 110 ${y}, 172 ${y}`} {...line} strokeOpacity={0.7} />)}
        <circle cx={26} cy={34} r={8} fill={`${color}33`} stroke={color} strokeWidth={1.4} />
        {leaves.map((y) => <circle key={`l${y}`} cx={180} cy={y} r={5} fill={color} />)}
      </>
    );
  }

  return <svg viewBox="0 0 220 64" width="100%" height="56" style={{ display: "block" }}>{body}</svg>;
};

// Card + elbow leader line. The wrapper is 0x0 and sits exactly on the moon,
// so everything below is positioned relative to the moon's centre.
const InfoCard = ({ badge, side, shown, width }) => {
  const edge = 64;
  const attach = -86;
  return (
    <div style={{ position: "relative", width: 0, height: 0, fontFamily: "Poppins, Arial, sans-serif" }}>
      <svg width="1" height="1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path
          d={`M0 -34 V ${attach} H ${side * edge}`}
          fill="none" stroke={badge.color} strokeWidth="1.2" strokeOpacity="0.85"
          pathLength="1" strokeDasharray="1" strokeDashoffset={shown ? 0 : 1}
          style={{ transition: "stroke-dashoffset 600ms ease-out" }}
        />
        <circle cx="0" cy="-34" r="2.5" fill={badge.color} style={{ opacity: shown ? 1 : 0, transition: "opacity 300ms" }} />
      </svg>
      <div
        style={{
          position: "absolute", bottom: edge, [side > 0 ? "left" : "right"]: edge, width,
          borderRadius: 10, overflow: "hidden", whiteSpace: "normal",
          border: `1px solid ${badge.color}88`,
          background: "rgba(6,14,24,.78)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          boxShadow: `0 0 26px ${badge.color}33, inset 0 0 18px ${badge.color}14`,
          opacity: shown ? 1 : 0,
          transform: shown ? "translateY(0) scale(1)" : "translateY(8px) scale(.96)",
          transformOrigin: side > 0 ? "bottom left" : "bottom right",
          transition: "opacity 400ms ease, transform 400ms ease",
        }}
      >
        <div style={{ padding: "8px 12px", fontSize: 12.5, fontWeight: 600, color: "#eaf6fb", borderBottom: `1px solid ${badge.color}44`, background: `linear-gradient(90deg, ${badge.color}33, transparent)` }}>
          {badge.title}
        </div>
        <div style={{ padding: "10px 12px 12px" }}>
          <MiniDiagram kind={badge.viz} color={badge.color} />
          <p style={{ margin: "8px 0 0", fontSize: 11.5, lineHeight: 1.45, color: "#b9cbd6" }}>{badge.text}</p>
        </div>
      </div>
    </div>
  );
};

// A glass orb with the logo floating inside it, like the reference.
const TechNode = ({ node, badge, texture, info }) => {
  const { size } = useThree();
  const cardWidth = size.width < 720 ? 192 : 236;
  const openLink = (event) => {
    event.stopPropagation();
    window.open(badge.url, "_blank", "noopener,noreferrer");
  };
  return (
    <group
      onClick={openLink}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      <pointLight color={badge.color} intensity={0.8} distance={1} />
      <mesh renderOrder={1}>
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshPhysicalMaterial color="#0a1018" metalness={0.3} roughness={0.15} clearcoat={1} clearcoatRoughness={0.1} transparent opacity={0.78} depthWrite={false} emissive={badge.color} emissiveIntensity={0.18} />
      </mesh>
      <sprite scale={[node.size * 1.55, node.size * 1.55, 1]} renderOrder={2}>
        <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </sprite>
      <mesh scale={1.13}>
        <sphereGeometry args={[node.size, 20, 20]} />
        <meshBasicMaterial color={badge.color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.45, 0.1, -0.35]}>
        <torusGeometry args={[node.size * 1.5, 0.006, 6, 32]} />
        <meshBasicMaterial color={badge.color} transparent opacity={0.38} />
      </mesh>
      {info.mounted && (
        <Html zIndexRange={[30, 10]} style={{ pointerEvents: "none" }}>
          <InfoCard badge={badge} side={info.side} shown={info.shown} width={cardWidth} />
        </Html>
      )}
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

const buildRingDiscTexture = (anisotropy) => {
  const W = 1024;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(W, H);

  let seed = 7331;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // fine concentric lines, like the reference's dozens of thin ringlets
  const lines = Array.from({ length: 140 }, () => ({
    c: rand(), w: 0.0008 + rand() * 0.0045, a: 0.35 + rand() * 0.65,
  }));

  for (let y = 0; y < H; y += 1) {
    const t = y / (H - 1); // canvas top = inner edge (flipY maps it to v = 1)
    let fine = 0;
    for (const l of lines) fine += l.a * Math.exp(-(((t - l.c) / l.w) ** 2));
    fine = Math.min(fine, 1);
    const base = ringProfile(t) * (0.5 + 0.7 * fine) * (0.85 + 0.3 * rand());
    const [r, g, b] = ringColorAt(t);
    // integer frequencies keep the streaks seamless where the texture wraps
    const f1 = 2 + Math.floor(rand() * 12);
    const f2 = 3 + Math.floor(rand() * 17);
    const p1 = rand() * Math.PI * 2;
    const p2 = rand() * Math.PI * 2;
    for (let x = 0; x < W; x += 1) {
      const u = x / W;
      const streak = 0.78 + 0.22 * Math.sin(u * Math.PI * 2 * f1 + p1) * Math.sin(u * Math.PI * 2 * f2 + p2);
      const k = Math.min(Math.max(base * streak, 0), 1.15);
      const i = (y * W + x) * 4;
      image.data[i] = Math.min(255, r * k);
      image.data[i + 1] = Math.min(255, g * k);
      image.data[i + 2] = Math.min(255, b * k);
      image.data[i + 3] = 255; // intensity is baked into RGB; the material blends additively
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  return texture;
};

const RingDisc = ({ phase }) => {
  const { gl } = useThree();
  const geometry = useMemo(() => createBandGeometry(RING_INNER, RING_OUTER, 384), []);
  const texture = useMemo(() => buildRingDiscTexture(gl.capabilities.getMaxAnisotropy()), [gl]);
  useEffect(() => () => { texture.dispose(); geometry.dispose(); }, [texture, geometry]);

  // the grain slides slowly around the ring so the bands shimmer
  useFrame(() => { texture.offset.x = (phase.current * 0.25) / (Math.PI * 2); });

  return (
    <>
      {/* faint warm haze under the bands */}
      <mesh>
        <ringGeometry args={[RING_INNER - 0.1, RING_OUTER + 0.35, 128]} />
        <meshBasicMaterial color="#ff9a2e" transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial map={texture} transparent opacity={0.92} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
};

/* ---- debris: dark rocks plus glittering dust drifting in the ring plane ---- */
const RingDebris = ({ phase }) => {
  const group = useRef();
  const rockMesh = useRef();

  const rocks = useMemo(() => {
    let seed = 2468;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    return Array.from({ length: 80 }, () => {
      const radius = RING_INNER + 0.1 + rand() * (RING_OUTER - RING_INNER);
      const angle = rand() * Math.PI * 2;
      return {
        p: [Math.cos(angle) * radius, Math.sin(angle) * radius, (rand() - 0.5) * 0.08],
        s: 0.022 + rand() * rand() * 0.075,
        sy: 0.6 + rand() * 0.6,
        r: [rand() * 6, rand() * 6, rand() * 6],
      };
    });
  }, []);

  const dust = useMemo(() => {
    let seed = 1357;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const positions = [];
    for (let i = 0; i < 2600; i += 1) {
      const t = Math.pow(rand(), 0.8);
      const radius = RING_INNER - 0.1 + t * (RING_OUTER - RING_INNER + 0.5);
      const angle = rand() * Math.PI * 2;
      positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, (rand() - 0.5) * 0.12);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    rocks.forEach((rock, i) => {
      euler.set(...rock.r);
      quaternion.setFromEuler(euler);
      matrix.compose(new THREE.Vector3(...rock.p), quaternion, new THREE.Vector3(rock.s, rock.s * rock.sy, rock.s));
      rockMesh.current.setMatrixAt(i, matrix);
    });
    rockMesh.current.instanceMatrix.needsUpdate = true;
  }, [rocks]);

  // debris drifts a little slower than the text lanes
  useFrame(() => { if (group.current) group.current.rotation.z = phase.current * 0.45; });

  return (
    <group ref={group}>
      <instancedMesh ref={rockMesh} args={[null, null, rocks.length]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#1b1410" roughness={0.95} metalness={0.1} emissive="#2a1a0a" emissiveIntensity={0.45} flatShading />
      </instancedMesh>
      <points geometry={dust}>
        <pointsMaterial color="#ffd9a0" size={0.075} sizeAttenuation transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
};

/* ---- text lanes (wide ones carry the moons, thin ones are dense data) ------ */
const buildRingTextTexture = ({ radius, bandWidth, color, seedOffset, anisotropy, dense }) => {
  const width = BAND_TEXTURE_WIDTH;
  const circumference = Math.PI * 2 * radius;
  const height = Math.max(dense ? 32 : 64, Math.round((width * bandWidth) / circumference));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const fontSize = Math.round(height * (dense ? 0.68 : 0.52));
  ctx.font = `600 ${fontSize}px Poppins, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = fontSize * (dense ? 0.25 : 0.4);

  let seed = 9001 + seedOffset * 131;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const pickToken = () => {
    if (!dense && rand() < 0.25) return HASHTAGS[Math.floor(rand() * HASHTAGS.length)];
    const word = FUTURE_TERMS[Math.floor(rand() * FUTURE_TERMS.length)];
    return dense ? word.toLowerCase() : word.toUpperCase();
  };

  let x = 0;
  while (x < width) {
    const token = pickToken();
    ctx.globalAlpha = dense ? 0.62 : token.startsWith("#") ? 0.95 : 0.78;
    ctx.fillStyle = color;
    const tokenWidth = ctx.measureText(token).width;
    if (x + tokenWidth > width) break; // leave a gap at the seam instead of cutting a word
    ctx.fillText(token, x, height / 2);
    x += tokenWidth + fontSize * (dense ? 0.9 : 1.2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  return texture;
};

const RingTextBand = ({ layer, index, phase }) => {
  const { gl } = useThree();
  const [fontReady, setFontReady] = useState(false);

  // The canvas is drawn once, so wait for Poppins before building the texture.
  useEffect(() => {
    let alive = true;
    const done = () => alive && setFontReady(true);
    if (document.fonts?.load) document.fonts.load("600 20px Poppins").then(done, done);
    else done();
    return () => { alive = false; };
  }, []);

  const geometry = useMemo(
    () => createBandGeometry(layer.radius - layer.w / 2, layer.radius + layer.w / 2),
    [layer.radius, layer.w]
  );
  const texture = useMemo(
    () => buildRingTextTexture({
      radius: layer.radius,
      bandWidth: layer.w,
      color: layer.color,
      seedOffset: index,
      anisotropy: gl.capabilities.getMaxAnisotropy(),
      dense: layer.dense,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layer.radius, layer.w, layer.color, layer.dense, index, gl, fontReady]
  );

  useEffect(() => () => { texture.dispose(); geometry.dispose(); }, [texture, geometry]);

  useFrame(() => {
    texture.offset.x = -(phase.current * (layer.speed || 1) + index * 0.17) / (Math.PI * 2);
  });

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial map={texture} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

// Thin rails along both edges of a wide text lane.
const RingLayer = ({ layer, index, phase }) => (
  <group rotation={layer.rotation}>
    <mesh>
      <torusGeometry args={[layer.radius - layer.w / 2, 0.004, 4, 240]} />
      <meshBasicMaterial color={layer.color} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
    <mesh>
      <torusGeometry args={[layer.radius + layer.w / 2, 0.004, 4, 240]} />
      <meshBasicMaterial color={layer.color} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
    <RingTextBand layer={layer} index={index} phase={phase} />
  </group>
);

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

/* -------------------------------------------------------------------------- */
/*  Planet, flare, ring system                                                */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*  Sun: hot core, bloom, long rays, lit planet rim                           */
/* -------------------------------------------------------------------------- */
const SUN_POSITION = [1.42, 0.52, 0.82];
const SUN_SIZE = 7; // world units; the flare fades to nothing before the plane's edge

const flareVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flareFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;

  float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float a = atan(p.y, p.x);

    // white-hot core, orange bloom, wide warm haze
    float core  = exp(-r * r * 1100.0) * 1.8;
    float bloom = exp(-r * 9.0) * 0.85;
    float haze  = exp(-r * 3.0) * 0.32;

    // long thin rays that slowly turn and flicker, each with its own length and width
    float rays = 0.0;
    for (int i = 0; i < 20; i++) {
      float fi = float(i);
      float dir = (mod(fi, 2.0) < 1.0) ? 1.0 : -1.0;
      float ang = hash(fi + 1.0) * 6.28318 + uTime * (0.015 + hash(fi + 7.0) * 0.045) * dir;
      float d = abs(mod(a - ang + 3.14159, 6.28318) - 3.14159);
      float len = 0.3 + 0.7 * hash(fi + 13.0);
      len *= 0.9 + 0.1 * sin(uTime * (0.8 + hash(fi + 3.0) * 1.4) + fi);   // rays breathe in length
      float width = 0.010 + 0.026 * hash(fi + 21.0);
      float flick = 0.72 + 0.28 * sin(uTime * (1.3 + hash(fi + 5.0) * 2.2) + fi * 1.7);
      rays += exp(-(d * d) / (width * width)) * smoothstep(len, 0.0, r) * flick * (0.35 + 0.65 * hash(fi + 31.0));
    }
    rays *= exp(-r * 1.6);

    // faint horizontal lens streak
    float streak = exp(-abs(p.y) * 55.0) * exp(-abs(p.x) * 2.4) * 0.22;

    vec3 col = vec3(1.0, 0.95, 0.78) * core
             + vec3(1.0, 0.74, 0.28) * (bloom + rays * 0.95 + streak)
             + vec3(1.0, 0.46, 0.10) * haze;

    float edge = smoothstep(1.0, 0.72, r);
    gl_FragColor = vec4(col * uIntensity * edge, 1.0);
  }
`;

const SolarFlare = () => {
  const group = useRef();
  const mesh = useRef();
  const light = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uIntensity: { value: 1 } }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + 0.08 * Math.sin(t * 1.7) + 0.05 * Math.sin(t * 4.3 + 1.2);
    uniforms.uTime.value = t;
    uniforms.uIntensity.value = pulse;
    if (light.current) light.current.intensity = 18 * pulse;
    if (group.current) {
      // the sun creeps a little along the planet's limb
      group.current.position.set(
        SUN_POSITION[0] + Math.sin(t * 0.21) * 0.07,
        SUN_POSITION[1] + Math.cos(t * 0.17) * 0.05,
        SUN_POSITION[2]
      );
    }
    if (mesh.current) {
      const breathe = 1 + 0.03 * Math.sin(t * 0.9);
      mesh.current.scale.set(breathe, breathe, 1);
    }
  });

  return (
    <group ref={group} position={SUN_POSITION}>
      <pointLight ref={light} intensity={18} distance={7} color="#ffc466" />
      {/* counter-rotate the planet's tilt so the flare plane faces the camera */}
      <group rotation={[-0.04, 0, 0]}>
        <mesh ref={mesh} renderOrder={10}>
          <planeGeometry args={[SUN_SIZE, SUN_SIZE]} />
          <shaderMaterial
            transparent
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={uniforms}
            vertexShader={flareVertexShader}
            fragmentShader={flareFragmentShader}
          />
        </mesh>
      </group>
    </group>
  );
};

// Thin golden rim along the planet's limb, strongest on the side facing the sun.
const rimVertexShader = `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const rimFragmentShader = `
  uniform vec3 uSun;
  uniform float uPulse;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 n = normalize(vN);
    float fres = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 3.0);
    float lit = smoothstep(-0.1, 0.85, dot(n, normalize(uSun)));
    vec3 col = mix(vec3(1.0, 0.5, 0.15), vec3(1.0, 0.92, 0.62), lit);
    gl_FragColor = vec4(col * fres * (0.1 + 1.5 * lit) * uPulse, 1.0);
  }
`;

const PlanetRim = () => {
  const mesh = useRef();
  const camera = useThree((state) => state.camera);
  const uniforms = useMemo(() => ({ uSun: { value: new THREE.Vector3(1, 0.4, 0.6) }, uPulse: { value: 1 } }), []);
  const sunDir = useMemo(() => new THREE.Vector3(...SUN_POSITION).normalize(), []);

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
  );
};

const RotatableRingSystem = () => {
  const phase = useRef(0);
  const drag = useRef({ active: false, previousX: 0, velocity: 0 });
  const badgeTextures = useBadgeTextures();
  const shownBadges = useRef(new Set(TECH_NODES.map((n) => n.badge)));

  // Info-card scheduler: every few seconds one moon that is on the front of the ring opens its card.
  const moonRatios = useRef({});
  const lastInfoMoon = useRef(null);
  const infoTimer = useRef();
  const [turn, setTurn] = useState(null);

  const reportRatio = useCallback((name, ratio) => { moonRatios.current[name] = ratio; }, []);

  const scheduleNext = useCallback((delay) => {
    clearTimeout(infoTimer.current);
    const pick = () => {
      const front = Object.keys(moonRatios.current).filter((n) => moonRatios.current[n] > 0.45);
      if (!front.length) { infoTimer.current = setTimeout(pick, 1000); return; }
      const fresh = front.filter((n) => n !== lastInfoMoon.current);
      const pool = fresh.length ? fresh : front;
      const name = pool[Math.floor(Math.random() * pool.length)];
      lastInfoMoon.current = name;
      setTurn({ name, key: Date.now() });
    };
    infoTimer.current = setTimeout(pick, delay);
  }, []);

  const onInfoClosed = useCallback(() => scheduleNext(INFO_GAP), [scheduleNext]);

  useEffect(() => {
    scheduleNext(INFO_FIRST_DELAY);
    return () => clearTimeout(infoTimer.current);
  }, [scheduleNext]);

  // Hands a moon a new badge that no other moon is currently showing.
  const claimBadge = useCallback((current) => {
    const free = BADGES.map((_, i) => i).filter((i) => !shownBadges.current.has(i));
    const next = free[Math.floor(Math.random() * free.length)];
    shownBadges.current.delete(current);
    shownBadges.current.add(next);
    return next;
  }, []);

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
      <mesh position={[0, 0, -1.85]} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerOut={endDrag}>
        <circleGeometry args={[5.0, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* ring body, debris and fine data lanes share one tilted plane */}
      <group rotation={RING_ROTATION}>
        <RingDisc phase={phase} />
        <RingDebris phase={phase} />
        {DATA_LANES.map((lane, i) => <RingTextBand key={lane.radius} layer={lane} index={i + 3} phase={phase} />)}
      </group>
      {RING_LAYERS.map((layer, index) => (
        <RingLayer key={layer.radius} layer={layer} index={index} phase={phase} />
      ))}
      {TECH_NODES.map((node) => <OrbitingTechNode key={node.name} node={node} phase={phase} textures={badgeTextures} claimBadge={claimBadge} reportRatio={reportRatio} turn={turn} onInfoClosed={onInfoClosed} />)}
    </group>
  );
};

const DeveloperCore = () => {
  const { size } = useThree();
  const mobile = size.width < 720;
  const planetTexture = usePlanetTexture();
  const scale = mobile ? 0.5 : 1.05;
  const position = mobile ? [0, -1.6, 0] : [1.2, -0.25, 0];

  return (
    <group position={position} scale={scale} rotation={[0.04, 0, 0]}>
      <ambientLight intensity={0.18} color="#283149" />
      <pointLight position={[2.5, 1.8, 3]} intensity={22} distance={8} color="#ffc466" />
      <pointLight position={[-2.4, -1.5, 2]} intensity={1.8} distance={6} color="#4a5c8c" />
      <mesh>
        <sphereGeometry args={[1.55, 96, 64]} />
        <meshPhysicalMaterial map={planetTexture} color="#ffffff" roughness={0.62} metalness={0.08} clearcoat={0.16} clearcoatRoughness={0.68} />
      </mesh>
      <PlanetRim />
      <SolarFlare />
      <RotatableRingSystem />
    </group>
  );
};

// Far camera + narrow fov = flat perspective, so the ring's near half doesn't balloon off-screen.
const HeroScene = () => (
  <Canvas camera={{ position: [0, 0, 17.4], fov: 20.2, near: 0.1, far: 80 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={0.14} color="#6f7fa6" />
    <CosmicDust />
    <DeveloperCore />
  </Canvas>
);

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */
const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((prev) => (prev + 1) % headlines.length), 3600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-screen mx-auto overflow-hidden bg-[#030812]">
      {/* 3D scene: receives pointer events so the rings can be dragged */}
      <div className="absolute inset-0 z-0"><HeroScene /></div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_66%_43%,rgba(230,129,37,0.12),transparent_24%),radial-gradient(circle_at_6%_10%,rgba(8,31,61,0.24),transparent_32%),linear-gradient(180deg,rgba(1,5,13,0.05),rgba(1,5,13,0.6)_92%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-36 bg-gradient-to-b from-[#050816]/90 to-transparent" />

      <div className={`pointer-events-none absolute inset-0 top-[120px] z-10 max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}>
        <div className="flex flex-col justify-center items-center mt-5">
          <div className="w-5 h-5 rounded-full bg-[#ffc46b] shadow-[0_0_28px_rgba(255,196,107,0.85)]" />
          <div className="w-1 sm:h-80 h-40 bg-gradient-to-b from-[#ffc46b] via-[#b3401f] to-transparent" />
        </div>

        <div>
          <h1 className={`${styles.heroHeadText} text-white`}>
            Hi, I'm <span className="text-[#ffd784]">Yash</span>
          </h1>

          <p className="text-secondary font-medium lg:text-[22px] sm:text-[18px] text-[15px] mt-1">
            And you are here for a Reason
          </p>

          <div className="min-h-[110px] sm:min-h-[100px] mt-2 flex items-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <p className="text-secondary font-medium lg:text-[20px] sm:text-[17px] text-[14px] mb-1">
                  {headlines[index].lead}
                </p>
                <p className={`${styles.heroSubText} text-white-100 leading-normal max-w-xl`}>
                  <span>{headlines[index].prefix} </span>
                  <span className="text-[#ffd784] font-bold">{headlines[index].highlight}</span>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="absolute xs:bottom-10 bottom-32 z-20 w-full flex justify-center items-center">
        <a href="#about" aria-label="Scroll to about section">
          <div className="w-[35px] h-[64px] rounded-3xl border-4 border-[#ffc46b]/70 bg-[#1a0a04]/30 flex justify-center items-start p-2 shadow-[0_0_28px_rgba(255,122,42,0.24)] backdrop-blur-sm">
            <motion.div
              animate={{ y: [0, 24, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
              className="w-3 h-3 rounded-full bg-[#ffc46b] mb-1"
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
