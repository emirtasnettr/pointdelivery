/**
 * Belge Kontrol Component
 * 
 * Her belge türü için görüntüle, onayla, reddet butonları
 */

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DocumentControlProps {
  documentType: 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA';
  document: {
    id: string;
    file_name: string;
    file_path: string;
    status: 'APPROVED' | 'REJECTED' | null;
    mime_type: string | null;
  } | undefined;
  profileId: string;
  onUpdate: () => void;
  applicationStatus?: string;
}

export default function DocumentControl({
  documentType,
  document,
  profileId,
  onUpdate,
  applicationStatus,
}: DocumentControlProps) {
  // Consultant'lar sadece "Değerlendirme" statüsündeki başvuruların belgelerini işaretleyebilir
  // "Yeni Başvuru" ve "Bilgi/Evrak Güncelleme" statülerinde işlem yapılamaz
  const canReview = applicationStatus === 'EVALUATION';
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleApprove = async () => {
    if (!document) return;

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Giriş yapmamışsınız');
      }

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'APPROVED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: null,
        })
        .eq('id', document.id);

      if (updateError) throw updateError;

      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Onaylama sırasında hata oluştu');
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!document) return;

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Giriş yapmamışsınız');
      }

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'REJECTED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: 'Belge reddedildi',
        })
        .eq('id', document.id);

      if (updateError) throw updateError;

      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Reddetme sırasında hata oluştu');
      setLoading(false);
    }
  };

  const isApproved = document?.status === 'APPROVED';
  const isRejected = document?.status === 'REJECTED';
  const hasDocument = !!document;

  return (
    <div className="w-full">
      {hasDocument ? (
        <div className="flex flex-col gap-2">
          {/* Görüntüle Butonu */}
          <button
            onClick={handleView}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Yükleniyor...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Görüntüle</span>
              </>
            )}
          </button>

          {/* Onayla ve Reddet Butonları */}
          {canReview && (
            <div className="flex gap-2">
              {/* Onayla Butonu */}
              <button
                onClick={handleApprove}
                disabled={loading || isApproved}
                className={`flex-1 min-w-0 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 overflow-hidden ${
                  isApproved
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 active:bg-green-200 border border-green-300'
                }`}
                title={isApproved ? 'Onaylandı' : 'Onayla'}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="truncate text-xs sm:text-sm">
                  {isApproved ? 'Onaylandı' : 'Onayla'}
                </span>
              </button>

              {/* Reddet Butonu */}
              <button
                onClick={handleReject}
                disabled={loading || isRejected}
                className={`flex-1 min-w-0 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 overflow-hidden ${
                  isRejected
                    ? 'bg-red-500 text-white cursor-default'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200 border border-red-300'
                }`}
                title={isRejected ? 'Reddedildi' : 'Reddet'}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="truncate text-xs sm:text-sm">
                  {isRejected ? 'Reddedildi' : 'Reddet'}
                </span>
              </button>
            </div>
          )}

          {!canReview && applicationStatus === 'NEW_APPLICATION' && (
            <div className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded-lg border border-gray-200">
              Yeni başvurular için belge kontrolü yapılamaz
            </div>
          )}
          {!canReview && applicationStatus === 'UPDATE_REQUIRED' && (
            <div className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded-lg border border-gray-200">
              Bilgi/Evrak güncelleme aşamasında belge kontrolü yapılamaz
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic text-center py-3 bg-gray-50 rounded-lg border border-gray-200">
          Belge yüklenmemiş
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
