import React from 'react';
import Image from 'next/image';

type VideoHeroProps = {
  videoSrc: string;
  poster: string;
  fallbackImage: string;
  alt?: string;
};

export const VideoHero: React.FC<VideoHeroProps> = ({
  videoSrc,
  poster,
  fallbackImage,
  alt = '',
}) => (
  <section className="relative min-h-screen flex items-center justify-center">
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src={fallbackImage}
        alt={alt}
        fill
        priority
        className="absolute inset-0 w-full h-full object-cover"
      />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/70" />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  </section>
);
