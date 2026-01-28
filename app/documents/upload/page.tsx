/**
 * Belge Yükleme Sayfası
 * 
 * Adayların belge yükleyebileceği sayfa
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function UploadDocumentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // URL parametrelerinden belge tipi ve değiştirme bilgisi al
  const urlDocumentType = searchParams.get('type') as 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA' | null;
  const isReplace = searchParams.get('replace') === 'true';
  const documentIdToReplace = searchParams.get('documentId');
  const candidateIdFromUrl = searchParams.get('candidateId'); // Middleman için aday ID'si

  const [formData, setFormData] = useState({
    documentType: (urlDocumentType || 'CV') as 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA',
    file: null as File | null,
  });

  // URL'den belge tipi gelirse formData'yı güncelle
  useEffect(() => {
    if (urlDocumentType) {
      setFormData((prev) => ({
        ...prev,
        documentType: urlDocumentType,
      }));
    }
  }, [urlDocumentType]);

  const getDocumentTypeLabel = () => {
    switch (formData.documentType) {
      case 'CV':
        return 'CV';
      case 'POLICE':
        return 'Sabıka Kaydı';
      case 'RESIDENCE':
        return 'İkametgah';
      case 'KIMLIK':
        return 'Kimlik Belgesi';
      case 'DIPLOMA':
        return 'Diploma';
      default:
        return 'Belge';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Dosya boyutu kontrolü (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('Dosya boyutu 50MB\'dan küçük olmalıdır');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        file,
      }));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.file) {
      setError('Lütfen bir dosya seçin');
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Giriş yapmamışsınız');
        setUploading(false);
        return;
      }

      // Middleman için aday ID'sini kontrol et
      let targetProfileId = user.id;
      let isMiddlemanAction = false;
      
      if (candidateIdFromUrl && candidateIdFromUrl !== user.id) {
        // Middleman aday adına belge yüklüyor (candidateId kullanıcının kendi ID'si değilse)
        // Önce middleman olduğunu ve adayın kendisine ait olduğunu kontrol et
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'MIDDLEMAN') {
          const { data: candidateProfile } = await supabase
            .from('profiles')
            .select('middleman_id')
            .eq('id', candidateIdFromUrl)
            .eq('role', 'CANDIDATE')
            .single();

          if (candidateProfile?.middleman_id === user.id) {
            targetProfileId = candidateIdFromUrl;
            isMiddlemanAction = true;
          } else {
            setError('Bu aday size ait değil');
            setUploading(false);
            return;
          }
        } else {
          // Middleman değilse, sadece kendi belgelerini yükleyebilir
          targetProfileId = user.id;
          isMiddlemanAction = false;
        }
      }

      // 1. Dosyayı Storage'a yükle
      // NOT: Storage bucket'ına yüklerken, bucket adını path'e eklemeyin
      // Path formatı: {user-id}/{filename} olmalı
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${targetProfileId}/${fileName}`; // documents/ prefix'i YOK!

      const { error: uploadError } = await supabase.storage
        .from('documents') // Bucket adı burada belirtilir
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Dosya yüklenirken hata: ${uploadError.message}`);
      }

      // 2. Public URL al (gerekirse) - NOT: Storage bucket private olduğu için signed URL kullanılmalı
      // Şimdilik file_path'i direkt kullanıyoruz

      // 3. Documents tablosuna kayıt ekle veya güncelle
      if (isReplace && documentIdToReplace) {
        console.log('Updating existing document:', documentIdToReplace);
        
        // Önce eski belgeyi al (eski dosyayı silmek için)
        const { data: oldDocument, error: oldDocError } = await supabase
          .from('documents')
          .select('file_path, file_name')
          .eq('id', documentIdToReplace)
          .eq('profile_id', targetProfileId)
          .single();

        if (oldDocError) {
          console.error('Error fetching old document:', oldDocError);
          throw new Error(`Eski belge bulunamadı: ${oldDocError.message}`);
        }

        console.log('Old document:', oldDocument);
        console.log('New file path:', filePath);
        console.log('New file name:', formData.file.name);

        // Eski belgeyi güncelle
        // Belgeler direkt sisteme kaydedilir
        // Trigger otomatik olarak file_path veya file_name değiştiğinde status'u NULL yapacak
        const { data: updatedDoc, error: updateError } = await supabase
          .from('documents')
          .update({
            file_name: formData.file.name,
            file_path: filePath,
            file_size: formData.file.size,
            mime_type: formData.file.type,
            reviewed_by: null,
            reviewed_at: null,
            review_notes: null,
            updated_at: new Date().toISOString(),
            // status: Trigger otomatik olarak NULL yapacak (file_path değiştiği için)
          })
          .eq('id', documentIdToReplace)
          .eq('profile_id', targetProfileId)
          .select(); // Güncellenmiş kaydı döndür

        if (updateError) {
          console.error('Documents update error:', updateError);
          // Yüklenen dosyayı sil (eğer yüklendiyse)
          try {
            await supabase.storage.from('documents').remove([filePath]);
          } catch (removeError) {
            console.error('File removal error:', removeError);
          }
          throw new Error(`Belge güncellenirken hata: ${updateError.message}`);
        }

        // UPDATE işleminin gerçekten başarılı olduğunu kontrol et
        if (!updatedDoc || updatedDoc.length === 0) {
          console.error('UPDATE returned no rows - document may not exist or RLS blocked');
          console.error('This usually means the UPDATE policy is missing for CANDIDATE role');
          // Yüklenen dosyayı sil (eğer yüklendiyse)
          try {
            await supabase.storage.from('documents').remove([filePath]);
          } catch (removeError) {
            console.error('File removal error:', removeError);
          }
          throw new Error('Belge güncellenemedi. Lütfen sistem yöneticinize başvurun. (RLS Policy eksik)');
        }

        console.log('Document updated successfully:', updatedDoc);

        // Eski dosyayı Storage'dan sil (yeni dosya başarıyla yüklendi ve kaydedildi)
        if (oldDocument?.file_path && oldDocument.file_path !== filePath) {
          console.log('Deleting old file from storage:', oldDocument.file_path);
          try {
            const { error: removeError, data: removeData } = await supabase.storage
              .from('documents')
              .remove([oldDocument.file_path]);
            
            if (removeError) {
              console.error('Old file removal error:', removeError);
            } else {
              console.log('Old file removed successfully:', removeData);
            }
          } catch (removeError) {
            console.error('Exception removing old file:', removeError);
            // Hata olsa bile devam et, eski dosya silinmese de sorun değil
          }
        } else {
          console.log('Skipping old file deletion (same path or not found)');
        }
      } else {
        // Yeni belge ekle (ancak aynı tipte başka belge yoksa)
        // Önce aynı tipte belge var mı kontrol et
        const { data: existingDoc } = await supabase
          .from('documents')
          .select('id')
          .eq('profile_id', targetProfileId)
          .eq('document_type', formData.documentType)
          .single();

        if (existingDoc) {
          // Aynı tipte belge varsa, Storage'dan yüklenen dosyayı sil
          await supabase.storage.from('documents').remove([filePath]);
          throw new Error(`${getDocumentTypeLabel()} zaten yüklenmiş. Değiştirmek için "Değiştir" butonunu kullanın.`);
        }

        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            profile_id: targetProfileId,
            document_type: formData.documentType,
            file_name: formData.file.name,
            file_path: filePath,
            file_size: formData.file.size,
            mime_type: formData.file.type,
            // status otomatik olarak NULL olacak (default değer)
          });

        if (insertError) {
          console.error('Documents insert error:', insertError);
          // Yüklenen dosyayı sil (eğer yüklendiyse)
          try {
            await supabase.storage.from('documents').remove([filePath]);
          } catch (removeError) {
            console.error('File removal error:', removeError);
          }
          throw new Error(`Veritabanına kayıt sırasında hata: ${insertError.message}`);
        }
      }

      setSuccess(true);
      
      // Başarı mesajını göster ve profil sayfasına yönlendir
      setTimeout(() => {
        // Hard redirect ile cache'i bypass et
        if (isMiddlemanAction) {
          // Middleman aday adına belge yükledi, aday detay sayfasına dön
          window.location.href = `/dashboard/middleman/candidates/${candidateIdFromUrl}`;
        } else {
          // Kullanıcı kendi belgesini yükledi, profil sayfasına dön
          // Belgeleri Onaya Gönder butonunu görmesi için profil sayfasına yönlendir
          window.location.href = '/profile#documents';
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Belge yüklenirken hata oluştu');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={candidateIdFromUrl ? `/dashboard/middleman/candidates/${candidateIdFromUrl}` : '/profile'} 
              className="text-blue-600 hover:text-blue-700"
            >
              ← {candidateIdFromUrl ? 'Aday Detayına Dön' : "Profilim'e Dön"}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isReplace ? `${getDocumentTypeLabel()} Belgesini Değiştir` : `${getDocumentTypeLabel()} Belgesi Yükle`}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Belge Bilgileri</h2>

            {/* Belge Tipi */}
            <div className="mb-6">
              <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
                Belge Tipi <span className="text-red-500">*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={(e) => {
                  const value = e.target.value as 'CV' | 'POLICE' | 'RESIDENCE' | 'KIMLIK' | 'DIPLOMA';
                  setFormData((prev) => ({ ...prev, documentType: value }));
                }}
                required
                disabled={!!urlDocumentType} // URL'den tip gelmişse değiştirilemez
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="KIMLIK">Kimlik Belgesi</option>
                <option value="RESIDENCE">İkametgah</option>
                <option value="POLICE">Sabıka Kaydı</option>
                <option value="CV">CV</option>
                <option value="DIPLOMA">Diploma</option>
              </select>
              {urlDocumentType && (
                <p className="mt-2 text-sm text-gray-600">
                  Bu belge türü için yükleme yapıyorsunuz.
                </p>
              )}
            </div>

            {/* Dosya Seçimi */}
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Dosya Seç <span className="text-red-500">*</span>
              </label>
              
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Bir dosya seçin</span>
                      <input
                        id="file"
                        name="file"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        required
                      />
                    </label>
                    <p className="pl-1">veya sürükleyip bırakın</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG (Maksimum 50MB)
                  </p>
                </div>
              </div>

              {/* Seçilen dosya */}
              {formData.file && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-medium text-gray-900">{formData.file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(formData.file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, file: null }))}
                      className="text-red-600 hover:text-red-700"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hata/Success Mesajları */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <p className="font-semibold mb-2">✅ Belge başarıyla yüklendi!</p>
              <p className="text-sm">
                Belgeniz sisteme kaydedildi. Consultant'lar tarafından incelendikten sonra Kabul veya Red olarak işaretlenecektir.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Bilgi:</strong> Yüklediğiniz belge direkt sisteme kaydedilecektir. 
              Consultant'lar belgenizi inceleyip Kabul veya Red olarak işaretleyecektir.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={uploading || !formData.file}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Yükleniyor...' : 'Belgeyi Yükle'}
            </button>

            <Link
              href={candidateIdFromUrl ? `/dashboard/middleman/candidates/${candidateIdFromUrl}` : '/profile'}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              İptal
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function UploadDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      }
    >
      <UploadDocumentPageContent />
    </Suspense>
  );
}
