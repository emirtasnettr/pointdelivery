'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Slider {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string | null;
  order: number;
}

export default function HeroSliders() {
  const supabase = createClient();
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSliders() {
      try {
        // Public erişim için RLS politikası gerekli
        const { data, error } = await supabase
          .from('hero_sliders')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(9);

        if (error) {
          // Tablo yoksa veya RLS hatası varsa sessizce devam et
          if (error.code === '42P01' || error.code === 'PGRST116') {
            // Tablo bulunamadı - henüz oluşturulmamış
            console.log('Hero sliders tablosu henüz oluşturulmamış');
            setSliders([]);
          } else {
            console.error('Slider yükleme hatası:', error.message || error);
            setSliders([]);
          }
        } else {
          setSliders(data || []);
        }
      } catch (err: any) {
        // Genel hata durumunda sessizce devam et
        console.log('Slider yükleme hatası:', err?.message || 'Bilinmeyen hata');
        setSliders([]);
      } finally {
        setLoading(false);
      }
    }

    loadSliders();
  }, []);

  if (loading) {
    return (
      <div className="relative w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px] md:h-[600px]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-full bg-gray-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (sliders.length === 0) {
    return null;
  }

  // Sliderları sonsuz döngü için kopyala (her zaman 3 kart görünür olacak)
  const createInfiniteSliders = (sliders: Slider[]) => {
    if (sliders.length === 0) return [];
    // En az 2 kopya oluştur (sonsuz görünüm için)
    return [...sliders, ...sliders];
  };

  const infiniteSliders = createInfiniteSliders(sliders);

  // Animasyon süresi: her slider için 4 saniye, minimum 12 saniye
  const animationDuration = Math.max(sliders.length * 4, 12);
  
  // Her kart için genişlik (sabit pixel değeri kullan)
  // Her kart: (100% - 2*gap) / 3 genişliğinde
  // gap-6 = 24px, 3 kart için 2 gap = 48px
  const cardWidthPercent = (100 - (2 * 1.5)) / 3; // Her kart yaklaşık %32.33

  // Her kart için sabit genişlik: calc(33.333% - 16px)
  // gap-6 = 24px, 3 kart için 2 gap = 48px
  // Her kart: (100% - 48px) / 3 = calc(33.333% - 16px)
  const cardWidth = 'calc(33.333% - 16px)';
  // Animasyon için: her slider bir kart genişliği + gap kadar kayacak
  // Bir kart genişliği: 33.333%, gap: 2% (yaklaşık) = toplam 35.333%
  const translateXPerSlider = 100 / 3 + 2; // %35.333 (kart + gap)

  return (
    <div className="relative w-full">
      {/* Dış container: Her zaman sadece 3 kart görünür, overflow ile gizlenir */}
      {/* Container genişliği: tam olarak 3 kart + 2 gap = 100% + 48px (gap-6 = 24px * 2) */}
      <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        {/* İç container: Tüm sliderları içerir, animasyonla kayar */}
        <div
          className="flex flex-row gap-6 h-full"
          style={{
            animation: `scrollCards ${animationDuration}s linear infinite`,
            width: `${infiniteSliders.length * (100 / 3 + 2)}%`,
          }}
        >
          {infiniteSliders.map((slider, index) => (
            <a
              key={`${slider.id}-${index}`}
              href={slider.link_url || '#'}
              onClick={(e) => {
                if (!slider.link_url) e.preventDefault();
              }}
              className="flex-shrink-0 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-lg hover:shadow-xl transition-all overflow-hidden block cursor-pointer flex flex-col"
              style={{ width: cardWidth }}
            >
              {/* Title at top */}
              <div className="p-5 pb-3">
                <h4 className="font-bold text-gray-900 text-lg leading-tight">{slider.title}</h4>
                {slider.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{slider.description}</p>
                )}
              </div>
              
              {/* Image/Content below */}
              <div className="flex-1 flex items-center justify-center p-4 pt-0">
                {slider.image_url ? (
                  <div className="relative w-full h-full min-h-[200px] rounded-xl overflow-hidden bg-white/50">
                    <img
                      src={slider.image_url}
                      alt={slider.title}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[200px] rounded-xl bg-white/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-500">Görsel yok</p>
                    </div>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scrollCards {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${sliders.length > 0 ? sliders.length * translateXPerSlider : translateXPerSlider}%);
          }
        }
      `}</style>
    </div>
  );
}
