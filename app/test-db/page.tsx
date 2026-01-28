/**
 * Supabase Bağlantı Test Sayfası
 * 
 * Bu sayfa, Supabase veritabanı bağlantısını test etmek için oluşturulmuştur.
 * Tarayıcıda http://localhost:3000/test-db adresine giderek test edebilirsiniz.
 */

import { createClient } from '@/lib/supabase/server';

export default async function TestDBPage() {
  // Server Component olduğu için doğrudan async olabilir
  const supabase = await createClient();

  try {
    // 1. Basit bağlantı testi - profiles tablosundan veri çek
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    // 2. Kullanıcı bilgisi kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">
            🧪 Supabase Bağlantı Testi
          </h1>

          {/* Bağlantı Durumu */}
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            <h2 className="font-bold text-lg mb-2">✅ Bağlantı Başarılı!</h2>
            <p>Supabase veritabanına başarıyla bağlandınız.</p>
          </div>

          {/* Kullanıcı Bilgisi */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">👤 Kullanıcı Durumu</h2>
            {user ? (
              <div>
                <p className="text-green-600 font-medium">✅ Giriş yapılmış</p>
                <p className="text-sm text-gray-600 mt-2">User ID: {user.id}</p>
                <p className="text-sm text-gray-600">Email: {user.email || 'Email yok'}</p>
              </div>
            ) : (
              <div>
                <p className="text-yellow-600 font-medium">⚠️ Giriş yapılmamış</p>
                <p className="text-sm text-gray-600 mt-2">
                  Bu normal! Henüz authentication sistemi kurulmamış.
                </p>
              </div>
            )}
          </div>

          {/* Profiles Tablosu Verileri */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">📊 Profiles Tablosu</h2>
            
            {error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">❌ Hata:</p>
                <p className="text-sm mt-2">{error.message}</p>
                <p className="text-xs mt-2 text-gray-600">
                  Not: Eğer "permission denied" hatası alıyorsanız, RLS politikaları çalışıyor demektir.
                  Bu normal ve beklenen bir durumdur.
                </p>
              </div>
            ) : (
              <div>
                {profiles && profiles.length > 0 ? (
                  <div>
                    <p className="text-green-600 font-medium mb-4">
                      ✅ {profiles.length} kayıt bulundu
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Ad
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Rol
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Oluşturulma
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {profiles.map((profile: any) => (
                            <tr key={profile.id}>
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                {profile.id.substring(0, 8)}...
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {profile.full_name || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {profile.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <p className="font-bold">ℹ️ Tablo boş</p>
                    <p className="text-sm mt-2">
                      Henüz profil kaydı yok. Bu normal! 
                      Authentication sistemi kurulduğunda otomatik oluşturulacak.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sonuç */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-2">🎉 Sonuç</h3>
            <p className="text-gray-700">
              Supabase bağlantısı çalışıyor! Artık veritabanı işlemlerine başlayabilirsiniz.
            </p>
            <div className="mt-4">
              <a
                href="/"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ana Sayfaya Dön
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    // Beklenmeyen hatalar
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <h2 className="font-bold text-xl mb-2">❌ Bağlantı Hatası</h2>
            <p className="mb-2">{err.message || 'Bilinmeyen bir hata oluştu.'}</p>
            <p className="text-sm mt-4">
              <strong>Kontrol edin:</strong>
            </p>
            <ul className="text-sm list-disc list-inside mt-2 space-y-1">
              <li>.env.local dosyası doğru oluşturuldu mu?</li>
              <li>NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değerleri doğru mu?</li>
              <li>Development server'ı yeniden başlattınız mı?</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}
