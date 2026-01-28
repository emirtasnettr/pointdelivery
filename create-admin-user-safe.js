/**
 * Admin Kullanıcı Oluşturma Script'i (Supabase Auth API ile)
 * 
 * emir@jobulai.com - ADMIN rolünde kullanıcı oluşturur
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdHN6YWR6bHJubnRwdmRwYXVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDUyODU2MCwiZXhwIjoyMDUwMTA0NTYwfQ.7VqJ8K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K'; // Geçici - gerçek key gerekli

const { Client } = require('pg');

const email = 'emir@jobulai.com';
const password = 'emir123';
const fullName = 'Emir Taş';

async function createAdminUser() {
  const client = new Client({
    connectionString: 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔌 Veritabanına bağlandı\n');

    // Kullanıcı zaten var mı kontrol et
    const existingUser = await client.query(`
      SELECT id, email FROM auth.users WHERE email = $1
    `, [email]);

    let userId;

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Kullanıcı zaten mevcut, güncelleniyor...');
      userId = existingUser.rows[0].id;
    } else {
      // Supabase Auth API ile kullanıcı oluştur
      console.log('📝 Supabase Auth API ile kullanıcı oluşturuluyor...');
      
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              role: 'ADMIN'
            },
            app_metadata: {
              role: 'ADMIN'
            }
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `HTTP ${response.status}`);
        }

        const userData = await response.json();
        userId = userData.id;
        console.log('✅ Kullanıcı Supabase Auth ile oluşturuldu');
      } catch (apiError) {
        console.log('⚠️  Auth API hatası, direkt DB ile oluşturuluyor...');
        // Fallback: Direkt DB ile oluştur
        const uuidResult = await client.query('SELECT gen_random_uuid() as uuid');
        userId = uuidResult.rows[0].uuid;
        
        await client.query(`
          INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data, role
          ) VALUES (
            $1, '00000000-0000-0000-0000-000000000000', $2,
            crypt($3, gen_salt('bf')), NOW(), NOW(), NOW(),
            $4::jsonb, $5::jsonb, 'authenticated'
          )
        `, [
          userId,
          email,
          password,
          JSON.stringify({ full_name: fullName, role: 'ADMIN' }),
          JSON.stringify({ role: 'ADMIN' })
        ]);
        console.log('✅ Kullanıcı DB ile oluşturuldu');
      }
    }

    // Profil kontrolü ve güncelleme
    const existingProfile = await client.query(`
      SELECT id FROM public.profiles WHERE id = $1
    `, [userId]);

    if (existingProfile.rows.length > 0) {
      await client.query(`
        UPDATE public.profiles
        SET full_name = $1, role = 'ADMIN', updated_at = NOW()
        WHERE id = $2
      `, [fullName, userId]);
      console.log('✅ Profil güncellendi');
    } else {
      await client.query(`
        INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
        VALUES ($1, $2, 'ADMIN', NOW(), NOW())
      `, [userId, fullName]);
      console.log('✅ Profil oluşturuldu');
    }

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

    console.log('✅ Metadata güncellendi');

    // Kontrol
    const finalCheck = await client.query(`
      SELECT p.id, u.email, p.full_name, p.role, u.raw_user_meta_data->>'role' as metadata_role
      FROM public.profiles p
      JOIN auth.users u ON p.id = u.id
      WHERE u.email = $1
    `, [email]);

    console.log('\n📊 Son Durum:');
    if (finalCheck.rows.length > 0) {
      const row = finalCheck.rows[0];
      console.log(`   ✅ Email: ${row.email}`);
      console.log(`   ✅ Ad Soyad: ${row.full_name}`);
      console.log(`   ✅ Profil Rolü: ${row.role}`);
      console.log(`   ✅ Metadata Rolü: ${row.metadata_role}`);
    }

    console.log('\n✅ Admin kullanıcı hazır!');
    console.log('\n📋 Giriş Bilgileri:');
    console.log(`   Email: ${email}`);
    console.log(`   Şifre: ${password}`);
    console.log(`   Rol: ADMIN`);
    console.log(`   Yönlendirme: /dashboard/admin`);

  } catch (e) {
    console.error('❌ Hata:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await client.end();
  }
}

createAdminUser();
