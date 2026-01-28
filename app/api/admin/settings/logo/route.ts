/**
 * Admin Logo Upload API Route
 * 
 * Admin'lerin logo yüklemesi için API route
 * Service role key kullanarak RLS'yi bypass eder
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { Profile, SiteSettings } from '@/types/database';

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
    const fileName = `logo.${fileExt}`;
    const filePath = `site/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Logo yüklenirken hata: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Public URL al
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // Site settings'e kaydet (RLS bypass ile)
    // Önce mevcut kaydı kontrol et
    const { data: existing } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    const settingsId = '00000000-0000-0000-0000-000000000001';
    
    if (existing) {
      // Kayıt varsa güncelle
      // Type assertion: Supabase'in Database type system'i manuel type tanımlarımızla
      // tam uyumlu değil. Bu yüzden geçici olarak as any kullanıyoruz.
      type SiteSettingsUpdate = Partial<Omit<SiteSettings, 'id' | 'created_at' | 'updated_at'>>;
      const updateData: SiteSettingsUpdate = { logo_url: logoUrl };
      
      const { error: updateError } = await (supabaseAdmin
        .from('site_settings') as any)
        .update(updateData)
        .eq('id', settingsId);
      
      if (updateError) {
        return NextResponse.json(
          { error: `Logo kaydedilirken hata: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Kayıt yoksa ekle
      // Type assertion: Supabase'in Database type system'i manuel type tanımlarımızla
      // tam uyumlu değil. Bu yüzden geçici olarak as any kullanıyoruz.
      type SiteSettingsInsert = Omit<SiteSettings, 'created_at' | 'updated_at'>;
      const insertData: SiteSettingsInsert = {
        id: settingsId,
        logo_url: logoUrl,
        site_name: 'JobulAI',
      };
      
      const { error: insertError } = await (supabaseAdmin
        .from('site_settings') as any)
        .insert(insertData);
      
      if (insertError) {
        return NextResponse.json(
          { error: `Logo kaydedilirken hata: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, logoUrl });
  } catch (error) {
    console.error('Logo upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
