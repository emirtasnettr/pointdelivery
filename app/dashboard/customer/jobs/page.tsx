/**
 * Fırsatlar Detaylı Liste Sayfası
 * 
 * Müşterilerin tüm fırsatlarını detaylı olarak görüntüleyebileceği sayfa
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type JobStatus = 'ACTIVE' | 'CURRENT' | 'PAST' | 'ALL';
type JobType = 'FULL_TIME' | 'PART_TIME' | 'SEASONAL' | null;

interface JobPosting {
  id: string;
  customer_id: string;
  title: string;
  task: string | null;
  description: string | null;
  required_count: number;
  job_type: JobType;
  contract_start_date: string | null;
  contract_end_date: string | null;
  part_time_start_date: string | null;
  part_time_end_date: string | null;
  seasonal_period_months: number | null;
  monthly_budget_per_person: number | null;
  daily_budget_per_person: number | null;
  hourly_budget_per_person: number | null;
  working_hours: Record<string, { start: string; end: string }> | null;
  start_date: string | null;
  status: 'ACTIVE' | 'CURRENT' | 'PAST';
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function CustomerJobsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [activeFilter, setActiveFilter] = useState<JobStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [jobMenuOpen, setJobMenuOpen] = useState(false);
  const jobMenuRef = useRef<HTMLDivElement>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

        // Profil kontrolü
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileData || profileData.role !== 'CUSTOMER') {
          router.push('/');
          return;
        }

        setProfile(profileData);

        // İş ilanlarını al (tüm yeni alanlarla birlikte)
        const { data: jobs } = await supabase
          .from('job_postings')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        const jobsData = jobs || [];
        setJobPostings(jobsData);

        // İlk filtreleme
        filterJobs(jobsData, activeFilter, searchQuery);

        // Site logo'yu yükle
        try {
          const { data: settings } = await supabase
            .from('site_settings')
            .select('logo_url')
            .maybeSingle();
          
          if (settings?.logo_url) {
            setSiteLogo(settings.logo_url);
          }
        } catch (err) {
          console.log('Logo yüklenemedi:', err);
        }
      } catch (err: any) {
        setError(err.message || 'Veriler yüklenirken hata oluştu');
        console.error('Error loading data:', err);
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
      if (jobMenuRef.current && !jobMenuRef.current.contains(event.target as Node)) {
        setJobMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtreleme ve arama
  const filterJobs = (jobs: JobPosting[], filter: JobStatus, search: string = '') => {
    let filtered = jobs;

    if (filter !== 'ALL') {
      filtered = filtered.filter((job) => job.status === filter);
    }

    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((job) => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        const task = job.task?.toLowerCase() || '';
        return title.includes(searchLower) || description.includes(searchLower) || task.includes(searchLower);
      });
    }

    setFilteredJobs(filtered);
  };

  const handleFilterClick = (filter: JobStatus) => {
    setActiveFilter(filter);
    filterJobs(jobPostings, filter, searchQuery);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterJobs(jobPostings, activeFilter, query);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Onay Bekleyen
          </span>
        );
      case 'CURRENT':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Aktif Fırsat
          </span>
        );
      case 'PAST':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Geçmiş İşe Alım
          </span>
        );
      default:
        return null;
    }
  };

  const getJobTypeLabel = (jobType: JobType) => {
    switch (jobType) {
      case 'FULL_TIME':
        return 'Tam Zamanlı';
      case 'PART_TIME':
        return 'Part-time';
      case 'SEASONAL':
        return 'Dönemsel';
      default:
        return '-';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const calculateMonthlyCost = (job: JobPosting) => {
    if (!job.monthly_budget_per_person || !job.required_count) return null;
    return job.monthly_budget_per_person * job.required_count;
  };

  const calculatePartTimeTotalHours = (job: JobPosting): number => {
    if (!job.working_hours || !job.part_time_start_date || !job.part_time_end_date) return 0;
    
    const startDate = new Date(job.part_time_start_date);
    const endDate = new Date(job.part_time_end_date);
    const days: string[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push(dateStr);
    }
    
    let totalMinutes = 0;
    days.forEach(day => {
      const hours = job.working_hours?.[day];
      if (hours?.start && hours?.end) {
        const [startH, startM] = hours.start.split(':').map(Number);
        const [endH, endM] = hours.end.split(':').map(Number);
        const startTotalMinutes = startH * 60 + startM;
        const endTotalMinutes = endH * 60 + endM;
        totalMinutes += endTotalMinutes - startTotalMinutes;
      }
    });
    
    return totalMinutes / 60; // Toplam saat
  };

  const calculatePartTimeTotalCost = (job: JobPosting) => {
    if (!job.hourly_budget_per_person || !job.required_count) return null;
    const totalHours = calculatePartTimeTotalHours(job);
    if (totalHours === 0) return null;
    return job.hourly_budget_per_person * job.required_count * totalHours;
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F9FE' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/customer" className="flex items-center">
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt="Site Logo"
                  className="h-10 w-auto max-w-[200px] object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">J</span>
                </div>
              )}
            </Link>

            {/* Fırsat Yönetimi Dropdown */}
            <div className="relative" ref={jobMenuRef}>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setJobMenuOpen(!jobMenuOpen);
                  }}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  Fırsat Yönetimi
                  <svg className={`w-4 h-4 transition-transform ${jobMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {jobMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                  <div className="py-1.5">
                    <Link
                      href="/dashboard/customer/jobs/create"
                      onClick={() => setJobMenuOpen(false)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Yeni Fırsat Oluştur</p>
                        <p className="text-xs text-gray-400">Yeni fırsat ekle</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/customer"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard'a Dön
            </Link>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {profile?.full_name?.charAt(0) || 'M'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{profile?.full_name || 'Müşteri'}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                <div className="py-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/dashboard/settings');
                    }}
                    className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Hesap Ayarları</p>
                      <p className="text-xs text-gray-400">Şifre ve profil ayarları</p>
                    </div>
                  </button>
                  
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fırsatlar - Detaylı Liste</h1>
          <p className="text-sm text-gray-600">
            Tüm fırsatlarınızın detaylı bilgilerini buradan görüntüleyebilirsiniz
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => handleFilterClick('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => handleFilterClick('ACTIVE')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'ACTIVE'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Onay Bekleyen Fırsatlar
          </button>
          <button
            onClick={() => handleFilterClick('CURRENT')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'CURRENT'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Aktif Fırsatlar
          </button>
          <button
            onClick={() => handleFilterClick('PAST')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'PAST'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Geçmiş İşe Alımlar
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Ara (Başlık, Görev, Açıklama...)"
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
            <div className="flex items-center">
              <span className="text-xl mr-3">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Fırsatlar Detaylı Kartlar */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-sm">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz fırsat bulunmuyor'}
              </div>
            </div>
          ) : (
            filteredJobs
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      {job.task && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Görev:</span> {job.task}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">İş Tipi:</span> {getJobTypeLabel(job.job_type)}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/customer/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Detayları Gör
                    </Link>
                  </div>

                  {job.description && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{job.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kişi Sayısı</p>
                      <p className="text-sm font-medium text-gray-900">{job.required_count} kişi</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">İlk İş Günü</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(job.start_date)}</p>
                    </div>
                    {job.job_type === 'FULL_TIME' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Sözleşme Başlangıç</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(job.contract_start_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Sözleşme Bitiş</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(job.contract_end_date)}</p>
                        </div>
                      </>
                    )}
                    {job.job_type === 'PART_TIME' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Başlangıç Tarihi</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(job.part_time_start_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Bitiş Tarihi</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(job.part_time_end_date)}</p>
                        </div>
                      </>
                    )}
                    {job.job_type === 'SEASONAL' && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Dönemsel Süre</p>
                        <p className="text-sm font-medium text-gray-900">{job.seasonal_period_months} ay</p>
                      </div>
                    )}
                  </div>

                  {/* Bütçe Bilgileri */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Maliyet Bilgileri</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {job.job_type === 'FULL_TIME' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Aylık Kişi Başı Bütçe</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(job.monthly_budget_per_person)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Aylık Toplam Maliyet</p>
                            <p className="text-sm font-semibold text-blue-600">{formatCurrency(calculateMonthlyCost(job) || 0)}</p>
                          </div>
                        </>
                      )}
                      {job.job_type === 'PART_TIME' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Saatlik Kişi Başı Bütçe</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(job.hourly_budget_per_person)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Toplam Maliyet</p>
                            <p className="text-sm font-semibold text-blue-600">{formatCurrency(calculatePartTimeTotalCost(job) || 0)}</p>
                          </div>
                        </>
                      )}
                      {job.job_type === 'SEASONAL' && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Aylık Kişi Başı Bütçe</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(job.monthly_budget_per_person)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Aylık Toplam Maliyet</p>
                            <p className="text-sm font-semibold text-blue-600">{formatCurrency(calculateMonthlyCost(job) || 0)}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Oluşturulma Tarihi</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(job.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {(() => {
                const start = (currentPage - 1) * itemsPerPage + 1;
                const end = Math.min(currentPage * itemsPerPage, filteredJobs.length);
                return `${start} - ${end} arası, toplam ${filteredJobs.length} kayıt`;
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
                const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
                if (totalPages <= 1) return null;
                
                return (
                  <>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </>
                );
              })()}
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredJobs.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(filteredJobs.length / itemsPerPage)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(Math.ceil(filteredJobs.length / itemsPerPage))}
                disabled={currentPage >= Math.ceil(filteredJobs.length / itemsPerPage)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &gt;&gt;
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
