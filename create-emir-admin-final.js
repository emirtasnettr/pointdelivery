/**
 * Emir Admin Kullanıcı Oluşturma Script'i (Final)
 * 
 * Supabase Auth Admin API kullanarak emir@jobulai.com kullanıcısını oluşturur
 * 
 * KULLANIM:
 * 1. Supabase Dashboard > Settings > API
 * 2. "service_role" (secret) key'i kopyalayın
 * 3. .env.local dosyasına ekleyin: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 4. node create-emir-admin-final.js
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
  console.log('1. Supabase Dashboard\'a gidin: https://supabase.com/dashboard');
  console.log('2. Projenizi seçin');
  console.log('3. Settings > API sekmesine gidin');
  console.log('4. "service_role" (secret) key\'i kopyalayın');
  console.log('5. .env.local dosyasına ekleyin:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here');
  console.log('\n⚠️  Service role key\'i asla public repository\'lere commit etmeyin!');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const email = 'emir@jobulai.com';
const password = 'emir123';
const fullName = 'Emir Taş';

// Supabase Admin Client (Service Role Key ile)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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
  // Profil kontrolü
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    // Profil güncelle
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Profil güncellenemedi: ${error.message}`);
    }
  } else {
    // Yeni profil oluştur
    const { error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Profil oluşturulamadı: ${error.message}`);
    }
  }
}

async function deleteExistingUser(email) {
  try {
    // Kullanıcıyı bul
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.users.find(u => u.email === email);
    
    if (user) {
      // Profili sil
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      // Kullanıcıyı sil
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      console.log('✅ Mevcut kullanıcı silindi');
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('⚠️  Kullanıcı silinirken hata:', e.message);
    return false;
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
    // Önce mevcut kullanıcıyı sil
    console.log(`🗑️  Mevcut kullanıcı kontrol ediliyor...`);
    await deleteExistingUser(email);
    
    console.log(`📝 ${userData.email} oluşturuluyor...`);
    
    // Kullanıcıyı Supabase Auth API ile oluştur
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
    console.log('\n🎉 Artık giriş yapabilirsiniz!');

  } catch (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists') || error.message.includes('User already registered')) {
      console.log(`⚠️  ${userData.email} zaten mevcut, güncelleniyor...`);
      
      // Mevcut kullanıcının ID'sini al ve rolünü güncelle
      try {
        // Kullanıcıyı bul
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          throw listError;
        }

        const user = users.users.find(u => u.email === userData.email);
        
        if (user) {
          // Profil güncelle
          await updateProfileRole(user.id, userData.role, userData.full_name);
          
          // Metadata güncelle
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
          
          console.log(`✅ ${userData.email} rolü ${userData.role} olarak güncellendi\n`);
          
          console.log('✅ İşlem tamamlandı!');
          console.log('\n📋 Giriş Bilgileri:');
          console.log(`   Email: ${email}`);
          console.log(`   Şifre: ${password}`);
          console.log(`   Rol: ADMIN`);
          console.log(`   Yönlendirme: /dashboard/admin`);
          console.log('\n⚠️  NOT: Şifre hash formatı sorunlu olabilir.');
          console.log('   Supabase Dashboard\'dan şifreyi sıfırlamayı deneyin:');
          console.log('   1. Supabase Dashboard > Authentication > Users');
          console.log('   2. emir@jobulai.com kullanıcısını bulun');
          console.log('   3. "Reset Password" butonuna tıklayın');
        }
      } catch (updateError) {
        console.error(`❌ Güncelleme hatası: ${updateError.message}\n`);
      }
    } else {
      console.error(`❌ ${userData.email} oluşturulamadı: ${error.message}\n`);
    }
  }
}

main().catch(console.error);
