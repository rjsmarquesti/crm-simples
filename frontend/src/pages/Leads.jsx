import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { BadgeLead } from '../components/Badge';
import { api } from '../services/api';

const STATUS_OPTIONS = ['novo', 'contato', 'agendado', 'convertido', 'perdido'];
const EMPTY_FORM = { nome: '', telefone: '', email: '', origem: '', status: 'novo', observacoes: '' };

function LeadForm({ form, setForm, onSubmit, loading }) {
  const field = (id, label, type = 'text', extra = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[id]} onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50" {...extra} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {field('nome', 'Nome *', 'text', { required: true, placeholder: 'Nome completo' })}
      <div className="grid grid-cols-2 gap-4">
        {field('telefone', 'Telefone', 'text', { placeholder: '(00) 00000-0000' })}
        {field('email', 'Email', 'email', { placeholder: 'email@exemplo.com' })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('origem', 'Origem', 'text', { placeholder: 'Instagram, Site...' })}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
        <textarea rows={3} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 resize-none"
          placeholder="Informações adicionais..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm">
          {loading ? 'Salvando...' : 'Salvar Lead'}
        </button>
      </div>
    </form>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const loadLeads = useCallback(async () => {
    try {
      const params = {};
      if (busca) params.busca = busca;
      if (filtroStatus) params.status = filtroStatus;
      const data = await api.get('/leads', params);
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) { toast.error(err.message); }
  }, [busca, filtroStatus]);

  useEffect(() => {
    const t = setTimeout(loadLeads, 300);
    return () => clearTimeout(t);
  }, [loadLeads]);

  async function openEdit(id) {
    try {
      const data = await api.get(`/leads/${id}`);
      const l = data.lead;
      setForm({ nome: l.nome, telefone: l.telefone || '', email: l.email || '', origem: l.origem || '', status: l.status, observacoes: l.observacoes || '' });
      setEditId(id);
      setModalOpen(true);
    } catch (err) { toast.error(err.message); }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/leads/${editId}`, form);
        toast.success('Lead atualizado!');
      } else {
        await api.post('/leads', form);
        toast.success('Lead criado!');
      }
      setModalOpen(false);
      loadLeads();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id, nome) {
    if (!confirm(`Remover o lead "${nome}"?`)) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead removido');
      loadLeads();
    } catch (err) { toast.error(err.message); }
  }

  return (
    <Layout title="Leads" subtitle="Gerencie seus contatos e oportunidades">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Buscar por nome, telefone ou email..."
          value={busca} onChange={e => setBusca(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-w-[160px]">
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Lead
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">{total} lead(s) encontrado(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Telefone</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Origem</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nenhum lead encontrado</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{l.nome}</div>
                    <div className="text-xs text-gray-400">#{l.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{l.telefone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{l.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{l.origem || '-'}</td>
                  <td className="px-6 py-4"><BadgeLead status={l.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(l.id)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(l.id, l.nome)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remover">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editId ? 'Editar Lead' : 'Novo Lead'}>
        <LeadForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={loading} />
      </Modal>
    </Layout>
  );
}
