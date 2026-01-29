/**
 * Candidate Profile View Page
 * 
 * Adayların profil bilgilerini sadece görüntüleyebileceği sayfa (düzenleme yok)
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import SubmitApplicationButton from '@/components/submit-application-button';
import Footer from '@/components/footer';
import { SearchableSelect, type SearchableSelectOption } from '@/components/searchable-select';
import { provinces, getDistricts } from '@/lib/data/il-ilce';

// Belge kartı için yardımcı fonksiyonlar
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

const colorClasses: Record<string, string> = {
  blue: 'from-blue-100 to-blue-200 border-blue-300',
  indigo: 'from-indigo-100 to-indigo-200 border-indigo-300',
  purple: 'from-purple-100 to-purple-200 border-purple-300',
  green: 'from-green-100 to-green-200 border-green-300',
  amber: 'from-amber-100 to-amber-200 border-amber-300',
  red: 'from-red-100 to-red-200 border-red-300',
  cyan: 'from-cyan-100 to-cyan-200 border-cyan-300',
  teal: 'from-teal-100 to-teal-200 border-teal-300',
  pink: 'from-pink-100 to-pink-200 border-pink-300',
  orange: 'from-orange-100 to-orange-200 border-orange-300',
  slate: 'from-slate-100 to-slate-200 border-slate-300',
};

// Çoklu Sayfa Belge Kartı bileşeni
function MultiPageDocumentCard({
  label,
  color,
  pageCount,
  documents,
  docTypePrefix,
  canEdit,
  applicationStatus,
  onUpload,
}: {
  label: string;
  color: string;
  pageCount: number;
  documents: any[];
  docTypePrefix: string;
  canEdit: boolean;
  applicationStatus: string | null;
  onUpload: () => void;
}) {
  // Her sayfa için belge kontrolü
  const uploadedPages = Array.from({ length: pageCount }, (_, i) => {
    const docType = `${docTypePrefix}_${i + 1}`;
    return documents.find((doc) => doc.document_type === docType);
  });
  
  const uploadedCount = uploadedPages.filter(Boolean).length;
  const allUploaded = uploadedCount === pageCount;
  const hasAnyUploaded = uploadedCount > 0;
  
  // Tüm sayfaların durumunu kontrol et
  const allApproved = hasAnyUploaded && uploadedPages.every((doc) => doc?.status === 'APPROVED');
  const anyRejected = uploadedPages.some((doc) => doc?.status === 'REJECTED');
  const anyPending = uploadedPages.some((doc) => doc && doc.status !== 'APPROVED' && doc.status !== 'REJECTED');

  const getOverallStatus = () => {
    if (!hasAnyUploaded) return undefined;
    if (allApproved) return 'APPROVED';
    if (anyRejected) return 'REJECTED';
    if (anyPending) return 'PENDING';
    return 'PENDING';
  };

  const overallStatus = getOverallStatus();

  // UPDATE_REQUIRED durumunda sadece REJECTED sayfalar varsa düzenlenebilir
  // NEW_APPLICATION durumunda tüm sayfalar düzenlenebilir
  const canEditThisDocument = applicationStatus === 'NEW_APPLICATION' 
    ? canEdit 
    : applicationStatus === 'UPDATE_REQUIRED' 
      ? anyRejected
      : false;

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${getCardBackgroundColor(overallStatus)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} flex items-center justify-center flex-shrink-0`}>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{label}</h4>
            <p className="text-xs text-gray-500">{pageCount} sayfa</p>
          </div>
        </div>
        {hasAnyUploaded ? (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getStatusColor(overallStatus || 'PENDING')}`}>
            <span>{uploadedCount}/{pageCount}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-gray-500 text-xs font-medium">
            <span>0/{pageCount}</span>
          </div>
        )}
      </div>

      {/* Sayfa durumları gösterimi */}
      <div className="flex flex-wrap gap-1 mb-3">
        {uploadedPages.map((doc, idx) => (
          <div
            key={idx}
            className={`w-6 h-6 rounded text-xs font-medium flex items-center justify-center ${
              doc
                ? doc.status === 'APPROVED'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : doc.status === 'REJECTED'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
            title={doc ? `Sayfa ${idx + 1}: ${getStatusText(doc.status)}` : `Sayfa ${idx + 1}: Yüklenmedi`}
          >
            {idx + 1}
          </div>
        ))}
      </div>

      {!canEditThisDocument ? (
        <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium text-center flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {allApproved ? 'Onaylandı' : 'Düzenlenemez'}
        </div>
      ) : (
        <button
          onClick={onUpload}
          className={`w-full px-3 py-2 rounded-lg transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1.5 ${
            hasAnyUploaded
              ? anyRejected 
                ? 'bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-700'
                : 'bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {anyRejected ? 'Reddedilenleri Güncelle' : hasAnyUploaded ? 'Sayfaları Düzenle' : 'Sayfaları Yükle'}
        </button>
      )}
    </div>
  );
}

// DocumentCard bileşeni
function DocumentCard({ 
  docType, 
  document, 
  canEdit, 
  applicationStatus,
  supabase,
  onUpload 
}: { 
  docType: { type: string; label: string; color: string };
  document: any;
  canEdit: boolean;
  applicationStatus: string | null;
  supabase: any;
  onUpload: () => void;
}) {
  const StatusIcon = ({ status }: { status: string }) => {
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

  // UPDATE_REQUIRED durumunda sadece REJECTED belgeler düzenlenebilir
  // NEW_APPLICATION durumunda tüm belgeler düzenlenebilir
  const canEditThisDocument = applicationStatus === 'NEW_APPLICATION' 
    ? canEdit 
    : applicationStatus === 'UPDATE_REQUIRED' 
      ? document?.status === 'REJECTED'
      : false;


  return (
    <div className={`rounded-xl border p-4 shadow-sm ${getCardBackgroundColor(document?.status)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[docType.color] || colorClasses.blue} flex items-center justify-center flex-shrink-0`}>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{docType.label}</h4>
          </div>
        </div>
        {document ? (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getStatusColor(document.status)}`}>
            <StatusIcon status={document.status} />
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
          
          {/* Red nedeni gösterimi */}
          {document.status === 'REJECTED' && document.review_notes && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-red-700 mb-0.5">Red Nedeni:</p>
                  <p className="text-xs text-red-600">{document.review_notes}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-1">
            {!canEditThisDocument ? (
              <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium text-center flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {document.status === 'APPROVED' ? 'Onaylandı' : 'Düzenlenemez'}
              </div>
            ) : (
              <button
                onClick={onUpload}
                className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-700 rounded-lg transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Yeni Belge Yükle
              </button>
            )}
          </div>
        </div>
      ) : (
        // Belge yok - sadece NEW_APPLICATION'da yüklenebilir
        applicationStatus === 'NEW_APPLICATION' ? (
          <button
            onClick={onUpload}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            Yükle
          </button>
        ) : (
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium text-center">
            Belge yüklenmemiş
          </div>
        )
      )}
    </div>
  );
}

export default function CandidateProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<{
    vehicle_type: string | null;
    vehicle_subtype: string | null;
    has_company: boolean | null;
    has_p1: boolean | null;
  }>({
    vehicle_type: null,
    vehicle_subtype: null,
    has_company: null,
    has_p1: null,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Çoklu sayfa yükleme modal state'leri
  const [multiPageModalOpen, setMultiPageModalOpen] = useState(false);
  const [multiPageType, setMultiPageType] = useState<'SOZLESME' | 'ISG_EVRAKLARI' | null>(null);
  const [multiPageFiles, setMultiPageFiles] = useState<Record<number, File | null>>({});
  const [multiPageUploading, setMultiPageUploading] = useState(false);
  const [multiPageError, setMultiPageError] = useState<string | null>(null);
  const [multiPageSuccess, setMultiPageSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    cityId: '', // İl ID'si (sayı olarak string)
    district: '',
    address: '',
    dateOfBirth: '',
    nationalId: '',
    iban: '',
    motorcyclePlate: '', // Motosiklet Plakası
    hasCompany: null as boolean | null, // Şirketiniz Var mı?
    hasP1: null as boolean | null, // P1 Belgesi Var mı?
    vehicleType: '' as string, // Araç Tipi
  });

  // İl ve ilçe seçenekleri
  const cityIdNum = formData.cityId ? parseInt(formData.cityId, 10) : 0;
  const cityName = cityIdNum ? provinces.find((p) => p.id === cityIdNum)?.name ?? '' : '';

  const ilOptions: SearchableSelectOption[] = useMemo(
    () => provinces.map((p) => ({ value: String(p.id), label: p.name })),
    []
  );

  const ilceOptions: SearchableSelectOption[] = useMemo(() => {
    if (!cityIdNum) return [];
    return getDistricts(cityIdNum).map((n) => ({ value: n, label: n }));
  }, [cityIdNum]);

  // İl adından ID'yi bul
  const getCityIdFromName = (cityNameParam: string): string => {
    if (!cityNameParam) return '';
    const found = provinces.find((p) => p.name === cityNameParam);
    return found ? String(found.id) : '';
  };

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

      // Kayıt sırasında girilen araç ve şirket bilgilerini al
      // Önce vehicle_info tablosundan, yoksa user_metadata'dan
      const { data: authUser } = await supabase.auth.getUser();
      const userMetadata = authUser?.user?.user_metadata || {};
      
      const { data: vehicleData } = await supabase
        .from('vehicle_info')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      // Boolean değerleri düzgün parse et (userMetadata'dan string gelebilir)
      const parseBoolean = (val: any): boolean | null => {
        if (val === true || val === 'true') return true;
        if (val === false || val === 'false') return false;
        return null;
      };

      setVehicleInfo({
        vehicle_type: vehicleData?.vehicle_type ?? userMetadata.vehicle_type ?? null,
        vehicle_subtype: vehicleData?.vehicle_subtype ?? userMetadata.vehicle_subtype ?? null,
        has_company: parseBoolean(vehicleData?.has_company) ?? parseBoolean(userMetadata.has_company),
        has_p1: parseBoolean(vehicleData?.has_p1) ?? parseBoolean(userMetadata.has_p1),
      });

      // Aday bilgilerini al
      let candidateInfoData = null;
      const { data: infoData, error: candidateInfoError } = await supabase
        .from('candidate_info')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      candidateInfoData = infoData;

      // Eğer candidate_info kaydı yoksa veya eksik alanlar varsa, user_metadata'dan tamamla
      if (!candidateInfoError) {
        const needsUpdate = !candidateInfoData || 
          !candidateInfoData.city || 
          !candidateInfoData.district || 
          !candidateInfoData.phone;

        if (needsUpdate) {
          // Kayıt sırasında girilen bilgileri user_metadata'dan al
          const userMetadataInfo = userMetadata;
          
          const updatedInfo = {
            profile_id: user.id,
            phone: candidateInfoData?.phone || userMetadataInfo.phone || null,
            email: candidateInfoData?.email || user.email || null,
            city: candidateInfoData?.city || userMetadataInfo.city || null,
            district: candidateInfoData?.district || userMetadataInfo.district || null,
            address: candidateInfoData?.address || null,
            date_of_birth: candidateInfoData?.date_of_birth || null,
            national_id: candidateInfoData?.national_id || null,
            iban: candidateInfoData?.iban || null,
          };

          if (!candidateInfoData) {
            // Yeni kayıt oluştur
            const { data: createdInfo } = await supabase
              .from('candidate_info')
              .insert(updatedInfo)
              .select()
              .single();
            
            candidateInfoData = createdInfo || updatedInfo;
          } else {
            // Mevcut kaydı güncelle
            const { data: updatedData } = await supabase
              .from('candidate_info')
              .update({
                phone: updatedInfo.phone,
                email: updatedInfo.email,
                city: updatedInfo.city,
                district: updatedInfo.district,
              })
              .eq('profile_id', user.id)
              .select()
              .single();
            
            candidateInfoData = updatedData || { ...candidateInfoData, ...updatedInfo };
          }
        }
      }

      setCandidateInfo(candidateInfoData);

      // Form verilerini doldur - city adından cityId'ye dönüştür
      const foundCityId = candidateInfoData?.city 
        ? provinces.find((p) => p.name === candidateInfoData.city)?.id 
        : null;
      
      setFormData({
        fullName: profileData.full_name || '',
        phone: candidateInfoData?.phone || '',
        email: candidateInfoData?.email || '',
        cityId: foundCityId ? String(foundCityId) : '',
        district: candidateInfoData?.district || '',
        address: candidateInfoData?.address || '',
        dateOfBirth: candidateInfoData?.date_of_birth || '',
        nationalId: candidateInfoData?.national_id || '',
        iban: candidateInfoData?.iban || '',
        motorcyclePlate: candidateInfoData?.motorcycle_plate || '',
        hasCompany: vehicleInfo?.has_company ?? userMetadata.has_company ?? null,
        hasP1: vehicleInfo?.has_p1 ?? userMetadata.has_p1 ?? null,
        vehicleType: vehicleInfo?.vehicle_type || userMetadata.vehicle_type || '',
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
        profileData.full_name;

      setIsApproved(approved && !!infoLocked);

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
          city: cityName || null,
          district: formData.district || null,
          address: formData.address || null,
          date_of_birth: formData.dateOfBirth || null,
          national_id: formData.nationalId || null,
          iban: formData.iban || null,
          motorcycle_plate: formData.motorcyclePlate || null,
        }, { onConflict: 'profile_id' });

      if (candidateError) throw candidateError;

      // 3. Araç bilgilerini güncelle (Şirket durumu, P1 ve Araç Tipi)
      const { error: vehicleError } = await supabase
        .from('vehicle_info')
        .upsert({
          profile_id: user.id,
          has_company: formData.hasCompany,
          has_p1: formData.hasP1,
          vehicle_type: formData.vehicleType || null,
        }, { onConflict: 'profile_id' });

      if (vehicleError) throw vehicleError;

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

      const { data: vehicleData } = await supabase
        .from('vehicle_info')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      setProfile(profileData);
      setCandidateInfo(candidateInfoData);
      if (vehicleData) {
        setVehicleInfo({
          vehicle_type: vehicleData.vehicle_type ?? null,
          vehicle_subtype: vehicleData.vehicle_subtype ?? null,
          has_company: vehicleData.has_company ?? null,
          has_p1: vehicleData.has_p1 ?? null,
        });
      }

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
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/candidate/profile" className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pointdlogo.webp" alt="Point Delivery" className="w-auto" style={{ height: '42px', width: 'auto' }} />
            </Link>

            {/* Aday Statüsü Badge */}
            {profile?.application_status && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                profile.application_status === 'NEW_APPLICATION' 
                  ? 'bg-blue-50 text-blue-700' 
                  : profile.application_status === 'EVALUATION' 
                  ? 'bg-yellow-50 text-yellow-700'
                  : profile.application_status === 'APPROVED' 
                  ? 'bg-green-50 text-green-700'
                  : profile.application_status === 'REJECTED' 
                  ? 'bg-red-50 text-red-700'
                  : 'bg-orange-50 text-orange-700'
              }`}>
                <span className="w-2 h-2 rounded-full ${
                  profile.application_status === 'NEW_APPLICATION' ? 'bg-blue-500' :
                  profile.application_status === 'EVALUATION' ? 'bg-yellow-500' :
                  profile.application_status === 'APPROVED' ? 'bg-green-500' :
                  profile.application_status === 'REJECTED' ? 'bg-red-500' :
                  'bg-orange-500'
                }"></span>
                {profile.application_status === 'NEW_APPLICATION' ? 'Yeni Başvuru' :
                 profile.application_status === 'EVALUATION' ? 'Değerlendirmede' :
                 profile.application_status === 'APPROVED' ? 'Onaylı' :
                 profile.application_status === 'REJECTED' ? 'Reddedildi' :
                 'Güncelleme Gerekli'}
              </div>
            )}
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
                <p className="text-sm font-medium text-gray-700">{profile?.full_name || 'Aday'}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                <div className="py-1.5">
                  {/* Mobilde Statü Göster */}
                  {profile?.application_status && (
                    <>
                      <div className="sm:hidden px-3 py-2.5">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                          profile.application_status === 'NEW_APPLICATION' 
                            ? 'bg-blue-50 text-blue-700' 
                            : profile.application_status === 'EVALUATION' 
                            ? 'bg-yellow-50 text-yellow-700'
                            : profile.application_status === 'APPROVED' 
                            ? 'bg-green-50 text-green-700'
                            : profile.application_status === 'REJECTED' 
                            ? 'bg-red-50 text-red-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}>
                          {profile.application_status === 'NEW_APPLICATION' ? '🆕 Yeni Başvuru' :
                           profile.application_status === 'EVALUATION' ? '⏳ Değerlendirmede' :
                           profile.application_status === 'APPROVED' ? '✅ Onaylı' :
                           profile.application_status === 'REJECTED' ? '❌ Reddedildi' :
                           '📝 Güncelleme Gerekli'}
                        </div>
                      </div>
                      <div className="sm:hidden h-px bg-gray-100 my-1"></div>
                    </>
                  )}

                  <Link
                    href="/dashboard/candidate/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-md bg-[#16B24B]/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#16B24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Profil Bilgileri</p>
                      <p className="text-xs text-gray-400">Kişisel bilgilerinizi görüntüleyin</p>
                    </div>
                  </Link>

                  {isApproved && (
                    <>
                      <div className="h-px bg-gray-100 my-1"></div>
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
                    </>
                  )}

                  <div className="h-px bg-gray-100 my-1"></div>

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

      {/* Warning Modal */}
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
                      const resetCityId = candidateInfo?.city 
                        ? provinces.find((p) => p.name === candidateInfo.city)?.id 
                        : null;
                      setFormData({
                        fullName: profile?.full_name || '',
                        phone: candidateInfo?.phone || '',
                        email: candidateInfo?.email || '',
                        cityId: resetCityId ? String(resetCityId) : '',
                        district: candidateInfo?.district || '',
                        address: candidateInfo?.address || '',
                        dateOfBirth: candidateInfo?.date_of_birth || '',
                        nationalId: candidateInfo?.national_id || '',
                        iban: candidateInfo?.iban || '',
                        motorcyclePlate: candidateInfo?.motorcycle_plate || '',
                        hasCompany: vehicleInfo?.has_company ?? null,
                        hasP1: vehicleInfo?.has_p1 ?? null,
                        vehicleType: vehicleInfo?.vehicle_type || '',
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Kişisel Bilgiler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {/* YS Rider ID - Sadece varsa göster */}
            {candidateInfo?.rider_id && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-emerald-500 to-green-600">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-700 mb-0.5">YS Rider ID</p>
                  <p className="text-sm font-bold text-emerald-900">{candidateInfo.rider_id}</p>
                </div>
              </div>
            )}

            {/* Ad Soyad */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${profile?.full_name ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${profile?.full_name ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Ad Soyad</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                ) : (
                  <p className="text-sm font-medium truncate">{profile?.full_name ? <span className="text-gray-900">{profile.full_name}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}</p>
                )}
              </div>
              {!isEditing && !profile?.full_name && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Doğum Tarihi */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${birthDay && birthMonth && birthYear ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${birthDay && birthMonth && birthYear ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Doğum Tarihi</p>
                {isEditing ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-sm">
                    {birthDay && birthMonth && birthYear ? <span className="text-gray-900">{`${birthDay}/${birthMonth}/${birthYear}`}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}
                  </p>
                )}
              </div>
              {!isEditing && !(birthDay && birthMonth && birthYear) && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>

            {/* TC Kimlik No */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${candidateInfo?.national_id ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${candidateInfo?.national_id ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">TC Kimlik No</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    maxLength={11}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-sm">{candidateInfo?.national_id ? <span className="text-gray-900 font-mono">{candidateInfo.national_id}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}</p>
                )}
              </div>
              {!isEditing && !candidateInfo?.national_id && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 mt-6">İletişim & Adres Bilgileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {/* Telefon */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${candidateInfo?.phone ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${candidateInfo?.phone ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Telefon</p>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-sm">{candidateInfo?.phone ? <span className="text-gray-900">{candidateInfo.phone}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}</p>
                )}
              </div>
              {!isEditing && !candidateInfo?.phone && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>

            {/* E-posta */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${candidateInfo?.email ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${candidateInfo?.email ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">E-posta</p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-sm truncate">{candidateInfo?.email ? <span className="text-gray-900">{candidateInfo.email}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}</p>
                )}
              </div>
              {!isEditing && !candidateInfo?.email && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>

            {/* İl ve İlçe - Yan Yana */}
            <div className="md:col-span-2 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {/* İl */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${candidateInfo?.city ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                  <svg className={`w-4 h-4 ${candidateInfo?.city ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">İl</p>
                  {isEditing ? (
                    <SearchableSelect
                      id="profile-il-select"
                      aria-label="İl seçin"
                      options={ilOptions}
                      value={formData.cityId}
                      onChange={(v) => setFormData((prev) => ({ ...prev, cityId: v, district: '' }))}
                      placeholder="İl seçin veya arayın"
                      emptyMessage="İl bulunamadı"
                    />
                  ) : (
                    <p className="text-sm">{candidateInfo?.city ? <span className="text-gray-900">{candidateInfo.city}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}</p>
                  )}
                </div>
                {!isEditing && !candidateInfo?.city && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* İlçe */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${candidateInfo?.district ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                  <svg className={`w-4 h-4 ${candidateInfo?.district ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">İlçe</p>
                  {isEditing ? (
                    <SearchableSelect
                      id="profile-ilce-select"
                      aria-label="İlçe seçin"
                      options={ilceOptions}
                      value={formData.district}
                      onChange={(v) => setFormData((prev) => ({ ...prev, district: v }))}
                      placeholder={cityIdNum ? 'İlçe seçin veya arayın' : 'Önce il seçin'}
                      disabled={!cityIdNum}
                      emptyMessage="İlçe bulunamadı"
                    />
                  ) : (
                    <p className="text-sm">{candidateInfo?.district ? <span className="text-gray-900">{candidateInfo.district}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}</p>
                  )}
                </div>
                {!isEditing && !candidateInfo?.district && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Açık Adres */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors md:col-span-2 lg:col-span-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${candidateInfo?.address ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${candidateInfo?.address ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Açık Adres</p>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <p className="text-sm break-words">{candidateInfo?.address ? <span className="text-gray-900">{candidateInfo.address}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}</p>
                )}
              </div>
              {!isEditing && !candidateInfo?.address && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 mt-6">Araç ve Belge</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {/* Araç Tipi */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${(isEditing ? formData.vehicleType : vehicleInfo.vehicle_type) ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${(isEditing ? formData.vehicleType : vehicleInfo.vehicle_type) ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Araç Tipi</p>
                {isEditing ? (
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    <option value="MOTORCYCLE">Motosiklet</option>
                    <option value="CAR">Araba</option>
                  </select>
                ) : (
                  <p className="text-sm">
                    {vehicleInfo.vehicle_type === 'MOTORCYCLE' ? <span className="text-gray-900">Motosiklet</span> : vehicleInfo.vehicle_type === 'CAR' ? <span className="text-gray-900">Araba</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Motosiklet/Araba Türü */}
            {(vehicleInfo.vehicle_type === 'MOTORCYCLE' && vehicleInfo.vehicle_subtype) || (vehicleInfo.vehicle_type === 'CAR' && vehicleInfo.vehicle_subtype) ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#16B24B] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">
                    {vehicleInfo.vehicle_type === 'MOTORCYCLE' ? 'Motosiklet Türü' : 'Araba Türü'}
                  </p>
                  <p className="text-sm">
                    {vehicleInfo.vehicle_subtype === '50cc' ? <span className="text-gray-900">50cc ve Altı</span> : 
                     vehicleInfo.vehicle_subtype === '100cc_plus' ? <span className="text-gray-900">100cc ve Üzeri</span> :
                     vehicleInfo.vehicle_subtype === 'BINEK' ? <span className="text-gray-900">Binek Araç</span> :
                     vehicleInfo.vehicle_subtype === 'TICARI' ? <span className="text-gray-900">Ticari Araç</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Şirketiniz Var mı? */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${(isEditing ? formData.hasCompany : vehicleInfo.has_company) !== null ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${(isEditing ? formData.hasCompany : vehicleInfo.has_company) !== null ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Şirketiniz Var mı?</p>
                {isEditing ? (
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hasCompany"
                        checked={formData.hasCompany === true}
                        onChange={() => setFormData({ ...formData, hasCompany: true })}
                        className="w-4 h-4 text-[#16B24B] border-gray-300 focus:ring-[#16B24B]"
                      />
                      <span className="text-sm text-gray-900">Evet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hasCompany"
                        checked={formData.hasCompany === false}
                        onChange={() => setFormData({ ...formData, hasCompany: false })}
                        className="w-4 h-4 text-[#16B24B] border-gray-300 focus:ring-[#16B24B]"
                      />
                      <span className="text-sm text-gray-900">Hayır</span>
                    </label>
                  </div>
                ) : (
                  <p className="text-sm">
                    {vehicleInfo.has_company === true ? <span className="text-gray-900">Evet</span> : vehicleInfo.has_company === false ? <span className="text-gray-900">Hayır</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}
                  </p>
                )}
              </div>
            </div>

            {/* P1 Belgesi Var mı? */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${(isEditing ? formData.hasP1 : vehicleInfo.has_p1) !== null ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${(isEditing ? formData.hasP1 : vehicleInfo.has_p1) !== null ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">P1 Belgesi Var mı?</p>
                {isEditing ? (
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hasP1"
                        checked={formData.hasP1 === true}
                        onChange={() => setFormData({ ...formData, hasP1: true })}
                        className="w-4 h-4 text-[#16B24B] border-gray-300 focus:ring-[#16B24B]"
                      />
                      <span className="text-sm text-gray-900">Evet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hasP1"
                        checked={formData.hasP1 === false}
                        onChange={() => setFormData({ ...formData, hasP1: false })}
                        className="w-4 h-4 text-[#16B24B] border-gray-300 focus:ring-[#16B24B]"
                      />
                      <span className="text-sm text-gray-900">Hayır</span>
                    </label>
                  </div>
                ) : (
                  <p className="text-sm">
                    {vehicleInfo.has_p1 === true ? <span className="text-gray-900">Evet</span> : vehicleInfo.has_p1 === false ? <span className="text-gray-900">Hayır</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Plaka Bilgisi */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${candidateInfo?.motorcycle_plate ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${candidateInfo?.motorcycle_plate ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Plaka Bilgisi</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="motorcyclePlate"
                    value={formData.motorcyclePlate}
                    onChange={handleChange}
                    placeholder="34 ABC 123"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono"
                  />
                ) : (
                  <p className="text-sm">
                    {candidateInfo?.motorcycle_plate ? <span className="text-gray-900 font-mono">{candidateInfo.motorcycle_plate}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}
                  </p>
                )}
              </div>
              {!isEditing && !candidateInfo?.motorcycle_plate && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 mt-6">Banka Bilgileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {/* Alıcı Adı Soyadı - Değiştirilemez */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${profile?.full_name ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${profile?.full_name ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Alıcı Adı Soyadı</p>
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || '-'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Değiştirilemez</p>
              </div>
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Banka Adı - Sabit Garanti Bankası */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#16B24B] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">Banka Adı</p>
                <p className="text-sm font-medium text-gray-900">Garanti Bankası</p>
                <p className="text-xs text-gray-400 mt-0.5">Değiştirilemez</p>
              </div>
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* IBAN */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${candidateInfo?.iban ? 'bg-[#16B24B]' : 'bg-red-100'}`}>
                <svg className={`w-4 h-4 ${candidateInfo?.iban ? 'text-white' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">IBAN</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleChange}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    maxLength={32}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                ) : (
                  <p className="text-sm">{candidateInfo?.iban ? <span className="text-gray-900 font-mono">{candidateInfo.iban}</span> : <span className="text-red-600 font-bold">Eksik bilgi</span>}</p>
                )}
              </div>
              {!isEditing && !candidateInfo?.iban && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
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
              <p className="text-xs text-gray-400 mt-0.5">
                {vehicleInfo.has_company === true ? 'Şirket sahibi belgeleri' : 'Bireysel belgeler'}
              </p>
            </div>
          </div>

          {/* EVALUATION durumunda bilgi mesajı */}
          {profile?.application_status === 'EVALUATION' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Başvurunuz Değerlendiriliyor</h4>
                  <p className="text-sm text-blue-700">
                    Başvurunuz danışman tarafından inceleniyor. Bu süreçte bilgi ve belgelerinizde değişiklik yapamazsınız.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* UPDATE_REQUIRED durumunda bilgi mesajı */}
          {profile?.application_status === 'UPDATE_REQUIRED' && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Güncelleme Gerekli</h4>
                  <p className="text-sm text-orange-700">
                    Danışman bazı belgelerinizi reddetti. Lütfen reddedilen belgeleri güncelleyip tekrar değerlendirmeye gönderin.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Şirketi YOKSA - Her zaman gösterilecek belgeler */}
            {vehicleInfo.has_company === false && [
              { type: 'EHLIYETLI_SELFIE', label: 'Ehliyetli Selfie', color: 'pink' },
              { type: 'EKIPMANLI_FOTO', label: 'Ekipmanlı Fotoğraf', color: 'orange' },
            ].map((docType) => {
              const document = documents.find((doc) => doc.document_type === docType.type);
              return (
                <DocumentCard
                  key={docType.type}
                  docType={docType}
                  document={document}
                  canEdit={canEdit}
                  applicationStatus={profile?.application_status}
                  supabase={supabase}
                  onUpload={() => {
                    setSelectedDocumentType(docType.type);
                    setSelectedDocumentId(document?.id || null);
                    setUploadModalOpen(true);
                    setUploadError(null);
                    setUploadSuccess(false);
                    setSelectedFile(null);
                  }}
                />
              );
            })}

            {/* Şirketi YOKSA - documents_enabled olduktan sonra gösterilecek belgeler */}
            {vehicleInfo.has_company === false && candidateInfo?.documents_enabled === true && [
              { type: 'MUVAFAKATNAME', label: 'Muvafakatname', color: 'blue' },
              { type: 'KIMLIK_ON', label: 'Kimlik Ön Yüzü', color: 'indigo' },
              { type: 'RUHSAT', label: 'Ruhsat Fotoğrafı', color: 'amber' },
              { type: 'ADLI_SICIL', label: 'Adli Sicil Kaydı', color: 'red' },
              { type: 'TASIT_KART_DEKONT', label: 'Taşıt Kart Ücreti Dekont', color: 'cyan' },
              { type: 'IKAMETGAH', label: 'İkametgah', color: 'teal' },
            ].map((docType) => {
              const document = documents.find((doc) => doc.document_type === docType.type);
              return (
                <DocumentCard
                  key={docType.type}
                  docType={docType}
                  document={document}
                  canEdit={canEdit}
                  applicationStatus={profile?.application_status}
                  supabase={supabase}
                  onUpload={() => {
                    setSelectedDocumentType(docType.type);
                    setSelectedDocumentId(document?.id || null);
                    setUploadModalOpen(true);
                    setUploadError(null);
                    setUploadSuccess(false);
                    setSelectedFile(null);
                  }}
                />
              );
            })}

            {/* Sözleşme - Çoklu Sayfa (7 sayfa) - documents_enabled olduktan sonra */}
            {vehicleInfo.has_company === false && candidateInfo?.documents_enabled === true && (
              <MultiPageDocumentCard
                label="Sözleşme"
                color="purple"
                pageCount={7}
                documents={documents}
                docTypePrefix="SOZLESME"
                canEdit={canEdit}
                applicationStatus={profile?.application_status}
                onUpload={() => {
                  setMultiPageType('SOZLESME');
                  setMultiPageFiles({});
                  setMultiPageError(null);
                  setMultiPageSuccess(false);
                  setMultiPageModalOpen(true);
                }}
              />
            )}

            {/* İSG Evrakları - Çoklu Sayfa (5 sayfa) - documents_enabled olduktan sonra */}
            {vehicleInfo.has_company === false && candidateInfo?.documents_enabled === true && (
              <MultiPageDocumentCard
                label="İSG Evrakları"
                color="green"
                pageCount={5}
                documents={documents}
                docTypePrefix="ISG_EVRAKLARI"
                canEdit={canEdit}
                applicationStatus={profile?.application_status}
                onUpload={() => {
                  setMultiPageType('ISG_EVRAKLARI');
                  setMultiPageFiles({});
                  setMultiPageError(null);
                  setMultiPageSuccess(false);
                  setMultiPageModalOpen(true);
                }}
              />
            )}

            {/* Şirketi VARSA - Her zaman gösterilecek belgeler */}
            {vehicleInfo.has_company === true && [
              { type: 'VERGI_LEVHASI', label: 'Vergi Levhası', color: 'amber' },
              { type: 'P1_BELGESI', label: 'P1 Belgesi', color: 'blue' },
              { type: 'EHLIYETLI_SELFIE', label: 'Ehliyetli Selfie', color: 'pink' },
              { type: 'EKIPMANLI_FOTO', label: 'Ekipmanlı Fotoğraf', color: 'orange' },
            ].map((docType) => {
              const document = documents.find((doc) => doc.document_type === docType.type);
              return (
                <DocumentCard
                  key={docType.type}
                  docType={docType}
                  document={document}
                  canEdit={canEdit}
                  applicationStatus={profile?.application_status}
                  supabase={supabase}
                  onUpload={() => {
                    setSelectedDocumentType(docType.type);
                    setSelectedDocumentId(document?.id || null);
                    setUploadModalOpen(true);
                    setUploadError(null);
                    setUploadSuccess(false);
                    setSelectedFile(null);
                  }}
                />
              );
            })}

            {/* Şirketi VARSA - documents_enabled olduktan sonra gösterilecek belgeler */}
            {vehicleInfo.has_company === true && candidateInfo?.documents_enabled === true && [
              { type: 'ADLI_SICIL', label: 'Adli Sicil Kaydı', color: 'red' },
              { type: 'BIMASRAF_ENTEGRASYONU', label: 'BiMasraf Entegrasyonu', color: 'purple' },
            ].map((docType) => {
              const document = documents.find((doc) => doc.document_type === docType.type);
              return (
                <DocumentCard
                  key={docType.type}
                  docType={docType}
                  document={document}
                  canEdit={canEdit}
                  applicationStatus={profile?.application_status}
                  supabase={supabase}
                  onUpload={() => {
                    setSelectedDocumentType(docType.type);
                    setSelectedDocumentId(document?.id || null);
                    setUploadModalOpen(true);
                    setUploadError(null);
                    setUploadSuccess(false);
                    setSelectedFile(null);
                  }}
                />
              );
            })}
          </div>

          {/* Başvurumu Değerlendirmeye Gönder Butonu - EVALUATION aşamasında gösterme */}
          {(profile?.application_status === 'NEW_APPLICATION' || profile?.application_status === 'UPDATE_REQUIRED') && (
            <div className="mt-6">
              <SubmitApplicationButton
                profileId={profile?.id || ''}
                applicationStatus={profile?.application_status || null}
                candidateInfo={candidateInfo}
                documents={documents}
                requiredDocumentTypes={
                  vehicleInfo?.has_company === true
                    ? candidateInfo?.documents_enabled === true
                      ? [
                          'VERGI_LEVHASI',
                          'ADLI_SICIL',
                          'P1_BELGESI',
                          'BIMASRAF_ENTEGRASYONU',
                          'EHLIYETLI_SELFIE',
                          'EKIPMANLI_FOTO',
                        ]
                      : [
                          'VERGI_LEVHASI',
                          'P1_BELGESI',
                          'EHLIYETLI_SELFIE',
                          'EKIPMANLI_FOTO',
                        ]
                    : candidateInfo?.documents_enabled === true
                      ? [
                          'MUVAFAKATNAME',
                          'KIMLIK_ON',
                          'SOZLESME_1', 'SOZLESME_2', 'SOZLESME_3', 'SOZLESME_4', 'SOZLESME_5', 'SOZLESME_6', 'SOZLESME_7',
                          'ISG_EVRAKLARI_1', 'ISG_EVRAKLARI_2', 'ISG_EVRAKLARI_3', 'ISG_EVRAKLARI_4', 'ISG_EVRAKLARI_5',
                          'RUHSAT',
                          'ADLI_SICIL',
                          'TASIT_KART_DEKONT',
                          'IKAMETGAH',
                          'EHLIYETLI_SELFIE',
                          'EKIPMANLI_FOTO',
                        ]
                      : [
                          'EHLIYETLI_SELFIE',
                          'EKIPMANLI_FOTO',
                        ]
                }
                documentsEnabled={candidateInfo?.documents_enabled === true}
                onSuccess={() => {
                  // Başarılı gönderimden sonra verileri yeniden yükle
                  loadData();
                }}
              />
            </div>
          )}
        </div>
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
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadSuccess(false);
                    setSelectedFile(null);
                    // Tüm verileri yeniden yükle (profile, documents, vb.)
                    loadData();
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
                    {selectedDocumentType === 'MUVAFAKATNAME' && 'Muvafakatname'}
                    {selectedDocumentType === 'KIMLIK_ON' && 'Kimlik Ön Yüzü'}
                    {selectedDocumentType === 'RUHSAT' && 'Ruhsat Fotoğrafı'}
                    {selectedDocumentType === 'ADLI_SICIL' && 'Adli Sicil Kaydı'}
                    {selectedDocumentType === 'TASIT_KART_DEKONT' && 'Taşıt Kart Ücreti Dekont'}
                    {selectedDocumentType === 'IKAMETGAH' && 'İkametgah'}
                    {selectedDocumentType === 'EHLIYETLI_SELFIE' && 'Ehliyetli Selfie'}
                    {selectedDocumentType === 'EKIPMANLI_FOTO' && 'Ekipmanlı Fotoğraf'}
                    {selectedDocumentType === 'VERGI_LEVHASI' && 'Vergi Levhası'}
                    {selectedDocumentType === 'P1_BELGESI' && 'P1 Belgesi'}
                    {selectedDocumentType === 'BIMASRAF_ENTEGRASYONU' && 'BiMasraf Entegrasyonu'}
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

      {/* Çoklu Sayfa Yükleme Modal */}
      {multiPageModalOpen && multiPageType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {multiPageType === 'SOZLESME' ? 'Sözleşme Yükle' : 'İSG Evrakları Yükle'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {multiPageType === 'SOZLESME' ? '7 sayfa' : '5 sayfa'} yüklemeniz gerekmektedir
                </p>
              </div>
              <button
                onClick={() => {
                  setMultiPageModalOpen(false);
                  setMultiPageFiles({});
                  setMultiPageError(null);
                  setMultiPageSuccess(false);
                }}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {multiPageSuccess ? (
              <div className="p-4 sm:p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Sayfalar Başarıyla Yüklendi!</h4>
                  <p className="text-sm text-gray-600 mb-6">Belgeler incelenmek üzere gönderildi.</p>
                  <button
                    onClick={async () => {
                      setMultiPageModalOpen(false);
                      setMultiPageSuccess(false);
                      setMultiPageFiles({});
                      // Belgeleri yeniden yükle
                      const { data: { user } } = await supabase.auth.getUser();
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
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <div className="space-y-3">
                    {Array.from({ length: multiPageType === 'SOZLESME' ? 7 : 5 }, (_, i) => {
                      const pageNum = i + 1;
                      const docType = `${multiPageType}_${pageNum}`;
                      const existingDoc = documents.find((doc) => doc.document_type === docType);
                      const selectedFile = multiPageFiles[pageNum];
                      
                      return (
                        <div
                          key={pageNum}
                          className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                            selectedFile
                              ? 'border-blue-300 bg-blue-50'
                              : existingDoc
                              ? existingDoc.status === 'APPROVED'
                                ? 'border-green-200 bg-green-50'
                                : existingDoc.status === 'REJECTED'
                                ? 'border-red-200 bg-red-50'
                                : 'border-yellow-200 bg-yellow-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selectedFile
                                  ? 'bg-blue-200 text-blue-700'
                                  : existingDoc
                                  ? existingDoc.status === 'APPROVED'
                                    ? 'bg-green-200 text-green-700'
                                    : existingDoc.status === 'REJECTED'
                                    ? 'bg-red-200 text-red-700'
                                    : 'bg-yellow-200 text-yellow-700'
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                <span className="text-sm font-bold">{pageNum}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {pageNum}. Sayfa
                                </p>
                                {selectedFile ? (
                                  <p className="text-xs text-blue-600 truncate">{selectedFile.name}</p>
                                ) : existingDoc ? (
                                  <p className="text-xs text-gray-500 truncate">{existingDoc.file_name}</p>
                                ) : (
                                  <p className="text-xs text-gray-400">Henüz yüklenmedi</p>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const file = e.target.files[0];
                                      if (file.size > 50 * 1024 * 1024) {
                                        setMultiPageError(`Sayfa ${pageNum}: Dosya boyutu 50MB'dan küçük olmalıdır`);
                                        return;
                                      }
                                      setMultiPageFiles((prev) => ({ ...prev, [pageNum]: file }));
                                      setMultiPageError(null);
                                    }
                                  }}
                                />
                                <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors ${
                                  selectedFile || existingDoc
                                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  <span className="hidden sm:inline">{selectedFile || existingDoc ? 'Değiştir' : 'Seç'}</span>
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {multiPageError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{multiPageError}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={async () => {
                        const selectedFiles = Object.entries(multiPageFiles);
                        if (selectedFiles.length === 0) {
                          setMultiPageError('Lütfen en az bir sayfa seçin');
                          return;
                        }

                        setMultiPageUploading(true);
                        setMultiPageError(null);

                        try {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) {
                            setMultiPageError('Giriş yapmamışsınız');
                            setMultiPageUploading(false);
                            return;
                          }

                          for (const [pageNumStr, file] of selectedFiles) {
                            if (!file) continue;
                            const pageNum = parseInt(pageNumStr);
                            const docType = `${multiPageType}_${pageNum}`;

                            // Dosyayı Storage'a yükle
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${Date.now()}_${pageNum}.${fileExt}`;
                            const filePath = `${user.id}/${fileName}`;

                            const { error: uploadErr } = await supabase.storage
                              .from('documents')
                              .upload(filePath, file, { cacheControl: '3600', upsert: false });

                            if (uploadErr) {
                              throw new Error(`Sayfa ${pageNum} yüklenirken hata: ${uploadErr.message}`);
                            }

                            // Mevcut belgeyi kontrol et
                            const { data: existingDoc } = await supabase
                              .from('documents')
                              .select('id, file_path')
                              .eq('profile_id', user.id)
                              .eq('document_type', docType)
                              .single();

                            if (existingDoc) {
                              // Güncelle
                              await supabase
                                .from('documents')
                                .update({
                                  file_name: file.name,
                                  file_path: filePath,
                                  file_size: file.size,
                                  mime_type: file.type,
                                  status: null,
                                  reviewed_by: null,
                                  reviewed_at: null,
                                  review_notes: null,
                                  updated_at: new Date().toISOString(),
                                })
                                .eq('id', existingDoc.id);

                              // Eski dosyayı sil
                              if (existingDoc.file_path && existingDoc.file_path !== filePath) {
                                await supabase.storage.from('documents').remove([existingDoc.file_path]);
                              }
                            } else {
                              // Yeni kayıt
                              await supabase.from('documents').insert({
                                profile_id: user.id,
                                document_type: docType,
                                file_name: file.name,
                                file_path: filePath,
                                file_size: file.size,
                                mime_type: file.type,
                                status: null,
                              });
                            }
                          }

                          setMultiPageSuccess(true);
                        } catch (err: any) {
                          setMultiPageError(err.message || 'Yükleme sırasında hata oluştu');
                        } finally {
                          setMultiPageUploading(false);
                        }
                      }}
                      disabled={multiPageUploading || Object.keys(multiPageFiles).length === 0}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {multiPageUploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Seçilen Sayfaları Yükle ({Object.keys(multiPageFiles).length})</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setMultiPageModalOpen(false);
                        setMultiPageFiles({});
                        setMultiPageError(null);
                      }}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-12 md:mt-16">
        <Footer />
      </div>
    </div>
  );
}
