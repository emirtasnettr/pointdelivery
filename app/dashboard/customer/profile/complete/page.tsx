/**
 * Müşteri Profil Tamamlama Sayfası
 * 
 * Müşteri ilk girişinde firma bilgilerini girip kayıt etmesi için sayfa
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function CompleteCustomerProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    authorized_name: '', // Yetkili Adı Soyadı
    authorized_phone: '', // Yetkili Telefon Numarası
    company_name: '', // Firma Ünvanı
    tax_number: '', // Vergi Numarası
    tax_office: '', // Vergi Dairesi
    company_address: '', // Şirket Adresi
    company_phone: '', // Şirket Telefon Numarası
  });

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Profil kontrolü
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileData || profileData.role !== 'CUSTOMER') {
          router.push('/');
          return;
        }

        setProfile(profileData);

        // Müşteri bilgileri zaten var mı kontrol et
        const { data: customerInfo } = await supabase
          .from('customer_info')
          .select('*')
          .eq('profile_id', user.id)
          .single();

        if (customerInfo) {
          // Bilgiler zaten varsa dashboard'a yönlendir
          router.push('/dashboard/customer');
          return;
        }

        // Site logo'yu yükle
        try {
          const { data: settings } = await supabase
            .from('site_settings')
            .select('logo_url')
            .maybeSingle();
          
          if (settings?.logo_url) {
            setSiteLogo(settings.logo_url);
          }
        } catch (err) {
          console.log('Logo yüklenemedi:', err);
        }
      } catch (err: any) {
        setError(err.message || 'Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Giriş yapmamışsınız');
      }

      // Validasyon
      if (!formData.authorized_name || !formData.company_name || !formData.tax_number) {
        throw new Error('Lütfen zorunlu alanları doldurun (Yetkili Adı Soyadı, Firma Ünvanı, Vergi Numarası)');
      }

      // customer_info kaydı oluştur
      const { error: insertError } = await supabase
        .from('customer_info')
        .insert({
          profile_id: user.id,
          authorized_name: formData.authorized_name,
          authorized_phone: formData.authorized_phone || null,
          company_name: formData.company_name,
          tax_number: formData.tax_number,
          tax_office: formData.tax_office || null,
          company_address: formData.company_address || null,
          company_phone: formData.company_phone || null,
        });

      if (insertError) {
        throw new Error(insertError.message || 'Bilgiler kaydedilirken hata oluştu');
      }

      setSuccess(true);

      // 2 saniye sonra dashboard'a yönlendir
      setTimeout(() => {
        router.push('/dashboard/customer');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Bilgiler kaydedilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F9FE' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard/customer" className="flex items-center">
            {siteLogo ? (
              <img
                src={siteLogo}
                alt="Site Logo"
                className="h-10 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <span className="text-lg font-semibold text-white">J</span>
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Firma Bilgilerinizi Tamamlayın</h1>
            <p className="text-sm text-gray-600">
              Devam etmek için lütfen firma bilgilerinizi girin
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">✅ Bilgiler başarıyla kaydedildi! Yönlendiriliyorsunuz...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Yetkili Bilgileri */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Yetkili Bilgileri
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yetkili Adı Soyadı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.authorized_name}
                  onChange={(e) => setFormData({ ...formData, authorized_name: e.target.value })}
                  placeholder="Ad Soyad"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yetkili Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={formData.authorized_phone}
                  onChange={(e) => setFormData({ ...formData, authorized_phone: e.target.value })}
                  placeholder="0XXX XXX XX XX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Firma Bilgileri */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Firma Bilgileri
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma Ünvanı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Firma Ünvanı"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vergi Numarası <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="Vergi Numarası"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vergi Dairesi
                  </label>
                  <input
                    type="text"
                    value={formData.tax_office}
                    onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                    placeholder="Vergi Dairesi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şirket Adresi
                </label>
                <textarea
                  value={formData.company_address}
                  onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                  placeholder="Şirket Adresi"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şirket Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={formData.company_phone}
                  onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                  placeholder="0XXX XXX XX XX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
