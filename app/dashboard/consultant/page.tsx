/**
 * Consultant Dashboard Sayfası - Modern Tasarım
 * 
 * Consultant'ların dashboard'u - Aday Başvuru Yönetimi
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type ApplicationStatus = 'NEW_APPLICATION' | 'EVALUATION' | 'APPROVED' | 'REJECTED' | 'UPDATE_REQUIRED' | 'ALL';
type DocumentType = 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: 'APPROVED' | 'REJECTED' | null;
  profile_id: string;
  mime_type: string | null;
}

interface CandidateInfo {
  id: string;
  profile_id: string;
  experience_years: number | null;
  phone: string | null;
  email: string | null;
  national_id: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
  application_status: string | null;
  middleman_id: string | null;
}

interface Application {
  profile: Profile;
  candidateInfo: CandidateInfo | null;
  documents: Document[];
  applicationStatus: 'NEW_APPLICATION' | 'EVALUATION' | 'APPROVED' | 'REJECTED' | 'UPDATE_REQUIRED';
  middleman: { id: string; full_name: string } | null;
}

export default function ConsultantDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [activeFilter, setActiveFilter] = useState<ApplicationStatus>('EVALUATION');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stats, setStats] = useState({
    newApplication: 0,
    evaluation: 0,
    approved: 0,
    rejected: 0,
    updateRequired: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [candidateMenuOpen, setCandidateMenuOpen] = useState(false);
  const candidateMenuRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Welcome card'ı 5 saniye sonra otomatik kapat
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const consultantLoginRedirect = '/auth/login?redirect=/dashboard/consultant';

  // Tüm başvuruları yükle
  useEffect(() => {
    async function loadData() {
      try {
        let {
          data: { user },
        } = await supabase.auth.getUser();

        // Girişten hemen sonra session bazen bir tick gecikmeli olabiliyor; kısa retry
        if (!user) {
          await new Promise((r) => setTimeout(r, 300));
          const result = await supabase.auth.getUser();
          user = result.data.user;
        }

        if (!user) {
          router.push(consultantLoginRedirect);
          return;
        }

        // Profil ve rol kontrolü
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileData || !['CONSULTANT', 'ADMIN'].includes(profileData.role)) {
          router.push(consultantLoginRedirect);
          return;
        }

        setProfile(profileData);

        // Tüm aday profillerini al
        const { data: candidates } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'CANDIDATE')
          .order('created_at', { ascending: false });

        if (!candidates) {
          setApplications([]);
          setFilteredApplications([]);
          setLoading(false);
          return;
        }

        // Her aday için bilgileri ve belgeleri al
        const applicationsData: Application[] = await Promise.all(
          candidates.map(async (candidate) => {
            const { data: candidateInfo } = await supabase
              .from('candidate_info')
              .select('id, profile_id, phone, email, national_id, experience_years')
              .eq('profile_id', candidate.id)
              .single();

            // Tüm belgeleri göster (NULL, APPROVED, REJECTED)
            const { data: documents } = await supabase
              .from('documents')
              .select('*')
              .eq('profile_id', candidate.id)
              .order('created_at', { ascending: false });

            let middleman = null;
            if (candidate.middleman_id) {
              const { data: middlemanProfile } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', candidate.middleman_id)
                .single();
              
              if (middlemanProfile) {
                middleman = {
                  id: middlemanProfile.id,
                  full_name: middlemanProfile.full_name,
                };
              }
            }

            const applicationStatus = (candidate.application_status || 'NEW_APPLICATION') as 
              'NEW_APPLICATION' | 'EVALUATION' | 'APPROVED' | 'REJECTED' | 'UPDATE_REQUIRED';

            return {
              profile: candidate,
              candidateInfo: candidateInfo || null,
              documents: documents || [],
              applicationStatus,
              middleman,
            };
          })
        );

        setApplications(applicationsData);

        // İstatistikleri hesapla
        const statsData = {
          newApplication: applicationsData.filter((app) => app.applicationStatus === 'NEW_APPLICATION').length,
          evaluation: applicationsData.filter((app) => app.applicationStatus === 'EVALUATION').length,
          approved: applicationsData.filter((app) => app.applicationStatus === 'APPROVED').length,
          rejected: applicationsData.filter((app) => app.applicationStatus === 'REJECTED').length,
          updateRequired: applicationsData.filter((app) => app.applicationStatus === 'UPDATE_REQUIRED').length,
          total: applicationsData.length,
        };
        setStats(statsData);

        // İlk filtreleme
        filterApplications(applicationsData, activeFilter, searchQuery);

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
      if (candidateMenuRef.current && !candidateMenuRef.current.contains(event.target as Node)) {
        setCandidateMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  };

  // Filtreleme ve arama
  const filterApplications = (apps: Application[], filter: ApplicationStatus, search: string = '') => {
    let filtered = apps;

    if (filter !== 'ALL') {
      filtered = filtered.filter((app) => app.applicationStatus === filter);
    }

    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((app) => {
        const fullName = app.profile.full_name?.toLowerCase() || '';
        const phone = app.candidateInfo?.phone?.toLowerCase() || '';
        const email = app.candidateInfo?.email?.toLowerCase() || '';
        const nationalId = app.candidateInfo?.national_id?.toLowerCase() || '';
        const middlemanName = app.middleman?.full_name?.toLowerCase() || '';
        
        return (
          fullName.includes(searchLower) ||
          phone.includes(searchLower) ||
          email.includes(searchLower) ||
          nationalId.includes(searchLower) ||
          middlemanName.includes(searchLower)
        );
      });
    }

    setFilteredApplications(filtered);
  };

  const handleFilterClick = (filter: ApplicationStatus) => {
    setActiveFilter(filter);
    filterApplications(applications, filter, searchQuery);
    setCurrentPage(1); // Filtre değiştiğinde sayfayı sıfırla
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterApplications(applications, activeFilter, query);
    setCurrentPage(1); // Arama yapıldığında sayfayı sıfırla
  };

  const handleViewApplication = (applicationId: string) => {
    router.push(`/dashboard/consultant/applications/${applicationId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW_APPLICATION':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#16B24B]/20 text-[#16B24B]">
            Yeni Başvuru
          </span>
        );
      case 'EVALUATION':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            Değerlendirme
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Onaylandı
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Reddedildi
          </span>
        );
      case 'UPDATE_REQUIRED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            Güncelleme
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

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
            <div className="flex items-center gap-6">
              <Link href="/" className="inline-flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/pointdlogo.webp" alt="Point Delivery" className="w-auto" style={{ height: '42px', width: 'auto' }} />
              </Link>

              {/* Aday Yönetimi Dropdown */}
              <div className="relative" ref={candidateMenuRef}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setCandidateMenuOpen(!candidateMenuOpen);
                    }}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                  >
                    Aday Yönetimi
                    <svg className={`w-4 h-4 transition-transform ${candidateMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {candidateMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                    <div className="py-1.5">
                      <Link
                        href="/dashboard/consultant"
                        onClick={() => setCandidateMenuOpen(false)}
                        className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-md bg-[#16B24B]/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Aday Yönetimi Ana Sayfa</p>
                          <p className="text-xs text-gray-400">Dashboard</p>
                        </div>
                      </Link>
                      
                      <div className="h-px bg-gray-100 my-1"></div>

                      <Link
                        href="/applications"
                        onClick={() => setCandidateMenuOpen(false)}
                        className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tüm Başvurular</p>
                          <p className="text-xs text-gray-400">Başvuru listesi ve yönetimi</p>
                        </div>
                      </Link>

                      <Link
                        href="/documents/review"
                        onClick={() => setCandidateMenuOpen(false)}
                        className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Belge İnceleme</p>
                          <p className="text-xs text-gray-400">Belgeleri gözden geçir</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#16B24B] flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {profile?.full_name?.charAt(0) || 'C'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{profile?.full_name || 'Consultant'}</p>
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
                    <p className="text-sm text-gray-600">{profile?.full_name || 'Consultant'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Aday başvurularını yönetebilir, belgeleri inceleyebilir ve onaylayabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-5 mb-6">
          {/* Yeni Başvuru */}
          <button
            onClick={() => handleFilterClick('NEW_APPLICATION')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'NEW_APPLICATION' 
                ? 'ring-2 ring-blue-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#16B24B]/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Yeni Başvuru</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.newApplication}</p>
          </button>

          {/* Değerlendirme */}
          <button
            onClick={() => handleFilterClick('EVALUATION')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'EVALUATION' 
                ? 'ring-2 ring-yellow-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Değerlendirme</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.evaluation}</p>
          </button>

          {/* Onaylanan */}
          <button
            onClick={() => handleFilterClick('APPROVED')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'APPROVED' 
                ? 'ring-2 ring-green-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Onaylanan</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.approved}</p>
          </button>

          {/* Reddedilen */}
          <button
            onClick={() => handleFilterClick('REJECTED')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'REJECTED' 
                ? 'ring-2 ring-red-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Reddedilen</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.rejected}</p>
          </button>

          {/* Güncelleme */}
          <button
            onClick={() => handleFilterClick('UPDATE_REQUIRED')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'UPDATE_REQUIRED' 
                ? 'ring-2 ring-orange-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Güncelleme</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.updateRequired}</p>
          </button>

          {/* Toplam */}
          <button
            onClick={() => handleFilterClick('ALL')}
            className={`group bg-[#FDFDFD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              activeFilter === 'ALL' 
                ? 'ring-2 ring-indigo-300' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#16B24B]/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Toplam</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
          </button>
        </div>


        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
            <div className="flex items-center">
              <span className="text-xl mr-3">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Aday Başvuru Yönetimi */}
        <div className="bg-white rounded-xl border border-gray-200 mt-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Aday Başvuru Yönetimi</h3>
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
                placeholder="Ara (Ad Soyad, Telefon, E-posta, TC Kimlik, Aracı...)"
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TC Kimlik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Belgeler
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
                {filteredApplications
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="text-gray-400 text-sm">
                          {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz başvuru bulunmuyor'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((app) => {
                        const documentTypes: DocumentType[] = ['CV', 'POLICE', 'RESIDENCE', 'KIMLIK', 'DIPLOMA'];
                        const totalDocuments = documentTypes.length;
                        const uploadedDocuments = app.documents.length;
                        const approvedDocuments = app.documents.filter((doc) => doc.status === 'APPROVED').length;

                        return (
                          <tr key={app.profile.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input type="checkbox" className="rounded border-gray-300 text-[#16B24B] focus:ring-[#16B24B]" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#16B24B] flex items-center justify-center text-white font-semibold text-sm">
                                  {app.profile.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{app.profile.full_name || 'İsimsiz'}</div>
                                  {app.middleman && (
                                    <div className="text-xs text-gray-500">Aracı: {app.middleman.full_name}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{app.candidateInfo?.phone || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{app.candidateInfo?.email || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{app.candidateInfo?.national_id || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600 font-medium">
                                {approvedDocuments} / {uploadedDocuments} / {totalDocuments}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(app.applicationStatus)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleViewApplication(app.profile.id)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredApplications.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                {(() => {
                  const start = (currentPage - 1) * itemsPerPage + 1;
                  const end = Math.min(currentPage * itemsPerPage, filteredApplications.length);
                  return `${start} - ${end} arası, toplam ${filteredApplications.length} kayıt`;
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
                  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
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
                    </>
                  );
                })()}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredApplications.length / itemsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(filteredApplications.length / itemsPerPage)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &gt;
                </button>
                <button
                  onClick={() => setCurrentPage(Math.ceil(filteredApplications.length / itemsPerPage))}
                  disabled={currentPage >= Math.ceil(filteredApplications.length / itemsPerPage)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &gt;&gt;
                </button>
              </div>
            </div>
          )}
        </div>
        </main>
    </div>
  );
}

