# İstanbul İlçelerine Aday Oluşturma Script'i

Bu script, İstanbul'daki her ilçeye otomatik olarak 5 onaylanmış aday oluşturur.

## Özellikler

- İstanbul'daki 13 ilçeye otomatik aday oluşturur
- Her ilçeye 5 aday ekler (toplam 65 aday)
- Tüm adaylar `APPROVED` (onaylanmış) statüsünde oluşturulur
- İlçe bilgileri (`city: 'İstanbul'`, `district`) otomatik atanır
- Rastgele isimler, email adresleri ve telefon numaraları oluşturur

## Gereksinimler

1. `.env.local` dosyasında aşağıdaki environment variable'lar tanımlı olmalı:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. `@supabase/supabase-js` paketi yüklü olmalı:
   ```bash
   npm install @supabase/supabase-js
   ```

## Kullanım

Script'i çalıştırmak için:

```bash
node create-istanbul-candidates.js
```

## Oluşturulan Adaylar

### İlçeler (13 adet):
- Kadıköy
- Beşiktaş
- Şişli
- Beyoğlu
- Üsküdar
- Kartal
- Pendik
- Bakırköy
- Fatih
- Maltepe
- Ataşehir
- Beylikdüzü
- Büyükçekmece

### Her İlçe İçin:
- 5 onaylanmış aday (`application_status: 'APPROVED'`)
- İstanbul il bilgisi (`city: 'İstanbul'`)
- İlçe bilgisi (`district`)
- Otomatik oluşturulan email, telefon ve isim

### Varsayılan Şifre:
Tüm adaylar için varsayılan şifre: `Aday123!`

## Çıktı

Script çalıştırıldığında:
1. Her ilçe için 5 aday oluşturma işlemini gösterir
2. Başarılı/başarısız işlemleri listeler
3. İlçelere göre oluşturulan adayları özetler

## Notlar

- Script, Supabase Admin Client kullanır (RLS bypass)
- Rate limiting için her aday arasında 300ms bekleme yapılır
- Email adresleri benzersiz olacak şekilde oluşturulur (isim + index)
- Hata durumunda script devam eder ve sonunda başarısız olanları raporlar
