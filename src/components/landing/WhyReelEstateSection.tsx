import { motion } from 'framer-motion';
import { Clock, Zap, Target, TrendingUp } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    problem: 'Satima praviš videe ručno',
    solution: 'Generiši profesionalne videe za par minuta',
    gradient: 'from-[#3B5BFF] to-[#3B82F6]',
  },
  {
    icon: Zap,
    problem: 'Objavljuješ ručno na svaku platformu',
    solution: 'Automatski objavi svuda odjednom',
    gradient: 'from-[#3B82F6] to-[#2DD4BF]',
  },
  {
    icon: Target,
    problem: 'Teško se istakneš među konkurencijom',
    solution: 'AI glas, titlovi, muzika - uvek profesionalno',
    gradient: 'from-[#2DD4BF] to-[#3B5BFF]',
  },
  {
    icon: TrendingUp,
    problem: 'Skupo angažovati video producenta',
    solution: 'Jedna platforma za sve, dostupna cena',
    gradient: 'from-[#3B5BFF] to-[#2DD4BF]',
  },
];

export const WhyReelEstateSection = () => {
  return (
    <section className="relative py-24 bg-gradient-to-b from-white via-gray-50 to-white">
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
            Zašto Reel Estate?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Rešavamo najveće probleme real estate agenata na društvenim mrežama
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
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
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>

                {/* Problem */}
                <div className="mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-sm">✕</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {benefit.problem}
                    </p>
                  </div>
                </div>

                {/* Solution */}
                <div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <p className="text-gray-900 font-semibold text-base leading-relaxed">
                      {benefit.solution}
                    </p>
                  </div>
                </div>
              </div>

              {/* Glow effect on hover */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${benefit.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity -z-10`} />
            </motion.div>
          ))}
        </div>

        {/* Bottom stat/quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-[#3B5BFF]/10 via-[#3B82F6]/10 to-[#2DD4BF]/10 border border-[#3B5BFF]/20">
            <p className="text-gray-700 font-medium">
              <span className="bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] bg-clip-text text-transparent font-bold">
                5 minuta
              </span>{' '}
              od fotografija do objavljenog videa na svim platformama
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
