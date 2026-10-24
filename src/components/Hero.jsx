import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";

import { styles } from "../styles";

/* -------------------------------------------------------------------------- */
/*  Quality tier: strong machines keep the original look, weaker ones step    */
/*  down counts/resolution. Resolution also adapts live (PerformanceMonitor). */
/* -------------------------------------------------------------------------- */
const COARSE =
  typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;

const detectTier = () => {
  if (typeof window === "undefined") return "mid";
  const mem = navigator.deviceMemory ?? 8; // Safari has no deviceMemory -> assume capable
  const cores = navigator.hardwareConcurrency ?? 8;
  if (window.innerWidth < 720 || mem <= 4 || cores <= 4) return "low"; // every phone lands here
  if (!COARSE && mem >= 8 && cores >= 8) return "high"; // tablets never get "high"
  return "mid";
};

const Q = {
  high: { dust: 940, bandW: 8192, rocks: 80, ringDust: 2600, dpr: 2, aniso: 16, seg: [96, 64], rays: 20, aa: true, power: "default" },
  mid: { dust: 700, bandW: 4096, rocks: 60, ringDust: 1800, dpr: 1.75, aniso: 16, seg: [64, 48], rays: 16, aa: !COARSE, power: "default" },
  low: { dust: 400, bandW: 3072, rocks: 40, ringDust: 1000, dpr: 1.75, aniso: 8, seg: [48, 32], rays: 10, aa: false, power: "low-power" },
}[detectTier()];

// Portrait screens (phones, tablets held upright) get the compact layout.
const isCompact = (size) => size.width < 720 || size.width / size.height < 1;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
const useInView = (ref, rootMargin = "120px") => {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
};

// One shared font gate so canvas textures are built once, after Poppins is ready.
const fontsPromise =
  typeof document !== "undefined" && document.fonts?.load
    ? Promise.all([document.fonts.load("600 20px Poppins"), document.fonts.load("700 20px Poppins")]).catch(() => { })
    : Promise.resolve();

const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    fontsPromise.then(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);
  return ready;
};

const whenIdle = (fn) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 800 }) : setTimeout(fn, 60));
const cancelIdle = (id) => ("cancelIdleCallback" in window ? cancelIdleCallback(id) : clearTimeout(id));

/* -------------------------------------------------------------------------- */
/*  Headlines                                                                 */
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
const DUST_COUNT = Q.dust;
const FIELD_DEPTH = 3.7;
const DUST_DRIFT_SPEED = 0.4;
const DUST_TARGET_ALPHA = 0.68;

const hexToVec3 = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

// Additive glow that leaves the canvas alpha alone.
const GLOW_BLEND = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
};

// Premultiplied additive light for the sun.
const SUN_BLEND = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneFactor,
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
      sizes.push(50 + 50 * random());
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    result.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    return result;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => ({
    iTime: { value: 0 }, iShift: { value: shift }, iAlpha: { value: 0 }, iAnimation: { value: new THREE.Vector3() },
    iResolution: { value: new THREE.Vector2(1, 1) },
    uDepth: { value: FIELD_DEPTH }, uCool: { value: hexToVec3("#b3401f") }, uWarm: { value: hexToVec3("#ffc46b") },
  }), [shift]);

  // Pixel height in device pixels; re-run when the canvas size or the adaptive dpr changes.
  const dpr = useThree((s) => s.viewport.dpr);
  useEffect(() => {
    uniforms.iResolution.value.set(size.width * dpr, size.height * dpr);
  }, [size, dpr, uniforms]);

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

// Built once, after Poppins is ready (previously built twice).
const useBadgeTextures = () => {
  const fontReady = useFontsReady();

  const textures = useMemo(() => (!fontReady ? [] : BADGES.map((badge) => {
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
  })), [fontReady]);

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  return textures;
};

/* ---------------------------- info cards ---------------------------------- */
const INFO_FIRST_DELAY = 4000;
const INFO_DURATION = 6000;
const INFO_GAP = 5000;

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

