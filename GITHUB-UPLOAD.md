# GitHub'a Yükleme Talimatları

## 1. GitHub'da Yeni Repository Oluşturma

1. GitHub.com'a giriş yapın: https://github.com
2. Sağ üst köşedeki **"+"** butonuna tıklayın
3. **"New repository"** seçeneğini seçin
4. Repository adını **`jobulai2`** olarak girin
5. **Public** veya **Private** seçin (istediğiniz gibi)
6. **"Initialize this repository with a README"** seçeneğini **İŞARETLEMEYİN**
7. **"Create repository"** butonuna tıklayın

## 2. Projeyi GitHub'a Yükleme

Terminal'de aşağıdaki komutları sırayla çalıştırın:

```bash
# Mevcut remote'u kaldır (eski repo bağlantısını kaldır)
git remote remove origin

# Yeni remote ekle (KULLANICI_ADI'nızı değiştirin)
git remote add origin https://github.com/KULLANICI_ADI/jobulai2.git

# Tüm branch'leri push et
git push -u origin main
```

**ÖNEMLİ:** `KULLANICI_ADI` yerine GitHub kullanıcı adınızı yazın!

## 3. Canlı Ortamda Kullanma

Canlı sunucuda projeyi çekmek için:

```bash
# Projeyi klonla
git clone https://github.com/KULLANICI_ADI/jobulai2.git

# Proje klasörüne gir
cd jobulai2

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur ve gerekli değişkenleri ekle
# (Supabase URL, API Key, vs.)

# Projeyi build et
npm run build

# Projeyi çalıştır
npm start
```

## Notlar

- `.env` dosyaları `.gitignore`'da olduğu için GitHub'a yüklenmez
- Canlı ortamda `.env.local` veya `.env.production` dosyası oluşturmanız gerekecek
- Supabase bağlantı bilgilerini canlı ortamda tekrar yapılandırmanız gerekecek
