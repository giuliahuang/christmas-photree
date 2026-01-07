import React, { useRef, useState, useEffect } from 'react';
import { Stars, Gift, Volume2, VolumeX, Upload, Hand, Box, Sparkles } from 'lucide-react';
import { useStore } from '../store';

export const Overlay: React.FC = () => {
  const { addPhoto, mode, setMode } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  // Setup audio when ref is available
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Configure audio properties
    audio.volume = 0.3; // Set volume to 30%
    audio.loop = true; // Loop the music

    // Wait for audio to be ready before playing
    const handleCanPlay = () => {
      setAudioReady(true);
      // Attempt to play - may require user interaction on some browsers
      audio.play().catch((error) => {
        console.log('Auto-play prevented:', error);
        // Music will play when user interacts with the page
      });
    };

    // If audio is already loaded, try to play immediately
    if (audio.readyState >= 2) {
      handleCanPlay();
    } else {
      audio.addEventListener('canplay', handleCanPlay);
    }

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Play audio on first user interaction if autoplay was blocked
  useEffect(() => {
    let hasPlayed = false;

    const handleUserInteraction = () => {
      const audio = audioRef.current;
      if (audio && audio.paused && !hasPlayed) {
        hasPlayed = true;
        audio.play().catch((error) => {
          console.log('Failed to play audio on interaction:', error);
          hasPlayed = false; // Retry on next interaction
        });
      }
    };

    // Add listeners for user interaction (only once per event type)
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Handle mute/unmute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      // If audio is paused and user clicks unmute, try to play
      if (audio.paused && isMuted) {
        audio.play().catch((error) => {
          console.log('Failed to play audio:', error);
        });
      }
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          addPhoto(url);
      }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-12">
      
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-arix-gold font-display text-4xl md:text-6xl tracking-wider drop-shadow-lg">
            ARIX
          </h1>
          <p className="text-arix-goldLight font-serif italic text-sm md:text-lg tracking-widest mt-2 uppercase opacity-80">
            Interactive Christmas
          </p>
        </div>
        
        <div className="flex flex-col gap-2 items-end">
            <button 
                onClick={toggleMute}
                className="pointer-events-auto text-arix-gold hover:text-white transition-colors duration-500"
            >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <div className="text-arix-gold/50 text-[10px] font-serif uppercase tracking-widest mt-2">
                Gesture Control Active
            </div>
            <div className="flex gap-2 text-arix-gold/80 text-[10px]">
                 <span className="flex items-center gap-1"><Hand size={12}/> Open = Scatter</span>
                 <span className="flex items-center gap-1"><Box size={12}/> Fist = Tree</span>
            </div>
        </div>
      </header>

      {/* State Indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
         <h2 className={`text-arix-goldLight text-2xl font-display tracking-[0.5em] uppercase transition-opacity duration-1000 ${mode === 'TREE' ? 'opacity-0' : 'opacity-100'}`}>
             {mode === 'DETAIL' ? 'Memory' : 'Magic'}
         </h2>
      </div>

      {/* Footer Controls */}
      <footer className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div className="flex gap-4 pointer-events-auto items-center">
           {/* Fallback Manual Controls */}
           <button 
                onClick={() => setMode(mode === 'TREE' ? 'SCATTER' : 'TREE')}
                className="group flex flex-col items-center gap-2 text-arix-gold opacity-70 hover:opacity-100 transition-all duration-300"
            >
              <div className="p-3 rounded-full border border-arix-gold/30 bg-black/20 backdrop-blur-sm group-hover:border-arix-gold/80 group-hover:bg-arix-gold/10 transition-all">
                <Stars size={20} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-serif">{mode === 'TREE' ? 'Scatter' : 'Gather'}</span>
           </button>
           
           {/* Upload Photo */}
           <div className="relative group">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 text-arix-gold opacity-70 hover:opacity-100 transition-all duration-300"
                >
                    <div className="p-3 rounded-full border border-arix-gold/30 bg-black/20 backdrop-blur-sm group-hover:border-arix-gold/80 group-hover:bg-arix-gold/10 transition-all">
                        <Upload size={20} />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-serif">Add Photo</span>
                </button>
           </div>
        </div>

        <div className="text-right">
           <div className="h-px w-24 bg-gradient-to-r from-transparent via-arix-gold to-transparent mb-4 ml-auto opacity-50"></div>
           <p className="text-arix-emerald-100/40 text-[10px] md:text-xs font-serif tracking-widest uppercase">
             Show Hand to Camera<br/>To Control The Magic
           </p>
        </div>
      </footer>

      {/* Background Music */}
      <audio 
        ref={audioRef}
        src="/background-music.mp3"
        preload="auto"
        crossOrigin="anonymous"
      />
    </div>
  );
};

