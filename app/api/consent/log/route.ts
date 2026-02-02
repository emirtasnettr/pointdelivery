/**
 * Consent Log API
 * 
 * KVKK ve diğer yasal onayları kaydeder.
 * IP adresi ve User Agent bilgilerini server-side'da alır.
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Onay metni versiyonları - metin değiştiğinde burası güncellenmeli
const CONSENT_TEXT_VERSIONS = {
  KVKK: 'v1.0-2026-02-02',
  SMS_EMAIL_MARKETING: 'v1.0-2026-02-02',
  PRIVACY_POLICY: 'v1.0-2026-02-02',
  TERMS_OF_SERVICE: 'v1.0-2026-02-02',
  COOKIE_POLICY: 'v1.0-2026-02-02',
};

type ConsentType = keyof typeof CONSENT_TEXT_VERSIONS;

interface ConsentLogRequest {
  user_id: string;
  user_email: string;
  consents: {
    type: ConsentType;
    given: boolean;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    // IP adresi al (proxy arkasındaysa x-forwarded-for kullan)
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip_address = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    
    // User Agent al
    const user_agent = headersList.get('user-agent') || 'unknown';
    
    // Request body'yi al
    const body: ConsentLogRequest = await request.json();
    
    if (!body.user_id || !body.user_email || !body.consents || !Array.isArray(body.consents)) {
      return NextResponse.json(
        { error: 'Geçersiz istek. user_id, user_email ve consents gerekli.' },
        { status: 400 }
      );
    }

    // Her onay için ayrı kayıt oluştur
    const consentLogs = body.consents.map((consent) => ({
      user_id: body.user_id,
      user_email: body.user_email,
      consent_type: consent.type,
      consent_given: consent.given,
      consent_text_version: CONSENT_TEXT_VERSIONS[consent.type] || 'v1.0',
      ip_address,
      user_agent,
      metadata: {
        registration_timestamp: new Date().toISOString(),
        source: 'web_registration',
      },
    }));

    // Veritabanına kaydet (consent_logs tablosu henüz types'ta tanımlı değil)
    const { data, error } = await supabase
      .from('consent_logs' as any)
      .insert(consentLogs as any)
      .select();

    if (error) {
      console.error('Consent log kaydetme hatası:', error);
      
      // Tablo yoksa bile kayıt işlemi başarısız sayılmasın (user_metadata'da zaten var)
      // Sadece log at ve başarılı dön
      if (error.code === '42P01') { // Table doesn't exist
        console.warn('consent_logs tablosu henüz oluşturulmamış. SQL dosyasını çalıştırın.');
        return NextResponse.json({ 
          success: true, 
          warning: 'Consent logs tablosu bulunamadı. Lütfen create-consent-logs-table.sql dosyasını çalıştırın.',
          logged_to_metadata: true 
        });
      }
      
      return NextResponse.json(
        { error: 'Onay kaydedilemedi', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Onaylar başarıyla kaydedildi',
      logged_count: consentLogs.length,
      consent_ids: data?.map((d: any) => d.id) || [],
    });
  } catch (error) {
    console.error('Consent log API hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası', details: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// GET endpoint - Kullanıcının kendi onay geçmişini görüntülemesi için
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: consents, error } = await supabase
      .from('consent_logs' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Onay geçmişi alınamadı', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      consents,
    });
  } catch (error) {
    console.error('Consent log GET API hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
