/**
 * Başvuru Karar Component (Yeni Statü Sistemi)
 * 
 * Yeni başvuru statüsü sistemine göre güncellendi
 */

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Application {
  profile: {
    id: string;
    full_name: string;
    application_status: string | null;
  };
  documents: Array<{
    id: string;
    document_type: string;
    status: 'APPROVED' | 'REJECTED' | null;
  }>;
  applicationStatus: 'NEW_APPLICATION' | 'EVALUATION' | 'APPROVED' | 'REJECTED' | 'UPDATE_REQUIRED';
}

interface ApplicationDecisionProps {
  application: Application;
  onUpdate: () => void;
}

export default function ApplicationDecision({
  application,
  onUpdate,
}: ApplicationDecisionProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const updateApplicationStatus = async (newStatus: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Giriş yapmamışsınız');
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        application_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.profile.id);

    if (updateError) throw updateError;
  };

  const handleApprove = async () => {
    // Tüm belgelerin onaylanmış olması gerekir
    const allDocumentsApproved = application.documents.length > 0 && 
      application.documents.every((doc) => doc.status === 'APPROVED');

    if (!allDocumentsApproved) {
      setErrorMessage('Lütfen önce tüm belgeleri onaylayın');
      setShowErrorModal(true);
      return;
    }

    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    setShowApproveModal(false);
    setLoading(true);
    setError(null);

    try {
      await updateApplicationStatus('APPROVED');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Onaylama sırasında hata oluştu');
      setLoading(false);
    }
  };

  const handleReject = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason || rejectReason.trim() === '') {
      setErrorMessage('Lütfen red nedeni girin');
      setShowErrorModal(true);
      return;
    }

    setShowRejectModal(false);
    setLoading(true);
    setError(null);

    try {
      await updateApplicationStatus('REJECTED');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Reddetme sırasında hata oluştu');
      setLoading(false);
    }
  };

  const handleUpdateRequired = () => {
    // Tüm belgelerin işaretlenmiş (APPROVED veya REJECTED) olması gerekir
    const allDocumentsReviewed = application.documents.length > 0 && 
      application.documents.every((doc) => doc.status === 'APPROVED' || doc.status === 'REJECTED');

    if (!allDocumentsReviewed) {
      setErrorMessage('Lütfen önce tüm belgeleri onaylayın veya reddedin');
      setShowErrorModal(true);
      return;
    }

    // En az bir belge reddedilmiş olmalı
    const hasRejectedDocuments = application.documents.some((doc) => doc.status === 'REJECTED');

    if (!hasRejectedDocuments) {
      setErrorMessage('Bilgi/Evrak güncelleme için en az bir belge reddedilmiş olmalıdır');
      setShowErrorModal(true);
      return;
    }

    setShowUpdateModal(true);
  };

  const confirmUpdate = async () => {
    setShowUpdateModal(false);
    setLoading(true);
    setError(null);

    try {
      await updateApplicationStatus('UPDATE_REQUIRED');
      // TODO: Email bildirimi gönder
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Güncelleme sırasında hata oluştu');
      setLoading(false);
    }
  };

  const handleRequireUpdateFromApproved = () => {
    setShowUpdateModal(true);
  };

  const confirmUpdateFromApproved = async () => {
    setShowUpdateModal(false);
    setLoading(true);
    setError(null);

    try {
      await updateApplicationStatus('UPDATE_REQUIRED');
      // TODO: Email bildirimi gönder
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Güncelleme sırasında hata oluştu');
      setLoading(false);
    }
  };

  // Yeni Başvuru statüsündeyse "Değerlendirmeye Al" butonu göster
  const handleStartEvaluation = async () => {
    setLoading(true);
    setError(null);

    try {
      await updateApplicationStatus('EVALUATION');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Değerlendirmeye alma sırasında hata oluştu');
      setLoading(false);
    }
  };

  // NEW_APPLICATION: Aday henüz başvurusunu göndermedi
  if (application.applicationStatus === 'NEW_APPLICATION') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold border border-gray-200">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Aday Başvurusunu Henüz Göndermedi</span>
      </div>
    );
  }

  // Bilgi/Evrak Güncelleme statüsündeyse danışman işlem yapamaz
  if (application.applicationStatus === 'UPDATE_REQUIRED') {
    return (
      <div className="text-xs text-orange-600 text-center">
        Güncelleme Bekleniyor
      </div>
    );
  }

  // Reddedildi statüsündeyse işlem yapılamaz
  if (application.applicationStatus === 'REJECTED') {
    return (
      <div className="text-xs text-gray-500 text-center">
        Reddedildi
      </div>
    );
  }

  // Onaylı statüsündeyse sadece "Bilgi/Evrak Güncelleme Gerekli" butonu göster
  if (application.applicationStatus === 'APPROVED') {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequireUpdateFromApproved}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-xs font-semibold hover:from-orange-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transform hover:scale-105"
            title="Bilgi/Evrak Güncelleme Gerekli"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Güncelle</span>
          </button>
          {error && (
            <div className="text-xs text-red-600 mt-1 text-center">
              {error}
            </div>
          )}
        </div>

        {/* Güncelle Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Güncelleme Onayı</h3>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Bu başvuruyu "Bilgi/Evrak Güncelleme Gerekli" durumuna geçirmek istediğinize emin misiniz? Adaya bildirim gidecektir.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmUpdateFromApproved}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Güncelleniyor...' : 'Evet, Güncelle'}
                </button>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Değerlendirme aşamasında - işlemler yapılabilir
  // "Bilgi/Evrak Güncelleme" butonu için kontrol: Tüm belgeler işaretlenmiş olmalı
  const allDocumentsReviewed = application.documents.length > 0 && 
    application.documents.every((doc) => doc.status === 'APPROVED' || doc.status === 'REJECTED');
  const hasRejectedDocuments = application.documents.some((doc) => doc.status === 'REJECTED');
  const canUpdateRequired = allDocumentsReviewed && hasRejectedDocuments;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transform hover:scale-105"
          title="Onayla"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Onay</span>
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-xs font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transform hover:scale-105"
          title="Reddet"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Red</span>
        </button>
        <button
          onClick={handleUpdateRequired}
          disabled={loading || !canUpdateRequired}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-xs font-semibold hover:from-orange-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transform hover:scale-105"
          title={canUpdateRequired ? "Bilgi/Evrak Güncelleme" : "Tüm belgeleri işaretleyin ve en az bir belgeyi reddedin"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Güncelle</span>
        </button>

        {error && (
          <div className="text-xs text-red-600 mt-1 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Onay Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Onay Onayı</h3>
              <button
                onClick={() => setShowApproveModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Bu başvuruyu onaylamak istediğinize emin misiniz?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmApprove}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Onaylanıyor...' : 'Evet, Onayla'}
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Red Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Red Onayı</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Bu başvuruyu reddetmek istediğinize emin misiniz?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Red Nedeni <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Red nedeni giriniz..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmReject}
                disabled={loading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Reddediliyor...' : 'Evet, Reddet'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Güncelle Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Güncelleme Onayı</h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Bu başvuruyu "Bilgi/Evrak Güncelleme" durumuna geçirmek istediğinize emin misiniz? Adaya bildirim gidecektir.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmUpdate}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Güncelleniyor...' : 'Evet, Güncelle'}
              </button>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hata Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Uyarı</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {errorMessage}
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
