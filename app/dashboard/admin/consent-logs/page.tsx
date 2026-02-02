'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface ConsentLog {
  id: string;
  user_id: string;
  user_email: string;
  consent_type: string;
  consent_given: boolean;
  consent_text_version: string;
  ip_address: string;
  user_agent: string;
  metadata: any;
  created_at: string;
}

const CONSENT_TYPE_LABELS: Record<string, string> = {
  KVKK: 'KVKK Aydınlatma Metni',
  SMS_EMAIL_MARKETING: 'SMS/E-posta Pazarlama',
  PRIVACY_POLICY: 'Gizlilik Politikası',
  TERMS_OF_SERVICE: 'Kullanım Koşulları',
  COOKIE_POLICY: 'Çerez Politikası',
};

const DATE_FILTERS = [
  { value: 'all', label: 'Tüm Zamanlar' },
  { value: '7', label: 'Son 7 Gün' },
  { value: '30', label: 'Son 30 Gün' },
  { value: '90', label: 'Son 90 Gün' },
];

export default function ConsentLogsPage() {
  const router = useRouter();
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [logs, setLogs] = useState<ConsentLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ConsentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Filters
  const [searchEmail, setSearchEmail] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Selected log for detail view
  const [selectedLog, setSelectedLog] = useState<ConsentLog | null>(null);

  // Dropdown dışına tıklama kontrolü
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchEmail, filterType, filterDate, filterStatus]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı kontrolü
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Profil bilgisini al
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData || profileData.role !== 'ADMIN') {
        router.push('/');
        return;
      }

      setProfile(profileData);
      
      const { data, error } = await supabase
        .from('consent_logs' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLogs(data || []);
    } catch (err: any) {
      console.error('Consent logs fetch error:', err);
      setError(err.message || 'Onay kayıtları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Email filter
    if (searchEmail.trim()) {
      filtered = filtered.filter(log => 
        log.user_email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.consent_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      const statusBool = filterStatus === 'given';
      filtered = filtered.filter(log => log.consent_given === statusBool);
    }

    // Date filter
    if (filterDate !== 'all') {
      const days = parseInt(filterDate);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(log => new Date(log.created_at) >= cutoffDate);
    }

    setFilteredLogs(filtered);
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Email', 'Onay Türü', 'Durum', 'IP Adresi', 'Versiyon', 'Tarih'];
    const rows = filteredLogs.map(log => [
      log.user_email,
      CONSENT_TYPE_LABELS[log.consent_type] || log.consent_type,
      log.consent_given ? 'Onaylandı' : 'Reddedildi',
      log.ip_address,
      log.consent_text_version,
      new Date(log.created_at).toLocaleString('tr-TR'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kvkk-onaylari-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseUserAgent = (ua: string) => {
    if (!ua || ua === 'unknown') return 'Bilinmiyor';
    
    // Simple parsing
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Linux')) return 'Linux';
    
    return ua.substring(0, 50) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#16B24B]/30 border-t-[#16B24B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Onay kayıtları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/dashboard/admin" className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pointdlogo.webp" alt="Point Delivery" className="w-auto" style={{ height: '42px', width: 'auto' }} />
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard/admin"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#16B24B] hover:bg-[#16B24B]/5 rounded-lg transition-colors"
              >
                Anasayfa
              </Link>
              <Link
                href="/dashboard/admin/users"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#16B24B] hover:bg-[#16B24B]/5 rounded-lg transition-colors"
              >
                Kullanıcılar
              </Link>
              <Link
                href="/dashboard/admin/consent-logs"
                className="px-3 py-2 text-sm font-medium text-[#16B24B] bg-[#16B24B]/5 rounded-lg"
              >
                KVKK Onayları
              </Link>
            </nav>
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KVKK Onay Kayıtları</h1>
              <p className="text-sm text-gray-600 mt-1">
                Kullanıcıların verdiği yasal onayların kaydı
              </p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#16B24B] text-white rounded-lg hover:bg-[#118836] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel İndir
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                <p className="text-sm text-gray-500">Toplam Kayıt</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => l.consent_type === 'KVKK' && l.consent_given).length}
                </p>
                <p className="text-sm text-gray-500">KVKK Onayı</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => l.consent_type === 'SMS_EMAIL_MARKETING' && l.consent_given).length}
                </p>
                <p className="text-sm text-gray-500">Pazarlama Onayı</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(logs.map(l => l.user_email)).size}
                </p>
                <p className="text-sm text-gray-500">Benzersiz Kullanıcı</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Ara</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="email@ornek.com"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16B24B] focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Onay Türü</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16B24B] focus:border-transparent text-sm"
              >
                <option value="all">Tümü</option>
                {Object.entries(CONSENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16B24B] focus:border-transparent text-sm"
              >
                <option value="all">Tümü</option>
                <option value="given">Onaylandı</option>
                <option value="rejected">Reddedildi</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16B24B] focus:border-transparent text-sm"
              >
                {DATE_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>{filter.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{filteredLogs.length}</span> kayıt gösteriliyor
              {filteredLogs.length !== logs.length && (
                <span className="text-gray-400"> (toplam {logs.length})</span>
              )}
            </p>
            {(searchEmail || filterType !== 'all' || filterStatus !== 'all' || filterDate !== 'all') && (
              <button
                onClick={() => {
                  setSearchEmail('');
                  setFilterType('all');
                  setFilterStatus('all');
                  setFilterDate('all');
                }}
                className="text-sm text-[#16B24B] hover:text-[#118836] font-medium"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Onay Türü</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Adresi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Cihaz</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-medium">Kayıt bulunamadı</p>
                      <p className="text-sm mt-1">Henüz onay kaydı yok veya filtrelerinize uygun kayıt bulunamadı.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{log.user_email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.consent_type === 'KVKK' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {CONSENT_TYPE_LABELS[log.consent_type] || log.consent_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.consent_given ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Onaylandı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reddedildi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 font-mono">{log.ip_address || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{parseUserAgent(log.user_agent)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDate(log.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-[#16B24B] hover:text-[#118836] text-sm font-medium"
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Onay Detayı</h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedLog.user_email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">User ID</p>
                    <p className="text-sm text-gray-900 mt-1 font-mono text-xs">{selectedLog.user_id}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Onay Türü</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {CONSENT_TYPE_LABELS[selectedLog.consent_type] || selectedLog.consent_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Durum</p>
                    <p className="text-sm mt-1">
                      {selectedLog.consent_given ? (
                        <span className="text-green-600 font-medium">Onaylandı</span>
                      ) : (
                        <span className="text-red-600 font-medium">Reddedildi</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Metin Versiyonu</p>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{selectedLog.consent_text_version}</p>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-3">Yasal Delil Bilgileri</p>
                  
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500">IP Adresi</p>
                      <p className="text-sm text-gray-900 font-mono">{selectedLog.ip_address || 'Bilinmiyor'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500">Tarayıcı / Cihaz</p>
                      <p className="text-sm text-gray-900 break-all">{selectedLog.user_agent || 'Bilinmiyor'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500">Onay Tarihi</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedLog.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Ek Bilgiler (Metadata)</p>
                    <pre className="text-xs bg-gray-100 rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
