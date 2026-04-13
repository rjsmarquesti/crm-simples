require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ exposedHeaders: ['X-Tenant-Slug'] }));
app.use(express.json());

// Rotas públicas
app.use('/api/auth', require('./src/routes/auth'));

// Rotas super admin (sem tenant middleware)
app.use('/api/admin/tenants', require('./src/routes/tenants'));

// Rotas de integração n8n (autenticadas por API token, sem tenant middleware JWT)
app.use('/api/n8n', require('./src/routes/n8n'));

// Rotas protegidas por tenant
const tenantMiddleware = require('./src/middlewares/tenant');
app.use('/api/leads',        tenantMiddleware, require('./src/routes/leads'));
app.use('/api/agendamentos', tenantMiddleware, require('./src/routes/agendamentos'));
app.use('/api/dashboard',    tenantMiddleware, require('./src/routes/dashboard'));
app.use('/api/settings',     tenantMiddleware, require('./src/routes/settings'));
app.use('/api/users',        tenantMiddleware, require('./src/routes/users'));

app.use(require('./src/middlewares/errorHandler'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));
