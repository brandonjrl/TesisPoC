const Transaccion = require('../models/Transaccion');
const Retroalimentacion = require('../models/Retroalimentacion');
const axios = require('axios');
const historialController = require('./historial.controller');
require('dotenv').config();  // Para cargar las variables de entorno

// Función para validar los datos
const validarDatos = ({ id_estudiante, id_tarea, descripcion_tarea, codigo_estudiante, tipo_retroalimentacion }) => {
    if (!id_estudiante || !id_tarea || !descripcion_tarea || !codigo_estudiante || !tipo_retroalimentacion) {
        throw new Error('Faltan parámetros obligatorios');
    }
};

// Función para limpiar el código del estudiante usando regex
const limpiarCodigo = (codigo) => {
    return codigo.replace(/[\s\n\r]+|["]+/g, '').trim(); // Limpia saltos de línea, comillas dobles y espacios en blanco
};

// Función para crear el prompt a enviar a GPT
const crearPrompt = (retroalimentacion, descripcion_tarea, codigo_esperado, codigo_estudiante) => {
    return `
    ${retroalimentacion.prompt}\n
    Descripción de la tarea: ${descripcion_tarea}\n
    Código esperado:\n${codigo_esperado}\n
    Código del estudiante:\n${codigo_estudiante}
    `;
};

// Función para llamar a la API de GPT y recibir la retroalimentación
const llamarGPT = async (prompt) => {
    try {
        const respuestaGPT = await axios.post('https://api.openai.com/v1/completions', {
            prompt: prompt,
            max_tokens: 500, // Ajusta según sea necesario
            model: 'gpt-3.5-turbo', // O el modelo que estés usando
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // Usa la API key desde el .env
            }
        });

        return respuestaGPT.data.choices[0].text.trim();
    } catch (error) {
        throw new Error('Error al llamar a la API de GPT');
    }
};

// Controlador de transacciones
const transaccionController = {};

// Método para procesar la transacción
transaccionController.procesarTransaccion = async (req, res) => {
    try {
        // 1. Validar los datos que llegan en la solicitud
        validarDatos(req.body);

        const { id_estudiante, id_tarea, descripcion_tarea, codigo_estudiante, tipo_retroalimentacion } = req.body;

        // 2. Limpiar el código del estudiante
        const codigoLimpio = limpiarCodigo(codigo_estudiante);

        // 3. Buscar el código esperado para esta tarea en la base de datos (Transaccion)
        const transaccion = await Transaccion.findOne({ id_tarea });
        if (!transaccion) {
            return res.status(404).json({ message: 'Tarea no encontrada' });
        }

        const { codigo_esperado } = transaccion;

        // 4. Buscar el tipo de retroalimentación en la base de datos (Retroalimentacion)
        const retroalimentacion = await Retroalimentacion.findOne({ tipo_retroalimentacion });
        if (!retroalimentacion) {
            return res.status(404).json({ message: 'Tipo de retroalimentación no encontrado' });
        }

        // 5. Crear el prompt para la IA
        const promptGPT = crearPrompt(retroalimentacion, descripcion_tarea, codigo_esperado, codigoLimpio);

        // 6. Llamar a la API de GPT para obtener la retroalimentación
        const respuestaRetroalimentacion = await llamarGPT(promptGPT);

        // 7. Actualizar la transacción con la retroalimentación generada por GPT
        transaccion.codigo_gpt = respuestaRetroalimentacion;
        await transaccion.save();

        // 8. Llamar al controlador de historial para almacenar los datos
        await historialController.guardarHistorial({
            id_estudiante,
            id_tarea,
            descripcion_tarea,
            codigo_esperado,
            codigo_estudiante: codigoLimpio,
            respuesta_gpt: respuestaRetroalimentacion
        });

        // 9. Devolver la respuesta de la IA al cliente (estudiante)
        return res.status(200).json({
            message: 'Transacción procesada correctamente',
            retroalimentacion: respuestaRetroalimentacion
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

module.exports = transaccionController;
