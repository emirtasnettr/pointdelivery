/**
 * Admin Kullanıcı Oluşturma Script'i
 * 
 * emir@jobulai.com - ADMIN rolünde kullanıcı oluşturur
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres'
});

async function createAdminUser() {
  try {
    await client.connect();
    console.log('🔌 Veritabanına bağlandı\n');

    const email = 'emir@jobulai.com';
    const password = 'emir123';
    const fullName = 'Emir Taş';

    // Kullanıcı zaten var mı kontrol et
    const existingUser = await client.query(`
      SELECT id, email FROM auth.users WHERE email = $1
    `, [email]);

    let userId;

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Kullanıcı zaten mevcut, güncelleniyor...');
      userId = existingUser.rows[0].id;
      
      // Şifreyi hash'le (Supabase format)
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Kullanıcıyı güncelle
      await client.query(`
        UPDATE auth.users
        SET 
          encrypted_password = crypt($1, gen_salt('bf')),
          updated_at = NOW()
        WHERE id = $2
      `, [password, userId]);
      
      console.log('✅ Kullanıcı şifresi güncellendi');
    } else {
      // Yeni kullanıcı oluştur
      console.log('📝 Yeni kullanıcı oluşturuluyor...');
      
      // UUID oluştur
      const uuidResult = await client.query('SELECT gen_random_uuid() as uuid');
      userId = uuidResult.rows[0].uuid;
      
      // Şifreyi hash'le
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Kullanıcıyı auth.users tablosuna ekle
      await client.query(`
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          created_at,
          updated_at,
          raw_user_meta_data,
          raw_app_meta_data,
          is_super_admin,
          role
        ) VALUES (
          $1,
          '00000000-0000-0000-0000-000000000000',
          $2,
          crypt($3, gen_salt('bf')),
          NOW(),
          NOW(),
          NOW(),
          $4::jsonb,
          $5::jsonb,
          false,
          'authenticated'
        )
      `, [
        userId,
        email,
        password,
        JSON.stringify({
          full_name: fullName,
          role: 'ADMIN'
        }),
        JSON.stringify({
          role: 'ADMIN'
        })
      ]);
      
      console.log('✅ Kullanıcı oluşturuldu');
    }

    // Profil kontrolü ve güncelleme
    const existingProfile = await client.query(`
      SELECT id FROM public.profiles WHERE id = $1
    `, [userId]);

    if (existingProfile.rows.length > 0) {
      // Profil güncelle
      await client.query(`
        UPDATE public.profiles
        SET 
          full_name = $1,
          role = 'ADMIN',
          updated_at = NOW()
        WHERE id = $2
      `, [fullName, userId]);
      console.log('✅ Profil güncellendi');
    } else {
      // Profil oluştur
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
      JSON.stringify({
        full_name: fullName,
        role: 'ADMIN'
      }),
      JSON.stringify({
        role: 'ADMIN'
      }),
      userId
    ]);

    console.log('✅ Metadata güncellendi');

    // Kontrol sorgusu
    const finalCheck = await client.query(`
      SELECT 
        p.id,
        u.email,
        p.full_name,
        p.role,
        u.raw_user_meta_data->>'role' as metadata_role
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

    console.log('\n✅ Admin kullanıcı başarıyla oluşturuldu!');
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
