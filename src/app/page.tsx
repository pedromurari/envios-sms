'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCredentials, getCampaigns } from '@/lib/storage';
import type { Campaign } from '@/types';
import { Send, CheckCircle2, XCircle, CreditCard, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsError, setCreditsError] = useState('');
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    const stored = getCampaigns();
    setCampaigns(stored);
    const creds = getCredentials();
    if (creds) {
      setHasCredentials(true);
      fetchCredits(creds.user, creds.password, creds.hashSeguranca);
    }
  }, []);

  async function fetchCredits(user: string, password: string, hashSeguranca?: string) {
    setLoadingCredits(true);
    setCreditsError('');
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password, hashSeguranca }),
      });
      const data = await res.json();
      if (data.error) setCreditsError(data.error);
      else setCredits(data.credits);
    } catch {
      setCreditsError('Falha ao conectar');
    } finally {
      setLoadingCredits(false);
    }
  }

  const totalSent = campaigns.reduce((a, c) => a + c.stats.sent, 0);
  const totalDelivered = campaigns.reduce((a, c) => a + c.stats.delivered, 0);
  const totalFailed = campaigns.reduce((a, c) => a + c.stats.failed, 0);
  const recent = campaigns.slice(0, 5);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral dos seus envios de SMS</p>
      </div>

      {!hasCredentials && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-800 font-medium text-sm">Credenciais não configuradas</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Configure seu usuário e senha da FacilitaMóvel para começar.{' '}
              <Link href="/settings" className="underline font-medium">
                Ir para Configurações →
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Créditos Disponíveis"
          value={
            loadingCredits ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : creditsError ? (
              <span className="text-red-500 text-sm">{creditsError}</span>
            ) : credits !== null ? (
              credits.toLocaleString('pt-BR')
            ) : (
              <span className="text-slate-400">—</span>
            )
          }
          icon={<CreditCard className="w-5 h-5 text-emerald-500" />}
          bg="bg-emerald-50"
        />
        <StatCard
          label="Total Enviado"
          value={totalSent.toLocaleString('pt-BR')}
          icon={<Send className="w-5 h-5 text-blue-500" />}
          bg="bg-blue-50"
        />
        <StatCard
          label="Entregues"
          value={totalDelivered.toLocaleString('pt-BR')}
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          bg="bg-green-50"
        />
        <StatCard
          label="Falhas"
          value={totalFailed.toLocaleString('pt-BR')}
          icon={<XCircle className="w-5 h-5 text-red-500" />}
          bg="bg-red-50"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Campanhas Recentes</h2>
        <Link href="/campaigns" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma campanha ainda</p>
          <p className="text-slate-400 text-sm mt-1">Crie sua primeira campanha para começar</p>
          <Link
            href="/campaigns/new"
            className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Send className="w-4 h-4" /> Nova Campanha
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Campanha</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Leads</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Enviados</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/campaigns/${c.id}`} className="font-medium text-slate-800 hover:text-emerald-600">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <CampaignStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.stats.total}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.stats.sent}</td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          <Send className="w-4 h-4" /> Nova Campanha
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, bg }: { label: string; value: React.ReactNode; icon: React.ReactNode; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <div className={`${bg} p-2 rounded-lg`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: Campaign['status'] }) {
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
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
