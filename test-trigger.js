const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres'
});

async function testTrigger() {
  try {
    await client.connect();
    
    // Son oluşturulan kullanıcıları kontrol et
    const users = await client.query(`
      SELECT id, email, created_at, raw_user_meta_data
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    
    console.log('Son oluşturulan kullanıcılar:');
    users.rows.forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.email} (${user.id})`);
      console.log(`   Metadata:`, user.raw_user_meta_data);
      console.log(`   Oluşturulma: ${user.created_at}`);
    });
    
    // Bu kullanıcıların profillerini kontrol et
    console.log('\n\nProfil durumu:');
    for (const user of users.rows) {
      const profile = await client.query(`
        SELECT id, full_name, role, created_at
        FROM public.profiles
        WHERE id = $1;
      `, [user.id]);
      
      if (profile.rows.length > 0) {
        console.log(`✅ ${user.email}: Profil mevcut - ${profile.rows[0].full_name} (${profile.rows[0].role})`);
      } else {
        console.log(`❌ ${user.email}: Profil YOK!`);
      }
    }
    
  } catch (e) {
    console.error('Hata:', e.message);
  } finally {
    await client.end();
  }
}

testTrigger();
