const Historial = require('../models/Historial');
const Descripcion = require('../models/Descripcion');

// Controlador de historial
const historialController = {};

// Método para guardar el historial
historialController.guardarHistorial = async ({ id_estudiante, id_tarea, descripcion_tarea, codigo_esperado, codigo_estudiante, codigo_gpt, tipo_retroalimentacion }) => {
    try {
        // Buscar si ya existe un historial para ese estudiante y tarea
        let historial = await Historial.findOne({ id_estudiante, id_tarea });

        // Si no existe, se crea uno nuevo
        if (!historial) {
            historial = new Historial({
                id_estudiante,
                id_tarea,
                descripcion_tarea,
                codigo_esperado,
                descripcion: []
            });
        }

        // Crear una nueva descripción
        const nuevaDescripcion = new Descripcion({
            codigo_gpt,
            codigo_estudiante,
            tipo_retroalimentacion 
        });

        // Agregar la nueva descripción al historial
        historial.descripcion.push(nuevaDescripcion);

        // Guardar el historial actualizado
        await historial.save();
    } catch (error) {
        console.error('Error al guardar el historial:', error);
        throw new Error('No se pudo guardar el historial');
    }
};

module.exports = historialController;
