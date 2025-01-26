// index.js
const express = require('express');
const app = express();
const port = 3000;
const connectDB = require('./config/mongoose.config'); // Importar la configuración de conexión
const { initializeOpenAI } = require('./services/gptService'); // Importar la función para inicializar OpenAI

// Middleware para parsear JSON
app.use(express.json());

// Importar rutas
const retroalimentacionRoutes = require('./routes/retroalimentacion.routes');
const transaccionRoutes = require('./routes/transaccion.routes');

// Función para iniciar el servidor y las conexiones
const startServer = async () => {
  try {
    // Conectar a la base de datos Retroalimentacion
    await connectDB();
    console.log('Conexión a la base de datos establecida con éxito.');

    // Inicializar OpenAI
    await initializeOpenAI();
    console.log('OpenAI inicializado correctamente.');

    // Usar las rutas de retroalimentación y API
    app.use('/retroalimentacion', retroalimentacionRoutes);
    app.use('/api', transaccionRoutes);

    // Levantar el servidor Express
    app.listen(port, () => {
      console.log(`Servidor escuchando en http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
  }
};

// Iniciar el servidor
startServer();
