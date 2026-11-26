const express = require('express');
const router = express.Router();

const funcionarioControle = require('../controllers/funcionarioControle');
const verificarGerente = require('../middlewares/verificarGerente');


router.use(verificarGerente);

router.get('/cargos', funcionarioControle.listarCargos);
router.get('/listar', funcionarioControle.listarFuncionarios);
router.get('/cliente/:id', funcionarioControle.obterClienteParaPromocao);
router.post('/promover', funcionarioControle.promoverFuncionario);
router.put('/:id', funcionarioControle.atualizarFuncionario);
router.delete('/:id', funcionarioControle.deletarFuncionario);

module.exports = router;

