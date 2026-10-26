'use client';

import React, { useState, useEffect } from 'react';
import { Film } from 'lucide-react';

export interface CinematicPosterProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  title?: string;
}

export default function CinematicPoster({
  src,
  alt,
  className = '',
  priority = false,
  fill = false,
  width,
  height,
  title,
}: CinematicPosterProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const displayTitle = title || alt || 'CoiCine';
  const showFallback = !src || hasError;

  if (showFallback) {
    return (
      <div
        className={`flex flex-col items-center justify-center text-center select-none overflow-hidden bg-gradient-to-br from-[#14141D] via-[#1a1a26] to-[#0c0c12] border border-[#E5A93C]/25 shadow-[0_0_20px_rgba(229,169,60,0.15)] p-4 relative group transition-all duration-300 ${
          fill ? 'absolute inset-0 w-full h-full' : ''
        } ${className}`}
        style={{
          width: fill ? undefined : width,
          height: fill ? undefined : height,
        }}
        title={displayTitle}
      >
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#14141D]/90 border border-[#E5A93C]/35 flex items-center justify-center mb-3 text-[#E5A93C] shadow-[0_0_15px_rgba(229,169,60,0.25)] transition-transform duration-300 group-hover:scale-110">
          <Film className="w-6 h-6 md:w-7 md:h-7 text-[#E5A93C]" />
        </div>
        <span className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#E5A93C]/90 font-bold mb-1.5">
          CoiCine
        </span>
        <p className="text-xs md:text-sm font-semibold text-white/90 line-clamp-2 px-2 max-w-[90%] leading-snug">
          {displayTitle}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      loading={priority ? 'eager' : 'lazy'}
      className={`${fill ? 'absolute inset-0 w-full h-full object-cover' : ''} ${className}`}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
    />
  );
}
