import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo ve Açıklama */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pointdlogo.webp" alt="Point Delivery" className="w-auto" style={{ height: '42px', width: 'auto' }} />
            </Link>

            <p className="mt-5 text-sm text-gray-600 leading-relaxed max-w-md">
              Point Delivery, Yemeksepeti Projesi kapsamında sigortalı kurye alımları ve başvuru süreçlerini yönetir.
              Güvenli çalışma, düzenli ödeme ve yüksek kazanç imkanı sunuyoruz.
            </p>

            <div className="mt-4 text-sm font-semibold text-gray-900">
              Sigortalı kurye fırsatı. Düzenli kazanç, güvenli iş.
            </div>
          </div>

          {/* Yasal Bilgilendirmeler */}
          <div>
            <h4 className="text-gray-900 font-extrabold text-lg mb-6">Yasal Bilgilendirmeler</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/kvkk" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16B24B] opacity-0 group-hover:opacity-100 transition-opacity" />
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link href="/legal/gizlilik" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16B24B] opacity-0 group-hover:opacity-100 transition-opacity" />
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/legal/cerezler" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16B24B] opacity-0 group-hover:opacity-100 transition-opacity" />
                  Çerez Politikası
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h4 className="text-gray-900 font-extrabold text-lg mb-6">İletişim</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-600 group">
                <svg className="w-5 h-5 mt-0.5 text-[#16B24B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="group-hover:text-gray-900 transition-colors">0850 259 45 45</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600 group">
                <svg className="w-5 h-5 mt-0.5 text-[#16B24B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="group-hover:text-gray-900 transition-colors">info@pointdelivery.com.tr</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600 group">
                <svg className="w-5 h-5 mt-0.5 text-[#16B24B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="group-hover:text-gray-900 transition-colors">Kasap Sokak, N:8/10 Kat:2 Esentepe/Şişli</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Alt Kısım */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="text-sm text-gray-600">
                © {year} Point Delivery. Tüm hakları saklıdır.
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                Kullanım Şartları
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
