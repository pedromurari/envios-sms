import { NextRequest, NextResponse } from 'next/server';
import { sendMultiple } from '@/lib/facilitamovel';

export interface SendRequest {
  user: string;
  password: string;
  hashSeguranca?: string;
  messages: Array<{ phone: string; message: string; externalkey?: string; day?: number; month?: number; year?: number; hour?: number; minute?: number }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: SendRequest = await req.json();
    const { user, password, hashSeguranca, messages } = body;

    if (!user || !password) {
      return NextResponse.json({ error: 'Credenciais ausentes' }, { status: 400 });
    }
    if (!messages?.length) {
      return NextResponse.json({ error: 'Nenhuma mensagem fornecida' }, { status: 400 });
    }

    const result = await sendMultiple({ user, password, hashSeguranca }, messages);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
