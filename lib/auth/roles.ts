/**
 * Rol Kontrol Fonksiyonları
 */

import type { UserRole } from '@/types/database';

// Rol hiyerarşisi: Hangi roller hangi sayfalara erişebilir?
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  CANDIDATE: ['/dashboard/candidate', '/profile', '/documents/upload', '/dashboard/settings'],
  MIDDLEMAN: ['/dashboard/middleman', '/candidates', '/profile', '/documents/upload', '/dashboard/settings'],
  CONSULTANT: ['/dashboard/consultant', '/candidates', '/documents/review', '/profile', '/applications', '/dashboard/settings'],
  ADMIN: ['/dashboard/admin', '/users', '/settings', '/profile', '/dashboard/settings'],
  CUSTOMER: ['/dashboard/customer', '/profile', '/dashboard/settings'],
};

/**
 * Kullanıcının bir sayfaya erişim yetkisi var mı kontrol eder
 */
export function hasAccess(userRole: UserRole | null, pathname: string): boolean {
  if (!userRole) return false;
  
  // Admin her yere erişebilir
  if (userRole === 'ADMIN') return true;
  
  const allowedRoutes = ROLE_ROUTES[userRole] || [];
  
  return allowedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Kullanıcının rolüne göre varsayılan yönlendirme sayfasını döndürür
 */
export function getDefaultRoute(userRole: UserRole | null): string {
  switch (userRole) {
    case 'CANDIDATE':
      return '/dashboard/candidate';
    case 'MIDDLEMAN':
      return '/dashboard/middleman';
    case 'CONSULTANT':
      return '/dashboard/consultant';
    case 'ADMIN':
      return '/dashboard/admin';
    case 'CUSTOMER':
      return '/dashboard/customer';
    default:
      return '/';
  }
}

/**
 * Kullanıcının rolünü veritabanından alır (optimize edilmiş)
 */
export async function getUserRole(supabase: any): Promise<UserRole | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Tek sorgu ile direkt al (retry mekanizması kaldırıldı - çok yavaştı)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      return null;
    }

    return profileData.role as UserRole;
  } catch (error) {
    return null;
  }
}
