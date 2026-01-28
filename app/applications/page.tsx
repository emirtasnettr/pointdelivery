/**
 * Aday Başvuru Yönetimi Sayfası
 * 
 * Consultant'ların tüm başvuruları yönetebileceği sayfa
 * Liste görünümü, filtreleme, belge kontrolü ve başvuru kararı
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import LogoutButton from '@/components/logout-button';
import DocumentControl from '@/components/document-control';
import ApplicationDecision from '@/components/application-decision';

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MISSING' | 'ALL';
type DocumentType = 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  profile_id: string;
  mime_type: string | null;
}

interface CandidateInfo {
  id: string;
  profile_id: string;
  experience_years: number | null;
  phone: string | null;
  email: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Application {
  profile: Profile;
  candidateInfo: CandidateInfo | null;
  documents: Document[];
  applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MISSING';
}

export default function ApplicationsManagementPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [activeFilter, setActiveFilter] = useState<ApplicationStatus>('PENDING');
  const [error, setError] = useState<string | null>(null);

  // Tüm başvuruları yükle
  useEffect(() => {
    async function loadApplications() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Profil ve rol kontrolü
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || !['CONSULTANT', 'ADMIN'].includes(profile.role)) {
          router.push('/');
          return;
        }

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
            // Aday bilgilerini al
            const { data: candidateInfo } = await supabase
              .from('candidate_info')
              .select('*')
              .eq('profile_id', candidate.id)
              .single();

            // Belgeleri al
            const { data: documents } = await supabase
              .from('documents')
              .select('*')
              .eq('profile_id', candidate.id)
              .order('created_at', { ascending: false });

            // Başvuru durumunu belirle (belgelerin durumuna göre)
            let applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MISSING' = 'PENDING';
            
            if (documents && documents.length > 0) {
              const allApproved = documents.every(doc => doc.status === 'APPROVED');
              const hasRejected = documents.some(doc => doc.status === 'REJECTED');
              const hasPending = documents.some(doc => doc.status === 'PENDING');
              
              if (hasRejected) {
                applicationStatus = 'REJECTED';
              } else if (allApproved && !hasPending) {
                applicationStatus = 'APPROVED';
              } else if (hasPending) {
                applicationStatus = 'PENDING';
              }
            } else {
              applicationStatus = 'MISSING';
            }

            return {
              profile: candidate,
              candidateInfo: candidateInfo || null,
              documents: documents || [],
              applicationStatus,
            };
          })
        );

        setApplications(applicationsData);
        filterApplications(applicationsData, activeFilter);
      } catch (err: any) {
        setError(err.message || 'Başvurular yüklenirken hata oluştu');
        console.error('Error loading applications:', err);
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, [router, supabase]);

  // Filtreleme
  const filterApplications = (apps: Application[], filter: ApplicationStatus) => {
    if (filter === 'ALL') {
      setFilteredApplications(apps);
    } else {
      setFilteredApplications(apps.filter(app => app.applicationStatus === filter));
    }
  };

  useEffect(() => {
    filterApplications(applications, activeFilter);
  }, [activeFilter, applications]);

  // Belge durumu güncellendiğinde listeyi yenile
  const handleDocumentUpdate = () => {
    router.refresh();
    window.location.reload(); // Geçici çözüm - daha iyi bir state management eklenebilir
  };

  // Başvuru durumu güncellendiğinde listeyi yenile
  const handleApplicationUpdate = () => {
    router.refresh();
    window.location.reload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded">
            ONAYLANDI
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded">
            REDDEDİLDİ
          </span>
        );
      case 'MISSING':
        return (
          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded">
            GÜNCELLEME GEREKLİ
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
            ONAY BEKLİYOR
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href={`/dashboard/consultant`} className="text-blue-600 hover:text-blue-700">
                ← Dashboard'a Dön
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-900 font-semibold">Jobull</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Filter Tabs */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Aday Başvuru Yönetimi
          </h1>
          <p className="text-gray-600 mb-6">
            {filteredApplications.length} aday listeleniyor
          </p>

          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveFilter('PENDING')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeFilter === 'PENDING'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Bekleyenler
            </button>
            <button
              onClick={() => setActiveFilter('APPROVED')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeFilter === 'APPROVED'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Onaylananlar
            </button>
            <button
              onClick={() => setActiveFilter('REJECTED')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeFilter === 'REJECTED'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Reddedilenler
            </button>
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeFilter === 'ALL'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Tüm Kayıtlar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4 grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
              <div className="col-span-3">ADAY BİLGİLERİ</div>
              <div className="col-span-1">DENEYİM</div>
              <div className="col-span-6">BELGE KONTROLLERİ</div>
              <div className="col-span-2">KARAR</div>
            </div>

            {/* Applications Rows */}
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((app) => (
                <ApplicationRow
                  key={app.profile.id}
                  application={app}
                  onDocumentUpdate={handleDocumentUpdate}
                  onApplicationUpdate={handleApplicationUpdate}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">Bu filtreye uygun başvuru bulunmuyor.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Application Row Component
function ApplicationRow({
  application,
  onDocumentUpdate,
  onApplicationUpdate,
}: {
  application: Application;
  onDocumentUpdate: () => void;
  onApplicationUpdate: () => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded">
            ONAYLANDI
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded">
            REDDEDİLDİ
          </span>
        );
      case 'MISSING':
        return (
          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded">
            GÜNCELLEME GEREKLİ
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded">
            ONAY BEKLİYOR
          </span>
        );
    }
  };

  const documentTypes: DocumentType[] = ['CV', 'POLICE', 'RESIDENCE', 'KIMLIK', 'DIPLOMA'];

  return (
    <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
      {/* Aday Bilgileri */}
      <div className="col-span-3">
        <div className="font-semibold text-gray-900">{application.profile.full_name || 'İsimsiz'}</div>
        <div className="text-sm text-gray-600 mt-1">
          ID: {application.profile.id.slice(0, 8)}...
        </div>
        <div className="mt-2">
          {getStatusBadge(application.applicationStatus)}
        </div>
      </div>

      {/* Deneyim */}
      <div className="col-span-1">
        <div className="text-gray-900 font-medium">
          {application.candidateInfo?.experience_years || 0} Yıl
        </div>
      </div>

      {/* Belge Kontrolleri */}
      <div className="col-span-6">
        <div className="grid grid-cols-4 gap-2">
          {documentTypes.map((docType) => {
            const document = application.documents.find(
              (doc) => doc.document_type === docType
            );
            // DocumentControl component'i status'u 'APPROVED' | 'REJECTED' | null bekliyor
            // Document type'ında 'PENDING' var, bu yüzden map ediyoruz
            const mappedDocument = document ? {
              id: document.id,
              file_name: document.file_name,
              file_path: document.file_path,
              status: document.status === 'PENDING' ? null : (document.status as 'APPROVED' | 'REJECTED' | null),
              mime_type: document.mime_type,
            } : undefined;
            return (
              <DocumentControl
                key={docType}
                documentType={docType}
                document={mappedDocument}
                profileId={application.profile.id}
                onUpdate={onDocumentUpdate}
              />
            );
          })}
        </div>
      </div>

      {/* Karar */}
      <div className="col-span-2">
        <ApplicationDecision
          application={application}
          onUpdate={onApplicationUpdate}
        />
      </div>
    </div>
  );
}
