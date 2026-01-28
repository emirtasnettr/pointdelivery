import Link from 'next/link';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
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
            <Link
              href="/auth/register"
              className="rounded-lg bg-[#16B24B] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#118836]"
            >
              Şimdi Başvur
            </Link>
          </div>

          {/* Mobil: Başvuru Sorgula → Giriş */}
          <Link
            href="/auth/login"
            className="inline-flex md:hidden rounded-lg bg-[#16B24B] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#118836]"
          >
            Başvuru Sorgula
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-[#16B24B]/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-[#16B24B]/15 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#16B24B]" />
              Yemeksepeti Projesi • Sigortalı Kurye
            </div>

            <h1 className="mt-5 text-[32px] leading-[36px] font-extrabold tracking-tight text-gray-900 sm:text-5xl sm:leading-[52px]">
              Point Delivery ayrıcalıkları ile
              <span className="block text-[#16B24B]">
                Yemeksepeti Projesinde Çalış
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
              Sigortalı çalışma imkanı, düzenli ödeme ve haftalık 30.000 TL&apos;ye varan kazanç fırsatıyla şimdi aramıza katıl.
            </p>

            <p className="mt-2 max-w-xl text-base leading-relaxed text-gray-600 hidden md:block">
              Point Delivery bünyesinde, Yemeksepeti Projesinde görev alacak yeni kuryeler arıyoruz.
              Sigortalı çalışma imkanı ile güvenli, sürdürülebilir ve düzenli kazanç sağlayabileceğiniz bir iş modeli sunuyoruz.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-[#16B24B] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#118836]"
              >
                Şimdi Başvur
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Giriş Yap
              </Link>
            </div>
          </div>

          {/* Görsel ve kutular */}
          <div className="relative flex items-center justify-center min-h-[320px] lg:min-h-[400px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kuryegorsel.png"
              alt="Kurye"
              className="relative z-0 h-auto w-full max-w-lg object-contain"
            />

            {/* Kutu 1: Yemeksepeti Projesi */}
            <div className="absolute right-0 top-24 z-10 hidden items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg sm:flex sm:right-2 sm:top-28 lg:right-2 lg:top-32">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16B24B]/10 text-[#16B24B]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">Yemeksepeti Projesi</span>
            </div>

            {/* Kutu 2: Sigortalı Çalışma Modeli */}
            <div className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg sm:flex sm:left-4 lg:left-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16B24B]/10 text-[#16B24B]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1 3 5v6c0 5 3 9 9 12 6-3 9-7 9-12V5l-9-4Z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">Sigortalı Çalışma Modeli</span>
            </div>

            {/* Kutu 3: Yüksek Kazanç İmkanı */}
            <div className="absolute bottom-24 right-2 z-10 hidden items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg sm:flex sm:bottom-28 sm:right-4 lg:right-8 lg:bottom-32">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16B24B]/10 text-[#16B24B]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H7" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">Yüksek Kazanç İmkanı</span>
            </div>
          </div>
        </div>
      </section>

      {/* Öne Çıkan Avantajlar */}
      <section id="features" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Öne Çıkan Avantajlar
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              Point Delivery ile Yemeksepeti Projesinde kurye olarak çalışmanın sunduğu imkanlar.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Haftalık 30.000 TL\'ye varan kazanç imkanı',
                desc: 'Performansınıza bağlı yüksek kazanç potansiyeli.',
                icon: (
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                ),
              },
              {
                title: 'Sigortalı çalışma avantajı',
                desc: 'SGK güvencesi ile yasal ve güvenli çalışma modeli.',
                icon: (
                  <path d="M12 1 3 5v6c0 5 3 9 9 12 6-3 9-7 9-12V5l-9-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                ),
              },
              {
                title: 'Düzenli ve zamanında ödeme garantisi',
                desc: 'Ödemeleriniz vadesinde, şeffaf ve güvenilir.',
                icon: (
                  <path d="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                ),
              },
              {
                title: 'Esnek çalışma saatleri',
                desc: 'Yaşam tarzınıza uygun çalışma düzeni.',
                icon: (
                  <path d="M12 8v5l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                ),
              },
              {
                title: 'Profesyonel operasyon ve destek ekibi',
                desc: 'Yanınızda güçlü bir ekip, sürekli destek.',
                icon: (
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M19 11a4 4 0 0 0 0-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                ),
              },
              {
                title: 'Yüksek kazanç potansiyeli',
                desc: 'Performansınıza göre artan kazanç imkanı.',
                icon: (
                  <path d="M3 3v18h18M7 14l4-4 4 4 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                ),
              },
              {
                title: 'SGK & yasal güvence',
                desc: 'Tam yasal güvence ile güvenli çalışma.',
                icon: (
                  <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ),
              },
              {
                title: 'Eğitim ve oryantasyon desteği',
                desc: 'İşe başlamadan önce gerekli eğitimler.',
                icon: (
                  <>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 7h8M8 11h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ),
              },
              {
                title: 'Vadesinde ödeme',
                desc: 'Ödemeleriniz zamanında hesabınızda.',
                icon: (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ),
              },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[#16B24B]/30 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#16B24B]/10 text-[#16B24B] ring-2 ring-[#16B24B]/20 transition group-hover:bg-[#16B24B] group-hover:text-white group-hover:ring-[#16B24B]/40">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      {f.icon}
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold text-gray-900">{f.title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-gray-600">{f.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* P1/P2 Belge Bilgilendirme & Sigortalı Çalışma */}
      <section id="how" className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">P1 belgeniz yok mu? Sorun değil.</h2>
            <p className="mt-3 text-lg text-gray-600">
              P1 belgesi olmayan adaylar için P2 belge desteği sağlanmaktadır.
              Gerekli yönlendirmeler ile sürece hızlıca dahil olabilir, çalışmaya hemen başlayabilirsiniz.
            </p>
          </div>

          <div className="relative mt-10">
            <div className="pointer-events-none absolute -left-10 -top-8 h-24 w-24 rounded-3xl bg-[#16B24B]/15 blur-xl" />
            <div className="pointer-events-none absolute -right-10 -bottom-8 h-24 w-24 rounded-3xl bg-[#16B24B]/10 blur-xl" />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[
                {
                  title: 'P1 / P2 Belge Desteği',
                  subtitle: 'Belgeniz yoksa bile sürece dahil olun',
                  steps: ['P1 belgeniz yoksa P2 belge desteği alın', 'Gerekli yönlendirmelerle hızlıca sürece dahil olun', 'Çalışmaya hemen başlayın'],
                  accent: 'bg-[#16B24B]',
                },
                {
                  title: 'Sigortalı Çalışma İmkanı',
                  subtitle: 'Point Delivery olarak kuryelerimizin güvence altında olmasını önemsiyoruz.',
                  steps: [
                    'Yemeksepeti Projesinde görev alırken sigortalı çalışma modeli',
                    'Hem bugününüzü hem geleceğinizi güvence altına alın',
                    'Yasal ve güvenli çalışma imkanı',
                  ],
                  accent: 'bg-[#16B24B]',
                },
              ].map((c) => (
                <div key={c.title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-extrabold text-gray-900">{c.title}</div>
                      <div className="mt-1 text-sm text-gray-600">{c.subtitle}</div>
                    </div>
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${c.accent} text-white shadow-sm`}>
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>

                  <ol className="mt-5 space-y-3">
                    {c.steps.map((s, idx) => (
                      <li key={s} className="flex items-start gap-3">
                        <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full ${c.accent} text-xs font-extrabold text-white`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-700">{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                Sigortalı çalışma imkanı ile Yemeksepeti Projesinde yer almak için hemen başvurun.
              </div>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Şimdi Başvur →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA & Neden Point Delivery */}
      <section id="roles" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Şimdi Başvur, Hemen Kazanmaya Başla</h2>
              <p className="mt-3 text-lg text-gray-600">
                Yemeksepeti Projesinde yer almak ve Point Delivery ayrıcalıklarıyla çalışmak için başvurunu hemen oluştur.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/auth/login" className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                Giriş Yap
              </Link>
              <Link href="/auth/register" className="rounded-xl bg-[#16B24B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#118836]">
                Şimdi Başvur
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                title: 'Sigortalı Çalışma İmkanı',
                desc: 'Point Delivery olarak kuryelerimizin güvencede olmasını önemsiyoruz. Yemeksepeti Projesinde görev alırken sigortalı çalışma modeli ile hem bugününüzü hem geleceğinizi güvence altına alabilirsiniz.',
                bullets: ['Sigortalı çalışma modeli', 'Bugün ve gelecek güvencesi', 'Yasal çalışma imkanı'],
              },
              {
                title: 'Neden Point Delivery?',
                desc: 'Yemeksepeti gibi güçlü bir projede çalışma imkanı, şeffaf kazanç ve kurye odaklı yönetim.',
                bullets: [
                  'Yemeksepeti gibi güçlü bir projede çalışma imkanı',
                  'Sigortalı ve yasal çalışma modeli',
                  'Şeffaf kazanç sistemi',
                  'Düzenli ödeme yapısı',
                  'Kurye odaklı, destekleyici yönetim anlayışı',
                  'Uzun vadeli iş imkanı',
                ],
              },
            ].map((r) => (
              <div key={r.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md">
                <div className="text-base font-extrabold text-gray-900">{r.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-gray-600">{r.desc}</div>
                <ul className="mt-4 space-y-2">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#16B24B]/15 text-[#16B24B]">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Link href="/auth/register" className="text-sm font-semibold text-[#16B24B] hover:text-[#118836]">
                    Şimdi Başvur →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
