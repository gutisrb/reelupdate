import { useEffect, useRef } from 'react';

interface CloudinaryVideoProps {
  publicId: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export const CloudinaryVideo = ({
  publicId,
  className = '',
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
}: CloudinaryVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get Cloudinary cloud name from environment variable
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';

  // Construct Cloudinary video URL with optimizations
  const videoUrl = `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,f_auto/${publicId}.mp4`;

  useEffect(() => {
    // Ensure video plays on mobile devices
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay prevented:', error);
      });
    }
  }, [autoPlay]);

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline
      controls={controls}
      preload="metadata"
    >
      <source src={videoUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};
