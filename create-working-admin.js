/**
 * ÇALIŞAN Admin Kullanıcı Oluşturma Script'i
 * 
 * emir@jobulai.com - ADMIN rolünde kullanıcı oluşturur ve test eder
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL bulunamadı!');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY bulunamadı!');
  process.exit(1);
}

const { Client } = require('pg');

const email = 'emir@jobulai.com';
const password = 'emir123';
const fullName = 'Emir Taş';

async function deleteUser(userId) {
  const client = new Client({
    connectionString: 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    await client.query(`DELETE FROM public.profiles WHERE id = $1`, [userId]);
    await client.query(`DELETE FROM auth.users WHERE id = $1`, [userId]);
    return true;
  } catch (e) {
    return false;
  } finally {
    await client.end();
  }
}

async function createUser(userData) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
        },
        app_metadata: {
          role: userData.role,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

async function updateProfileRole(userId, role, fullName) {
  const client = new Client({
    connectionString: 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    
    const existingProfile = await client.query(`
      SELECT id FROM public.profiles WHERE id = $1
    `, [userId]);

    if (existingProfile.rows.length > 0) {
      await client.query(`
        UPDATE public.profiles
        SET full_name = $1, role = $2, updated_at = NOW()
        WHERE id = $3
      `, [fullName, role, userId]);
    } else {
      await client.query(`
        INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [userId, fullName, role]);
    }
  } finally {
    await client.end();
  }
}

async function testLogin(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Admin kullanıcı oluşturuluyor ve test ediliyor...\n');

  const userData = {
    email: email,
    password: password,
    full_name: fullName,
    role: 'ADMIN',
  };

  try {
    // Önce mevcut kullanıcıyı kontrol et ve sil
    console.log('🔍 Mevcut kullanıcı kontrol ediliyor...');
    const client = new Client({
      connectionString: 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres'
    });
    await client.connect();
    
    const existingUser = await client.query(`
      SELECT id FROM auth.users WHERE email = $1
    `, [email]);

    if (existingUser.rows.length > 0) {
      console.log('🗑️  Mevcut kullanıcı siliniyor...');
      await deleteUser(existingUser.rows[0].id);
      console.log('✅ Mevcut kullanıcı silindi\n');
    }
    
    await client.end();

    // Kullanıcıyı Supabase Auth API ile oluştur
    console.log(`📝 ${userData.email} oluşturuluyor...`);
    const user = await createUser(userData);
    console.log(`✅ Kullanıcı oluşturuldu (ID: ${user.id})\n`);

    // Profil rolünü güncelle
    console.log('👤 Profil güncelleniyor...');
    await updateProfileRole(user.id, userData.role, userData.full_name);
    console.log(`✅ Profil güncellendi (Rol: ${userData.role})\n`);

    // Kısa bir bekleme (veritabanı senkronizasyonu için)
    console.log('⏳ Veritabanı senkronizasyonu bekleniyor...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Giriş testi
    console.log('🧪 Giriş testi yapılıyor...');
    const loginTest = await testLogin(email, password);
    
    if (loginTest.success) {
      console.log('✅ GİRİŞ TESTİ BAŞARILI!');
      console.log(`   Access Token: ${loginTest.data.access_token.substring(0, 20)}...`);
      console.log(`   User ID: ${loginTest.data.user.id}`);
      console.log(`   Email: ${loginTest.data.user.email}`);
    } else {
      console.log('⚠️  Giriş testi başarısız:', loginTest.error);
      console.log('   Ancak kullanıcı oluşturuldu, manuel test edebilirsiniz.');
    }

    // Final kontrol
    console.log('\n📊 Final Kontrol:');
    const finalClient = new Client({
      connectionString: 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres'
    });
    await finalClient.connect();
    
    const finalCheck = await finalClient.query(`
      SELECT 
        u.id,
        u.email,
        u.email_confirmed_at IS NOT NULL as email_confirmed,
        p.full_name,
        p.role,
        u.raw_user_meta_data->>'role' as metadata_role
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      WHERE u.email = $1
    `, [email]);

    if (finalCheck.rows.length > 0) {
      const row = finalCheck.rows[0];
      console.log(`   ✅ Email: ${row.email}`);
      console.log(`   ✅ Email Onaylı: ${row.email_confirmed ? 'Evet' : 'Hayır'}`);
      console.log(`   ✅ Ad Soyad: ${row.full_name}`);
      console.log(`   ✅ Profil Rolü: ${row.role}`);
      console.log(`   ✅ Metadata Rolü: ${row.metadata_role}`);
    }
    
    await finalClient.end();

    console.log('\n✅ İŞLEM TAMAMLANDI!');
    console.log('\n📋 GİRİŞ BİLGİLERİ:');
    console.log(`   Email: ${email}`);
    console.log(`   Şifre: ${password}`);
    console.log(`   Rol: ADMIN`);
    console.log(`   Dashboard: /dashboard/admin`);
    console.log('\n🎉 Artık giriş yapabilirsiniz!');

  } catch (error) {
    console.error(`\n❌ HATA: ${error.message}`);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main().catch(console.error);
