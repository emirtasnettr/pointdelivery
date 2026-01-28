/**
 * Admin Kullanıcı Oluşturma Script'i
 * 
 * emir@jobulai.com - ADMIN rolünde kullanıcı oluşturur
 * Supabase Auth Admin API kullanır
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
  console.log('\n📝 Lütfen şu adımları izleyin:');
  console.log('1. Supabase Dashboard > Settings > API');
  console.log('2. "service_role" (secret) key\'i kopyalayın');
  console.log('3. .env.local dosyasına ekleyin:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here');
  process.exit(1);
}

const { Client } = require('pg');

const email = 'emir@jobulai.com';
const password = 'emir123';
const fullName = 'Emir Taş';

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
    
    // Profil kontrolü ve güncelleme
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

async function main() {
  console.log('🚀 Admin kullanıcı oluşturuluyor...\n');

  const userData = {
    email: email,
    password: password,
    full_name: fullName,
    role: 'ADMIN',
  };

  try {
    console.log(`📝 ${userData.email} oluşturuluyor...`);
    
    // Kullanıcıyı oluştur
    const user = await createUser(userData);
    console.log(`✅ ${userData.email} oluşturuldu (ID: ${user.id})`);

    // Profil rolünü güncelle
    await updateProfileRole(user.id, userData.role, userData.full_name);
    console.log(`✅ ${userData.email} rolü ${userData.role} olarak güncellendi\n`);

    console.log('✅ İşlem tamamlandı!');
    console.log('\n📋 Giriş Bilgileri:');
    console.log(`   Email: ${email}`);
    console.log(`   Şifre: ${password}`);
    console.log(`   Rol: ADMIN`);
    console.log(`   Yönlendirme: /dashboard/admin`);

  } catch (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists') || error.message.includes('User already registered')) {
      console.log(`⚠️  ${userData.email} zaten mevcut, güncelleniyor...`);
      
      // Mevcut kullanıcının ID'sini al ve rolünü güncelle
      try {
        const client = new Client({
          connectionString: 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres'
        });
        await client.connect();
        
        const result = await client.query(
          `SELECT id FROM auth.users WHERE email = $1`,
          [userData.email]
        );
        
        if (result.rows.length > 0) {
          const userId = result.rows[0].id;
          
          // Profil güncelle
          await updateProfileRole(userId, userData.role, userData.full_name);
          
          // Metadata güncelle
          await client.query(`
            UPDATE auth.users
            SET 
              raw_user_meta_data = $1::jsonb,
              raw_app_meta_data = $2::jsonb,
              updated_at = NOW()
            WHERE id = $3
          `, [
            JSON.stringify({ full_name: fullName, role: 'ADMIN' }),
            JSON.stringify({ role: 'ADMIN' }),
            userId
          ]);
          
          console.log(`✅ ${userData.email} rolü ${userData.role} olarak güncellendi\n`);
          
          console.log('✅ İşlem tamamlandı!');
          console.log('\n📋 Giriş Bilgileri:');
          console.log(`   Email: ${email}`);
          console.log(`   Şifre: ${password}`);
          console.log(`   Rol: ADMIN`);
          console.log(`   Yönlendirme: /dashboard/admin`);
        }
        
        await client.end();
      } catch (updateError) {
        console.error(`❌ Güncelleme hatası: ${updateError.message}\n`);
      }
    } else {
      console.error(`❌ ${userData.email} oluşturulamadı: ${error.message}\n`);
    }
  }
}

main().catch(console.error);
