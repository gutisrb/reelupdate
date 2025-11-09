import { motion } from 'framer-motion';
import { Film, Wand2, Palette, Type, Music, Sparkles, ArrowRight, Play } from 'lucide-react';
import { useState, useRef } from 'react';

export const WhatWeDoSection = () => {
  return (
    <section id="funkcije" className="relative py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Sve što ti treba za profesionalne video oglase
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Kompletna automatizacija: od fotografije do finalnog videa spremnog za objavu
          </p>
        </motion.div>

        {/* Three-Column Workflow */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Photo Editor - Input */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-cyan-50 to-purple-50 rounded-2xl p-6 border-2 border-cyan-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2DD4BF] to-[#A855F7] flex items-center justify-center flex-shrink-0">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">1. Photo Editor</h3>
                  <p className="text-sm text-gray-600">AI edituje slike</p>
                </div>
              </div>

              {/* Original Photos */}
              <div className="space-y-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Originalne slike:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-blue-200">
                      <img
                        src="https://res.cloudinary.com/dyarnpqaq/image/upload/demo-photo-1"
                        alt="Original 1"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-purple-200">
                      <img
                        src="https://res.cloudinary.com/dyarnpqaq/image/upload/demo-photo-2"
                        alt="Original 2"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Edits */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">AI edituje:</p>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-gray-700">"Dodaj moderan nameštaj"</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-gray-700">"Dodaj karaktere"</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center pt-2">
                <div className="px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-semibold">
                  ⚡ 30 sek
                </div>
              </div>
            </motion.div>

            {/* Column 2: AI Video Studio - Processing */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center flex-shrink-0">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">2. AI Video Studio</h3>
                  <p className="text-sm text-gray-600">Generiše video</p>
                </div>
              </div>

              {/* Processing Steps */}
              <div className="space-y-3 mb-6">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Ubaci editovane slike:</p>
                  <div className="flex gap-2 items-center justify-center py-2">
                    <div className="w-16 h-16 rounded bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xs text-blue-700 font-semibold">
                      Frame 1
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="w-16 h-16 rounded bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-xs text-purple-700 font-semibold">
                      Frame 2
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 mb-2">AI automatski dodaje:</p>
                  {['AI glas i script', 'Automatski titlovi', 'Muzika', 'Brending'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF]" />
                      <p className="text-xs text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  ⚡ ~5 min
                </div>
              </div>
            </motion.div>

            {/* Column 3: Output Video */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border-2 border-gray-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center flex-shrink-0">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">3. Finalni Video</h3>
                  <p className="text-sm text-white/70">Spreman za objavu</p>
                </div>
              </div>

              {/* Video Player */}
              <HoverVideoPlayer
                src="https://res.cloudinary.com/dyarnpqaq/video/upload/w_720,br_500k,c_limit/demo-video-4.mp4"
              />

              <div className="mt-4 space-y-3">
                <div className="text-center">
                  <p className="text-white/90 text-sm mb-3">Video format: 9:16 (Reel-friendly)</p>
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] rounded-full">
                    <p className="text-white text-xs font-semibold">Spreman za objavu! 🎬</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs font-semibold text-white/80 mb-2">Objavi na:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Instagram', 'TikTok', 'YouTube', 'Facebook'].map((platform, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-white/20 rounded text-white/90">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Customization Reassurances */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 md:p-10 border border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                100% prilagodljivo tvojoj agenciji
              </h3>
              <p className="text-gray-600">
                Svaki deo automatizacije je potpuno prilagođen tvom brendu i stilu
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: Palette, text: 'Tvoj vodeni žig i brending' },
                { icon: Type, text: 'Tvoj stil pisanja' },
                { icon: Music, text: 'Izbor muzike' },
                { icon: Sparkles, text: 'Veliki izbor glasova' },
                { icon: Type, text: 'Stilovi i fontovi titlova' },
                { icon: Wand2, text: 'Potpuna customizacija' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex flex-col items-center text-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Hover-to-play video component
const HoverVideoPlayer = ({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
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
      className="relative aspect-[9/16] rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
      />

      {/* Play button overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity group-hover:bg-black/20">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
};
