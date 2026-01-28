-- =====================================================
-- HERO SLIDERS TABLOSU OLUŞTURMA
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- Hero sliderlar tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.hero_sliders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Display order için index
CREATE INDEX IF NOT EXISTS hero_sliders_display_order_idx ON public.hero_sliders(display_order);
CREATE INDEX IF NOT EXISTS hero_sliders_active_idx ON public.hero_sliders(is_active);

-- RLS politikaları
ALTER TABLE public.hero_sliders ENABLE ROW LEVEL SECURITY;

-- Herkes aktif sliderları görebilir (public read)
CREATE POLICY "Herkes aktif sliderları görebilir"
    ON public.hero_sliders FOR SELECT
    USING (is_active = true);

-- Sadece Admin'ler slider ekleyebilir, güncelleyebilir, silebilir
CREATE POLICY "Admin'ler slider ekleyebilir"
    ON public.hero_sliders FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin'ler slider güncelleyebilir"
    ON public.hero_sliders FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin'ler slider silebilir"
    ON public.hero_sliders FOR DELETE
    USING (public.is_admin());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_hero_sliders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hero_sliders_updated_at
    BEFORE UPDATE ON public.hero_sliders
    FOR EACH ROW
    EXECUTE FUNCTION update_hero_sliders_updated_at();

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık hero_sliders tablosu oluşturuldu
-- Admin'ler slider ekleyebilir, güncelleyebilir ve silebilir
-- Herkes aktif sliderları görebilir
