/**
 * Candidate Profile View Page
 * 
 * Adayların profil bilgilerini sadece görüntüleyebileceği sayfa (düzenleme yok)
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import SubmitApplicationButton from '@/components/submit-application-button';

export default function CandidateProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA' | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    address: '',
    dateOfBirth: '',
    nationalId: '',
    educationLevel: '',
    experienceYears: '0',
    skills: [] as string[],
    languages: [] as Array<{ name: string; level: string }>,
    currentSkill: '',
    currentLanguageName: '',
    currentLanguageLevel: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Profil bilgilerini al
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData || profileData.role !== 'CANDIDATE') {
        router.push('/');
        return;
      }

      setProfile(profileData);

      // Aday bilgilerini al
      const { data: candidateInfoData } = await supabase
        .from('candidate_info')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      setCandidateInfo(candidateInfoData);

      // Form verilerini doldur
      setFormData({
        fullName: profileData.full_name || '',
        phone: candidateInfoData?.phone || '',
        email: candidateInfoData?.email || '',
        city: candidateInfoData?.city || '',
        district: candidateInfoData?.district || '',
        address: candidateInfoData?.address || '',
        dateOfBirth: candidateInfoData?.date_of_birth || '',
        nationalId: candidateInfoData?.national_id || '',
        educationLevel: candidateInfoData?.education_level || '',
        experienceYears: candidateInfoData?.experience_years?.toString() || '0',
        skills: candidateInfoData?.skills || [],
        languages: candidateInfoData?.languages || [],
        currentSkill: '',
        currentLanguageName: '',
        currentLanguageLevel: '',
      });

      // Onay durumunu kontrol et
      const approved = profileData.application_status === 'APPROVED';
      const canEdit = profileData.application_status === 'UPDATE_REQUIRED' || profileData.application_status === 'NEW_APPLICATION';
      const infoLocked = candidateInfoData && 
        candidateInfoData.phone && 
        candidateInfoData.email && 
        candidateInfoData.city && 
        candidateInfoData.district && 
        candidateInfoData.address && 
        candidateInfoData.date_of_birth && 
        candidateInfoData.national_id && 
        candidateInfoData.education_level &&
        profileData.full_name;

      setIsApproved(approved && !!infoLocked);

      // Eğer onaylı değilse ve güncelleme gerekli değilse, uyarı modalını göster
      if (!approved && !canEdit && !infoLocked) {
        setShowWarningModal(true);
      }

      // Belgeleri al
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      setDocuments(documentsData || []);

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
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh();
    }
  };

  const canEdit = profile?.application_status === 'UPDATE_REQUIRED' || profile?.application_status === 'NEW_APPLICATION';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addSkill = () => {
    if (formData.currentSkill.trim() && !formData.skills.includes(formData.currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, prev.currentSkill.trim()],
        currentSkill: '',
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addLanguage = () => {
    if (formData.currentLanguageName.trim() && formData.currentLanguageLevel) {
      const newLang = {
        name: formData.currentLanguageName.trim(),
        level: formData.currentLanguageLevel,
      };
      if (!formData.languages.some(l => l.name === newLang.name)) {
        setFormData((prev) => ({
          ...prev,
          languages: [...prev.languages, newLang],
          currentLanguageName: '',
          currentLanguageLevel: '',
        }));
      }
    }
  };

  const removeLanguage = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l.name !== name),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSaveError('Giriş yapmamışsınız');
        setSaving(false);
        return;
      }

      // 1. Profil bilgilerini güncelle
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Aday bilgilerini güncelle
      const { error: candidateError } = await supabase
        .from('candidate_info')
        .upsert({
          profile_id: user.id,
          phone: formData.phone || null,
          email: formData.email || null,
          city: formData.city || null,
          district: formData.district || null,
          address: formData.address || null,
          date_of_birth: formData.dateOfBirth || null,
          national_id: formData.nationalId || null,
          education_level: formData.educationLevel || null,
          experience_years: parseInt(formData.experienceYears) || 0,
          skills: formData.skills,
          languages: formData.languages,
        }, { onConflict: 'profile_id' });

      if (candidateError) throw candidateError;

      // Verileri yeniden yükle
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: candidateInfoData } = await supabase
        .from('candidate_info')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      setProfile(profileData);
      setCandidateInfo(candidateInfoData);

      setSaveSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Kayıt sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-sky-50/60 to-indigo-50/70 flex items-center justify-center">
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

  // Doğum tarihini parse et
  let birthDay = '';
  let birthMonth = '';
  let birthYear = '';
  if (candidateInfo?.date_of_birth) {
    const dateParts = candidateInfo.date_of_birth.split('-');
    if (dateParts.length === 3) {
      birthYear = dateParts[0];
      birthMonth = dateParts[1];
      birthDay = dateParts[2];
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-sky-50/60 to-indigo-50/70">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
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
          </div>

          <div className="flex items-center gap-3">
            {/* Aday Statüsü */}
            {profile?.application_status && (
              <div className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                profile.application_status === 'NEW_APPLICATION' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : profile.application_status === 'EVALUATION' 
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : profile.application_status === 'APPROVED' 
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : profile.application_status === 'REJECTED' 
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                <span className="hidden sm:inline">
                  {profile.application_status === 'NEW_APPLICATION' ? '🆕 Yeni Başvuru' :
                   profile.application_status === 'EVALUATION' ? '⏳ Değerlendirme' :
                   profile.application_status === 'APPROVED' ? '✅ Onaylı' :
                   profile.application_status === 'REJECTED' ? '❌ Reddedildi' :
                   '📝 Güncelleme Gerekli'}
                </span>
                <span className="sm:hidden">
                  {profile.application_status === 'NEW_APPLICATION' ? '🆕' :
                   profile.application_status === 'EVALUATION' ? '⏳' :
                   profile.application_status === 'APPROVED' ? '✅' :
                   profile.application_status === 'REJECTED' ? '❌' :
                   '📝'}
                </span>
              </div>
            )}

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {profile?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{profile?.full_name || 'Aday'}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                <div className="py-1.5">
                  <Link
                    href="/dashboard/candidate/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors bg-indigo-50"
                  >
                    <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Profil Bilgileri</p>
                      <p className="text-xs text-gray-400">Kişisel bilgilerinizi görüntüleyin</p>
                    </div>
                  </Link>
                  <div className="h-px bg-gray-100 my-1"></div>
            {isApproved && (
              <Link
                href="/dashboard/candidate"
                onClick={() => setDropdownOpen(false)}
                className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Ana Sayfa</p>
                  <p className="text-xs text-gray-400">Dashboard'a dön</p>
                </div>
              </Link>
            )}
                  <div className="h-px bg-gray-100 my-1"></div>
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
        </div>
      </header>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Eksik Bilgiler</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Lütfen eksik bilgi ve belgelerinizi tamamlayın.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profil Bilgileri</h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? 'Kişisel bilgilerinizi düzenleyin' : 'Kişisel bilgilerinizi görüntüleyin'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Düzenle
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // Form verilerini sıfırla
                      setFormData({
                        fullName: profile?.full_name || '',
                        phone: candidateInfo?.phone || '',
                        email: candidateInfo?.email || '',
                        city: candidateInfo?.city || '',
                        district: candidateInfo?.district || '',
                        address: candidateInfo?.address || '',
                        dateOfBirth: candidateInfo?.date_of_birth || '',
                        nationalId: candidateInfo?.national_id || '',
                        educationLevel: candidateInfo?.education_level || '',
                        experienceYears: candidateInfo?.experience_years?.toString() || '0',
                        skills: candidateInfo?.skills || [],
                        languages: candidateInfo?.languages || [],
                        currentSkill: '',
                        currentLanguageName: '',
                        currentLanguageLevel: '',
                      });
                      setSaveError(null);
                      setSaveSuccess(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </>
              )}
              {isApproved && !isEditing && (
                <Link
                  href="/dashboard/candidate"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ana Sayfaya Dön
                </Link>
              )}
            </div>
          </div>
          {saveError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              ✅ Profil bilgileriniz başarıyla kaydedildi!
            </div>
          )}
        </div>

        {/* Profile Information Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="space-y-6">
            {/* Temel Bilgiler */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Temel Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Ad Soyad</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  ) : (
                    <p className="text-sm text-gray-900 font-medium">{profile?.full_name || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Doğum Tarihi</p>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {birthDay && birthMonth && birthYear
                        ? `${birthDay}/${birthMonth}/${birthYear}`
                        : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">TC Kimlik No</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="nationalId"
                      value={formData.nationalId}
                      onChange={handleChange}
                      maxLength={11}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{candidateInfo?.national_id || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                İletişim Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Telefon</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{candidateInfo?.phone || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">E-posta</p>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{candidateInfo?.email || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">İl</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{candidateInfo?.city || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">İlçe</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{candidateInfo?.district || '-'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">Açık Adres</p>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{candidateInfo?.address || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Eğitim ve Deneyim */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Eğitim ve Deneyim
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Eğitim Seviyesi</p>
                  {isEditing ? (
                    <select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seçiniz</option>
                      <option value="İlkokul">İlkokul</option>
                      <option value="Ortaokul">Ortaokul</option>
                      <option value="Lise">Lise</option>
                      <option value="Ön Lisans">Ön Lisans</option>
                      <option value="Lisans">Lisans</option>
                      <option value="Yüksek Lisans">Yüksek Lisans</option>
                      <option value="Doktora">Doktora</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900">{candidateInfo?.education_level || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Deneyim (Yıl)</p>
                  {isEditing ? (
                    <input
                      type="number"
                      name="experienceYears"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{candidateInfo?.experience_years || '0'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Beceriler */}
            {(isEditing || (candidateInfo?.skills && Array.isArray(candidateInfo.skills) && candidateInfo.skills.length > 0)) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Beceriler
                </h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.currentSkill}
                        onChange={(e) => setFormData((prev) => ({ ...prev, currentSkill: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        placeholder="Beceri ekleyin (Enter)"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Ekle
                      </button>
                    </div>
                    {formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="text-blue-900 hover:text-red-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {candidateInfo.skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Diller */}
            {(isEditing || (candidateInfo?.languages && Array.isArray(candidateInfo.languages) && candidateInfo.languages.length > 0)) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Diller
                </h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.currentLanguageName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, currentLanguageName: e.target.value }))}
                        placeholder="Dil adı"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={formData.currentLanguageLevel}
                        onChange={(e) => setFormData((prev) => ({ ...prev, currentLanguageLevel: e.target.value }))}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seviye</option>
                        <option value="Başlangıç">Başlangıç</option>
                        <option value="Orta">Orta</option>
                        <option value="İleri">İleri</option>
                        <option value="Ana Dil">Ana Dil</option>
                      </select>
                      <button
                        type="button"
                        onClick={addLanguage}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Ekle
                      </button>
                    </div>
                    {formData.languages.length > 0 && (
                      <div className="space-y-2">
                        {formData.languages.map((lang: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-900 font-medium">{lang.name || '-'}</span>
                              <span className="text-xs text-gray-500">{lang.level || '-'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLanguage(lang.name)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {candidateInfo.languages.map((lang: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-900 font-medium">{lang.name || '-'}</span>
                        <span className="text-xs text-gray-500">{lang.level || '-'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Belgeler ve Belge Durumları */}
        <div className="mb-6 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Belgeler ve Belge Durumları
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Belgelerinizi görüntüleyin</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              const document = documents.find((doc) => doc.document_type === docType.type);
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'APPROVED':
                    return 'bg-green-50 text-green-700 border-green-200';
                  case 'REJECTED':
                    return 'bg-red-50 text-red-700 border-red-200';
                  default:
                    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                }
              };

              const getCardBackgroundColor = (status: string | undefined) => {
                if (!status) {
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
              const getStatusText = (status: string) => {
                switch (status) {
                  case 'APPROVED':
                    return 'Onaylandı';
                  case 'REJECTED':
                    return 'Reddedildi';
                  default:
                    return 'Beklemede';
                }
              };
              const getStatusIcon = (status: string) => {
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
                  className={`rounded-xl border p-4 shadow-sm ${getCardBackgroundColor(document?.status)}`}
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
                      <div className="pt-1">
                        {document.status === 'APPROVED' && !canEdit ? (
                          <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium text-center flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Düzenlenemez
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedDocumentType(docType.type as 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA');
                              setSelectedDocumentId(document.id);
                              setUploadModalOpen(true);
                              setUploadError(null);
                              setUploadSuccess(false);
                              setSelectedFile(null);
                            }}
                            className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-700 rounded-lg transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {document.status === 'REJECTED' ? 'Düzenle' : 'Değiştir'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedDocumentType(docType.type as 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA');
                        setSelectedDocumentId(null);
                        setUploadModalOpen(true);
                        setUploadError(null);
                        setUploadSuccess(false);
                        setSelectedFile(null);
                      }}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                    >
                      Yükle
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Başvurumu Değerlendirmeye Gönder Butonu */}
        {(profile?.application_status === 'NEW_APPLICATION' || profile?.application_status === 'UPDATE_REQUIRED') && (
          <div className="mt-6">
            <SubmitApplicationButton
              profileId={profile?.id || ''}
              applicationStatus={profile?.application_status || null}
              candidateInfo={candidateInfo}
              documents={documents}
              requiredDocumentTypes={['KIMLIK', 'RESIDENCE', 'POLICE', 'CV']}
              onSuccess={() => {
                // Başarılı gönderimden sonra verileri yeniden yükle
                loadData();
              }}
            />
          </div>
        )}
      </main>

      {/* Belge Yükleme Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDocumentId ? 'Belge Düzenle' : 'Belge Yükle'}
              </h3>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedFile(null);
                  setUploadError(null);
                  setUploadSuccess(false);
                }}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {uploadSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Belge Başarıyla Yüklendi!</h4>
                <p className="text-sm text-gray-600 mb-6">Belge consultant tarafından incelenecektir.</p>
                <button
                  onClick={async () => {
                    setUploadModalOpen(false);
                    setUploadSuccess(false);
                    setSelectedFile(null);
                    // Belgeleri yeniden yükle
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();
                    if (user) {
                      const { data: documentsData } = await supabase
                        .from('documents')
                        .select('*')
                        .eq('profile_id', user.id)
                        .order('created_at', { ascending: false });
                      setDocuments(documentsData || []);
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Tamam
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedFile) {
                    setUploadError('Lütfen bir dosya seçin');
                    return;
                  }

                  setUploading(true);
                  setUploadError(null);

                  try {
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();

                    if (!user) {
                      setUploadError('Giriş yapmamışsınız');
                      setUploading(false);
                      return;
                    }

                    // Dosyayı Storage'a yükle
                    const fileExt = selectedFile.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                      .from('documents')
                      .upload(filePath, selectedFile, {
                        cacheControl: '3600',
                        upsert: false,
                      });

                    if (uploadError) {
                      throw new Error(`Dosya yüklenirken hata: ${uploadError.message}`);
                    }

                    // Documents tablosuna kayıt ekle veya güncelle
                    if (selectedDocumentId) {
                      // Eski belgeyi güncelle
                      const { data: oldDocument } = await supabase
                        .from('documents')
                        .select('file_path')
                        .eq('id', selectedDocumentId)
                        .eq('profile_id', user.id)
                        .single();

                      const { error: updateError } = await supabase
                        .from('documents')
                        .update({
                          file_name: selectedFile.name,
                          file_path: filePath,
                          file_size: selectedFile.size,
                          mime_type: selectedFile.type,
                          status: null,
                          reviewed_by: null,
                          reviewed_at: null,
                          review_notes: null,
                          updated_at: new Date().toISOString(),
                        })
                        .eq('id', selectedDocumentId)
                        .eq('profile_id', user.id);

                      if (updateError) {
                        // Yüklenen dosyayı sil
                        await supabase.storage.from('documents').remove([filePath]);
                        throw new Error(`Belge güncellenirken hata: ${updateError.message}`);
                      }

                      // Eski dosyayı sil
                      if (oldDocument?.file_path && oldDocument.file_path !== filePath) {
                        await supabase.storage.from('documents').remove([oldDocument.file_path]);
                      }
                    } else {
                      // Yeni belge ekle
                      const { data: existingDoc } = await supabase
                        .from('documents')
                        .select('id')
                        .eq('profile_id', user.id)
                        .eq('document_type', selectedDocumentType)
                        .single();

                      if (existingDoc) {
                        await supabase.storage.from('documents').remove([filePath]);
                        throw new Error('Bu belge türü zaten yüklenmiş. Değiştirmek için "Düzenle" butonunu kullanın.');
                      }

                      const { error: insertError } = await supabase
                        .from('documents')
                        .insert({
                          profile_id: user.id,
                          document_type: selectedDocumentType,
                          file_name: selectedFile.name,
                          file_path: filePath,
                          file_size: selectedFile.size,
                          mime_type: selectedFile.type,
                          status: null,
                        });

                      if (insertError) {
                        await supabase.storage.from('documents').remove([filePath]);
                        throw new Error(`Belge kaydedilirken hata: ${insertError.message}`);
                      }
                    }

                    setUploadSuccess(true);
                    setUploading(false);
                  } catch (err: any) {
                    setUploadError(err.message || 'Belge yüklenirken hata oluştu');
                    setUploading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Belge Türü
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900">
                    {selectedDocumentType === 'CV' && 'CV / Özgeçmiş'}
                    {selectedDocumentType === 'KIMLIK' && 'Kimlik Belgesi'}
                    {selectedDocumentType === 'POLICE' && 'Sabıka Kaydı'}
                    {selectedDocumentType === 'RESIDENCE' && 'İkametgah Belgesi'}
                    {selectedDocumentType === 'DIPLOMA' && 'Diploma'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosya Seç
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        if (file.size > 50 * 1024 * 1024) {
                          setUploadError('Dosya boyutu 50MB\'dan küçük olmalıdır');
                          return;
                        }
                        setSelectedFile(file);
                        setUploadError(null);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs text-gray-600">
                      Seçilen: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Yükleniyor...' : selectedDocumentId ? 'Güncelle' : 'Yükle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadModalOpen(false);
                      setSelectedFile(null);
                      setUploadError(null);
                    }}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    İptal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
