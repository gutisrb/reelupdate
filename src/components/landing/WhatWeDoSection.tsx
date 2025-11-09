import { motion } from 'framer-motion';
import { Film, Wand2, Palette, Type, Music, Sparkles, Upload, Sparkle, Plus } from 'lucide-react';

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
            Dva moćna alata koja možeš koristiti zajedno ili odvojeno
          </p>
        </motion.div>

        {/* Two Main Tools */}
        <div className="max-w-7xl mx-auto space-y-16">

          {/* Tool 1: AI Video Studio */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-3xl p-8 md:p-12 border-2 border-blue-100 shadow-xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Description */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] rounded-full">
                  <Film className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold">AI Video Studio</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Automatski pravi profesionalne reel-friendly videe
                </h3>

                <p className="text-lg text-gray-600 leading-relaxed">
                  Upload fotografije, dodaj osnovne informacije o nekretnini, i AI će za 5 minuta
                  kreirati video (9:16) sa AI glasom, titlovima i muzikom. Objavi odmah na sve platforme.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  {[
                    { icon: Sparkle, text: 'AI glas i script' },
                    { icon: Type, text: 'Automatski titlovi' },
                    { icon: Music, text: 'Muzika i brending' },
                    { icon: Upload, text: 'Multi-platform objava' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-100">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B5BFF] to-[#2DD4BF] flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                    <span className="text-blue-700 font-semibold text-sm">⚡ ~5 min</span>
                  </div>
                </div>
              </div>

              {/* Right: Visual Mockup */}
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-blue-200">
                  {/* Interface Mockup */}
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <h4 className="font-bold text-gray-900">Reel Studio</h4>
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Processing
                      </div>
                    </div>

                    {/* Photo Slots Preview */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-3">Slike (5-6):</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-blue-300"
                          >
                            <Upload className="w-6 h-6 text-blue-600" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Property Details */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-3">Detalji:</p>
                      <div className="space-y-2">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500">Naslov</p>
                          <p className="text-sm font-medium text-gray-900">Luksuzni stan u centru grada</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <p className="text-xs text-gray-500">Cena</p>
                            <p className="text-sm font-medium text-gray-900">€250,000</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <p className="text-xs text-gray-500">Površina</p>
                            <p className="text-sm font-medium text-gray-900">85m²</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Status */}
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkle className="w-5 h-5 text-white animate-pulse" />
                        <p className="text-white font-bold">AI generiše video...</p>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-white rounded-full h-2" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] rounded-3xl blur-2xl opacity-20 -z-10" />
              </div>
            </div>
          </motion.div>

          {/* Tool 2: Photo Editor */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-3xl p-8 md:p-12 border-2 border-purple-100 shadow-xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Visual Demo */}
              <div className="order-2 lg:order-1">
                <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-purple-200">
                  <p className="text-sm font-bold text-gray-900 mb-4">Kako funkcioniše:</p>

                  {/* Before/After Images */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Originalna</p>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-purple-200">
                        <img
                          src="https://res.cloudinary.com/dyarnpqaq/image/upload/demo-photo-1"
                          alt="Original"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">AI editovana</p>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-pink-200">
                        <img
                          src="https://res.cloudinary.com/dyarnpqaq/image/upload/demo-photo-2"
                          alt="AI Edited"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Prompt Example */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4">
                    <p className="text-white/90 text-xs mb-2">AI Prompt primer:</p>
                    <p className="text-white font-semibold text-sm italic">
                      "Dodaj moderan nameštaj i dekoracije..."
                    </p>
                  </div>
                </div>

                <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20 -z-10" />
              </div>

              {/* Right: Description */}
              <div className="order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <Wand2 className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold">AI Photo Editor</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                  AI edituje slike za još bolje rezultate
                </h3>

                <p className="text-lg text-gray-600 leading-relaxed">
                  Transformiši fotografije nekretnina pomoću AI-a. Dodaj nameštaj, ukloni objekte,
                  promeni pozadinu, ili kreiraj frame-to-frame animacije za dinamičnije videe.
                </p>

                <div className="space-y-3 pt-4">
                  {[
                    'Virtual staging - dodaj nameštaj',
                    'Ukloni ili dodaj objekte',
                    'Promeni pozadinu i osvetljenje',
                    'Frame-to-frame animacije',
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
                    <span className="text-purple-700 font-semibold text-sm">⚡ 30 sek po slici</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Combination Example */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 border-2 border-gray-700 shadow-2xl"
          >
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] rounded-full mb-8">
                <Plus className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">Kombinuj oba alata</span>
              </div>

              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Za najbolje rezultate, koristi zajedno
              </h3>

              <p className="text-xl text-white/80 mb-12 leading-relaxed">
                Prvo edituj slike sa Photo Editor-om, pa ih upload-uj u AI Video Studio za finaln video.
                <br />
                <span className="text-white/60">Perfektna kombinacija za impresivne rezultate.</span>
              </p>

              {/* Process Flow */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 flex-1 max-w-xs">
                  <Wand2 className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-white font-semibold mb-1">1. Photo Editor</p>
                  <p className="text-white/60 text-sm">Edituj fotografije</p>
                </div>

                <div className="hidden md:block text-white/40 text-4xl">→</div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 flex-1 max-w-xs">
                  <Film className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-white font-semibold mb-1">2. AI Video Studio</p>
                  <p className="text-white/60 text-sm">Generiši video</p>
                </div>

                <div className="hidden md:block text-white/40 text-4xl">→</div>

                <div className="bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] rounded-2xl p-6 flex-1 max-w-xs">
                  <Sparkles className="w-12 h-12 text-white mx-auto mb-3" />
                  <p className="text-white font-bold mb-1">3. Objavi</p>
                  <p className="text-white/90 text-sm">Spreman za sve platforme!</p>
                </div>
              </div>
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
                  className="flex flex-col items-center text-center gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
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
