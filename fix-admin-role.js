/**
 * Admin Kullanıcı Rolünü Düzeltme Script'i
 * 
 * admin@test.com kullanıcısının rolünü metadata'ya ekler
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

const { createClient } = require('@supabase/supabase-js');

const email = 'admin@test.com';
const fullName = 'Test Admin';

// Supabase Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixAdminRole() {
  console.log('🔧 Admin kullanıcı rolü düzeltiliyor...\n');

  try {
    // Kullanıcıyı bul
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ ${email} kullanıcısı bulunamadı!`);
      console.log('\n📝 Lütfen önce kullanıcıyı oluşturun:');
      console.log('1. Supabase Dashboard > Authentication > Users');
      console.log('2. "Add user" butonuna tıklayın');
      console.log(`3. Email: ${email}`);
      console.log('4. Password: admin123');
      console.log('5. Auto Confirm User: ✅');
      process.exit(1);
    }

    console.log(`✅ Kullanıcı bulundu: ${user.email} (ID: ${user.id})`);

    // Metadata'yı güncelle
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          full_name: fullName,
          role: 'ADMIN',
        },
        app_metadata: {
          role: 'ADMIN',
        },
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Metadata güncellendi');

    // Profil rolünü güncelle
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          role: 'ADMIN',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }
      console.log('✅ Profil güncellendi');
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          role: 'ADMIN',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }
      console.log('✅ Profil oluşturuldu');
    }

    console.log('\n✅ İşlem tamamlandı!');
    console.log('\n📋 Güncellenen Bilgiler:');
    console.log(`   Email: ${email}`);
    console.log(`   Rol: ADMIN`);
    console.log(`   Metadata: user_metadata.role = ADMIN`);
    console.log(`   Metadata: app_metadata.role = ADMIN`);
    console.log(`   Profil: role = ADMIN`);
    console.log('\n🎉 Artık giriş yapabilirsiniz!');

  } catch (error) {
    console.error(`❌ Hata: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

fixAdminRole().catch(console.error);
