/**
 * Supabase Admin Client Cache
 * 
 * Service role key ile oluşturulan admin client'ı cache'ler
 * Her API route'da yeni client oluşturmak yerine cache'lenmiş client kullanılır
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '@/lib/env';

type SupabaseAdminClient = ReturnType<typeof createServiceClient<Database>>;

let cachedAdminClient: SupabaseAdminClient | null = null;

/**
 * Cache'lenmiş admin client'ı döndürür
 * İlk çağrıda oluşturur, sonraki çağrılarda cache'den döner
 */
export function getAdminClient(): SupabaseAdminClient {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const serviceRoleKey = getSupabaseServiceRoleKey();
  const supabaseUrl = getSupabaseUrl();

  cachedAdminClient = createServiceClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return cachedAdminClient;
}
