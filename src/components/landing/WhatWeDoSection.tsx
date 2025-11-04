import { motion } from 'framer-motion';
import { Film, Wand2 } from 'lucide-react';

const features = [
  {
    icon: Film,
    title: 'AI Video Studio',
    description: 'Automatski pravi profesionalne reel-friendly videe (9:16) sa glasom, titlovima i muzikom. Objavi na sve platforme odjednom.',
    highlights: ['AI glas i script', 'Automatski titlovi', 'Muzika i brending', 'Multi-platform objava'],
    time: '~5 min',
    gradient: 'from-[#3B5BFF] to-[#2DD4BF]',
  },
  {
    icon: Wand2,
    title: 'Photo Editor',
    description: 'Uredi slike da tvoji videi iskoče. Dodaj ili ukloni nameštaj, dodaj karaktere, napravi glatke tranzicije.',
    highlights: ['Dodaj/ukloni nameštaj', 'Dodaj karaktere', 'Cool tranzicije', 'Različiti stilovi'],
    time: '30 sek',
    gradient: 'from-[#2DD4BF] to-[#3B5BFF]',
  },
];

export const WhatWeDoSection = () => {
  return (
    <section id="what-we-do" className="relative py-24 bg-white">
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
            Šta dobijaš?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sve što ti treba za profesionalne video oglase na društvenim mrežama
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="h-full bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-xl">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Time badge */}
                <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium mb-4">
                  ⚡ {feature.time}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Highlights */}
                <ul className="space-y-2">
                  {feature.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Glow effect on hover */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity -z-10`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
