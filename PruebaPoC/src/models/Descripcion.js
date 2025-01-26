// src/models/Descripcion.js
const mongoose = require('mongoose');

const DescripcionSchema = new mongoose.Schema({
  codigo_gpt: { type: mongoose.Schema.Types.Mixed, default: {} }, // Respuesta generada por GPT
  codigo_estudiante: { type: String, required: true }, // Código entregado por el estudiante
  tipo_retroalimentacion: { type: String, default: '' }, // Tipo de retroalimentación dada
  salida_compilador: { type: Boolean, required: true }, // Nuevo campo
  contexto_adicional: { type: String, default: null }, // Nuevo campo
  timestamp_inicio: { type: Date, required: true }, // Nuevo campo para inicio de consulta
  timestamp_fin: { type: Date, required: true } // Nuevo campo para finalización de consulta
});

module.exports = mongoose.model('Descripcion', DescripcionSchema);