// Card + elbow leader line. The wrapper is 0x0 and sits exactly on the moon.
const InfoCard = ({ badge, side, shown, width, compact }) => {
  const edge = compact ? 40 : 64;
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
          background: compact ? "rgba(6,14,24,.9)" : "rgba(6,14,24,.78)",
          ...(compact ? {} : { backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }),
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

const noRaycast = () => null;

// A glass orb with the logo floating inside it.
const TechNode = ({ node, badge, texture, info }) => {
  const { size } = useThree();
  const compact = isCompact(size);
  const cardWidth = info.width ?? (compact ? 188 : 236);
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
      {/* per-moon pointLight removed: it sat at the sphere centre and lit no visible surface */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshPhysicalMaterial color="#0a1018" metalness={0.3} roughness={0.15} clearcoat={1} clearcoatRoughness={0.1} transparent opacity={0.78} depthWrite={false} emissive={badge.color} emissiveIntensity={0.18} />
      </mesh>
      <sprite scale={[node.size * 1.55, node.size * 1.55, 1]} renderOrder={2} raycast={noRaycast}>
        <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </sprite>
      <mesh scale={1.13} raycast={noRaycast}>
        <sphereGeometry args={[node.size, 20, 20]} />
        <meshBasicMaterial color={badge.color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.45, 0.1, -0.35]} raycast={noRaycast}>
        <torusGeometry args={[node.size * 1.5, 0.006, 6, 32]} />
        <meshBasicMaterial color={badge.color} transparent opacity={0.38} />
      </mesh>
      {COARSE && (
        <mesh>
          <sphereGeometry args={[node.size * 1.7, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      )}
      {info.mounted && (
        <Html zIndexRange={[30, 10]} style={{ pointerEvents: "none" }}>
          <InfoCard badge={badge} side={info.side} shown={info.shown} width={cardWidth} compact={compact} />
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

const RING_TILT = -1.25;
const RING_ROLL = 0.37;
const RING_ROTATION = [RING_TILT, 0, RING_ROLL, "ZXY"];

const RING_INNER = 2.05;
const RING_OUTER = 4.7;

const RING_LAYERS = [
  { radius: 2.9, w: 0.3, rotation: RING_ROTATION, color: "#ffd784" },
  { radius: 3.55, w: 0.3, rotation: RING_ROTATION, color: "#f7d09a" },
  { radius: 4.2, w: 0.3, rotation: RING_ROTATION, color: "#ffb84d" },
];

const DATA_LANES = [
  { radius: 2.38, w: 0.1, dense: true, speed: 0.7, color: "#ffe2a8" },
  { radius: 2.66, w: 0.1, dense: true, speed: 1.3, color: "#ffc46b" },
  { radius: 3.22, w: 0.1, dense: true, speed: 0.9, color: "#ffe2a8" },
  { radius: 3.88, w: 0.1, dense: true, speed: 1.2, color: "#ffc46b" },
  { radius: 4.5, w: 0.1, dense: true, speed: 0.8, color: "#ffe2a8" },
];

const BAND_TEXTURE_WIDTH = Q.bandW;

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

const smoothstep01 = (a, b, t) => {
  const x = Math.min(Math.max((t - a) / (b - a), 0), 1);
  return x * x * (3 - 2 * x);
};
const bandAt = (t, a, b, soft, k) => k * smoothstep01(a - soft, a + soft, t) * (1 - smoothstep01(b - soft, b + soft, t));

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

  const lines = Array.from({ length: 140 }, () => ({
    c: rand(), w: 0.0008 + rand() * 0.0045, a: 0.35 + rand() * 0.65,
  }));

  for (let y = 0; y < H; y += 1) {
    const t = y / (H - 1);
    let fine = 0;
    for (const l of lines) fine += l.a * Math.exp(-(((t - l.c) / l.w) ** 2));
    fine = Math.min(fine, 1);
    const base = ringProfile(t) * (0.5 + 0.7 * fine) * (0.85 + 0.3 * rand());
    const [r, g, b] = ringColorAt(t);
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
      image.data[i + 3] = 255;
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
  const texture = useMemo(() => buildRingDiscTexture(Math.min(Q.aniso, gl.capabilities.getMaxAnisotropy())), [gl]);
  useEffect(() => () => { texture.dispose(); geometry.dispose(); }, [texture, geometry]);

  useFrame(() => { texture.offset.x = (phase.current * 0.25) / (Math.PI * 2); });

  return (
    <>
      <mesh>
        <ringGeometry args={[RING_INNER - 0.1, RING_OUTER + 0.35, 128]} />
        <meshBasicMaterial color="#ff9a2e" transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial map={texture} color="#ebebeb" transparent depthWrite={false} {...GLOW_BLEND} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
};

/* ---- debris ---------------------------------------------------------------- */
const RingDebris = ({ phase }) => {
  const group = useRef();
  const rockMesh = useRef();

  const rocks = useMemo(() => {
    let seed = 2468;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    return Array.from({ length: Q.rocks }, () => {
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
    for (let i = 0; i < Q.ringDust; i += 1) {
      const t = Math.pow(rand(), 0.8);
      const radius = RING_INNER - 0.1 + t * (RING_OUTER - RING_INNER + 0.5);
      const angle = rand() * Math.PI * 2;
      positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, (rand() - 0.5) * 0.12);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useEffect(() => () => dust.dispose(), [dust]);

  useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    rocks.forEach((rock, i) => {
      euler.set(...rock.r);
      quaternion.setFromEuler(euler);
      pos.set(...rock.p);
      scl.set(rock.s, rock.s * rock.sy, rock.s);
      matrix.compose(pos, quaternion, scl);
      rockMesh.current.setMatrixAt(i, matrix);
    });
    rockMesh.current.instanceMatrix.needsUpdate = true;
  }, [rocks]);

  useFrame(() => { if (group.current) group.current.rotation.z = phase.current * 0.45; });

  return (
    <group ref={group}>
      <instancedMesh ref={rockMesh} args={[null, null, rocks.length]} raycast={noRaycast}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#1b1410" roughness={0.95} metalness={0.1} emissive="#2a1a0a" emissiveIntensity={0.45} flatShading />
      </instancedMesh>
      <points geometry={dust} raycast={noRaycast}>
        <pointsMaterial color="#ffd9a0" size={0.075} sizeAttenuation transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
};

/* ---- text lanes ------------------------------------------------------------ */
const buildRingTextTexture = ({ radius, bandWidth, color, seedOffset, anisotropy, dense }) => {
  const width = BAND_TEXTURE_WIDTH;
  const circumference = Math.PI * 2 * radius;
  const height = Math.max(dense ? 32 : 64, Math.round((width * bandWidth) / circumference));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const fontSize = Math.round(height * (dense ? 0.74 : 0.56));
  ctx.font = `600 ${fontSize}px Poppins, sans-serif`;
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${(fontSize * 0.04).toFixed(2)}px`;
  if ("textRendering" in ctx) ctx.textRendering = "geometricPrecision";
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = "round";
  // a hair of stroke thickens thin strokes so they survive minification and mipmapping
  ctx.lineWidth = Math.max(1, fontSize * 0.035);

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

  // Lay the words out once on whole pixels so both passes line up and glyph edges never straddle texels.
  const tokens = [];
  let x = 0;
  while (x < width) {
    const token = pickToken();
    const tokenWidth = ctx.measureText(token).width;
    if (x + tokenWidth > width) break; // leave a gap at the seam instead of cutting a word
    tokens.push({ token, x: Math.round(x), alpha: dense ? 0.62 : token.startsWith("#") ? 0.95 : 0.78 });
    x += tokenWidth + fontSize * (dense ? 0.9 : 1.2);
  }
  const y = Math.round(height / 2);

  // pass 1: the soft glow (original look)
  ctx.shadowColor = color;
  ctx.shadowBlur = fontSize * (dense ? 0.25 : 0.4);
  for (const t of tokens) {
    ctx.globalAlpha = t.alpha;
    ctx.fillText(t.token, t.x, y);
  }

  // pass 2: a crisp, blur-free core on top, so the letters stay readable inside the glow
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  for (const t of tokens) {
    ctx.globalAlpha = Math.min(1, t.alpha + 0.25);
    ctx.fillText(t.token, t.x, y);
    ctx.strokeText(t.token, t.x, y);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  return texture;
};

// Texture is built once, staggered, in idle time, then fades in.
const RingTextBand = ({ layer, index, phase }) => {
  const { gl } = useThree();
  const ready = useFontsReady();
  const [texture, setTexture] = useState(null);
  const material = useRef();

  const geometry = useMemo(
    () => createBandGeometry(layer.radius - layer.w / 2, layer.radius + layer.w / 2),
    [layer.radius, layer.w]
  );

  useEffect(() => {
    if (!ready) return undefined;
    let tex;
    let idle;
    const timer = setTimeout(() => {
      idle = whenIdle(() => {
        tex = buildRingTextTexture({
          radius: layer.radius,
          bandWidth: layer.w,
          color: layer.color,
          seedOffset: index,
          anisotropy: Math.min(Q.aniso, gl.capabilities.getMaxAnisotropy()),
          dense: layer.dense,
        });
        setTexture(tex);
      });
    }, index * 70);
    return () => {
      clearTimeout(timer);
      if (idle !== undefined) cancelIdle(idle);
      if (tex) tex.dispose();
      setTexture(null);
    };
  }, [ready, layer.radius, layer.w, layer.color, layer.dense, index, gl]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!texture) return;
    texture.offset.x = -(phase.current * (layer.speed || 1) + index * 0.17) / (Math.PI * 2);
    const m = material.current;
    if (m && m.opacity < 1) m.opacity = Math.min(1, m.opacity + Math.min(delta, 0.05) * 1.5);
  });

  if (!texture) return null;
  return (
    <mesh geometry={geometry} raycast={noRaycast}>
      <meshBasicMaterial ref={material} map={texture} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

const RingLayer = ({ layer, index, phase }) => (
  <group rotation={layer.rotation}>
    <mesh raycast={noRaycast}>
      <torusGeometry args={[layer.radius - layer.w / 2, 0.004, 4, 240]} />
      <meshBasicMaterial color={layer.color} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
    <mesh raycast={noRaycast}>
      <torusGeometry args={[layer.radius + layer.w / 2, 0.004, 4, 240]} />
      <meshBasicMaterial color={layer.color} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
    <RingTextBand layer={layer} index={index} phase={phase} />
  </group>
);

const OrbitingTechNode = ({ node, phase, textures, claimBadge, reportRatio, turn, onInfoClosed }) => {
  const { size, camera } = useThree();
  const [cardW, setCardW] = useState(null);
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
    setShown(false);
    hideTimer.current = setTimeout(() => setMounted(false), 500);
    onInfoClosed();
  }, [onInfoClosed]);

  useEffect(() => {
    if (!turn || turn.name !== node.name || openRef.current || !probe.current || !outer.current) return;
    probe.current.getWorldPosition(v.p);
    outer.current.getWorldPosition(v.c);
    if (isCompact(size)) {
      const ndc = v.p.clone().project(camera);
      const px = (ndc.x * 0.5 + 0.5) * size.width;
      const roomRight = size.width - px - 48;
      const roomLeft = px - 48;
      const right = roomRight >= roomLeft;
      setSide(right ? 1 : -1);
      setCardW(Math.round(Math.max(130, Math.min(188, right ? roomRight : roomLeft))));
    } else {
      setSide(v.p.x < v.c.x ? 1 : -1); // open toward the planet, away from the headline text
      setCardW(null);
    }
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
    outer.current.getWorldPosition(v.c);
    outer.current.getWorldScale(v.s);

    const scale = v.s.x;
    const dz = v.p.z - v.c.z;
    const dist = Math.hypot(v.p.x - v.c.x, v.p.y - v.c.y);
    const planetRadius = 1.55 * scale;
    const maxBack = layer.radius * Math.sin(Math.abs(RING_TILT)) * scale;

    const ratio = dz / maxBack;
    reportRatio(node.name, ratio);
    if (openRef.current && ratio < 0.1) closeCard();

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
          <TechNode node={node} badge={BADGES[badgeId]} texture={textures[badgeId]} info={{ mounted, shown, side, width: cardW }} />
        </group>
      </group>
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  Neural Core constants (declared early; used by shaders and the rim)       */
/* -------------------------------------------------------------------------- */
const CORE_RADIUS = 1.55;

/* -------------------------------------------------------------------------- */
/*  Sun: rises along the limb, holds, fades away, then rises again            */
/* -------------------------------------------------------------------------- */
const SUN_POSITION = [1.42, 0.52, 0.82];
const SUN_LIMB_RADIUS = Math.hypot(SUN_POSITION[0], SUN_POSITION[1]);
const SUN_BASE_ANGLE = Math.atan2(SUN_POSITION[1], SUN_POSITION[0]);
const SUN_SIZE = 9;
const SUN_CYCLE = 16;

const sunEnvelope = (seconds) => {
  const p = (seconds % SUN_CYCLE) / SUN_CYCLE;
  return smoothstep01(0.0, 0.26, p) * (1 - smoothstep01(0.58, 0.84, p));
};

// Ray parameters are generated once on the CPU instead of hashed per pixel on the GPU.
const RAY_COUNT = Q.rays;
const rayParams = (() => {
  let s = 99173;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const A = [];
  const B = [];
  for (let i = 0; i < RAY_COUNT; i += 1) {
    const dir = i % 2 === 0 ? 1 : -1;
    A.push(new THREE.Vector4(
      rand() * 6.28318,               // base angle
      (0.015 + rand() * 0.045) * dir, // angular speed
      0.3 + 0.7 * rand(),             // length
      0.010 + 0.026 * rand(),         // width
    ));
    B.push(new THREE.Vector4(
      0.8 + rand() * 1.4,             // length wobble frequency
      i,                              // phase
      1.3 + rand() * 2.2,             // flicker frequency
      0.35 + 0.65 * rand(),           // amplitude
    ));
  }
  return { A, B };
})();

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
  uniform float uReach;
  uniform vec4 uRayA[${RAY_COUNT}];
  uniform vec4 uRayB[${RAY_COUNT}];

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r >= 1.0) discard; // outside the disc the result is multiplied by 0 anyway
    float a = atan(p.y, p.x + 1e-5);

    float core  = exp(-r * r * 2600.0) * 1.9;
    float glare = 0.0026 / (r * r + 0.0026) * (0.55 + 0.45 * uReach);
    float bloom = exp(-r * 6.5) * 0.45;
    float haze  = exp(-r * 2.4) * 0.22;

    float rays = 0.0;
    if (r < uReach) { // no ray is longer than uReach
      for (int i = 0; i < ${RAY_COUNT}; i++) {
        vec4 A = uRayA[i];
        vec4 B = uRayB[i];
        float d = abs(mod(a - (A.x + uTime * A.y) + 3.14159, 6.28318) - 3.14159);
        if (d > A.w * 4.0) continue; // exp(-16) ~ 0, skip the expensive part
        float len = A.z * uReach * (0.9 + 0.1 * sin(uTime * B.x + B.y));
        float flick = 0.72 + 0.28 * sin(uTime * B.z + B.y * 1.7);
        rays += exp(-(d * d) / (A.w * A.w)) * (1.0 - smoothstep(0.0, max(len, 0.01), r)) * flick * B.w;
      }
      rays *= exp(-r * 1.6);
    }

    float ringD = r - 0.3;
    float halo = exp(-ringD * ringD * 420.0) * 0.1 * uReach;
    float streak = exp(-abs(p.y) * 55.0) * exp(-abs(p.x) * 2.4) * 0.2;

    vec3 hot  = vec3(1.0, 0.96, 0.82);
    vec3 warm = vec3(1.0, 0.74, 0.30);
    vec3 deep = vec3(1.0, 0.42, 0.10);

    vec3 col = hot * core
             + mix(warm, hot, clamp(glare * 1.4, 0.0, 1.0)) * glare
             + warm * (bloom + rays * 0.95 + streak)
             + deep * haze
             + vec3(1.0, 0.8, 0.5) * halo;

    col *= uIntensity * (1.0 - smoothstep(0.7, 1.0, r));
    gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
  }
`;

const SolarFlare = ({ sun }) => {
  const group = useRef();
  const mesh = useRef();
  const light = useRef();
  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uIntensity: { value: 1 }, uReach: { value: 1 },
    uRayA: { value: rayParams.A }, uRayB: { value: rayParams.B },
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const env = reduceMotion ? 1 : sunEnvelope(t);
    const progress = (t % SUN_CYCLE) / SUN_CYCLE;
    const theta = reduceMotion ? SUN_BASE_ANGLE : 0.1 + 0.52 * progress;
    const pulse = 1 + 0.06 * Math.sin(t * 1.7) + 0.04 * Math.sin(t * 4.3 + 1.2);

    sun.current.env = env;
    sun.current.pos.set(Math.cos(theta) * SUN_LIMB_RADIUS, Math.sin(theta) * SUN_LIMB_RADIUS, SUN_POSITION[2]);

    uniforms.uTime.value = t;
    uniforms.uIntensity.value = env * pulse;
    uniforms.uReach.value = 0.45 + 0.55 * env;
    if (light.current) light.current.intensity = 18 * env * pulse;
    if (group.current) group.current.position.copy(sun.current.pos);
    if (mesh.current) {
      mesh.current.visible = env > 0.003; // skip the full-screen quad while the sun is dark
      const breathe = 1 + 0.03 * Math.sin(t * 0.9);
      mesh.current.scale.set(breathe, breathe, 1);
    }
  });

  return (
    <group ref={group} position={SUN_POSITION}>
      <pointLight ref={light} intensity={18} distance={7} color="#ffc466" />
      <group rotation={[-0.04, 0, 0]}>
        <mesh ref={mesh} renderOrder={10} raycast={noRaycast}>
          <planeGeometry args={[SUN_SIZE, SUN_SIZE]} />
          <shaderMaterial
            transparent
            depthTest={false}
            depthWrite={false}
            {...SUN_BLEND}
            uniforms={uniforms}
            vertexShader={flareVertexShader}
            fragmentShader={flareFragmentShader}
          />
        </mesh>
      </group>
    </group>
  );
};

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
    vec3 tint = mix(vec3(1.0, 0.5, 0.15), vec3(1.0, 0.92, 0.62), lit);
    vec3 col = tint * fres * (0.1 + 1.5 * lit) * uPulse;
    gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
  }
`;

const PlanetRim = ({ sun }) => {
  const mesh = useRef();
  const camera = useThree((state) => state.camera);
  const uniforms = useMemo(() => ({ uSun: { value: new THREE.Vector3(1, 0.4, 0.6) }, uPulse: { value: 1 } }), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    dir.copy(sun.current.pos).normalize();
    uniforms.uSun.value.copy(dir).transformDirection(mesh.current.matrixWorld).transformDirection(camera.matrixWorldInverse);
    const t = clock.getElapsedTime();
    const pulse = 1 + 0.06 * Math.sin(t * 1.7) + 0.04 * Math.sin(t * 4.3 + 1.2);
    uniforms.uPulse.value = (0.25 + 0.75 * sun.current.env) * pulse;
  });

  return (
    <mesh ref={mesh} scale={1.014} raycast={noRaycast}>
      <sphereGeometry args={[CORE_RADIUS, ...Q.seg]} />
      <shaderMaterial transparent depthWrite={false} {...SUN_BLEND} uniforms={uniforms} vertexShader={rimVertexShader} fragmentShader={rimFragmentShader} />
    </mesh>
  );
};

/* -------------------------------------------------------------------------- */
/*  Neural Core                                                               */
/* -------------------------------------------------------------------------- */
const latticeVertexShader = `
  attribute float aT;
  attribute float aSeed;
  uniform vec3 uSun;
  varying float vT;
  varying float vSeed;
  varying float vY;
  varying float vLit;
  void main() {
    vec3 wn = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    vLit = smoothstep(-0.3, 0.9, dot(wn, normalize(uSun)));
    vT = aT;
    vSeed = aSeed;
    vY = position.y / ${CORE_RADIUS.toFixed(2)};
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const latticeFragmentShader = `
  uniform float uTime;
  uniform float uScan;
  uniform float uEnergy;
  varying float vT;
  varying float vSeed;
  varying float vY;
  varying float vLit;
  void main() {
    float head = fract(uTime * (0.18 + vSeed * 0.22) + vSeed * 7.0);
    float packet = 1.0 - smoothstep(0.0, 0.2, abs(vT - head));
    float sq = (vY - uScan) * 5.0;
    float scan = exp(-sq * sq);
    float alpha = 0.14 + 0.3 * vLit + packet * 0.95 * uEnergy + scan * 0.6;
    float hot = clamp(packet * uEnergy + scan, 0.0, 1.0);
    vec3 col = mix(vec3(1.0, 0.7, 0.28), vec3(1.0, 0.95, 0.78), hot);
    gl_FragColor = vec4(col * alpha, 0.0);
  }
`;

const nodeVertexShader = `
  attribute float aSeed;
  uniform float uTime;
  uniform float uScale;
  uniform float uSize;
  uniform vec3 uSun;
  varying float vGlow;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 wn = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    float lit = smoothstep(-0.3, 0.9, dot(wn, normalize(uSun)));
    float tw = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 1.6) + aSeed * 40.0);
    vGlow = (0.35 + 0.65 * lit) * tw;
    gl_PointSize = uSize * uScale / -mv.z * (0.7 + 0.5 * tw);
    gl_Position = projectionMatrix * mv;
  }
`;

const nodeFragmentShader = `
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    a *= a;
    gl_FragColor = vec4(vec3(1.0, 0.86, 0.5) * a * vGlow * 1.4, 0.0);
  }
`;

const buildNeuralLattice = () => {
  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const ico = new THREE.IcosahedronGeometry(CORE_RADIUS * 1.012, 3);
  const edges = new THREE.WireframeGeometry(ico);
  const count = edges.attributes.position.count;
  const aT = new Float32Array(count);
  const aSeed = new Float32Array(count);
  for (let i = 0; i < count; i += 2) {
    const s = rand();
    aT[i] = 0; aT[i + 1] = 1;
    aSeed[i] = s; aSeed[i + 1] = s;
  }
  edges.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
  edges.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));

  const seen = new Set();
  const nodePositions = [];
  const nodeSeeds = [];
  const p = ico.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    nodePositions.push(p.getX(i), p.getY(i), p.getZ(i));
    nodeSeeds.push(rand());
  }
  const nodes = new THREE.BufferGeometry();
  nodes.setAttribute("position", new THREE.Float32BufferAttribute(nodePositions, 3));
  nodes.setAttribute("aSeed", new THREE.Float32BufferAttribute(nodeSeeds, 1));

  ico.dispose();
  return { edges, nodes };
};

const NeuralCore = ({ sun }) => {
  const wrapper = useRef();
  const spin = useRef();
  const { size, camera, gl } = useThree();
  const { edges, nodes } = useMemo(buildNeuralLattice, []);
  const sunWorld = useMemo(() => new THREE.Vector3(), []);

  const latticeUniforms = useMemo(() => ({
    uTime: { value: 0 }, uScan: { value: 0 }, uEnergy: { value: 1 }, uSun: { value: new THREE.Vector3(1, 0.4, 0.6) },
  }), []);
  const nodeUniforms = useMemo(() => ({
    uTime: { value: 0 }, uScale: { value: 1000 }, uSize: { value: 0.11 }, uSun: latticeUniforms.uSun,
  }), [latticeUniforms]);

  useEffect(() => () => { edges.dispose(); nodes.dispose(); }, [edges, nodes]);

  // world units -> pixels, so node dots keep a steady on-screen size (also tracks adaptive dpr)
  const dpr = useThree((s) => s.viewport.dpr);
  useEffect(() => {
    const fov = THREE.MathUtils.degToRad(camera.fov);
    nodeUniforms.uScale.value = (size.height * dpr) / (2 * Math.tan(fov / 2));
  }, [size, camera, dpr, nodeUniforms]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spin.current) spin.current.rotation.y = t * 0.05;
    if (wrapper.current) {
      sunWorld.copy(sun.current.pos).normalize().transformDirection(wrapper.current.matrixWorld);
      latticeUniforms.uSun.value.copy(sunWorld);
    }
    latticeUniforms.uTime.value = t;
    latticeUniforms.uScan.value = Math.sin(t * 0.45) * 0.95;
    nodeUniforms.uTime.value = t;
  });

  return (
    <group ref={wrapper}>
      <mesh raycast={noRaycast}>
        <sphereGeometry args={[CORE_RADIUS, ...Q.seg]} />
        <meshPhysicalMaterial color="#0b0d14" roughness={0.38} metalness={0.55} clearcoat={0.6} clearcoatRoughness={0.3} emissive="#1a0f05" emissiveIntensity={0.5} />
      </mesh>
      <group ref={spin} rotation={[0.2, 0, 0]}>
        <lineSegments geometry={edges} raycast={noRaycast}>
          <shaderMaterial transparent depthWrite={false} {...GLOW_BLEND} uniforms={latticeUniforms} vertexShader={latticeVertexShader} fragmentShader={latticeFragmentShader} />
        </lineSegments>
        <points geometry={nodes} raycast={noRaycast}>
          <shaderMaterial transparent depthWrite={false} {...GLOW_BLEND} uniforms={nodeUniforms} vertexShader={nodeVertexShader} fragmentShader={nodeFragmentShader} />
        </points>
      </group>
    </group>
  );
};

const RotatableRingSystem = () => {
  const phase = useRef(0);
  const drag = useRef({ active: false, previousX: 0, velocity: 0 });
  const badgeTextures = useBadgeTextures();
  const shownBadges = useRef(new Set(TECH_NODES.map((n) => n.badge)));

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

  const claimBadge = useCallback((current) => {
    const free = BADGES.map((_, i) => i).filter((i) => !shownBadges.current.has(i));
    const next = free[Math.floor(Math.random() * free.length)];
    shownBadges.current.delete(current);
    shownBadges.current.add(next);
    return next;
  }, []);

  useFrame((_, delta) => {
    if (drag.current.active) return;
    const d = Math.min(delta, 0.05); // never let a long frame make the ring jump
    phase.current += 0.1 * d + drag.current.velocity * d * 8;
    drag.current.velocity = THREE.MathUtils.damp(drag.current.velocity, 0, 5, d);
  });

  const startDrag = (event) => {
    try { event.target.setPointerCapture?.(event.pointerId); } catch { /* ignore */ }
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
      <mesh position={[0, 0, -1.85]} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerOut={endDrag}>
        <circleGeometry args={[5.0, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group rotation={RING_ROTATION}>
        <RingDisc phase={phase} />
        <RingDebris phase={phase} />
        {DATA_LANES.map((lane, i) => <RingTextBand key={lane.radius} layer={lane} index={i + 3} phase={phase} />)}
      </group>
      {RING_LAYERS.map((layer, index) => (
        <RingLayer key={layer.radius} layer={layer} index={index} phase={phase} />
      ))}
      {badgeTextures.length > 0 && TECH_NODES.map((node) => (
        <OrbitingTechNode key={node.name} node={node} phase={phase} textures={badgeTextures} claimBadge={claimBadge} reportRatio={reportRatio} turn={turn} onInfoClosed={onInfoClosed} />
      ))}
    </group>
  );
};

const DeveloperCore = () => {
  const { size, viewport } = useThree();
  const sun = useRef({ pos: new THREE.Vector3(...SUN_POSITION), env: 1 });
  const keyLight = useRef();
  let scale;
  let position;
  if (isCompact(size)) {
    // portrait: planet sized to the screen width, parked in the lower half under the headline
    scale = THREE.MathUtils.clamp(viewport.width * 0.2, 0.4, 0.8);
    position = [0, -viewport.height * 0.2, 0];
  } else {
    // landscape: original layout, eased down on narrow windows (x == 1280px and up is unchanged)
    const k = THREE.MathUtils.clamp(size.width / 1280, 0.72, 1);
    scale = 1.05 * k;
    position = [1.2 * k, -0.25, 0];
  }

  useFrame(() => { if (keyLight.current) keyLight.current.intensity = 9 + 13 * sun.current.env; });

  return (
    <group position={position} scale={scale} rotation={[0.04, 0, 0]}>
      <ambientLight intensity={0.18} color="#283149" />
      <pointLight ref={keyLight} position={[2.5, 1.8, 3]} intensity={22} distance={8} color="#ffc466" />
      <pointLight position={[-2.4, -1.5, 2]} intensity={1.8} distance={6} color="#4a5c8c" />
      <NeuralCore sun={sun} />
      <PlanetRim sun={sun} />
      <SolarFlare sun={sun} />
      <RotatableRingSystem />
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  Scene: memoized so the 3.6s headline timer never re-reconciles it         */
/* -------------------------------------------------------------------------- */
const CAMERA = { position: [0, 0, 17.4], fov: 20.2, near: 0.1, far: 80 };
const GL = { antialias: Q.aa, alpha: true, stencil: false, powerPreference: Q.power };
// pan-y: vertical swipes scroll the page, horizontal drags spin the rings
const CANVAS_STYLE = {
  touchAction: "pan-y",
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
};

// Drives the demand loop: renders at most `fps` frames/s (so 120/144Hz screens don't burn power)
// and not at all while the hero is off-screen or the tab is hidden.
const FrameTicker = ({ active, fps }) => {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!active) return undefined;
    const interval = 1000 / fps - 2;
    let raf;
    let last = 0;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || now - last < interval) return;
      last = now;
      invalidate();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, fps, invalidate]);
  return null;
};

const HeroScene = memo(({ active }) => {
  const [dpr, setDpr] = useState(Q.dpr);
  const [fps, setFps] = useState(60);
  const [warm, setWarm] = useState(false);

  // don't judge performance while shaders compile and textures build
  useEffect(() => {
    const t = setTimeout(() => setWarm(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // after a mobile browser reclaims the GL context, draw again as soon as it is restored
  const handleCreated = useCallback(({ gl, invalidate }) => {
    gl.domElement.addEventListener("webglcontextrestored", () => invalidate());
  }, []);

  return (
    <Canvas camera={CAMERA} dpr={[1, dpr]} frameloop="demand" gl={GL} style={CANVAS_STYLE} onCreated={handleCreated}>
      <FrameTicker active={active} fps={fps} />
      {warm && active && (
        <PerformanceMonitor
          flipflops={3}
          bounds={() => [fps - 12, fps - 3]}
          onDecline={() => { if (dpr > 1) setDpr((d) => Math.max(1, d - 0.25)); else setFps(30); }}
          onIncline={() => { if (fps < 60) setFps(60); else setDpr((d) => Math.min(Q.dpr, d + 0.25)); }}
          onFallback={() => setDpr(1)}
        />
      )}
      <ambientLight intensity={0.14} color="#6f7fa6" />
      <CosmicDust />
      <DeveloperCore />
    </Canvas>
  );
});

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */
const Hero = () => {
  const [index, setIndex] = useState(0);
  const sectionRef = useRef(null);
  const active = useInView(sectionRef);

  // headline timer pauses while the hero is off-screen
  useEffect(() => {
    if (!active) return undefined;
    const interval = setInterval(() => setIndex((prev) => (prev + 1) % headlines.length), 3600);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <section ref={sectionRef} className="relative w-full h-screen mx-auto overflow-hidden bg-[#030812]" style={{ height: "100svh" }}>
      {/* 3D scene: receives pointer events so the rings can be dragged */}
      <div className="absolute inset-0 z-0" style={{ touchAction: "pan-y" }}><HeroScene active={active} /></div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_66%_43%,rgba(230,129,37,0.12),transparent_24%),radial-gradient(circle_at_6%_10%,rgba(8,31,61,0.24),transparent_32%),linear-gradient(180deg,rgba(1,5,13,0.05),rgba(1,5,13,0.6)_92%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-36 bg-gradient-to-b from-[#050816]/90 to-transparent" />

      <div className={`pointer-events-none absolute inset-0 top-[120px] z-10 max-w-7xl mx-auto ${styles.paddingX} lg:-translate-x-[52px] flex flex-row items-start gap-5`}>
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

          <div className="min-h-[150px] sm:min-h-[100px] mt-2 flex items-start">
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
                <p className={`${styles.heroSubText} text-white-100 leading-normal max-w-md lg:max-w-[30rem]`}>
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