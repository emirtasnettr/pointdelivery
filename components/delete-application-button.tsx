/**
 * Başvuru Silme Butonu (Danışman için)
 * 
 * Test süreci için - başvuruyu ve ilişkili belgeleri siler
 */

'use client';

import { useState } from 'react';

interface DeleteApplicationButtonProps {
  profileId: string;
  candidateName: string;
  canDelete: boolean;
  onDelete: () => void;
}

export default function DeleteApplicationButton({
  profileId,
  candidateName,
  canDelete,
  onDelete,
}: DeleteApplicationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleDelete = () => {
    if (!canDelete) {
      setShowErrorModal(true);
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    setError(null);

    console.log('Silme işlemi başlatılıyor, profileId:', profileId);

    if (!profileId) {
      setError('Profil ID bulunamadı');
      setLoading(false);
      return;
    }

    try {
      const url = `/api/consultant/applications/${profileId}/delete`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      const result = await response.json();
      console.log('API Response:', result, 'Status:', response.status);

      if (!response.ok || result.error) {
        setError(result.error || 'Silme işlemi başarısız oldu');
        setLoading(false);
      } else {
        onDelete();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Bir hata oluştu');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-end">
        <button
          onClick={handleDelete}
          disabled={loading}
          className={`px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-xs font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transform hover:scale-105 ${
            !canDelete ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={canDelete ? 'Başvuruyu Sil' : 'Silme işlemi için önce tüm belgeleri reddetmelisiniz'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>{loading ? 'Siliniyor...' : 'Sil'}</span>
        </button>
        {error && (
          <div className="text-xs text-red-600 mt-1 text-right max-w-32">
            {error}
          </div>
        )}
      </div>

      {/* Sil Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Silme Onayı</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 text-center mb-2">
                <strong>"{candidateName}"</strong> adlı adayın başvurusunu ve tüm belgelerini silmek istediğinize emin misiniz?
              </p>
              <p className="text-xs text-red-600 text-center font-medium">
                Bu işlem geri alınamaz!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hata Modal - Tüm belgeler reddedilmemiş */}
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
                Silme işlemi için önce <strong>"{candidateName}"</strong> adlı adayın <strong>tüm belgelerini reddetmelisiniz</strong>.
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
