/**
 * Belge Satırı Component
 * 
 * Her belge türü için bir satır gösterir
 * Yüklenmemişse "Yükle" butonu, yüklenmişse önizleme ve "Değiştir" butonu
 */

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import DocumentDownloadButton from '@/components/document-download-button';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  status: 'APPROVED' | 'REJECTED' | null;
  mime_type: string | null;
  created_at: string;
  review_notes: string | null;
}

interface DocumentRowProps {
  documentType: 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA';
  documentTypeLabel: string;
  documentTypeIcon: string;
  document: Document | undefined;
  profileId: string;
  canEdit?: boolean;
  canView?: boolean;
  canDownload?: boolean;
  applicationStatus?: string;
}

export default function DocumentRow({
  documentType,
  documentTypeLabel,
  documentTypeIcon,
  document,
  profileId,
  canEdit = true,
  canView = true,
  canDownload = true,
  applicationStatus,
}: DocumentRowProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case null:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'APPROVED':
        return 'Kabul';
      case 'REJECTED':
        return 'Red';
      case null:
      default:
        return 'Henüz İncelenmedi';
    }
  };

  const handleView = async () => {
    if (!document) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600);

      if (urlError) throw urlError;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      setError(err.message || 'Belge açılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        {/* Sol taraf: Belge bilgileri */}
        <div className="flex items-center gap-4 flex-1">
          <div className="text-3xl">{documentTypeIcon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {documentTypeLabel}
            </h3>
            {document ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {canView ? (
                    <button
                      onClick={handleView}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
                    >
                      {loading ? 'Yükleniyor...' : document.file_name}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-medium text-sm">
                      {document.file_name}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}
                  >
                    {getStatusText(document.status)}
                  </span>
                </div>
                {document.review_notes && (
                  <p className="text-sm text-gray-600 italic">
                    Not: {document.review_notes}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Yüklenme: {new Date(document.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Belge yükleyiniz</p>
            )}
          </div>
        </div>

        {/* Sağ taraf: Butonlar */}
        <div className="flex items-center gap-3">
          {document ? (
            <>
              {canDownload && (
                <DocumentDownloadButton filePath={document.file_path} fileName={document.file_name} />
              )}
              {canEdit && !(applicationStatus === 'UPDATE_REQUIRED' && document.status === 'APPROVED') && (
                <Link
                  href={`/documents/upload?type=${documentType}&replace=true&documentId=${document.id}&candidateId=${profileId}`}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Değiştir
                </Link>
              )}
            </>
          ) : (
            canEdit && (
              <Link
                href={`/documents/upload?type=${documentType}&candidateId=${profileId}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Yükle
              </Link>
            )
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
