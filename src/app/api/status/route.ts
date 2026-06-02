import { NextRequest, NextResponse } from 'next/server';
import { checkStatus } from '@/lib/facilitamovel';

export async function POST(req: NextRequest) {
  try {
    const { user, password, smsIds } = await req.json();
    if (!user || !password) {
      return NextResponse.json({ error: 'Credenciais ausentes' }, { status: 400 });
    }
    if (!smsIds?.length) {
      return NextResponse.json({ error: 'IDs de SMS ausentes' }, { status: 400 });
    }

    const results = await Promise.all(
      (smsIds as string[]).map((id) => checkStatus({ user, password }, id))
    );
    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
