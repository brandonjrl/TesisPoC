const mongoose = require('mongoose');
const DescripcionSchema = require('./Descripcion').schema;

const HistorialSchema = new mongoose.Schema({
  id_estudiante: { type: Number, required: true },
  id_tarea: { type: Number, required: true },
  descripcion_tarea: { type: String, required: true },
  codigo_esperado: { type: String, required: true },
  descripcion: [DescripcionSchema] // Array de documentos de tipo Descripcion
});

module.exports = mongoose.model('Historial', HistorialSchema);
