/**
 * Middleman Yeni Aday Oluşturma API Route
 * 
 * Service Role API kullanarak yeni aday kullanıcısı oluşturur
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { Profile } from '@/types/database';
import { updateRow, insertRow, upsertRow } from '@/lib/supabase/helpers';

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Middleman kontrolü
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', user.id)
      .single<Profile>();

    if (!profile || profile.role !== 'MIDDLEMAN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    // Request body'den verileri al
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'E-posta, şifre ve ad soyad gereklidir' },
        { status: 400 }
      );
    }

    // Service Role client oluştur (RLS'i bypass eder)
    const supabaseAdmin = getAdminClient();

    // Yeni kullanıcı oluştur
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Email onayını atla (test için)
      user_metadata: {
        full_name: fullName,
        role: 'CANDIDATE',
      },
    });

    if (authError || !authUser.user) {
      console.error('Error creating user:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Kullanıcı oluşturulamadı' },
        { status: 400 }
      );
    }

    // Trigger otomatik olarak profile oluşturur, middleman_id'yi güncelle
    // Kısa bir bekleme ekleyelim (trigger'ın çalışması için)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { error: profileError } = await updateRow(
      supabaseAdmin,
      'profiles',
      authUser.user.id,
      {
        middleman_id: profile.id,
        full_name: fullName,
      }
    );

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Eğer profile yoksa, manuel oluştur
      const { error: insertError } = await insertRow(
        supabaseAdmin,
        'profiles',
        {
          id: authUser.user.id,
          full_name: fullName,
          role: 'CANDIDATE',
          middleman_id: profile.id,
          is_active: true,
          application_status: 'NEW_APPLICATION',
        }
      );

      if (insertError) {
        console.error('Error inserting profile:', insertError);
        // Kullanıcıyı sil (rollback)
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json(
          { error: 'Profil oluşturulamadı' },
          { status: 500 }
        );
      }
    }

    // Email'i candidate_info'ya kaydet
    await new Promise((resolve) => setTimeout(resolve, 200));
    const { error: candidateInfoError } = await upsertRow(
      supabaseAdmin,
      'candidate_info',
      {
        profile_id: authUser.user.id,
        email: email,
        phone: null,
        city: null,
        district: null,
        address: null,
        date_of_birth: null,
        national_id: null,
        skills: [],
        languages: [],
        iban: null,
        motorcycle_plate: null,
        documents_enabled: false,
        rider_id: null,
      },
      'profile_id'
    );

    if (candidateInfoError) {
      console.error('Error saving email to candidate_info:', candidateInfoError);
      // Hata olsa bile devam et, email olmadan da çalışabilir
    }

    return NextResponse.json({
      success: true,
      userId: authUser.user.id,
      email: authUser.user.email,
    });
  } catch (error) {
    console.error('Error in create-candidate API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Sunucu hatası';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
