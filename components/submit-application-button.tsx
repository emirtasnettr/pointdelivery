/**
 * Başvurumu Değerlendirmeye Gönder Butonu
 * 
 * Tüm bilgiler ve belgeler tamamlandığında aktif olur
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitApplicationForEvaluation } from '@/lib/auth/application-actions';

interface SubmitApplicationButtonProps {
  profileId: string;
  applicationStatus: string | null;
  candidateInfo: any;
  documents: Array<{ document_type: string }>;
  requiredDocumentTypes: string[];
  onSuccess?: () => void;
}

export default function SubmitApplicationButton({
  profileId,
  applicationStatus,
  candidateInfo,
  documents,
  requiredDocumentTypes,
  onSuccess,
}: SubmitApplicationButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [missingItems, setMissingItems] = useState<string[]>([]);

  // Bilgilerin ve belgelerin tamamlanıp tamamlanmadığını kontrol et
  useEffect(() => {
    const missing: string[] = [];

    // Zorunlu alanlar kontrolü
    if (!candidateInfo) {
      missing.push('Aday bilgileri');
    } else {
      if (!candidateInfo.phone || candidateInfo.phone.trim() === '') {
        missing.push('Telefon numarası');
      }
      if (!candidateInfo.national_id || candidateInfo.national_id.trim() === '') {
        missing.push('TC Kimlik No');
      }
      if (!candidateInfo.date_of_birth) {
        missing.push('Doğum tarihi');
      }
      if (!candidateInfo.address || candidateInfo.address.trim() === '') {
        missing.push('Adres');
      }
      if (!candidateInfo.education_level || candidateInfo.education_level.trim() === '') {
        missing.push('Eğitim seviyesi');
      }
    }

    // Belgeler kontrolü
    const uploadedDocumentTypes = documents.map((doc) => doc.document_type);
    for (const docType of requiredDocumentTypes) {
      if (!uploadedDocumentTypes.includes(docType)) {
        const docLabels: Record<string, string> = {
          KIMLIK: 'Kimlik Belgesi',
          RESIDENCE: 'İkametgah',
          POLICE: 'Sabıka Kaydı',
          CV: 'CV',
          DIPLOMA: 'Diploma',
        };
        missing.push(docLabels[docType] || docType);
      }
    }

    setMissingItems(missing);
    setIsComplete(missing.length === 0);
  }, [candidateInfo, documents, requiredDocumentTypes]);

  const handleSubmit = async () => {
    if (!isComplete) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await submitApplicationForEvaluation(profileId);

      if (result.error) {
        setError(result.error);
      } else {
        // Başarılı gönderimden sonra parent component'e haber ver ve sayfayı yenile
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Sadece NEW_APPLICATION veya UPDATE_REQUIRED statüsündeyken butonu göster
  const canSubmit = applicationStatus === 'NEW_APPLICATION' || applicationStatus === 'UPDATE_REQUIRED';

  if (!canSubmit) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Başvurumu Değerlendirmeye Gönder
          </h3>
          {!isComplete ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Başvurunuzu göndermek için lütfen eksik bilgileri tamamlayın:
              </p>
              <ul className="list-disc list-inside text-sm text-orange-600 space-y-1">
                {missingItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-green-700">
              ✅ Tüm bilgiler ve belgeler tamamlandı. Başvurunuzu değerlendirmeye gönderebilirsiniz.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!isComplete || loading}
          className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {loading ? 'Gönderiliyor...' : 'Başvurumu Değerlendirmeye Gönder'}
        </button>
      </div>
    </div>
  );
}
