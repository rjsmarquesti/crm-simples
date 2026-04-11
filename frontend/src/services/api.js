const BASE = '/api';

function getToken() {
  return localStorage.getItem('crm_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (res.status === 401) {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    const msg = data.error || data.errors?.[0]?.msg || 'Erro na requisição';
    throw new Error(msg);
  }

  return data;
}

export const api = {
  get: (url, params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(url + qs);
  },
  post:   (url, body) => request(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body) => request(url, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (url)       => request(url, { method: 'DELETE' }),
};
