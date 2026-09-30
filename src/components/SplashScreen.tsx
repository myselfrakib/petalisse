import React, { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (isFading || !isVisible) return;
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 700);
  };

  useEffect(() => {
    // Attempt playback immediately
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay prevented or video issue:', err);
      });
    }

    // Safety fallback: auto-dismiss after 4 seconds if onEnded doesn't fire
    timerRef.current = setTimeout(() => {
      dismiss();
    }, 4200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#14100E] text-white overflow-hidden transition-all duration-700 ease-out select-none cursor-pointer ${
        isFading ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="Welcome splash screen"
    >
      {/* Subtle Ambient Glow Behind Video */}
      <div className="absolute w-96 h-96 rounded-full bg-[#8E5B59]/20 blur-3xl pointer-events-none -translate-y-10" />

      {/* Skip button in top right */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-20 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-sans tracking-widest text-[#E8C5B8] uppercase backdrop-blur-md transition-all cursor-pointer shadow-sm active:scale-95"
      >
        Skip &rarr;
      </button>

      {/* Video Content */}
      <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full px-6">
        <div className="w-full max-w-[320px] sm:max-w-[380px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black relative flex items-center justify-center">
          <video
            ref={videoRef}
            src="/Gemini_Generated_Gif_9vqq7d9vqq7d9vqq.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={dismiss}
            onError={dismiss}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Boutique Signature Branding below Video */}
        <div className="mt-6 text-center">
          <span className="font-['Parisienne'] text-3xl sm:text-4xl text-[#E8C5B8] block tracking-wide drop-shadow-sm">
            Petalisse
          </span>
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-[#A89E94] mt-1 block">
            Handcrafted Floral Atelier
          </span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
