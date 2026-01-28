/**
 * Başvuru Karar Component
 * 
 * ONAYLA, EKSİK, RED butonları
 */

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Application {
  profile: {
    id: string;
    full_name: string;
  };
  documents: Array<{
    id: string;
    document_type: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }>;
  applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MISSING';
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

  const updateDocumentStatus = async (
    documentId: string,
    status: 'APPROVED' | 'REJECTED',
    notes: string | null = null
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Giriş yapmamışsınız');
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
      })
      .eq('id', documentId);

    if (updateError) throw updateError;
  };

  const handleApprove = async () => {
    if (!confirm('Bu başvuruyu onaylamak istediğinize emin misiniz?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Tüm bekleyen belgeleri onayla
      const pendingDocuments = application.documents.filter(
        (doc) => doc.status === 'PENDING'
      );

      for (const doc of pendingDocuments) {
        await updateDocumentStatus(doc.id, 'APPROVED', null);
      }

      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Onaylama sırasında hata oluştu');
      setLoading(false);
    }
  };

  const handleMissing = async () => {
    if (!confirm('Bu başvuruyu "Eksik Belgeli" olarak işaretlemek istediğinize emin misiniz?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Tüm bekleyen belgeleri reddet (eksik belge nedeniyle)
      const pendingDocuments = application.documents.filter(
        (doc) => doc.status === 'PENDING'
      );

      for (const doc of pendingDocuments) {
        await updateDocumentStatus(doc.id, 'REJECTED', 'Eksik belge - güncelleme gerekli');
      }

      onUpdate();
    } catch (err: any) {
      setError(err.message || 'İşaretleme sırasında hata oluştu');
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Red nedeni:');
    if (!reason || reason.trim() === '') {
      return;
    }

    if (!confirm('Bu başvuruyu reddetmek istediğinize emin misiniz?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Tüm belgeleri reddet
      for (const doc of application.documents) {
        await updateDocumentStatus(doc.id, 'REJECTED', reason.trim());
      }

      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Reddetme sırasında hata oluştu');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleApprove}
        disabled={loading || application.applicationStatus === 'APPROVED'}
        className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        ONAYLA
      </button>

      <button
        onClick={handleMissing}
        disabled={loading || application.applicationStatus === 'MISSING'}
        className="px-4 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        EKSİK
      </button>

      <button
        onClick={handleReject}
        disabled={loading || application.applicationStatus === 'REJECTED'}
        className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        RED
      </button>

      {error && (
        <div className="text-xs text-red-600 mt-1 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
