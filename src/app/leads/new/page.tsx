'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { saveLeadGroup } from '@/lib/storage';
import type { Lead, LeadGroup } from '@/types';
import { Upload, CheckCircle2, AlertTriangle, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

function buildLeads(rows: Record<string, string>[], phoneCol: string, nameCol: string): Lead[] {
  return rows
    .map((row, i) => ({
      id: String(i),
      phone: String(row[phoneCol] ?? '').trim(),
      name: nameCol ? String(row[nameCol] ?? '').trim() || undefined : undefined,
      extra: row,
    }))
    .filter((l) => l.phone);
}

export default function NewLeadGroupPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState({ phone: '', name: '' });
  const [csvFileName, setCsvFileName] = useState('');
  const [csvError, setCsvError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  function processCSV(file: File) {
    setCsvError('');
    setCsvFileName(file.name);
    setLeads([]);
    setCsvHeaders([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        setCsvHeaders(headers);

        const phoneCol = headers.find((h) =>
          /telefone|phone|celular|cel|numero|number|fone/i.test(h)
        ) ?? headers[0] ?? '';
        const nameCol = headers.find((h) =>
          /nome|name|cliente|lead/i.test(h)
        ) ?? '';

        setColumnMap({ phone: phoneCol, name: nameCol });
        const rows = result.data as Record<string, string>[];
        setRawRows(rows);
        setLeads(buildLeads(rows, phoneCol, nameCol));
      },
      error: () => setCsvError('Erro ao processar o arquivo CSV'),
    });
  }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setCsvError('Apenas arquivos CSV são aceitos');
      return;
    }
    processCSV(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function updateColumns(phoneCol: string, nameCol: string) {
    setColumnMap({ phone: phoneCol, name: nameCol });
    if (rawRows.length > 0) setLeads(buildLeads(rawRows, phoneCol, nameCol));
  }

  function handleSave() {
    if (!name.trim() || leads.length === 0) return;

    const group: LeadGroup = {
      id: `g_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
      leads,
    };
    saveLeadGroup(group);
    router.push('/leads');
  }

  const validLeads = leads.filter((l) => l.phone.replace(/\D/g, '').length >= 10);
  const invalidLeads = leads.length - validLeads.length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/leads" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo Grupo de Leads</h1>
          <p className="text-slate-500 text-sm mt-1">Importe um CSV e nomeie o grupo para reutilizar em campanhas</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Informações do Grupo</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do grupo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clientes Ativos, Leads Junho, Base Premium..."
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Leads captados na landing page de junho"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Upload de Leads (CSV)</h2>

          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-sm">
              {csvFileName ? csvFileName : 'Arraste o CSV ou clique para selecionar'}
            </p>
            <p className="text-slate-400 text-xs mt-1">A coluna de telefone deve conter DDD + número</p>
          </div>

          {csvError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" /> {csvError}
            </div>
          )}

          {csvHeaders.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Coluna de Telefone *</label>
                <select
                  value={columnMap.phone}
                  onChange={(e) => updateColumns(e.target.value, columnMap.name)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Coluna de Nome (opcional)</label>
                <select
                  value={columnMap.name}
                  onChange={(e) => updateColumns(columnMap.phone, e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">— nenhuma —</option>
                  {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          )}

          {leads.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {validLeads.length} leads válidos
                </span>
                {invalidLeads > 0 && (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {invalidLeads} inválidos
                  </span>
                )}
                <button
                  onClick={() => setShowPreview((v) => !v)}
                  className="ml-auto text-slate-500 hover:text-slate-700 flex items-center gap-1 text-xs"
                >
                  {showPreview ? <><ChevronUp className="w-3 h-3" /> Ocultar</> : <><ChevronDown className="w-3 h-3" /> Ver leads</>}
                </button>
              </div>

              {showPreview && (
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-500 font-medium">#</th>
                        {columnMap.name && <th className="px-3 py-2 text-left text-slate-500 font-medium">Nome</th>}
                        <th className="px-3 py-2 text-left text-slate-500 font-medium">Telefone</th>
                        <th className="px-3 py-2 text-left text-slate-500 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.slice(0, 200).map((l, i) => {
                        const valid = l.phone.replace(/\D/g, '').length >= 10;
                        return (
                          <tr key={l.id} className={valid ? '' : 'bg-red-50'}>
                            <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                            {columnMap.name && <td className="px-3 py-1.5 text-slate-600">{l.name ?? '—'}</td>}
                            <td className="px-3 py-1.5 font-mono text-slate-700">{l.phone}</td>
                            <td className="px-3 py-1.5">
                              {valid ? <span className="text-emerald-600">✓</span> : <span className="text-red-500">Inválido</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {leads.length > 200 && (
                        <tr><td colSpan={4} className="px-3 py-2 text-slate-400 text-center">... e mais {leads.length - 200} leads</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!name.trim() || validLeads.length === 0}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            Salvar grupo com {validLeads.length} leads
          </button>
          <Link href="/leads" className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}
