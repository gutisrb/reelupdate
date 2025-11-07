import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { ShaderBackground } from '@/components/ui/shaders-hero-section';

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
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-white/80">Radi 24/7 za tebe</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                  Zavladaj<br />
                  društvenim<br />
                  mrežama
                </h1>
                <p className="text-xl md:text-2xl text-white/60">
                  Za samo par minuta dnevno
                </p>
              </div>

              {/* Description */}
              <p className="text-lg text-white/70 leading-relaxed max-w-xl">
                AI generiše profesionalne 9:16 video oglase sa glasom, titlovima i muzikom.
                Automatski objavljuje na sve platforme odjednom.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={scrollToContact}
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 font-semibold px-8 h-12 text-base"
                >
                  Zakaži demo
                </Button>
                <Button
                  onClick={scrollToWhatWeDo}
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:text-white hover:bg-white/5 px-8 h-12 text-base"
                >
                  Saznaj više
                </Button>
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
                {/* Demo Video */}
                <video
                  className="w-full aspect-video object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/motiongraphic.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

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
