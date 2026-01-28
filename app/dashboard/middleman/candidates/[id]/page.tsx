/**
 * Middleman Aday Detay Sayfası
 * 
 * Middleman'lerin aday adına işlem yapabileceği sayfa
 * Profile sayfasına benzer ama middleman için
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import DocumentRow from '@/components/document-row';

export default function MiddlemanCandidateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const candidateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

        // Middleman profil kontrolü
        const { data: middlemanProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!middlemanProfile || middlemanProfile.role !== 'MIDDLEMAN') {
          router.push('/');
          return;
        }

        setProfile(middlemanProfile);

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

        // Aday profilini al (middleman'e bağlı olmalı)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', candidateId)
          .eq('role', 'CANDIDATE')
          .eq('middleman_id', user.id)
          .single();

        if (!profile) {
          setError('Aday bulunamadı veya bu aday size ait değil');
          setLoading(false);
          return;
        }

        setCandidateProfile(profile);

        // Aday bilgilerini al
        const { data: info } = await supabase
          .from('candidate_info')
          .select('*')
          .eq('profile_id', candidateId)
          .single();

        setCandidateInfo(info || null);

        // Belgeleri al
        const { data: docs } = await supabase
          .from('documents')
          .select('*')
          .eq('profile_id', candidateId)
          .order('updated_at', { ascending: false });

        setDocuments(docs || []);
      } catch (err: any) {
        setError(err.message || 'Veriler yüklenirken hata oluştu');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase, candidateId]);

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

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  }, [supabase, router]);

  const documentTypes = [
    { type: 'KIMLIK', label: 'Kimlik Belgesi', icon: '🆔' },
    { type: 'RESIDENCE', label: 'İkametgah', icon: '🏠' },
    { type: 'POLICE', label: 'Sabıka Kaydı', icon: '🔒' },
    { type: 'CV', label: 'CV', icon: '📄' },
    { type: 'DIPLOMA', label: 'Diploma', icon: '🎓' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW_APPLICATION':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
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
            Güncelleme Gerekli
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
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

  if (error || !candidateProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 font-medium">{error || 'Aday bulunamadı'}</p>
          <Link
            href="/dashboard/middleman"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/middleman"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Dashboard'a Dön</span>
            </Link>
            {siteLogo ? (
              <img
                src={siteLogo}
                alt="Site Logo"
                className="h-10 w-auto max-w-[200px] object-contain ml-4"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center ml-4">
                <span className="text-lg font-semibold text-white">J</span>
              </div>
            )}
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
                <p className="text-sm font-medium text-gray-700">{profile?.full_name || 'Middleman'}</p>
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
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <span className="text-xl font-semibold text-white">
                {candidateProfile.full_name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {candidateProfile.full_name || 'İsimsiz'}
              </h1>
              <p className="text-sm text-gray-500">Aday Detayları</p>
            </div>
          </div>
        </div>

        {/* Başvuru Durumu */}
        {candidateProfile.application_status && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Başvuru Durumu</h3>
                {getStatusBadge(candidateProfile.application_status)}
              </div>
            </div>
          </div>
        )}

        {/* Profil Bilgileri */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h2>
                <p className="text-xs text-gray-400">Temel kullanıcı bilgileri</p>
              </div>
            </div>
            {(candidateProfile.application_status === 'NEW_APPLICATION' || 
              candidateProfile.application_status === 'UPDATE_REQUIRED') && (
              <Link
                href={`/dashboard/middleman/candidates/${candidateId}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Düzenle
              </Link>
            )}
          </div>

          <div className="space-y-6">
            {/* Temel Bilgiler */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Temel Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                    Ad Soyad
                  </label>
                  <p className="text-gray-900 font-medium">{candidateProfile.full_name || 'Belirtilmemiş'}</p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                    Telefon Numarası
                  </label>
                  <p className="text-gray-900 font-medium">{candidateInfo?.phone || 'Belirtilmemiş'}</p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                    TC Kimlik No
                  </label>
                  <p className="text-gray-900 font-medium">{candidateInfo?.national_id || 'Belirtilmemiş'}</p>
                </div>

                <div className="p-4 rounded-lg bg-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                    Doğum Tarihi
                  </label>
                  <p className="text-gray-900 font-medium">
                    {candidateInfo?.date_of_birth
                      ? new Date(candidateInfo.date_of_birth).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Belirtilmemiş'}
                  </p>
                </div>
              </div>
            </div>

            {/* Aday Bilgileri */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Aday Bilgileri
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                      E-posta
                    </label>
                    <p className="text-gray-900 font-medium">{candidateInfo?.email || 'Belirtilmemiş'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                      Kayıt Tarihi
                    </label>
                    <p className="text-gray-900 font-medium">
                      {new Date(candidateProfile.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                      Adres
                    </label>
                    <p className="text-gray-900 font-medium">{candidateInfo?.address || 'Belirtilmemiş'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                      Eğitim Seviyesi
                    </label>
                    <p className="text-gray-900 font-medium">{candidateInfo?.education_level || 'Belirtilmemiş'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50">
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                      Deneyim Yılı
                    </label>
                    <p className="text-gray-900 font-medium">{candidateInfo?.experience_years || 0} yıl</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                    Beceriler
                  </label>
                  {candidateInfo?.skills && candidateInfo.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {candidateInfo.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-900 font-medium">Belirtilmemiş</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Belgeler Bölümü */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Belgeler</h2>
              <p className="text-xs text-gray-400">Yüklenen belgeler ve durumları</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                <strong>Bilgi:</strong> Aday adına belge yükleyebilir, güncelleyebilir veya silebilirsiniz. Belgeler consultant'lar tarafından incelendikten sonra onaylanacaktır.
              </p>
            </div>
          </div>

          {/* Belge Satırları */}
          <div className="space-y-4">
            {documentTypes.map((docType) => {
              const document = documents?.find((doc) => doc.document_type === docType.type);
              const canEdit = candidateProfile.application_status === 'NEW_APPLICATION' || 
                             candidateProfile.application_status === 'UPDATE_REQUIRED';
              return (
                <DocumentRow
                  key={docType.type}
                  documentType={docType.type as 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA'}
                  documentTypeLabel={docType.label}
                  documentTypeIcon={docType.icon}
                  document={document}
                  profileId={candidateId}
                  canEdit={canEdit}
                  canView={false}
                  canDownload={false}
                  applicationStatus={candidateProfile.application_status || undefined}
                />
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
