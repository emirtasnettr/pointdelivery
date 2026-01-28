# 🔧 Test Hesapları Oluşturma - Adım Adım Rehber

"Invalid login credentials" hatası alıyorsanız, bu rehberi takip edin.

---

## ✅ ADIM 1: Kullanıcıların Oluşturulup Oluşturulmadığını Kontrol Edin

1. **Supabase SQL Editor**'e gidin → **New Query**
2. `check-test-accounts.sql` dosyasını açın
3. İçeriği kopyalayıp SQL Editor'e yapıştırın
4. **"Run"** butonuna tıklayın

**Sonuç kontrolü:**
- ✅ Eğer kullanıcılar görünüyorsa → ADIM 2'ye geçin
- ❌ Eğer boş sonuç alıyorsanız → ADIM 1.1'e geçin

---

## 📝 ADIM 1.1: Kullanıcıları Dashboard'dan Oluşturun

### CONSULTANT Hesabı:

1. **Supabase Dashboard** → **Authentication** → **Users** sekmesine gidin
2. **"Add user"** (veya **"Invite user"**) butonuna tıklayın
3. **Manuel User Creation** sekmesini seçin
4. Bilgileri doldurun:
   - **Email**: `consultant@test.com`
   - **Password**: `consultant123` (veya istediğiniz şifre)
   - **Auto Confirm User**: ✅ **İşaretleyin** (önemli!)
   - **Send Invite Email**: ❌ **İşaretsiz bırakın** (test için gerekli değil)
5. **"Create user"** butonuna tıklayın

### ADMIN Hesabı:

1. Tekrar **"Add user"** butonuna tıklayın
2. Bilgileri doldurun:
   - **Email**: `admin@test.com`
   - **Password**: `admin123` (veya istediğiniz şifre)
   - **Auto Confirm User**: ✅ **İşaretleyin** (önemli!)
   - **Send Invite Email**: ❌ **İşaretsiz bırakın**
3. **"Create user"** butonuna tıklayın

---

## ✅ ADIM 2: Profillerin Oluşturulup Oluşturulmadığını Kontrol Edin

1. `check-test-accounts.sql` script'ini tekrar çalıştırın
2. **"Profiles tablosunda profilleri kontrol et"** sorgusunun sonucunu kontrol edin

**Sonuç kontrolü:**
- ✅ Eğer profiller görünüyorsa → ADIM 3'e geçin
- ❌ Eğer profiller yoksa → ADIM 2.1'e geçin

---

## 🔧 ADIM 2.1: Eksik Profilleri Oluşturun

1. **SQL Editor** → **New Query**
2. `fix-missing-profiles.sql` dosyasını açın
3. İçeriği kopyalayıp SQL Editor'e yapıştırın
4. **"Run"** butonuna tıklayın
5. `check-test-accounts.sql` script'ini tekrar çalıştırarak kontrol edin

---

## ✅ ADIM 3: Rolleri Güncelleyin

1. **SQL Editor** → **New Query**
2. `update-test-accounts.sql` dosyasını açın
3. İçeriği kopyalayıp SQL Editor'e yapıştırın
4. **"Run"** butonuna tıklayın

---

## 🧪 ADIM 4: Giriş Yapmayı Deneyin

1. Uygulamanızda **`/auth/login`** sayfasına gidin
2. Şunları deneyin:
   - **Email**: `consultant@test.com`
   - **Password**: `consultant123`
3. **"Giriş Yap"** butonuna tıklayın

**Beklenen sonuç:**
- ✅ Consultant Dashboard'a yönlendirilmelisiniz (`/dashboard/consultant`)

---

## ❌ Hala "Invalid login credentials" Hatası Alıyorsanız

### Olası nedenler:

1. **Email veya şifre yanlış**
   - Dashboard'dan kullanıcıyı kontrol edin
   - Şifreyi sıfırlamayı deneyin: **Users** → Kullanıcı → **"Reset password"**

2. **Kullanıcı onaylanmamış**
   - Dashboard'dan kullanıcıyı kontrol edin
   - `email_confirmed_at` değeri NULL olmamalı
   - Eğer NULL ise, kullanıcıyı silip tekrar oluşturun (Auto Confirm işaretli)

3. **Profil kaydı yok veya rol yanlış**
   - `check-test-accounts.sql` script'ini çalıştırın
   - Profil yoksa `fix-missing-profiles.sql` script'ini çalıştırın
   - Rol yanlışsa `update-test-accounts.sql` script'ini çalıştırın

4. **Trigger çalışmamış**
   - `fix-missing-profiles.sql` script'ini çalıştırarak manuel oluşturun

---

## 🔍 Debug Sorguları

### Kullanıcı var mı kontrol et:
```sql
SELECT email, email_confirmed_at FROM auth.users 
WHERE email IN ('consultant@test.com', 'admin@test.com');
```

### Profil var mı kontrol et:
```sql
SELECT p.role, u.email FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('consultant@test.com', 'admin@test.com');
```

### Tüm kullanıcıları listele:
```sql
SELECT email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;
```

---

## ✅ Başarılı Kurulum Sonrası

Test hesapları başarıyla oluşturulduysa:
- ✅ `/auth/login` sayfasından giriş yapabilmelisiniz
- ✅ Consultant hesabı → `/dashboard/consultant`
- ✅ Admin hesabı → `/dashboard/admin`

---

Sorularınız varsa sorun! 😊
