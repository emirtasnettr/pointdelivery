const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection string
const connectionString = 'postgresql://postgres:OjtdNIZWUL25QXOn@db.sktszadzlrnntpvdpauj.supabase.co:5432/postgres';

// SQL schema dosyasını oku
const schemaPath = path.join(__dirname, 'supabase-schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('🔌 Veritabanına bağlanılıyor...');
    await client.connect();
    console.log('✅ Bağlantı başarılı!');

    console.log('📝 SQL şeması çalıştırılıyor...');
    await client.query(sql);
    console.log('✅ Veritabanı şeması başarıyla oluşturuldu!');

    // Tabloları kontrol et
    console.log('\n📊 Oluşturulan tablolar kontrol ediliyor...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n✅ Oluşturulan tablolar:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Enum tiplerini kontrol et
    const enumResult = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    `);

    if (enumResult.rows.length > 0) {
      console.log('\n✅ Oluşturulan enum tipleri:');
      enumResult.rows.forEach(row => {
        console.log(`   - ${row.typname}`);
      });
    }

    console.log('\n🎉 Veritabanı kurulumu tamamlandı!');
    console.log('\n⚠️  ÖNEMLİ: Supabase Dashboard > Settings > API bölümünden');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY değerini alıp .env.local dosyasına ekleyin!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.code === '42P07') {
      console.log('\n⚠️  Bazı tablolar zaten mevcut. Bu normal olabilir.');
      console.log('   Devam etmek için mevcut tabloları silip tekrar deneyebilirsiniz.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
