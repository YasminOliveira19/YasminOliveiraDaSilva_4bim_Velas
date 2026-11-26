const express = require('express');
const router = express.Router();

const enderecoControle = require('../controllers/enderecoControle');

router.post('/', enderecoControle.salvarEndereco);
router.get('/', enderecoControle.buscarEndereco);

module.exports = router;