
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameType, GameState, MATH_TARGETS, LETTER_TARGETS } from './types';
import GameScene from './components/GameScene';
import { getMagicalCompliment, generateMagicalSpeech, decodeBase64, decodeAudioData } from './geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    playing: false,
    mathLevel: 1,
    spellingLevel: 1,
    currentMathTarget: MATH_TARGETS[0],
    currentLetterTarget: LETTER_TARGETS[0],
    score: 0,
    magicMessage: "Welcome, Super Eva! Let's ride!"
  });

  const [loadingMsg, setLoadingMsg] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioRefs = useRef<{
    loop: any;
    pop: any;
    magic: any;
    theme: any;
  } | null>(null);

  const audioContextRef = useRef<any>(null);

  useEffect(() => {
    // Initializing sounds with strict assets path
    const loop = new (window as any).Audio('./assets/loop.mp3');
    loop.loop = true;
    loop.volume = 0.35;
    
    const pop = new (window as any).Audio('./assets/pop.mp3');
    pop.volume = 0.5;
    
    const magic = new (window as any).Audio('./assets/magic.mp3');
    magic.volume = 0.7;
    
    const theme = new (window as any).Audio('./assets/eva_theme.mp3');
    theme.volume = 0.7;

    audioRefs.current = { loop, pop, magic, theme };

    // Pre-load logic to avoid "stuck on loading" issues
    const handleCanPlay = () => console.log("Audio assets ready");
    loop.addEventListener('canplaythrough', handleCanPlay);

    return () => {
      loop.pause();
      theme.pause();
      loop.removeEventListener('canplaythrough', handleCanPlay);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = (sound: 'pop' | 'magic' | 'theme') => {
    if (!audioRefs.current || isMuted) return;
    const audio = audioRefs.current[sound];
    audio.currentTime = 0;
    audio.play().catch(e => console.warn(`Audio ${sound} blocked or failed:`, e));
  };

  const speakMagically = async (text: string) => {
    if (isMuted) return;
    
    setIsSpeaking(true);
    const base64 = await generateMagicalSpeech(text);
    if (!base64) {
      setIsSpeaking(false);
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = audioContextRef.current;
      const audioData = decodeBase64(base64);
      const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (e) {
      console.error("Audio playback error:", e);
      setIsSpeaking(false);
    }
  };

  const handleScoreUpdate = useCallback(async (type: GameType) => {
    playSound('magic');

    let nextMathLevel = state.mathLevel;
    let nextSpellingLevel = state.spellingLevel;
    let nextMathTarget = state.currentMathTarget;
    let nextLetterTarget = state.currentLetterTarget;

    if (type === GameType.MATH) {
      nextMathLevel += 1;
      nextMathTarget = MATH_TARGETS[(nextMathLevel - 1) % MATH_TARGETS.length];
    } else {
      nextSpellingLevel += 1;
      nextLetterTarget = LETTER_TARGETS[(nextSpellingLevel - 1) % LETTER_TARGETS.length];
      
      if (nextSpellingLevel === 4) {
        playSound('theme');
      }
    }

    setState(prev => ({
      ...prev,
      mathLevel: nextMathLevel,
      spellingLevel: nextSpellingLevel,
      currentMathTarget: nextMathTarget,
      currentLetterTarget: nextLetterTarget,
      score: prev.score + 10
    }));

    setLoadingMsg("MAGIC VOICES...");
    const msg = await getMagicalCompliment("Eva", type === GameType.MATH ? nextMathLevel : nextSpellingLevel, type);
    setState(prev => ({ ...prev, magicMessage: msg }));
    setLoadingMsg("");
    
    speakMagically(msg);
  }, [state.mathLevel, state.spellingLevel, state.currentMathTarget, state.currentLetterTarget, isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRefs.current) {
        if (newMuted) {
          audioRefs.current.loop.pause();
        } else if (state.playing) {
          audioRefs.current.loop.play().catch(() => {});
        }
      }
      return newMuted;
    });
  };

  const startGame = () => {
    setState(prev => ({ ...prev, playing: true }));
    if (audioRefs.current && !isMuted) {
      audioRefs.current.loop.play().catch(() => {});
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    speakMagically("Welcome to the magic ride, Eva! Let's pop some bubbles!");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a041a] flex flex-col items-center justify-center select-none">
      
      <button 
        onClick={toggleMute}
        className="absolute top-6 right-6 z-[100] p-4 bg-white/10 backdrop-blur-xl rounded-full shadow-2xl border border-white/20 hover:scale-110 active:scale-95 transition-all pointer-events-auto"
      >
        <span className="text-2xl drop-shadow-md">{isMuted ? '🔇' : '🔊'}</span>
      </button>

      {!state.playing && (
        <div className="z-50 relative flex flex-col items-center w-full h-full justify-center">
          <div className="absolute inset-0 z-0">
            <img 
              src="./assets/input_file_1.png" 
              className="w-full h-full object-cover animate-pulse-slow" 
              alt="Super Eva Poster" 
              onError={(e) => {
                const target = e.target as any;
                if (target.src.includes('assets/')) {
                  target.src = 'input_file_1.png';
                } else {
                  target.style.display = 'none';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a041a] via-transparent to-transparent opacity-80" />
          </div>

          <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000 mt-auto mb-24 px-8">
            <button 
              onClick={startGame}
              className="group relative inline-flex items-center justify-center px-24 py-10 font-black text-white transition-all duration-300 bg-gradient-to-br from-[#ff00ff] to-[#7b61ff] rounded-full hover:from-[#ff55ff] hover:to-[#9b81ff] shadow-[0_20px_60px_rgba(255,0,255,0.4)] hover:shadow-[0_25px_80px_rgba(123,97,255,0.6)] hover:scale-110 active:scale-90 text-5xl border-8 border-white/30"
            >
              PLAY NOW!
            </button>
            <p className="mt-8 text-white font-bold text-2xl tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,1)] uppercase">
              ✨ An Educational Adventure ✨
            </p>
          </div>
        </div>
      )}

      {state.playing && (
        <>
          <div className="absolute top-0 w-full p-8 flex flex-col md:flex-row justify-between items-center z-40 pointer-events-none">
            <div className="flex gap-8 mb-6 md:mb-0">
              <div className="bg-indigo-900/40 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border-2 border-indigo-400/40 flex flex-col items-center min-w-[150px] transform hover:scale-105 transition-all pointer-events-auto">
                <span className="text-[11px] uppercase font-black text-indigo-300 tracking-[0.3em] mb-1">Math Level</span>
                <span className="text-4xl font-black text-white drop-shadow-lg">{state.mathLevel}</span>
                <div className="mt-3 px-5 py-2 bg-indigo-500 text-white rounded-full text-sm font-black shadow-lg animate-bounce-slow border-2 border-white/20">
                  FIND: {state.currentMathTarget}
                </div>
              </div>
              <div className="bg-pink-900/40 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border-2 border-pink-400/40 flex flex-col items-center min-w-[150px] transform hover:scale-105 transition-all pointer-events-auto">
                <span className="text-[11px] uppercase font-black text-pink-300 tracking-[0.3em] mb-1">Spell Level</span>
                <span className="text-4xl font-black text-white drop-shadow-lg">{state.spellingLevel}</span>
                <div className="mt-3 px-5 py-2 bg-pink-500 text-white rounded-full text-sm font-black shadow-lg animate-bounce-slow border-2 border-white/20">
                  FIND: {state.currentLetterTarget}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl p-2 rounded-full shadow-2xl pointer-events-auto transform hover:rotate-3 transition-transform">
              <div className="bg-gradient-to-br from-yellow-300 to-orange-500 px-8 py-3 rounded-full flex items-center gap-4 border-4 border-white/30">
                <span className="text-3xl drop-shadow-md">⭐</span>
                <span className="text-4xl font-black text-white drop-shadow-xl">{state.score}</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-12 w-full px-8 flex justify-center z-40 pointer-events-none">
            <div className="max-w-2xl w-full bg-gradient-to-br from-pink-500/20 to-indigo-600/20 backdrop-blur-2xl p-2 rounded-[3rem] shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-white/20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="bg-white/95 rounded-[2.5rem] px-10 py-8 flex flex-col items-center gap-3 relative overflow-hidden">
                {isSpeaking && (
                   <div className="absolute top-4 right-8 flex gap-2 items-end h-6">
                     <div className="w-1.5 bg-pink-500 animate-[bounce_0.6s_infinite] h-full" style={{ animationDelay: '0s' }}></div>
                     <div className="w-1.5 bg-indigo-500 animate-[bounce_0.6s_infinite] h-2/3" style={{ animationDelay: '0.1s' }}></div>
                     <div className="w-1.5 bg-pink-500 animate-[bounce_0.6s_infinite] h-full" style={{ animationDelay: '0.2s' }}></div>
                   </div>
                )}
                <p className="text-center text-[#1a0a3a] font-black text-2xl md:text-3xl leading-tight">
                  "{state.magicMessage}"
                </p>
                {loadingMsg && <p className="text-[12px] uppercase tracking-[0.4em] text-indigo-500 font-black animate-pulse mt-2">Connecting to Stars...</p>}
              </div>
            </div>
          </div>

          <GameScene 
            onScoreUpdate={handleScoreUpdate} 
            onAnyPop={() => playSound('pop')}
            mathTarget={state.currentMathTarget}
            letterTarget={state.currentLetterTarget}
          />
        </>
      )}

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
