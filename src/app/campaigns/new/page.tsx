'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { getCredentials, saveCampaign } from '@/lib/storage';
import { sanitizeMessage } from '@/lib/facilitamovel';
import type { Lead, Campaign, SmsResult } from '@/types';
import {
  Upload,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const MAX_SMS_CHARS = 160;
const BATCH_SIZE = 50;

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

export default function NewCampaign() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [csvError, setCsvError] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [columnMap, setColumnMap] = useState<{ phone: string; name: string }>({ phone: '', name: '' });
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [showLeadsPreview, setShowLeadsPreview] = useState(false);

  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SmsResult[]>([]);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const sanitized = sanitizeMessage(message);
  const charCount = sanitized.length;
  const smsCount = charCount === 0 ? 0 : Math.ceil(charCount / MAX_SMS_CHARS);
  const hasAccents = message !== sanitized;

  function processCSV(file: File) {
    setCsvError('');
    setCsvFileName(file.name);
    setLeads([]);
    setCsvHeaders([]);
    setColumnMap({ phone: '', name: '' });

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

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    []
  );

  function updateLeadsFromColumns(phoneCol: string, nameCol: string) {
    setColumnMap({ phone: phoneCol, name: nameCol });
    if (rawRows.length > 0) setLeads(buildLeads(rawRows, phoneCol, nameCol));
  }

  async function handleSend() {
    const creds = getCredentials();
    if (!creds) {
      alert('Configure suas credenciais da FacilitaMóvel antes de enviar.');
      router.push('/settings');
      return;
    }
    if (!campaignName.trim()) {
      alert('Dê um nome à campanha.');
      return;
    }
    if (!message.trim()) {
      alert('Digite a mensagem.');
      return;
    }
    if (leads.length === 0) {
      alert('Adicione os leads via CSV.');
      return;
    }

    setSending(true);
    setProgress(0);
    setResults([]);

    const campaignId = `c_${Date.now()}`;
    const campaign: Campaign = {
      id: campaignId,
      name: campaignName,
      message,
      leads,
      status: 'sending',
      createdAt: new Date().toISOString(),
      stats: { total: leads.length, sent: 0, failed: 0, delivered: 0 },
      smsIds: [],
    };
    saveCampaign(campaign);

    const allResults: SmsResult[] = [];
    const allSmsIds: string[] = [];

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      const messages = batch.map((l) => ({
        phone: l.phone,
        message: sanitizeMessage(message),
        externalkey: l.id,
      }));

      try {
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: creds.user, password: creds.password, messages }),
        });
        const data = await res.json();

        if (data.error) {
          batch.forEach((l) =>
            allResults.push({ phone: l.phone, leadName: l.name, result: 'error', description: data.error })
          );
          campaign.stats.failed += batch.length;
        } else {
          const ids: string[] = data.accepted ?? [];
          allSmsIds.push(...ids);
          campaign.stats.sent += ids.length;
          campaign.stats.failed += data.rejected ?? 0;
          batch.forEach((l, bi) =>
            allResults.push({
              phone: l.phone,
              leadName: l.name,
              smsId: ids[bi],
              result: ids[bi] ? 'success' : 'error',
              description: ids[bi] ? 'Aceito' : 'Rejeitado',
            })
          );
        }
      } catch (err) {
        batch.forEach((l) =>
          allResults.push({ phone: l.phone, leadName: l.name, result: 'error', description: 'Erro de rede' })
        );
        campaign.stats.failed += batch.length;
      }

      setProgress(Math.min(i + BATCH_SIZE, leads.length));
      setResults([...allResults]);
      campaign.smsIds = allSmsIds;
      saveCampaign(campaign);
    }

    campaign.status = campaign.stats.failed === campaign.stats.total ? 'failed' : 'completed';
    saveCampaign(campaign);
    setDone(true);
    setSending(false);
  }

  const validLeads = leads.filter((l) => l.phone.replace(/\D/g, '').length >= 10);
  const invalidLeads = leads.length - validLeads.length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nova Campanha</h1>
        <p className="text-slate-500 text-sm mt-1">Configure e dispare seu SMS para a base de leads</p>
      </div>

      {done ? (
        <DoneScreen results={results} onNew={() => router.push('/campaigns/new')} onView={() => router.push('/campaigns')} />
      ) : (
        <div className="space-y-6">
          <Section title="1. Nome da Campanha">
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Ex: Promoção Junho 2026"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={sending}
            />
          </Section>

          <Section title="2. Upload de Leads (CSV)">
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
                disabled={sending}
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 font-medium text-sm">
                {csvFileName ? csvFileName : 'Arraste o CSV ou clique para selecionar'}
              </p>
              <p className="text-slate-400 text-xs mt-1">A coluna de telefone deve conter o DDD + número</p>
            </div>

            {csvError && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                <AlertTriangle className="w-4 h-4" /> {csvError}
              </div>
            )}

            {csvHeaders.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Coluna de Telefone *</label>
                  <select
                    value={columnMap.phone}
                    onChange={(e) => updateLeadsFromColumns(e.target.value, columnMap.name)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Coluna de Nome (opcional)</label>
                  <select
                    value={columnMap.name}
                    onChange={(e) => updateLeadsFromColumns(columnMap.phone, e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">— nenhuma —</option>
                    {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            )}

            {leads.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {validLeads.length} leads válidos
                  </span>
                  {invalidLeads > 0 && (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> {invalidLeads} inválidos (serão ignorados)
                    </span>
                  )}
                  <button
                    onClick={() => setShowLeadsPreview((v) => !v)}
                    className="ml-auto text-slate-500 hover:text-slate-700 flex items-center gap-1 text-xs"
                  >
                    {showLeadsPreview ? <><ChevronUp className="w-3 h-3" /> Ocultar</> : <><ChevronDown className="w-3 h-3" /> Ver leads</>}
                  </button>
                </div>

                {showLeadsPreview && (
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
                                {valid ? (
                                  <span className="text-emerald-600">✓</span>
                                ) : (
                                  <span className="text-red-500">Inválido</span>
                                )}
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
          </Section>

          <Section title="3. Mensagem">
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={5}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  disabled={sending}
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                  {charCount}/{MAX_SMS_CHARS}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className={`font-medium ${smsCount > 1 ? 'text-amber-600' : 'text-slate-600'}`}>
                  {smsCount} SMS por lead
                </span>
                {leads.length > 0 && (
                  <span>= {smsCount * validLeads.length} créditos estimados</span>
                )}
              </div>

              {hasAccents && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Acentos detectados.</strong> A API não aceita acentos — eles serão removidos automaticamente.
                    <br />
                    Preview: <em className="font-mono">{sanitized.slice(0, 100)}{sanitized.length > 100 ? '…' : ''}</em>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Diretrizes FacilitaMóvel: sem acentos ou emojis, sem &ldquo;GRÁTIS&rdquo; em maiúsculas, sem links encurtados suspeitos.
                  Use <code className="bg-blue-100 px-1 rounded">&lt;br&gt;</code> para quebras de linha.
                </span>
              </div>
            </div>
          </Section>

          {sending && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                <p className="font-medium text-slate-700">Enviando... {progress}/{leads.length}</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${(progress / leads.length) * 100}%` }}
                />
              </div>
              {results.length > 0 && (
                <div className="mt-3 text-xs text-slate-500">
                  Aceitos: {results.filter((r) => r.result === 'success').length} ·
                  Erros: {results.filter((r) => r.result === 'error').length}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={sending || !message.trim() || validLeads.length === 0 || !campaignName.trim()}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Enviando...' : `Disparar para ${validLeads.length} leads`}
            </button>

            {!sending && (
              <p className="text-xs text-slate-400">
                Consumirá aproximadamente <strong>{smsCount * validLeads.length}</strong> créditos
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function DoneScreen({
  results,
  onNew,
  onView,
}: {
  results: SmsResult[];
  onNew: () => void;
  onView: () => void;
}) {
  const ok = results.filter((r) => r.result === 'success').length;
  const fail = results.filter((r) => r.result === 'error').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-800 mb-2">Envio concluído!</h2>
      <div className="flex items-center justify-center gap-6 text-sm mb-6">
        <span className="text-emerald-700 font-medium">{ok} aceitos</span>
        {fail > 0 && <span className="text-red-600 font-medium">{fail} falhas</span>}
      </div>

      {fail > 0 && (
        <div className="mb-6 max-h-48 overflow-y-auto border border-slate-200 rounded-lg text-left">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-slate-500">Telefone</th>
                <th className="px-3 py-2 text-slate-500">Erro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.filter((r) => r.result === 'error').map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5 font-mono">{r.phone}</td>
                  <td className="px-3 py-1.5 text-red-600">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button onClick={onNew} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          Nova Campanha
        </button>
        <button onClick={onView} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          Ver Campanhas
        </button>
      </div>
    </div>
  );
}
