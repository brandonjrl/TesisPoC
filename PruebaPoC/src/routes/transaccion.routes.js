const express = require('express');
const transaccionController = require('../controllers/transaccion.controller');
const router = express.Router();

// Ruta para procesar una transacción
router.post('/transaccion', transaccionController.procesarTransaccion);

module.exports = router;
