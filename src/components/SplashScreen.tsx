import React, { useEffect, useState, useRef } from 'react';
import { useContent } from '../context/ContentContext';
import { SplashScreenConfig } from '../types';

interface SplashScreenProps {
  forcePreview?: boolean;
  previewConfig?: SplashScreenConfig;
  onClosePreview?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  forcePreview = false,
  previewConfig,
  onClosePreview,
}) => {
  const { siteContent } = useContent();
  const config: SplashScreenConfig | undefined = previewConfig || siteContent?.splashScreen;

  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const lottieContainerRef = useRef<HTMLDivElement>(null);

  // Check if splash screen should be shown
  useEffect(() => {
    if (!config) return;

    if (forcePreview) {
      setVisible(true);
      setExiting(false);
      setProgress(0);
      return;
    }

    if (!config.enabled || !config.mediaUrl) {
      setVisible(false);
      return;
    }

    // Check session storage if showOncePerSession is true (default)
    const showOnce = config.showOncePerSession !== false;
    try {
      const alreadyShown = sessionStorage.getItem('petalisse_splash_dismissed');
      if (showOnce && alreadyShown === 'true') {
        setVisible(false);
        return;
      }
    } catch {
      // Ignore storage errors in restricted iframes
    }

    // Show splash screen on first visit
    setVisible(true);
    setExiting(false);
    setProgress(0);
  }, [config, forcePreview]);

  // Dismiss logic with fade out
  const handleDismiss = () => {
    if (exiting) return;
    setExiting(true);

    if (!forcePreview && config?.showOncePerSession !== false) {
      try {
        sessionStorage.setItem('petalisse_splash_dismissed', 'true');
      } catch {}
    }

    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      if (forcePreview && onClosePreview) {
        onClosePreview();
      }
    }, 600);
  };

  // Timer & progress bar for auto-dismissal
  useEffect(() => {
    if (!visible || exiting || !config) return;

    const durationSec = Math.max(config.duration || 3.5, 1.5);
    const durationMs = durationSec * 1000;
    const intervalMs = 40;
    const step = (intervalMs / durationMs) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(interval);
          if (config.autoDismiss !== false) {
            handleDismiss();
          }
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [visible, exiting, config]);

  // Lottie Animation loader
  useEffect(() => {
    if (!visible || !config || config.mediaType !== 'lottie') return;

    let animInstance: any = null;
    let isCancelled = false;

    const loadLottie = async () => {
      try {
        let lottie = (window as any).lottie;
        if (!lottie) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src*="lottie-web"]');
            if (existing) {
              existing.addEventListener('load', () => resolve());
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
          lottie = (window as any).lottie;
        }

        if (isCancelled || !lottieContainerRef.current || !lottie) return;

        lottieContainerRef.current.innerHTML = '';

        let animationData: any = undefined;
        let animationPath: string | undefined = undefined;

        if (config.lottieData) {
          try {
            animationData = typeof config.lottieData === 'string'
              ? JSON.parse(config.lottieData)
              : config.lottieData;
          } catch {
            animationPath = config.mediaUrl;
          }
        } else {
          animationPath = config.mediaUrl;
        }

        animInstance = lottie.loadAnimation({
          container: lottieContainerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          ...(animationData ? { animationData } : { path: animationPath }),
        });
      } catch (err) {
        console.warn('Lottie render warning:', err);
      }
    };

    loadLottie();

    return () => {
      isCancelled = true;
      if (animInstance) {
        try {
          animInstance.destroy();
        } catch {}
      }
    };
  }, [visible, config?.mediaType, config?.mediaUrl, config?.lottieData]);

  // Keyboard shortcut (Escape to skip)
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  if (!visible || !config) return null;

  const bgColor = config.backgroundColor || '#FDFBF7';

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden transition-all duration-600 ease-out ${
        exiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#E8C5B8]/30 via-[#F7DCD3]/10 to-transparent pointer-events-none rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#E8C5B8]/30 via-[#F7DCD3]/10 to-transparent pointer-events-none rounded-full blur-3xl -ml-20 -mb-20" />

      {/* Top Header Bar / Skip Button */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {forcePreview && (
            <span className="px-2.5 py-1 rounded-full bg-[#8E5B59] text-white text-[10px] font-semibold uppercase tracking-wider shadow-xs animate-pulse">
              Live Splash Preview
            </span>
          )}
        </div>

        {config.showSkipButton !== false && (
          <button
            type="button"
            onClick={handleDismiss}
            className="group px-4 py-1.5 rounded-full bg-black/5 hover:bg-black/10 active:scale-95 text-[#6B5F55] hover:text-[#2C2724] text-xs font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer backdrop-blur-xs border border-black/5 flex items-center gap-1.5 shadow-2xs"
            title="Skip splash screen"
          >
            <span>{forcePreview ? 'Close Preview' : 'Enter Boutique'}</span>
            <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </button>
        )}
      </div>

      {/* Center Media Showcase */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto max-w-lg w-full z-10 text-center px-4">
        {/* Animated Media Container */}
        <div className="relative w-full max-w-sm sm:max-w-md aspect-square max-h-[50vh] flex items-center justify-center rounded-3xl overflow-hidden p-2">
          {config.mediaType === 'video' && (
            <video
              src={config.mediaUrl}
              autoPlay
              muted
              playsInline
              loop={false}
              onEnded={() => {
                if (config.autoDismiss !== false) {
                  handleDismiss();
                }
              }}
              className="max-h-full max-w-full object-contain rounded-2xl drop-shadow-md animate-fadeIn"
            />
          )}

          {config.mediaType === 'gif' && (
            <img
              src={config.mediaUrl}
              alt={config.title || 'Petalisse Splash'}
              className="max-h-full max-w-full object-contain rounded-2xl drop-shadow-md animate-fadeIn"
            />
          )}

          {config.mediaType === 'lottie' && (
            <div
              ref={lottieContainerRef}
              className="size-full flex items-center justify-center animate-fadeIn"
            />
          )}
        </div>

        {/* Title and Tagline */}
        {(config.title || config.subtitle) && (
          <div className="mt-4 sm:mt-6 animate-fadeIn">
            {config.title && (
              <h1 className="font-['Parisienne'] text-4xl sm:text-5xl md:text-6xl text-[#6B1A2A] tracking-wide leading-tight">
                {config.title}
              </h1>
            )}
            {config.subtitle && (
              <p className="font-cormorant text-xs sm:text-sm uppercase tracking-[0.25em] text-[#8C827A] mt-1 font-medium">
                {config.subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Progress Bar */}
      <div className="w-full max-w-md z-10 flex flex-col items-center gap-2">
        <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#8E5B59] transition-all duration-75 ease-linear rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-[#A89E94] tracking-wider uppercase font-sans">
          Opening Boutique...
        </p>
      </div>
    </div>
  );
};
