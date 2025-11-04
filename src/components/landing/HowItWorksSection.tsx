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
    description: 'AI dodaje ili uklanja nameštaj po želji',
    time: '30 sek',
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
    <section id="how-it-works" className="relative py-24 bg-gradient-to-b from-black/80 via-transparent to-black/80">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Kako funkcioniše
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Od fotografija do objavljenog videa za manje od 5 minuta
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line - hidden on mobile */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] opacity-30 transform -translate-y-1/2" />

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-gray-900/30 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all h-full">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Time badge */}
                  <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-medium mb-3">
                    {step.time}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {step.description}
                  </p>

                  {/* Step number */}
                  <div className="absolute top-6 right-6 text-5xl font-bold text-white/5">
                    {index + 1}
                  </div>
                </div>

                {/* Connector dot - hidden on mobile */}
                <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] z-10" />
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
