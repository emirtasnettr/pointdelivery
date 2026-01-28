# "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" Hatası Çözümü

Bu hata, API route'unun JSON yerine HTML (hata sayfası) döndürdüğünü gösterir.

## Muhtemel Nedenler

1. **Environment Variable Eksik:**
   - `SUPABASE_SERVICE_ROLE_KEY` tanımlı değil
   - `.env.local` dosyasında eksik

2. **API Route Runtime Hatası:**
   - Kod hatası nedeniyle Next.js error page döndürülüyor
   - Environment variable kontrolü yapılmamış

## Çözüm

### 1. Environment Variable Kontrolü

`.env.local` dosyanızda şu değişkenlerin olduğundan emin olun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Service Role Key'i nereden alabilirim?**
- Supabase Dashboard > Settings > API > Service Role Key
- **DİKKAT:** Bu key çok önemlidir, güvenli tutun!

### 2. Development Server'ı Yeniden Başlatın

Environment variable değişikliklerinden sonra server'ı yeniden başlatın:

```bash
# Terminal'de Ctrl+C ile durdurun
npm run dev
```

### 3. Browser Console'u Kontrol Edin

Browser console'da (F12) daha detaylı hata mesajı görebilirsiniz. API route'unun döndürdüğü hatayı kontrol edin.

### 4. API Route Log'larını Kontrol Edin

Terminal'de (development server çalıştığı yerde) API route'unun log'larını kontrol edin. Hata mesajları orada görünecektir.

## Güncelleme

API route'u güncellendi:
- Environment variable kontrolü eklendi
- Daha iyi error handling
- Client-side'da JSON kontrolü eklendi

Yine de hata alıyorsanız, terminal log'larını kontrol edin ve hata mesajını paylaşın.
