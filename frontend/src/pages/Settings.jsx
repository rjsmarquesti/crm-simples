import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MODULOS_DISPONIVEIS = [
  { id: 'leads',        label: 'Leads',        desc: 'Gestão de contatos e oportunidades' },
  { id: 'agendamentos', label: 'Agendamentos',  desc: 'Agenda de atendimentos' },
];

const CORES = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2','#1e293b'];

export default function Settings() {
  const { tenant, updateTenant } = useAuth();
  const [form, setForm]         = useState({ nome: '', logo: '', corPrimaria: '#2563eb', modulos: [], n8nWebhookUrl: '', n8nApiKey: '' });
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading]   = useState(false);
  const [genLoading, setGL]     = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    api.get('/settings').then(d => {
      const t = d.tenant;
      setForm({
        nome: t.nome, logo: t.logo || '', corPrimaria: t.corPrimaria,
        modulos: t.modulos || [],
        n8nWebhookUrl: t.n8nWebhookUrl || '',
        n8nApiKey: t.n8nApiKey || '',
      });
      if (t.apiToken) setApiToken(t.apiToken);
    }).catch(err => toast.error(err.message));
  }, []);

  function toggleModulo(id) {
    setForm(f => ({
      ...f,
      modulos: f.modulos.includes(id) ? f.modulos.filter(m => m !== id) : [...f.modulos, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const d = await api.put('/settings', form);
      updateTenant(d.tenant);
      document.documentElement.style.setProperty('--cor-primaria', d.tenant.corPrimaria);
      toast.success('Configurações salvas!');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function gerarToken() {
    if (apiToken && !confirm('Gerar um novo token vai invalidar o token atual. Continuar?')) return;
    setGL(true);
    try {
      const d = await api.post('/settings/api-token', {});
      setApiToken(d.apiToken);
      setShowToken(true);
      toast.success('Token gerado!');
    } catch (err) { toast.error(err.message); }
    finally { setGL(false); }
  }

  function copiar(texto) {
    navigator.clipboard.writeText(texto);
    toast.success('Copiado!');
  }

  return (
    <Layout title="Configurações" subtitle="Personalize sua empresa no sistema">
      <div className="max-w-2xl space-y-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identidade */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Identidade da empresa</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da empresa</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL da Logo <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input type="url" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                placeholder="https://..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
              {form.logo && <img src={form.logo} alt="preview" className="mt-2 h-12 object-contain rounded-lg border" />}
            </div>
          </div>

          {/* Cor primária */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Cor principal</h2>
            <div className="flex items-center gap-3 flex-wrap">
              {CORES.map(cor => (
                <button key={cor} type="button" onClick={() => setForm(f => ({ ...f, corPrimaria: cor }))}
                  className={`w-9 h-9 rounded-full transition-all ${form.corPrimaria === cor ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: cor }} />
              ))}
              <input type="color" value={form.corPrimaria} onChange={e => setForm(f => ({ ...f, corPrimaria: e.target.value }))}
                className="w-9 h-9 rounded-full cursor-pointer border-0" title="Cor personalizada" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: form.corPrimaria }} />
              <span className="text-sm text-gray-600 font-mono">{form.corPrimaria}</span>
            </div>
          </div>

          {/* Módulos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Módulos ativos</h2>
            <div className="space-y-3">
              {MODULOS_DISPONIVEIS.map(m => (
                <label key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={form.modulos.includes(m.id)} onChange={() => toggleModulo(m.id)} className="w-4 h-4 rounded" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Integração n8n */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-gray-900">Integração n8n</h2>
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Opcional</span>
            </div>
            <p className="text-xs text-gray-500">Quando um lead for criado ou atualizado, o CRM envia os dados automaticamente para o n8n.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do Webhook n8n</label>
              <input type="url" value={form.n8nWebhookUrl}
                onChange={e => setForm(f => ({ ...f, n8nWebhookUrl: e.target.value }))}
                placeholder="https://seu-n8n.com/webhook/..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chave de autenticação do webhook <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input type="password" value={form.n8nApiKey}
                onChange={e => setForm(f => ({ ...f, n8nApiKey: e.target.value }))}
                placeholder="Bearer token configurado no n8n"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading}
              className="btn-primary text-white font-semibold px-8 py-3 rounded-xl transition text-sm disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </form>

        {/* API Token para n8n chamar o CRM */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Token de API</h2>
          <p className="text-xs text-gray-500">Use este token para que o n8n possa <strong>criar ou consultar leads</strong> neste CRM via API REST.</p>
          {apiToken ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  readOnly value={apiToken}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 font-mono"
                />
                <button type="button" onClick={() => setShowToken(s => !s)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  {showToken ? 'Ocultar' : 'Ver'}
                </button>
                <button type="button" onClick={() => copiar(apiToken)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  Copiar
                </button>
              </div>
              <p className="text-xs text-gray-400">No n8n, envie o header: <code className="bg-gray-100 px-1 rounded">X-API-Token: {showToken ? apiToken : '••••••••'}</code></p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhum token gerado ainda.</p>
          )}
          <button type="button" onClick={gerarToken} disabled={genLoading}
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-60">
            {genLoading ? 'Gerando...' : apiToken ? 'Regenerar token' : 'Gerar token de API'}
          </button>
        </div>

        {/* Endpoints para o n8n */}
        {apiToken && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-700 mb-3">Endpoints disponíveis para o n8n</h2>
            <div className="space-y-2 text-xs font-mono text-gray-600">
              {[
                ['GET',   '/api/n8n/leads', 'Listar leads'],
                ['POST',  '/api/n8n/leads', 'Criar lead'],
                ['PATCH', '/api/n8n/leads/:id', 'Atualizar lead'],
                ['GET',   '/api/n8n/agendamentos', 'Listar agendamentos'],
              ].map(([method, path, desc]) => (
                <div key={path+method} className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${method === 'GET' ? 'bg-green-100 text-green-700' : method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{method}</span>
                  <span className="text-gray-500">{path}</span>
                  <span className="text-gray-400">— {desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Base URL: <code className="bg-gray-200 px-1 rounded">https://crm.divulgabr.com.br</code></p>
          </div>
        )}

        {/* Info do plano */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white">
          <h2 className="font-semibold mb-1">Plano atual: <span className="capitalize">{tenant?.plano}</span></h2>
          <p className="text-gray-400 text-sm">Para alterar o plano ou adicionar mais usuários, entre em contato com o suporte.</p>
        </div>
      </div>
    </Layout>
  );
}
