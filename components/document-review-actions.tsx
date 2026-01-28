/**
 * Belge Onaylama/Reddetme Component
 * 
 * Consultant'ların belgeleri onaylayıp reddedebileceği component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface DocumentReviewActionsProps {
  documentId: string;
}

export default function DocumentReviewActions({ documentId }: DocumentReviewActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!confirm('Bu belgeyi onaylamak istediğinize emin misiniz?')) {
      return;
    }

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
        .eq('id', documentId);

      if (updateError) throw updateError;

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Onaylama sırasında hata oluştu');
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      setError('Lütfen red nedeni belirtin');
      return;
    }

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
          review_notes: rejectNote.trim(),
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      setShowRejectModal(false);
      setRejectNote('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Reddetme sırasında hata oluştu');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✓ Onayla
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✗ Reddet
        </button>
      </div>

      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
          {error}
        </div>
      )}

      {/* Reddetme Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Belgeyi Reddet</h3>
            
            <div className="mb-4">
              <label htmlFor="rejectNote" className="block text-sm font-medium text-gray-700 mb-2">
                Red Nedeni <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectNote"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Lütfen red nedenini açıklayın..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={loading || !rejectNote.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'İşleniyor...' : 'Reddet'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectNote('');
                  setError(null);
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
