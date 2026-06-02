'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCampaign, getCredentials } from '@/lib/storage';
import type { Campaign, DeliveryStatus } from '@/types';
import { SMS_STATUS_COLORS, SMS_STATUS_LABELS } from '@/types';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  MessageSquare,
  Users,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [statuses, setStatuses] = useState<DeliveryStatus[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    const c = getCampaign(id);
    if (!c) { router.push('/campaigns'); return; }
    setCampaign(c);
  }, [id]);

  async function refreshStatuses() {
    if (!campaign?.smsIds?.length) return;
    const creds = getCredentials();
    if (!creds) return;

    setLoadingStatus(true);
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: creds.user, password: creds.password, smsIds: campaign.smsIds.slice(0, 100) }),
      });
      const data = await res.json();
      if (data.results) setStatuses(data.results);
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false);
    }
  }

  if (!campaign) return null;

  const deliveredCount = statuses.filter((s) => s.status === 4).length;
  const failedCount = statuses.filter((s) => s.status === 5).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/campaigns" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Criada em {new Date(campaign.createdAt).toLocaleString('pt-BR')}
          </p>
        </div>
        <CampaignBadge status={campaign.status} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat icon={<Users className="w-4 h-4 text-blue-500" />} label="Total Leads" value={campaign.stats.total} bg="bg-blue-50" />
        <MiniStat icon={<Send className="w-4 h-4 text-emerald-500" />} label="Enviados" value={campaign.stats.sent} bg="bg-emerald-50" />
        <MiniStat icon={<XCircle className="w-4 h-4 text-red-500" />} label="Falhas" value={campaign.stats.failed} bg="bg-red-50" />
        <MiniStat icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} label="Entregues" value={campaign.stats.delivered} bg="bg-green-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Mensagem</p>
            <p className="text-slate-700 text-sm whitespace-pre-wrap">{campaign.message}</p>
          </div>
        </div>
      </div>

      {campaign.smsIds && campaign.smsIds.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-sm">Status de Entrega</h2>
            <button
              onClick={refreshStatuses}
              disabled={loadingStatus}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Atualizar Status
            </button>
          </div>

          {statuses.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Clique em &ldquo;Atualizar Status&rdquo; para consultar a entrega</p>
              {campaign.smsIds.length > 100 && (
                <p className="text-xs mt-1 text-slate-300">Mostrando os primeiros 100 IDs</p>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4 text-sm">
                {deliveredCount > 0 && (
                  <span className="text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {deliveredCount} entregues
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {failedCount} falhas
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-500 font-medium">SMS ID</th>
                      <th className="px-3 py-2 text-left text-slate-500 font-medium">Telefone</th>
                      <th className="px-3 py-2 text-left text-slate-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {statuses.map((s) => (
                      <tr key={s.smsId}>
                        <td className="px-3 py-2 font-mono text-slate-500">{s.smsId}</td>
                        <td className="px-3 py-2 text-slate-600">{s.phone ?? '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SMS_STATUS_COLORS[s.status]}`}>
                            {SMS_STATUS_LABELS[s.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`${bg} p-2 rounded-lg`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value.toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
}

function CampaignBadge({ status }: { status: Campaign['status'] }) {
  const styles: Record<Campaign['status'], string> = {
    draft: 'bg-slate-100 text-slate-600',
    sending: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  const labels: Record<Campaign['status'], string> = {
    draft: 'Rascunho',
    sending: 'Enviando',
    completed: 'Concluída',
    failed: 'Falhou',
  };
  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
