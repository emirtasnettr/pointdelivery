# Middleman (Aracı) Kurulum Kılavuzu

Bu kılavuz, Middleman arayüzü ve iş akışlarının kurulumu için gerekli adımları içerir.

## 1. RLS Politikalarını Ekleme

Middleman'lerin aday adına işlem yapabilmesi için RLS politikaları eklenmelidir.

**Dosya:** `add-middleman-rls-policies.sql`

Bu SQL dosyasını Supabase SQL Editor'de çalıştırın:

```sql
-- Middleman'lerin aday adına işlem yapabilmesi için RLS politikaları
-- (Dosya içeriği: add-middleman-rls-policies.sql)
```

## 2. Environment Variable Ekleme

Yeni aday oluşturma için Service Role Key gereklidir.

`.env.local` dosyasına ekleyin:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**NOT:** Service Role Key'i Supabase Dashboard > Settings > API > Service Role Key'den alabilirsiniz.

## 3. Middleman Dashboard

**Dosya:** `app/dashboard/middleman/page.tsx`

- Consultant dashboard'una benzer tablo görünümü
- Middleman'e bağlı adaylar listelenir (middleman_id ile)
- Filtreleme: Yeni Başvuru, Değerlendirme, Onaylanan, Reddedilen, Güncelleme, Tümü
- Her satıra tıklandığında aday detay sayfasına yönlendirir
- "+ Yeni Aday Ekle" butonu ile yeni aday eklenebilir

## 4. Aday Detay Sayfası

**Dosya:** `app/dashboard/middleman/candidates/[id]/page.tsx`

- Profile sayfasına benzer görünüm
- Middleman aday bilgilerini görebilir
- Belgeleri görüntüleyebilir (DocumentRow ile canEdit={true})
- "Düzenle" butonu ile aday bilgilerini düzenleyebilir

## 5. Aday Düzenleme Sayfası

**Dosya:** `app/dashboard/middleman/candidates/[id]/edit/page.tsx`

- Profile edit sayfasına benzer
- Middleman aday adına tüm bilgileri güncelleyebilir
- Temel Bilgiler, İletişim Bilgileri, Kişisel Bilgiler, Kariyer Bilgileri

## 6. Yeni Aday Ekleme Sayfası

**Dosya:** `app/dashboard/middleman/candidates/new/page.tsx`

- Form: Ad Soyad, E-posta, Şifre, Şifre Tekrar
- Service Role API kullanarak kullanıcı oluşturulur
- Oluşturulan aday otomatik olarak middleman'e bağlanır (middleman_id)

## 7. Yeni Aday Ekleme API Route

**Dosya:** `app/api/middleman/create-candidate/route.ts`

- Service Role Key kullanarak kullanıcı oluşturur
- Güvenlik: Sadece MIDDLEMAN rolündeki kullanıcılar çağırabilir
- Oluşturulan kullanıcı için profil oluşturulur (middleman_id ile)
- Email onayı otomatik olarak yapılır (email_confirm: true)

## Önemli Notlar

1. **Service Role Key:** Yeni aday oluşturma için `SUPABASE_SERVICE_ROLE_KEY` environment variable'ı gerekir
2. **RLS Politikaları:** Middleman'lerin aday adına işlem yapabilmesi için RLS politikaları mutlaka eklenmelidir
3. **Middleware:** `/dashboard/middleman/candidates/*` path'leri otomatik olarak erişilebilir (startsWith kontrolü)
4. **Trigger:** `handle_new_user` trigger'ı otomatik olarak profile oluşturur, sonra middleman_id UPDATE ile set edilir
5. **Belgeler:** Middleman'ler DocumentRow component'i ile aday adına belge yükleyebilir/güncelleyebilir/silebilir (canEdit={true})

## Kurulum Adımları

1. `add-middleman-rls-policies.sql` dosyasını Supabase SQL Editor'de çalıştırın
2. `.env.local` dosyasına `SUPABASE_SERVICE_ROLE_KEY` ekleyin
3. Development server'ı yeniden başlatın (`npm run dev`)
4. Middleman hesabı ile giriş yapın
5. Dashboard'dan yeni aday ekleyebilir, mevcut adayları görüntüleyebilir ve düzenleyebilirsiniz
