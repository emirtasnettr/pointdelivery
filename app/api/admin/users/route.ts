/**
 * Admin Users API Route
 * 
 * Admin kullanıcılar için tüm kullanıcıları ve email bilgilerini döndürür
 * Admin, Consultant, Middleman hesabı oluşturma (POST)
 * Service role key kullanarak RLS'yi bypass eder
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { Profile } from '@/types/database';
import { upsertRow } from '@/lib/supabase/helpers';

const ALLOWED_CREATE_ROLES = ['ADMIN', 'CONSULTANT', 'MIDDLEMAN'] as const;

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Kullanıcı kontrolü (sadece auth kontrolü, RLS bypass için service role kullanacağız)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Admin kontrolü service role key ile (RLS bypass)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Tüm profilleri al (RLS bypass)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Type assertion for profiles array
    const typedProfiles = profiles as Profile[];

    // Email bilgilerini almak için auth.users tablosuna eriş
    // Service role key ile auth.users'a erişebiliriz
    const userIds = typedProfiles.map(p => p.id);
    
    // Her kullanıcı için email bilgisini al
    const usersWithEmail = await Promise.all(
      typedProfiles.map(async (prof) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(prof.id);
          return {
            ...prof,
            email: authUser?.user?.email || '-',
            is_active: prof.is_active !== undefined ? prof.is_active : true,
          };
        } catch (error) {
          return {
            ...prof,
            email: '-',
            is_active: prof.is_active !== undefined ? prof.is_active : true,
          };
        }
      })
    );
    return NextResponse.json({ 
      users: usersWithEmail,
      adminProfile: profile
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Admin, Consultant veya Middleman hesabı oluşturur.
 * Body: { email, password, full_name, role } — role: ADMIN | CONSULTANT | MIDDLEMAN
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, role } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'email, password, full_name ve role alanları zorunludur' },
        { status: 400 }
      );
    }

    if (!ALLOWED_CREATE_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Geçerli roller: ADMIN, CONSULTANT, MIDDLEMAN' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Geçersiz e-posta formatı' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      if (usersData?.users?.some((u) => u.email === email)) {
        return NextResponse.json(
          { error: 'Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var' },
          { status: 400 }
        );
      }
    } catch {
      // listUsers hatası halinde oluşturmaya devam et
    }

    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
      app_metadata: { role },
    });

    if (createUserError || !authUser?.user) {
      console.error('Error creating user:', createUserError);
      return NextResponse.json(
        { error: createUserError?.message || 'Kullanıcı oluşturulamadı' },
        { status: 500 }
      );
    }

    const userId = authUser.user.id;

    const { data: profileData, error: profileCreateError } = await upsertRow(
      supabaseAdmin,
      'profiles',
      {
        id: userId,
        full_name,
        role,
        middleman_id: null,
        is_active: true,
        application_status: null,
      },
      'id'
    );

    if (profileCreateError || !profileData) {
      console.error('Error creating profile:', profileCreateError);
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        console.error('Error deleting user after profile failure:', deleteError);
      }
      return NextResponse.json(
        { error: profileCreateError?.message || 'Profil oluşturulamadı' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, email, full_name, role },
      message: 'Kullanıcı başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Error in admin create user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