// Loading Screen Component
export const LoadingScreen: React.FC = () => {
  const { isLoaded, hasStarted, setStarted, loadingProgress } = useStore();
  
  const handleStart = () => {
    setStarted(true);
  };
  
  // Don't render if already started
  if (hasStarted) {
    return null;
  }
  
  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${hasStarted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-arix-emerald/10 via-transparent to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-arix-gold rounded-full animate-pulse opacity-60" />
      <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-arix-goldLight rounded-full animate-pulse opacity-40" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-arix-gold rounded-full animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-0.5 h-0.5 bg-arix-goldLight rounded-full animate-pulse opacity-30" style={{ animationDelay: '1.5s' }} />
      
      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-arix-gold font-display text-5xl md:text-7xl tracking-wider drop-shadow-lg mb-3">
            ARIX
          </h1>
          <p className="text-arix-goldLight font-serif italic text-sm md:text-lg tracking-[0.3em] uppercase opacity-70">
            Interactive Christmas
          </p>
        </div>
        
        {/* Loading indicator or Start button */}
        {!isLoaded ? (
          <div className="flex flex-col items-center gap-6">
            {/* Progress bar container */}
            <div className="relative w-64 md:w-80">
              {/* Background track */}
              <div className="h-[2px] bg-arix-gold/20 rounded-full overflow-hidden">
                {/* Progress fill */}
                <div 
                  className="h-full bg-gradient-to-r from-arix-gold/60 via-arix-gold to-arix-goldLight transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                />
              </div>
              
              {/* Progress percentage */}
              <div className="mt-4 text-center">
                <span className="text-arix-gold font-display text-xl tracking-widest">
                  {Math.floor(loadingProgress)}%
                </span>
              </div>
            </div>
            
            {/* Loading text */}
            <p className="text-arix-goldLight/60 font-serif text-xs tracking-[0.2em] uppercase animate-pulse">
              Preparing the magic...
            </p>
          </div>
        ) : (
          <button
            onClick={handleStart}
            className="group relative flex flex-col items-center gap-4 transition-all duration-500 hover:scale-105"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 -m-8 bg-arix-gold/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icon */}
            <div className="relative p-5 rounded-full border-2 border-arix-gold/40 bg-black/40 backdrop-blur-sm group-hover:border-arix-gold group-hover:bg-arix-gold/10 transition-all duration-500">
              <Sparkles className="w-8 h-8 text-arix-gold group-hover:text-arix-goldLight transition-colors duration-500" />
            </div>
            
            {/* Button text */}
            <span className="text-arix-gold font-display text-2xl md:text-3xl tracking-[0.4em] uppercase group-hover:text-arix-goldLight transition-colors duration-500">
              Start
            </span>
            
            {/* Subtitle */}
            <span className="text-arix-goldLight/50 font-serif text-xs tracking-[0.2em] uppercase group-hover:text-arix-goldLight/70 transition-colors duration-500">
              Click to enter
            </span>
          </button>
        )}
        
        {/* Decorative line */}
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-arix-gold/40 to-transparent mt-8" />
      </div>
    </div>
  );
};
