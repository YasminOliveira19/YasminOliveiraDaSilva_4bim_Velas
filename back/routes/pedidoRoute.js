const express = require('express');
const router = express.Router();
const pedidoControle = require('../controllers/pedidoControle');

// Rotas do CRUD de Pedidos
router.get('/listar', pedidoControle.listarPedidos);
router.get('/:id', pedidoControle.obterPedido);
router.post('/', pedidoControle.criarPedido);
router.put('/:id', pedidoControle.atualizarPedido);
router.put('/:id/cancelar', pedidoControle.cancelarPedido);

module.exports = router;