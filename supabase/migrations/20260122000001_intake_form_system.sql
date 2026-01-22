-- =====================================================
-- INTAKE FORM SYSTEM MIGRATION
-- Date: 2026-01-22
-- Purpose: Track leads from the enhanced intake form
-- =====================================================

CREATE TABLE IF NOT EXISTS public.intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Kontakt informacije
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  agency TEXT NOT NULL,
  
  -- Kvalifikaciona pitanja
  videos_per_month TEXT NOT NULL,
  properties_per_month TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  current_video_method TEXT NOT NULL,
  start_timeline TEXT,
  
  -- Praćenje
  status TEXT DEFAULT 'new', -- new, contacted, approved, rejected
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksi za bržu pretragu
CREATE INDEX IF NOT EXISTS idx_intake_email ON public.intake_submissions(email);
CREATE INDEX IF NOT EXISTS idx_intake_status ON public.intake_submissions(status);

-- RLS (Row Level Security)
-- Samo admini/service_role treba da vide ovo, ili niko preko klijenta
ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;

-- Dozvoli samo insert anonimnim korisnicima (preko edge funkcije ili direktno ako treba, 
-- ali edge funkcija je sigurnija za email slanje)
CREATE POLICY "Enable insert for everyone" ON public.intake_submissions
    FOR INSERT WITH CHECK (true);

-- Enable select only for service_role/admin
CREATE POLICY "Enable select for service_role only" ON public.intake_submissions
    FOR SELECT USING (false); 

-- Trigger za updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_intake_submissions_updated_at
    BEFORE UPDATE ON public.intake_submissions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
