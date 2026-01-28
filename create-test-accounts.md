# 🧪 Test Hesapları Oluşturma Rehberi

Bu rehber, test için CONSULTANT ve ADMIN hesapları oluşturmayı gösterir.

---

## 🎯 YÖNTEM 1: Supabase Dashboard + SQL (ÖNERİLEN)

### ADIM 1: Kullanıcıları Dashboard'dan Oluştur

1. **Supabase Dashboard** → **Authentication** → **Users** sekmesine gidin
2. **"Add user"** butonuna tıklayın (veya **"Invite user"**)
3. **Kullanıcı 1 - CONSULTANT:**
   - **Email**: `consultant@test.com`
   - **Password**: `consultant123` (veya istediğiniz şifre)
   - **Email Confirm**: ✅ **İşaretleyin** (otomatik onaylansın)
   - **"Create user"** butonuna tıklayın

4. **Kullanıcı 2 - ADMIN:**
   - **Email**: `admin@test.com`
   - **Password**: `admin123` (veya istediğiniz şifre)
   - **Email Confirm**: ✅ **İşaretleyin** (otomatik onaylansın)
   - **"Create user"** butonuna tıklayın

### ADIM 2: Profilleri SQL ile Güncelle

1. **SQL Editor**'e gidin → **New Query**
2. `update-test-accounts.sql` dosyasını açın ve içeriği kopyalayın
3. SQL Editor'e yapıştırın
4. Email adreslerini kontrol edin (yukarıda oluşturduğunuz email'lerle eşleşmeli)
5. **"Run"** butonuna tıklayın

✅ **Artık test hesaplarınız hazır!**

---

## 🎯 YÖNTEM 2: Tek Seferde SQL ile (Gelişmiş)

Eğer direkt SQL ile oluşturmak isterseniz, `create-test-accounts-sql.sql` dosyasını kullanabilirsiniz.

⚠️ **NOT:** Bu yöntem Supabase Auth'a direkt kullanıcı ekler, ancak şifre hash'leme gerektirir.

---

## 🔐 Oluşturulan Test Hesapları

### CONSULTANT Hesabı
- **Email**: `consultant@test.com`
- **Password**: `consultant123`
- **Rol**: `CONSULTANT`
- **Erişim**: 
  - `/dashboard/consultant`
  - `/documents/review` (belge inceleme)

### ADMIN Hesabı
- **Email**: `admin@test.com`
- **Password**: `admin123`
- **Rol**: `ADMIN`
- **Erişim**: 
  - `/dashboard/admin`
  - `/documents/review` (belge inceleme)
  - Tüm sayfalara erişim

---

## ✅ Test Etme

1. Uygulamanızda **Login** sayfasına gidin (`/auth/login`)
2. Oluşturduğunuz email ve şifre ile giriş yapın
3. İlgili dashboard'a yönlendirilmelisiniz

---

## 🔄 Şifre Değiştirme

Eğer şifre değiştirmek isterseniz:

1. **Supabase Dashboard** → **Authentication** → **Users**
2. Kullanıcıyı bulun ve **"..."** → **"Reset password"** seçin
3. Yeni şifre belirleyin

---

## 🗑️ Test Hesaplarını Silme

Test bittikten sonra hesapları silmek için:

1. **Supabase Dashboard** → **Authentication** → **Users**
2. Kullanıcıyı bulun ve **"Delete"** butonuna tıklayın
3. (Opsiyonel) Profil kaydını da silmek için SQL çalıştırın:

```sql
-- Profil kayıtlarını sil
DELETE FROM public.profiles WHERE email = 'consultant@test.com';
DELETE FROM public.profiles WHERE email = 'admin@test.com';
```

---

## 📝 Önemli Notlar

- ✅ Test hesaplarının email'leri **gerçek email olmak zorunda değil** (test için)
- ✅ Şifreler güvenli olmayabilir (sadece test için)
- ✅ Production'da bu hesapları kullanmayın!
- ✅ Profil kaydı otomatik oluşur (trigger sayesinde), sadece rolü güncellemek yeterli

---

Sorularınız varsa sorun! 😊
