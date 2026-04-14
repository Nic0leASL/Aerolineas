import mongoose from 'mongoose';
import Logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const logger = new Logger(process.env.LOG_LEVEL || 'info');

// URI extraída de variables de entorno (.env) con un fallback robusto en caso de que la terminal se abra en otro path
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://almendrassamuel667_db_user:iRvYRkrKFerm6fW9@cluster0.dzwxwhk.mongodb.net/AerolineasMongoDB';

let isConnected = false;

export const connectMongo = async () => {
    if (isConnected) {
        return;
    }

    try {
        // Conexión oficial de Mongoose utilizando la URL con credenciales
        await mongoose.connect(MONGO_URI, {
            // Opciones modernas recomendadas por Mongoose
            autoIndex: false, // En producción es mejor false
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        logger.info(`✓ Conectado exitosamente a MongoDB en el Nodo ${process.env.NODE_ID || '1'}`);
    } catch (error) {
        logger.error('✗ Error conectando a MongoDB:', { error: error.message });
        throw error;
    }
};

// Listeners de eventos de conexión (para monitoreo y caídas)
mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB se ha desconectado. Intentando reconectar...');
    isConnected = false;
});

mongoose.connection.on('error', (err) => {
    logger.error('Error innesperado en la conexión de MongoDB', { error: err.message });
});

export default mongoose;
