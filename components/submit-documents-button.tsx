/**
 * Belgeleri Onaya Gönder Butonu
 * 
 * Adayların DRAFT belgelerini PENDING durumuna getirmek için kullanılır
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SubmitDocumentsButtonProps {
  profileId: string;
}

export default function SubmitDocumentsButton({ profileId }: SubmitDocumentsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!confirm('Belgelerinizi onaya göndermek istediğinize emin misiniz? Belgeler gönderildikten sonra consultant\'lar tarafından görülebilir ve değerlendirilebilir.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/candidate/submit-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Belgeler gönderilemedi');
      }

      setSuccess(true);
      
      // Sayfayı yenile
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-5 shadow-md">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">⚠️</div>
          <div>
            <p className="text-sm font-semibold text-yellow-900 mb-2">
              Belgeleriniz Henüz Consultant'lara Görünmüyor!
            </p>
            <p className="text-sm text-yellow-800">
              Yüklediğiniz belgeler <strong>taslak (DRAFT)</strong> durumunda. 
              Consultant'ların belgelerinizi görebilmesi ve değerlendirebilmesi için 
              <strong className="text-orange-700"> mutlaka aşağıdaki butona basmanız gerekmektedir.</strong>
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || success}
        className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Gönderiliyor...
          </span>
        ) : success ? (
          <span className="flex items-center justify-center gap-2">
            ✅ Belgeler Gönderildi
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            📤 Belgeleri Onaya Gönder
          </span>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Belgeleriniz başarıyla onaya gönderildi. Consultant'lar artık belgelerinizi görebilir ve değerlendirebilir.
        </div>
      )}
    </div>
  );
}
