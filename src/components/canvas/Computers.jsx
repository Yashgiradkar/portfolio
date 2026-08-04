import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, OrbitControls, Preload, useGLTF } from "@react-three/drei";

import CanvasLoader from "../Loader";

const Computers = ({ isMobile }) => {
  const model = useGLTF("./developer_orb/scene.gltf");
  const orbRef = useRef();
  const scene = useMemo(() => model.scene.clone(), [model.scene]);

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;

      if (child.material) {
        child.material.envMapIntensity = 1.8;

        if (child.material.emissive) {
          child.material.emissiveIntensity =
            child.material.name?.includes("cyan") ? 2.35 : 2.8;
        }
      }
    });
  }, [scene]);

  useFrame(({ clock }) => {
    if (!orbRef.current) {
      return;
    }

    const time = clock.getElapsedTime();
    orbRef.current.rotation.y = time * 0.18;
    orbRef.current.rotation.z = Math.sin(time * 0.55) * 0.035;
  });

  return (
    <group>
      <hemisphereLight intensity={0.42} groundColor='#1a0a04' color='#ffe2b0' />
      <ambientLight intensity={0.28} color='#ffc46b' />
      <spotLight
        position={[-8, 10, 6]}
        angle={0.32}
        penumbra={1}
        intensity={2.4}
        color='#ffc46b'
        castShadow
        shadow-mapSize={2048}
      />
      <pointLight position={[3.4, 0.4, 3.2]} intensity={2.4} color='#ff7a2a' />
      <pointLight position={[-3.3, 1.4, 2.4]} intensity={1.85} color='#6be7ff' />
      <pointLight position={[0, -1.8, 2.6]} intensity={1.1} color='#ffc46b' />

      <Float
        speed={1.35}
        rotationIntensity={isMobile ? 0.1 : 0.2}
        floatIntensity={isMobile ? 0.22 : 0.36}
      >
        <group ref={orbRef}>
          <primitive
            object={scene}
            scale={isMobile ? 0.94 : 1.2}
            position={isMobile ? [0, -0.8, -1.7] : [0, -0.42, -1.35]}
            rotation={[0.06, -0.28, -0.02]}
          />
        </group>
      </Float>

      <ContactShadows
        position={[0, isMobile ? -2.55 : -2.82, -1.25]}
        opacity={0.34}
        scale={isMobile ? 3.5 : 5.6}
        blur={3}
        far={3.4}
        color='#ff7a2a'
      />
    </group>
  );
};

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Add a listener for changes to the screen size
    const mediaQuery = window.matchMedia("(max-width: 500px)");

    // Set the initial value of the `isMobile` state variable
    setIsMobile(mediaQuery.matches);

    // Define a callback function to handle changes to the media query
    const handleMediaQueryChange = (event) => {
      setIsMobile(event.matches);
    };

    // Add the callback function as a listener for changes to the media query
    mediaQuery.addEventListener("change", handleMediaQueryChange);

    // Remove the listener when the component is unmounted
    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  return (
    <Canvas
      frameloop='always'
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.8, 6], fov: 38 }}
      gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.45}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        <Computers isMobile={isMobile} />
      </Suspense>

      <Preload all />
    </Canvas>
  );
};

useGLTF.preload("./developer_orb/scene.gltf");

export default ComputersCanvas;
