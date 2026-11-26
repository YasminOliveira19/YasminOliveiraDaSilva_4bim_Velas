
const express = require('express');
const router = express.Router();
const clienteControle = require('../controllers/clienteControle');

// Rotas do perfil do cliente
router.get('/perfil', clienteControle.consultarMeuPerfil);
router.put('/perfil', clienteControle.atualizarMeuPerfil);

// Rotas antigas do CRUD
router.get('/listar', clienteControle.listarClientes);
router.get('/:id', clienteControle.obterCliente);
router.post('/cadastro', clienteControle.cadastrarCliente);
router.post('/', clienteControle.criarCliente);
router.put('/:id', clienteControle.atualizarCliente);
router.delete('/:id', clienteControle.deletarCliente);

module.exports = router;
