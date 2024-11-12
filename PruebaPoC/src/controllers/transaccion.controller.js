const Transaccion = require('../models/Transaccion');
const Retroalimentacion = require('../models/Retroalimentacion');
const historialController = require('./historial.controller');
const { llamarGPT } = require('../services/gptService'); // Importar el servicio de GPT
const Historial = require('../models/Historial');
require('dotenv').config();  // Para cargar las variables de entorno

// Función para validar los datos
const validarDatos = ({ id_estudiante, id_tarea, descripcion_tarea, codigo_estudiante, salida_esperada, tipo_retroalimentacion }) => {
    if (!id_estudiante || !id_tarea || !descripcion_tarea || !codigo_estudiante || !salida_esperada || !tipo_retroalimentacion) {
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

// Función para concatenar el Promt
const crearPrompt = (retroalimentacion, descripcion_tarea, salida_esperada,) => {
    return `
    ${retroalimentacion}\n
    Descripción de la tarea: ${descripcion_tarea}\n
    Salida esperada:\n${salida_esperada}\n
    `;
};
// Funcion para crear promt Usuario
const crearPromptUsuario = ( codigo_estudiante) =>{
    return `
    Código del estudiante:\n${codigo_estudiante}
    `;
}

// Controlador de transacciones
const transaccionController = {};

// Método para procesar la transacción
transaccionController.procesarTransaccion = async (req, res) => {
    try {
        // 1. Validar los datos que llegan en la solicitud
        try {
            validarDatos(req.body);
        } catch (validationError) {
            // Si hay un error en la validación, devolver una respuesta de error y detener la ejecución
            return res.status(400).json({ message: validationError.message });
        }

        const { id_estudiante, id_tarea, descripcion_tarea, codigo_estudiante, salida_esperada, tipo_retroalimentacion } = req.body;
        console.log("codigo estudiante:");
        console.log(codigo_estudiante);
        
        // 2. Buscar en el historial si ya existe una transacción con el mismo código y retroalimentación
        const descripcionCoincidente = await buscarCodigoHistorial(id_estudiante, id_tarea, codigo_estudiante, tipo_retroalimentacion);
        if (descripcionCoincidente) {
            console.log(`Código repetido encontrado: ${descripcionCoincidente.codigo_estudiante || 'Código no definido'}`);
            //return res.status(400).json({ message: 'Ya has realizado esta solicitud con el mismo código y retroalimentación.' });
        }

        // 3. Buscar el prompt en la base de datos de retroalimentaciones
        const retroalimentacion = await Retroalimentacion.findOne({ tipo_retroalimentacion });
        if (!retroalimentacion) {
            return res.status(400).json({ message: 'No se encontró el tipo de retroalimentación solicitado.' });
        }

        // 4. Crear el prompt para la IA usando los datos recibidos
        const promptGPT = crearPrompt(retroalimentacion.prompt, descripcion_tarea, salida_esperada);
        console.log("prompt System");
        console.log(promptGPT);

        // 5. Crear el prompt de usuario
        const promptUsuario = crearPromptUsuario(codigo_estudiante);
        console.log("prompt usuario");
        console.log(promptUsuario);

        // 5. Llamar a la API de GPT para obtener la retroalimentación
        let respuestaRetroalimentacion;
        try {
            respuestaRetroalimentacion = await llamarGPT([
                {
                    role: "system",
                    content: promptGPT
                },
                {
                    role: "user",
                    content: promptUsuario
                }
            ]);
        } catch (gptError) {
            console.error('Error al llamar a la API de GPT:', gptError);
            return res.status(500).json({ message: 'Error al obtener la retroalimentación de GPT.' });
        }

        // 6. Crear una nueva transacción y guardar en la base de datos
        const nuevaTransaccion = new Transaccion({
            id_estudiante,
            id_tarea,
            descripcion_tarea,
            salida_esperada,
            codigo_gpt: respuestaRetroalimentacion, // Aquí se almacena la respuesta de GPT
            codigo_estudiante,
            tipo_retroalimentacion
        });

        await nuevaTransaccion.save(); // Guardar la transacción en la base de datos

        // 7. Llamar al controlador de historial para almacenar los datos
        await historialController.guardarHistorial({
            id_estudiante,
            id_tarea,
            descripcion_tarea,
            salida_esperada,
            codigo_estudiante,
            codigo_gpt: respuestaRetroalimentacion,
            tipo_retroalimentacion  // Asegúrate de que estás pasando este campo
        });

        // 8. Devolver la respuesta de la IA al cliente (estudiante)
        return res.status(200).json({
            message: 'Transacción procesada correctamente',
            retroalimentacion: respuestaRetroalimentacion
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};


module.exports = transaccionController;
