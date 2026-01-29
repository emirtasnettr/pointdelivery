/**
 * Gizlilik Politikası Sayfası
 */

import Link from 'next/link';
import Footer from '@/components/footer';

export const metadata = {
  title: 'Gizlilik Politikası',
  description: 'Point Delivery Gizlilik Politikası - Kişisel bilgilerinizin nasıl korunduğu hakkında bilgi',
};

export default function GizlilikPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Gizlilik Politikası</h1>
          
          <p className="text-sm text-gray-500 mb-8">Son güncelleme: Ocak 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Giriş</h2>
            <p className="text-gray-600 mb-4">
              <strong>Point Delivery Lojistik Hizmetleri A.Ş.</strong> (&quot;Şirket&quot;, &quot;biz&quot; veya &quot;bizim&quot;) olarak, 
              gizliliğinize saygı duyuyor ve kişisel bilgilerinizin korunmasını önemsiyoruz. Bu Gizlilik 
              Politikası, web sitemizi ve hizmetlerimizi kullandığınızda bilgilerinizi nasıl topladığımızı, 
              kullandığımızı ve koruduğumuzu açıklamaktadır.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Topladığımız Bilgiler</h2>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">2.1 Doğrudan Sağladığınız Bilgiler</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Kayıt ve başvuru formlarında girdiğiniz bilgiler (ad, soyad, e-posta, telefon, adres)</li>
              <li>Yüklediğiniz belgeler (ehliyet, kimlik, sertifikalar)</li>
              <li>İletişim kurduğunuzda paylaştığınız bilgiler</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-3">2.2 Otomatik Olarak Toplanan Bilgiler</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>IP adresi ve konum bilgileri</li>
              <li>Tarayıcı türü ve cihaz bilgileri</li>
              <li>Site kullanım verileri ve çerezler</li>
              <li>Oturum açma zamanları ve süreleri</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Bilgilerin Kullanım Amaçları</h2>
            <p className="text-gray-600 mb-4">Topladığımız bilgileri aşağıdaki amaçlarla kullanıyoruz:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Hesabınızı oluşturmak ve yönetmek</li>
              <li>Başvuru süreçlerinizi değerlendirmek</li>
              <li>Size hizmetlerimiz hakkında bilgi vermek</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
              <li>Hizmetlerimizi geliştirmek</li>
              <li>İletişim kurmak ve destek sağlamak</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Bilgilerin Paylaşımı</h2>
            <p className="text-gray-600 mb-4">
              Kişisel bilgilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmayız:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Yasal Zorunluluklar:</strong> Mahkeme kararı veya yasal süreçler gereği</li>
              <li><strong>İş Ortakları:</strong> Hizmetlerimizi sunmamıza yardımcı olan güvenilir ortaklar</li>
              <li><strong>Kamu Kurumları:</strong> SGK, vergi dairesi gibi resmi kurumlar</li>
              <li><strong>Onayınızla:</strong> Açık onayınızı aldığımız durumlarda</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Veri Güvenliği</h2>
            <p className="text-gray-600 mb-4">
              Kişisel verilerinizin güvenliğini sağlamak için aşağıdaki önlemleri alıyoruz:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>SSL/TLS şifreleme teknolojisi kullanımı</li>
              <li>Güvenli sunucu altyapısı</li>
              <li>Erişim kontrolü ve yetkilendirme sistemleri</li>
              <li>Düzenli güvenlik denetimleri</li>
              <li>Çalışan eğitimleri ve gizlilik sözleşmeleri</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Veri Saklama Süresi</h2>
            <p className="text-gray-600">
              Kişisel verilerinizi, hizmetlerimizi sunmak için gerekli olduğu sürece ve yasal 
              yükümlülüklerimiz kapsamında belirlenen sürelerde saklıyoruz. İş ilişkisi sona erdikten 
              sonra, yasal saklama süreleri boyunca verileriniz güvenli bir şekilde muhafaza edilir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Haklarınız</h2>
            <p className="text-gray-600 mb-4">Kişisel verilerinizle ilgili aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Verilerinize erişim hakkı</li>
              <li>Verilerin düzeltilmesini isteme hakkı</li>
              <li>Verilerin silinmesini isteme hakkı</li>
              <li>Veri işlemeye itiraz etme hakkı</li>
              <li>Veri taşınabilirliği hakkı</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Bu haklarınızı kullanmak için <strong>info@pointdelivery.com.tr</strong> adresinden 
              bizimle iletişime geçebilirsiniz.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Üçüncü Taraf Bağlantıları</h2>
            <p className="text-gray-600">
              Web sitemiz, üçüncü taraf web sitelerine bağlantılar içerebilir. Bu sitelerin gizlilik 
              uygulamalarından sorumlu değiliz. Bu siteleri ziyaret ettiğinizde, kendi gizlilik 
              politikalarını incelemenizi öneririz.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Politika Değişiklikleri</h2>
            <p className="text-gray-600">
              Bu Gizlilik Politikası&apos;nı zaman zaman güncelleyebiliriz. Önemli değişiklikler 
              yapıldığında, web sitemiz üzerinden veya e-posta yoluyla sizi bilgilendireceğiz. 
              Değişikliklerin yürürlüğe giriş tarihi bu sayfada belirtilecektir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. İletişim</h2>
            <p className="text-gray-600 mb-4">
              Gizlilik Politikamız hakkında sorularınız veya endişeleriniz varsa, bizimle iletişime geçebilirsiniz:
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
