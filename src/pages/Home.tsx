import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhatWeDoSection } from '@/components/landing/WhatWeDoSection';
import { VideoExamplesSection } from '@/components/landing/VideoExamplesSection';
import { WhyReelEstateSection } from '@/components/landing/WhyReelEstateSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { BookConsultationSection } from '@/components/landing/BookConsultationSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <LandingNav />

      {/* Hero Section - Problem/Solution with Paper Shaders */}
      <HeroSection />

      {/* What We Do - 2 cards: Video Studio + Photo Editor */}
      <WhatWeDoSection />

      {/* Video Examples - 3 unlabeled video placeholders */}
      <VideoExamplesSection />

      {/* Why Reel Estate - Problem/Solution benefits */}
      <WhyReelEstateSection />

      {/* How It Works - 4-step process */}
      <HowItWorksSection />

      {/* FAQ - 5 key questions with CTA */}
      <FAQSection />

      {/* Book Consultation - Main conversion point */}
      <BookConsultationSection />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
