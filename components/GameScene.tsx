
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import Bubble from './Bubble';
import Environment from './Environment';
import { GameType, BubbleData, MATH_TARGETS, LETTER_TARGETS } from '../types';

interface GameSceneProps {
  onScoreUpdate: (type: GameType) => void;
  onAnyPop: () => void;
  mathTarget: string;
  letterTarget: string;
}

const LoadingOverlay = () => (
  <Html center>
    <div className="flex flex-col items-center justify-center text-indigo-600 font-bold bg-white/80 p-4 rounded-full shadow-xl">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p>Loading Magic...</p>
    </div>
  </Html>
);

const GameScene: React.FC<GameSceneProps> = ({ onScoreUpdate, onAnyPop, mathTarget, letterTarget }) => {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);

  const createInitialBubbles = useCallback(() => {
    const initial: BubbleData[] = [];
    // Math bubbles - spawning at different heights to stagger entry
    for (let i = 0; i < 4; i++) {
      initial.push({
        id: `math-${i}-${Math.random()}`,
        value: Math.random() > 0.4 ? mathTarget : (Math.floor(Math.random() * 20)).toString(),
        type: GameType.MATH,
        position: [-6 + Math.random() * 4, -12 + i * 5, 0],
        speed: 0.015 + Math.random() * 0.02,
        color: '#7B61FF'
      });
    }
    // Spelling bubbles
    for (let i = 0; i < 4; i++) {
      initial.push({
        id: `spell-${i}-${Math.random()}`,
        value: Math.random() > 0.4 ? letterTarget : String.fromCharCode(65 + Math.floor(Math.random() * 26)),
        type: GameType.SPELLING,
        position: [2 + Math.random() * 4, -14 + i * 5, 0],
        speed: 0.015 + Math.random() * 0.02,
        color: '#FF61B6'
      });
    }
    setBubbles(initial);
  }, [mathTarget, letterTarget]);

  useEffect(() => {
    createInitialBubbles();
  }, [createInitialBubbles]);

  const handlePop = (id: string, type: GameType, value: string) => {
    onAnyPop();

    if ((type === GameType.MATH && value === mathTarget) || (type === GameType.SPELLING && value === letterTarget)) {
      onScoreUpdate(type);
    }

    setBubbles(prev => {
      return prev.map(b => {
        if (b.id === id) {
          const isTarget = Math.random() > 0.5;
          return {
            ...b,
            id: `${type}-${Math.random()}`,
            value: type === GameType.MATH 
              ? (isTarget ? mathTarget : Math.floor(Math.random() * 30).toString())
              : (isTarget ? letterTarget : String.fromCharCode(65 + Math.floor(Math.random() * 26))),
            position: [type === GameType.MATH ? -6 + Math.random() * 4 : 2 + Math.random() * 4, -12, 0],
            speed: 0.015 + Math.random() * 0.025
          };
        }
        return b;
      });
    });
  };

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 10], fov: 55 }}>
        <Suspense fallback={<LoadingOverlay />}>
          <Environment />
          {bubbles.map(bubble => (
            <Bubble
              key={bubble.id}
              {...bubble}
              onPop={() => handlePop(bubble.id, bubble.type, bubble.value)}
            />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GameScene;
