const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, senha } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email ou senha incorretos' });

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(401).json({ error: 'Email ou senha incorretos' });

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (err) { next(err); }
};

exports.me = (req, res) => res.json({ user: req.user });
