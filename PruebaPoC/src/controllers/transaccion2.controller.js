const Transaccion = require('../models/Transaccion');
const historialController = require('./historial.controller');
const Historial = require('../models/Historial');
require('dotenv').config();

const transaccion2Controller = {};

// Función para validar los datos
const validarDatos = ({ id_estudiante, id_tarea, descripcion_tarea, codigo_estudiante, codigo_esperado, tipo_retroalimentacion }) => {
    if (!id_estudiante || !id_tarea || !descripcion_tarea || !codigo_estudiante || !codigo_esperado || !tipo_retroalimentacion) {
        throw new Error('Faltan parámetros obligatorios');
    }
};

// Función para buscar en el historial si ya existe una transacción con el mismo código de estudiante y retroalimentación
async function buscarCodigoHistorial(id_estudiante, id_tarea, codigo_estudiante, tipo_retroalimentacion) {
    const historial = await Historial.findOne({ id_estudiante, id_tarea });

    if (!historial) {
        return null; // No hay historial previo, así que no hay repetición
    }

    // Busca una coincidencia en las descripciones
    const descripcionCoincidente = historial.descripcion.find(descripcion =>
        descripcion.codigo_estudiante === codigo_estudiante &&
        descripcion.tipo_retroalimentacion === tipo_retroalimentacion
    );

    // Retorna la descripción coincidente o null si no existe
    return descripcionCoincidente || null;
}

// Método para procesar la transacción
transaccion2Controller.procesarTransaccion = async (req, res) => {
    try {
        validarDatos(req.body);

        const { id_estudiante, id_tarea, descripcion_tarea, codigo_estudiante, codigo_esperado, tipo_retroalimentacion } = req.body;

        const descripcionCoincidente = await buscarCodigoHistorial(id_estudiante, id_tarea, codigo_estudiante, tipo_retroalimentacion);
        if (descripcionCoincidente) {
            console.log(`Código repetido encontrado: ${descripcionCoincidente.codigo_estudiante || 'Código no definido'}`);
            return res.status(400).json({ message: 'Ya has realizado esta solicitud con el mismo código y retroalimentación.' });
        }

        const nuevaTransaccion = new Transaccion({
            id_estudiante,
            id_tarea,
            descripcion_tarea,
            codigo_esperado,
            codigo_gpt: 'value',
            codigo_estudiante,
            tipo_retroalimentacion
        });

        await nuevaTransaccion.save();

        await historialController.guardarHistorial({
            id_estudiante,
            id_tarea,
            descripcion_tarea,
            codigo_esperado,
            codigo_estudiante,
            codigo_gpt: 'value',
            tipo_retroalimentacion  
        });

        return res.status(200).json({
            message: 'Transacción procesada correctamente'
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

module.exports = transaccion2Controller;
