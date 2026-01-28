# Admin Kullanıcı Oluşturma Rehberi

## Sorun: "Invalid login credentials" Hatası

Eğer `emir@jobulai.com` ile giriş yaparken "Invalid login credentials" hatası alıyorsanız, şifre hash formatı sorunlu olabilir. Bu durumda Supabase Auth Admin API kullanarak kullanıcıyı doğru şekilde oluşturmanız gerekiyor.

## Çözüm 1: Service Role Key ile Script Çalıştırma (ÖNERİLEN)

### Adım 1: Service Role Key'i Alın

1. [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
2. Projenizi seçin
3. **Settings** > **API** sekmesine gidin
4. **"service_role" (secret)** key'ini kopyalayın
   - ⚠️ **ÖNEMLİ:** Bu key'i asla public repository'lere commit etmeyin!

### Adım 2: .env.local Dosyasına Ekleyin

`.env.local` dosyanıza şu satırı ekleyin:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Adım 3: Script'i Çalıştırın

```bash
node create-emir-admin-final.js
```

Bu script:
- Mevcut kullanıcıyı siler (varsa)
- Supabase Auth Admin API ile yeni kullanıcı oluşturur
- Şifreyi doğru formatta hash'ler
- Profil ve metadata'yı günceller

## Çözüm 2: Supabase Dashboard'dan Manuel Oluşturma

### Adım 1: Kullanıcıyı Oluşturun

1. [Supabase Dashboard](https://supabase.com/dashboard) > **Authentication** > **Users**
2. **"Add user"** butonuna tıklayın
3. **Email:** `emir@jobulai.com`
4. **Password:** `emir123`
5. **Auto Confirm User:** ✅ İşaretleyin
6. **"Create user"** butonuna tıklayın

### Adım 2: Profil ve Rolü Güncelleyin

1. Oluşturulan kullanıcıya tıklayın
2. **"User Metadata"** sekmesine gidin
3. Şu JSON'ı ekleyin:

```json
{
  "full_name": "Emir Taş",
  "role": "ADMIN"
}
```

4. **"App Metadata"** sekmesine gidin
5. Şu JSON'ı ekleyin:

```json
{
  "role": "ADMIN"
}
```

6. **"Save"** butonuna tıklayın

### Adım 3: Profil Tablosunu Güncelleyin

SQL Editor'de şu sorguyu çalıştırın:

```sql
UPDATE public.profiles
SET 
  full_name = 'Emir Taş',
  role = 'ADMIN',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'emir@jobulai.com'
);
```

Eğer profil yoksa:

```sql
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT 
  id,
  'Emir Taş',
  'ADMIN',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'emir@jobulai.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Emir Taş',
  role = 'ADMIN',
  updated_at = NOW();
```

## Çözüm 3: Şifreyi Sıfırlama

Eğer kullanıcı zaten varsa ama şifre çalışmıyorsa:

1. [Supabase Dashboard](https://supabase.com/dashboard) > **Authentication** > **Users**
2. `emir@jobulai.com` kullanıcısını bulun
3. Kullanıcıya tıklayın
4. **"Reset Password"** butonuna tıklayın
5. Yeni şifreyi belirleyin: `emir123`

## Test Etme

1. Giriş sayfasına gidin: `/auth/login`
2. **Email:** `emir@jobulai.com`
3. **Şifre:** `emir123`
4. Giriş yaptıktan sonra `/dashboard/admin` sayfasına yönlendirilmelisiniz

## Sorun Giderme

### Hala "Invalid login credentials" hatası alıyorsanız:

1. **Email onaylı mı kontrol edin:**
   ```sql
   SELECT email, email_confirmed_at FROM auth.users WHERE email = 'emir@jobulai.com';
   ```
   Eğer `email_confirmed_at` NULL ise, Supabase Dashboard'dan kullanıcıyı onaylayın.

2. **Şifre hash formatını kontrol edin:**
   ```sql
   SELECT encrypted_password FROM auth.users WHERE email = 'emir@jobulai.com';
   ```
   Şifre hash'i `$2a$` veya `$2b$` ile başlamalı.

3. **Service role key doğru mu kontrol edin:**
   - `.env.local` dosyasında `SUPABASE_SERVICE_ROLE_KEY` var mı?
   - Key doğru kopyalandı mı? (Başında/sonunda boşluk olmamalı)

## İletişim

Sorun devam ederse, lütfen şu bilgileri paylaşın:
- Hata mesajı
- Kullanıcı durumu (email_confirmed_at, encrypted_password formatı)
- Service role key eklediniz mi?
