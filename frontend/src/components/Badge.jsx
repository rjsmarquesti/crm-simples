const LEAD_COLORS = {
  novo:       'bg-blue-100 text-blue-700',
  contato:    'bg-yellow-100 text-yellow-700',
  agendado:   'bg-purple-100 text-purple-700',
  convertido: 'bg-green-100 text-green-700',
  perdido:    'bg-red-100 text-red-700',
};

const AGEND_COLORS = {
  marcado:    'bg-blue-100 text-blue-700',
  confirmado: 'bg-green-100 text-green-700',
  cancelado:  'bg-red-100 text-red-700',
  realizado:  'bg-gray-100 text-gray-600',
};

const LABELS = {
  novo: 'Novo', contato: 'Contato', agendado: 'Agendado',
  convertido: 'Convertido', perdido: 'Perdido',
  marcado: 'Marcado', confirmado: 'Confirmado', cancelado: 'Cancelado', realizado: 'Realizado',
};

export function BadgeLead({ status }) {
  const color = LEAD_COLORS[status] || 'bg-gray-100 text-gray-600';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{LABELS[status] || status}</span>;
}

export function BadgeAgend({ status }) {
  const color = AGEND_COLORS[status] || 'bg-gray-100 text-gray-600';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{LABELS[status] || status}</span>;
}
