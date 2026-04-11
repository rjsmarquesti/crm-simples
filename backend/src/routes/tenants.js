const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/tenantsController');
const auth = require('../middlewares/auth');
const { requireRole } = auth;

// Apenas super_admin acessa essas rotas
router.get('/',    auth, requireRole('super_admin'), ctrl.listar);
router.get('/:id', auth, requireRole('super_admin'), ctrl.buscarPorId);
router.post('/',   auth, requireRole('super_admin'), [
  body('nome').notEmpty(),
  body('slug').notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug inválido (use apenas letras, números e -)')
], ctrl.criar);
router.put('/:id',    auth, requireRole('super_admin'), ctrl.atualizar);
router.delete('/:id', auth, requireRole('super_admin'), ctrl.deletar);

module.exports = router;
