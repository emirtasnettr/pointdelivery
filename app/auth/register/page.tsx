/**
 * Register Sayfası — Adım adım başvuru formu
 *
 * Yeni kullanıcı kaydı - SADECE CANDIDATE rolü ile kayıt yapılabilir.
 */

'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Footer from '@/components/footer';
import { SearchableSelect, type SearchableSelectOption } from '@/components/searchable-select';
import { provinces, getDistricts } from '@/lib/data/il-ilce';

const TOTAL_STEPS = 5;
const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#16B24B] focus:ring-4 focus:ring-[#16B24B]/10 disabled:bg-gray-50 disabled:opacity-60';
const labelClass = 'block text-sm font-medium text-gray-700 mb-2';
const requiredStar = <span className="text-red-500">*</span>;

type VehicleType = 'MOTORCYCLE' | 'CAR' | '';
type MotorSubtype = '50cc' | '100cc_plus' | '';
type CarSubtype = 'BINEK' | 'TICARI' | '';

const EVET_HAYIR = [
  { value: 'evet' as const, label: 'Evet' },
  { value: 'hayir' as const, label: 'Hayır' },
] as const;

function OptionButtons<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            value === opt.value
              ? 'border-[#16B24B] bg-[#16B24B]/10 text-[#118836]'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    cityId: '',
    district: '',
    vehicleType: '' as VehicleType,
    motorSubtype: '' as MotorSubtype,
    carSubtype: '' as CarSubtype,
    hasCompany: '' as '' | 'evet' | 'hayir',
    hasP1: '' as '' | 'evet' | 'hayir',
    kvkkApproved: false,
    smsEmailConsent: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const cityIdNum = formData.cityId ? parseInt(formData.cityId, 10) : 0;
  const cityName = cityIdNum ? provinces.find((p) => p.id === cityIdNum)?.name ?? '' : '';

  const ilOptions: SearchableSelectOption[] = useMemo(
    () => provinces.map((p) => ({ value: String(p.id), label: p.name })),
    []
  );

  const ilceOptions: SearchableSelectOption[] = useMemo(() => {
    if (!cityIdNum) return [];
    return getDistricts(cityIdNum).map((n) => ({ value: n, label: n }));
  }, [cityIdNum]);

  const setCity = (v: string) => {
    setFormData((prev) => ({ ...prev, cityId: v, district: '' }));
  };

  function validateStep(s: number): boolean {
    setError(null);
    if (s === 1) {
      if (!formData.fullName.trim()) {
        setError('Ad Soyad zorunludur');
        return false;
      }
      // Ad Soyad en az 2 kelime olmalı
      const nameParts = formData.fullName.trim().split(' ').filter(part => part.length > 0);
      if (nameParts.length < 2) {
        setError('Lütfen ad ve soyadınızı ayrı ayrı girin (örnek: Emir Taş)');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Telefon numarası zorunludur');
        return false;
      }
      if (formData.phone.length !== 10 || !formData.phone.startsWith('5')) {
        setError('Geçerli bir telefon numarası girin (5XX XXX XX XX)');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Mail adresi zorunludur');
        return false;
      }
      // Türkçe karakter kontrolü
      const turkishChars = /[çÇşŞğĞüÜöÖıİ]/;
      if (turkishChars.test(formData.email)) {
        setError('Mail adresinde Türkçe karakter kullanılamaz');
        return false;
      }
      // Email format validasyonu
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Geçerli bir mail adresi girin (örnek: isim@domain.com)');
        return false;
      }
      return true;
    }
    if (s === 2) {
      if (formData.password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Şifreler eşleşmiyor');
        return false;
      }
      return true;
    }
    if (s === 3) {
      if (!formData.cityId || !formData.district) {
        setError('İl ve İlçe seçiniz');
        return false;
      }
      return true;
    }
    if (s === 4) {
      if (!formData.vehicleType) {
        setError('Araç tipi seçiniz');
        return false;
      }
      if (formData.vehicleType === 'MOTORCYCLE' && !formData.motorSubtype) {
        setError('Motosiklet türü seçiniz');
        return false;
      }
      if (formData.vehicleType === 'CAR' && !formData.carSubtype) {
        setError('Araç türü seçiniz (Binek veya Ticari)');
        return false;
      }
      if (!formData.hasCompany) {
        setError('Şirketiniz var mı? yanıtlayınız');
        return false;
      }
      if (!formData.hasP1) {
        setError('P1 belgeniz var mı? yanıtlayınız');
        return false;
      }
      return true;
    }
    if (s === 5) {
      if (!formData.kvkkApproved) {
        setError('KVKK onayı zorunludur');
        return false;
      }
      return true;
    }
    return true;
  }

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const goPrev = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== TOTAL_STEPS) return;
    if (!validateStep(5)) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'CANDIDATE',
            phone: `+90${formData.phone}`,
            city: cityName,
            district: formData.district,
            vehicle_type: formData.vehicleType,
            vehicle_subtype:
              formData.vehicleType === 'MOTORCYCLE'
                ? formData.motorSubtype
                : formData.vehicleType === 'CAR'
                  ? formData.carSubtype
                  : null,
            has_company: formData.hasCompany === 'evet',
            has_p1: formData.hasP1 === 'evet',
            kvkk_approved: formData.kvkkApproved,
            sms_email_consent: formData.smsEmailConsent,
          },
          emailRedirectTo: 'https://point.iksoft.com.tr/auth/login',
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Kayıt olunamadı');
        setLoading(false);
        return;
      }

      if (data.user) {
        await new Promise((r) => setTimeout(r, 500));
        let profile: { role?: string } | null = null;
        for (let i = 0; i < 3; i++) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user!.id)
            .single();
          if (profileData) {
            profile = profileData;
            break;
          }
          await new Promise((r) => setTimeout(r, 300));
        }

        await supabase.from('candidate_info').insert({
          profile_id: data.user.id,
          phone: `+90${formData.phone}`,
          email: formData.email,
          city: cityName,
          district: formData.district,
        });

        // Kayıt başarılı - başarı ekranını göster
        setRegistrationSuccess(true);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      setLoading(false);
    }
  };

  const dis = loading;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pointdlogo.webp" alt="Point Delivery" className="h-[42px] w-auto" />
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Giriş Yap
            </Link>
            <Link href="/auth/register" className="rounded-lg bg-[#16B24B] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#118836]">
              Şimdi Başvur
            </Link>
          </div>
          <Link href="/auth/login" className="rounded-lg bg-[#16B24B] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#118836] md:hidden">
            Başvuru Sorgula
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-[#16B24B]/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-[#16B24B]/15 blur-3xl" />
        </div>

        {/* Kayıt Başarılı Ekranı */}
        {registrationSuccess ? (
          <div className="relative mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg text-center">
              {/* Başarı İkonu */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Başlık */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Kaydınız Başarıyla Oluşturuldu!
              </h1>

              {/* Açıklama */}
              <p className="text-gray-600 mb-6">
                Hesabınızı aktif etmek için lütfen <strong className="text-gray-900">{formData.email}</strong> adresine gönderilen doğrulama bağlantısına tıklayın.
              </p>

              {/* Mail İkonu ve Bilgi */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-blue-900">Mail kutunuzu kontrol edin</p>
                    <p className="text-xs text-blue-700">Spam klasörünü de kontrol etmeyi unutmayın</p>
                  </div>
                </div>
              </div>

              {/* Adımlar */}
              <div className="text-left bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">Sonraki Adımlar:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">1</span>
                    <p className="text-sm text-gray-600">Mail adresinize gelen doğrulama linkine tıklayın</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-white text-xs font-bold">2</span>
                    <p className="text-sm text-gray-600">Giriş yaparak profilinizi tamamlayın</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-white text-xs font-bold">3</span>
                    <p className="text-sm text-gray-600">Gerekli belgeleri yükleyin</p>
                  </div>
                </div>
              </div>

              {/* Giriş Yap Butonu */}
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#16B24B] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#118836] transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Giriş Sayfasına Git
              </Link>

              {/* Yardım */}
              <p className="mt-4 text-xs text-gray-500">
                Mail almadıysanız spam klasörünü kontrol edin veya birkaç dakika bekleyin.
              </p>
            </div>
          </div>
        ) : (
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-16">
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-[#16B24B]" />
                  Yemeksepeti Projesi • Kurye Başvurusu
                </div>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
                  Kurye Başvurusu Yap
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Point Delivery bünyesinde Yemeksepeti Projesinde kurye olarak çalışmak için başvurunu oluştur.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Adım {step} / {TOTAL_STEPS}</span>
                  <div className="flex flex-1 gap-1">
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i + 1 <= step ? 'bg-[#16B24B]' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                {/* Adım 1 */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="fullName" className={labelClass}>Ad Soyad {requiredStar}</label>
                      <input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => {
                          // Title Case: Her kelimenin ilk harfi büyük, diğerleri küçük
                          const toTitleCase = (str: string) => {
                            return str
                              .toLowerCase()
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                          };
                          setFormData((p) => ({ ...p, fullName: toTitleCase(e.target.value) }));
                        }}
                        className={inputClass}
                        placeholder="Adınız Soyadınız"
                        disabled={dis}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className={labelClass}>Telefon Numarası {requiredStar}</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 text-sm text-gray-700 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl font-medium">
                          +90
                        </span>
                        <input
                          id="phone"
                          type="tel"
                          value={(() => {
                            // Telefon numarasını formatla: 5XX XXX XX XX
                            const digits = formData.phone;
                            if (digits.length <= 3) return digits;
                            if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
                            if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
                            return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
                          })()}
                          onChange={(e) => {
                            // Sadece rakamları al
                            const value = e.target.value.replace(/\D/g, '');
                            // Maksimum 10 karakter
                            if (value.length <= 10) {
                              setFormData((p) => ({ ...p, phone: value }));
                            }
                          }}
                          className={`${inputClass} rounded-l-none`}
                          placeholder="5XX XXX XX XX"
                          maxLength={14}
                          disabled={dis}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Örnek: 532 123 45 67</p>
                    </div>
                    <div>
                      <label htmlFor="email" className={labelClass}>Mail Adresi {requiredStar}</label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value.toLowerCase() }))}
                        className={inputClass}
                        placeholder="ornek@email.com"
                        disabled={dis}
                      />
                    </div>
                  </div>
                )}

                {/* Adım 2 */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="password" className={labelClass}>Şifre {requiredStar}</label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                          minLength={6}
                          className={`${inputClass} pr-12`}
                          placeholder="En az 6 karakter"
                          disabled={dis}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L7.5 7.5m-1.21-1.21L3 3m18 18l-3.29-3.29m0 0L16.5 16.5m1.21-1.21L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Şifre en az 6 karakter olmalıdır</p>
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className={labelClass}>Şifre Tekrar {requiredStar}</label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                          minLength={6}
                          className={`${inputClass} pr-12`}
                          placeholder="Şifrenizi tekrar girin"
                          disabled={dis}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L7.5 7.5m-1.21-1.21L3 3m18 18l-3.29-3.29m0 0L16.5 16.5m1.21-1.21L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adım 3 */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="il-select" className={labelClass}>İl {requiredStar}</label>
                      <SearchableSelect
                        id="il-select"
                        aria-label="İl seçin"
                        options={ilOptions}
                        value={formData.cityId}
                        onChange={setCity}
                        placeholder="İl seçin veya arayın"
                        disabled={dis}
                        emptyMessage="İl bulunamadı"
                      />
                    </div>
                    <div>
                      <label htmlFor="ilce-select" className={labelClass}>İlçe {requiredStar}</label>
                      <SearchableSelect
                        id="ilce-select"
                        aria-label="İlçe seçin"
                        options={ilceOptions}
                        value={formData.district}
                        onChange={(v) => setFormData((p) => ({ ...p, district: v }))}
                        placeholder={cityIdNum ? 'İlçe seçin veya arayın' : 'Önce il seçin'}
                        disabled={dis || !cityIdNum}
                        emptyMessage="İlçe bulunamadı"
                      />
                    </div>
                  </div>
                )}

                {/* Adım 4 */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <div className={labelClass}>Araç Tipi {requiredStar}</div>
                      <OptionButtons
                        options={[
                          { value: 'MOTORCYCLE' as const, label: 'Motosiklet' },
                          { value: 'CAR' as const, label: 'Araba' },
                        ]}
                        value={formData.vehicleType}
                        onChange={(v) =>
                          setFormData((p) => ({
                            ...p,
                            vehicleType: v,
                            motorSubtype: '' as MotorSubtype,
                            carSubtype: '' as CarSubtype,
                          }))
                        }
                        disabled={dis}
                      />
                    </div>
                    {formData.vehicleType === 'MOTORCYCLE' && (
                      <div>
                        <div className={labelClass}>Motosiklet türü {requiredStar}</div>
                        <OptionButtons
                          options={[
                            { value: '50cc' as const, label: '50cc' },
                            { value: '100cc_plus' as const, label: '100cc ve üzeri' },
                          ]}
                          value={formData.motorSubtype}
                          onChange={(v) => setFormData((p) => ({ ...p, motorSubtype: v }))}
                          disabled={dis}
                        />
                      </div>
                    )}
                    {formData.vehicleType === 'CAR' && (
                      <div>
                        <div className={labelClass}>Araç türü {requiredStar}</div>
                        <OptionButtons
                          options={[
                            { value: 'BINEK' as const, label: 'Binek Araç' },
                            { value: 'TICARI' as const, label: 'Ticari Araç' },
                          ]}
                          value={formData.carSubtype}
                          onChange={(v) => setFormData((p) => ({ ...p, carSubtype: v }))}
                          disabled={dis}
                        />
                      </div>
                    )}
                    <div>
                      <div className={labelClass}>Şirketiniz var mı? {requiredStar}</div>
                      <OptionButtons
                        options={[...EVET_HAYIR]}
                        value={formData.hasCompany}
                        onChange={(v) => setFormData((p) => ({ ...p, hasCompany: v }))}
                        disabled={dis}
                      />
                    </div>
                    <div>
                      <div className={labelClass}>P1 Belgeniz var mı? {requiredStar}</div>
                      <OptionButtons
                        options={[...EVET_HAYIR]}
                        value={formData.hasP1}
                        onChange={(v) => setFormData((p) => ({ ...p, hasP1: v }))}
                        disabled={dis}
                      />
                    </div>
                  </div>
                )}

                {/* Adım 5 — sadece onay kutuları */}
                {step === 5 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        id="kvkk"
                        type="checkbox"
                        checked={formData.kvkkApproved}
                        onChange={(e) => setFormData((p) => ({ ...p, kvkkApproved: e.target.checked }))}
                        disabled={dis}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#16B24B] focus:ring-[#16B24B]"
                      />
                      <label htmlFor="kvkk" className="text-sm text-gray-700">
                        <a href="/legal/kvkk" target="_blank" className="font-medium text-[#16B24B] hover:text-[#118836] underline">KVKK Aydınlatma Metni</a>&apos;ni okudum ve onaylıyorum {requiredStar}
                      </label>
                    </div>
                    <div className="flex items-start gap-3">
                      <input
                        id="smsEmail"
                        type="checkbox"
                        checked={formData.smsEmailConsent}
                        onChange={(e) => setFormData((p) => ({ ...p, smsEmailConsent: e.target.checked }))}
                        disabled={dis}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#16B24B] focus:ring-[#16B24B]"
                      />
                      <label htmlFor="smsEmail" className="text-sm text-gray-700">
                        SMS ve e-posta ile bilgilendirme almayı kabul ediyorum.
                      </label>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={dis}
                      className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      Geri
                    </button>
                  ) : null}
                  {step < TOTAL_STEPS ? (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={dis}
                      className="flex-1 rounded-xl bg-[#16B24B] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#118836] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      İleri
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={dis}
                      className="flex-1 rounded-xl bg-[#16B24B] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#118836] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                Zaten başvurunuz var mı?{' '}
                <Link href="/auth/login" className="font-semibold text-[#16B24B] hover:text-[#118836]">
                  Başvuru sorgula
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex lg:items-center">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Başvuru sonrası süreç</div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Başvurunu gönderdikten sonra aday paneline yönlendirileceksin. Belgelerini yükleyip Yemeksepeti Projesinde kurye olarak çalışmaya başlayabilirsin.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  'Profil ve iletişim bilgilerini tamamla',
                  'Gerekli belgelerini yükle (kimlik, P1/P2 vb.)',
                  'Başvurun değerlendirilsin',
                  'Sigortalı kurye olarak vardiyalarını takip et',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#16B24B]/15 text-[#16B24B]">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div className="text-sm font-medium text-gray-800">{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
