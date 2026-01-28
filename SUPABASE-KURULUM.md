# 🗄️ Supabase Veritabanı Kurulum Rehberi

Bu rehber, adım adım Supabase'de veritabanınızı nasıl kuracağınızı gösterir.

---

## 📋 Gereksinimler

- ✅ Supabase hesabı (ücretsiz): [https://supabase.com](https://supabase.com)
- ✅ Bu rehberi yanınızda tutun

---

## 🚀 ADIM 1: Supabase Projesi Oluşturma

### 1.1. Supabase'e Giriş Yapın

1. [https://app.supabase.com](https://app.supabase.com) adresine gidin
2. Eğer hesabınız yoksa, **Sign Up** ile ücretsiz hesap oluşturun
3. Giriş yaptıktan sonra **Dashboard**'a yönlendirileceksiniz

### 1.2. Yeni Proje Oluşturun

1. **"New Project"** butonuna tıklayın (sağ üstte)
2. Proje bilgilerini doldurun:
   - **Name**: `jobul-ai` (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre oluşturun (kaydedin!)
   - **Region**: Size en yakın bölgeyi seçin (örn: `West US (N. California)`)
   - **Pricing Plan**: **Free** (başlangıç için yeterli)
3. **"Create new project"** butonuna tıklayın
4. ⏳ **2-3 dakika bekleyin** (proje oluşturuluyor...)

### 1.3. Proje Hazır Olduğunda

- Dashboard'a yönlendirileceksiniz
- Sol menüden farklı bölümlere erişebilirsiniz

---

## 🗄️ ADIM 2: SQL Editor'e Erişme

### 2.1. SQL Editor'ü Açın

1. Sol menüden **"SQL Editor"** sekmesine tıklayın
2. İlk kez kullanıyorsanız, hoş geldiniz ekranı göreceksiniz
3. **"New Query"** butonuna tıklayın (üstte)

---

## 📝 ADIM 3: SQL Şemasını Çalıştırma

### 3.1. SQL Dosyasını Açın

1. Projenizin kök dizinindeki **`supabase-schema.sql`** dosyasını açın
2. **Tüm içeriği kopyalayın** (Ctrl+A, Ctrl+C)

### 3.2. SQL Editor'e Yapıştırın

1. Supabase SQL Editor'deki boş alana **yapıştırın** (Ctrl+V)
2. SQL kodunun tamamını görmelisiniz

### 3.3. SQL'i Çalıştırın

1. Sağ alttaki **"Run"** butonuna tıklayın
   - Veya klavyede **`Ctrl + Enter`** tuşlarına basın

### 3.4. Sonucu Kontrol Edin

✅ **Başarılı mesajını görmelisiniz:**
```
Success. No rows returned
```

❌ **Eğer hata alırsanız:**
- Hata mesajını okuyun
- Genellikle şu sebeplerden olur:
  - Tablo zaten var (daha önce çalıştırmışsınız)
  - SQL syntax hatası
  - Yetki hatası

---

## ✅ ADIM 4: Tabloları Kontrol Etme

### 4.1. Table Editor'dan Kontrol

1. Sol menüden **"Table Editor"** sekmesine tıklayın
2. Şu tabloları görmelisiniz:
   - ✅ **profiles** - Kullanıcı profilleri
   - ✅ **candidate_info** - Aday bilgileri
   - ✅ **documents** - Belgeler

### 4.2. Tablo Yapısını İnceleyin

1. **profiles** tablosuna tıklayın
2. Kolonları göreceksiniz:
   - `id` (UUID)
   - `full_name` (Text)
   - `role` (Enum: CANDIDATE, MIDDLEMAN, CONSULTANT, ADMIN)
   - `middleman_id` (UUID, nullable)
   - `created_at`, `updated_at` (Timestamp)

---

## 🔐 ADIM 5: RLS (Row Level Security) Kontrolü

### 5.1. Authentication > Policies

1. Sol menüden **"Authentication"** > **"Policies"** sekmesine gidin
2. **profiles** tablosunu seçin
3. Şu politikaları görmelisiniz:
   - ✅ Kullanıcılar kendi profillerini görebilir
   - ✅ Kullanıcılar kendi profillerini oluşturabilir
   - ✅ Kullanıcılar kendi profillerini güncelleyebilir
   - ✅ Middleman'ler adaylarını görebilir
   - ✅ Consultant'lar tüm adayları görebilir
   - ✅ Admin'ler tüm profilleri görebilir

**Bu politikalar, kullanıcıların sadece yetkili oldukları verilere erişmesini sağlar.**

---

## 🎯 ADIM 6: Test Kullanıcısı Oluşturma (İsteğe Bağlı)

### 6.1. Authentication > Users

1. Sol menüden **"Authentication"** > **"Users"** sekmesine gidin
2. **"Add user"** butonuna tıklayın
3. Bilgileri doldurun:
   - **Email**: test@example.com
   - **Password**: Güçlü bir şifre
   - **Auto Confirm User**: ✅ (otomatik onayla)
4. **"Create user"** butonuna tıklayın

### 6.2. Profil Kontrolü

1. **Table Editor** > **profiles** tablosuna gidin
2. Yeni oluşturduğunuz kullanıcının profili otomatik oluşturulmuş olmalı ✅
   - **id**: Kullanıcı ID'si ile eşleşmeli
   - **role**: `CANDIDATE` (varsayılan)

---

## 🔍 ADIM 7: API Anahtarlarını Kaydetme

### 7.1. Settings > API

1. Sol menüden **"Settings"** (⚙️) > **"API"** sekmesine gidin
2. **İki önemli anahtarı** kopyalayın:

   **a) Project URL:**
   ```
   https://xxxxx.supabase.co
   ```
   - **"Project URL"** kısmından kopyalayın

   **b) anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - **"Project API keys"** bölümünden **"anon public"** anahtarını kopyalayın

### 7.2. Anahtarları Kaydedin

Bu anahtarları **güvenli bir yere** kaydedin. Sonraki adımda Next.js projenizde kullanacağız.

---

## ✅ TAMAMLANDI!

Artık Supabase veritabanınız hazır! 🎉

**Sonraki adım:** Next.js projesinde bu veritabanına bağlanacağız.

---

## 🐛 Sorun Giderme

### "relation already exists" hatası
- ✅ Normal! Tablolar zaten oluşturulmuş demektir
- Devam edebilirsiniz

### "permission denied" hatası
- ❌ Yetki sorunu var
- Projenin sahibi olduğunuzdan emin olun

### Tablolar görünmüyor
- Table Editor'da **refresh** yapın (F5)
- SQL Editor'de tekrar çalıştırın

---

## 📚 Ek Bilgiler

- **Enum Type**: `user_role` tipi oluşturuldu
- **Triggers**: Otomatik profil oluşturma ve `updated_at` güncelleme
- **RLS**: Her tablo için güvenlik politikaları aktif
- **Indexes**: Performans için index'ler eklendi

Sorularınız varsa sorun! 😊
