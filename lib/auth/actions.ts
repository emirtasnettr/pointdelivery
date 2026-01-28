/**
 * Authentication Server Actions
 * 
 * Client-side'da kullanılabilecek auth fonksiyonları
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Logout fonksiyonu
 * 
 * Kullanıcıyı çıkış yaptırır ve ana sayfaya yönlendirir
 */
export async function signOut() {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
  
  redirect('/');
}

/**
 * Kullanıcı bilgilerini alır
 * 
 * @returns Kullanıcı bilgileri veya null
 */
export async function getUser() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  return user;
}

/**
 * Kullanıcı profilini alır (rol dahil)
 * 
 * @returns Profil bilgileri veya null
 */
export async function getUserProfile() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error || !profile) return null;
  
  // Type assertion: Supabase'in Database type system'i manuel type tanımlarımızla
  // tam uyumlu değil. Bu yüzden type assertion kullanıyoruz.
  return {
    ...(profile as Record<string, unknown>),
    user,
  };
}
