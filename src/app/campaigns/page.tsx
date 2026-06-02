'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCampaigns, deleteCampaign } from '@/lib/storage';
import type { Campaign } from '@/types';
import { Send, Trash2, Eye, Search, MessageSquare } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setCampaigns(getCampaigns());
  }, []);

  function handleDelete(id: string) {
    if (!confirm('Excluir esta campanha?')) return;
    deleteCampaign(id);
    setCampaigns(getCampaigns());
  }

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campanhas</h1>
          <p className="text-slate-500 text-sm mt-1">{campaigns.length} campanha(s) no total</p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Send className="w-4 h-4" /> Nova Campanha
        </Link>
      </div>

      {campaigns.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar campanha..."
            className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {campaigns.length === 0 ? 'Nenhuma campanha ainda' : 'Nenhum resultado'}
          </p>
          {campaigns.length === 0 && (
            <Link
              href="/campaigns/new"
              className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              <Send className="w-4 h-4" /> Criar primeira campanha
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Campanha</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Total</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Enviados</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Falhas</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Taxa</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const rate = c.stats.total > 0 ? Math.round((c.stats.sent / c.stats.total) * 100) : 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/campaigns/${c.id}`} className="font-medium text-slate-800 hover:text-emerald-600">
                        {c.name}
                      </Link>
                      <p className="text-slate-400 text-xs mt-0.5 truncate max-w-xs">{c.message.slice(0, 60)}{c.message.length > 60 ? '…' : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <CampaignBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{c.stats.total.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">{c.stats.sent.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right text-red-600">{c.stats.failed.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-slate-500 text-xs w-8 text-right">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
