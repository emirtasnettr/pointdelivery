# 🔧 "Bucket not found" Hatası Çözümü

## Sorun
Aday belge yüklerken **"Dosya yüklenirken hata: Bucket not found"** hatası alınıyor.

## Sebep
Supabase Storage'da `documents` adında bucket oluşturulmamış.

## Çözüm

### Yöntem 1: SQL Script ile (ÖNERİLEN)

1. **Supabase Dashboard**'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **SQL Editor**'e tıklayın
4. **New Query** butonuna tıklayın
5. `create-documents-bucket-complete.sql` dosyasını açın ve **tüm içeriği kopyalayın**
6. SQL Editor'e **yapıştırın**
7. **Run** butonuna tıklayın (veya `Ctrl+Enter` / `Cmd+Enter`)

✅ **Başarılı mesajını görmelisiniz!**

### Yöntem 2: Dashboard Üzerinden (Manuel)

1. **Supabase Dashboard** → **Storage** sekmesine gidin
2. **"New bucket"** butonuna tıklayın
3. Bucket bilgilerini doldurun:
   - **Name**: `documents` (tam olarak bu isim olmalı!)
   - **Public bucket**: ❌ **KAPALI** (güvenlik için)
   - **File size limit**: `50` MB
   - **Allowed MIME types**: (isteğe bağlı) `application/pdf,image/*,.doc,.docx`
4. **"Create bucket"** butonuna tıklayın
5. **RLS politikalarını eklemek için** `storage-rls-policies-only.sql` dosyasını SQL Editor'de çalıştırın

## Kontrol

Bucket'ın oluşturulduğunu kontrol etmek için:

1. **Storage** sekmesine gidin
2. **"documents"** bucket'ını görmelisiniz
3. Bucket'ın **Private** (kilit ikonu) olduğunu kontrol edin

## Test

1. Bir aday hesabıyla giriş yapın
2. Belge yükleme sayfasına gidin
3. Bir dosya seçin ve yükleyin
4. ✅ Artık hata almamalısınız!

## Notlar

- Bucket adı **tam olarak** `documents` olmalı (büyük/küçük harf duyarlı)
- Bucket **private** olmalı (güvenlik için)
- RLS politikaları olmadan bucket oluşturulursa, kullanıcılar dosya yükleyemez
- Dosya yolu formatı: `{user-id}/{filename}` olmalı (örnek: `123e4567-e89b-12d3-a456-426614174000/1234567890.pdf`)
