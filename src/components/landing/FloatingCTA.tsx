import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingCTAProps {
  variant?: 'default' | 'compact' | 'inline';
  headline?: string;
  description?: string;
  buttonText?: string;
  onCTAClick?: () => void;
  className?: string;
}

export const FloatingCTA = ({
  variant = 'default',
  headline = 'Zakaži besplatnu konsultaciju',
  description = 'Razgovaraj sa našim timom i saznaj kako Reel Estate može da ti pomogne',
  buttonText = 'Zakaži poziv →',
  onCTAClick,
  className = '',
}: FloatingCTAProps) => {
  const handleClick = () => {
    if (onCTAClick) {
      onCTAClick();
    } else {
      // Default behavior: scroll to contact section
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={`relative group ${className}`}
      >
        <div className="bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">{headline}</p>
                <p className="text-white/80 text-sm">{description}</p>
              </div>
            </div>
            <Button
              onClick={handleClick}
              className="bg-white text-[#3B5BFF] hover:bg-white/90 font-semibold whitespace-nowrap"
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`text-center ${className}`}
      >
        <Button
          onClick={handleClick}
          className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] hover:opacity-90 transition-opacity group"
        >
          <Calendar className="w-5 h-5 mr-2" />
          {buttonText}
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`relative group ${className}`}
    >
      {/* Gradient glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />

      {/* Card */}
      <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-white/10 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 md:p-12 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#3B5BFF] to-[#2DD4BF] mb-6"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          {/* Headline */}
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {headline}
          </h3>

          {/* Description */}
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            {description}
          </p>

          {/* CTA Button */}
          <Button
            onClick={handleClick}
            className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] hover:opacity-90 transition-opacity group"
          >
            <Calendar className="w-5 h-5 mr-2" />
            {buttonText}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#3B5BFF]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#2DD4BF]/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>
    </motion.div>
  );
};
