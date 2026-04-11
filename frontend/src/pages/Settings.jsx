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
  const [form, setForm] = useState({ nome: '', logo: '', corPrimaria: '#2563eb', modulos: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(d => {
      const t = d.tenant;
      setForm({ nome: t.nome, logo: t.logo || '', corPrimaria: t.corPrimaria, modulos: t.modulos || [] });
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
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logo (opcional)</label>
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
                  <input type="checkbox" checked={form.modulos.includes(m.id)} onChange={() => toggleModulo(m.id)}
                    className="w-4 h-4 rounded" />
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

        {/* Info do plano */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white">
          <h2 className="font-semibold mb-1">Plano atual: <span className="capitalize">{tenant?.plano}</span></h2>
          <p className="text-gray-400 text-sm">Para alterar o plano ou adicionar mais usuários, entre em contato com o suporte.</p>
        </div>
      </div>
    </Layout>
  );
}
