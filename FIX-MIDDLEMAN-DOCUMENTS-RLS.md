# 🔒 Middleman Belgeleri İçin RLS Politikaları

## Sorun
Middleman'ler kendi eklediği adayların belgelerini göremiyordu. API route'ları ile bypass yapılmıştı ama bu güvenlik açığı riski taşıyordu.

## Çözüm
RLS (Row Level Security) politikalarını düzeltip API route'larını kaldırdık. Artık güvenlik veritabanı seviyesinde sağlanıyor.

## Adımlar

### 1. RLS Politikalarını Uygula

Supabase Dashboard → **SQL Editor** → **New Query**

`fix-middleman-documents-rls-complete.sql` dosyasının **tüm içeriğini** kopyalayıp SQL Editor'e yapıştırın ve **Run** butonuna tıklayın.

Bu script şunları yapar:
- ✅ Middleman'lerin kendi adaylarının belgelerini görebilmesi için `documents` tablosu RLS politikaları
- ✅ Middleman'lerin kendi adaylarının storage dosyalarını görebilmesi için `storage.objects` RLS politikaları
- ✅ INSERT, UPDATE, DELETE işlemleri için de politikalar

### 2. Politikaları Kontrol Et

SQL Editor'de şu sorguyu çalıştırarak politikaların oluşturulduğunu kontrol edin:

```sql
-- Documents tablosu politikalarını kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'documents' 
AND policyname LIKE '%Middleman%';

-- Storage politikalarını kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%Middleman%';
```

### 3. Test Et

1. Middleman hesabıyla giriş yapın
2. Kendi eklediğiniz bir adayın detay sayfasına gidin
3. Adayın yüklediği belgeleri görebilmelisiniz
4. Belge adına tıklayarak belgeyi görüntüleyebilmelisiniz

## Güvenlik

Artık güvenlik **veritabanı seviyesinde** sağlanıyor:

- ✅ Middleman sadece `middleman_id = auth.uid()` olan adayların belgelerini görebilir
- ✅ Storage'da da aynı kontrol yapılıyor (signed URL için)
- ✅ API route'ları kaldırıldı, service role key kullanımı azaldı
- ✅ RLS politikaları her zaman aktif, kod hatası olsa bile koruma devam eder

## Notlar

- RLS politikaları Supabase'de aktif olmalı (`ALTER TABLE documents ENABLE ROW LEVEL SECURITY;`)
- Storage bucket'ı private olmalı (`public = false`)
- Politikalar her iki seviyede de (documents tablosu + storage) çalışmalı

## Sorun Giderme

Eğer belgeler hala görünmüyorsa:

1. **RLS aktif mi kontrol edin:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'documents';
   ```
   `rowsecurity = true` olmalı.

2. **Politikaların doğru çalıştığını test edin:**
   ```sql
   -- Middleman olarak giriş yapıp test edin
   SET ROLE authenticated;
   SET request.jwt.claim.sub = 'MIDDLEMAN_USER_ID';
   SELECT * FROM documents WHERE profile_id = 'CANDIDATE_ID';
   ```

3. **Storage politikalarını kontrol edin:**
   - Supabase Dashboard → Storage → Policies
   - "Middleman kendi adaylarının belgelerini görebilir" politikası aktif olmalı
