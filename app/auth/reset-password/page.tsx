/**
 * Şifre Sıfırlama Sayfası
 * 
 * Kullanıcıların e-postalarındaki bağlantı ile geldikleri sayfa
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Footer from '@/components/footer';

function ResetPasswordPageContent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase otomatik olarak hash'teki token'ı işler
    // Burada sadece session kontrolü yapabiliriz
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Eğer session yoksa ve hash de yoksa, geçersiz bağlantı olabilir
      if (!session && !window.location.hash) {
        // Hash yoksa ama bu normal olabilir (Supabase farklı şekillerde token gönderebilir)
        // Bu durumda kullanıcıya bilgi verelim ama formu göstermeye devam edelim
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validasyon
    if (!password || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Şifreyi güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Supabase hata mesajlarını Türkçe'ye çevir
        let errorMessage = updateError.message || 'Şifre güncellenirken hata oluştu';
        
        if (errorMessage.includes('New password should be different from the old password')) {
          errorMessage = 'Yeni şifre, eski şifrenizden farklı olmak zorundadır.';
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'Şifre en az 6 karakter olmalıdır.';
        } else if (errorMessage.includes('Invalid')) {
          errorMessage = 'Geçersiz şifre sıfırlama bağlantısı. Lütfen yeni bir şifre sıfırlama talebi oluşturun.';
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Başarılı
      setSuccess(true);
      setLoading(false);

      // 2 saniye sonra giriş sayfasına yönlendir
      setTimeout(() => {
        router.push('/auth/login?password_reset=success');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pointdlogo.webp" alt="Point Delivery" className="w-auto" style={{ height: '42px', width: 'auto' }} />
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Giriş Yap
            </Link>
            <Link href="/auth/register" className="rounded-lg bg-[#16B24B] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#118836]">
              Şimdi Başvur
            </Link>
          </div>
          <Link href="/auth/login" className="inline-flex md:hidden rounded-lg bg-[#16B24B] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#118836]">
            Başvuru Sorgula
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-[#16B24B]/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-[#16B24B]/15 blur-3xl" />
        </div>
        
        <div className="relative mx-auto flex max-w-md items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#16B24B]" />
                Point Delivery • Yeni Şifre
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
                Yeni Şifre Belirle
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Yeni şifrenizi belirleyin. En az 6 karakter olmalıdır.
              </p>
            </div>

            {success ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-900 mb-1">
                      Şifre Başarıyla Güncellendi
                    </h3>
                    <p className="text-sm text-green-700">
                      Yeni şifrenizle giriş yapabilirsiniz. Giriş sayfasına yönlendiriliyorsunuz...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#16B24B] focus:ring-4 focus:ring-[#16B24B]/10"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L7.5 7.5m-1.21-1.21L3 3m18 18l-3.29-3.29m0 0L16.5 16.5m1.21-1.21L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni Şifre (Tekrar)
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#16B24B] focus:ring-4 focus:ring-[#16B24B]/10"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L7.5 7.5m-1.21-1.21L3 3m18 18l-3.29-3.29m0 0L16.5 16.5m1.21-1.21L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#16B24B] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#118836] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <Link href="/auth/login" className="font-semibold text-[#16B24B] hover:text-[#118836]">
                ← Giriş sayfasına dön
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
