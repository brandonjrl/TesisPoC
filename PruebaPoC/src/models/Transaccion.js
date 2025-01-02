// src/models/Transaccion.js
const mongoose = require('mongoose');

const TransaccionSchema = new mongoose.Schema({
  id_estudiante: { type: String, required: true },
  id_tarea: { type: String, required: true },
  descripcion_tarea: { type: String, required: true },
  salida_esperada: { type: String, required: true },
  codigo_gpt: { type: mongoose.Schema.Types.Mixed, default: {} },
  codigo_estudiante: { type: String, required: true },
  tipo_retroalimentacion: { type: String, default: '' },
  test_case: { type: mongoose.Schema.Types.Mixed, default: {} }, // Accept any JSON structure
  salida_compilador: { type: Boolean, required: true }, // Nuevo campo
  contexto_adicional: { type: String, default: null } // Nuevo campo
});

module.exports = mongoose.model('Transaccion', TransaccionSchema);
