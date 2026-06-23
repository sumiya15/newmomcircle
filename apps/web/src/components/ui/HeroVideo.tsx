"use client";

import React from 'react';

interface HeroVideoProps {
  children?: React.ReactNode;
  videoUrl?: string;
  posterUrl?: string;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({
  children,
  videoUrl = "https://www.pexels.com/download/video/3571264/",
  posterUrl = "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600",
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden w-full">
      {/* Layer 1: Looping background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0 filter saturate-[0.85] brightness-[0.7]"
        autoPlay
        muted
        loop
        playsInline
        poster={posterUrl}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Layer 2: Gradient overlay — dark base + warm peach vignette bottom */}
      <div 
        className="absolute inset-0 z-10" 
        style={{
          background: 'linear-gradient(to bottom, rgba(20,8,4,0.55) 0%, rgba(20,8,4,0.45) 40%, rgba(232,115,74,0.18) 80%, rgba(20,8,4,0.72) 100%)'
        }}
      />

      {/* Layer 3: Content */}
      <div className="relative z-20 text-center max-w-[860px] px-6 mx-auto w-full">
        {children}
      </div>
    </section>
  );
};

export default HeroVideo;
