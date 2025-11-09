import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

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
  autoPlay = false,
  loop = true,
  muted = true,
  controls = false,
}: CloudinaryVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get Cloudinary cloud name from environment variable
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';

  // Construct Cloudinary video URL with aggressive compression
  // w_720: limit width to 720px, br_500k: limit bitrate to 500kbps for smaller files
  const videoUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_720,br_500k,c_limit/${publicId}.mp4`;

  useEffect(() => {
    // Only autoplay if explicitly requested
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay prevented:', error);
      });
      setIsPlaying(true);
    }
  }, [autoPlay]);

  const handleMouseEnter = () => {
    if (videoRef.current && !autoPlay && !isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current && !autoPlay && isPlaying) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        className={className}
        loop={loop}
        muted={muted}
        playsInline
        controls={controls}
        preload="none"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Play button overlay - only show if not autoplaying and not playing */}
      {!autoPlay && !isPlaying && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity group-hover:bg-black/20">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
};
