'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLeadGroups, deleteLeadGroup } from '@/lib/storage';
import type { LeadGroup } from '@/types';
import { Users, Plus, Trash2, Eye, Search, UserCheck } from 'lucide-react';

export default function LeadsPage() {
  const [groups, setGroups] = useState<LeadGroup[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setGroups(getLeadGroups());
  }, []);

  function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o grupo "${name}"? Esta ação não pode ser desfeita.`)) return;
    deleteLeadGroup(id);
    setGroups(getLeadGroups());
  }

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalLeads = groups.reduce((a, g) => a + g.leads.length, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grupos de Leads</h1>
          <p className="text-slate-500 text-sm mt-1">
            {groups.length} grupo(s) · {totalLeads.toLocaleString('pt-BR')} leads no total
          </p>
        </div>
        <Link
          href="/leads/new"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Grupo
        </Link>
      </div>

      {groups.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar grupo..."
            className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {groups.length === 0 ? 'Nenhum grupo de leads ainda' : 'Nenhum resultado'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Crie grupos para organizar seus leads e reutilizá-los em campanhas
          </p>
          {groups.length === 0 && (
            <Link
              href="/leads/new"
              className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> Criar primeiro grupo
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-200 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight">{g.name}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {new Date(g.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/leads/${g.id}`}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(g.id, g.name)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {g.description && (
                <p className="text-slate-500 text-xs mb-3 line-clamp-2">{g.description}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-800">
                  {g.leads.length.toLocaleString('pt-BR')}
                </span>
                <span className="text-slate-400 text-xs">leads</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <Link
                  href={`/leads/${g.id}`}
                  className="flex-1 text-center text-xs text-slate-500 hover:text-slate-700 py-1 rounded hover:bg-slate-50"
                >
                  Ver leads
                </Link>
                <Link
                  href={`/campaigns/new?group=${g.id}`}
                  className="flex-1 text-center text-xs text-emerald-600 hover:text-emerald-700 font-medium py-1 rounded hover:bg-emerald-50"
                >
                  Usar em campanha
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
