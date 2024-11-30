// src/models/Descripcion.js
const mongoose = require('mongoose');

const DescripcionSchema = new mongoose.Schema({
  codigo_gpt: { type: mongoose.Schema.Types.Mixed, default: {} }, // Respuesta generada por GPT
  codigo_estudiante: { type: String, required: true }, // Código entregado por el estudiante
  tipo_retroalimentacion: { type: String, default: '' } // Tipo de retroalimentación dada
});

module.exports = mongoose.model('Descripcion', DescripcionSchema);
