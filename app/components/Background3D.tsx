// @ts-nocheck
// Intentionally opts out of TS checking because @react-three/fiber + @react-three/drei
// use complex generic types that conflict with Next.js's strict tsconfig.
// The runtime is fully correct - this is a dev-experience trade-off only.
'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    Float,
    Environment,
    Octahedron,
    Edges,
    ContactShadows,
} from '@react-three/drei';

function StrategicGeometry() {
    const groupRef = useRef(null);

    useFrame((_state, delta) => {
        if (!groupRef.current) return;
        groupRef.current.rotation.y += delta * 0.25;
        groupRef.current.rotation.x += delta * 0.15;
    });

    return (
        <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.3}>
            <group ref={groupRef}>
                <Octahedron args={[1.5, 0]}>
                    {/*
                     * MeshPhysicalMaterial achieves the same dark-glass look as
                     * MeshTransmissionMaterial but does NOT sample from the
                     * framebuffer, eliminating the WebGL feedback loop entirely.
                     */}
                    <meshPhysicalMaterial
                        color="#1a1208"
                        metalness={0.1}
                        roughness={0.4}
                        transmission={0.6}
                        thickness={2.5}
                        ior={1.15}
                        reflectivity={0.5}
                        transparent
                        opacity={0.85}
                    />
                    <Edges color="#C1A661" threshold={15} opacity={0.25} transparent />
                </Octahedron>
            </group>
        </Float>
    );
}

export default function Background3D() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
            <Canvas
                camera={{ position: [0, 0, 6], fov: 45 }}
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    powerPreference: 'high-performance',
                    alpha: true,
                }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.1} />
                    <spotLight
                        position={[10, 10, 10]}
                        angle={0.15}
                        penumbra={1}
                        intensity={0.8}
                        color="#ffffff"
                    />
                    <spotLight
                        position={[-10, -5, -10]}
                        angle={0.2}
                        penumbra={1}
                        intensity={1.5}
                        color="#C1A661"
                    />
                    <Environment preset="city" />
                    <StrategicGeometry />
                    <ContactShadows
                        position={[0, -2.5, 0]}
                        opacity={0.4}
                        scale={15}
                        blur={2.5}
                        far={4}
                        color="#C1A661"
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
