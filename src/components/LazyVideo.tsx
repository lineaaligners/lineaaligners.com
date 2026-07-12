import React, { useEffect, useRef } from 'react';

/**
 * Performance-friendly video: only downloads/plays while visible in the viewport,
 * pauses as soon as it scrolls out of view. Prevents multiple background MP4s
 * from decoding simultaneously (major cause of scroll jank/freezes on the homepage).
 */
export const LazyVideo: React.FC<{
  src: string;
  className?: string;
}> = ({ src, className }) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Lazily attach the source the first time it becomes visible
            if (!video.src) video.src = src;
            video.play().catch(() => {/* autoplay may be blocked; ignore */});
          } else {
            video.pause();
          }
        });
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      loop
      muted
      playsInline
      preload="none"
      className={className}
    />
  );
};
