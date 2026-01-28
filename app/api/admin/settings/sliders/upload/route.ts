/**
 * Admin Slider Image Upload API Route
 * 
 * Admin'lerin slider resimlerini yüklemesi için API route
 * Service role key kullanarak RLS'yi bypass eder
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { Profile } from '@/types/database';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Kullanıcı kontrolü
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin kontrolü (service role key ile RLS bypass)
    const supabaseAdmin = getAdminClient();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Form data'yı al
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    // Dosyayı storage'a yükle
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `sliders/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Resim yüklenirken hata: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Public URL al
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, imageUrl: urlData.publicUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
