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
    }

    // Belgeler kontrolü
    const uploadedDocumentTypes = documents.map((doc) => doc.document_type);
    for (const docType of requiredDocumentTypes) {
      if (!uploadedDocumentTypes.includes(docType)) {
        const docLabels: Record<string, string> = {
          P1_BELGESI: 'P1 Belgesi',
          EHLIYET: 'Ehliyet',
          RUHSAT: 'Ruhsat',
          VERGI_LEVHASI: 'Vergi Levhası',
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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">
            Başvurumu Değerlendirmeye Gönder
          </h3>
        </div>
      </div>
      
      <div className="p-6">
        {!isComplete ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900 mb-3">
                  Başvurunuzu göndermek için lütfen eksik bilgileri tamamlayın:
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingItems.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-orange-200 rounded-md text-sm font-medium text-orange-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">
                Tüm bilgiler ve belgeler tamamlandı
              </p>
              <p className="text-sm text-green-700">
                Başvurunuzu değerlendirmeye gönderebilirsiniz.
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!isComplete || loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Başvurumu Değerlendirmeye Gönder</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
