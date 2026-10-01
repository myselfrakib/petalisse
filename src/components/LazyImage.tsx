import React, { useState, useEffect, useRef } from 'react';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
  priority?: boolean; // Loads immediately with high priority for above-the-fold display elements
  aspectRatio?: string; // e.g. "aspect-square", "aspect-[5/6]"
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackSrc,
  priority = false,
  aspectRatio,
  onError,
  onLoad,
  style,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync currentSrc and check if cached immediately on mount
  useEffect(() => {
    setCurrentSrc(src);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setIsLoaded(true);
    }
    if (onError) onError(e);
  };

  return (
    <div
      className={`relative overflow-hidden ${aspectRatio || ''} ${containerClassName}`}
    >
      {/* Skeleton Shimmer Preview Placeholder */}
      {!isLoaded && (
        <div
          className="absolute inset-0 size-full skeleton-shimmer z-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <span className="opacity-20 text-xl select-none">🌸</span>
        </div>
      )}

      {/* Optimized Image with Native Lazy Loading & Smooth Fade-In */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={style}
        {...rest}
      />
    </div>
  );
};
