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

  // Construct Cloudinary video URL with aggressive compression
  // w_720: limit width to 720px, br_500k: limit bitrate to 500kbps for smaller files
  const videoUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_720,br_500k,c_limit/${publicId}.mp4`;

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
      preload="none"
      loading="lazy"
    >
      <source src={videoUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};
