# 🔐 Environment Variables (.env.local) Kurulum Rehberi

## 📋 Gerekli Environment Variables

Projenin çalışması için aşağıdaki 3 environment variable'ın `.env.local` dosyasında tanımlanması gerekmektedir:

### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Nereden alınır:** Supabase Dashboard > Settings > API > Project URL
- **Örnek:** `https://abcdefghijklmnop.supabase.co`
- **Açıklama:** Supabase projenizin URL adresi

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Nereden alınır:** Supabase Dashboard > Settings > API > anon public key
- **Örnek:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (uzun bir string)
- **Açıklama:** Client-side işlemler için kullanılan public key (güvenlik sınırlamaları vardır)

### 3. `SUPABASE_SERVICE_ROLE_KEY`
- **Nereden alınır:** Supabase Dashboard > Settings > API > service_role (secret) key
- **Örnek:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (uzun bir string)
- **Açıklama:** Server-side admin işlemleri için kullanılan güçlü key
- **⚠️ ÖNEMLİ:** Bu key çok güçlüdür, asla client-side'da kullanmayın!

---

## 📝 Adım Adım Kurulum

### Adım 1: Supabase Dashboard'a Giriş Yapın

1. [https://app.supabase.com](https://app.supabase.com) adresine gidin
2. Projenizi seçin (veya yeni proje oluşturun)

### Adım 2: API Anahtarlarını Alın

1. Sol menüden **Settings** (⚙️) seçeneğine tıklayın
2. **API** sekmesine gidin
3. Aşağıdaki bilgileri kopyalayın:

   **a) Project URL:**
   - "Project URL" kısmından kopyalayın
   - Örnek: `https://abcdefghijklmnop.supabase.co`

   **b) anon public key:**
   - "Project API keys" bölümünde
   - **"anon public"** yazısının yanındaki **kopyala** butonuna tıklayın (👁️ ikonu yanında)

   **c) service_role key:**
   - "Project API keys" bölümünde
   - **"service_role"** yazısının yanındaki **kopyala** butonuna tıklayın
   - ⚠️ Bu key gizlidir, bir daha gösterilmez! Kopyaladığınızdan emin olun!

### Adım 3: .env.local Dosyası Oluşturun

Proje kök dizininde (package.json'un olduğu yerde) `.env.local` dosyası oluşturun:

**Windows'ta:**
- VS Code'da yeni dosya oluştur: `.env.local`
- Veya terminalde: `New-Item -Path .env.local -ItemType File`

**Mac/Linux'ta:**
- Terminalde: `touch .env.local`

### Adım 4: Değerleri Yapıştırın

`.env.local` dosyasını açın ve aşağıdaki şablonu kopyalayıp, değerleri yapıştırın:

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co

# Supabase Anon Public Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzQ1Njg5MCwiZXhwIjoxOTUzMDMyODkwfQ.abcdefghijklmnopqrstuvwxyz1234567890

# Supabase Service Role Key (Admin işlemleri için)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM3NDU2ODkwLCJleHAiOjE5NTMwMzI4OTB9.abcdefghijklmnopqrstuvwxyz1234567890
```

**⚠️ ÖNEMLİ NOTLAR:**
- Değerlerin etrafında **tırnak işareti OLMAMALI**
- `=` işaretinden sonra boşluk bırakmadan direkt değeri yazın
- Her satırda sadece bir değişken olmalı

### Adım 5: Development Server'ı Yeniden Başlatın

Environment variable'lar değiştiğinde server'ı **mutlaka yeniden başlatmanız gerekir!**

```bash
# Terminal'de Ctrl+C ile server'ı durdurun
# Sonra tekrar başlatın:
npm run dev
```

---

## ✅ Kontrol Listesi

- [ ] `.env.local` dosyası proje kök dizininde oluşturuldu
- [ ] `NEXT_PUBLIC_SUPABASE_URL` değeri eklendi
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` değeri eklendi
- [ ] `SUPABASE_SERVICE_ROLE_KEY` değeri eklendi
- [ ] Değerlerin etrafında tırnak işareti yok
- [ ] `=` işaretinden sonra boşluk yok
- [ ] Development server yeniden başlatıldı

---

## 🐛 Sorun Giderme

### "NEXT_PUBLIC_SUPABASE_URL bulunamadı" hatası
- ✅ `.env.local` dosyasının proje kök dizininde olduğundan emin olun
- ✅ Dosya adının `.env.local` olduğundan emin olun (`.env` değil!)
- ✅ Development server'ı yeniden başlatın

### "SUPABASE_SERVICE_ROLE_KEY bulunamadı" hatası
- ✅ Service role key'i doğru kopyaladığınızdan emin olun
- ✅ Supabase Dashboard'dan tekrar kopyalayın (bir daha gösterilmez!)

### Anahtarlar çalışmıyor
- ✅ Anahtarları doğru kopyaladığınızdan emin olun
- ✅ Boşluk veya tırnak olmadığından emin olun
- ✅ Supabase Dashboard'dan tekrar kopyalayın

---

## 🔒 Güvenlik

**⚠️ ASLA YAPMAYIN:**
- ❌ `.env.local` dosyasını git'e commit etmeyin (zaten .gitignore'da)
- ❌ Anahtarları public repository'lerde paylaşmayın
- ❌ Anahtarları client-side kodda hardcode etmeyin
- ❌ Service role key'i client-side'da kullanmayın

**✅ DOĞRU:**
- ✅ `.env.local` dosyası zaten `.gitignore`'da (otomatik ignore edilir)
- ✅ Sadece `NEXT_PUBLIC_` ile başlayan değişkenler client-side'da kullanılabilir
- ✅ Production'da (Vercel/Netlify) environment variables ayarlayın

---

## 📚 Canlı Ortam (Production) İçin

Canlı ortamda (Vercel, Netlify, vs.) environment variables'ları platform ayarlarından eklemeniz gerekir:

1. Platform dashboard'una gidin (örn: Vercel Dashboard)
2. Projenizi seçin
3. Settings > Environment Variables bölümüne gidin
4. Yukarıdaki 3 değişkeni ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy'u yeniden yapın

---

## 📞 Yardım

Sorun yaşıyorsanız:
1. Terminal log'larını kontrol edin
2. Browser console'u kontrol edin (F12)
3. Supabase Dashboard'da API keys'in doğru olduğundan emin olun
