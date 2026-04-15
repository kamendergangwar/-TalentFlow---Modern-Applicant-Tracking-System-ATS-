import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, Html, OrbitControls, RoundedBox, Sparkles } from "@react-three/drei";

type AuthHeroSceneProps = {
  themeMode?: "light" | "dark";
};

const PANEL_ROWS = [
  { name: "Pipeline Health", value: "+18%", tone: "success" },
  { name: "Interviews Booked", value: "42", tone: "primary" },
  { name: "Time to Hire", value: "11d", tone: "accent" },
] as const;

const CANDIDATES = [
  { name: "Ava Johnson", role: "Product Designer", status: "Final round" },
  { name: "Marcus Lee", role: "Frontend Engineer", status: "Interviewing" },
  { name: "Priya Sharma", role: "Talent Partner", status: "Offer drafted" },
] as const;

function FloatingPlatform({ themeMode }: Required<AuthHeroSceneProps>) {
  const groupRef = useRef<THREE.Group>(null);
  const isDark = themeMode === "dark";

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -0.18 + Math.cos(t / 3.2) * 0.08,
      0.06
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      0.45 + Math.sin(t / 4.4) * 0.2,
      0.06
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      Math.sin(t * 1.35) * 0.18,
      0.08
    );
  });

  const orbitNodes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        return [Math.cos(angle) * 3.6, 0.35 + Math.sin(angle * 1.5) * 0.12, Math.sin(angle) * 2.2] as const;
      }),
    []
  );

  const materials = useMemo(
    () =>
      isDark
        ? {
            base: "#07101d",
            deck: "#0f1b2d",
            key: "#15243c",
            shell: "#0d1728",
            screen: "#08111d",
            screenGlow: "#123456",
            stand: "#091423",
            hinge: "#1d2f47",
            ring: "#3c8eff",
            ringGlow: "#2f6df6",
            emissiveNode: "#69b8ff",
          }
        : {
            base: "#dfeaf7",
            deck: "#f7fbff",
            key: "#d7e4f2",
            shell: "#ecf4fb",
            screen: "#f8fbff",
            screenGlow: "#d7ebff",
            stand: "#cedaea",
            hinge: "#bccde3",
            ring: "#7aaeff",
            ringGlow: "#8ebcff",
            emissiveNode: "#8fb7ff",
          },
    [isDark]
  );

  return (
    <group ref={groupRef} position={[0, 0.4, 0]}>
      <Float speed={1.75} floatIntensity={0.8} rotationIntensity={0.25}>
        <group>
          <RoundedBox args={[5.6, 0.34, 3.75]} radius={0.16} smoothness={5} position={[0, -0.1, 0]}>
            <meshStandardMaterial color={materials.base} metalness={0.88} roughness={0.26} />
          </RoundedBox>

          <RoundedBox args={[4.45, 0.12, 2.72]} radius={0.08} smoothness={5} position={[0, 0.16, 0.18]}>
            <meshStandardMaterial color={materials.deck} metalness={0.42} roughness={0.34} />
          </RoundedBox>

          {[-1.45, -0.92, -0.39, 0.14, 0.67, 1.2].map((x) => (
            <RoundedBox
              key={x}
              args={[0.36, 0.05, 1.64]}
              radius={0.04}
              smoothness={4}
              position={[x, 0.25, 0.55]}
            >
              <meshStandardMaterial color={materials.key} metalness={0.3} roughness={0.62} />
            </RoundedBox>
          ))}

          <RoundedBox
            args={[4.32, 2.82, 0.18]}
            radius={0.18}
            smoothness={6}
            position={[0, 1.78, -0.84]}
            rotation={[-0.76, 0, 0]}
          >
            <meshStandardMaterial color={materials.shell} metalness={0.48} roughness={0.24} />
          </RoundedBox>

          <mesh position={[0, 1.78, -0.72]} rotation={[-0.76, 0, 0]}>
            <planeGeometry args={[3.95, 2.42]} />
            <meshStandardMaterial color={materials.screen} emissive={materials.screenGlow} emissiveIntensity={isDark ? 0.42 : 0.16} />
          </mesh>

          <Html
            transform
            occlude
            distanceFactor={1.18}
            position={[0, 1.78, -0.61]}
            rotation={[-0.76, 0, 0]}
          >
            <div className={`auth-scene-screen ${isDark ? "auth-scene-screen--dark" : "auth-scene-screen--light"}`}>
              <div className="auth-scene-screen__topbar">
                <span />
                <span />
                <span />
              </div>

              <div className="auth-scene-screen__header">
                <div>
                  <p className="auth-scene-screen__eyebrow">TalentFlow ATS</p>
                  <h3>Hiring command center</h3>
                </div>
                <div className="auth-scene-screen__pulse">
                  <span />
                  Live
                </div>
              </div>

              <div className="auth-scene-screen__stats">
                {PANEL_ROWS.map((panel) => (
                  <article key={panel.name} className="auth-scene-screen__stat-card">
                    <p>{panel.name}</p>
                    <strong data-tone={panel.tone}>{panel.value}</strong>
                  </article>
                ))}
              </div>

              <div className="auth-scene-screen__board">
                <div className="auth-scene-screen__board-head">
                  <span>Shortlisted Candidates</span>
                  <span>Today</span>
                </div>

                <div className="auth-scene-screen__candidate-list">
                  {CANDIDATES.map((candidate) => (
                    <div key={candidate.name} className="auth-scene-screen__candidate">
                      <div className="auth-scene-screen__avatar" aria-hidden="true">
                        {candidate.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div>
                        <strong>{candidate.name}</strong>
                        <p>{candidate.role}</p>
                      </div>
                      <span>{candidate.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Html>

          <mesh position={[0, -0.28, 1.38]} rotation={[-0.18, 0, 0]}>
            <cylinderGeometry args={[1.12, 1.5, 0.18, 48]} />
            <meshStandardMaterial color={materials.stand} metalness={0.76} roughness={0.26} />
          </mesh>

          <mesh position={[0, -0.15, 1.05]} rotation={[-0.18, 0, 0]}>
            <cylinderGeometry args={[0.44, 0.62, 0.06, 48]} />
            <meshStandardMaterial color={materials.hinge} metalness={0.34} roughness={0.44} />
          </mesh>
        </group>

        <group position={[0, 1, 0]}>
          {orbitNodes.map((node, index) => (
            <mesh key={index} position={node}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial
                color={index % 3 === 0 ? "#5ec2ff" : index % 2 === 0 ? "#76f2c8" : "#7f8cff"}
                emissive={materials.emissiveNode}
                emissiveIntensity={isDark ? 0.8 : 0.3}
              />
            </mesh>
          ))}
        </group>

        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.6, 0]}>
          <torusGeometry args={[3.7, 0.015, 16, 100]} />
          <meshStandardMaterial
            color={materials.ring}
            emissive={materials.ringGlow}
            emissiveIntensity={isDark ? 0.65 : 0.22}
            transparent
            opacity={isDark ? 0.5 : 0.28}
          />
        </mesh>
      </Float>
    </group>
  );
}

function SceneLights({ themeMode }: Required<AuthHeroSceneProps>) {
  const isDark = themeMode === "dark";

  return (
    <>
      <color attach="background" args={[isDark ? "#020816" : "#edf6ff"]} />
      <fog attach="fog" args={[isDark ? "#020816" : "#edf6ff", 9, 18]} />
      <ambientLight intensity={isDark ? 0.7 : 1.1} />
      <hemisphereLight args={[isDark ? "#8bc3ff" : "#d7ecff", isDark ? "#09111d" : "#e5edf7", isDark ? 1.1 : 1.45]} />
      <directionalLight position={[5, 7, 3]} intensity={isDark ? 2.2 : 2.7} color={isDark ? "#d7ebff" : "#ffffff"} />
      <spotLight position={[-4, 8, 5]} angle={0.4} penumbra={0.6} intensity={isDark ? 45 : 28} color="#5eb8ff" />
      <spotLight position={[4, 5, -2]} angle={0.5} penumbra={1} intensity={isDark ? 28 : 18} color="#8e7dff" />
    </>
  );
}

function SceneContent({ themeMode }: Required<AuthHeroSceneProps>) {
  const isDark = themeMode === "dark";

  return (
    <>
      <SceneLights themeMode={themeMode} />
      <Sparkles count={70} scale={[12, 6, 10]} size={2.8} speed={0.4} color={isDark ? "#8fd3ff" : "#5a9cff"} />
      <FloatingPlatform themeMode={themeMode} />
      <ContactShadows position={[0, -1.15, 0]} opacity={isDark ? 0.45 : 0.28} scale={12} blur={2.8} far={3.2} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minAzimuthAngle={-0.5}
        maxAzimuthAngle={0.5}
        minPolarAngle={Math.PI / 2.4}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

export function AuthHeroScene({ themeMode = "light" }: AuthHeroSceneProps) {
  return (
    <div className="h-full w-full">
      <Canvas dpr={[1, 1.75]} camera={{ position: [-4.2, 2.4, 8.6], fov: 36 }}>
        <Suspense fallback={null}>
          <SceneContent themeMode={themeMode} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default AuthHeroScene;
