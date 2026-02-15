
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
  const [yPos, setYPos] = useState(position[1]);
  const [scale, setScale] = useState(1);

  useFrame((state, delta) => {
    if (popping) {
      setScale(prev => Math.max(0, prev - delta * 6));
      if (scale <= 0.05) {
        onPop();
      }
      return;
    }

    setYPos(prev => {
      let next = prev + speed * delta * 50;
      if (next > 12) return -12; // Wrap around
      return next;
    });

    if (meshRef.current) {
      meshRef.current.position.y = yPos;
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime + position[0]) * 0.5;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!popping) {
      setPopping(true);
    }
  };

  return (
    <group ref={meshRef} position={[position[0], yPos, position[2]]} onClick={handleClick} scale={scale}>
      <Sphere args={[1.2, 32, 32]}>
        <MeshWobbleMaterial 
          color={color} 
          factor={0.5} 
          speed={3} 
          transparent 
          opacity={0.7}
          roughness={0}
          metalness={0.2}
        />
      </Sphere>
      <Text
        position={[0, 0, 1.3]}
        fontSize={0.9}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="black"
      >
        {value}
      </Text>
      <Sphere args={[0.35, 16, 16]} position={[0.5, 0.5, 0.9]}>
        <meshBasicMaterial color="white" transparent opacity={0.5} />
      </Sphere>
    </group>
  );
};

export default Bubble;
