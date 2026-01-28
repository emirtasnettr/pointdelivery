/**
 * Emir kullanıcısının şifresini düzeltme script'i
 * 
 * Supabase'in kendi şifre hash formatını kullanarak şifreyi günceller
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL bulunamadı!');
  process.exit(1);
}

const { Client } = require('pg');

const email = 'emir@jobulai.com';
const password = 'emir123';

async function fixPassword() {
  const client = new Client({
    connectionString: 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔌 Veritabanına bağlandı\n');

    // Kullanıcıyı bul
    const userResult = await client.query(`
      SELECT id FROM auth.users WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log('❌ Kullanıcı bulunamadı!');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`📝 Kullanıcı bulundu: ${userId}`);

    // Supabase'in kendi şifre hash formatını kullanarak şifreyi güncelle
    // Supabase, pgcrypto extension'ını kullanır ve crypt() fonksiyonu ile hash'ler
    // Ancak Supabase'in kendi formatı biraz farklı olabilir
    
    // Önce mevcut şifreyi kontrol et
    const checkResult = await client.query(`
      SELECT encrypted_password FROM auth.users WHERE id = $1
    `, [userId]);

    console.log('🔐 Şifre güncelleniyor...');
    
    // Supabase'in kullandığı format: crypt(password, gen_salt('bf'))
    // Ancak Supabase'in kendi hash formatı biraz farklı olabilir
    // En iyi yol: Supabase Auth API kullanmak ama service role key gerekiyor
    
    // Alternatif: Mevcut kullanıcıyı silip yeniden oluşturmak
    // Ya da Supabase Dashboard'dan şifreyi sıfırlamak
    
    // Şimdilik crypt ile deneyelim
    await client.query(`
      UPDATE auth.users
      SET 
        encrypted_password = crypt($1, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
      WHERE id = $2
    `, [password, userId]);

    console.log('✅ Şifre güncellendi');
    console.log('✅ Email onaylandı');

    // Kontrol
    const finalCheck = await client.query(`
      SELECT 
        email,
        email_confirmed_at IS NOT NULL as email_confirmed,
        encrypted_password IS NOT NULL as has_password
      FROM auth.users
      WHERE id = $1
    `, [userId]);

    if (finalCheck.rows.length > 0) {
      const row = finalCheck.rows[0];
      console.log('\n📊 Son Durum:');
      console.log(`   Email: ${row.email}`);
      console.log(`   Email Onaylı: ${row.email_confirmed ? 'Evet' : 'Hayır'}`);
      console.log(`   Şifre Var: ${row.has_password ? 'Evet' : 'Hayır'}`);
    }

    console.log('\n⚠️  NOT: Eğer hala giriş yapamıyorsanız:');
    console.log('1. Supabase Dashboard > Authentication > Users');
    console.log('2. emir@jobulai.com kullanıcısını bulun');
    console.log('3. "Reset Password" butonuna tıklayın');
    console.log('4. Ya da "Send Magic Link" ile giriş yapın');
    console.log('\nAlternatif: Service role key ile script çalıştırın:');
    console.log('1. Supabase Dashboard > Settings > API');
    console.log('2. "service_role" (secret) key\'i kopyalayın');
    console.log('3. .env.local dosyasına ekleyin: SUPABASE_SERVICE_ROLE_KEY=...');
    console.log('4. node create-emir-admin.js çalıştırın');

  } catch (e) {
    console.error('❌ Hata:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await client.end();
  }
}

fixPassword();
