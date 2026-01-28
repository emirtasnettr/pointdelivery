/**
 * Supabase Query Helpers
 * 
 * Type-safe Supabase query helper'ları
 * 
 * ÖNEMLİ: Bu helper'lar, Supabase'in Database type system'i ile çalışır.
 * Eğer `values: never` hatası alıyorsanız, Database type tanımlarının
 * Supabase'in beklediği formatta olmadığını gösterir.
 * 
 * ÇÖZÜM: Supabase CLI ile type'ları regenerate edin:
 * `npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts`
 */

import type { Database } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostgrestError } from '@supabase/supabase-js';

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

/**
 * Type-safe insert query
 * 
 * @param client - Supabase client instance
 * @param tableName - Table name (must be a key of Database['public']['Tables'])
 * @param data - Insert data matching the table's Insert type
 * @returns Promise with data and error
 * 
 * @throws TypeScript error if data doesn't match Insert type
 */
export async function insertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  tableName: T,
  data: TableInsert<T>
): Promise<{ data: TableRow<T> | null; error: PostgrestError | null }> {
  // Type assertion: Supabase'in type inference'ı bazen Insert type'ını
  // doğru çıkaramaz. Bu durumda Database type tanımlarını kontrol edin.
  // NOT: Supabase'in Database type system'i manuel type tanımlarımızla
  // tam uyumlu değil. Bu yüzden geçici olarak as any kullanıyoruz.
  const result = await (client
    .from(tableName) as any)
    .insert(data)
    .select()
    .single();
  
  if (result.error) {
    return { data: null, error: result.error };
  }
  return { data: result.data as TableRow<T>, error: null };
}

/**
 * Type-safe update query
 * 
 * @param client - Supabase client instance
 * @param tableName - Table name
 * @param id - Record ID to update
 * @param data - Update data matching the table's Update type
 * @returns Promise with data and error
 */
export async function updateRow<T extends TableName>(
  client: SupabaseClient<Database>,
  tableName: T,
  id: string,
  data: TableUpdate<T>
): Promise<{ data: TableRow<T> | null; error: PostgrestError | null }> {
  // Type assertion: Supabase'in Database type system'i manuel type tanımlarımızla
  // tam uyumlu değil. Bu yüzden geçici olarak as any kullanıyoruz.
  const result = await (client
    .from(tableName) as any)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (result.error) {
    return { data: null, error: result.error };
  }
  return { data: result.data as TableRow<T>, error: null };
}

/**
 * Type-safe upsert query
 * 
 * @param client - Supabase client instance
 * @param tableName - Table name
 * @param data - Upsert data matching the table's Insert type
 * @param onConflict - Conflict resolution column name
 * @returns Promise with data and error
 */
export async function upsertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  tableName: T,
  data: TableInsert<T>,
  onConflict?: string
): Promise<{ data: TableRow<T> | null; error: PostgrestError | null }> {
  // Type assertion: Supabase'in Database type system'i manuel type tanımlarımızla
  // tam uyumlu değil. Bu yüzden geçici olarak as any kullanıyoruz.
  const result = await (client
    .from(tableName) as any)
    .upsert(
      data,
      onConflict ? { onConflict } : undefined
    )
    .select()
    .single();
  
  if (result.error) {
    return { data: null, error: result.error };
  }
  return { data: result.data as TableRow<T>, error: null };
}
