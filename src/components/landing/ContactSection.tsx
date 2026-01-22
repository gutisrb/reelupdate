import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

export const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    agency: '',
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
        body: formData,
      });

      if (error) throw error;

      toast({
        title: 'Prijava primljena!',
        description: 'Javićemo ti se u najkraćem roku.',
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        agency: '',
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
    'Prilagođen paket za tvoje potrebe',
    'Podrška tokom cele saradnje',
    'Direktan pristup najnaprednijoj AI tehnologiji',
  ];

  return (
    <section id="contact" className="relative py-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Zatraži pristup ReelUpdate platformi
            </h2>
            <p className="text-white/60 text-lg">
              Popuni kratku formu i naš tim će te kontaktirati radi aktivacije naloga.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-12">
            {/* Left - Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                      Ime i prezime *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      placeholder="Petar Petrović"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                      Poslovni Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      placeholder="petar@agencija.rs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      placeholder="+381 60 123 4567"
                    />
                  </div>

                  <div>
                    <label htmlFor="agency" className="block text-sm font-medium text-white/80 mb-2">
                      Naziv agencije *
                    </label>
                    <input
                      type="text"
                      id="agency"
                      name="agency"
                      value={formData.agency}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      placeholder="Agencija Nekretnine"
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
                      className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
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
                      className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
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
                          className="w-5 h-5 rounded border-white/10 bg-gray-800/50 text-cyan-500 focus:ring-cyan-500 transition-all"
                        />
                        <span className="text-white/70 group-hover:text-white transition-colors">{platform}</span>
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
                    className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
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
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#0EA5E9] to-[#F97316] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-cyan-500/10"
                >
                  {isSubmitting ? 'Slanje prijave...' : 'Pošalji prijavu za pristup →'}
                </Button>

                <p className="text-center text-sm text-white/40">
                  Slanjem prijave potvrđujete da ste saglasni sa uslovima korišćenja.
                </p>
              </form>
            </motion.div>

            {/* Right - Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-lg text-white/80 pt-1">{benefit}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
