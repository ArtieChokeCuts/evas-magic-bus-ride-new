
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Bubble from './Bubble.jsx';
import Environment from './Environment.jsx';
import { html } from 'htm/react';

const GameType = {
  MATH: 'math',
  SPELLING: 'spelling'
};

const GameScene = ({ onScoreUpdate, onAnyPop, mathTarget, letterTarget }) => {
  const [bubbles, setBubbles] = useState([]);
  
  const latestTargets = useRef({ math: mathTarget, spell: letterTarget });
  useEffect(() => {
    latestTargets.current = { math: mathTarget, spell: letterTarget };
  }, [mathTarget, letterTarget]);

  const createInitialBubbles = useCallback(() => {
    const initial = [];
    const { math, spell } = latestTargets.current;
    
    const BUBBLES_PER_TYPE = 4;

    for (let i = 0; i < BUBBLES_PER_TYPE; i++) {
      // Math bubbles
      initial.push({
        id: `math-${i}-${Math.random()}`,
        value: Math.random() > 0.4 ? math : (Math.floor(Math.random() * 15)).toString(),
        type: GameType.MATH,
        position: [-4 + Math.random() * 2, -5 + i * 3.5, 0],
        speed: 0.02 + Math.random() * 0.02,
        color: '#a855f7' 
      });
      
      // Spelling bubbles
      initial.push({
        id: `spell-${i}-${Math.random()}`,
        value: Math.random() > 0.4 ? spell : String.fromCharCode(65 + Math.floor(Math.random() * 26)),
        type: GameType.SPELLING,
        position: [2 + Math.random() * 2, -5 + i * 3.5 + 2, 0],
        speed: 0.02 + Math.random() * 0.02,
        color: '#f472b6'
      });
    }
    setBubbles(initial);
  }, []);

  useEffect(() => {
    createInitialBubbles();
  }, [createInitialBubbles]);

  const handlePop = (id, type, value) => {
    onAnyPop();
    
    const { math, spell } = latestTargets.current;
    if ((type === GameType.MATH && value === math) || (type === GameType.SPELLING && value === spell)) {
      onScoreUpdate(type);
    }

    setBubbles(prev => {
      return prev.map(b => {
        if (b.id === id) {
          const { math: currentMath, spell: currentSpell } = latestTargets.current;
          const isTarget = Math.random() > 0.4;
          const xPos = type === GameType.MATH 
            ? -4 + Math.random() * 2 
            : 2 + Math.random() * 2;

          return {
            ...b,
            id: `${type}-${Math.random()}`,
            value: type === GameType.MATH 
              ? (isTarget ? currentMath : Math.floor(Math.random() * 20).toString())
              : (isTarget ? currentSpell : String.fromCharCode(65 + Math.floor(Math.random() * 26))),
            position: [xPos, -7, 0],
            speed: 0.02 + Math.random() * 0.025
          };
        }
        return b;
      });
    });
  };

  return html`
    <div className="absolute inset-0 w-full h-full z-0">
      <${Canvas} 
        camera=${{ position: [0, 0, 10], fov: 50 }} 
        dpr=${[1, 2]}
        gl=${{ alpha: true }}
        style=${{ width: '100%', height: '100%' }}
      >
        <${Environment} />
        ${bubbles.map(bubble => html`
          <${Bubble}
            key=${bubble.id}
            ...${bubble}
            onPop=${() => handlePop(bubble.id, bubble.type, bubble.value)}
          />
        `)}
      <//>
    </div>
  `;
};

export default GameScene;
