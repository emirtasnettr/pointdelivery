/**
 * Test Kullanıcıları Oluşturma Script'i
 * 
 * Bu script, Supabase Admin API kullanarak test hesaplarını oluşturur.
 * 
 * Kullanım:
 * 1. Supabase Dashboard > Settings > API > service_role key'i kopyalayın
 * 2. .env.local dosyasına ekleyin: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 3. node create-test-users.js
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
  console.log('2. "service_role" key\'i kopyalayın');
  console.log('3. .env.local dosyasına ekleyin:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here');
  process.exit(1);
}

const testUsers = [
  {
    email: 'admin@test.com',
    password: 'admin123',
    full_name: 'Test Admin',
    role: 'ADMIN',
  },
  {
    email: 'consultant@test.com',
    password: 'consultant123',
    full_name: 'Test Consultant',
    role: 'CONSULTANT',
  },
];

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
        email_confirm: true, // Email'i otomatik onayla
        user_metadata: {
          full_name: userData.full_name,
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

async function updateProfileRole(userId, role) {
  const { Client } = require('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query(
      `UPDATE public.profiles SET role = $1, updated_at = NOW() WHERE id = $2`,
      [role, userId]
    );
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Test kullanıcıları oluşturuluyor...\n');

  for (const userData of testUsers) {
    try {
      console.log(`📝 ${userData.email} oluşturuluyor...`);
      
      // Kullanıcıyı oluştur
      const user = await createUser(userData);
      console.log(`✅ ${userData.email} oluşturuldu (ID: ${user.id})`);

      // Profil rolünü güncelle
      await updateProfileRole(user.id, userData.role);
      console.log(`✅ ${userData.email} rolü ${userData.role} olarak güncellendi\n`);

    } catch (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        console.log(`⚠️  ${userData.email} zaten mevcut, atlanıyor...`);
        
        // Mevcut kullanıcının rolünü güncelle
        try {
          const { Client } = require('pg');
          const client = new Client({
            connectionString: process.env.DATABASE_URL,
          });
          await client.connect();
          
          const result = await client.query(
            `SELECT id FROM auth.users WHERE email = $1`,
            [userData.email]
          );
          
          if (result.rows.length > 0) {
            await updateProfileRole(result.rows[0].id, userData.role);
            console.log(`✅ ${userData.email} rolü ${userData.role} olarak güncellendi\n`);
          }
          
          await client.end();
        } catch (updateError) {
          console.log(`⚠️  Rol güncellenemedi: ${updateError.message}\n`);
        }
      } else {
        console.error(`❌ ${userData.email} oluşturulamadı: ${error.message}\n`);
      }
    }
  }

  console.log('✅ İşlem tamamlandı!');
  console.log('\n📋 Test Hesapları:');
  testUsers.forEach(user => {
    console.log(`   ${user.email} / ${user.password} (${user.role})`);
  });
}

main().catch(console.error);
