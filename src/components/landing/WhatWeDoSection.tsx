import { motion } from 'framer-motion';
import { Film, Wand2, Palette, Type, Music, Sparkles } from 'lucide-react';

export const WhatWeDoSection = () => {
  return (
    <section id="funkcije" className="relative py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Sve što ti treba za profesionalne video oglase na društvenim mrežama
          </h2>
        </motion.div>

        {/* Main Feature Cards - AI Video Studio & Photo Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto mb-16">
          {/* AI Video Studio Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            whileHover={{ y: -8 }}
            className="group relative"
          >
            <div className="h-full bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border-2 border-blue-100 hover:border-blue-200 transition-all shadow-lg hover:shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center">
                  <Film className="w-8 h-8 text-white" />
                </div>
                <div className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  ⚡ ~5 min
                </div>
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                AI Video Studio
              </h3>

              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Automatski pravi profesionalne reel-friendly videe (9:16) sa glasom, titlovima i muzikom.
                Objavi na sve platforme odjednom.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {['AI glas i script', 'Automatski titlovi', 'Muzika i brending', 'Multi-platform objava'].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF]" />
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Photo Editor Card - Expanded */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            whileHover={{ y: -8 }}
            className="group relative"
          >
            <div className="h-full bg-gradient-to-br from-cyan-50 to-purple-50 rounded-3xl p-8 border-2 border-cyan-100 hover:border-cyan-200 transition-all shadow-lg hover:shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2DD4BF] to-[#A855F7] flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-white" />
                </div>
                <div className="px-4 py-2 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium">
                  ⚡ 30 sek
                </div>
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Photo Editor
              </h3>

              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Uredi slike da tvoji videi iskoče. Napravi glatke frame-to-frame tranzicije
                između dve slike za dinamične klipove.
              </p>

              {/* Example workflow */}
              <div className="bg-white rounded-xl p-4 mb-4 border border-cyan-200">
                <p className="text-sm font-semibold text-gray-900 mb-3">Primer: Frame-to-Frame</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="flex-1 bg-gradient-to-r from-blue-100 to-blue-200 rounded p-2 text-center">
                    Slika 1<br/>(Početni frejm)
                  </div>
                  <span>→</span>
                  <div className="flex-1 bg-gradient-to-r from-purple-100 to-purple-200 rounded p-2 text-center">
                    Slika 2<br/>(Krajnji frejm)
                  </div>
                  <span>=</span>
                  <div className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded p-2 text-center text-white font-semibold">
                    Cool klip!
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['Dodaj/ukloni nameštaj', 'Dodaj karaktere', 'Glatke tranzicije', 'Različiti stilovi'].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#2DD4BF] to-[#A855F7]" />
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Customization Reassurances */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 border border-gray-200">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                100% prilagodljivo tvojoj agenciji
              </h3>
              <p className="text-gray-600">
                Svaki deo automatizacije je potpuno prilagođen tvom brendu i stilu
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
                  className="flex flex-col items-center text-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
