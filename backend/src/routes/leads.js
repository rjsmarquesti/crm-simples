const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/leadsController');
const auth = require('../middlewares/auth');

const validar = [body('nome').notEmpty().withMessage('Nome obrigatório')];

router.get('/',    auth, ctrl.listar);
router.get('/:id', auth, ctrl.buscarPorId);
router.post('/',   auth, validar, ctrl.criar);
router.put('/:id', auth, validar, ctrl.atualizar);
router.delete('/:id', auth, ctrl.deletar);

module.exports = router;
