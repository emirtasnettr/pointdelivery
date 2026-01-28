/**
 * Middleman Candidate Documents API Route
 *
 * Middleman'lerin kendi eklediği adayın belgelerini listeleyebilmesi için.
 * Service role key ile RLS bypass edilir, ama önce middleman->candidate sahipliği doğrulanır.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin-client';
import type { Profile, Document } from '@/types/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: candidateId } = await params;
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

    const { data: documents, error: documentsError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('profile_id', candidateId)
      .order('created_at', { ascending: false })
      .returns<Document[]>();

    if (documentsError) {
      return NextResponse.json({ error: documentsError.message }, { status: 500 });
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

