// src/models/Historial.js
const mongoose = require('mongoose');

const HistorialSchema = new mongoose.Schema({
  id_estudiante: { type: Number, required: true },
  id_tarea: { type: Number, required: true },
  descripcion_tarea: { type: String, required: true },
  codigo_esperado: { type: String, required: true },
  descripcion: [{ type: mongoose.Schema.Types.Array, ref: 'Descripcion', required: true }] // Referencia al modelo Descripcion
});

module.exports = mongoose.model('Historial', HistorialSchema);
