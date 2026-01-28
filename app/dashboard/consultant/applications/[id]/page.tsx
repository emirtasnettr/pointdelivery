/**
 * Başvuru Detay Sayfası
 * 
 * Consultant'ların başvuru detaylarını görüntüleyip işlem yapabileceği sayfa
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import DocumentControl from '@/components/document-control';
import ApplicationDecisionNew from '@/components/application-decision-new';
import DeleteApplicationButton from '@/components/delete-application-button';

type DocumentType = 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: 'APPROVED' | 'REJECTED' | null;
  profile_id: string;
  mime_type: string | null;
  created_at: string;
  review_notes: string | null;
}

interface CandidateInfo {
  id: string;
  profile_id: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  national_id: string | null;
  address: string | null;
  date_of_birth: string | null;
  education_level: string | null;
  experience_years: number | null;
  skills: string[] | null;
  languages: any[] | null;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  application_status: string | null;
  middleman_id?: string | null;
}

interface Application {
  profile: Profile;
  candidateInfo: CandidateInfo | null;
  documents: Document[];
  applicationStatus: 'NEW_APPLICATION' | 'EVALUATION' | 'APPROVED' | 'REJECTED' | 'UPDATE_REQUIRED';
  middleman: { id: string; full_name: string | null } | null;
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const profileId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [candidateMenuOpen, setCandidateMenuOpen] = useState(false);
  const candidateMenuRef = useRef<HTMLDivElement>(null);

  // Tüm belgelerin reddedilip reddedilmediğini kontrol et
  const canDelete = application ? 
    application.documents.length > 0 && 
    application.documents.every((doc) => doc.status === 'REJECTED') : false;

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

        // Profil ve rol kontrolü
        const { data: consultantProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!consultantProfile || !['CONSULTANT', 'ADMIN'].includes(consultantProfile.role)) {
          router.push('/');
          return;
        }

        setProfile(consultantProfile);

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

        // Aday profilini al
        const { data: candidateProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .eq('role', 'CANDIDATE')
          .single();

        if (!candidateProfile) {
          setError('Başvuru bulunamadı');
          setLoading(false);
          return;
        }

        // Aday bilgilerini al
        const { data: candidateInfo } = await supabase
          .from('candidate_info')
          .select('*')
          .eq('profile_id', profileId)
          .single();

        // Tüm belgeleri al (NULL, APPROVED, REJECTED)
        const { data: documents } = await supabase
          .from('documents')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        // Aday bir aracı (middleman) tarafından eklendiyse middleman bilgisini al
        let middleman: { id: string; full_name: string | null } | null = null;
        if (candidateProfile?.middleman_id) {
          const { data: middlemanProfile } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', candidateProfile.middleman_id)
            .eq('role', 'MIDDLEMAN')
            .maybeSingle();

          if (middlemanProfile) {
            middleman = { id: middlemanProfile.id, full_name: middlemanProfile.full_name ?? null };
          }
        }

        const applicationStatus = (candidateProfile.application_status || 'NEW_APPLICATION') as
          'NEW_APPLICATION' | 'EVALUATION' | 'APPROVED' | 'REJECTED' | 'UPDATE_REQUIRED';

        const applicationData = {
          profile: candidateProfile,
          candidateInfo: candidateInfo || null,
          documents: documents || [],
          applicationStatus,
          middleman,
        };
        
        setApplication(applicationData);
      } catch (err: any) {
        setError(err.message || 'Veriler yüklenirken hata oluştu');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Supabase Realtime subscription - belgelerdeki değişiklikleri dinle
    const channel = supabase
      .channel(`documents:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `profile_id=eq.${profileId}`,
        },
        async (payload) => {
          console.log('Document change detected:', payload);
          // Sadece belgeleri yeniden yükle
          try {
            // Tüm belgeleri al (NULL, APPROVED, REJECTED)
            const { data: documents } = await supabase
              .from('documents')
              .select('*')
              .eq('profile_id', profileId)
              .order('created_at', { ascending: false });

            setApplication((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                documents: documents || [],
              };
            });
          } catch (err) {
            console.error('Error reloading documents:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase, profileId]);

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

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  }, [supabase, router]);

  const handleDocumentUpdate = () => {
    // Sayfayı yenile
    window.location.reload();
  };

  const handleApplicationUpdate = () => {
    // Sayfayı yenile
    window.location.reload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW_APPLICATION':
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm">
            YENİ BAŞVURU
          </span>
        );
      case 'EVALUATION':
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-lg shadow-sm">
            DEĞERLENDİRME
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm">
            ONAYLANDI
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm">
            REDDEDİLDİ
          </span>
        );
      case 'UPDATE_REQUIRED':
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm">
            BİLGİ/EVRAK GÜNCELLEME
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-semibold rounded-lg shadow-sm">
            {status}
          </span>
        );
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'CV':
        return 'CV';
      case 'POLICE':
        return 'Sabıka Kaydı';
      case 'RESIDENCE':
        return 'İkametgah';
      case 'KIMLIK':
        return 'Kimlik Belgesi';
      case 'DIPLOMA':
        return 'Diploma';
      default:
        return type;
    }
  };

  const getDocumentTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'CV':
        return '📄';
      case 'POLICE':
        return '🔒';
      case 'RESIDENCE':
        return '🏠';
      case 'KIMLIK':
        return '🆔';
      case 'DIPLOMA':
        return '🎓';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
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

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Başvuru bulunamadı'}</p>
          <Link
            href="/dashboard/consultant"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    );
  }

  const documentTypes: DocumentType[] = ['CV', 'POLICE', 'RESIDENCE', 'KIMLIK', 'DIPLOMA'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
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
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Üst Bölüm: Başlık, Statü, Karar Butonları ve Sil Butonu */}
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 rounded-2xl border border-gray-200/60 shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between gap-6">
            {/* Sol: Başlık ve Statü */}
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white text-xl font-bold">
                  {application.profile.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {application.profile.full_name || 'İsimsiz'}
                  </h1>
                  <div>
                    {getStatusBadge(application.applicationStatus)}
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  ID: <span className="font-mono">{application.profile.id.slice(0, 8)}...</span>
                </p>
              </div>
            </div>

            {/* Sağ: Karar Butonları ve Sil Butonu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ApplicationDecisionNew
                application={application}
                onUpdate={handleApplicationUpdate}
              />
              {application.applicationStatus !== 'UPDATE_REQUIRED' && (
                <DeleteApplicationButton
                  profileId={application.profile.id}
                  candidateName={application.profile.full_name || 'İsimsiz'}
                  canDelete={canDelete}
                  onDelete={() => {
                    router.push('/dashboard/consultant');
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Ana İçerik: Yatay Düzen */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="grid grid-cols-12 gap-6">
            {/* Sol: Aday Bilgileri (4 kolon) */}
            <div className="col-span-12 lg:col-span-5 border-r-0 lg:border-r border-gray-200 pr-0 lg:pr-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-xl -mx-5 -mt-5 mb-6 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">Aday Bilgileri</h2>
                </div>
              </div>

              <div className="space-y-4">
                {/* Kişisel Bilgiler */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Kişisel Bilgiler
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                        Ad Soyad
                      </label>
                      <p className="text-gray-900 font-bold">
                        {application.profile.full_name || '-'}
                      </p>
                    </div>
                    {application.candidateInfo?.date_of_birth && (
                      <div>
                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                          Doğum Tarihi
                        </label>
                        <p className="text-gray-900 font-medium">
                          {new Date(application.candidateInfo.date_of_birth).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    )}
                    {application.candidateInfo?.national_id && (
                      <div>
                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                          TC Kimlik No
                        </label>
                        <p className="text-gray-900 font-medium font-mono">
                          {application.candidateInfo.national_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* İletişim Bilgileri */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <h3 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    İletişim Bilgileri
                  </h3>
                  <div className="space-y-2 text-sm">
                    {application.candidateInfo?.email && (
                      <div>
                        <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                          E-posta
                        </label>
                        <p className="text-gray-900 font-medium break-all">
                          {application.candidateInfo.email}
                        </p>
                      </div>
                    )}
                    {application.candidateInfo?.phone && (
                      <div>
                        <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                          Telefon
                        </label>
                        <p className="text-gray-900 font-medium">
                          {application.candidateInfo.phone}
                        </p>
                      </div>
                    )}
                    {application.candidateInfo?.city && application.candidateInfo?.district && (
                      <div>
                        <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                          Konum
                        </label>
                        <p className="text-gray-900 font-medium">
                          {application.candidateInfo.city} / {application.candidateInfo.district}
                        </p>
                      </div>
                    )}
                    {application.candidateInfo?.address && (
                      <div>
                        <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                          Adres
                        </label>
                        <p className="text-gray-900 text-xs leading-relaxed">
                          {application.candidateInfo.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Eğitim ve Deneyim */}
                {(application.candidateInfo?.education_level || (application.candidateInfo && application.candidateInfo.experience_years !== null)) && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Eğitim ve Deneyim
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {application.candidateInfo?.education_level && (
                        <div>
                          <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                            Eğitim Seviyesi
                          </label>
                          <p className="text-gray-900 font-medium">
                            {application.candidateInfo.education_level}
                          </p>
                        </div>
                      )}
                      {application.candidateInfo && application.candidateInfo.experience_years !== null && (
                        <div>
                          <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                            Deneyim Yılı
                          </label>
                          <p className="text-gray-900 font-bold text-lg">
                            {application.candidateInfo.experience_years} yıl
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Beceriler */}
                {application.candidateInfo?.skills && Array.isArray(application.candidateInfo.skills) && application.candidateInfo.skills.length > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                    <h3 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Beceriler
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {application.candidateInfo.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diller */}
                {application.candidateInfo?.languages && Array.isArray(application.candidateInfo.languages) && application.candidateInfo.languages.length > 0 && (
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                    <h3 className="text-sm font-bold text-teal-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Diller
                    </h3>
                    <div className="space-y-2">
                      {application.candidateInfo.languages.map((lang: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-teal-200">
                          <span className="text-sm font-medium text-gray-900">{lang.name || 'Bilinmeyen Dil'}</span>
                          {lang.level && (
                            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-semibold">
                              {lang.level}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aracı Bilgisi (varsa) */}
                {application.middleman && (
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Aracı
                    </h3>
                    <div className="text-sm">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Aracı Ad Soyad
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {application.middleman.full_name || 'Belirtilmemiş'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: <span className="font-mono">{application.middleman.id.slice(0, 8)}...</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ: Belgeler (7 kolon) */}
            <div className="col-span-12 lg:col-span-7 pl-0 lg:pl-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Belge Kontrolleri
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { 
                    type: 'CV', 
                    label: 'CV / Özgeçmiş', 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ), 
                    color: 'blue' 
                  },
                  { 
                    type: 'KIMLIK', 
                    label: 'Kimlik Belgesi', 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    ), 
                    color: 'indigo' 
                  },
                  { 
                    type: 'POLICE', 
                    label: 'Sabıka Kaydı', 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ), 
                    color: 'purple' 
                  },
                  { 
                    type: 'RESIDENCE', 
                    label: 'İkametgah Belgesi', 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    ), 
                    color: 'green' 
                  },
                  { 
                    type: 'DIPLOMA', 
                    label: 'Diploma', 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6M12 8v6" />
                      </svg>
                    ), 
                    color: 'amber' 
                  },
                ].map((docType) => {
                  const document = application.documents.find(
                    (doc) => doc.document_type === docType.type
                  );
                  
                  const getStatusColor = (status: string | null | undefined) => {
                    if (!status || status === null) {
                      return 'bg-gray-50 text-gray-700 border-gray-200';
                    }
                    switch (status) {
                      case 'APPROVED':
                        return 'bg-green-50 text-green-700 border-green-200';
                      case 'REJECTED':
                        return 'bg-red-50 text-red-700 border-red-200';
                      default:
                        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                    }
                  };

                  const getCardBackgroundColor = (status: string | null | undefined) => {
                    if (!status || status === null) {
                      return 'bg-gray-100/40 border-gray-300';
                    }
                    switch (status) {
                      case 'APPROVED':
                        return 'bg-green-100/50 border-green-300/70';
                      case 'REJECTED':
                        return 'bg-red-100/50 border-red-300/70';
                      default:
                        return 'bg-yellow-100/50 border-yellow-300/70';
                    }
                  };

                  const getStatusText = (status: string | null | undefined) => {
                    if (!status || status === null) {
                      return 'Yok';
                    }
                    switch (status) {
                      case 'APPROVED':
                        return 'Onaylandı';
                      case 'REJECTED':
                        return 'Reddedildi';
                      default:
                        return 'Beklemede';
                    }
                  };

                  const getStatusIcon = (status: string | null | undefined) => {
                    if (!status || status === null) {
                      return null;
                    }
                    switch (status) {
                      case 'APPROVED':
                        return (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        );
                      case 'REJECTED':
                        return (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        );
                      default:
                        return (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        );
                    }
                  };

                  const colorClasses = {
                    blue: 'from-blue-100 to-blue-200 border-blue-300',
                    indigo: 'from-indigo-100 to-indigo-200 border-indigo-300',
                    purple: 'from-purple-100 to-purple-200 border-purple-300',
                    green: 'from-green-100 to-green-200 border-green-300',
                    amber: 'from-amber-100 to-amber-200 border-amber-300',
                  };

                  return (
                    <div
                      key={docType.type}
                      className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 ${getCardBackgroundColor(document?.status)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[docType.color as keyof typeof colorClasses]} flex items-center justify-center flex-shrink-0`}>
                            <div className="text-gray-600">
                              {docType.icon}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {docType.label}
                            </h4>
                          </div>
                        </div>
                        {document ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getStatusColor(document.status)}`}>
                            {getStatusIcon(document.status)}
                            <span>{getStatusText(document.status)}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-gray-500 text-xs font-medium">
                            <span>Yok</span>
                          </div>
                        )}
                      </div>

                      {document ? (
                        <div className="space-y-2">
                          <button
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.storage
                                  .from('documents')
                                  .createSignedUrl(document.file_path, 3600);
                                
                                if (error) throw error;
                                
                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                }
                              } catch (err: any) {
                                console.error('Belge görüntüleme hatası:', err);
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium truncate w-full text-left"
                            title={document.file_name}
                          >
                            {document.file_name}
                          </button>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{new Date(document.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic text-center py-2">
                          Belge yüklenmemiş
                        </div>
                      )}

                      <div className="mt-3">
                        <DocumentControl
                          documentType={docType.type as 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA'}
                          document={document}
                          profileId={application.profile.id}
                          onUpdate={handleDocumentUpdate}
                          applicationStatus={application.applicationStatus}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
