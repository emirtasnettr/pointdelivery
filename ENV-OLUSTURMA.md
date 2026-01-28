# 🔐 Environment Variables (.env.local) Oluşturma

Bu dosya, Next.js projenizde Supabase'e bağlanmak için gerekli olan environment variables'ları nasıl ayarlayacağınızı gösterir.

---

## 📋 ADIM 1: .env.local Dosyası Oluşturma

### 1.1. Proje Kök Dizinine Gidin

Projenizin ana klasöründe (package.json'un olduğu yerde) `.env.local` dosyası oluşturmalısınız.

### 1.2. Dosyayı Oluşturun

**Windows'ta:**
- VS Code veya başka bir editörde, proje kök dizininde `.env.local` adında yeni bir dosya oluşturun
- Veya terminalde: `New-Item -Path .env.local -ItemType File`

**Mac/Linux'ta:**
- Terminalde: `touch .env.local`

---

## 📝 ADIM 2: Supabase Anahtarlarını Kopyalama

### 2.1. Supabase Dashboard'a Gidin

1. [https://app.supabase.com](https://app.supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden **"Settings"** (⚙️) > **"API"** sekmesine tıklayın

### 2.2. İki Anahtarı Kopyalayın

**a) Project URL:**
- "Project URL" kısmından kopyalayın
- Örnek: `https://abcdefghijklmnop.supabase.co`

**b) anon public key:**
- "Project API keys" bölümünde
- **"anon public"** yazısının yanındaki **kopyala** butonuna tıklayın (göz ikonu yanında)
- Uzun bir string olacak: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## ✅ ADIM 3: .env.local Dosyasına Yapıştırma

### 3.1. Dosyayı Açın

`.env.local` dosyasını VS Code veya editörünüzde açın.

### 3.2. Aşağıdaki Şablonu Kopyalayın ve Değerleri Doldurun

```env
# Supabase Environment Variables
# Bu dosyayı asla git'e commit etmeyin! (.gitignore'da zaten var)

# Supabase Project URL (Settings > API > Project URL)
NEXT_PUBLIC_SUPABASE_URL=buraya-project-url-yapistirin

# Supabase Anon Public Key (Settings > API > anon public key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=buraya-anon-key-yapistirin
```

### 3.3. Örnek (Gerçek Değerlerle)

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzQ1Njg5MCwiZXhwIjoxOTUzMDMyODkwfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

---

## ⚠️ ÖNEMLİ NOTLAR

### ✅ DOĞRU:
- `.env.local` dosyası proje kök dizininde olmalı (package.json'un yanında)
- Değerlerin etrafında **tırnak işareti OLMAMALI**
- Boşluk bırakmadan `=` işaretinden sonra direkt değer yazın

### ❌ YANLIŞ:
```env
# Tırnak kullanmayın!
NEXT_PUBLIC_SUPABASE_URL="https://..."
# ❌

# Boşluk bırakmayın!
NEXT_PUBLIC_SUPABASE_URL = https://...
# ❌
```

---

## 🔍 ADIM 4: Kontrol Etme

### 4.1. Development Server'ı Yeniden Başlatın

**⚠️ ÖNEMLİ:** Environment variables'lar değiştiğinde server'ı **yeniden başlatmanız gerekir!**

1. Terminalde `Ctrl + C` ile server'ı durdurun
2. `npm run dev` ile tekrar başlatın

### 4.2. Test Edin

Eğer her şey doğruysa, server hatasız başlamalı ve sayfalar yüklenmelidir.

---

## 🐛 Sorun Giderme

### "NEXT_PUBLIC_SUPABASE_URL bulunamadı" hatası
- ✅ `.env.local` dosyasının proje kök dizininde olduğundan emin olun
- ✅ Dosya adının `.env.local` olduğundan emin olun (`.env` değil!)
- ✅ Development server'ı yeniden başlatın

### Anahtarlar çalışmıyor
- ✅ Anahtarları doğru kopyaladığınızdan emin olun
- ✅ Boşluk veya tırnak olmadığından emin olun
- ✅ Supabase Dashboard'dan tekrar kopyalayın

---

## 🔒 Güvenlik

**⚠️ ASLA YAPMAYIN:**
- ❌ `.env.local` dosyasını git'e commit etmeyin
- ❌ Anahtarları public repository'lerde paylaşmayın
- ❌ Anahtarları client-side kodda hardcode etmeyin

**✅ DOĞRU:**
- ✅ `.env.local` dosyası zaten `.gitignore`'da (otomatik ignore edilir)
- ✅ Sadece `NEXT_PUBLIC_` ile başlayan değişkenler client-side'da kullanılabilir
- ✅ Production'da Vercel/Netlify gibi platformlarda environment variables ayarlayın

---

## 📚 Sonraki Adım

Environment variables ayarlandıktan sonra, Supabase bağlantısını test edebilirsiniz!

Sorularınız varsa sorun! 😊
