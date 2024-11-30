const OpenAIApi = require('openai');
require('dotenv').config(); // Cargar las variables de entorno

const MODEL_NAME = 'gpt-4o';
const MAX_RETRIES = 3;

let openai;

/**
 * Inicializa OpenAI con la API key tomada directamente del archivo .env.
 */
const initializeOpenAI = () => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error('OPENAI_API_KEY debe estar definida en el archivo .env');
        process.exit(1); // Salir si no se define la API Key
    }

    try {
        openai = new OpenAIApi({
            apiKey: apiKey,
        });

        console.log('Inicialización de OpenAI completada con éxito');
    } catch (error) {
        console.error('Error al inicializar OpenAI.', error);
        throw error;
    }
};

/**
 * Función para calcular el costo de los tokens.
 * @param {Number} tokenUsed - Número de tokens usados.
 * @param {String} model - Modelo utilizado (e.g., gpt-3.5-turbo).
 * @param {String} tokenType - Tipo de token ('input' o 'output').
 * @returns {Number} - Costo calculado en USD.
 */
const calculateCost = (tokenUsed, model, tokenType) => {
    const costoPorMilToken = {
        "gpt-4o": { input: 2.5 / 1000, output: 10 / 1000 },
        "gpt-4o-mini": { input: 0.15 / 1000, output: 0.6 / 1000 },
        "gpt-3.5-turbo": { input: 0.5 / 1000, output: 1.5 / 1000 }
    };
    const costoModelo = costoPorMilToken[model];
    if (!costoModelo) {
        throw new Error(`Modelo no soportado para cálculo de costo: ${model}`);
    }
    const aux = costoModelo[tokenType];
    if (!aux) {
        throw new Error(`Tipo de token no soportado para el modelo ${model}`);
    }
    return (tokenUsed / 1000) * aux;
};

/**
 * Función para verificar y extraer JSON usando expresiones regulares.
 * @param {String} text - Texto de entrada.
 * @returns {Object|null} - Retorna el objeto JSON si es válido, o null si no lo es.
 */
const extractJSON = (text) => {
    const jsonRegex = /```json\n([\s\S]*?)```|({[\s\S]*})/;
    const match = text.match(jsonRegex);

    if (match) {
        try {
            return JSON.parse(match[1] || match[0]); // Intentar parsear el contenido JSON
        } catch (error) {
            console.error('Error al parsear el JSON:', error);
        }
    }

    return null; // Retornar null si no se encuentra JSON válido
};

/**
 * Función para realizar una solicitud a GPT.
 * @param {Array} messages - Array de mensajes para el modelo.
 * @param {Number} topP - Probabilidad acumulada para el muestreo.
 * @param {Number} temperature - Parámetro de temperatura para GPT.
 * @param {Array|null} stop - Secuencias para detener la generación (desactivado por defecto).
 * @returns {Promise<Object>} - Retorna el objeto JSON con la retroalimentación.
 */
const llamarGPT = async (messages, topP = 1.0, temperature = 0.3, stop = null) => {
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const response = await openai.chat.completions.create({
                model: MODEL_NAME,
                messages: messages,
                top_p: topP,
                temperature: temperature,
                ...(stop && { stop }) // Agrega 'stop' si no es null
            });

            // Capturar el contenido de la respuesta de GPT
            const gptMessage = response.choices[0].message.content.trim();

            // Capturar el uso de tokens y mostrarlo en la consola
            const tokenUsage = response.usage;
            console.log("Uso de tokens");
            console.log(`Prompt Tokens: ${tokenUsage.prompt_tokens}`);
            console.log(`Completion Tokens: ${tokenUsage.completion_tokens}`);
            console.log(`Total Tokens: ${tokenUsage.total_tokens}`);

            // Calcular el costo de los tokens
            const inputCost = calculateCost(tokenUsage.prompt_tokens, MODEL_NAME, 'input');
            const outputCost = calculateCost(tokenUsage.completion_tokens, MODEL_NAME, 'output');
            const totalCost = inputCost + outputCost;
            console.log("Consumo de tokens");
            console.log(`Costo de tokens: $${totalCost.toFixed(4)}`);
            console.log(`Costo de entrada: $${inputCost.toFixed(4)}`);
            console.log(`Costo de salida: $${outputCost.toFixed(4)}`);

            // Intentar extraer y validar JSON
            const parsedJSON = extractJSON(gptMessage);

            if (parsedJSON) {
                return parsedJSON; // Retornar el JSON válido
            } else {
                console.error('Respuesta no contenía JSON válido. Reintentando...');
            }
        } catch (error) {
            console.error('Error al llamar a la API de GPT:', error);
        }

        retries += 1;
        console.log(`Reintento ${retries} de ${MAX_RETRIES}`);
    }

    throw new Error('No se pudo obtener una respuesta válida en formato JSON después de varios intentos.');
};

module.exports = {
    initializeOpenAI,
    llamarGPT
};
