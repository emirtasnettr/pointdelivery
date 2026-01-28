/**
 * Şifre Sıfırlama Sayfası
 * 
 * Kullanıcıların şifrelerini sıfırlamak için e-posta gönderebileceği sayfa
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Footer from '@/components/footer';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const supabase = createClient();

      // Şifre sıfırlama maili gönder
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || 'Şifre sıfırlama maili gönderilemedi');
        setLoading(false);
        return;
      }

      // Başarılı
      setSuccess(true);
      setLoading(false);
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
                Point Delivery • Şifre Sıfırlama
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
                Şifremi Unuttum
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
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
                      E-posta Gönderildi
                    </h3>
                    <p className="text-sm text-green-700 mb-4">
                      <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi. Lütfen e-posta kutunuzu kontrol edin.
                    </p>
                    <p className="text-xs text-green-600 mb-4">
                      E-postayı görmüyorsanız spam klasörünüzü kontrol edin.
                    </p>
                    <Link
                      href="/auth/login"
                      className="inline-block text-sm font-semibold text-green-700 hover:text-green-800"
                    >
                      ← Giriş sayfasına dön
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta Adresi
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#16B24B] focus:ring-4 focus:ring-[#16B24B]/10"
                    placeholder="ornek@email.com"
                    disabled={loading}
                  />
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
                  {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
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
