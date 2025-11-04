import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export const VideoExamplesSection = () => {
  return (
    <section className="relative py-24 bg-black">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Vidi kako izgleda
          </h2>
          <p className="text-xl text-white/60">
            Primeri video oglasa napravljenih u Reel Estate
          </p>
        </motion.div>

        {/* Video Grid - 3 examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[1, 2, 3].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              {/* Video placeholder with 9:16 aspect ratio */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 hover:border-white/30 transition-all">
                {/* 9:16 aspect ratio container */}
                <div className="aspect-[9/16] flex items-center justify-center relative">
                  {/* Placeholder gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3B5BFF]/20 via-[#3B82F6]/10 to-[#2DD4BF]/20 opacity-50" />

                  {/* Play button */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all">
                    <Play className="w-8 h-8 text-white/80 fill-white/20" />
                  </div>

                  {/* Video will be added here text */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs text-white/40 text-center">
                      Video example {index}
                    </p>
                  </div>
                </div>

                {/* Glow effect on hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity -z-10" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
