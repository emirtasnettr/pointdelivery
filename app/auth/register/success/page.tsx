/**
 * Kayıt Başarılı Sayfası
 * 
 * Kullanıcı kayıt olduktan sonra bu sayfaya yönlendirilir
 */

import Link from 'next/link';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Kayıt İşlemi Başarılı
          </h1>

          <p className="text-gray-600 mb-6">
            Hesabınız başarıyla oluşturuldu. Giriş yapmak için e-posta adresinize gönderilen
            onay bağlantısına tıklayın.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Önemli:</strong> E-posta kutunuzu kontrol edin. Onay bağlantısına
              tıklamadan giriş yapamazsınız.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition"
            >
              Giriş Sayfasına Git
            </Link>

            <Link
              href="/"
              className="block w-full rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
