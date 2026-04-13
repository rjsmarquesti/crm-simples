import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { BadgeAgend } from '../components/Badge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['marcado', 'confirmado', 'cancelado', 'realizado'];
const hoje = new Date().toISOString().split('T')[0];
const EMPTY_FORM = { lead_id: '', data: hoje, hora: '', tipo: '', status: 'marcado', observacoes: '' };

function AgendForm({ form, setForm, leads, onSubmit, loading }) {
  const inp = (id, label, type, extra = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[id]} onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50" {...extra} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Lead *</label>
        <select required value={form.lead_id} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50">
          <option value="">Selecionar lead...</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.nome}{l.telefone ? ` · ${l.telefone}` : ''}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {inp('data', 'Data *', 'date', { required: true })}
        {inp('hora', 'Hora *', 'time', { required: true })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {inp('tipo', 'Tipo', 'text', { placeholder: 'Consulta, Reunião...' })}
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
          placeholder="Detalhes do agendamento..." />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm">
          {loading ? 'Salvando...' : 'Salvar Agendamento'}
        </button>
      </div>
    </form>
  );
}

function formatDate(s) {
  if (!s) return '-';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

const STATUS_COLOR_MOBILE = {
  marcado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  realizado: 'bg-gray-100 text-gray-600',
};

export default function Agendamentos() {
  const [items, setItems]         = useState([]);
  const [leads, setLeads]         = useState([]);
  const [filtroData, setFiltroData]     = useState(hoje);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [loading, setLoading]     = useState(false);
  const { tenant } = useAuth();

  const loadItems = useCallback(async () => {
    try {
      const params = {};
      if (filtroData) params.data = filtroData;
      if (filtroStatus) params.status = filtroStatus;
      const data = await api.get('/agendamentos', params);
      setItems(data.agendamentos);
    } catch (err) { toast.error(err.message); }
  }, [filtroData, filtroStatus]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    api.get('/leads', { limit: 200 })
      .then(d => setLeads(d.leads))
      .catch(() => {});
  }, []);

  function openCreate() {
    setForm({ ...EMPTY_FORM, data: filtroData || hoje });
    setEditId(null);
    setModalOpen(true);
  }

  async function openEdit(id) {
    try {
      const data = await api.get(`/agendamentos/${id}`);
      const a = data.agendamento;
      setForm({ lead_id: a.leadId, data: a.data, hora: a.hora, tipo: a.tipo || '', status: a.status, observacoes: a.observacoes || '' });
      setEditId(id);
      setModalOpen(true);
    } catch (err) { toast.error(err.message); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/agendamentos/${editId}`, form);
        toast.success('Agendamento atualizado!');
      } else {
        await api.post('/agendamentos', form);
        toast.success('Agendamento criado!');
      }
      setModalOpen(false);
      loadItems();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este agendamento?')) return;
    try {
      await api.delete(`/agendamentos/${id}`);
      toast.success('Removido');
      loadItems();
    } catch (err) { toast.error(err.message); }
  }

  const tituloData = filtroData
    ? new Date(filtroData + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    : 'Todos os dias';

  return (
    <Layout title="Agendamentos" subtitle="Controle sua agenda de atendimentos">

      {/* Header de impressão */}
      <div className="print-only">
        <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{tenant?.nome || 'CRM Divulga BR'}</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>Agenda de Atendimentos</div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
            {filtroData ? `Data: ${formatDate(filtroData)}` : 'Todos os períodos'} · Emitido em {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-6 no-print">
        <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-w-[150px]">
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button onClick={() => setFiltroData('')}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition bg-white">
          Todos os dias
        </button>
        <div className="flex-1" />
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          PDF
        </button>
        <button onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo
        </button>
      </div>

      {/* Título da data (mobile) */}
      {filtroData && (
        <p className="md:hidden text-sm font-medium text-gray-700 mb-3 capitalize no-print">{tituloData}</p>
      )}

      {/* Cards mobile */}
      <div className="md:hidden space-y-3 no-print">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            Nenhum agendamento encontrado
          </div>
        ) : items.map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="font-semibold text-gray-900">{a.lead.nome}</div>
                {a.lead.telefone && <div className="text-xs text-gray-500">{a.lead.telefone}</div>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(a.id)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm mb-1">
              <span className="font-bold text-blue-600 text-lg">{a.hora}</span>
              <span className="text-gray-500">{formatDate(a.data)}</span>
              {a.tipo && <span className="text-gray-500">· {a.tipo}</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR_MOBILE[a.status] || ''}`}>{a.status}</span>
            </div>
            {a.observacoes && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{a.observacoes}</p>}
          </div>
        ))}
      </div>

      {/* Tabela desktop + impressão */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Lead</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Hora</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Observações</th>
                <th className="px-6 py-3 no-print">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Nenhum agendamento encontrado</td></tr>
              ) : items.map(a => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{a.lead.nome}</div>
                    <div className="text-xs text-gray-400">{a.lead.telefone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatDate(a.data)}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-blue-600">{a.hora}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{a.tipo || '-'}</td>
                  <td className="px-6 py-4"><BadgeAgend status={a.status} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{a.observacoes || '-'}</td>
                  <td className="px-6 py-4 no-print">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(a.id)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(a.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
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
        title={editId ? 'Editar Agendamento' : 'Novo Agendamento'}>
        <AgendForm form={form} setForm={setForm} leads={leads} onSubmit={handleSubmit} loading={loading} />
      </Modal>
    </Layout>
  );
}
