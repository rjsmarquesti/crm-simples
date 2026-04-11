require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',         require('./src/routes/auth'));
app.use('/api/leads',        require('./src/routes/leads'));
app.use('/api/agendamentos', require('./src/routes/agendamentos'));
app.use('/api/dashboard',    require('./src/routes/dashboard'));

app.use(require('./src/middlewares/errorHandler'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
