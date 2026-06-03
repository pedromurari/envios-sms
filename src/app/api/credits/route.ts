import { NextRequest, NextResponse } from 'next/server';
import { checkCredits } from '@/lib/facilitamovel';

export async function POST(req: NextRequest) {
  try {
    const { user, password, hashSeguranca } = await req.json();
    if (!user || !password) {
      return NextResponse.json({ error: 'Credenciais ausentes' }, { status: 400 });
    }
    const credits = await checkCredits({ user, password, hashSeguranca });
    return NextResponse.json({ credits });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
