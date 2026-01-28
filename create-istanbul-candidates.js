/**
 * İstanbul İlçelerine Aday Oluşturma Script'i
 * 
 * İstanbul'daki her ilçeye 5 onaylanmış aday oluşturur
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Hata: SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY environment variables gerekli');
  console.error('   .env.local dosyasını kontrol edin');
  process.exit(1);
}

// Supabase Admin Client (RLS'i bypass eder)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// İstanbul İlçeleri
const istanbulDistricts = [
  'Kadıköy',
  'Beşiktaş',
  'Şişli',
  'Beyoğlu',
  'Üsküdar',
  'Kartal',
  'Pendik',
  'Bakırköy',
  'Fatih',
  'Maltepe',
  'Ataşehir',
  'Beylikdüzü',
  'Büyükçekmece'
];

// Rastgele isimler (gerçek isimler)
const firstNames = ['Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'İsmail', 'Osman', 'Salih', 'Fatma', 'Ayşe', 'Hatice', 'Zeynep', 'Emine', 'Şule', 'Elif', 'Derya', 'Selma', 'Canan'];
const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek'];

// Rastgele telefon numarası oluştur
function generatePhone() {
  const areaCodes = ['532', '533', '534', '535', '536', '537', '538', '539'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${areaCode}${number}`;
}

// Rastgele email oluştur
function generateEmail(firstName, lastName, index) {
  const cleanFirstName = firstName.toLowerCase().replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  const cleanLastName = lastName.toLowerCase().replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  return `${cleanFirstName}.${cleanLastName}${index}@test.com`;
}

// Aday oluştur
async function createCandidate(district, index) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  const email = generateEmail(firstName, lastName, index);
  const password = 'Aday123!'; // Varsayılan şifre
  const phone = generatePhone();

  try {
    // 1. Auth kullanıcısı oluştur
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'CANDIDATE',
      },
    });

    if (authError || !authUser.user) {
      throw new Error(`Auth hatası: ${authError?.message || 'Kullanıcı oluşturulamadı'}`);
    }

    const userId = authUser.user.id;

    // 2. Trigger profile oluşturur, bekle
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 3. Profile'ı güncelle (eğer yoksa oluştur)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        role: 'CANDIDATE',
        application_status: 'APPROVED', // Onaylanmış aday
      }, { onConflict: 'id' });

    if (profileError) {
      // Profile yoksa manuel oluştur
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          role: 'CANDIDATE',
          application_status: 'APPROVED',
        });

      if (insertError) {
        throw new Error(`Profil hatası: ${insertError.message}`);
      }
    } else {
      // application_status'ü güncelle
      await supabaseAdmin
        .from('profiles')
        .update({ application_status: 'APPROVED' })
        .eq('id', userId);
    }

    // 4. candidate_info oluştur
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    const { error: candidateInfoError } = await supabaseAdmin
      .from('candidate_info')
      .upsert({
        profile_id: userId,
        email,
        phone,
        city: 'İstanbul',
        district: district,
      }, { onConflict: 'profile_id' });

    if (candidateInfoError) {
      console.warn(`⚠️  candidate_info hatası (${email}): ${candidateInfoError.message}`);
    }

    return { userId, email, fullName, district, success: true };
  } catch (error) {
    console.error(`❌ Aday oluşturma hatası (${district} - ${index}):`, error.message);
    return { district, index, error: error.message, success: false };
  }
}

// Ana fonksiyon
async function createIstanbulCandidates() {
  console.log('🚀 İstanbul Aday Oluşturma Script\'i Başlatılıyor...\n');
  console.log(`📋 İlçe Sayısı: ${istanbulDistricts.length}`);
  console.log(`📋 İlçe Başına Aday: 5`);
  console.log(`📋 Toplam Aday: ${istanbulDistricts.length * 5}\n`);

  const results = {
    success: [],
    failed: [],
  };

  for (const district of istanbulDistricts) {
    console.log(`\n📍 ${district} ilçesi için adaylar oluşturuluyor...`);
    
    for (let i = 1; i <= 5; i++) {
      const result = await createCandidate(district, i);
      
      if (result.success) {
        results.success.push(result);
        console.log(`   ✅ ${i}/5 - ${result.fullName} (${result.email})`);
      } else {
        results.failed.push(result);
        console.log(`   ❌ ${i}/5 - Başarısız: ${result.error}`);
      }

      // Rate limiting için kısa bekleme
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  // Özet
  console.log('\n' + '='.repeat(60));
  console.log('📊 ÖZET');
  console.log('='.repeat(60));
  console.log(`✅ Başarılı: ${results.success.length} aday`);
  console.log(`❌ Başarısız: ${results.failed.length} aday`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Başarısız Olanlar:');
    results.failed.forEach((fail) => {
      console.log(`   - ${fail.district} (${fail.index}): ${fail.error}`);
    });
  }

  console.log('\n📋 Başarıyla Oluşturulan Adaylar (İlçelere Göre):');
  const byDistrict = {};
  results.success.forEach((candidate) => {
    if (!byDistrict[candidate.district]) {
      byDistrict[candidate.district] = [];
    }
    byDistrict[candidate.district].push(candidate);
  });

  Object.keys(byDistrict).sort().forEach((district) => {
    console.log(`\n   ${district} (${byDistrict[district].length} aday):`);
    byDistrict[district].forEach((c) => {
      console.log(`      - ${c.fullName} (${c.email})`);
    });
  });

  console.log('\n✅ Script tamamlandı!');
  console.log('\n💡 Tüm adaylar için varsayılan şifre: Aday123!');
}

// Script'i çalıştır
createIstanbulCandidates().catch((error) => {
  console.error('❌ Kritik Hata:', error);
  process.exit(1);
});
