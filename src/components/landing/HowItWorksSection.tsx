import { motion } from 'framer-motion';
import { Upload, Wand2, Film, Share2 } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload fotografije',
    description: 'Dodaj 5-10 fotografija nekretnine',
    time: '1 min',
    color: 'from-[#3B5BFF] to-[#3B82F6]',
  },
  {
    icon: Wand2,
    title: 'Uredi (opciono)',
    description: 'Istakni svoj video uz AI',
    time: '2 min',
    color: 'from-[#3B82F6] to-[#2DD4BF]',
  },
  {
    icon: Film,
    title: 'AI generiše video',
    description: 'Automatski pravi video sa muzikom i glasom',
    time: '3 min',
    color: 'from-[#2DD4BF] to-[#3B5BFF]',
  },
  {
    icon: Share2,
    title: 'Objavi svuda',
    description: 'Instagram, Facebook, TikTok - odjednom',
    time: 'Instant',
    color: 'from-[#3B5BFF] to-[#2DD4BF]',
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="kako" className="relative py-32 bg-gradient-to-b from-gray-950 via-black to-gray-950">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-block px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 mb-6">
            <span className="text-sm text-blue-300 font-semibold">Jednostavno kao 1-2-3-4</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Kako funkcioniše
          </h2>
          <p className="text-2xl text-white/70 max-w-2xl mx-auto">
            Od fotografija do objavljenog videa za manje od 5 minuta
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-6xl mx-auto">
          {/* Connecting line - visible on desktop */}
          <div className="hidden lg:block absolute top-[80px] left-[10%] right-[10%] h-1 bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] opacity-20 rounded-full" />

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="relative"
              >
                <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/40 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:border-white/30 transition-all h-full shadow-xl hover:shadow-2xl hover:shadow-blue-500/20">
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg text-white font-bold text-lg border-4 border-black`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 mt-6 mx-auto`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Time badge */}
                  <div className="text-center mb-4">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-semibold">
                      ⚡ {step.time}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed text-center">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-white/70 mb-4">
            Ukupno vreme: <span className="text-white font-semibold">~5 minuta</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
