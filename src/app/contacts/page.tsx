'use client';

import { useEffect, useState, useMemo } from 'react';
import { getLeadGroups } from '@/lib/storage';
import type { LeadGroup, Lead } from '@/types';
import { Search, Users, UserCheck, Filter } from 'lucide-react';
import Link from 'next/link';

interface LeadWithGroup extends Lead {
  groupId: string;
  groupName: string;
}

export default function ContactsPage() {
  const [groups, setGroups] = useState<LeadGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setGroups(getLeadGroups());
  }, []);

  const allLeads = useMemo<LeadWithGroup[]>(() => {
    return groups.flatMap((g) =>
      g.leads.map((l) => ({ ...l, groupId: g.id, groupName: g.name }))
    );
  }, [groups]);

  const filtered = useMemo(() => {
    let list = selectedGroup === 'all' ? allLeads : allLeads.filter((l) => l.groupId === selectedGroup);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) => l.phone.includes(q) || (l.name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allLeads, selectedGroup, search]);

  const totalLeads = allLeads.length;
  const validLeads = allLeads.filter((l) => l.phone.replace(/\D/g, '').length >= 10).length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contatos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {totalLeads.toLocaleString('pt-BR')} leads em {groups.length} grupo(s) · {validLeads.toLocaleString('pt-BR')} válidos
          </p>
        </div>
        <Link
          href="/leads/new"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <UserCheck className="w-4 h-4" /> Novo Grupo
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum contato ainda</p>
          <p className="text-slate-400 text-sm mt-1">Crie um grupo de leads para começar</p>
          <Link
            href="/leads/new"
            className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <UserCheck className="w-4 h-4" /> Criar grupo
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou telefone..."
                className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none min-w-[200px]"
              >
                <option value="all">Todos os grupos ({totalLeads.toLocaleString('pt-BR')})</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.leads.length.toLocaleString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedGroup === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos · {totalLeads.toLocaleString('pt-BR')}
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedGroup === g.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g.name} · {g.leads.length.toLocaleString('pt-BR')}
              </button>
            ))}
          </div>

          {/* Results count */}
          {search && (
            <p className="text-sm text-slate-500 mb-3">
              {filtered.length.toLocaleString('pt-BR')} resultado(s) para &ldquo;{search}&rdquo;
            </p>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">#</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Nome</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Telefone</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Grupo</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                        Nenhum contato encontrado
                      </td>
                    </tr>
                  ) : (
                    filtered.slice(0, 500).map((l, i) => {
                      const valid = l.phone.replace(/\D/g, '').length >= 10;
                      return (
                        <tr key={`${l.groupId}-${l.id}`} className={valid ? 'hover:bg-slate-50' : 'bg-red-50 hover:bg-red-100'}>
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 text-slate-700">
                            {l.name ?? <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-600 text-xs">{l.phone}</td>
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/leads/${l.groupId}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                            >
                              <Users className="w-3 h-3" />
                              {l.groupName}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5">
                            {valid
                              ? <span className="text-emerald-600 text-xs font-medium">✓ válido</span>
                              : <span className="text-red-500 text-xs font-medium">inválido</span>
                            }
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 500 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center text-sm text-slate-400">
                Mostrando 500 de {filtered.length.toLocaleString('pt-BR')} contatos
                {search && ' (refine a busca para ver mais)'}
              </div>
            )}

            {filtered.length > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {filtered.filter(l => l.phone.replace(/\D/g, '').length >= 10).length.toLocaleString('pt-BR')} válidos ·{' '}
                  {filtered.filter(l => l.phone.replace(/\D/g, '').length < 10).length.toLocaleString('pt-BR')} inválidos
                </span>
                {selectedGroup !== 'all' && (
                  <Link
                    href={`/campaigns/new?group=${selectedGroup}`}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Disparar campanha para este grupo →
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
