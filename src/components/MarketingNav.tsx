import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/translations';

export function MarketingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const t = translations[language].nav;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { name: t.home, id: 'home' }, // Assuming 'home' maps to top or hero
    { name: t.features, id: 'funkcije' }, // 'funkcije' ID might need to be consistent or mapped
    { name: t.examples, id: 'primeri' }, // Need to check section IDs in Home.tsx
    { name: t.pricing, id: 'cena' },
    { name: t.login, id: 'login', isLink: true, path: '/app/login' }, // Special handling for login if needed in list
  ];

  // Simplified nav items for landing page sections
  const sections = [
    { name: t.features, id: 'what-we-do' }, // Mapping 'funkcije' to likely ID
    { name: t.examples, id: 'examples' },
    { name: t.pricing, id: 'why-us' }, // 'why-us' usually contains benefits/value prop, maybe not pricing directly but close enough for now or need to check Home.tsx IDs
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-black/70 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src="/brand/wordmark.png"
              alt="Reel Estate"
              className="hidden sm:block h-16 w-auto"
            />
            <img
              src="/brand/mark.png"
              alt="Reel Estate"
              className="block sm:hidden h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Language Switcher */}
            <div className="flex items-center gap-2 mr-4 border-r border-white/10 pr-4">
              <button
                onClick={() => setLanguage('sr')}
                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${language === 'sr' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
              >
                SR
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${language === 'en' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
              >
                EN
              </button>
            </div>

            <button onClick={() => scrollToSection('what-we-do')} className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              {t.features}
            </button>
            <button onClick={() => scrollToSection('examples')} className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              {t.examples}
            </button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              FAQ
            </button>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] text-white hover:opacity-90 font-semibold px-6 h-11 rounded-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
            >
              {t.getStarted}
            </button>

            {/* Login link for existing clients */}
            <Link to="/app/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block">
              {t.login}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 py-4 space-y-2 bg-black/90 backdrop-blur-md">
            <div className="flex items-center gap-4 px-4 py-2 mb-2 border-b border-white/10">
              <span className="text-white/60 text-sm">Jezik / Language:</span>
              <button
                onClick={() => setLanguage('sr')}
                className={`text-xs font-bold px-2 py-1 rounded ${language === 'sr' ? 'bg-white text-black' : 'text-white/60'}`}
              >
                SR
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`text-xs font-bold px-2 py-1 rounded ${language === 'en' ? 'bg-white text-black' : 'text-white/60'}`}
              >
                EN
              </button>
            </div>
            <button onClick={() => scrollToSection('what-we-do')} className="block w-full text-left px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors">
              {t.features}
            </button>
            <button onClick={() => scrollToSection('examples')} className="block w-full text-left px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors">
              {t.examples}
            </button>
            <Link
              to="/app/login"
              className="block w-full text-left px-4 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded transition-colors text-sm"
            >
              {t.login}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}