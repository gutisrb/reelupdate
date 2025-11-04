import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FloatingCTA } from './FloatingCTA';

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
    <section id="faq" className="relative py-24 bg-black">
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Najčešća Pitanja
          </h2>
          <p className="text-xl text-white/70">
            Sve što trebaš da znaš o Reel Estate
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
            >
              {/* Question Button */}
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{faq.emoji}</span>
                  <span className="text-lg font-semibold text-white">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-white/60 transition-transform ${
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
                    <div className="px-6 pb-6 pl-[4.5rem]">
                      <p className="text-white/70 leading-relaxed">
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
  );
};
