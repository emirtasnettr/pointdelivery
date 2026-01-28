/**
 * Admin Sliders API Route
 * 
 * Admin'lerin slider yönetimi için API route
 * Service role key kullanarak RLS'yi bypass eder
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import { Profile, HeroSlider } from '@/types/database';
import type { Database } from '@/lib/supabase/types';

// GET: Tüm sliderları getir
export async function GET(): Promise<NextResponse> {
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

    // Tüm sliderları getir
    const { data: sliders, error: slidersError } = await supabaseAdmin
      .from('hero_sliders')
      .select('*')
      .order('display_order', { ascending: true });

    if (slidersError) {
      return NextResponse.json(
        { error: `Sliderlar yüklenirken hata: ${slidersError.message}` },
        { status: 500 }
      );
    }

    // Type assertion for sliders array
    const typedSliders = (sliders || []) as HeroSlider[];

    return NextResponse.json({ sliders: typedSliders });
  } catch (error) {
    console.error('Sliders GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Yeni slider ekle
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Kullanıcı kontrolü
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin kontrolü (service role key ile RLS bypass)
    const supabaseAdmin = getAdminClient();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, image_url, link_url, display_order, is_active } = body;

    // Yeni slider ekle
    console.log('Inserting slider with data:', {
      title,
      description: description || null,
      image_url: image_url || null,
      link_url: link_url || null,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : true,
    });

    // Service role key ile insert yap (RLS bypass)
    // Insert type: Omit<HeroSlider, 'id' | 'created_at' | 'updated_at'> & { id?: string }
    // id optional çünkü UUID otomatik oluşturulur
    // NOT: Supabase'in Database type inference'ı manuel type'larımızla uyumlu değil
    // Bu yüzden doğrudan HeroSlider'dan türetip type assertion kullanıyoruz
    type HeroSliderInsert = Omit<HeroSlider, 'id' | 'created_at' | 'updated_at'> & { id?: string };
    const insertData: HeroSliderInsert = {
      title,
      description: description || null,
      image_url: image_url || null,
      link_url: link_url || null,
      display_order: display_order || 0,
      is_active: is_active !== undefined ? is_active : true,
    };

    // Type assertion: Supabase'in Database type system'i manuel type tanımlarımızla
    // tam uyumlu değil. Bu yüzden geçici olarak as any kullanıyoruz.
    // NOT: Bu geçici bir çözüm. İdeal çözüm Supabase CLI ile type'ları generate etmek.
    const { data: newSlider, error: insertError } = await (supabaseAdmin
      .from('hero_sliders') as any)
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ INSERT ERROR:', insertError);
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      console.error('Error hint:', insertError.hint);
      
      // Eğer RLS hatası ise, daha açıklayıcı mesaj ver
      if (insertError.code === '42501' || insertError.message?.includes('row-level security')) {
        return NextResponse.json(
          { 
            error: 'RLS hatası: Service role key düzgün yapılandırılmamış olabilir. Lütfen SUPABASE_SERVICE_ROLE_KEY environment variable\'ını kontrol edin.',
            details: insertError.message,
            code: insertError.code
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `Slider eklenirken hata: ${insertError.message}`, 
          details: insertError,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    console.log('✅ Slider başarıyla eklendi:', newSlider);

    return NextResponse.json({ success: true, slider: newSlider });
  } catch (error) {
    console.error('Slider POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT: Slider güncelle
export async function PUT(request: Request): Promise<NextResponse> {
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

    const body = await request.json();
    const { id, title, description, image_url, link_url, display_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Slider ID gerekli' }, { status: 400 });
    }

    // Sadece gönderilen alanları güncelle
    // Update type: Partial<Omit<HeroSlider, 'id' | 'created_at' | 'updated_at'>>
    type HeroSliderUpdate = Partial<Omit<HeroSlider, 'id' | 'created_at' | 'updated_at'>>;
    const updateData: HeroSliderUpdate = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (link_url !== undefined) updateData.link_url = link_url || null;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Slider güncelle
    // Type assertion: Supabase'in Database type system'i manuel type tanımlarımızla
    // tam uyumlu değil. Bu yüzden geçici olarak as any kullanıyoruz.
    const { data: updatedSlider, error: updateError } = await (supabaseAdmin
      .from('hero_sliders') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Slider güncellenirken hata: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, slider: updatedSlider });
  } catch (error) {
    console.error('Slider PUT error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE: Slider sil
export async function DELETE(request: Request): Promise<NextResponse> {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Slider ID gerekli' }, { status: 400 });
    }

    // Slider sil
    const { error: deleteError } = await supabaseAdmin
      .from('hero_sliders')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: `Slider silinirken hata: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Slider DELETE error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
