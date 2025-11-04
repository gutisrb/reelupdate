import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Image as ImageIcon, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VideoCardProps {
  title: string;
  imageCount: number;
  duration: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  size?: 'large' | 'medium';
}

export const VideoCard = ({
  title,
  imageCount,
  duration,
  thumbnailUrl,
  videoUrl,
  size = 'medium',
}: VideoCardProps) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-gray-900 group cursor-pointer ${
        size === 'large' ? 'row-span-2' : ''
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Thumbnail/Video */}
      <div className="relative aspect-[9/16] overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-white/60" />
              </div>
              <p className="text-white/40 text-sm px-4">Video primer</p>
            </div>
          </div>
        )}

        {/* Play overlay on hover */}
        {isHovering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <Badge className="bg-black/60 backdrop-blur-sm text-white border-white/20 gap-1">
            <ImageIcon className="w-3 h-3" />
            {imageCount} fotografija
          </Badge>
          <Badge className="bg-black/60 backdrop-blur-sm text-white border-white/20 gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <button className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1 group-hover:gap-2">
          Pogledaj detalje
          <span>→</span>
        </button>
      </div>

      {/* Glow effect on hover */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-orange-500 rounded-xl blur-xl -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovering ? 0.3 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};
