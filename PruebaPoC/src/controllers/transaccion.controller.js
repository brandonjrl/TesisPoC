// Importar modelos y servicios necesarios
const Transaccion = require('../models/Transaccion');
const Retroalimentacion = require('../models/Retroalimentacion');
const historialController = require('./historial.controller');
const { llamarGPT } = require('../services/gptService'); // Importar el servicio de GPT
const Historial = require('../models/Historial');
require('dotenv').config(); // Para cargar las variables de entorno

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
        return { descripcionCoincidente: null, pistaRepetida: null };
    }

    const descripcionCoincidente = historial.descripcion.find(descripcion =>
        descripcion.codigo_estudiante === codigo_estudiante &&
        descripcion.tipo_retroalimentacion === tipo_retroalimentacion
    );

    let pistaRepetida = null;

    if (descripcionCoincidente && descripcionCoincidente.codigo_gpt) {
        try {
            const gptResponse = descripcionCoincidente.codigo_gpt;
            if (typeof gptResponse === 'object' || gptResponse.startsWith('{')) {
                const parsedGptResponse = typeof gptResponse === 'object'
                    ? gptResponse
                    : JSON.parse(gptResponse);

                pistaRepetida = parsedGptResponse?.pista || null;
            }
        } catch (error) {
            console.error('Error al analizar el JSON en código_gpt:', error);
        }
    }

    return { descripcionCoincidente, pistaRepetida };
}

// Función para concatenar el Promt
const crearPrompt = (retroalimentacion, descripcion_tarea, salida_esperada, test_case = null) => {
    return `
    ${retroalimentacion}\n
    Descripción de la tarea: ${descripcion_tarea}\n
    Salida esperada:\n${salida_esperada}\n
    ${test_case ? `Test Case:\n${JSON.stringify(test_case)}` : ''}
    `;
};

// Función para crear prompt Usuario
const crearPromptUsuario = (codigo_estudiante, pistaRepetida = null, contexto_adicional = null, salida_compilador = null) => {
    let prompt = `
    Código del estudiante:\n${codigo_estudiante}
    `;

    if (pistaRepetida) {
        prompt += `
        Nota: La pista proporcionada anteriormente fue: "${pistaRepetida}". Por favor, proporcione una nueva pista que no sea redundante.
        `;
    }

    if (contexto_adicional) {
        prompt += `
        Información adicional del estudiante:\n${contexto_adicional}
        `;
        if (salida_compilador) {
            prompt += `
            Nota: El programa del estudiante compiló y produjo esta información adicional correctamente.
            `;
        }
    }

    return prompt;
};

// Controlador de transacciones
const transaccionController = {};

// Método para procesar la transacción
transaccionController.procesarTransaccion = async (req, res) => {
    try {
        // 1. Validar los datos que llegan en la solicitud
        try {
            validarDatos(req.body);
        } catch (validationError) {
            return res.status(400).json({ message: validationError.message });
        }

        const {
            id_estudiante,
            id_tarea,
            descripcion_tarea,
            codigo_estudiante,
            salida_esperada,
            tipo_retroalimentacion,
            test_case,
            contexto_adicional,
            salida_compilador
        } = req.body;
        //arranque de time stamp
        const timestamp_inicio = new Date();
        //console.log("Código estudiante:", codigo_estudiante);

        // 2. Buscar en el historial si ya existe una transacción con el mismo código y retroalimentación
        const { descripcionCoincidente, pistaRepetida } = await buscarCodigoHistorial(id_estudiante, id_tarea, codigo_estudiante, tipo_retroalimentacion);

        if (descripcionCoincidente) {
            console.log(`Código repetido encontrado: ${descripcionCoincidente.codigo_estudiante || 'Código no definido'}`);
        }

        // 3. Buscar el prompt en la base de datos de retroalimentaciones
        const retroalimentacion = await Retroalimentacion.findOne({ tipo_retroalimentacion });
        if (!retroalimentacion) {
            return res.status(400).json({ message: 'No se encontró el tipo de retroalimentación solicitado.' });
        }

        // 4. Crear el prompt para la IA usando los datos recibidos
        const promptGPT = crearPrompt(retroalimentacion.prompt, descripcion_tarea, salida_esperada, test_case || null);
        const promptUsuario = crearPromptUsuario(codigo_estudiante, pistaRepetida, contexto_adicional, salida_compilador);

        //console.log("Prompt System");
        //console.log(promptGPT);

        //console.log("Prompt Usuario");
        //console.log(promptUsuario);

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
        //console.log(respuestaRetroalimentacion);

        //finalizacion de time stamp.
        const timestamp_fin = new Date();

        // 6. Crear una nueva transacción y guardar en la base de datos
        const nuevaTransaccion = new Transaccion({
            id_estudiante,
            id_tarea,
            descripcion_tarea,
            salida_esperada,
            codigo_gpt: respuestaRetroalimentacion,
            codigo_estudiante,
            tipo_retroalimentacion,
            test_case: test_case || null,
            contexto_adicional: contexto_adicional || null,
            salida_compilador: !!salida_compilador
        });

        await nuevaTransaccion.save();

        // 7. Llamar al controlador de historial para almacenar los datos
        await historialController.guardarHistorial({
            id_estudiante,
            id_tarea,
            descripcion_tarea,
            salida_esperada,
            codigo_estudiante,
            codigo_gpt: respuestaRetroalimentacion,
            tipo_retroalimentacion,
            contexto_adicional,
            salida_compilador, 
            timestamp_inicio,
            timestamp_fin
        });


        // 8. Devolver la respuesta de la IA al cliente (estudiante)
        return res.status(200).json({
            retroalimentacion: respuestaRetroalimentacion
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

module.exports = transaccionController;
