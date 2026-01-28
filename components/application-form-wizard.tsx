'use client';

import { useState } from 'react';

type Step = 1 | 2 | 3 | 4 | 5;

export default function ApplicationFormWizard() {
  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasCompany, setHasCompany] = useState<'evet' | 'hayir' | null>(null);
  const [hasP1, setHasP1] = useState<'evet' | 'hayir' | null>(null);
  const [vehicleType, setVehicleType] = useState<'motosiklet' | 'araba' | null>(null);
  const [motoCc, setMotoCc] = useState<'50cc' | '100cc' | null>(null);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  const canProceedStep1 = fullName.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10;
  const canProceedStep2 = email.includes('@') && password.length >= 6;
  const canProceedStep3 = hasCompany !== null && hasP1 !== null;
  const canProceedStep4 =
    vehicleType === 'araba' || (vehicleType === 'motosiklet' && motoCc !== null);
  const canProceedStep5 = kvkkAccepted;

  const handleNext = () => {
    if (step === 5) {
      // Başvuru gönderimi burada yapılabilir (ör. /auth/register yönlendirmesi)
      return;
    }
    setStep((s) => Math.min(5, s + 1) as Step);
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1) as Step);

  const handleKvkkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Link şimdilik bir yere açılmıyor
  };

  const steps: Step[] = [1, 2, 3, 4, 5];
  const progress = (step / 5) * 100;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
      {/* Görsel */}
      <div className="border-b border-gray-100 px-4 pt-4 pb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kuryegorsel.png"
          alt="Kurye"
          className="h-auto w-full max-w-md mx-auto object-contain block"
        />
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full rounded-r-full bg-[#16B24B] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5 sm:p-6">
        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-1">
          {steps.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                s === step ? 'bg-[#16B24B]' : s < step ? 'bg-[#16B24B]/60' : 'bg-gray-200'
              }`}
              aria-label={`Adım ${s}`}
            />
          ))}
        </div>

        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-[#16B24B]">
          Adım {step} / 5
        </p>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Kişisel Bilgiler</h3>
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Adınız Soyadınız
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#16B24B] focus:ring-2 focus:ring-[#16B24B]/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                Telefon Numaranız
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#16B24B] focus:ring-2 focus:ring-[#16B24B]/20 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Giriş Bilgileri</h3>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Mail Adresi
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#16B24B] focus:ring-2 focus:ring-[#16B24B]/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#16B24B] focus:ring-2 focus:ring-[#16B24B]/20 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Şirket ve Belge</h3>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Şirketiniz var mı?</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHasCompany('evet')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    hasCompany === 'evet'
                      ? 'border-[#16B24B] bg-[#16B24B]/10 text-[#16B24B]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Evet
                </button>
                <button
                  type="button"
                  onClick={() => setHasCompany('hayir')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    hasCompany === 'hayir'
                      ? 'border-[#16B24B] bg-[#16B24B]/10 text-[#16B24B]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Hayır
                </button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">P1 Belgeniz var mı?</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHasP1('evet')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    hasP1 === 'evet'
                      ? 'border-[#16B24B] bg-[#16B24B]/10 text-[#16B24B]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Evet
                </button>
                <button
                  type="button"
                  onClick={() => setHasP1('hayir')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    hasP1 === 'hayir'
                      ? 'border-[#16B24B] bg-[#16B24B]/10 text-[#16B24B]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Hayır
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Araç Tipi</h3>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Araç Tipi Seçin</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setVehicleType('motosiklet');
                    setMotoCc(null);
                  }}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    vehicleType === 'motosiklet'
                      ? 'border-[#16B24B] bg-[#16B24B]/10 text-[#16B24B]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Motosiklet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVehicleType('araba');
                    setMotoCc(null);
                  }}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    vehicleType === 'araba'
                      ? 'border-[#16B24B] bg-[#16B24B]/10 text-[#16B24B]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Araba
                </button>
              </div>
            </div>
            {vehicleType === 'motosiklet' && (
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Motosiklet hacmi</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMotoCc('50cc')}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                      motoCc === '50cc'
                        ? 'border-[#16B24B] bg-[#16B24B]/10 text-[#16B24B]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    50cc
                  </button>
                  <button
                    type="button"
                    onClick={() => setMotoCc('100cc')}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                      motoCc === '100cc'
                        ? 'border-[#16B24B] bg-[#16B24B]/10 text-[#16B24B]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    100cc ve üzeri
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Onaylar</h3>
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/30 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={kvkkAccepted}
                  onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 rounded border-gray-300 text-[#16B24B] focus:ring-[#16B24B]"
                />
                <span className="text-sm text-gray-700">
                  <a
                    href="#"
                    onClick={handleKvkkClick}
                    className="font-medium text-[#16B24B] underline decoration-[#16B24B]/50 hover:decoration-[#16B24B]"
                  >
                    KVKK Aydınlatma Metni
                  </a>
                  &apos;ni okudum, onaylıyorum.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={marketingAccepted}
                  onChange={(e) => setMarketingAccepted(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 rounded border-gray-300 text-[#16B24B] focus:ring-[#16B24B]"
                />
                <span className="text-sm text-gray-700">
                  Point Delivery tarafından tarafıma telefon, SMS veya e-posta yoluyla bilgilendirme
                  yapılmasını kabul ediyorum.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50"
          >
            Geri
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !canProceedStep2) ||
              (step === 3 && !canProceedStep3) ||
              (step === 4 && !canProceedStep4) ||
              (step === 5 && !canProceedStep5)
            }
            className="rounded-xl bg-[#16B24B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#118836] disabled:pointer-events-none disabled:opacity-50"
          >
            {step === 5 ? 'Başvuruyu Gönder' : 'İleri'}
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-3xl bg-[#16B24B]/20 blur-xl" />
    </div>
  );
}
