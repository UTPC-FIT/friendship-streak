const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configuraciones comunes
const LOG_LEVELS = {
    ERROR: 'error',
    INFO: 'info'
};

const COMMON_FORMATS = {
    timestamp: winston.format.timestamp(),
    errors: winston.format.errors({ stack: true }),
    json: winston.format.json(),
    console: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
    custom: winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} ${level}: ${message}${stack ? '\n' + stack : ''}`;
    })
};

// Función helper para crear transports de archivo
const createFileTransport = (filename, level = null) => {
    const config = {
        filename: path.join(logsDir, filename),
        format: COMMON_FORMATS.json
    };
    
    if (level) {
        config.level = level;
    }
    
    return new winston.transports.File(config);
};

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || LOG_LEVELS.INFO,
    format: winston.format.combine(
        COMMON_FORMATS.timestamp,
        COMMON_FORMATS.errors,
        COMMON_FORMATS.custom
    ),
    transports: [
        new winston.transports.Console({
            format: COMMON_FORMATS.console
        }),
        createFileTransport('error.log', LOG_LEVELS.ERROR),
        createFileTransport('combined.log')
    ]
});

module.exports = logger;