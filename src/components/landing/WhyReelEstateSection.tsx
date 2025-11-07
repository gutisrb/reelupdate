import { motion } from 'framer-motion';
import { Clock, Zap, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { ShaderBackground } from '@/components/ui/shaders-hero-section';

export const WhyReelEstateSection = () => {
  return (
    <ShaderBackground>
      <section id="zasto" className="relative py-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Zašto Reel Estate?
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Rešavamo najveće probleme real estate agenata na društvenim mrežama
            </p>
          </motion.div>

          {/* Benefits - Before/After Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Clock,
                before: 'Satima praviš oglase ručno',
                after: 'Generiši profesionalne oglase za par minuta',
                gradient: 'from-[#3B5BFF] to-[#3B82F6]',
              },
              {
                icon: Zap,
                before: 'Objavljuješ ručno na svaku platformu',
                after: 'Automatski objavi svuda odjednom',
                gradient: 'from-[#3B82F6] to-[#2DD4BF]',
              },
              {
                icon: Target,
                before: 'Teško se ističeš među konkurencijom',
                after: 'AI glas, titlovi, muzika - uvek profesionalno',
                gradient: 'from-[#2DD4BF] to-[#A855F7]',
              },
              {
                icon: TrendingUp,
                before: 'Skupo angažovanje editora',
                after: 'Jedna platforma za sve',
                gradient: 'from-[#A855F7] to-[#3B5BFF]',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="group relative"
              >
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-blue-500/10">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Before/After */}
                  <div className="space-y-4">
                    {/* Before */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-red-400 text-xs font-bold">✕</span>
                      </div>
                      <p className="text-white/60 leading-relaxed line-through decoration-red-500/50">
                        {item.before}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center gap-2 pl-3">
                      <ArrowRight className="w-5 h-5 text-white/40" />
                      <div className={`h-0.5 flex-1 bg-gradient-to-r ${item.gradient} opacity-30`} />
                    </div>

                    {/* After */}
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${item.gradient} bg-opacity-20 flex items-center justify-center flex-shrink-0 mt-1`}>
                        <span className="text-green-400 text-xs font-bold">✓</span>
                      </div>
                      <p className="text-white font-semibold text-lg leading-relaxed">
                        {item.after}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-20"
          >
            <div className="inline-block px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <p className="text-white text-lg font-medium">
                <span className="bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] bg-clip-text text-transparent font-bold text-2xl">
                  5 minuta
                </span>{' '}
                <span className="text-white/80">od fotografija do objavljenog videa</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </ShaderBackground>
  );
};
