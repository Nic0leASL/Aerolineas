import sql from 'mssql';
import Logger from '../utils/logger.js';
import dotenv from 'dotenv';

// Cargar variables de entorno si no se han cargado
dotenv.config();

const logger = new Logger(process.env.LOG_LEVEL || 'info');
const nodeId = process.env.NODE_ID || '1';

// Determinación dinámica de puerto y contraseña base a NODE_ID
const isNode2 = nodeId === '2';
const nodeDbPort = isNode2 
    ? parseInt(process.env.SQL_PORT_NODE2 || '1434') 
    : parseInt(process.env.SQL_PORT_NODE1 || '1433');

const dbPassword = isNode2 
    ? process.env.SQL_PASSWORD_NODE2 
    : process.env.SQL_PASSWORD_NODE1;

// Configuración leída de las variables de entorno
const dbConfig = {
    user: process.env.SQL_USER || 'sa',
    password: dbPassword,
    server: process.env.SQL_SERVER || 'localhost',
    database: process.env.SQL_DATABASE || 'AerolineasDB',
    port: nodeDbPort,
    options: {
        encrypt: false, // En entorno dev suele ser false
        trustServerCertificate: true // Obligatorio true para dev/certs autofirmados
    }
};
        encrypt: false,
        trustServerCertificate: true 
    }
};

let poolContext = null;

export const getConnection = async () => {
    try {
        if (poolContext) return poolContext;
        poolContext = await sql.connect(dbConfig);
        logger.info(`Conectado a SQL Server (Puerto ${nodeDbPort}) desde Nodo ${nodeId}`);
        return poolContext;
    } catch (err) {
        logger.error('Error de conexión a Base de Datos Sql Server: ', err);
        // Si hay partición de red o pérdida de DB, no retornará sistema. CP mode.
        throw err;
    }
};

export { sql };
