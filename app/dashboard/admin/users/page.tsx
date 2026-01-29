/**
 * Admin - Kullanıcılar Sayfası
 * 
 * Tüm kullanıcıları görüntüleme ve yönetme sayfası
 */

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
  email?: string;
  is_active?: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    total: 0,
    candidate: 0,
    middleman: 0,
    consultant: 0,
    admin: 0,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<'ADMIN' | 'CONSULTANT' | 'MIDDLEMAN'>('CONSULTANT');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Profil kontrolü API route üzerinden yapılacak
        // Önce API route'u çağır, eğer 403 dönerse admin değil demektir

        // API route üzerinden tüm kullanıcıları al (service role key ile RLS bypass)
        console.log('📡 API route çağrılıyor...');
        let response: Response;
        try {
          response = await fetch('/api/admin/users');
        } catch (fetchError) {
          console.error('❌ Network error:', fetchError);
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin veya sayfayı yenileyin.';
          setError(errorMessage);
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ API hatası:', errorData);
          throw new Error(errorData.error || `HTTP ${response.status}: Kullanıcılar yüklenemedi`);
        }

        const data = await response.json();
        const usersList = data.users || [];
        const adminProfile = data.adminProfile || null;
        
        // Admin profilini set et
        if (adminProfile) {
          setProfile(adminProfile);
        }

        // Site logo'yu yükle
        try {
          const { data: settings, error: settingsError } = await supabase
            .from('site_settings')
            .select('logo_url')
            .maybeSingle();
          
          if (!settingsError && settings?.logo_url) {
            setSiteLogo(settings.logo_url);
          }
        } catch (err) {
          console.log('Logo yüklenemedi:', err);
        }
        
        // Kullanıcıların is_active durumunu kontrol et
        const usersWithStatus = usersList.map((user: UserProfile) => ({
          ...user,
          is_active: user.is_active !== undefined ? user.is_active : true,
        }));
        
        console.log('✅ Kullanıcılar yüklendi:', usersWithStatus.length);

        if (usersWithStatus.length > 0) {
          setUsers(usersWithStatus);
          setFilteredUsers(usersWithStatus);

          // İstatistikleri hesapla
          // Type tanımı: usersWithStatus'teki her kullanıcı için
          type UserWithRole = { role: string; [key: string]: unknown };
          
          setStats({
            total: usersWithStatus.length,
            candidate: usersWithStatus.filter((u: UserWithRole) => u.role === 'CANDIDATE').length,
            middleman: usersWithStatus.filter((u: UserWithRole) => u.role === 'MIDDLEMAN').length,
            consultant: usersWithStatus.filter((u: UserWithRole) => u.role === 'CONSULTANT').length,
            admin: usersWithStatus.filter((u: UserWithRole) => u.role === 'ADMIN').length,
          });
        } else {
          console.warn('⚠️  Kullanıcı listesi boş');
          setUsers([]);
          setFilteredUsers([]);
          setStats({
            total: 0,
            candidate: 0,
            middleman: 0,
            consultant: 0,
            admin: 0,
          });
        }

        if (usersList.length > 0) {
          console.log('✅ Kullanıcılar yüklendi:', usersList);
          setUsers(usersList);
          setFilteredUsers(usersList);

          // İstatistikleri hesapla
          // Type tanımı: usersList'teki her kullanıcı için
          type UserWithRole = { role: string; [key: string]: unknown };
          
          setStats({
            total: usersList.length,
            candidate: usersList.filter((u: UserWithRole) => u.role === 'CANDIDATE').length,
            middleman: usersList.filter((u: UserWithRole) => u.role === 'MIDDLEMAN').length,
            consultant: usersList.filter((u: UserWithRole) => u.role === 'CONSULTANT').length,
            admin: usersList.filter((u: UserWithRole) => u.role === 'ADMIN').length,
          });
        } else {
          console.warn('⚠️  Kullanıcı listesi boş!');
          setUsers([]);
          setFilteredUsers([]);
          setStats({
            total: 0,
            candidate: 0,
            middleman: 0,
            consultant: 0,
            admin: 0,
          });
        }
      } catch (err) {
        console.error('❌ Error loading data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu';
        console.error('Error details:', {
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  // Dropdown dışına tıklama kontrolü
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtreleme (memoized - performans optimizasyonu)
  const filteredUsersMemo = useMemo(() => {
    let filtered = users;

    // Rol filtresi
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Arama filtresi
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.role?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [users, roleFilter, searchQuery]);

  useEffect(() => {
    setFilteredUsers(filteredUsersMemo);
  }, [filteredUsersMemo]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  }, [supabase, router]);

  // Dropdown dışına tıklama kontrolü
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      // Action dropdown için - herhangi bir yere tıklanırsa kapat
      const target = event.target as HTMLElement;
      if (!target.closest('[data-action-dropdown]')) {
        setActionDropdownOpen(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Hata oluştu');
        return;
      }

      // Listeyi yeniden yükle
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        const usersList = data.users || [];
        setUsers(usersList);
      }

      setActionDropdownOpen(null);
    } catch (error) {
      console.error('Error toggling user status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Hata oluştu';
      alert('Hata oluştu: ' + errorMessage);
    }
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsActive(user.is_active !== undefined ? user.is_active : true);
    setNewPassword('');
    setEditModalOpen(true);
  };

  const getRoleBadge = useCallback((role: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      CANDIDATE: { bg: 'bg-[#16B24B]/20', text: 'text-[#16B24B]', label: 'Aday' },
      MIDDLEMAN: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Aracı' },
      CONSULTANT: { bg: 'bg-green-100', text: 'text-green-700', label: 'Consultant' },
      ADMIN: { bg: 'bg-red-100', text: 'text-red-700', label: 'Admin' },
    };

    const config = configs[role] || { bg: 'bg-gray-100', text: 'text-gray-700', label: role };
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#16B24B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/admin" className="inline-flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/pointdlogo.webp" alt="Point Delivery" className="w-auto" style={{ height: '42px', width: 'auto' }} />
              </Link>
              <Link href="/dashboard/admin" className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Geri
              </Link>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#16B24B] flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{profile?.full_name || 'Admin'}</p>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                  <div className="py-1.5">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-[#16B24B]/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Hesap Ayarları</p>
                        <p className="text-xs text-gray-400">Şifre ve profil ayarları</p>
                      </div>
                    </Link>
                    
                    <div className="h-px bg-gray-100 my-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-600">Çıkış Yap</p>
                        <p className="text-xs text-gray-400">Hesabınızdan çıkış yapın</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 mb-6">
            {/* Toplam Kullanıcı */}
            <div className="group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
            </div>
            
            {/* Aday */}
            <div className="group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Aday</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{stats.candidate}</p>
            </div>
            
            {/* Aracı */}
            <div className="group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#16B24B]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Aracı</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{stats.middleman}</p>
            </div>
            
            {/* Consultant */}
            <div className="group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#16B24B]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Consultant</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{stats.consultant}</p>
            </div>
            
            {/* Admin */}
            <div className="group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Admin</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{stats.admin}</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:flex-1">
              {/* Search */}
              <div className="flex-1 w-full lg:max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="İsim, email veya rol ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white transition-all"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div className="w-full lg:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol Filtresi</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'CANDIDATE', 'MIDDLEMAN', 'CONSULTANT', 'ADMIN'].map((role) => {
                    const roleLabels: Record<string, string> = {
                      'ALL': 'Tümü',
                      'CANDIDATE': 'Aday',
                      'MIDDLEMAN': 'Aracı',
                      'CONSULTANT': 'Consultant',
                      'ADMIN': 'Admin'
                    };

                    const roleColors: Record<string, string> = {
                      'ALL': 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      'CANDIDATE': 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
                      'MIDDLEMAN': 'bg-[#16B24B]/10 text-[#16B24B] hover:bg-[#16B24B]/20',
                      'CONSULTANT': 'bg-purple-50 text-purple-700 hover:bg-purple-100',
                      'ADMIN': 'bg-red-50 text-red-700 hover:bg-red-100'
                    };

                    const activeColors: Record<string, string> = {
                      'ALL': 'bg-gray-600 text-white',
                      'CANDIDATE': 'bg-yellow-500 text-white',
                      'MIDDLEMAN': 'bg-[#16B24B] text-white',
                      'CONSULTANT': 'bg-purple-500 text-white',
                      'ADMIN': 'bg-red-500 text-white'
                    };

                    return (
                      <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          roleFilter === role
                            ? `${activeColors[role]} shadow-md`
                            : `${roleColors[role]} border border-gray-200`
                        }`}
                      >
                        {roleLabels[role]}
                      </button>
                    );
                  })}
                </div>
              </div>
              </div>
              {/* Yeni Kullanıcı Oluştur */}
              <div className="shrink-0">
                <button
                  onClick={() => {
                    setCreateEmail('');
                    setCreatePassword('');
                    setCreateFullName('');
                    setCreateRole('CONSULTANT');
                    setCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#16B24B] hover:bg-[#118836] shadow-sm hover:shadow-md transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Yeni Kullanıcı Oluştur
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300 text-[#16B24B] focus:ring-[#16B24B]" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
                      <div className="flex items-center gap-1">
                        İsim
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
                      <div className="flex items-center gap-1">
                        Rol
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const getRoleLabel = (role: string) => {
                        switch (role) {
                          case 'CANDIDATE': return 'Aday';
                          case 'MIDDLEMAN': return 'Aracı';
                          case 'CONSULTANT': return 'Consultant';
                          case 'ADMIN': return 'Admin';
                          default: return role;
                        }
                      };

                      const getStatusColor = (role: string) => {
                        switch (role) {
                          case 'CANDIDATE': return 'bg-yellow-100 text-yellow-700';
                          case 'MIDDLEMAN': return 'bg-[#16B24B]/20 text-[#16B24B]';
                          case 'CONSULTANT': return 'bg-purple-100 text-purple-700';
                          case 'ADMIN': return 'bg-red-100 text-red-700';
                          default: return 'bg-gray-100 text-gray-700';
                        }
                      };

                      return (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input type="checkbox" className="rounded border-gray-300 text-[#16B24B] focus:ring-[#16B24B]" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#16B24B] flex items-center justify-center text-white font-semibold text-sm">
                                {user.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.full_name || 'İsimsiz'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{getRoleLabel(user.role)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{user.email || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                              <svg className="w-3 h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 relative">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsActive(user.is_active !== undefined ? user.is_active : true);
                                  setNewPassword('');
                                  setEditModalOpen(true);
                                }}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <div className="relative" data-action-dropdown>
                                <button
                                  onClick={() => setActionDropdownOpen(actionDropdownOpen === user.id ? null : user.id)}
                                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                  data-action-dropdown
                                >
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </button>
                                {actionDropdownOpen === user.id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden" data-action-dropdown>
                                    <button
                                      onClick={() => handleToggleActive(user.id, user.is_active ?? true)}
                                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                      data-action-dropdown
                                    >
                                      {user.is_active === false ? 'Aktif Et' : 'Pasife Al'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-400 text-sm">
                          {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz kayıtlı kullanıcı yok'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

      {/* Edit User Modal */}
      {editModalOpen && selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Kullanıcı Düzenle</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedUser.full_name || selectedUser.email}</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#16B24B] flex items-center justify-center shadow-sm">
                    <span className="text-white text-lg font-bold">
                      {selectedUser.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedUser.full_name || 'İsimsiz'}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email || '-'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedUser.role === 'CANDIDATE' ? 'Aday' :
                       selectedUser.role === 'MIDDLEMAN' ? 'Aracı' :
                       selectedUser.role === 'CONSULTANT' ? 'Consultant' : 'Admin'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Şifre Değiştir
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni şifre (boş bırakılırsa değiştirilmez)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/50 transition-all bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 karakter. Boş bırakılırsa şifre değiştirilmez.
                </p>
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Üyelik Durumu
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={isActive === true}
                      onChange={() => setIsActive(true)}
                      className="w-4 h-4 text-[#16B24B] focus:ring-[#16B24B]"
                    />
                    <span className="text-sm text-gray-700">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={isActive === false}
                      onChange={() => setIsActive(false)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Pasif</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Pasif kullanıcılar sisteme giriş yapamaz.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isUpdating}
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!selectedUser) return;

                  setIsUpdating(true);
                  try {
                    // API route'unu beklediği request body type'ı
                    type UserUpdateRequest = {
                      password?: string;
                      isActive?: boolean;
                    };
                    
                    const updateData: UserUpdateRequest = {};
                    if (newPassword.trim() !== '') {
                      if (newPassword.length < 6) {
                        alert('Şifre minimum 6 karakter olmalıdır');
                        setIsUpdating(false);
                        return;
                      }
                      updateData.password = newPassword;
                    }
                    updateData.isActive = isActive;

                    const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(updateData),
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Güncelleme başarısız');
                    }

                    // Başarılı - modal'ı kapat ve sayfayı yenile
                    setEditModalOpen(false);
                    window.location.reload();
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Hata oluştu';
                    alert('Hata: ' + errorMessage);
                    setIsUpdating(false);
                  }
                }}
                disabled={isUpdating}
                className="px-6 py-2 text-sm font-medium text-white bg-[#16B24B] hover:bg-[#118836] rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Kullanıcı Oluştur Modal */}
      {createModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isCreating && setCreateModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Yeni Kullanıcı Oluştur</h2>
              <button
                onClick={() => !isCreating && setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                disabled={isCreating}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad</label>
                <input
                  type="text"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  placeholder="Örn. Ahmet Yılmaz"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/50 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="ornek@firma.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/50 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/50 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as 'ADMIN' | 'CONSULTANT' | 'MIDDLEMAN')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300/50 focus:border-blue-300/50 bg-white"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="CONSULTANT">Consultant</option>
                  <option value="MIDDLEMAN">Aracı (Middleman)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                disabled={isCreating}
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!createEmail.trim() || !createPassword.trim() || !createFullName.trim()) {
                    alert('Ad soyad, e-posta ve şifre alanları zorunludur.');
                    return;
                  }
                  if (createPassword.length < 6) {
                    alert('Şifre en az 6 karakter olmalıdır.');
                    return;
                  }
                  setIsCreating(true);
                  try {
                    const res = await fetch('/api/admin/users', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: createEmail.trim(),
                        password: createPassword,
                        full_name: createFullName.trim(),
                        role: createRole,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error(data.error || 'Kullanıcı oluşturulamadı');
                    }
                    setCreateModalOpen(false);
                    setCreateEmail('');
                    setCreatePassword('');
                    setCreateFullName('');
                    setCreateRole('CONSULTANT');
                    const usersRes = await fetch('/api/admin/users');
                    if (usersRes.ok) {
                      const d = await usersRes.json();
                      const list = d.users || [];
                      setUsers(list);
                      type UserWithRole = { role: string };
                      setStats({
                        total: list.length,
                        candidate: list.filter((u: UserWithRole) => u.role === 'CANDIDATE').length,
                        middleman: list.filter((u: UserWithRole) => u.role === 'MIDDLEMAN').length,
                        consultant: list.filter((u: UserWithRole) => u.role === 'CONSULTANT').length,
                        admin: list.filter((u: UserWithRole) => u.role === 'ADMIN').length,
                      });
                    }
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Kullanıcı oluşturulurken hata oluştu.');
                  } finally {
                    setIsCreating(false);
                  }
                }}
                disabled={isCreating}
                className="px-6 py-2 text-sm font-medium text-white bg-[#16B24B] hover:bg-[#118836] rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
