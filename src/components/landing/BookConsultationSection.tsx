import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShaderBackground } from '@/components/ui/shaders-hero-section';
import { supabase } from "@/integrations/supabase/client";

export const BookConsultationSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    videosPerMonth: '',
    propertiesPerMonth: '',
    platforms: [] as string[],
    currentMethod: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-intake', {
        body: {
          ...formData,
          agency: formData.company // Mapping company to agency for the backend
        },
      });

      if (error) throw error;

      toast({
        title: 'Zahtev poslat!',
        description: 'Javićemo ti se u najkraćem roku da potvrdimo pristup.',
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        videosPerMonth: '',
        propertiesPerMonth: '',
        platforms: [],
        currentMethod: '',
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: 'Greška pri slanju',
        description: error.message || 'Došlo je do greške. Pokušaj ponovo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const benefits = [
    'Prilagođen plan za tvoje marketing potrebe',
    'Podrška prilikom prvog video kreiranja',
    'Direktan pristup najnaprednijoj AI tehnologiji',
  ];

  return (
    <ShaderBackground>
      <section id="contact" className="relative py-32">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#3B5BFF]/20 via-[#3B82F6]/20 to-[#2DD4BF]/20 border border-[#3B5BFF]/30 mb-6">
                <Calendar className="w-4 h-4 text-[#3B5BFF]" />
                <span className="text-sm font-medium bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] bg-clip-text text-transparent">
                  Prijavi se za pristup
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Počni da praviš profesionalne videe
              </h2>
              <p className="text-xl text-white/70">
                Popuni kratku formu i naš tim će te kontaktirati radi aktivacije tvog ReelUpdate naloga
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-12">
              {/* Left - Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
                        Ime i prezime *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B5BFF] focus:border-transparent transition-all"
                        placeholder="Petar Petrović"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B5BFF] focus:border-transparent transition-all"
                        placeholder="petar@gmail.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
                        Telefon *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B5BFF] focus:border-transparent transition-all"
                        placeholder="+381 60 123 4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-white/90 mb-2">
                        Naziv agencije ili kompanije *
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3B5BFF] focus:border-transparent transition-all"
                        placeholder="Moja Agencija"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div>
                      <label htmlFor="videosPerMonth" className="block text-sm font-medium text-white/80 mb-2">
                        Koliko videa objavljujete mesečno? *
                      </label>
                      <select
                        id="videosPerMonth"
                        name="videosPerMonth"
                        value={formData.videosPerMonth}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BFF] transition-all"
                      >
                        <option value="" disabled className="bg-gray-900">Izaberi opciju</option>
                        <option value="0-5" className="bg-gray-900">0 - 5 videa</option>
                        <option value="5-10" className="bg-gray-900">5 - 10 videa</option>
                        <option value="10-20" className="bg-gray-900">10 - 20 videa</option>
                        <option value="20+" className="bg-gray-900">Više od 20 videa</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="propertiesPerMonth" className="block text-sm font-medium text-white/80 mb-2">
                        Koliko nekretnina dobijate mesečno? *
                      </label>
                      <select
                        id="propertiesPerMonth"
                        name="propertiesPerMonth"
                        value={formData.propertiesPerMonth}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BFF] transition-all"
                      >
                        <option value="" disabled className="bg-gray-900">Izaberi opciju</option>
                        <option value="0-5" className="bg-gray-900">0 - 5 nekretnina</option>
                        <option value="5-10" className="bg-gray-900">5 - 10 nekretnina</option>
                        <option value="10-20" className="bg-gray-900">10 - 20 nekretnina</option>
                        <option value="20+" className="bg-gray-900">Više od 20 nekretnina</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <span className="block text-sm font-medium text-white/80 mb-3">
                      Koje platforme koristite za promociju? *
                    </span>
                    <div className="flex flex-wrap gap-4">
                      {['Instagram', 'TikTok', 'Facebook', 'YouTube', 'Ostalo'].map((platform) => (
                        <label key={platform} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.platforms.includes(platform)}
                            onChange={() => handleCheckboxChange(platform)}
                            className="w-5 h-5 rounded border-white/10 bg-gray-800/50 text-[#3B5BFF] focus:ring-[#3B5BFF] transition-all"
                          />
                          <span className="text-white/70 group-hover:text-white transition-colors text-sm">{platform}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <label htmlFor="currentMethod" className="block text-sm font-medium text-white/80 mb-2">
                      Kako trenutno pravite videe za nekretnine? *
                    </label>
                    <select
                      id="currentMethod"
                      name="currentMethod"
                      value={formData.currentMethod}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BFF] transition-all"
                    >
                      <option value="" disabled className="bg-gray-900">Izaberi opciju</option>
                      <option value="Sami (mobilni)" className="bg-gray-900">Pravimo sami (mobilni telefon)</option>
                      <option value="Outsource (profesionalac)" className="bg-gray-900">Angažujemo profesionalca</option>
                      <option value="Ne pravimo" className="bg-gray-900">Trenutno ne pravimo videe</option>
                      <option value="Ostalo" className="bg-gray-900">Drugo</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#3B5BFF] via-[#3B82F6] to-[#2DD4BF] hover:opacity-90 transition-all disabled:opacity-50 group"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Slanje zahteva...' : 'Pošalji prijavu za pristup →'}
                  </Button>

                  <p className="text-center text-sm text-white/50 pt-1">
                    Javićemo ti se u narednih 24h
                  </p>
                </form>
              </motion.div>

              {/* Right - Benefits */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col justify-center space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Šta očekivati na pozivu?
                  </h3>
                  <div className="space-y-5">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#3B5BFF] to-[#3B82F6] flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-base text-white/80 pt-1">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="pt-6 border-t border-white/10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/70">
                      <span className="text-2xl">⚡</span>
                      <span className="text-sm">Odgovor za manje od 24h</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <span className="text-2xl">🎯</span>
                      <span className="text-sm">Bez obaveza ili pritiska</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </ShaderBackground>
  );
};
