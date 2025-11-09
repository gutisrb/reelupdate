import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function MarketingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { name: 'Kako', id: 'kako' },
    { name: 'Zašto', id: 'zasto' },
    { name: 'Funkcije', id: 'funkcije' },
    { name: 'Cena', id: 'cena' },
    { name: 'FAQ', id: 'faq' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
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
          <div className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#3B5BFF] to-[#2DD4BF] transition-all group-hover:w-full" />
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] text-white hover:opacity-90 font-semibold px-6 h-11 rounded-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
            >
              Zakaži demo
            </button>

            {/* Login link for existing clients */}
            <Link to="/app/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block">
              Prijavi se
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
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                {item.name}
              </button>
            ))}
            {/* Login link in mobile menu */}
            <Link
              to="/app/login"
              className="block w-full text-left px-4 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded transition-colors text-sm"
            >
              Prijavi se
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}