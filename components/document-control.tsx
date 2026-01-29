/**
 * Belge Kontrol Component
 * 
 * Her belge türü için görüntüle, onayla, reddet butonları
 */

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DocumentControlProps {
  documentType: string; // Herhangi bir belge tipi
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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

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

  const openRejectModal = () => {
    setRejectReason('');
    setRejectError(null);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!document) return;

    // En az 15 karakter kontrolü
    if (rejectReason.trim().length < 15) {
      setRejectError('Red nedeni en az 15 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setRejectError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Giriş yapmamışsınız');
      }

      // Belgeyi reddet
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'REJECTED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: rejectReason.trim(),
        })
        .eq('id', document.id);

      if (updateError) throw updateError;

      // Başvuru durumunu otomatik olarak UPDATE_REQUIRED yap
      const { error: statusError } = await supabase
        .from('profiles')
        .update({
          application_status: 'UPDATE_REQUIRED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (statusError) {
        console.error('Başvuru durumu güncellenemedi:', statusError);
      }

      setShowRejectModal(false);
      onUpdate();
    } catch (err: any) {
      setRejectError(err.message || 'Reddetme sırasında hata oluştu');
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
                onClick={openRejectModal}
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

      {/* Red Nedeni Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Belge Reddi</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectError(null);
                }}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Bu belgeyi neden reddediyorsunuz? Aday bu açıklamayı görecektir.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Red Nedeni <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError(null);
                  }}
                  placeholder="Belgenin neden reddedildiğini açıklayın... (en az 15 karakter)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                  rows={4}
                />
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${rejectReason.length < 15 ? 'text-red-500' : 'text-green-600'}`}>
                    {rejectReason.length}/15 karakter (minimum)
                  </span>
                </div>
                
                {rejectError && (
                  <p className="mt-2 text-sm text-red-600">{rejectError}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={confirmReject}
                disabled={loading || rejectReason.trim().length < 15}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Reddediliyor...' : 'Reddet'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectError(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
