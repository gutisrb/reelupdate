import { motion } from 'framer-motion';
import { Film, Wand2, Palette, Type, Music, Sparkles, ArrowRight } from 'lucide-react';
import { CloudinaryVideo } from '@/components/CloudinaryVideo';

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
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Sve što ti treba za profesionalne video oglase
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dva moćna alata koja rade zajedno ili odvojeno
          </p>
        </motion.div>

        {/* Horizontal Workflow */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Card 1: Reel Studio (AI Video Generator) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-6">
                {/* Icon & Title */}
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center mb-4">
                    <Film className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Reel Studio</h3>
                  <p className="text-sm text-blue-600 font-semibold">AI Video Generator</p>
                </div>

                {/* Description */}
                <p className="text-gray-700 leading-relaxed">
                  Automatski generiše profesionalne 9:16 reel videe sa AI glasom, titlovima i muzikom.
                  Upload slike, dodaj osnovne info, i AI kreira video za 5 minuta.
                </p>

                {/* Features */}
                <div className="space-y-2 pt-4">
                  {['AI glas i script', 'Automatski titlovi', 'Muzika i brending', 'Multi-platform objava'].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF]" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Time Badge */}
                <div className="pt-4">
                  <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    ⚡ ~5 min
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Stage Studio (Photo Editor) - Workflow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-100 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-6">
                {/* Icon & Title */}
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                    <Wand2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Stage Studio</h3>
                  <p className="text-sm text-purple-600 font-semibold">AI Photo Editor</p>
                </div>

                {/* Description */}
                <p className="text-gray-700 leading-relaxed">
                  Transformiši fotografije sa AI-om. Virtual staging, uklanjanje objekata, frame-to-frame animacije.
                  Editovane slike možeš koristiti u Reel Studio-u.
                </p>

                {/* Features */}
                <div className="space-y-2 pt-4">
                  {['Virtual staging', 'Ukloni/dodaj objekte', 'Promeni pozadinu', 'Frame-to-frame'].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Time Badge */}
                <div className="pt-4">
                  <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    ⚡ 30 sek po slici
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Combined Power */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border-2 border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-6">
                {/* Icon & Title */}
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Kombinuj</h3>
                  <p className="text-sm text-cyan-400 font-semibold">Za najbolje rezultate</p>
                </div>

                {/* Description */}
                <p className="text-white/80 leading-relaxed">
                  Prvo edituj slike u Stage Studio-u, pa ih koristi kao frejm ove u Reel Studio-u za dinamične videe.
                  Perfektna kombinacija!
                </p>

                {/* Workflow */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Wand2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm text-white/70">1. Edituj slike</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Film className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-white/70">2. Generiši video</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white">3. Objavi! 🎉</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Detailed Stage Studio Workflow Below */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12 border-2 border-purple-200 shadow-xl"
          >
            <div className="mb-12 text-center">
              <h3 className="text-4xl font-bold text-gray-900 mb-4">
                Stage Studio + Reel Studio = Perfektna kombinacija
              </h3>
              <p className="text-xl text-gray-600">
                Pogledaj kako funkcioniše kompletna automatizacija
              </p>
            </div>

            {/* Horizontal Flow - Improved Layout */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-7xl mx-auto">

              {/* Step 1: Original Photos */}
              <div className="flex-1 space-y-4">
                <p className="text-sm font-bold text-gray-700 text-center uppercase tracking-wide">Originalne slike</p>
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden border-4 border-purple-300 shadow-lg">
                    <img
                      src="https://res.cloudinary.com/dyarnpqaq/image/upload/demo-photo-1"
                      alt="Original 1"
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden border-4 border-purple-300 shadow-lg">
                    <img
                      src="https://res.cloudinary.com/dyarnpqaq/image/upload/demo-photo-2"
                      alt="Original 2"
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Arrow 1 */}
              <div className="flex justify-center items-center px-4">
                <ArrowRight className="w-12 h-12 text-purple-500" strokeWidth={2.5} />
              </div>

              {/* Step 2: AI Prompts + Edited Photos */}
              <div className="flex-1 space-y-4">
                <p className="text-sm font-bold text-gray-700 text-center uppercase tracking-wide">AI edituje</p>
                <div className="space-y-4">
                  {/* Prompt 1 + Edited 1 */}
                  <div className="space-y-2">
                    <div className="bg-white rounded-xl p-3 border-2 border-purple-300 shadow-sm">
                      <p className="text-sm text-gray-700 font-medium italic">"Dodaj nameštaj..."</p>
                    </div>
                    <div className="rounded-2xl overflow-hidden border-4 border-blue-400 shadow-lg">
                      <img
                        src="/wmremove-transformed (1).png"
                        alt="Edited 1"
                        className="w-full aspect-[4/3] object-cover"
                      />
                    </div>
                  </div>

                  {/* Prompt 2 + Edited 2 */}
                  <div className="space-y-2">
                    <div className="bg-white rounded-xl p-3 border-2 border-purple-300 shadow-sm">
                      <p className="text-sm text-gray-700 font-medium italic">"Dodaj karaktere..."</p>
                    </div>
                    <div className="rounded-2xl overflow-hidden border-4 border-pink-400 shadow-lg">
                      <img
                        src="/wmremove-transformed (2).png"
                        alt="Edited 2"
                        className="w-full aspect-[4/3] object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow 2 */}
              <div className="flex justify-center items-center px-4">
                <ArrowRight className="w-12 h-12 text-blue-500" strokeWidth={2.5} />
              </div>

              {/* Step 3: Final Video Output */}
              <div className="flex-1 space-y-4">
                <p className="text-sm font-bold text-gray-700 text-center uppercase tracking-wide">Finalni video</p>
                <div className="bg-gray-900 rounded-2xl p-6 shadow-xl">
                  <div className="rounded-xl overflow-hidden border-4 border-cyan-400 shadow-lg">
                    <CloudinaryVideo
                      publicId="2f8d4e8b-beef-4a78-bb5d-53ac5e10a2aa_resultb692dce3581d5b25_y7wnsc"
                      className="w-full h-full"
                      autoPlay={true}
                      loop={true}
                      muted={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-12 bg-white rounded-2xl p-8 border-2 border-purple-300 shadow-lg">
              <p className="text-base text-gray-700 text-center leading-relaxed">
                <strong className="text-lg">Kako radi:</strong> Stage Studio AI edituje originalne slike po tvojim promptovima.
                Zatim Reel Studio koristi te editovane slike kao prvi i poslednji frejm,
                i AI generiše glatku animaciju između njih sa glasom, titlovima i muzikom.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Customization Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto mt-24"
        >
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-10 md:p-12 border border-gray-200">
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                100% prilagodljivo tvojoj agenciji
              </h3>
              <p className="text-lg text-gray-600">
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
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center text-center gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
