
import React, { useState, useEffect, useRef } from 'react';
import GameScene from './components/GameScene.jsx';
import { getMagicalCompliment, generateMagicalSpeech, decodeBase64, decodeAudioData } from './geminiService.js';
import { html } from 'htm/react';

const GameType = {
  MATH: 'math',
  SPELLING: 'spelling'
};

const MATH_TARGETS = ['3', '7', '11', '15', '20', '25', '30'];
const LETTER_TARGETS = ['E', 'V', 'A', 'S', 'U', 'P', 'E', 'R'];

const App = () => {
  const [state, setState] = useState({
    playing: false,
    mathLevel: 0,
    spellingLevel: 0,
    currentMathTarget: MATH_TARGETS[0],
    currentLetterTarget: LETTER_TARGETS[0],
    score: 0,
    magicMessage: "Welcome, Super Eva! Let's ride!"
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRef = useRef(null);
  const bgMusicRef = useRef(null);
  const popSoundRef = useRef(null);
  const magicSoundRef = useRef(null);

  // Initialize Audio Assets from ./assets/
  useEffect(() => {
    const createSafeAudio = (path, volume = 0.5, loop = false) => {
      const audio = new Audio();
      audio.loop = loop;
      audio.volume = volume;
      audio.preload = 'auto';
      
      audio.addEventListener('error', (e) => {
        console.warn(`Audio asset failed to load: ${path}. Error:`, e);
      });

      audio.src = path;
      return audio;
    };

    // Prepare sounds
    bgMusicRef.current = createSafeAudio('./assets/loop.mp3', 0.4, true);
    popSoundRef.current = createSafeAudio('./assets/pop.mp3', 0.5);
    magicSoundRef.current = createSafeAudio('./assets/magic.mp3', 0.6);

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.src = "";
      }
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Sync mute state with audio elements
  useEffect(() => {
    const music = bgMusicRef.current;
    if (music) {
      if (isMuted || !state.playing) {
        music.pause();
      } else {
        music.play().catch(e => console.debug("Music sync play failed:", e));
      }
    }
  }, [isMuted, state.playing]);

  const speakMessage = async (text) => {
    if (isMuted || isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const base64 = await generateMagicalSpeech(text);
      if (base64) {
        const audioData = decodeBase64(base64);
        const buffer = await decodeAudioData(audioData, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("Speech Error:", err);
      setIsSpeaking(false);
    }
  };

  const handleScoreUpdate = async (type) => {
    const magic = magicSoundRef.current;
    if (!isMuted && magic && magic.readyState >= 2) {
      magic.currentTime = 0;
      magic.play().catch(() => {});
    }

    setState(prev => {
      const nextScore = prev.score + 10;
      let nextMathLevel = prev.mathLevel;
      let nextSpellingLevel = prev.spellingLevel;
      
      if (type === GameType.MATH) {
        nextMathLevel = (prev.mathLevel + 1) % MATH_TARGETS.length;
      } else {
        nextSpellingLevel = (prev.spellingLevel + 1) % LETTER_TARGETS.length;
      }

      const nextMathTarget = MATH_TARGETS[nextMathLevel];
      const nextLetterTarget = LETTER_TARGETS[nextSpellingLevel];

      if (nextScore % 50 === 0) {
        getMagicalCompliment("Eva", Math.floor(nextScore / 10), type).then(msg => {
          setState(s => ({ ...s, magicMessage: msg }));
          speakMessage(msg);
        });
      }

      return {
        ...prev,
        score: nextScore,
        mathLevel: nextMathLevel,
        spellingLevel: nextSpellingLevel,
        currentMathTarget: nextMathTarget,
        currentLetterTarget: nextLetterTarget
      };
    });
  };

  const handleAnyPop = () => {
    const pop = popSoundRef.current;
    if (!isMuted && pop && pop.readyState >= 2) {
      pop.currentTime = 0;
      pop.play().catch(() => {});
    }
  };

  const startGame = () => {
    setState(prev => ({ ...prev, playing: true }));
    
    // Explicitly play music on user gesture to bypass autoplay blocks
    if (bgMusicRef.current && !isMuted) {
      bgMusicRef.current.play().catch(e => {
        console.warn("Manual background music play failed:", e);
      });
    }

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    speakMessage("Ready to fly, Super Eva? Let's go!");
  };

  return html`
    <div className="relative w-full h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 overflow-hidden font-sans text-white">
      ${state.playing && html`
        <${GameScene} 
          mathTarget=${state.currentMathTarget}
          letterTarget=${state.currentLetterTarget}
          onScoreUpdate=${handleScoreUpdate}
          onAnyPop=${handleAnyPop}
        />
      `}

      <!-- UI Overlay -->
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 pointer-events-auto shadow-xl">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-purple-300 flex items-center gap-2">
            <span>✨</span> Super Eva's Magic Ride
          </h1>
          <div className="text-4xl font-black mt-1 drop-shadow-md text-white">Score: ${state.score}</div>
        </div>

        <div className="flex flex-col gap-3 pointer-events-auto">
          <div className="bg-blue-500/80 backdrop-blur-md p-3 rounded-xl border border-blue-300/50 min-w-[120px] text-center shadow-lg">
            <div className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Find Number</div>
            <div className="text-3xl font-black drop-shadow-sm">${state.currentMathTarget}</div>
          </div>
          <div className="bg-pink-500/80 backdrop-blur-md p-3 rounded-xl border border-pink-300/50 min-w-[120px] text-center shadow-lg">
            <div className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Find Letter</div>
            <div className="text-3xl font-black drop-shadow-sm">${state.currentLetterTarget}</div>
          </div>
        </div>
      </div>

      <!-- Magic Message Bubble -->
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-20 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/30 shadow-2xl transition-all duration-500 transform hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center text-2xl shadow-lg animate-bounce">
              ✨
            </div>
            <p className="text-xl font-medium italic text-purple-100 drop-shadow-sm">
              ${state.magicMessage}
            </p>
          </div>
        </div>
      </div>

      ${!state.playing && html`
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0 z-[-1]">
             <img 
               src="./assets/input_file_1.png" 
               alt="" 
               className="w-full h-full object-cover opacity-60"
               onError=${(e) => (e.currentTarget.style.display = 'none')}
             />
          </div>

          <div className="bg-white/10 backdrop-blur-2xl p-12 rounded-[3rem] border border-white/20 text-center shadow-2xl max-w-lg mx-4">
            <h2 className="text-6xl font-black mb-8 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
              Super Eva's Magic Ride
            </h2>
            <button 
              onClick=${startGame}
              className="group relative px-16 py-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-4xl font-black hover:scale-110 active:scale-95 transition-all shadow-2xl border-4 border-white/30"
            >
              <span className="relative z-10 text-white">LET'S FLY!</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity" />
            </button>
            <p className="mt-10 text-white/90 italic text-xl font-medium">
              Pop the numbers and letters to gain magic power!
            </p>
          </div>
        </div>
      `}

      <button 
        onClick=${() => setIsMuted(!isMuted)}
        className="absolute bottom-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-all pointer-events-auto z-30 text-2xl shadow-lg backdrop-blur-md"
        title=${isMuted ? 'Unmute' : 'Mute'}
      >
        ${isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  `;
};

export default App;
