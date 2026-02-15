
import React, { useState, useEffect, useRef } from 'react';
import { Sky, Stars, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const Environment: React.FC = () => {
  const [evaTexture, setEvaTexture] = useState<THREE.Texture | null>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const assetPath = './assets/input_file_0.png';
    
    loader.load(
      assetPath,
      (tex) => {
        // Correct encoding for r165+
        tex.colorSpace = THREE.SRGBColorSpace;
        setEvaTexture(tex);
      },
      undefined,
      (err) => {
        console.warn("Could not load Eva texture:", err);
      }
    );

    return () => {
      if (evaTexture) evaTexture.dispose();
    };
  }, []);

  useFrame((state) => {
    if (glowRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      glowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -5, -5]} intensity={0.5} color="#ff00ff" />
      
      {/* Background Atmosphere */}
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={50} scale={12} size={3} speed={0.4} opacity={0.6} color="#FFF" />

      {/* Eva Character */}
      {evaTexture && (
        <Float speed={2.5} rotationIntensity={0.05} floatIntensity={0.5}>
          <group position={[0, -0.5, -2]}>
            <sprite scale={[5, 5, 1]}>
              <spriteMaterial 
                map={evaTexture} 
                transparent={true} 
                opacity={1}
                toneMapped={false}
              />
            </sprite>
            <mesh ref={glowRef} position={[0, 0, -0.1]}>
              <planeGeometry args={[6, 6]} />
              <meshBasicMaterial 
                color="#c084fc" 
                transparent 
                opacity={0.2} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </Float>
      )}
    </>
  );
};

export default Environment;
