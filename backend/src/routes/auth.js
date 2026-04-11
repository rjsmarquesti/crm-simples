const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const auth = require('../middlewares/auth');

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').notEmpty().withMessage('Senha obrigatória'),
], ctrl.login);

router.get('/me', auth, ctrl.me);

module.exports = router;
