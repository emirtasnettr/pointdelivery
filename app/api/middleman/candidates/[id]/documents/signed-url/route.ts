/**
 * Middleman Candidate Document Signed URL API Route
 *
 * Middleman'lerin kendi adayının dosyası için signed URL alabilmesi için.
 * Service role key ile signed url üretilir; sahiplik doğrulanır.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import type { Profile } from '@/types/database';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const candidateId = params.id;
    const body = (await request.json().catch(() => null)) as null | { filePath?: string };
    const filePath = body?.filePath;

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ error: 'filePath is required' }, { status: 400 });
    }

    // Quick guard: our upload convention is "{candidateId}/{filename}"
    if (!filePath.startsWith(`${candidateId}/`)) {
      return NextResponse.json({ error: 'Invalid filePath' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single<Pick<Profile, 'id' | 'role'>>();

    if (requesterProfileError || !requesterProfile || requesterProfile.role !== 'MIDDLEMAN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: candidateProfile, error: candidateProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, middleman_id')
      .eq('id', candidateId)
      .single<Pick<Profile, 'id' | 'role' | 'middleman_id'>>();

    if (candidateProfileError || !candidateProfile || candidateProfile.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (candidateProfile.middleman_id !== user.id) {
      return NextResponse.json({ error: 'Candidate not owned by middleman' }, { status: 403 });
    }

    // Verify this filePath belongs to this candidate in documents table
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .select('id')
      .eq('profile_id', candidateId)
      .eq('file_path', filePath)
      .maybeSingle();

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 });
    }
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const { data, error: signedError } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (signedError) {
      return NextResponse.json({ error: signedError.message }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data?.signedUrl ?? null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

