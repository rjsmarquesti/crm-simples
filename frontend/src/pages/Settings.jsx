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

const DIAS_SEMANA = [
  { value: '0', label: 'Dom' },
  { value: '1', label: 'Seg' },
  { value: '2', label: 'Ter' },
  { value: '3', label: 'Qua' },
  { value: '4', label: 'Qui' },
  { value: '5', label: 'Sex' },
  { value: '6', label: 'Sáb' },
];

const DURACAO_OPTIONS = [
  { value: 30,  label: '30 minutos' },
  { value: 45,  label: '45 minutos' },
  { value: 60,  label: '1 hora' },
  { value: 90,  label: '1h 30min' },
  { value: 120, label: '2 horas' },
];

const TABS = [
  { id: 'empresa',    label: 'Empresa' },
  { id: 'agenda',     label: 'Agenda' },
  { id: 'integracao', label: 'Integração' },
];

export default function Settings() {
  const { tenant, updateTenant } = useAuth();
  const [tab, setTab]           = useState('empresa');
  const [form, setForm]         = useState({ nome: '', logo: '', corPrimaria: '#2563eb', modulos: [], n8nWebhookUrl: '', n8nApiKey: '' });
  const [agendaForm, setAgendaForm] = useState({
    horarioInicio: '08:00', horarioFim: '18:00', duracaoSlot: 60,
    diasUteis: '1,2,3,4,5', antecedenciaMin: 2, antecedenciaMax: 30,
    mensagemConfirmacao: '', whatsappAdmin: '', ativo: true,
  });
  const [apiToken, setApiToken]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [agendaLoading, setAL]    = useState(false);
  const [genLoading, setGL]       = useState(false);
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

    api.get('/settings/agenda').then(d => {
      const c = d.config;
      setAgendaForm({
        horarioInicio: c.horarioInicio, horarioFim: c.horarioFim,
        duracaoSlot: c.duracaoSlot, diasUteis: c.diasUteis,
        antecedenciaMin: c.antecedenciaMin, antecedenciaMax: c.antecedenciaMax,
        mensagemConfirmacao: c.mensagemConfirmacao || '',
        whatsappAdmin: c.whatsappAdmin || '',
        ativo: c.ativo,
      });
    }).catch(() => {});
  }, []);

  function toggleModulo(id) {
    setForm(f => ({
      ...f,
      modulos: f.modulos.includes(id) ? f.modulos.filter(m => m !== id) : [...f.modulos, id],
    }));
  }

  function toggleDia(valor) {
    const dias = agendaForm.diasUteis ? agendaForm.diasUteis.split(',').filter(Boolean) : [];
    const novo = dias.includes(valor) ? dias.filter(d => d !== valor) : [...dias, valor].sort();
    setAgendaForm(f => ({ ...f, diasUteis: novo.join(',') }));
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

  async function handleAgendaSubmit(e) {
    e.preventDefault();
    setAL(true);
    try {
      await api.put('/settings/agenda', agendaForm);
      toast.success('Configurações de agenda salvas!');
    } catch (err) { toast.error(err.message); }
    finally { setAL(false); }
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

  const baseUrl = window.location.origin;
  const linkFormulario = tenant?.slug ? `${baseUrl}/agendar.html?slug=${tenant.slug}` : '';
  const embedCode = linkFormulario
    ? `<iframe src="${linkFormulario}" width="100%" height="680" frameborder="0" style="border-radius:16px;"></iframe>`
    : '';

  const diasAtivos = agendaForm.diasUteis ? agendaForm.diasUteis.split(',') : [];

  return (
    <Layout title="Configurações" subtitle="Personalize sua empresa no sistema">
      <div className="max-w-2xl">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ABA EMPRESA ── */}
        {tab === 'empresa' && (
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex justify-end">
              <button type="submit" disabled={loading}
                className="btn-primary text-white font-semibold px-8 py-3 rounded-xl transition text-sm disabled:opacity-60">
                {loading ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </div>
          </form>
        )}

        {/* ── ABA AGENDA ── */}
        {tab === 'agenda' && (
          <div className="space-y-6">
            <form onSubmit={handleAgendaSubmit} className="space-y-6">

              {/* Horários */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Horário de atendimento</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                    <input type="time" value={agendaForm.horarioInicio}
                      onChange={e => setAgendaForm(f => ({ ...f, horarioInicio: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                    <input type="time" value={agendaForm.horarioFim}
                      onChange={e => setAgendaForm(f => ({ ...f, horarioFim: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duração de cada atendimento</label>
                  <div className="flex flex-wrap gap-2">
                    {DURACAO_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setAgendaForm(f => ({ ...f, duracaoSlot: opt.value }))}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition
                          ${agendaForm.duracaoSlot === opt.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dias de atendimento</label>
                  <div className="flex gap-2 flex-wrap">
                    {DIAS_SEMANA.map(d => (
                      <button key={d.value} type="button"
                        onClick={() => toggleDia(d.value)}
                        className={`w-12 h-12 rounded-xl text-sm font-semibold border transition
                          ${diasAtivos.includes(d.value)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Antecedência */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Regras de agendamento</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antecedência mínima</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="48" value={agendaForm.antecedenciaMin}
                        onChange={e => setAgendaForm(f => ({ ...f, antecedenciaMin: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
                      <span className="text-sm text-gray-500 whitespace-nowrap">horas</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Janela máxima</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" max="365" value={agendaForm.antecedenciaMax}
                        onChange={e => setAgendaForm(f => ({ ...f, antecedenciaMax: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
                      <span className="text-sm text-gray-500 whitespace-nowrap">dias</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp para notificações <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input type="tel" value={agendaForm.whatsappAdmin} placeholder="5511999999999"
                    onChange={e => setAgendaForm(f => ({ ...f, whatsappAdmin: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
                  <p className="text-xs text-gray-400 mt-1">Número com DDI para receber alertas de novos agendamentos via n8n.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de confirmação <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea rows={2} value={agendaForm.mensagemConfirmacao}
                    onChange={e => setAgendaForm(f => ({ ...f, mensagemConfirmacao: e.target.value }))}
                    placeholder="Entraremos em contato para confirmar. Até lá!"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50 resize-none" />
                  <p className="text-xs text-gray-400 mt-1">Exibida na tela de confirmação do formulário público.</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={agendaLoading}
                  className="btn-primary text-white font-semibold px-8 py-3 rounded-xl transition text-sm disabled:opacity-60">
                  {agendaLoading ? 'Salvando...' : 'Salvar configurações de agenda'}
                </button>
              </div>
            </form>

            {/* Link do formulário público */}
            {tenant?.slug && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">Formulário público de agendamento</h2>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Ativo</span>
                </div>
                <p className="text-xs text-gray-500">
                  Compartilhe o link abaixo ou embeds no site do seu cliente para que qualquer pessoa possa agendar sem precisar de login.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Link direto</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={linkFormulario}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 font-mono text-gray-600 truncate" />
                    <button type="button" onClick={() => copiar(linkFormulario)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                      Copiar
                    </button>
                    <a href={linkFormulario} target="_blank" rel="noreferrer"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                      Abrir
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Código de embed (iframe)</label>
                  <div className="relative">
                    <textarea readOnly rows={3} value={embedCode}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 font-mono text-gray-600 resize-none" />
                    <button type="button" onClick={() => copiar(embedCode)}
                      className="absolute top-2 right-2 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Cole este código no site do cliente para incorporar o formulário.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ABA INTEGRAÇÃO ── */}
        {tab === 'integracao' && (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-gray-900">Integração n8n</h2>
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Opcional</span>
                </div>
                <p className="text-xs text-gray-500">O CRM chama este webhook quando um novo agendamento é criado via formulário ou WhatsApp.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL do Webhook n8n</label>
                  <input type="url" value={form.n8nWebhookUrl}
                    onChange={e => setForm(f => ({ ...f, n8nWebhookUrl: e.target.value }))}
                    placeholder="https://seu-n8n.com/webhook/..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chave do webhook <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input type="password" value={form.n8nApiKey}
                    onChange={e => setForm(f => ({ ...f, n8nApiKey: e.target.value }))}
                    placeholder="Bearer token configurado no n8n"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={loading}
                  className="btn-primary text-white font-semibold px-8 py-3 rounded-xl transition text-sm disabled:opacity-60">
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>

            {/* Token de API */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Token de API</h2>
              <p className="text-xs text-gray-500">Use este token para que o n8n possa <strong>criar leads, agendamentos e consultar disponibilidade</strong> via API.</p>
              {apiToken ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type={showToken ? 'text' : 'password'} readOnly value={apiToken}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 font-mono" />
                    <button type="button" onClick={() => setShowToken(s => !s)}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                      {showToken ? 'Ocultar' : 'Ver'}
                    </button>
                    <button type="button" onClick={() => copiar(apiToken)}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Header: <code className="bg-gray-100 px-1 rounded">X-API-Token: {showToken ? apiToken : '••••••••'}</code></p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Nenhum token gerado ainda.</p>
              )}
              <button type="button" onClick={gerarToken} disabled={genLoading}
                className="bg-gray-900 hover:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-60">
                {genLoading ? 'Gerando...' : apiToken ? 'Regenerar token' : 'Gerar token de API'}
              </button>
            </div>

            {/* Endpoints */}
            {apiToken && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h2 className="font-semibold text-gray-700 mb-3">Endpoints disponíveis</h2>
                <div className="space-y-2 text-xs font-mono text-gray-600">
                  {[
                    ['GET',    '/api/n8n/leads',                'Listar leads'],
                    ['POST',   '/api/n8n/leads',                'Criar lead'],
                    ['PATCH',  '/api/n8n/leads/:id',            'Atualizar lead'],
                    ['GET',    '/api/n8n/agendamentos',         'Listar agendamentos'],
                    ['POST',   '/api/n8n/agendamentos',         'Criar agendamento (WhatsApp)'],
                    ['PATCH',  '/api/n8n/agendamentos/:id',     'Atualizar agendamento'],
                    ['GET',    '/api/n8n/disponibilidade?data=','Consultar slots livres'],
                    ['GET',    '/api/n8n/conversas/:telefone',  'Estado da conversa WA'],
                    ['PUT',    '/api/n8n/conversas/:telefone',  'Salvar/atualizar conversa WA'],
                    ['DELETE', '/api/n8n/conversas/:telefone',  'Encerrar conversa WA'],
                  ].map(([method, path, desc]) => (
                    <div key={path+method} className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold min-w-[48px] text-center
                        ${method==='GET' ? 'bg-green-100 text-green-700'
                        : method==='POST' ? 'bg-blue-100 text-blue-700'
                        : method==='DELETE' ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'}`}>{method}</span>
                      <span className="text-gray-500">{path}</span>
                      <span className="text-gray-400 hidden lg:inline">— {desc}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">Base URL: <code className="bg-gray-200 px-1 rounded">{window.location.origin}</code></p>
              </div>
            )}

            {/* Plano */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h2 className="font-semibold mb-1">Plano atual: <span className="capitalize">{tenant?.plano}</span></h2>
              <p className="text-gray-400 text-sm">Para alterar o plano ou adicionar mais usuários, entre em contato com o suporte.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
