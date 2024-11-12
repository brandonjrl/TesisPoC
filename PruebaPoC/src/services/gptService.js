const OpenAIApi = require('openai');
require('dotenv').config();  // Cargar las variables de entorno

const MODEL_NAME = 'gpt-4o-mini';

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
 * Funcion para realizar el calculo de costo por modelo
 */
const calculateCost = (tokenUsed, model, tokenType) => {
    const costoPorMilToken ={
        "gpt-4o": { input: 2.5 / 1000, output: 10 / 1000 }, // Costo por mil tokens
        "gpt-4o-mini": { input: 0.15 / 1000, output: 0.6 / 1000 },
        "o1-preview": { input: 15 / 1000, output: 60 / 1000 },
        "o1-mini": { input: 3 / 1000, output: 12 / 1000 },
        "gpt-3.5-turbo": { input: 0.5 / 1000, output: 1.5 / 1000 }
    };
    const costoModelo = costoPorMilToken[model];
    if (!costoModelo){
        throw new Error(`Modelo no soportado para calculo de costo: ${model}`);
    }
    const aux = costoModelo[tokenType];
    if (!aux){
        throw new Error(`Tipo de token no soportado para el modelo ${model}`);
            }
    return (tokenUsed/1000)*aux;
    };

/**
 * Función para realizar una solicitud a GPT.
 * @param {Array} messages - Array de mensajes para el modelo.
 * @param {Number} maxTokens - Máximo de tokens para la respuesta.
 * @param {Number} temperature - Parámetro de temperatura para GPT (controla la creatividad de la respuesta).
 * @returns {Promise<String>} - Retorna solo el mensaje de GPT como un string.
 */
const llamarGPT = async (messages, maxTokens = 800, temperature = 0.3) => {
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
        console.log("Uso de tokens");
        console.log(`Prompt Tokens: ${tokenUsage.prompt_tokens}`);
        console.log(`Completion Tokens: ${tokenUsage.completion_tokens}`);
        console.log(`Total Tokens: ${tokenUsage.total_tokens}`);

        //Calculo de costo de tokens
        const inputCost = calculateCost(tokenUsage.prompt_tokens, MODEL_NAME, 'input');
        const outputCost = calculateCost(tokenUsage.completion_tokens, MODEL_NAME, 'output');
        const totalCost = inputCost + outputCost;
        console.log("Consumo de tokens");
        console.log(`Costo de tokens: $${totalCost.toFixed(4)}`);
        console.log(`Costo de entrada: $${inputCost.toFixed(4)}`);
        console.log(`Costo de salida: $${outputCost.toFixed(4)}`);

        // Retornar solo el mensaje de GPT
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
