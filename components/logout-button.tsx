/**
 * Logout Button Component
 * 
 * Kullanıcıyı çıkış yaptıran buton
 */

'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (!error) {
      router.push('/');
      router.refresh();
    } else {
      console.error('Logout error:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="group relative px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 via-rose-500 to-red-500 rounded-xl hover:from-red-600 hover:via-rose-600 hover:to-red-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 overflow-hidden"
    >
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      
      <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="relative z-10 hidden sm:inline">Çıkış</span>
    </button>
  );
}
