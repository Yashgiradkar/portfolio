import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { styles } from "../styles";
import { ComputersCanvas } from "./canvas";

const DUST_COUNT = 940;
const FIELD_DEPTH = 3.7;
const DRIFT_SPEED = 0.4;
const TARGET_ALPHA = 0.68;

const hexToVec3 = (hex) => {
  const n = parseInt(hex.slice(1), 16);

  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255
  );
};

const dustVertexShader = `
  attribute float size;
  uniform float iTime;
  uniform vec3 iShift;
  uniform vec2 iResolution;
  uniform vec3 iAnimation;
  uniform float uDepth;
  varying float transparency;
  varying float warmness;

  vec3 warp3d(vec3 pos, float t) {
    float curv = 0.9, a = 1.9, b = 0.25, b2 = 0.03, c = 0.02;
    pos *= 2.;
    pos.x += curv * sin(c * t + a * pos.y) + t * b2;
    pos.y += curv * cos(c * t + a * pos.x);
    pos.z += curv * cos(c * t + a * pos.y);
    pos.z += curv * sin(c * t + a * pos.x) + t * b;
    pos.z = abs(pos.z);
    return pos.xyz;
  }

  void main() {
    vec3 v = warp3d(position, iTime);
    v = uDepth * (2. * fract(v + iShift) - 1.) + iAnimation;
    vec4 vpos = modelViewMatrix * vec4(v, 1.);
    transparency = step(length(v), uDepth);
    warmness = step(.75, fract(size * 7.13));
    gl_PointSize = size * iResolution.y / 1000. / -vpos.z;
    gl_Position = projectionMatrix * vpos;
  }
`;

const dustFragmentShader = `
  varying float transparency;
  varying float warmness;
  uniform float iAlpha;
  uniform vec3 uCool;
  uniform vec3 uWarm;

  void main() {
    vec3 color = mix(uCool * .8, uWarm * .8, warmness);
    float tex = smoothstep(1., .3, length(2. * gl_PointCoord - 1.));
    gl_FragColor = vec4(tex * color, tex * transparency * iAlpha);
  }
`;

const CosmicDust = () => {
  const shift = useMemo(() => new THREE.Vector3(), []);
  const { camera, size, viewport } = useThree();

  const geometry = useMemo(() => {
    const positions = [];
    const sizes = [];

    for (let i = 0; i < DUST_COUNT; i += 1) {
      positions.push(
        2 * Math.random() - 1,
        2 * Math.random() - 1,
        2 * Math.random() - 1
      );
      sizes.push(25 + 25 * Math.random());
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    dustGeometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(sizes, 1)
    );

    return dustGeometry;
  }, []);

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iShift: { value: shift },
      iAlpha: { value: 0 },
      iAnimation: { value: new THREE.Vector3(0, 0, 0) },
      iResolution: {
        value: new THREE.Vector2(
          window.innerWidth * window.devicePixelRatio,
          window.innerHeight * window.devicePixelRatio
        ),
      },
      uDepth: { value: FIELD_DEPTH },
      uCool: { value: hexToVec3("#b3401f") },
      uWarm: { value: hexToVec3("#ffc46b") },
    }),
    [shift]
  );

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    uniforms.iResolution.value.set(size.width * dpr, size.height * dpr);
  }, [size, uniforms]);

  useFrame(() => {
    const now = performance.now();
    const elapsed = now / 1000;
    const fade = Math.min(Math.max((now - 250) / 2200, 0), 1);
    const eased = fade * fade * fade * (fade * (fade * 6 - 15) + 10);

    uniforms.iTime.value = elapsed;
    uniforms.iAlpha.value = eased * TARGET_ALPHA;
    uniforms.iShift.value.add(
      camera.position.clone().multiplyScalar(0.0022 * DRIFT_SPEED)
    );
  });

  return (
    <points
      geometry={geometry}
      position={[0, 0, -1]}
      scale={[viewport.width / 3.8, viewport.height / 3.8, 1]}
    >
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
      />
    </points>
  );
};

const CosmicDustCanvas = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45, near: 0.1, far: 80 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach='fog' args={["#000000", 0, 22]} />
      <CosmicDust />
    </Canvas>
  );
};

const Hero = () => {
  return (
    <section className='relative w-full h-screen mx-auto overflow-hidden bg-[#1a0a04]'>
      <div className='pointer-events-none absolute inset-0 z-0'>
        <CosmicDustCanvas />
      </div>
      <div className='pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_12%_15%,rgba(255,122,42,0.34),transparent_24%),radial-gradient(circle_at_88%_82%,rgba(255,206,90,0.22),transparent_28%),linear-gradient(180deg,rgba(26,10,4,0.18),rgba(5,8,22,0.36)_76%)]' />
      <div className='pointer-events-none absolute inset-x-0 top-0 z-[1] h-36 bg-gradient-to-b from-[#050816]/90 to-transparent' />
      <div
        className={`absolute inset-0 top-[120px] z-10 max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}
      >
        <div className='flex flex-col justify-center items-center mt-5'>
          <div className='w-5 h-5 rounded-full bg-[#ffc46b] shadow-[0_0_28px_rgba(255,196,107,0.85)]' />
          <div className='w-1 sm:h-80 h-40 bg-gradient-to-b from-[#ffc46b] via-[#b3401f] to-transparent' />
        </div>

        <div>
          <h1 className={`${styles.heroHeadText} text-white`}>
            Hi, I'm <span className='text-[#ffc46b]'>Yash</span>
          </h1>
          <p className={`${styles.heroSubText} mt-2 max-w-2xl text-[#f6e8d6]`}>
            I develop Web Applications<br className='sm:block hidden' />
            and Maintain Developed <br className='sm:block hidden' /> Applications
          </p>
        </div>
      </div>

      <div className='absolute inset-0 z-[2]'>
        <ComputersCanvas />
      </div>

      <div className='absolute xs:bottom-10 bottom-32 z-20 w-full flex justify-center items-center'>
        <a href='#about'>
          <div className='w-[35px] h-[64px] rounded-3xl border-4 border-[#ffc46b]/70 bg-[#1a0a04]/30 flex justify-center items-start p-2 shadow-[0_0_28px_rgba(255,122,42,0.24)] backdrop-blur-sm'>
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className='w-3 h-3 rounded-full bg-[#ffc46b] mb-1'
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
