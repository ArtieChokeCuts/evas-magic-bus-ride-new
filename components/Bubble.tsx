
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { GameType } from '../types';

interface BubbleProps {
  value: string;
  type: GameType;
  position: [number, number, number];
  color: string;
  onPop: () => void;
  speed: number;
}

const Bubble: React.FC<BubbleProps> = ({ value, type, position, color, onPop, speed }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [popping, setPopping] = useState(false);
  const [scale, setScale] = useState(1);
  const internalY = useRef(position[1]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (popping) {
      const newScale = Math.max(0, scale - delta * 8);
      setScale(newScale);
      if (newScale <= 0.05) {
        onPop();
      }
      return;
    }

    // Move bubble upwards
    internalY.current += speed * delta * 60;
    
    // Wrap around logic - bubbles move from bottom to top
    if (internalY.current > 7) {
      internalY.current = -7;
    }

    meshRef.current.position.y = internalY.current;
    
    // Gentle floating side-to-side movement
    meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime + position[0]) * 0.4;
    
    // Slight rotation for visual interest
    meshRef.current.rotation.y += delta * 0.5;
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!popping) {
      setPopping(true);
    }
  };

  return (
    <group 
      ref={meshRef} 
      position={[position[0], position[1], position[2]]} 
      onClick={handleClick} 
      scale={scale}
    >
      <Sphere args={[0.7, 32, 32]}>
        <MeshWobbleMaterial 
          color={color} 
          factor={0.4} 
          speed={2} 
          transparent 
          opacity={0.7}
          roughness={0}
          metalness={0.2}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </Sphere>
      <Text
        position={[0, 0, 0.8]}
        fontSize={0.7}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#333"
        font="https://fonts.gstatic.com/s/fredoka/v13/6xK4dTN-n6q8-i_jH1A7y6fS.woff"
      >
        {value}
      </Text>
      {/* Decorative reflection shine */}
      <Sphere args={[0.18, 16, 16]} position={[0.25, 0.35, 0.5]}>
        <meshBasicMaterial color="white" transparent opacity={0.6} />
      </Sphere>
    </group>
  );
};

export default Bubble;
