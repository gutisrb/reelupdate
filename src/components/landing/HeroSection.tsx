import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { ShaderBackground } from '@/components/ui/shaders-hero-section';
import { CloudinaryVideo } from '@/components/CloudinaryVideo';

export const HeroSection = () => {
  const scrollToWhatWeDo = () => {
    const element = document.getElementById('what-we-do');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ShaderBackground>
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-8 text-center lg:text-left"
            >
              {/* Headline */}
              <div className="space-y-6">
                {/* Problem */}
                <div className="space-y-2">
                  <p className="text-white/60 text-sm md:text-base">
                    Praviš sadržaj satima, teško se isticaš, objavljuješ ručno svuda...
                  </p>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white leading-tight">
                  Zavladaj društvenim mrežama za samo par minuta dnevno
                </h1>

                {/* Solution */}
                <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                  Dodaj fotografije i osnovne info, AI generiše 9:16 reel sa naracijom, titlovima i muzikom. 
                  Automatski objavi na sve platforme odjednom.
                </p>

                {/* Features list */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF]" />
                    <span className="text-sm md:text-base">AI glas i script</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF]" />
                    <span className="text-sm md:text-base">Automatski titlovi</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF]" />
                    <span className="text-sm md:text-base">Muzika i brending</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF]" />
                    <span className="text-sm md:text-base">Objava svuda</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Button
                  onClick={scrollToContact}
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-base font-semibold bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
                >
                  Zakaži konsultaciju →
                </Button>
                <button
                  onClick={scrollToWhatWeDo}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                >
                  <ChevronDown className="w-5 h-5" />
                  Saznaj više
                </button>
              </div>

            </motion.div>

            {/* Right Column - Video/Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20 ring-1 ring-white/10">
                {/* Demo Video - Cloudinary */}
                <CloudinaryVideo
                  publicId="hero-video"
                  className="w-full aspect-video object-cover"
                  autoPlay={true}
                />

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] rounded-2xl blur-xl opacity-20 -z-10" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </section>
    </ShaderBackground>
  );
};
