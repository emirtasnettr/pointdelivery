# "Invalid Refresh Token" Hatası Çözümü

Bu hata, Supabase session cookie'lerinin (refresh token) geçersiz veya süresi dolmuş olduğunu gösterir.

## Hızlı Çözüm (Önerilen)

**Tarayıcı Cookie'lerini Temizleyin ve Yeniden Giriş Yapın:**

1. **Chrome/Edge:**
   - `F12` tuşuna basın (Developer Tools)
   - **Application** sekmesine gidin
   - Sol menüden **Cookies** > `http://localhost:3000` seçin
   - Tüm cookie'leri silin (sağ tık > Clear)
   - Sayfayı yenileyin (`F5` veya `Ctrl+R`)

2. **Firefox:**
   - `F12` tuşuna basın (Developer Tools)
   - **Storage** sekmesine gidin
   - **Cookies** > `http://localhost:3000` seçin
   - Tüm cookie'leri silin
   - Sayfayı yenileyin

3. **Yeniden Giriş Yapın:**
   - `/auth/login` sayfasına gidin
   - Email ve şifrenizle giriş yapın

## Alternatif Çözüm

Eğer cookie temizleme işe yaramazsa:

1. **Development Server'ı Yeniden Başlatın:**
   ```bash
   # Terminal'de Ctrl+C ile durdurun
   npm run dev
   ```

2. **Tarayıcıyı Kapatıp Açın:**
   - Tüm tarayıcı pencerelerini kapatın
   - Tarayıcıyı yeniden açın
   - `http://localhost:3000` adresine gidin

## Neden Olur?

- Development ortamında cookie'lerin expire olması
- Server'ın yeniden başlatılması sırasında session'ın kaybolması
- Cookie'lerin bozulması veya geçersiz hale gelmesi
- Tarayıcı cache'inin eski session bilgilerini tutması

## Not

Bu hata genellikle development ortamında görülür ve normaldir. Production ortamında bu sorun daha az görülür çünkü cookie'ler daha uzun süre geçerli kalır.
