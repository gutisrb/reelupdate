import { motion } from 'framer-motion';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { useState, useRef } from 'react';
import { CloudinaryVideo } from '@/components/CloudinaryVideo';

export const VideoExamplesSection = () => {
  return (
    <section className="relative py-32 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <span className="text-sm text-purple-400 font-medium">Pogledaj rezultate</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Vidi kako izgleda
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Primeri video oglasa napravljenih u Reel Estate za pravе real estate agente
          </p>
        </motion.div>

        {/* Video Grid - 3 examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {['demo-video-1', 'demo-video-2', 'demo-video-3'].map((publicId, index) => (
            <VideoCard key={index} publicId={publicId} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const VideoCard = ({ publicId, index }: { publicId: string; index: number }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current && isPlaying) {
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

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  // Get Cloudinary cloud name
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
  // Aggressive compression: w_720 limits width, br_500k limits bitrate for faster loading
  const videoUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_720,br_500k,c_limit/${publicId}.mp4`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative"
    >
      {/* Video with 9:16 aspect ratio */}
      <div
        className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 hover:border-white/30 transition-all cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* 9:16 aspect ratio container */}
        <div className="aspect-[9/16] relative bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Play button overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity group-hover:bg-black/30">
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              {/* Mute/Unmute Button */}
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Volume Slider */}
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer volume-slider"
                  style={{
                    background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Glow effect on hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity -z-10" />
      </div>
    </motion.div>
  );
};
