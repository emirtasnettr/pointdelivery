/**
 * Supabase Server Client (Server Components ve Server Actions için)
 * 
 * NEDEN AYRI BİR DOSYA?
 * - Next.js Server Components'te farklı bir Supabase client'ı kullanılır
 * - Server-side'da cookie'lerden session bilgisi alınır
 * - createServerClient, cookie'leri otomatik olarak yönetir
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

/**
 * Server Components için Supabase client oluşturur
 * 
 * @returns Supabase client instance
 * 
 * KULLANIM ÖRNEĞİ:
 * ```ts
 * // app/dashboard/page.tsx (Server Component)
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function Dashboard() {
 *   const supabase = await createClient();
 *   
 *   const { data: profile } = await supabase
 *     .from('profiles')
 *     .select('*')
 *     .single();
 *   
 *   return <div>{profile.full_name}</div>;
 * }
 * ```
 */
export async function createClient() {
  // Neden cookies() kullanıyoruz?
  // - Next.js'in cookies() fonksiyonu, server-side'da cookie'lere erişmemizi sağlar
  // - Supabase, session bilgisini cookie'lerde saklar
  // - createServerClient, bu cookie'leri okuyup otomatik olarak session'ı yönetir
  const cookieStore = await cookies();

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        // Neden getAll ve setAll kullanıyoruz?
        // - getAll: Tüm cookie'leri oku (Supabase session birden fazla cookie'de saklanabilir)
        // - setAll: Cookie'leri güncelle (session değiştiğinde otomatik güncellenmeli)
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Parameters<typeof cookieStore.set>[2];
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Neden try-catch?
            // - Server Components'te cookie'ler async işlemlerde sorun çıkarabilir
            // - Hata olsa bile uygulamanın çökmesini önler
            console.error('Cookie set error:', error);
          }
        },
      },
    }
  );
}
