
const express = require('express');
const router = express.Router();
const loginControle = require('../controllers/loginControle');

router.post('/', loginControle.login);
router.get('/verificar', loginControle.verificarSessao);
router.put('/perfil', loginControle.atualizarPerfil);
router.post('/logout', loginControle.logout);

module.exports = router;
