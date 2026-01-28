/**
 * Admin Dashboard Ana Sayfası
 * 
 * Admin'lerin dashboard ana sayfası - Genel bakış ve istatistikler
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    total: 0,
    candidate: 0,
    middleman: 0,
    consultant: 0,
    admin: 0,
  });
  const [showWelcome, setShowWelcome] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  // Welcome card'ı 5 saniye sonra otomatik kapat
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

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

        // API route üzerinden verileri al (RLS sorunu nedeniyle)
        let response: Response;
        try {
          response = await fetch('/api/admin/users');
        } catch (fetchError) {
          console.error('Network error:', fetchError);
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin veya sayfayı yenileyin.';
          setError(errorMessage);
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          
          // 403 = Admin değil, ana sayfaya yönlendir
          if (response.status === 403) {
            router.push('/');
            return;
          }
          
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const usersList = data.users || [];
        const adminProfile = data.adminProfile || null;
        
        // Admin profilini set et
        if (adminProfile) {
          setProfile(adminProfile);
        }

        // Site logo'yu yükle (sadece admin için)
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (profile?.role === 'ADMIN') {
            const { data: settings, error: settingsError } = await supabase
              .from('site_settings')
              .select('logo_url')
              .maybeSingle();
            
            if (!settingsError && settings?.logo_url) {
              setSiteLogo(settings.logo_url);
            }
          }
        } catch (err) {
          // site_settings tablosu yoksa veya logo yoksa, varsayılan logo kullan
          console.log('Logo yüklenemedi, varsayılan kullanılacak');
        }

        // İstatistikleri hesapla
        if (usersList.length > 0) {
          // Type tanımı: usersList'teki her kullanıcı için
          type UserWithRole = { role: string; [key: string]: unknown };
          
          setStats({
            total: usersList.length,
            candidate: usersList.filter((u: UserWithRole) => u.role === 'CANDIDATE').length,
            middleman: usersList.filter((u: UserWithRole) => u.role === 'MIDDLEMAN').length,
            consultant: usersList.filter((u: UserWithRole) => u.role === 'CONSULTANT').length,
            admin: usersList.filter((u: UserWithRole) => u.role === 'ADMIN').length,
          });
          
          // Son kayıt olanları al (ilk 10)
          setRecentUsers(usersList.slice(0, 10));
        } else {
          setStats({
            total: 0,
            candidate: 0,
            middleman: 0,
            consultant: 0,
            admin: 0,
          });
          setRecentUsers([]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu';
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
        setRecentUsers(usersList.slice(0, 10));
      }

      setActionDropdownOpen(null);
    } catch (error) {
      console.error('Error toggling user status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Hata oluştu';
      alert('Hata oluştu: ' + errorMessage);
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsActive(user.is_active !== undefined ? user.is_active : true);
    setNewPassword('');
    setEditModalOpen(true);
  };

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  }, [supabase, router]);

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
            <Link href="/" className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pointdlogo.webp" alt="Point Delivery" className="w-auto" style={{ height: '42px', width: 'auto' }} />
            </Link>

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
          {/* Welcome Card */}
          {showWelcome && (
            <div className="relative mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="relative bg-[#16B24B]/5 rounded-2xl border border-[#16B24B]/20 p-6 text-gray-800 overflow-hidden">
                <button
                  onClick={() => setShowWelcome(false)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-md bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Kapat"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="relative z-10 pr-8">
                  <div className="flex items-center gap-3 mb-3">
<div className="w-10 h-10 rounded-xl bg-[#16B24B]/20 flex items-center justify-center">
                    <span className="text-xl">👋</span>
                  </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Hoş Geldiniz
                      </h2>
                      <p className="text-sm text-gray-600">{profile?.full_name || 'Admin'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Admin dashboard'unuza hoş geldiniz. Buradan tüm kullanıcıları yönetebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 mb-6">
            {/* Toplam Kullanıcı */}
            <div className="group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#16B24B]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="w-10 h-10 rounded-xl bg-[#16B24B]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="w-10 h-10 rounded-xl bg-[#16B24B]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Admin</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{stats.admin}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#16B24B]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Hızlı İşlemler
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Sık kullanılan işlemlere hızlı erişim</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/dashboard/admin/users"
                className="group p-5 rounded-xl bg-[#16B24B]/5 border border-[#16B24B]/20 hover:border-[#16B24B]/40 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#16B24B] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-[#16B24B] transition-colors">
                      Kullanıcı Yönetimi
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">Tüm kullanıcıları görüntüle, düzenle ve yönet</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#16B24B] transform group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          {/* Son Kayıt Olanlar */}
          <div className="bg-white rounded-xl border border-gray-200 mt-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Son Kayıt Olanlar</h3>
            </div>

            {/* Header Actions */}
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16B24B] focus:border-[#16B24B] text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Rapor İndir
                </button>
                <select className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <option>2024</option>
                  <option>2023</option>
                </select>
              </div>
            </div>

            {/* Table */}
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
                  {recentUsers
                    .filter(user => 
                      searchQuery === '' || 
                      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-400 text-sm">
                            {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz kayıtlı kullanıcı yok'}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      recentUsers
                        .filter(user => 
                          searchQuery === '' || 
                          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((user) => {
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
                                <div className="text-sm font-medium text-gray-900">{user.full_name || '-'}</div>
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
                                onClick={() => handleViewUser(user)}
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
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {recentUsers.filter(user => 
              searchQuery === '' || 
              user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  {(() => {
                    const filtered = recentUsers.filter(user => 
                      searchQuery === '' || 
                      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    const start = (currentPage - 1) * itemsPerPage + 1;
                    const end = Math.min(currentPage * itemsPerPage, filtered.length);
                    return `${start} - ${end} arası, toplam ${filtered.length} kayıt`;
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;
                  </button>
                  {(() => {
                    const filtered = recentUsers.filter(user => 
                      searchQuery === '' || 
                      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    const totalPages = Math.ceil(filtered.length / itemsPerPage);
                    if (totalPages <= 1) return null;
                    
                    return (
                      <>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-[#16B24B] text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          &gt;
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          &gt;&gt;
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16B24B]/30 focus:border-[#16B24B] transition-all bg-white"
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

                    // Başarılı - modal'ı kapat ve listeyi yenile
                    setEditModalOpen(false);
                    
                    // Listeyi yeniden yükle
                    const usersResponse = await fetch('/api/admin/users');
                    if (usersResponse.ok) {
                      const data = await usersResponse.json();
                      const usersList = data.users || [];
                      setRecentUsers(usersList.slice(0, 10));
                    }
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Hata oluştu';
                    alert('Hata: ' + errorMessage);
                    setIsUpdating(false);
                  } finally {
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
    </div>
  );
}
