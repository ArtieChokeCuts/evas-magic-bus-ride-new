
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Bubble from './Bubble';
import Environment from './Environment';
import { GameType, BubbleData } from '../types';

interface GameSceneProps {
  onScoreUpdate: (type: GameType) => void;
  onAnyPop: () => void;
  mathTarget: string;
  letterTarget: string;
}

const GameScene: React.FC<GameSceneProps> = ({ onScoreUpdate, onAnyPop, mathTarget, letterTarget }) => {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  
  // Use a ref to track the latest targets for the pop handler
  const latestTargets = useRef({ math: mathTarget, spell: letterTarget });
  useEffect(() => {
    latestTargets.current = { math: mathTarget, spell: letterTarget };
  }, [mathTarget, letterTarget]);

  const createInitialBubbles = useCallback(() => {
    const initial: BubbleData[] = [];
    const { math, spell } = latestTargets.current;
    
    // Total bubbles per type
    const BUBBLES_PER_TYPE = 4;

    // Adjusted spawn ranges for centered visibility
    for (let i = 0; i < BUBBLES_PER_TYPE; i++) {
      // Math bubbles
      initial.push({
        id: `math-${i}-${Math.random()}`,
        value: Math.random() > 0.4 ? math : (Math.floor(Math.random() * 15)).toString(),
        type: GameType.MATH,
        position: [-4.5 + Math.random() * 2.5, -6 + i * 4, 0],
        speed: 0.025 + Math.random() * 0.02,
        color: '#8b5cf6' 
      });
      
      // Spelling bubbles
      initial.push({
        id: `spell-${i}-${Math.random()}`,
        value: Math.random() > 0.4 ? spell : String.fromCharCode(65 + Math.floor(Math.random() * 26)),
        type: GameType.SPELLING,
        position: [2 + Math.random() * 2.5, -6 + i * 4 + 2, 0],
        speed: 0.025 + Math.random() * 0.02,
        color: '#ec4899'
      });
    }
    setBubbles(initial);
  }, []);

  useEffect(() => {
    createInitialBubbles();
  }, [createInitialBubbles]);

  const handlePop = (id: string, type: GameType, value: string) => {
    onAnyPop();
    
    const { math, spell } = latestTargets.current;
    if ((type === GameType.MATH && value === math) || (type === GameType.SPELLING && value === spell)) {
      onScoreUpdate(type);
    }

    setBubbles(prev => {
      return prev.map(b => {
        if (b.id === id) {
          // Re-spawn logic - spawn from bottom with new values
          const { math: currentMath, spell: currentSpell } = latestTargets.current;
          const isTarget = Math.random() > 0.35;
          const xPos = type === GameType.MATH 
            ? -4.5 + Math.random() * 2.5 
            : 2 + Math.random() * 2.5;

          return {
            ...b,
            id: `${type}-${Math.random()}`,
            value: type === GameType.MATH 
              ? (isTarget ? currentMath : Math.floor(Math.random() * 20).toString())
              : (isTarget ? currentSpell : String.fromCharCode(65 + Math.floor(Math.random() * 26))),
            position: [xPos, -8, 0],
            speed: 0.025 + Math.random() * 0.025
          };
        }
        return b;
      });
    });
  };

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 50 }} 
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <Environment />
        {bubbles.map(bubble => (
          <Bubble
            key={bubble.id}
            {...bubble}
            onPop={() => handlePop(bubble.id, bubble.type, bubble.value)}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default GameScene;
