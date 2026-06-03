import type { ApiCredentials, DeliveryStatus, SmsStatus } from '@/types';

const BASE_URL = 'https://www.facilitamovel.com.br/api';

function sanitizeMessage(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
}

function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Remove country code 55 only when number is clearly too long (12+ digits)
  // Avoids stripping area code 55 (DDD 55 - Santa Maria/RS etc.)
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

function authHeaders(creds: ApiCredentials): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    user: creds.user,
    password: creds.password,
  };
  if (creds.hashSeguranca) headers.hashSeguranca = creds.hashSeguranca;
  return headers;
}

export async function checkCredits(creds: ApiCredentials): Promise<number> {
  const res = await fetch(`${BASE_URL}/checkCreditJson.ft`, {
    method: 'POST',
    headers: authHeaders(creds),
    body: '',
  });
  const data = await res.json();
  if (data.result !== 'success') throw new Error(data.description || 'Erro ao verificar créditos');
  return Number(data.credits ?? data.credit ?? 0);
}

export async function sendSingle(
  creds: ApiCredentials,
  phone: string,
  message: string,
  externalkey?: string,
  schedule?: { day: number; month: number; year: number; hour: number; minute: number }
): Promise<{ smsId: string }> {
  const body: Record<string, unknown> = {
    phone: sanitizePhone(phone),
    message: sanitizeMessage(message),
  };
  if (externalkey) body.externalkey = externalkey;
  if (schedule) Object.assign(body, schedule);

  const res = await fetch(`${BASE_URL}/simpleSendJson.ft`, {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.result !== 'success') throw new Error(data.description || `Erro ${data.code}`);
  return { smsId: data.smsid };
}

export async function sendMultiple(
  creds: ApiCredentials,
  messages: Array<{ phone: string; message: string; externalkey?: string }>
): Promise<{ accepted: string[]; rejected: number }> {
  const body = {
    messages: messages.map((m) => ({
      phone: sanitizePhone(m.phone),
      message: sanitizeMessage(m.message),
      ...(m.externalkey ? { externalkey: m.externalkey } : {}),
    })),
  };

  const res = await fetch(`${BASE_URL}/multipleSendJson.ft`, {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.result !== 'success') throw new Error(data.description || 'Erro ao enviar múltiplas mensagens');
  return {
    accepted: data['sms-ids-aceitos'] ?? [],
    rejected: Number(data['total-invalidos'] ?? 0),
  };
}

export async function checkStatus(creds: ApiCredentials, smsId: string): Promise<DeliveryStatus> {
  const res = await fetch(`${BASE_URL}/dlrStatusJson.ft`, {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify({ smsid: smsId }),
  });
  const data = await res.json();
  const statusCode = Number(data.status) as SmsStatus;
  return {
    smsId,
    status: statusCode,
    statusLabel: data.statusdescription ?? String(statusCode),
    phone: data.phone,
  };
}

export { sanitizeMessage };
