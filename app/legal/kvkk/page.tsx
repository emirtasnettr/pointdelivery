/**
 * KVKK Aydınlatma Metni Sayfası
 */

import Link from 'next/link';
import Footer from '@/components/footer';

export const metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: 'Point Delivery KVKK Aydınlatma Metni - Kişisel verilerin korunması hakkında bilgilendirme',
};

export default function KVKKPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">KVKK Aydınlatma Metni</h1>
          
          <p className="text-sm text-gray-500 mb-8">Son güncelleme: Ocak 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Veri Sorumlusu</h2>
            <p className="text-gray-600 mb-4">
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında, kişisel verileriniz; 
              veri sorumlusu olarak <strong>Point Delivery Lojistik Hizmetleri A.Ş.</strong> (&quot;Şirket&quot;) tarafından 
              aşağıda açıklanan kapsamda işlenebilecektir.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-1"><strong>Şirket Unvanı:</strong> Point Delivery Lojistik Hizmetleri A.Ş.</p>
              <p className="text-gray-700 mb-1"><strong>Adres:</strong> Kasap Sokak, N:8/10 Kat:2 Esentepe/Şişli, İstanbul</p>
              <p className="text-gray-700 mb-1"><strong>Telefon:</strong> 0850 259 45 45</p>
              <p className="text-gray-700"><strong>E-posta:</strong> info@pointdelivery.com.tr</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. İşlenen Kişisel Veriler</h2>
            <p className="text-gray-600 mb-4">Şirketimiz tarafından aşağıdaki kişisel verileriniz işlenmektedir:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, T.C. kimlik numarası, doğum tarihi</li>
              <li><strong>İletişim Bilgileri:</strong> Telefon numarası, e-posta adresi, adres bilgileri</li>
              <li><strong>Mesleki Bilgiler:</strong> Ehliyet bilgileri, araç bilgileri, P1/P2 belgesi bilgileri</li>
              <li><strong>Finansal Bilgiler:</strong> Banka hesap bilgileri, vergi levhası bilgileri</li>
              <li><strong>Görsel Veriler:</strong> Yüklenen belgeler ve fotoğraflar</li>
              <li><strong>Dijital Veriler:</strong> IP adresi, çerez verileri, oturum bilgileri</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <p className="text-gray-600 mb-4">Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Kurye başvuru süreçlerinin yürütülmesi</li>
              <li>İş sözleşmesi ve sigorta işlemlerinin gerçekleştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>İnsan kaynakları süreçlerinin yönetimi</li>
              <li>Ücret ve hakediş ödemelerinin yapılması</li>
              <li>İş sağlığı ve güvenliği faaliyetlerinin yürütülmesi</li>
              <li>İletişim faaliyetlerinin yürütülmesi</li>
              <li>Hukuki süreçlerin takibi</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Kişisel Verilerin Aktarımı</h2>
            <p className="text-gray-600 mb-4">
              Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda, 
              KVKK&apos;nın 8. ve 9. maddelerinde belirtilen şartlara uygun olarak:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>İş ortaklarımıza ve tedarikçilerimize</li>
              <li>Sosyal Güvenlik Kurumu&apos;na</li>
              <li>Vergi dairelerine</li>
              <li>Yetkili kamu kurum ve kuruluşlarına</li>
              <li>Hukuki danışmanlarımıza</li>
            </ul>
            <p className="text-gray-600 mt-4">aktarılabilecektir.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
            <p className="text-gray-600 mb-4">
              Kişisel verileriniz; web sitemiz, mobil uygulamamız, e-posta, telefon ve fiziki başvuru 
              formları aracılığıyla toplanmaktadır.
            </p>
            <p className="text-gray-600">
              Kişisel verileriniz, KVKK&apos;nın 5. maddesinde belirtilen &quot;açık rızanın varlığı&quot;, 
              &quot;kanunlarda açıkça öngörülmesi&quot;, &quot;sözleşmenin kurulması veya ifası için gerekli olması&quot;, 
              &quot;veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi&quot; ve &quot;meşru menfaat&quot; 
              hukuki sebeplerine dayanılarak işlenmektedir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Kişisel Veri Sahibinin Hakları</h2>
            <p className="text-gray-600 mb-4">KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
              <li>KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme</li>
              <li>Düzeltme, silme ve yok etme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Başvuru Yöntemi</h2>
            <p className="text-gray-600 mb-4">
              Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemlerle bize başvurabilirsiniz:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>E-posta:</strong> kvkk@pointdelivery.com.tr</p>
              <p className="text-gray-700 mb-2"><strong>Posta Adresi:</strong> Kasap Sokak, N:8/10 Kat:2 Esentepe/Şişli, İstanbul</p>
              <p className="text-gray-700"><strong>Telefon:</strong> 0850 259 45 45</p>
            </div>
            <p className="text-gray-600 mt-4">
              Başvurularınız en geç 30 (otuz) gün içinde sonuçlandırılacaktır. İşlemin ayrıca bir maliyet 
              gerektirmesi halinde, Kişisel Verileri Koruma Kurulu tarafından belirlenen tarife 
              uygulanabilecektir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Kişisel Verilerin Saklanma Süresi</h2>
            <p className="text-gray-600">
              Kişisel verileriniz, işlenme amaçlarının gerektirdiği süreler boyunca ve yasal 
              yükümlülüklerimiz kapsamında belirlenen süreler dahilinde saklanmaktadır. Saklama 
              süresinin sona ermesinin ardından kişisel verileriniz silinmekte, yok edilmekte veya 
              anonim hale getirilmektedir.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
