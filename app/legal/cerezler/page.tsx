/**
 * Çerez Politikası Sayfası
 */

import Link from 'next/link';
import Footer from '@/components/footer';

export const metadata = {
  title: 'Çerez Politikası',
  description: 'Point Delivery Çerez Politikası - Web sitemizde çerezlerin nasıl kullanıldığı hakkında bilgi',
};

export default function CerezlerPage() {
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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[#16B24B] hover:text-[#118836] font-medium">
            ← Ana Sayfaya Dön
          </Link>
        </div>

        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Çerez Politikası</h1>
          
          <p className="text-sm text-gray-500 mb-8">Son güncelleme: Ocak 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Çerez Nedir?</h2>
            <p className="text-gray-600 mb-4">
              Çerezler, web sitemizi ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza 
              (bilgisayar, tablet veya telefon) yerleştirilen küçük metin dosyalarıdır. Çerezler, 
              web sitesinin düzgün çalışmasını sağlamak, güvenliği artırmak, kullanıcı deneyimini 
              iyileştirmek ve site performansını analiz etmek için yaygın olarak kullanılmaktadır.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Kullandığımız Çerez Türleri</h2>
            
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">2.1 Zorunlu Çerezler</h3>
                <p className="text-gray-600 mb-2">
                  Bu çerezler, web sitesinin temel işlevlerini yerine getirmesi için gereklidir. 
                  Bunlar olmadan site düzgün çalışmaz.
                </p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  <li>Oturum açma ve kimlik doğrulama</li>
                  <li>Güvenlik özellikleri</li>
                  <li>Form verilerinin korunması</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">2.2 İşlevsellik Çerezleri</h3>
                <p className="text-gray-600 mb-2">
                  Bu çerezler, site tercihlerinizi hatırlamamıza ve kişiselleştirilmiş özellikler 
                  sunmamıza yardımcı olur.
                </p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  <li>Dil ve bölge tercihleri</li>
                  <li>Kullanıcı ayarları</li>
                  <li>Önceki seçimleriniz</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">2.3 Analitik Çerezler</h3>
                <p className="text-gray-600 mb-2">
                  Bu çerezler, ziyaretçilerin sitemizi nasıl kullandığını anlamamıza yardımcı olur. 
                  Toplanan veriler istatistiksel amaçlarla kullanılır.
                </p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  <li>Ziyaret edilen sayfalar</li>
                  <li>Sitede geçirilen süre</li>
                  <li>Trafik kaynakları</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">2.4 Performans Çerezleri</h3>
                <p className="text-gray-600 mb-2">
                  Bu çerezler, web sitesinin performansını izlememize ve iyileştirmemize yardımcı olur.
                </p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  <li>Sayfa yükleme süreleri</li>
                  <li>Hata raporları</li>
                  <li>Sunucu performansı</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Üçüncü Taraf Çerezleri</h2>
            <p className="text-gray-600 mb-4">
              Web sitemizde aşağıdaki üçüncü taraf hizmet sağlayıcılarının çerezleri kullanılabilir:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Google Analytics:</strong> Site trafiği ve kullanıcı davranışı analizi</li>
              <li><strong>Supabase:</strong> Kimlik doğrulama ve oturum yönetimi</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Çerezlerin Saklama Süresi</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Çerez Türü</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Saklama Süresi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600">Oturum Çerezleri</td>
                    <td className="px-4 py-2 text-sm text-gray-600">Tarayıcı kapatıldığında silinir</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600">Kalıcı Çerezler</td>
                    <td className="px-4 py-2 text-sm text-gray-600">1 yıla kadar</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-600">Analitik Çerezler</td>
                    <td className="px-4 py-2 text-sm text-gray-600">2 yıla kadar</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Çerez Tercihlerinizi Yönetme</h2>
            <p className="text-gray-600 mb-4">
              Çerezleri tarayıcı ayarlarınızdan kontrol edebilir ve yönetebilirsiniz. 
              Çoğu tarayıcı aşağıdaki seçenekleri sunar:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Tüm çerezleri kabul etme veya reddetme</li>
              <li>Belirli çerezleri engelleme</li>
              <li>Çerez yerleştirilmeden önce bildirim alma</li>
              <li>Mevcut çerezleri silme</li>
            </ul>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                <strong>Önemli:</strong> Çerezleri devre dışı bırakmak, web sitemizin bazı 
                özelliklerinin düzgün çalışmamasına neden olabilir.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Tarayıcı Ayarları</h2>
            <p className="text-gray-600 mb-4">
              Farklı tarayıcılarda çerez ayarlarını yönetmek için aşağıdaki bağlantıları kullanabilirsiniz:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Google Chrome:</strong> Ayarlar → Gizlilik ve güvenlik → Çerezler</li>
              <li><strong>Mozilla Firefox:</strong> Seçenekler → Gizlilik ve Güvenlik → Çerezler</li>
              <li><strong>Safari:</strong> Tercihler → Gizlilik → Çerezler</li>
              <li><strong>Microsoft Edge:</strong> Ayarlar → Çerezler ve site izinleri</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Politika Değişiklikleri</h2>
            <p className="text-gray-600">
              Bu Çerez Politikası&apos;nı zaman zaman güncelleyebiliriz. Değişiklikler bu sayfada 
              yayınlanacak ve &quot;Son güncelleme&quot; tarihi güncellenecektir. Önemli değişiklikler 
              için ek bildirim yapılabilir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. İletişim</h2>
            <p className="text-gray-600 mb-4">
              Çerez Politikamız hakkında sorularınız varsa, bizimle iletişime geçebilirsiniz:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-1"><strong>Şirket:</strong> Point Delivery Lojistik Hizmetleri A.Ş.</p>
              <p className="text-gray-700 mb-1"><strong>Adres:</strong> Kasap Sokak, N:8/10 Kat:2 Esentepe/Şişli, İstanbul</p>
              <p className="text-gray-700 mb-1"><strong>Telefon:</strong> 0850 259 45 45</p>
              <p className="text-gray-700"><strong>E-posta:</strong> info@pointdelivery.com.tr</p>
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
