/**
 * Belge Görüntüleme Component
 * 
 * Consultant'ların belgeleri görüntüleyip indirebileceği component
 */

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DocumentViewerProps {
  documentId: string;
  filePath: string;
  fileName: string;
  mimeType: string | null;
}

export default function DocumentViewer({
  documentId,
  filePath,
  fileName,
  mimeType,
}: DocumentViewerProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      // Storage'dan signed URL al (1 saat geçerli)
      const { data, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 saat

      if (urlError) throw urlError;

      if (data?.signedUrl) {
        // Dosyayı indir
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloadUrl(data.signedUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Belge indirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    setLoading(true);
    setError(null);

    try {
      // Storage'dan signed URL al
      const { data, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (urlError) throw urlError;

      if (data?.signedUrl) {
        // Yeni sekmede aç
        window.open(data.signedUrl, '_blank');
        setDownloadUrl(data.signedUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Belge açılamadı');
    } finally {
      setLoading(false);
    }
  };

  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType?.startsWith('image/');

  return (
    <div className="flex gap-2">
      {isPdf || isImage ? (
        <button
          onClick={handleView}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Yükleniyor...' : '👁️ Görüntüle'}
        </button>
      ) : null}
      
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'İndiriliyor...' : '⬇️ İndir'}
      </button>

      {error && (
        <div className="mt-2 text-red-600 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
