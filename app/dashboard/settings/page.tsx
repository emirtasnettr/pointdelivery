/**
 * Hesap Ayarları Sayfası
 * 
 * Kullanıcıların şifre değiştirebileceği sayfa
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('User error:', userError);
          router.push('/auth/login');
          return;
        }

        console.log('User loaded:', user.id, user.email);

        // Profil bilgilerini al - retry ile
        let profileData = null;
        let profileError = null;
        
        for (let i = 0; i < 3; i++) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data && !error) {
            profileData = data;
            break;
          }
          if (error) profileError = error;
          if (i < 2) await new Promise((r) => setTimeout(r, 300));
        }

        if (!profileData) {
          const msg = profileError?.message ?? (typeof profileError === 'object' && profileError !== null ? String(profileError) : '');
          if (msg && profileError?.code !== 'PGRST116') {
            console.error('Profile could not be loaded:', msg);
          }
          // Profil yoksa bile user bilgilerini göster
          setUser(user);
          setLoading(false);
          return;
        }

        setProfile(profileData);
        setUser(user);

        // Eğer müşteri ise müşteri bilgilerini de al
        if (profileData?.role === 'CUSTOMER') {
          const { data: customerInfoData } = await supabase
            .from('customer_info')
            .select('*')
            .eq('profile_id', user.id)
            .single();
          
          if (customerInfoData) {
            setCustomerInfo(customerInfoData);
          }
        }
      } catch (err: any) {
        console.error('Load data error:', err);
        setError(err.message || 'Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validasyon
    if (!newPassword || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }

    setSaving(true);

    try {
      // Mevcut şifreyi doğrula ve şifreyi güncelle
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Kullanıcı bulunamadı.');
        setSaving(false);
        return;
      }

      // Şifreyi güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setError(updateError.message || 'Şifre güncellenirken hata oluştu.');
        setSaving(false);
        return;
      }

      setSuccess('Şifreniz başarıyla güncellendi!');
      setNewPassword('');
      setConfirmPassword('');

      // 3 saniye sonra mesajı kaldır
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Şifre güncellenirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#16B24B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header - Ana sayfa ile aynı yapı */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pointdlogo.webp" alt="Point Delivery" className="w-auto" style={{ height: '42px', width: 'auto' }} />
            </Link>
            <button
              onClick={() => router.back()}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Hesap Ayarları</h1>
              <p className="text-xs text-gray-500">Şifre ve profil ayarlarınızı yönetin</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Information Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Profil Bilgileri</h2>
            <p className="text-sm text-gray-500">Kişisel ve şirket bilgileriniz</p>
          </div>

          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
            <div className="w-20 h-20 rounded-2xl bg-[#16B24B] flex items-center justify-center shadow-sm">
              <span className="text-white text-3xl font-bold">
                {(profile?.full_name || user?.user_metadata?.full_name || 'U').charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {profile?.full_name || user?.user_metadata?.full_name || 'Kullanıcı'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {(() => {
                  const role = profile?.role || user?.user_metadata?.role || user?.app_metadata?.role;
                  if (role === 'CONSULTANT') return 'Consultant';
                  if (role === 'ADMIN') return 'Admin';
                  if (role === 'CANDIDATE') return 'Aday';
                  if (role === 'MIDDLEMAN') return 'Aracı';
                  if (role === 'CUSTOMER') return 'Müşteri';
                  return role || 'Kullanıcı';
                })()}
              </p>
              {user?.email && (
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
              )}
            </div>
          </div>

          {/* Müşteri Bilgileri */}
          {customerInfo && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Şirket Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customerInfo.company_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Şirket Adı</label>
                      <p className="text-base text-gray-800">{customerInfo.company_name}</p>
                    </div>
                  )}
                  {customerInfo.authorized_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Yetkili Kişi</label>
                      <p className="text-base text-gray-800">{customerInfo.authorized_name}</p>
                    </div>
                  )}
                  {customerInfo.tax_number && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Vergi Numarası</label>
                      <p className="text-base text-gray-800">{customerInfo.tax_number}</p>
                    </div>
                  )}
                  {customerInfo.tax_office && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Vergi Dairesi</label>
                      <p className="text-base text-gray-800">{customerInfo.tax_office}</p>
                    </div>
                  )}
                  {customerInfo.company_address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Şirket Adresi</label>
                      <p className="text-base text-gray-800">{customerInfo.company_address}</p>
                    </div>
                  )}
                  {customerInfo.authorized_phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Yetkili Telefon</label>
                      <p className="text-base text-gray-800">{customerInfo.authorized_phone}</p>
                    </div>
                  )}
                  {customerInfo.company_phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Şirket Telefonu</label>
                      <p className="text-base text-gray-800">{customerInfo.company_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Password Change Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Şifre Değiştir</h3>
            <p className="text-sm text-gray-500">Hesabınızın güvenliği için güçlü bir şifre kullanın</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-200/50 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50/80 border border-green-200/50 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Şifre
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16B24B]/30 focus:border-[#16B24B] transition-all bg-white"
                placeholder="Yeni şifrenizi girin (en az 6 karakter)"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-gray-500">Şifre en az 6 karakter olmalıdır</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Şifre (Tekrar)
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16B24B]/30 focus:border-[#16B24B] transition-all bg-white"
                placeholder="Yeni şifrenizi tekrar girin"
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 text-sm font-semibold text-white bg-[#16B24B] rounded-xl hover:bg-[#118836] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Şifreyi Güncelle</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
