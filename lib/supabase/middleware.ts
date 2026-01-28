/**
 * Supabase Middleware Client
 * 
 * Next.js middleware'inde kullanmak için özel bir client gerekir
 * Middleware, edge runtime'da çalışır (daha hızlı ama sınırlı)
 * Cookie yönetimi burada da farklıdır
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware için Supabase client oluşturur
 * 
 * @param request - Next.js request objesi
 * @returns Supabase client ve response objesi
 */
export function createClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Parameters<typeof response.cookies.set>[2];
          }[]
        ) {
          // Yeni response oluştur
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          // Cookie'leri response'a ekle
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              // Cookie'lerin tüm path'lerde çalışması için
              path: '/',
              // SameSite ayarı
              sameSite: 'lax' as const,
              // Secure flag (HTTPS için true, HTTP için false)
              secure: process.env.NODE_ENV === 'production',
            });
          });
        },
      },
    }
  );

  return { supabase, response };
}
