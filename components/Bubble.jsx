
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, MeshWobbleMaterial } from '@react-three/drei';
import { html } from 'htm/react';

const Bubble = ({ value, type, position, color, onPop, speed }) => {
  const meshRef = useRef(null);
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

    // Steady upward float
    internalY.current += speed * delta * 60;
    
    // Smooth wrap around
    if (internalY.current > 8) {
      internalY.current = -8;
    }

    meshRef.current.position.y = internalY.current;
    meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.3;
    meshRef.current.rotation.y += delta * 0.5;
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (!popping) {
      setPopping(true);
    }
  };

  return html`
    <group 
      ref=${meshRef} 
      position=${[position[0], position[1], position[2]]} 
      onClick=${handleClick} 
      scale=${scale}
    >
      <${Sphere} args=${[0.75, 32, 32]}>
        <${MeshWobbleMaterial} 
          color=${color} 
          factor=${0.4} 
          speed=${2} 
          transparent 
          opacity=${0.8}
          roughness=${0}
          metalness=${0.1}
          emissive=${color}
          emissiveIntensity=${0.2}
        />
      <//>
      <${Text}
        position=${[0, 0, 0.8]}
        fontSize=${0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth=${0.06}
        outlineColor="#333"
      >
        ${value}
      <//>
      <${Sphere} args=${[0.2, 16, 16]} position=${[0.3, 0.4, 0.5]}>
        <meshBasicMaterial color="white" transparent opacity=${0.6} />
      <//>
    </group>
  `;
};

export default Bubble;
