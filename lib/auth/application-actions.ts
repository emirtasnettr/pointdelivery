/**
 * Başvuru İşlemleri Server Actions
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CandidateInfo, Document } from '@/types/database';

export async function submitApplicationForEvaluation(profileId: string) {
  const supabase = await createClient();

  try {
    // Kullanıcı kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== profileId) {
      return { error: 'Yetkisiz erişim' };
    }

    // Profil kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single<{ role: string; [key: string]: unknown }>();

    if (!profile || profile.role !== 'CANDIDATE') {
      return { error: 'Sadece adaylar başvuru gönderebilir' };
    }

    // Başvuru statüsü kontrolü - sadece NEW_APPLICATION veya UPDATE_REQUIRED statüsünden EVALUATION'a geçilebilir
    if (profile.application_status !== 'NEW_APPLICATION' && profile.application_status !== 'UPDATE_REQUIRED') {
      return { error: 'Bu başvuru değerlendirmeye gönderilemez' };
    }

    // Bilgilerin tamamlanıp tamamlanmadığını kontrol et
    const { data: candidateInfo } = await supabase
      .from('candidate_info')
      .select('*')
      .eq('profile_id', profileId)
      .single<CandidateInfo>();

    if (!candidateInfo) {
      return { error: 'Lütfen önce aday bilgilerinizi tamamlayın' };
    }

    // Zorunlu alanlar kontrolü
    const requiredFields = {
      phone: candidateInfo.phone,
      national_id: candidateInfo.national_id,
      date_of_birth: candidateInfo.date_of_birth,
      address: candidateInfo.address,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value === '') {
        return { error: `Lütfen ${field === 'phone' ? 'telefon numarası' : field === 'national_id' ? 'TC Kimlik No' : field === 'date_of_birth' ? 'doğum tarihi' : 'adres'} bilgisini girin` };
      }
    }

    // Tüm belgelerin yüklenip yüklenmediğini kontrol et
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('profile_id', profileId);

    const typedDocuments = (documents || []) as Document[];
    
    // Kayıt sırasında girilen bilgileri user_metadata'dan al
    const userMetadata = user.user_metadata || {};
    const hasP1 = userMetadata.has_p1 === true;
    const hasCompany = userMetadata.has_company === true;
    
    // Dinamik olarak zorunlu belge tiplerini oluştur
    const requiredDocumentTypes: string[] = [
      'EHLIYET',
      'RUHSAT',
      ...(hasP1 ? ['P1_BELGESI'] : []),
      ...(hasCompany ? ['VERGI_LEVHASI'] : []),
    ];
    
    const uploadedDocumentTypes = typedDocuments.map((doc) => doc.document_type);

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

    for (const docType of requiredDocumentTypes) {
      if (!uploadedDocumentTypes.includes(docType)) {
        return { error: `Lütfen ${docLabels[docType] || docType} belgesini yükleyin` };
      }
    }

    // Başvuru statüsünü EVALUATION'a güncelle
    // Type assertion: Supabase'in Database type system'i manuel type tanımlarımızla
    // tam uyumlu değil. Bu yüzden geçici olarak as any kullanıyoruz.
    const { error: updateError } = await (supabase
      .from('profiles') as any)
      .update({
        application_status: 'EVALUATION',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (updateError) {
      return { error: updateError.message || 'Başvuru gönderilirken hata oluştu' };
    }

    revalidatePath('/profile');
    revalidatePath('/dashboard/candidate');

    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Bir hata oluştu' };
  }
}

export async function deleteApplicationByConsultant(profileId: string) {
  const supabase = await createClient();

  try {
    // Kullanıcı kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Giriş yapmamışsınız' };
    }

    // Consultant veya Admin kontrolü
    const { data: consultantProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (!consultantProfile || !['CONSULTANT', 'ADMIN'].includes(consultantProfile.role)) {
      return { error: 'Bu işlem için yetkiniz yok' };
    }

    // Aday profil kontrolü
    const { data: candidateProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single<{ role: string; [key: string]: unknown }>();

    if (!candidateProfile || candidateProfile.role !== 'CANDIDATE') {
      return { error: 'Sadece aday başvuruları silinebilir' };
    }

    // 1. Belgeleri al (Storage'dan silmek için)
    const { data: documents, error: documentsFetchError } = await supabase
      .from('documents')
      .select('id, file_path')
      .eq('profile_id', profileId);

    if (documentsFetchError) {
      return { error: documentsFetchError.message || 'Belgeler alınırken hata oluştu' };
    }

    // 2. Storage'dan belgeleri sil (eğer belge varsa)
    const typedDocuments = (documents || []) as Document[];
    if (typedDocuments.length > 0) {
      const filePaths = typedDocuments
        .map((doc) => doc.file_path)
        .filter((path) => path && path.trim() !== ''); // Boş path'leri filtrele

      if (filePaths.length > 0) {
        console.log('Deleting files from storage:', filePaths);
        
        // Storage'dan belgeleri sil - önce toplu silme dene
        const { error: storageError, data: storageResult } = await supabase.storage
          .from('documents')
          .remove(filePaths);

        if (storageError) {
          console.error('Bulk storage deletion error:', storageError);
          console.error('Error details:', JSON.stringify(storageError, null, 2));
          
          // Tüm dosyaları tek tek silmeyi dene
          let successCount = 0;
          let failCount = 0;
          
          for (const filePath of filePaths) {
            try {
              const { error: singleError } = await supabase.storage
                .from('documents')
                .remove([filePath]);
              
              if (singleError) {
                console.error(`Error deleting file ${filePath}:`, singleError);
                failCount++;
              } else {
                console.log(`Successfully deleted file: ${filePath}`);
                successCount++;
              }
            } catch (err: any) {
              console.error(`Exception deleting file ${filePath}:`, err);
              failCount++;
            }
          }
          
          console.log(`Storage deletion summary: ${successCount} succeeded, ${failCount} failed`);
          
          if (failCount > 0) {
            // Hata olsa bile devam et, veritabanı kayıtlarını sil
            console.warn(`Warning: ${failCount} file(s) could not be deleted from storage`);
          }
        } else {
          console.log('Storage deletion success:', storageResult);
          console.log(`Successfully deleted ${filePaths.length} file(s) from storage`);
        }
      } else {
        console.log('No valid file paths found to delete');
      }
    } else {
      console.log('No documents found to delete');
    }

    // 3. Documents tablosundan kayıtları sil (CASCADE ile otomatik silinecek ama manuel de silelim)
    const { error: documentsDeleteError } = await supabase
      .from('documents')
      .delete()
      .eq('profile_id', profileId);

    if (documentsDeleteError) {
      console.error('Documents table deletion error:', documentsDeleteError);
      // Devam et, diğer işlemleri yap
    } else {
      console.log(`Deleted ${documents?.length || 0} document records from database`);
    }

    // 4. Candidate_info tablosundan kayıtları sil
    const { error: candidateInfoDeleteError } = await supabase
      .from('candidate_info')
      .delete()
      .eq('profile_id', profileId);

    if (candidateInfoDeleteError) {
      return { error: candidateInfoDeleteError.message || 'Aday bilgileri silinirken hata oluştu' };
    }

    // 5. Profil statüsünü NEW_APPLICATION'a döndür (kullanıcı kaydı ve temel bilgiler kalacak)
    // Type assertion: Supabase'in Database type system'i manuel type tanımlarımızla
    // tam uyumlu değil. Bu yüzden geçici olarak as any kullanıyoruz.
    const { error: statusUpdateError } = await (supabase
      .from('profiles') as any)
      .update({
        application_status: 'NEW_APPLICATION',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (statusUpdateError) {
      return { error: statusUpdateError.message || 'Profil güncellenirken hata oluştu' };
    }

    revalidatePath('/dashboard/consultant');

    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Bir hata oluştu' };
  }
}
