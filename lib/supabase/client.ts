/**
 * Supabase Client (Browser için)
 * 
 * NEDEN BU DOSYA?
 * - Next.js'te tarayıcı tarafında Supabase kullanmak için client instance'ına ihtiyacımız var
 * - Bu dosya, tarayıcıda çalışan React componentlerinde kullanılacak
 * - createBrowserClient, Supabase'in tarayıcı için özel olarak optimize edilmiş client'ını oluşturur
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Tarayıcı için Supabase client oluşturur
 * 
 * @returns Supabase client instance
 * 
 * KULLANIM ÖRNEĞİ:
 * ```ts
 * 'use client'; // Client Component'te kullanılır
 * 
 * import { createClient } from '@/lib/supabase/client';
 * 
 * export default function MyComponent() {
 *   const supabase = createClient();
 *   
 *   // Artık supabase ile veritabanı işlemleri yapabilirsiniz
 *   const { data } = await supabase.from('profiles').select('*');
 * }
 * ```
 */
export function createClient() {
  // Neden process.env kullanıyoruz?
  // - Next.js'te ortam değişkenleri .env.local dosyasından yüklenir
  // - NEXT_PUBLIC_ prefix'i olan değişkenler tarayıcıda kullanılabilir (güvenlik için)
  // - .env.local dosyasında SUPABASE_URL ve SUPABASE_ANON_KEY tanımlanmalı
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL bulunamadı! .env.local dosyasını kontrol edin.');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY bulunamadı! .env.local dosyasını kontrol edin.');
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
