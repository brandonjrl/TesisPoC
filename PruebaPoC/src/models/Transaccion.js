// src/models/Transaccion.js
const mongoose = require('mongoose');

const TransaccionSchema = new mongoose.Schema({
  id_transaccion: { type: Number, required: true, unique: true },
  nombre_profesor: { type: String, required: true },
  id_estudiante: { type: Number, required: true },
  nombre_estudiante: { type: String, required: true },
  nombre_curso: { type: String, required: true },
  id_tarea: { type: Number, required: true },
  descripcion_tarea: { type: String, required: true },
  codigo_esperado: { type: String, required: true },
  codigo_gpt: { type: String, default: '' },
  codigo_estudiante: { type: String, required: true },
  tipo_retroalimentacion: { type: String, default: '' }
});

module.exports = mongoose.model('Transaccion', TransaccionSchema);
