import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import * as THREE from "three";

type ParticleMeta = {
  speed: number;
  amplitude: number;
  offset: number;
};

const createParticleTexture = () => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.24, "rgba(255,255,255,0.92)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.18)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
};

const createWavePoints = (width: number, height: number, depth: number) => {
  const points: THREE.Vector3[] = [];

  for (let step = 0; step <= 90; step += 1) {
    const t = step / 90;
    const x = (t - 0.5) * width;
    const y = Math.sin(t * Math.PI * 2) * height;
    const z = Math.cos(t * Math.PI) * depth;
    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
};

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particleTexture = createParticleTexture();

    const createParticleLayer = (
      count: number,
      spreadX: number,
      spreadY: number,
      spreadZ: number,
      size: number
    ) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const origins = new Float32Array(count * 3);
      const meta: ParticleMeta[] = [];

      for (let i = 0; i < count; i += 1) {
        const i3 = i * 3;
        const x = (Math.random() - 0.5) * spreadX;
        const y = (Math.random() - 0.5) * spreadY;
        const z = (Math.random() - 0.5) * spreadZ;

        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;

        origins[i3] = x;
        origins[i3 + 1] = y;
        origins[i3 + 2] = z;

        meta.push({
          speed: 0.03 + Math.random() * 0.05,
          amplitude: 0.08 + Math.random() * 0.26,
          offset: Math.random() * Math.PI * 2,
        });
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        size,
        map: particleTexture ?? undefined,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);

      return {
        geometry,
        material,
        points,
        positions,
        origins,
        meta,
      };
    };

    const frontLayer = createParticleLayer(90, 24, 12, 8, 0.34);
    const midLayer = createParticleLayer(110, 28, 14, 10, 0.24);
    const farLayer = createParticleLayer(85, 34, 16, 12, 0.16);

    scene.add(frontLayer.points, midLayer.points, farLayer.points);

    const createWave = (width: number, height: number, depth: number) => {
      const points = createWavePoints(width, height, depth);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.12,
      });
      const line = new THREE.Line(geometry, material);
      return { geometry, material, line, points };
    };

    const waveA = createWave(20, 1.1, 2.4);
    const waveB = createWave(22, 0.85, -1.8);
    waveA.line.rotation.z = -0.08;
    waveA.line.position.y = 1.2;
    waveB.line.rotation.z = 0.06;
    waveB.line.position.y = -1.35;
    scene.add(waveA.line, waveB.line);

    const ambientLight = new THREE.AmbientLight("#ffffff", 1);
    scene.add(ambientLight);

    const pointer = { x: 0, y: 0 };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const applyTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const frontColor = new THREE.Color(isDark ? "#8eb6ff" : "#4470f2");
      const midColor = new THREE.Color(isDark ? "#b8cfff" : "#6a94ff");
      const farColor = new THREE.Color(isDark ? "#f3a6c7" : "#dd7ca4");
      const waveColor = new THREE.Color(isDark ? "#d7e4ff" : "#6f86d8");

      frontLayer.material.color.copy(frontColor);
      midLayer.material.color.copy(midColor);
      farLayer.material.color.copy(farColor);

      frontLayer.material.opacity = isDark ? 0.42 : 0.52;
      midLayer.material.opacity = isDark ? 0.3 : 0.34;
      farLayer.material.opacity = isDark ? 0.24 : 0.22;

      waveA.material.color.copy(waveColor);
      waveB.material.color.copy(waveColor);
      waveA.material.opacity = isDark ? 0.12 : 0.14;
      waveB.material.opacity = isDark ? 0.09 : 0.1;
    };

    applyTheme();

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", handlePointerMove);

    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animateLayer = (
      layer: ReturnType<typeof createParticleLayer>,
      elapsed: number,
      driftMultiplier: number
    ) => {
      const attribute = layer.geometry.getAttribute("position") as THREE.BufferAttribute;

      for (let i = 0; i < layer.meta.length; i += 1) {
        const i3 = i * 3;
        const { speed, amplitude, offset } = layer.meta[i];

        if (!prefersReducedMotion) {
          let x = layer.origins[i3] + elapsed * speed * driftMultiplier;

          if (x > 18) {
            x = -18;
            layer.origins[i3] = -18;
          }

          attribute.array[i3] = x;
          attribute.array[i3 + 1] = layer.origins[i3 + 1] + Math.sin(elapsed * speed * 3.2 + offset) * amplitude;
          attribute.array[i3 + 2] =
            layer.origins[i3 + 2] + Math.cos(elapsed * speed * 2.6 + offset) * amplitude * 0.6;
        } else {
          attribute.array[i3] = layer.origins[i3];
          attribute.array[i3 + 1] = layer.origins[i3 + 1];
          attribute.array[i3 + 2] = layer.origins[i3 + 2];
        }
      }

      attribute.needsUpdate = true;
    };

    const animateWave = (
      wave: ReturnType<typeof createWave>,
      elapsed: number,
      baseOffset: number,
      strength: number
    ) => {
      const points = wave.points.map((point, index) => {
        const next = point.clone();

        if (!prefersReducedMotion) {
          next.y += Math.sin(elapsed * 0.5 + index * 0.22 + baseOffset) * strength;
          next.z += Math.cos(elapsed * 0.35 + index * 0.16 + baseOffset) * strength * 0.7;
        }

        return next;
      });

      wave.geometry.setFromPoints(points);
    };

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      animateLayer(frontLayer, elapsed, 0.8);
      animateLayer(midLayer, elapsed, 0.45);
      animateLayer(farLayer, elapsed, 0.22);
      animateWave(waveA, elapsed, 0, 0.05);
      animateWave(waveB, elapsed, 1.6, 0.035);

      camera.position.x += ((prefersReducedMotion ? 0 : pointer.x * 0.45) - camera.position.x) * 0.03;
      camera.position.y += ((prefersReducedMotion ? 0 : -pointer.y * 0.24) - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      themeObserver.disconnect();

      particleTexture?.dispose();
      frontLayer.geometry.dispose();
      frontLayer.material.dispose();
      midLayer.geometry.dispose();
      midLayer.material.dispose();
      farLayer.geometry.dispose();
      farLayer.material.dispose();
      waveA.geometry.dispose();
      waveA.material.dispose();
      waveB.geometry.dispose();
      waveB.material.dispose();
      renderer.dispose();
    };
  }, [prefersReducedMotion]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 background-wash" />
      <canvas ref={canvasRef} className="background-canvas absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 background-focus" />

      <motion.div
        className="background-glow background-glow-one"
        animate={
          prefersReducedMotion
            ? { opacity: 0.34 }
            : { x: [0, 48, -26, 0], y: [0, -28, 16, 0], scale: [1, 1.08, 0.98, 1] }
        }
        transition={{ duration: 24, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="background-glow background-glow-two"
        animate={
          prefersReducedMotion
            ? { opacity: 0.28 }
            : { x: [0, -34, 24, 0], y: [0, 20, -18, 0], scale: [1, 0.96, 1.05, 1] }
        }
        transition={{ duration: 28, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="background-beam"
        animate={
          prefersReducedMotion
            ? { opacity: 0.34 }
            : { x: [0, 26, -20, 0], rotate: [-8, -4, -10, -8], opacity: [0.28, 0.42, 0.3, 0.28] }
        }
        transition={{ duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="background-grid"
        animate={prefersReducedMotion ? { opacity: 0.1 } : { opacity: [0.08, 0.14, 0.1] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
    </div>
  );
};

export default AnimatedBackground;
