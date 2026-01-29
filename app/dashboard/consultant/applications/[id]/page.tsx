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
  skills: string[] | null;
  languages: any[] | null;
  documents_enabled: boolean | null;
  rider_id: string | null;
  iban: string | null;
  motorcycle_plate: string | null;
}

interface VehicleInfo {
  id: string;
  profile_id: string;
  vehicle_type: string | null;
  vehicle_subtype: string | null;
  has_company: boolean | null;
  has_p1: boolean | null;
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
  vehicleInfo: VehicleInfo | null;
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [candidateMenuOpen, setCandidateMenuOpen] = useState(false);
  const candidateMenuRef = useRef<HTMLDivElement>(null);
  const [enablingDocuments, setEnablingDocuments] = useState(false);
  const [showRiderIdModal, setShowRiderIdModal] = useState(false);
  const [riderId, setRiderId] = useState('');

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

        // Araç bilgilerini al
        const { data: vehicleInfo } = await supabase
          .from('vehicle_info')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle();

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
          vehicleInfo: vehicleInfo || null,
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/consultant" className="inline-flex items-center">
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
              {/* Evrakları Aktif Et Butonu */}
              {!application.candidateInfo?.documents_enabled && (
                <button
                  onClick={() => {
                    setRiderId('');
                    setShowRiderIdModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Evrakları Aktif Et</span>
                </button>
              )}
              {application.candidateInfo?.documents_enabled && (
                <button
                  onClick={async () => {
                    setEnablingDocuments(true);
                    try {
                      const { error } = await supabase
                        .from('candidate_info')
                        .update({ documents_enabled: false })
                        .eq('profile_id', application.profile.id);

                      if (error) throw error;

                      // Sayfayı yenile
                      window.location.reload();
                    } catch (err: any) {
                      console.error('Evrak deaktif hatası:', err);
                      alert('Hata: ' + err.message);
                    } finally {
                      setEnablingDocuments(false);
                    }
                  }}
                  disabled={enablingDocuments}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all disabled:opacity-50"
                  title="Evrakları deaktif etmek için tıklayın"
                >
                  {enablingDocuments ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Evraklar Aktif</span>
                    </>
                  )}
                </button>
              )}
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
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                        Ad Soyad
                      </label>
                      <p className="text-gray-900 font-bold text-base">
                        {application.profile.full_name || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                        TC Kimlik No
                      </label>
                      <p className="text-gray-900 font-medium font-mono">
                        {application.candidateInfo?.national_id || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                        Doğum Tarihi
                      </label>
                      <p className="text-gray-900 font-medium">
                        {application.candidateInfo?.date_of_birth 
                          ? new Date(application.candidateInfo.date_of_birth).toLocaleDateString('tr-TR')
                          : <span className="text-gray-400 italic">Belirtilmemiş</span>}
                      </p>
                    </div>
                    {application.candidateInfo?.rider_id && (
                      <div className="col-span-2 mt-2 pt-2 border-t border-blue-200">
                        <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                          YS Rider ID
                        </label>
                        <p className="text-gray-900 font-bold text-lg bg-blue-100 px-3 py-1 rounded-lg inline-block">
                          {application.candidateInfo.rider_id}
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
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                        E-posta
                      </label>
                      <p className="text-gray-900 font-medium break-all">
                        {application.candidateInfo?.email || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                        Telefon
                      </label>
                      <p className="text-gray-900 font-medium">
                        {application.candidateInfo?.phone || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                        İl / İlçe
                      </label>
                      <p className="text-gray-900 font-medium">
                        {application.candidateInfo?.city && application.candidateInfo?.district 
                          ? `${application.candidateInfo.city} / ${application.candidateInfo.district}`
                          : <span className="text-gray-400 italic">Belirtilmemiş</span>}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                        Adres
                      </label>
                      <p className="text-gray-900 text-xs leading-relaxed">
                        {application.candidateInfo?.address || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Araç ve Belge Bilgileri */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                  <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    Araç ve Belge Bilgileri
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                        Araç Tipi
                      </label>
                      <p className="text-gray-900 font-medium">
                        {application.vehicleInfo?.vehicle_type || <span className="text-gray-400 italic">Belirtilmemiş</span>}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                        Plaka Bilgisi
                      </label>
                      <p className="text-gray-900 font-bold font-mono">
                        {application.candidateInfo?.motorcycle_plate || <span className="text-gray-400 italic font-normal">Belirtilmemiş</span>}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                        Şirket Durumu
                      </label>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                        application.vehicleInfo?.has_company === true 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : application.vehicleInfo?.has_company === false
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        {application.vehicleInfo?.has_company === true ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Şirketi Var
                          </>
                        ) : application.vehicleInfo?.has_company === false ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Bireysel
                          </>
                        ) : (
                          'Belirtilmemiş'
                        )}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                        P1 Belgesi
                      </label>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                        application.vehicleInfo?.has_p1 === true 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : application.vehicleInfo?.has_p1 === false
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        {application.vehicleInfo?.has_p1 === true ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Var
                          </>
                        ) : application.vehicleInfo?.has_p1 === false ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Yok
                          </>
                        ) : (
                          'Belirtilmemiş'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banka Bilgileri */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                  <h3 className="text-sm font-bold text-violet-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Banka Bilgileri
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-violet-700 uppercase tracking-wide mb-1">
                        Alıcı Adı Soyadı
                      </label>
                      <p className="text-gray-900 font-medium">
                        {application.profile.full_name || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-violet-700 uppercase tracking-wide mb-1">
                        Banka Adı
                      </label>
                      <p className="text-gray-900 font-medium">
                        Garanti Bankası
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-violet-700 uppercase tracking-wide mb-1">
                        IBAN
                      </label>
                      <p className="text-gray-900 font-mono text-xs bg-violet-100 px-3 py-2 rounded-lg break-all">
                        {application.candidateInfo?.iban || <span className="text-gray-400 italic font-sans">Belirtilmemiş</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kayıt Bilgileri */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Kayıt Bilgileri
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Kayıt Tarihi
                      </label>
                      <p className="text-gray-900 font-medium">
                        {new Date(application.profile.created_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Evrak Durumu
                      </label>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                        application.candidateInfo?.documents_enabled === true 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        {application.candidateInfo?.documents_enabled === true ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Aktif
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Beklemede
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aracı Bilgisi (varsa) */}
                {application.middleman && (
                  <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-200">
                    <h3 className="text-sm font-bold text-cyan-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Aracı Bilgisi
                    </h3>
                    <div className="text-sm">
                      <label className="block text-xs font-semibold text-cyan-700 uppercase tracking-wide mb-1">
                        Aracı Ad Soyad
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {application.middleman.full_name || 'Belirtilmemiş'}
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
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {application.vehicleInfo?.has_company === true ? '(Şirketi Var)' : '(Şirketi Yok)'}
                  {application.candidateInfo?.documents_enabled === true && ' - Evraklar Aktif'}
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  // Belge listesini has_company ve documents_enabled durumuna göre oluştur
                  const hasCompany = application.vehicleInfo?.has_company === true;
                  const documentsEnabled = application.candidateInfo?.documents_enabled === true;
                  
                  type DocConfig = { type: string; label: string; color: string };
                  let documentTypes: DocConfig[] = [];
                  
                  if (hasCompany) {
                    // Şirketi olanlar - Temel belgeler
                    documentTypes = [
                      { type: 'VERGI_LEVHASI', label: 'Vergi Levhası', color: 'amber' },
                      { type: 'P1_BELGESI', label: 'P1 Belgesi', color: 'blue' },
                      { type: 'EHLIYETLI_SELFIE', label: 'Ehliyetli Selfie', color: 'pink' },
                      { type: 'EKIPMANLI_FOTO', label: 'Ekipmanlı Fotoğraf', color: 'orange' },
                    ];
                    // Evraklar aktifse ek belgeler
                    if (documentsEnabled) {
                      documentTypes.push(
                        { type: 'ADLI_SICIL', label: 'Adli Sicil Kaydı', color: 'purple' },
                        { type: 'BIMASRAF_ENTEGRASYONU', label: 'BiMasraf Entegrasyonu', color: 'indigo' },
                      );
                    }
                  } else {
                    // Şirketi olmayanlar - Temel belgeler
                    documentTypes = [
                      { type: 'EHLIYETLI_SELFIE', label: 'Ehliyetli Selfie', color: 'pink' },
                      { type: 'EKIPMANLI_FOTO', label: 'Ekipmanlı Fotoğraf', color: 'orange' },
                    ];
                    // Evraklar aktifse ek belgeler
                    if (documentsEnabled) {
                      documentTypes.push(
                        { type: 'MUVAFAKATNAME', label: 'Muvafakatname', color: 'blue' },
                        { type: 'KIMLIK_ON', label: 'Kimlik Ön Yüzü', color: 'indigo' },
                        { type: 'SOZLESME_1', label: 'Sözleşme 1. Sayfa', color: 'cyan' },
                        { type: 'SOZLESME_2', label: 'Sözleşme 2. Sayfa', color: 'cyan' },
                        { type: 'SOZLESME_3', label: 'Sözleşme 3. Sayfa', color: 'cyan' },
                        { type: 'SOZLESME_4', label: 'Sözleşme 4. Sayfa', color: 'cyan' },
                        { type: 'SOZLESME_5', label: 'Sözleşme 5. Sayfa', color: 'cyan' },
                        { type: 'SOZLESME_6', label: 'Sözleşme 6. Sayfa', color: 'cyan' },
                        { type: 'SOZLESME_7', label: 'Sözleşme 7. Sayfa', color: 'cyan' },
                        { type: 'ISG_EVRAKLARI_1', label: 'İSG Evrakları 1. Sayfa', color: 'teal' },
                        { type: 'ISG_EVRAKLARI_2', label: 'İSG Evrakları 2. Sayfa', color: 'teal' },
                        { type: 'ISG_EVRAKLARI_3', label: 'İSG Evrakları 3. Sayfa', color: 'teal' },
                        { type: 'ISG_EVRAKLARI_4', label: 'İSG Evrakları 4. Sayfa', color: 'teal' },
                        { type: 'ISG_EVRAKLARI_5', label: 'İSG Evrakları 5. Sayfa', color: 'teal' },
                        { type: 'RUHSAT', label: 'Ruhsat Fotoğrafı', color: 'amber' },
                        { type: 'ADLI_SICIL', label: 'Adli Sicil Kaydı', color: 'purple' },
                        { type: 'TASIT_KART_DEKONT', label: 'Taşıt Kart Ücreti Dekont', color: 'green' },
                        { type: 'IKAMETGAH', label: 'İkametgah', color: 'emerald' },
                      );
                    }
                  }
                  
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

                  const colorClasses: Record<string, string> = {
                    blue: 'from-blue-100 to-blue-200 border-blue-300',
                    indigo: 'from-indigo-100 to-indigo-200 border-indigo-300',
                    purple: 'from-purple-100 to-purple-200 border-purple-300',
                    green: 'from-green-100 to-green-200 border-green-300',
                    amber: 'from-amber-100 to-amber-200 border-amber-300',
                    pink: 'from-pink-100 to-pink-200 border-pink-300',
                    orange: 'from-orange-100 to-orange-200 border-orange-300',
                    cyan: 'from-cyan-100 to-cyan-200 border-cyan-300',
                    teal: 'from-teal-100 to-teal-200 border-teal-300',
                    emerald: 'from-emerald-100 to-emerald-200 border-emerald-300',
                  };

                  return documentTypes.map((docType) => {
                    const document = application.documents.find(
                      (doc) => doc.document_type === docType.type
                    );

                    return (
                      <div
                        key={docType.type}
                        className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 ${getCardBackgroundColor(document?.status)}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[docType.color] || colorClasses.blue} flex items-center justify-center flex-shrink-0`}>
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
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
                            documentType={docType.type}
                            document={document}
                            profileId={application.profile.id}
                            onUpdate={handleDocumentUpdate}
                            applicationStatus={application.applicationStatus}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rider ID Modal */}
      {showRiderIdModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Evrakları Aktif Et</h3>
                <p className="text-sm text-gray-500">Rider ID bilgisini girin</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rider ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={riderId}
                onChange={(e) => setRiderId(e.target.value)}
                placeholder="Örn: RD-12345"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Bu bilgi aday evraklarını aktif etmek için zorunludur.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRiderIdModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!riderId.trim()) {
                    alert('Rider ID girilmesi zorunludur!');
                    return;
                  }

                  setEnablingDocuments(true);
                  try {
                    // Önce candidate_info kaydı var mı kontrol et
                    if (application.candidateInfo) {
                      // Mevcut kaydı güncelle
                      const { error } = await supabase
                        .from('candidate_info')
                        .update({ 
                          documents_enabled: true,
                          rider_id: riderId.trim()
                        })
                        .eq('profile_id', application.profile.id);

                      if (error) throw error;
                    } else {
                      // Yeni kayıt oluştur
                      const { error } = await supabase
                        .from('candidate_info')
                        .insert({ 
                          profile_id: application.profile.id,
                          documents_enabled: true,
                          rider_id: riderId.trim()
                        });

                      if (error) throw error;
                    }

                    setShowRiderIdModal(false);
                    // Sayfayı yenile
                    window.location.reload();
                  } catch (err: any) {
                    console.error('Evrak aktifleştirme hatası:', err);
                    alert('Hata: ' + err.message);
                  } finally {
                    setEnablingDocuments(false);
                  }
                }}
                disabled={enablingDocuments || !riderId.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enablingDocuments ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    İşleniyor...
                  </span>
                ) : (
                  'Aktif Et'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
