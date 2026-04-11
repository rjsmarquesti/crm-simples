import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function detectSlug() {
  const host = window.location.hostname;
  const partes = host.split('.');
  // Se tiver 4+ partes (ex: demo.crm.divulgabr.com.br) usa a primeira
  // Se for o domínio principal (ex: crm.divulgabr.com.br) retorna vazio
  if (partes.length >= 4) return partes[0];
  return '';
}

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '', slug: detectSlug() });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.slug.trim()) { setErro('Informe o identificador da empresa'); return; }
    setErro('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': form.slug.trim() },
        body: JSON.stringify({ email: form.email, senha: form.senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
      login(data);
      navigate('/');
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">CRM Divulga BR</h1>
          <p className="text-gray-400 mt-1">Faça login para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Slug da empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identificador da empresa
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="px-3 text-gray-400 text-sm border-r border-gray-200 py-3 bg-gray-100 select-none">
                  crm.divulgabr.com.br/
                </span>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="minha-empresa"
                  required
                  className="flex-1 px-3 py-3 bg-transparent text-sm text-gray-800 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Ex: <span className="font-mono">demo</span>, <span className="font-mono">minha-otica</span></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required placeholder="seu@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-800 transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input type="password" required placeholder="••••••••"
                value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-800 transition" />
            </div>

            {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{erro}</div>}

            <button type="submit" disabled={loading}
              className="btn-primary w-full text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Entrando...</>
                : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
