const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const auth = require('../middlewares/auth');
const tenantMiddleware = require('../middlewares/tenant');

// Login usa o tenant middleware para identificar a empresa
router.post('/login', tenantMiddleware, [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').notEmpty().withMessage('Senha obrigatória'),
], ctrl.login);

// Super admin login (sem tenant)
router.post('/super-login', [
  body('email').isEmail(),
  body('senha').notEmpty(),
], ctrl.login);

router.get('/me', auth, ctrl.me);

module.exports = router;
