/**
 * Environment Variable Validation
 * 
 * Tüm environment variable'ları validate eder ve tip güvenliği sağlar
 */

export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

export function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key];
}

// Supabase environment variables
export function getSupabaseUrl(): string {
  return getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  return getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function getSupabaseServiceRoleKey(): string {
  return getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
}
