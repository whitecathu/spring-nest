import { Float, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import { CatmullRomCurve3, Color, DoubleSide, Group, Shape, Vector3 } from 'three';
import type { GlassGardenProfile } from './sceneProfiles';

type GlassTerrariumSceneProps = {
  profile: GlassGardenProfile;
  phase: 'splash' | 'ambient';
  dark: boolean;
};

function makeLeafShape(side: -1 | 1) {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(side * 0.28, 0.34, side * 0.62, 0.46, side * 0.88, 0.18);
  shape.bezierCurveTo(side * 0.48, -0.12, side * 0.22, -0.18, 0, 0);
  return shape;
}

function seeded(index: number) {
  const value = Math.sin(index * 999.13) * 10000;
  return value - Math.floor(value);
}

function SoilClumps({ count, dark }: { count: number; dark: boolean }) {
  const clumps = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: -2.1 + seeded(index + 1) * 4.2,
        z: -0.75 + seeded(index + 7) * 1.5,
        y: -1.02 + seeded(index + 11) * 0.1,
        scale: 0.08 + seeded(index + 17) * 0.16,
        rotate: seeded(index + 23) * Math.PI,
      })),
    [count],
  );

  return (
    <group>
      {clumps.map((clump, index) => (
        <mesh
          key={index}
          position={[clump.x, clump.y, clump.z]}
          rotation={[clump.rotate, clump.rotate * 0.4, clump.rotate * 0.2]}
          scale={[clump.scale * 1.4, clump.scale * 0.8, clump.scale]}
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={dark ? '#4a3224' : '#8a6242'}
            roughness={0.94}
            metalness={0.02}
          />
        </mesh>
      ))}
    </group>
  );
}

function RootCurves({ count, dark }: { count: number; dark: boolean }) {
  const roots = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const startX = -0.08 + seeded(index + 31) * 0.16;
        const endX = (seeded(index + 41) - 0.5) * 2.8;
        const endZ = -0.32 + seeded(index + 43) * 0.7;
        return new CatmullRomCurve3([
          new Vector3(startX, -0.72, -0.05),
          new Vector3(startX * 3, -0.98, endZ * 0.4),
          new Vector3(endX, -1.16, endZ),
        ]);
      }),
    [count],
  );

  return (
    <group>
      {roots.map((root, index) => (
        <mesh key={index}>
          <tubeGeometry args={[root, 14, 0.012, 6, false]} />
          <meshStandardMaterial color={dark ? '#d9c1a7' : '#e3d2ba'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function DewAndDust({ count, dark }: { count: number; dark: boolean }) {
  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: -1.65 + seeded(index + 61) * 3.3,
        y: -0.15 + seeded(index + 67) * 2.2,
        z: -0.9 + seeded(index + 71) * 1.8,
        scale: 0.018 + seeded(index + 73) * 0.028,
      })),
    [count],
  );

  return (
    <group>
      {drops.map((drop, index) => (
        <Float
          key={index}
          speed={0.45 + seeded(index + 80)}
          floatIntensity={0.08}
          rotationIntensity={0.05}
        >
          <mesh position={[drop.x, drop.y, drop.z]} scale={drop.scale}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial
              color={dark ? '#dff8e8' : '#ffffff'}
              roughness={0.05}
              metalness={0}
              transparent
              opacity={0.52}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Sprout({ profile, phase, dark }: GlassTerrariumSceneProps) {
  const groupRef = useRef<Group>(null);
  const leftLeaf = useMemo(() => makeLeafShape(-1), []);
  const rightLeaf = useMemo(() => makeLeafShape(1), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const emergence = phase === 'splash' ? Math.min(1, t / 1.15) : 1;
    groupRef.current.position.y = -0.88 + emergence * 1.08 + Math.sin(t * 1.1) * 0.012;
    groupRef.current.rotation.z = Math.sin(t * 1.6) * (phase === 'splash' ? 0.045 : 0.014);
    groupRef.current.scale.setScalar(profile.sproutScale * (0.72 + emergence * 0.28));
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.25, 0]}>
        <capsuleGeometry args={[0.055, 0.86, 7, 12]} />
        <meshStandardMaterial
          color={dark ? '#8fd4a5' : '#3f6751'}
          roughness={0.52}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[-0.04, 0.3, 0]} rotation={[0.18, 0.2, 0.35]} scale={[0.72, 0.72, 0.72]}>
        <shapeGeometry args={[leftLeaf]} />
        <meshStandardMaterial
          color={dark ? '#9ee4b1' : '#77bd86'}
          side={DoubleSide}
          roughness={0.62}
          metalness={0.02}
        />
      </mesh>
      <mesh
        position={[0.05, 0.29, 0.02]}
        rotation={[0.14, -0.18, -0.28]}
        scale={[0.68, 0.72, 0.72]}
      >
        <shapeGeometry args={[rightLeaf]} />
        <meshStandardMaterial
          color={dark ? '#b8e4c9' : '#8fd4a5'}
          side={DoubleSide}
          roughness={0.64}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

function GlassDome({ strength, dark }: { strength: number; dark: boolean }) {
  return (
    <group position={[0, -0.1, 0]}>
      <mesh>
        <sphereGeometry args={[1.95, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
        <meshPhysicalMaterial
          color={new Color(dark ? '#d7ffe8' : '#ffffff')}
          transparent
          opacity={0.08 + strength * 0.08}
          roughness={0.02}
          metalness={0}
          transmission={0.42}
          thickness={0.38}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, -1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.65, 0.012, 8, 96]} />
        <meshStandardMaterial
          color={dark ? '#dff8e8' : '#ffffff'}
          transparent
          opacity={0.22 + strength * 0.16}
        />
      </mesh>
    </group>
  );
}

function GlassTerrariumScene({ profile, phase, dark }: GlassTerrariumSceneProps) {
  const sceneRef = useRef<Group>(null);

  useFrame(({ clock, pointer }) => {
    if (!sceneRef.current) return;
    const t = clock.getElapsedTime();
    const parallax = phase === 'ambient' ? profile.parallaxStrength * 0.002 : 0;
    sceneRef.current.rotation.y = pointer.x * parallax + Math.sin(t * 0.16) * 0.018;
    sceneRef.current.rotation.x = -0.08 + pointer.y * parallax;
  });

  return (
    <group ref={sceneRef}>
      <PerspectiveCamera makeDefault position={[0, 0.65, 4.2]} fov={38} />
      <ambientLight intensity={dark ? 0.7 : 0.92} />
      <directionalLight
        position={[-2, 3.4, 3]}
        intensity={dark ? 1.2 : 1.6}
        color={profile.warmth > 0.55 ? '#ffe0bc' : '#ffffff'}
      />
      <pointLight position={[1.8, 0.7, 1.4]} intensity={dark ? 0.55 : 0.36} color="#b8e4c9" />
      <mesh position={[0, -1.16, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[2.4, 1.12, 1]}>
        <circleGeometry args={[1, 96]} />
        <meshStandardMaterial
          color={dark ? '#3d2a1f' : '#7a5639'}
          roughness={0.96}
          metalness={0.01}
        />
      </mesh>
      <RootCurves count={profile.rootCurves} dark={dark} />
      <SoilClumps count={profile.soilClumps} dark={dark} />
      <Sprout profile={profile} phase={phase} dark={dark} />
      <DewAndDust count={profile.dewDrops + Math.floor(profile.particleCount / 3)} dark={dark} />
      <GlassDome strength={profile.glassStrength} dark={dark} />
    </group>
  );
}

export default memo(GlassTerrariumScene);
