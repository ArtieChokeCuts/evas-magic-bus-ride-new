
import React, { useState, useEffect, useRef } from 'react';
import { Sky, Stars, Float, Cloud, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const Environment: React.FC = () => {
  const [evaTexture, setEvaTexture] = useState<THREE.Texture | null>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const assetPath = './assets/eva.png';
    
    loader.load(
      assetPath,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearMipMapLinearFilter;
        setEvaTexture(tex);
      },
      undefined,
      (err) => {
        console.warn(`Texture loading failed for ${assetPath}. Using fallback logic.`, err);
        loader.load('./assets/input_file_0.png', (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          setEvaTexture(tex);
        });
      }
    );

    return () => {
      if (evaTexture) evaTexture.dispose();
    };
  }, []);

  useFrame((state) => {
    if (glowRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      glowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <>
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1.5} />
      
      <Sparkles 
        count={80} 
        scale={20} 
        size={3} 
        speed={0.5} 
        opacity={0.6} 
        color="#ffffff" 
      />

      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
      <pointLight position={[-10, -5, -5]} intensity={1} color="#ff00ff" />
      
      <Cloud position={[-15, 6, -15]} speed={0.1} opacity={0.4} segments={20} />
      <Cloud position={[15, 8, -20]} speed={0.05} opacity={0.3} segments={15} />
      <Cloud position={[0, -10, -12]} speed={0.15} opacity={0.3} segments={25} />

      {evaTexture && (
        <Float speed={3.5} rotationIntensity={0.1} floatIntensity={0.8}>
          <group position={[0, -2, 0]}>
            <sprite scale={[12, 12, 1]}>
              <spriteMaterial 
                map={evaTexture} 
                transparent={true} 
                opacity={1}
                toneMapped={false}
              />
            </sprite>
            <mesh ref={glowRef}>
              <planeGeometry args={[13, 13]} />
              <meshBasicMaterial 
                color="#a855f7" 
                transparent 
                opacity={0.15} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </Float>
      )}
      
      {/* Decorative magic path glow */}
      <mesh position={[0, -5, -3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 10]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.05} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
};

export default Environment;
