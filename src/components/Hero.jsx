import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import { styles } from "../styles";

const DUST_COUNT = 720;
const FIELD_DEPTH = 3.7;

const hexToVec3 = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const dustVertexShader = `
  attribute float size;
  uniform float iTime; uniform vec3 iShift; uniform vec2 iResolution; uniform vec3 iAnimation; uniform float uDepth;
  varying float transparency; varying float warmness;
  vec3 warp3d(vec3 pos, float t) {
    pos *= 2.; pos.x += .9 * sin(.02 * t + 1.9 * pos.y) + t * .03;
    pos.y += .9 * cos(.02 * t + 1.9 * pos.x); pos.z += .9 * cos(.02 * t + 1.9 * pos.y);
    pos.z += .9 * sin(.02 * t + 1.9 * pos.x) + t * .25; return abs(pos);
  }
  void main() {
    vec3 v = uDepth * (2. * fract(warp3d(position, iTime) + iShift) - 1.) + iAnimation;
    vec4 vpos = modelViewMatrix * vec4(v, 1.); transparency = step(length(v), uDepth);
    warmness = step(.75, fract(size * 7.13)); gl_PointSize = size * iResolution.y / 1000. / -vpos.z;
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
      sizes.push(18 + 28 * random());
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
    uniforms.iTime.value = clock.getElapsedTime();
    uniforms.iAlpha.value = Math.min(clock.getElapsedTime() / 2, 1) * 0.58;
    shift.addScaledVector(camera.position, 0.0005);
  });

  return <points geometry={geometry} position={[0, 0, -1]} scale={[viewport.width / 3.8, viewport.height / 3.8, 1]}><shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={uniforms} vertexShader={dustVertexShader} fragmentShader={dustFragmentShader} /></points>;
};

const TECH_NODES = [
  { name: "React", color: "#61dafb", url: "https://react.dev", layer: 2, angle: 0.08, size: 0.24 },
  { name: "Node.js", color: "#83cd29", url: "https://nodejs.org", layer: 1, angle: 2.06, size: 0.22 },
  { name: "Three.js", color: "#dcecff", url: "https://threejs.org", layer: 0, angle: 3.78, size: 0.19 },
  { name: "JavaScript", color: "#f7df1e", url: "https://developer.mozilla.org/docs/Web/JavaScript", layer: 2, angle: 5.12, size: 0.21 },
];

const TechNode = ({ node }) => {
  const openLink = (event) => {
    event.stopPropagation();
    window.open(node.url, "_blank", "noopener,noreferrer");
  };
  return (
    <group position={node.position} onClick={openLink} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = "auto"; }}>
      <pointLight color={node.color} intensity={1.1} distance={1.05} />
      <mesh><sphereGeometry args={[node.size, 28, 28]} /><meshPhysicalMaterial color="#0a1016" metalness={0.38} roughness={0.16} clearcoat={0.9} clearcoatRoughness={0.12} emissive={node.color} emissiveIntensity={0.11} /></mesh>
      <mesh scale={0.73} position={[-node.size * 0.17, node.size * 0.12, node.size * 0.59]}><sphereGeometry args={[node.size, 18, 18]} /><meshBasicMaterial color={node.color} transparent opacity={0.42} /></mesh>
      <mesh scale={1.045}><sphereGeometry args={[node.size, 24, 24]} /><meshPhysicalMaterial color={node.color} transparent opacity={0.1} transmission={0.3} roughness={0.08} depthWrite={false} /></mesh>
      <mesh rotation={[0.22, 0.08, 0]}><torusGeometry args={[node.size * 1.18, 0.006, 6, 32]} /><meshBasicMaterial color={node.color} transparent opacity={0.38} /></mesh>
      <Html center position={[0, -(node.size + 0.18), 0]} distanceFactor={8} style={{ pointerEvents: "none", color: "#fff7ed", fontSize: "9px", fontWeight: 600, textShadow: "0 1px 8px #000", whiteSpace: "nowrap" }}>{node.name}</Html>
    </group>
  );
};

const AI_TERMS = [
  "python", "transformers", "attention", "tokenization", "embeddings", "langchain", "langgraph", "rag", "chunking", "retrieval",
  "reranking", "quantization", "fine-tuning", "rlhf", "agents", "react", "orchestration", "memory", "guardrails", "jailbreaks",
  "inference", "parallelism", "caching", "llmops", "observability", "tracing", "queues",
];

const SYSTEM_TERMS = [
  "scalability", "availability", "reliability", "redundancy", "sharding", "partitioning", "replication", "microservices", "monolith",
  "idempotency", "consensus", "concurrency", "bottleneck", "loadbalancing", "caching", "serialization", "deserialization",
  "provisioning", "autoscaling", "shifting", "failover", "heartbeat", "throttle", "backpressure", "deadlock", "telemetry",
];

const FUTURE_TERMS = [...new Set([...AI_TERMS, ...SYSTEM_TERMS])];
const VISIBLE_TERMS_PER_RING = 5;

const shuffleTerms = (terms) => {
  const shuffled = [...terms];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

const useTermQueue = (terms) => {
  const queue = useRef([]);
  const previousBatch = useRef([]);

  const getNextBatch = () => {
    while (queue.current.length < VISIBLE_TERMS_PER_RING) {
      const shuffled = shuffleTerms(terms);
      const previousLastTerm = previousBatch.current.at(-1);
      if (previousLastTerm && shuffled[0] === previousLastTerm) {
        const replacementIndex = shuffled.findIndex((term) => term !== previousLastTerm);
        [shuffled[0], shuffled[replacementIndex]] = [shuffled[replacementIndex], shuffled[0]];
      }
      queue.current.push(...shuffled);
    }
    const batch = queue.current.splice(0, VISIBLE_TERMS_PER_RING);
    previousBatch.current = batch;
    return batch;
  };

  const [visibleTerms, setVisibleTerms] = useState(getNextBatch);

  useEffect(() => {
    const timer = window.setInterval(() => setVisibleTerms(getNextBatch()), 4800);
    return () => window.clearInterval(timer);
  }, [terms]);

  return visibleTerms;
};

const RING_LAYERS = [
  {
    radius: 2.16,
    rotation: [1.29, 0.16, -0.2],
    color: "#ffe4a5",
  },
  {
    radius: 2.28,
    rotation: [1.29, 0.16, -0.2],
    color: "#ffbf65",
  },
  {
    radius: 2.4,
    rotation: [1.29, 0.16, -0.2],
    color: "#f6dcac",
  },
];

const OrbitingTechNode = ({ node, phase }) => {
  const orbit = useRef();
  const layer = RING_LAYERS[node.layer];

  useFrame(() => {
    if (orbit.current) orbit.current.rotation.z = phase.current + node.angle;
  });

  return (
    <group rotation={layer.rotation}>
      <group ref={orbit}>
        <TechNode node={{ ...node, position: [layer.radius, 0, 0] }} />
      </group>
    </group>
  );
};

const DataLabel = ({ word, position, color, index }) => {
  const label = useRef();
  const content = useRef();
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const laneColor = useMemo(() => new THREE.Color(color), [color]);
  const foregroundColor = useMemo(() => new THREE.Color("#fff5cf"), []);
  const resolvedColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!label.current || !content.current) return;
    label.current.getWorldPosition(worldPosition);
    const visibility = THREE.MathUtils.smoothstep(worldPosition.z, -1.35, 0.35);
    content.current.style.opacity = `${0.08 + visibility * (0.76 - index * 0.08)}`;
    resolvedColor.copy(laneColor).lerp(foregroundColor, visibility * 0.82);
    content.current.style.color = resolvedColor.getStyle();
    content.current.style.textShadow = visibility > 0.55
      ? "0 0 5px rgba(255,245,207,.85), 0 0 13px rgba(255,182,75,.55)"
      : "0 1px 10px #100604";
  });

  return (
    <group ref={label} position={position}>
      <Html center distanceFactor={9} style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
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

const RingLayer = ({ layer, index, phase, words }) => {
  const stream = useRef();

  useFrame(() => {
    if (stream.current) stream.current.rotation.z = phase.current + index * 0.17;
  });

  return (
  <group rotation={layer.rotation}>
    <mesh>
      <torusGeometry args={[layer.radius, 0.009, 6, 180]} />
      <meshBasicMaterial color={layer.color} transparent opacity={0.58} depthWrite={false} />
    </mesh>
    <mesh scale={[1, 1, 1.012]}>
      <torusGeometry args={[layer.radius + 0.045, 0.004, 4, 180]} />
      <meshBasicMaterial color={layer.color} transparent opacity={0.32} depthWrite={false} />
    </mesh>
    <group ref={stream}>
    {words.map((word, wordIndex) => {
      const angle = (wordIndex / words.length) * Math.PI * 2 + index * 0.28;
      const x = Math.cos(angle) * layer.radius;
      const y = Math.sin(angle) * layer.radius;
      return (
        <DataLabel
          key={`${word}-${wordIndex}`}
          position={[x, y, 0.055]}
          word={word}
          color={layer.color}
          index={index}
        />
      );
    })}
    </group>
  </group>
  );
};

const RotatableRingSystem = () => {
  const phase = useRef(0);
  const drag = useRef({ active: false, previousX: 0, velocity: 0 });
  const aiTerms = useTermQueue(AI_TERMS);
  const systemTerms = useTermQueue(SYSTEM_TERMS);
  const futureTerms = useTermQueue(FUTURE_TERMS);
  const termsByRing = [aiTerms, systemTerms, futureTerms];

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
    <group>
      <mesh
        position={[0, 0, -1.85]}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerOut={endDrag}
      >
        <circleGeometry args={[3.45, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {RING_LAYERS.map((layer, index) => (
        <RingLayer key={layer.radius} layer={layer} index={index} phase={phase} words={termsByRing[index]} />
      ))}
      {TECH_NODES.map((node) => <OrbitingTechNode key={node.name} node={node} phase={phase} />)}
    </group>
  );
};

const DeveloperCore = () => {
  const { size } = useThree();
  const mobile = size.width < 720;
  const scale = mobile ? 0.78 : 1.08;
  const position = mobile ? [0.35, -0.9, 0] : [2.05, -0.35, 0];
  return (
    <group position={position} scale={scale} rotation={[0.12, -0.38, -0.05]}>
      <pointLight position={[2.5, 1.8, 3]} intensity={24} distance={8} color="#ffb34c" />
      <pointLight position={[-2.5, -1.6, 2]} intensity={7} distance={7} color="#ff5c22" />
      <mesh><icosahedronGeometry args={[1.55, 4]} /><meshPhysicalMaterial color="#eb5a17" roughness={0.29} metalness={0.28} clearcoat={0.72} clearcoatRoughness={0.22} emissive="#6f1e09" emissiveIntensity={0.3} /></mesh>
      <mesh scale={1.012}><icosahedronGeometry args={[1.55, 3]} /><meshBasicMaterial color="#ffd59b" wireframe transparent opacity={0.3} /></mesh>
      <RotatableRingSystem />
    </group>
  );
};

const HeroScene = () => <Canvas camera={{ position: [0, 0, 8], fov: 43, near: 0.1, far: 80 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
  <ambientLight intensity={0.34} color="#fff0d0" />
  <CosmicDust />
  <DeveloperCore />
</Canvas>;

const Hero = () => (
  <section className="relative w-full h-screen mx-auto overflow-hidden bg-[#100604]">
    <div className="absolute inset-0 z-0"><HeroScene /></div>
    <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_72%_58%,rgba(255,114,32,0.18),transparent_23%),radial-gradient(circle_at_12%_15%,rgba(255,122,42,0.30),transparent_24%),linear-gradient(180deg,rgba(25,8,3,0.1),rgba(5,8,22,0.46)_85%)]" />
    <div className={`pointer-events-none absolute inset-0 top-[120px] z-10 max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}>
      <div className="flex flex-col justify-center items-center mt-5"><div className="w-5 h-5 rounded-full bg-[#ffc46b] shadow-[0_0_28px_rgba(255,196,107,0.85)]" /><div className="w-1 sm:h-80 h-40 bg-gradient-to-b from-[#ffc46b] via-[#b3401f] to-transparent" /></div>
      <div><p className="mb-3 text-sm font-medium uppercase tracking-[0.28em] text-[#ffc46b]/85">Developer Core</p><h1 className={`${styles.heroHeadText} text-white`}>Hi, I'm <span className="text-[#ffc46b]">Yash</span></h1><p className={`${styles.heroSubText} mt-2 max-w-xl text-[#f6e8d6]`}>I develop Web Applications<br className="sm:block hidden" />and Maintain Developed <br className="sm:block hidden" />Applications</p><p className="mt-6 max-w-sm text-sm leading-6 text-[#f6e8d6]/65">Continuous data bands orbit the core. Drag to rotate the tilted ring system and inspect the moving code stream.</p></div>
    </div>
    <div className="absolute xs:bottom-10 bottom-32 z-20 w-full flex justify-center items-center"><a href="#about" aria-label="Scroll to about section"><div className="w-[35px] h-[64px] rounded-3xl border-4 border-[#ffc46b]/70 bg-[#1a0a04]/30 flex justify-center items-start p-2 shadow-[0_0_28px_rgba(255,122,42,0.24)] backdrop-blur-sm"><motion.div animate={{ y: [0, 24, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }} className="w-3 h-3 rounded-full bg-[#ffc46b] mb-1" /></div></a></div>
  </section>
);

export default Hero;
