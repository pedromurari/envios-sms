export interface Lead {
  id: string;
  name?: string;
  phone: string;
  extra?: Record<string, string>;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  leads: Lead[];
  status: 'draft' | 'sending' | 'completed' | 'failed';
  createdAt: string;
  scheduledAt?: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    delivered: number;
  };
  smsIds?: string[];
}

export interface SmsResult {
  phone: string;
  leadName?: string;
  smsId?: string;
  result: 'success' | 'error';
  description: string;
}

export interface CreditInfo {
  credits: number;
  error?: string;
}

export interface DeliveryStatus {
  smsId: string;
  status: 1 | 2 | 3 | 4 | 5;
  statusLabel: string;
  phone?: string;
}

export interface ApiCredentials {
  user: string;
  password: string;
}

export type SmsStatus = 1 | 2 | 3 | 4 | 5;

export const SMS_STATUS_LABELS: Record<SmsStatus, string> = {
  1: 'Na Fila',
  2: 'Agendado',
  3: 'Enviando',
  4: 'Entregue',
  5: 'Falhou',
};

export const SMS_STATUS_COLORS: Record<SmsStatus, string> = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-purple-100 text-purple-800',
  4: 'bg-green-100 text-green-800',
  5: 'bg-red-100 text-red-800',
};
