'use client';

import { useState, useEffect } from 'react';
import { getCredentials, saveCredentials } from '@/lib/storage';
import { Settings, CheckCircle2, XCircle, Loader2, Eye, EyeOff, ShieldCheck, Key } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [hashSeguranca, setHashSeguranca] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHash, setShowHash] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const creds = getCredentials();
    if (creds) {
      setUser(creds.user);
      setPassword(creds.password);
      setHashSeguranca(creds.hashSeguranca ?? '');
    }
  }, []);

  function handleSave() {
    if (!user.trim() || !password.trim()) return;
    saveCredentials({
      user: user.trim(),
      password: password.trim(),
      hashSeguranca: hashSeguranca.trim() || undefined,
    });
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleTest() {
    if (!user.trim() || !password.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user.trim(),
          password: password.trim(),
          hashSeguranca: hashSeguranca.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setTestResult({ ok: false, message: data.error });
      } else {
        setTestResult({ ok: true, message: `Conectado! Créditos disponíveis: ${Number(data.credits).toLocaleString('pt-BR')}` });
      }
    } catch {
      setTestResult({ ok: false, message: 'Falha de rede ao conectar com a API' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm mt-1">Credenciais de acesso à API FacilitaMóvel</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="font-medium text-slate-800 text-sm">Credenciais da API</p>
            <p className="text-slate-400 text-xs">As credenciais são salvas localmente no seu navegador</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Usuário (login)</label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Seu usuário da FacilitaMóvel"
            autoComplete="username"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha da FacilitaMóvel"
              autoComplete="current-password"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Hash de Segurança
            <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Necessário para IP dinâmico</span>
          </label>
          <div className="relative">
            <input
              type={showHash ? 'text' : 'password'}
              value={hashSeguranca}
              onChange={(e) => setHashSeguranca(e.target.value)}
              placeholder="Cole aqui o hash fornecido pela FacilitaMóvel"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowHash((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showHash ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {hashSeguranca && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <Key className="w-3 h-3" /> Hash configurado ({hashSeguranca.length} caracteres)
            </p>
          )}
        </div>

        {testResult && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            {testResult.message}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!user.trim() || !password.trim()}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Settings className="w-4 h-4" /> Salvar</>}
          </button>

          <button
            onClick={handleTest}
            disabled={testing || !user.trim() || !password.trim()}
            className="flex items-center gap-2 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Testar Conexão
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 text-sm mb-3">Informações da API</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex gap-3">
            <span className="text-slate-400 w-28 shrink-0">Endpoint base</span>
            <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">facilitamovel.com.br/api</code>
          </div>
          <div className="flex gap-3">
            <span className="text-slate-400 w-28 shrink-0">Autenticação</span>
            <span>Headers <code className="text-xs bg-slate-100 px-1 rounded">user</code>, <code className="text-xs bg-slate-100 px-1 rounded">password</code> e <code className="text-xs bg-slate-100 px-1 rounded">hashSeguranca</code></span>
          </div>
          <div className="flex gap-3">
            <span className="text-slate-400 w-28 shrink-0">Encoding</span>
            <span>Sem acentos, sem emojis. Use <code className="text-xs bg-slate-100 px-1 rounded">&lt;br&gt;</code> para quebra de linha</span>
          </div>
          <div className="flex gap-3">
            <span className="text-slate-400 w-28 shrink-0">Limite por lote</span>
            <span>50 mensagens por requisição (aplicado automaticamente)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
