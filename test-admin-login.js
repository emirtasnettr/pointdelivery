/**
 * Admin Giriş ve Dashboard Erişim Testi
 * 
 * Oluşturulan admin kullanıcısının giriş yapıp dashboard'a erişebildiğini test eder
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const email = 'emir@jobulai.com';
const password = 'emir123';

async function testAdminLogin() {
  console.log('🧪 Admin Giriş ve Dashboard Erişim Testi\n');
  console.log('='.repeat(50));

  try {
    // 1. Giriş testi
    console.log('\n1️⃣  Giriş Testi...');
    const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log('❌ Giriş başarısız:', error.message);
      return false;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Giriş başarılı!');
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);
    console.log(`   Access Token: ${loginData.access_token.substring(0, 30)}...`);

    // 2. Profil kontrolü
    console.log('\n2️⃣  Profil Kontrolü...');
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${loginData.user.id}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${loginData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.log('❌ Profil okunamadı');
      return false;
    }

    const profileData = await profileResponse.json();
    if (profileData.length === 0) {
      console.log('❌ Profil bulunamadı');
      return false;
    }

    const profile = profileData[0];
    console.log('✅ Profil bulundu!');
    console.log(`   Ad Soyad: ${profile.full_name}`);
    console.log(`   Rol: ${profile.role}`);

    if (profile.role !== 'ADMIN') {
      console.log('❌ Rol ADMIN değil!');
      return false;
    }

    // 3. Metadata kontrolü
    console.log('\n3️⃣  Metadata Kontrolü...');
    const userMetadata = loginData.user.user_metadata;
    const appMetadata = loginData.user.app_metadata;

    console.log(`   User Metadata Role: ${userMetadata?.role || 'YOK'}`);
    console.log(`   App Metadata Role: ${appMetadata?.role || 'YOK'}`);

    if (userMetadata?.role !== 'ADMIN' && appMetadata?.role !== 'ADMIN') {
      console.log('⚠️  Metadata\'da rol bulunamadı (ama profil rolü doğru)');
    }

    // 4. Dashboard erişim simülasyonu
    console.log('\n4️⃣  Dashboard Erişim Simülasyonu...');
    console.log('✅ Tüm kontroller başarılı!');
    console.log('✅ Admin dashboard\'a erişim için gerekli tüm bilgiler mevcut:');
    console.log(`   - Kullanıcı ID: ${loginData.user.id}`);
    console.log(`   - Email: ${email}`);
    console.log(`   - Profil Rolü: ${profile.role}`);
    console.log(`   - Email Onaylı: ${loginData.user.email_confirmed_at ? 'Evet' : 'Hayır'}`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ TÜM TESTLER BAŞARILI!');
    console.log('\n📋 Giriş Bilgileri:');
    console.log(`   Email: ${email}`);
    console.log(`   Şifre: ${password}`);
    console.log(`   Dashboard URL: /dashboard/admin`);
    console.log('\n🎉 Admin dashboard\'a giriş yapabilirsiniz!');

    return true;

  } catch (error) {
    console.error('\n❌ Test hatası:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testAdminLogin().then(success => {
  process.exit(success ? 0 : 1);
});
