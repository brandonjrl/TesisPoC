// config/mongoose.config.js
const mongoose = require('mongoose'); 
//Nombre de la BDD
const db_name = 'POC_BELEN' 

mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    // Conectar con MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/' + db_name, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado a MongoDB');
  } catch (err) {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
