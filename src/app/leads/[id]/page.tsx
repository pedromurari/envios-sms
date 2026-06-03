'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLeadGroup, saveLeadGroup } from '@/lib/storage';
import type { LeadGroup } from '@/types';
import { ArrowLeft, Users, Send, Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function LeadGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<LeadGroup | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const g = getLeadGroup(id);
    if (!g) { router.push('/leads'); return; }
    setGroup(g);
    setEditName(g.name);
  }, [id]);

  function saveName() {
    if (!group || !editName.trim()) return;
    const updated = { ...group, name: editName.trim() };
    saveLeadGroup(updated);
    setGroup(updated);
    setEditingName(false);
  }

  if (!group) return null;

  const filtered = group.leads.filter((l) =>
    l.phone.includes(search) || (l.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const validCount = group.leads.filter((l) => l.phone.replace(/\D/g, '').length >= 10).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/leads" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="text-2xl font-bold text-slate-900 border-b-2 border-emerald-500 focus:outline-none bg-transparent"
                autoFocus
              />
              <button onClick={saveName} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setEditingName(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
              <button onClick={() => setEditingName(true)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
          {group.description && (
            <p className="text-slate-500 text-sm mt-0.5">{group.description}</p>
          )}
        </div>
        <Link
          href={`/campaigns/new?group=${group.id}`}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Send className="w-4 h-4" /> Usar em Campanha
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total de Leads</p>
          <p className="text-2xl font-bold text-slate-800">{group.leads.length.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Válidos</p>
          <p className="text-2xl font-bold text-emerald-700">{validCount.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Criado em</p>
          <p className="text-lg font-semibold text-slate-700">{new Date(group.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Users className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="flex-1 text-sm focus:outline-none"
          />
          {search && (
            <span className="text-xs text-slate-400">{filtered.length} resultado(s)</span>
          )}
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">#</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Nome</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Telefone</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.slice(0, 500).map((l, i) => {
                const valid = l.phone.replace(/\D/g, '').length >= 10;
                return (
                  <tr key={l.id} className={valid ? 'hover:bg-slate-50' : 'bg-red-50'}>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 text-slate-700">{l.name ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 text-xs">{l.phone}</td>
                    <td className="px-4 py-2.5">
                      {valid
                        ? <span className="text-emerald-600 text-xs">✓ válido</span>
                        : <span className="text-red-500 text-xs">inválido</span>
                      }
                    </td>
                  </tr>
                );
              })}
              {filtered.length > 500 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-center text-slate-400 text-sm">
                    Mostrando 500 de {filtered.length} leads
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
