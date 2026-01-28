# Email Konfirmasyonunu Devre Dışı Bırakma

Email konfirmasyonunu geçici olarak devre dışı bırakmak için aşağıdaki adımları izleyin:

## Supabase Dashboard'dan Email Konfirmasyonunu Kapatma

1. **Supabase Dashboard'a giriş yapın**
   - https://app.supabase.com adresine gidin
   - Projenizi seçin

2. **Authentication Ayarlarına gidin**
   - Sol menüden **Authentication** > **Settings** seçeneğine tıklayın
   - **Email Auth** bölümünü bulun

3. **Email Konfirmasyonunu Kapatın**
   - **"Enable email confirmations"** seçeneğini **KAPATIN** (toggle'ı kapatın)
   - Ayarları kaydedin

## Kod Tarafındaki Değişiklikler

Kod tarafında aşağıdaki değişiklikler yapıldı:

1. **Kayıt sayfası (`app/auth/register/page.tsx`)**:
   - Kayıt olduktan sonra kullanıcı artık `/dashboard/candidate` sayfasına yönlendiriliyor
   - Email konfirmasyon mesajı kaldırıldı

2. **Bilgi mesajı güncellendi**:
   - "E-posta adresinize onay bağlantısı gönderilecektir" mesajı kaldırıldı
   - "Kayıt olduktan sonra hesabınız otomatik olarak aktif olacak" mesajı eklendi

## Önemli Notlar

⚠️ **GÜVENLİK UYARISI:**
- Email konfirmasyonunu devre dışı bırakmak, güvenlik açısından risk oluşturabilir
- Bu ayarı **sadece test/development** ortamında kullanın
- Production ortamında email konfirmasyonunu **mutlaka aktif** tutun

## Email Konfirmasyonunu Tekrar Aktif Etme

Email konfirmasyonunu tekrar aktif etmek için:

1. Supabase Dashboard > Authentication > Settings > Email Auth
2. **"Enable email confirmations"** seçeneğini **AÇIN**
3. Kod tarafındaki yönlendirmeyi `/auth/register/success` olarak geri değiştirin (isteğe bağlı)

## Test Etme

Email konfirmasyonu kapalıyken:

1. Yeni bir kullanıcı kaydı oluşturun
2. Kayıt işlemi tamamlandıktan sonra kullanıcı **otomatik olarak authenticated** olmalı
3. Kullanıcı direkt olarak `/dashboard/candidate` sayfasına yönlendirilmeli
4. Email konfirmasyon mesajı **gönderilmemeli**
