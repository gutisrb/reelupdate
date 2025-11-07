import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FloatingCTA } from './FloatingCTA';
import { ShaderBackground } from '@/components/ui/shaders-hero-section';

const faqs = [
  {
    emoji: '💰',
    question: 'Koliko košta?',
    answer: 'Platforma je trenutno u beta fazi i dostupna je potpuno besplatno za rane korisnike. Cene će biti objavljene kad izađemo iz beta faze.',
  },
  {
    emoji: '🖼️',
    question: 'Kako funkcioniše AI nameštanje?',
    answer: 'Upload fotografiju prazne ili nameštene prostorije. AI automatski dodaje ili uklanja nameštaj, dekor i osvetljenje. Idealno za prazne stanove, renovacije ili prezentacije različitih stilova.',
  },
  {
    emoji: '🎬',
    question: 'Šta je frame-to-frame video?',
    answer: 'Upload dva frejma (početnu i krajnju fotografiju), AI automatski pravi glatku animaciju između njih. Savršeno za prikazivanje transformacija prostorija - pre/posle, prazan/namešten, itd.',
  },
  {
    emoji: '⚡',
    question: 'Koliko vremena treba?',
    answer: 'Upload fotografija traje 1 minut. AI uređivanje (opciono) 30 sekundi. Video generacija 3 minute. Ukupno: ~5 minuta od fotografija do gotovog videa spremnog za objavu.',
  },
  {
    emoji: '📸',
    question: 'Mogu li koristiti svoje fotografije?',
    answer: 'Naravno! Upload bilo koje fotografije (tvoje ili od profesionalnog fotografa). Softver ih automatski optimizuje i pravi video. Nema ograničenja na tip kamere ili kvalitet.',
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ShaderBackground>
      <section id="faq" className="relative py-32">
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Najčešća Pitanja
            </h2>
            <p className="text-xl text-white/70">
              Sve što trebaš da znaš o Reel Estate
            </p>
          </motion.div>

        {/* Accordion - Better Aligned */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
            >
              {/* Question Button */}
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl flex-shrink-0">{faq.emoji}</span>
                  <span className="text-base md:text-lg font-semibold text-white">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-white/60 transition-transform flex-shrink-0 ml-4 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Answer */}
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pl-14">
                      <p className="text-white/80 leading-relaxed text-sm md:text-base">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16">
          <FloatingCTA
            variant="compact"
            headline="Imaš još pitanja?"
            description="Zakaži besplatnu konsultaciju i razgovaraj sa našim timom"
            buttonText="Zakaži poziv"
          />
        </div>
        </div>
      </section>
    </ShaderBackground>
  );
};
