# Test Hesaplarını Manuel Oluşturma

## Adım 1: Supabase Dashboard'dan Kullanıcıları Oluşturun

1. **Supabase Dashboard**'a gidin: https://app.supabase.com
2. Projenizi seçin (`sktszadzlrnntpvdpauj`)
3. Sol menüden **Authentication** > **Users** sekmesine gidin
4. **"Add user"** butonuna tıklayın

### Admin Hesabı:
- **Email**: `admin@test.com`
- **Password**: `admin123`
- **Auto Confirm User**: ✅ **İşaretleyin** (önemli!)
- **Send Invite Email**: ❌ **İşaretsiz bırakın**
- **"Create user"** butonuna tıklayın

### Consultant Hesabı:
- **Email**: `consultant@test.com`
- **Password**: `consultant123`
- **Auto Confirm User**: ✅ **İşaretleyin** (önemli!)
- **Send Invite Email**: ❌ **İşaretsiz bırakın**
- **"Create user"** butonuna tıklayın

## Adım 2: Rolleri Güncelleyin

1. **SQL Editor**'e gidin → **New Query**
2. Aşağıdaki SQL'i çalıştırın:

```sql
-- Admin hesabını güncelle
UPDATE public.profiles
SET 
  role = 'ADMIN',
  full_name = 'Test Admin',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);

-- Consultant hesabını güncelle
UPDATE public.profiles
SET 
  role = 'CONSULTANT',
  full_name = 'Test Consultant',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'consultant@test.com'
);

-- Kontrol sorgusu
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('admin@test.com', 'consultant@test.com')
ORDER BY p.role;
```

3. **"Run"** butonuna tıklayın
4. Sonuçları kontrol edin - her iki kullanıcının da rolü güncellenmiş olmalı

## Adım 3: Test Edin

1. Uygulamanızda **Login** sayfasına gidin: http://localhost:3000/auth/login
2. **admin@test.com** / **admin123** ile giriş yapın
3. Başarılı olmalı! ✅
