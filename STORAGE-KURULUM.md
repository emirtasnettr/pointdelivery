# 📦 Supabase Storage Kurulum Rehberi

Bu rehber, belge yükleme sistemi için Supabase Storage bucket'ını nasıl oluşturacağınızı gösterir.

---

## 🎯 ADIM 1: Storage Bucket'ını Oluşturma

### Yöntem 1: Dashboard Üzerinden (ÖNERİLEN)

1. **Supabase Dashboard** → **Storage** sekmesine gidin
2. **"New bucket"** butonuna tıklayın
3. Bucket bilgilerini doldurun:
   - **Name**: `documents`
   - **Public bucket**: ❌ **KAPALI** (güvenlik için)
   - **File size limit**: `50` MB (veya istediğiniz limit)
   - **Allowed MIME types**: (isteğe bağlı) `application/pdf,image/*,.doc,.docx`
4. **"Create bucket"** butonuna tıklayın

### Yöntem 2: SQL ile

Eğer SQL ile yapmak isterseniz, `supabase-storage-setup.sql` dosyasını kullanabilirsiniz.

**⚠️ NOT:** SQL ile bucket oluşturmak için Service Role Key gerekebilir.

---

## 🔐 ADIM 2: RLS Politikalarını Ekleme

### 2.1. SQL Editor'e Gidin

1. Supabase Dashboard → **SQL Editor**
2. **New Query** butonuna tıklayın

### 2.2. RLS Politikalarını Ekleyin

**⚠️ ÖNEMLİ:** `storage-rls-policies-only.sql` dosyasını kullanın! (Sadece RLS politikaları içerir)

1. `storage-rls-policies-only.sql` dosyasını açın
2. **Tüm içeriği kopyalayın**
3. SQL Editor'e **yapıştırın**
4. **"Run"** butonuna tıklayın

**✅ Başarılı mesajını görmelisiniz:**

```sql
-- Kullanıcılar kendi belgelerini yükleyebilir
CREATE POLICY "Kullanıcılar kendi belgelerini yükleyebilir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Kullanıcılar kendi belgelerini görebilir
CREATE POLICY "Kullanıcılar kendi belgelerini görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Kullanıcılar kendi belgelerini silebilir
CREATE POLICY "Kullanıcılar kendi belgelerini silebilir"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Consultant ve Admin tüm belgeleri görebilir
CREATE POLICY "Consultant ve Admin belgeleri görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('CONSULTANT', 'ADMIN')
  )
);
```

---

## ✅ ADIM 3: Test Etme

1. **Next.js uygulamanızda** `/documents/upload` sayfasına gidin
2. Bir belge seçin ve yükleyin
3. **Supabase Dashboard** → **Storage** → **documents** bucket'ına gidin
4. Yüklenen dosyayı görmelisiniz ✅

---

## 📁 Dosya Yapısı

Storage'da dosyalar şu yapıda saklanır:
```
documents/
  └── {user-id}/
      └── {timestamp}.{extension}
```

**Örnek:**
```
documents/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 1701234567890.pdf
```

---

## 🔒 Güvenlik Notları

- ✅ Bucket **private** olmalı (public değil)
- ✅ Her kullanıcı sadece kendi klasörüne yazabilir
- ✅ Consultant ve Admin tüm dosyaları görebilir
- ✅ Dosya boyutu limiti ayarlanmalı (50MB önerilir)

---

## 🐛 Sorun Giderme

### "Bucket not found" hatası
- ✅ Bucket'ın adının `documents` olduğundan emin olun
- ✅ RLS politikalarını kontrol edin

### "Access denied" hatası
- ✅ RLS politikalarının doğru çalıştığından emin olun
- ✅ Kullanıcının giriş yaptığından emin olun

### Dosya yüklenmiyor
- ✅ Dosya boyutu limitini kontrol edin
- ✅ MIME type kontrolü yapılıyorsa, izin verilen tipleri kontrol edin

---

## 📚 Sonraki Adımlar

Bucket oluşturulduktan sonra:
1. ✅ Belge yükleme sayfası çalışacak (`/documents/upload`)
2. ✅ Belgeler Storage'da saklanacak
3. ✅ Documents tablosuna kayıt eklenecek

Sorularınız varsa sorun! 😊
