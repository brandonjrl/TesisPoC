const OpenAIApi = require('openai');
require('dotenv').config();  // Cargar las variables de entorno

const MODEL_NAME = 'gpt-3.5-turbo';

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
        // Inicialización directa de OpenAIApi con la clave API
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
 * Función para realizar una solicitud a GPT.
 * @param {Array} messages - Array de mensajes para el modelo.
 * @param {Number} maxTokens - Máximo de tokens para la respuesta.
 * @param {Number} temperature - Parámetro de temperatura para GPT (controla la creatividad de la respuesta).
 * @returns {Promise<String>} - Retorna solo el mensaje de GPT como un string.
 */
const llamarGPT = async (messages, maxTokens = 800, temperature = 0.05) => {
    try {
        const response = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: messages,
            max_tokens: maxTokens,
            temperature: temperature,
        });

        // Capturar el contenido de la respuesta de GPT
        const gptMessage = response.choices[0].message.content.trim();

        // Capturar el uso de tokens y mostrarlo en la consola
        const tokenUsage = response.usage;
        console.log("Uso de tokens:");
        console.log(`Prompt Tokens: ${tokenUsage.prompt_tokens}`);
        console.log(`Completion Tokens: ${tokenUsage.completion_tokens}`);
        console.log(`Total Tokens: ${tokenUsage.total_tokens}`);

        // Retornar solo el mensaje de GPT (sin los tokens)
        return gptMessage; 
    } catch (error) {
        console.error('Error al llamar a la API de GPT:', error);
        throw error;
    }
};

module.exports = {
    initializeOpenAI,
    llamarGPT
};
