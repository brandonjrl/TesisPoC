// src/models/Descripcion.js
const mongoose = require('mongoose');

const DescripcionSchema = new mongoose.Schema({
  codigo_gpt: { type: mongoose.Schema.Types.Mixed, default: {} }, // Respuesta generada por GPT
  codigo_estudiante: { type: String, required: true }, // Código entregado por el estudiante
  tipo_retroalimentacion: { type: String, default: '' }, // Tipo de retroalimentación dada
  salida_compilador: { type: Boolean, required: true }, // salida de compilador
  contexto_adicional: { type: String, default: null }, // contexto proporcionado
  timestamp_inicio: { type: Date, required: true }, // inicio de consulta
  timestamp_fin: { type: Date, required: true } // finalización de consulta
});

module.exports = mongoose.model('Descripcion', DescripcionSchema);
