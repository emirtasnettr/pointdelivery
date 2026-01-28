/**
 * Belge İndirme Butonu (Adaylar için)
 * 
 * Adayların kendi belgelerini indirebileceği basit bir component
 */

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DocumentDownloadButtonProps {
  filePath: string;
  fileName: string;
}

export default function DocumentDownloadButton({
  filePath,
  fileName,
}: DocumentDownloadButtonProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      // Storage'dan signed URL al (1 saat geçerli)
      const { data, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (urlError) throw urlError;

      if (data?.signedUrl) {
        // Dosyayı indir
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      setError(err.message || 'Belge indirilemedi');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Belgeyi İndir"
      >
        {loading ? 'İndiriliyor...' : '⬇️ İndir'}
      </button>
      {error && (
        <div className="mt-1 text-red-600 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
