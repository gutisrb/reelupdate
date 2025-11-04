import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export const LandingNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-black/90 backdrop-blur-xl border-b border-white/20'
        : 'bg-black/60 backdrop-blur-xl border-b border-white/10'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <img
              src="/brand/mark.png"
              alt="Reel Estate"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('what-we-do')}
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Mogućnosti
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Kako radi
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              FAQ
            </button>
            <Link
              to="/app/login"
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Prijavi se
            </Link>
            <Button
              onClick={() => scrollToSection('contact')}
              className="h-10 px-6 text-sm font-semibold bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] hover:opacity-90 transition-opacity"
            >
              Zakaži konsultaciju →
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-t border-white/10"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('what-we-do')}
                className="text-white/80 hover:text-white transition-colors text-left py-2"
              >
                Mogućnosti
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-white/80 hover:text-white transition-colors text-left py-2"
              >
                Kako radi
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-white/80 hover:text-white transition-colors text-left py-2"
              >
                FAQ
              </button>
              <Link
                to="/app/login"
                className="text-white/80 hover:text-white transition-colors text-left py-2"
              >
                Prijavi se
              </Link>
              <Button
                onClick={() => scrollToSection('contact')}
                className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] hover:opacity-90 transition-opacity"
              >
                Zakaži konsultaciju →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
