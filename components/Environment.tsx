
import React, { useState, useEffect, useRef } from 'react';
import { Sky, Stars, Float, Cloud, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const Environment: React.FC = () => {
  const [evaTexture, setEvaTexture] = useState<THREE.Texture | null>(null);
  const [loadError, setLoadError] = useState(false);
  const glowRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const loadTexture = (path: string) => {
      return new Promise<THREE.Texture>((resolve, reject) => {
        const img = new Image();
        img.src = path;
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const texture = new THREE.Texture(img);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearMipMapLinearFilter;
          texture.needsUpdate = true;
          resolve(texture);
        };
        img.onerror = () => reject(new Error(`Failed to load ${path}`));
      });
    };

    const attemptLoading = async () => {
      // 1. Try ./assets/input_file_0.png (Primary per request)
      // 2. Try ./assets/eva.png (User mention)
      // 3. Try input_file_0.png (Root fallback)
      const paths = [
        './assets/input_file_0.png',
        './assets/eva.png',
        'input_file_0.png'
      ];

      for (const path of paths) {
        try {
          const tex = await loadTexture(path);
          setEvaTexture(tex);
          console.log(`Successfully loaded Eva texture from: ${path}`);
          return;
        } catch (e) {
          console.warn(`Could not load texture from ${path}, trying next...`);
        }
      }
      setLoadError(true);
    };

    attemptLoading();

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
        count={70} 
        scale={20} 
        size={3} 
        speed={0.5} 
        opacity={0.6} 
        color="#ffffff" 
      />

      <ambientLight intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-10, -5, -5]} intensity={1.5} color="#ff00ff" />
      
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
                opacity={0.2} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </Float>
      )}

      {loadError && !evaTexture && (
        <Float speed={4} floatIntensity={1.5}>
          <mesh position={[0, -1, 0]}>
            <sphereGeometry args={[2.5, 32, 32]} />
            <meshStandardMaterial 
              color="#fbbf24" 
              emissive="#f59e0b" 
              emissiveIntensity={4} 
              transparent 
              opacity={0.9} 
            />
          </mesh>
        </Float>
      )}
      
      <mesh position={[0, -5, -3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 6]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
};

export default Environment;
