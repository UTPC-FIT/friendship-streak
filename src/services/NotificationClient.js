const axios = require('axios'); // Asegúrate de instalar axios: npm install axios

class NotificationClient {
    constructor() {
        // La URL base para el servicio de notificaciones se obtiene de las variables de entorno
        this.baseURL = process.env.NOTIFICATIONS_API_URL || 'http://localhost:3002/api/notifications';
        if (!this.baseURL) {
            console.warn('WARNING: NOTIFICATIONS_API_URL no está definida. Las notificaciones no funcionarán.');
        }
    }

    /**
     * Envía un correo electrónico a través del servicio de notificaciones.
     * @param {Object} emailData - Datos del correo electrónico.
     * @param {string} emailData.to - Dirección de correo del destinatario.
     * @param {string} emailData.subject - Asunto del correo.
     * @param {string} emailData.body - Contenido del correo (HTML o texto plano).
     * @returns {Promise<Object>} La respuesta del servicio de notificaciones.
     */
    async sendEmail({ to, subject, body }) {
        if (!this.baseURL) {
            console.error('NOTIFICATIONS_API_URL no está configurada, no se puede enviar correo.');
            throw new Error('Notification service URL is not configured.');
        }
        try {
            const response = await axios.post(`${this.baseURL}/email`, { to, subject, body });
            console.log('Correo enviado con éxito:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al enviar correo electrónico:', error.message);
            // Si el error tiene una respuesta HTTP, puedes acceder a ella aquí
            if (error.response) {
                console.error('Error de respuesta del servidor:', error.response.status, error.response.data);
                throw new Error(`Failed to send email: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Envía un mensaje de Telegram a través del servicio de notificaciones.
     * @param {Object} telegramData - Datos del mensaje de Telegram.
     * @param {string} telegramData.chat_id - ID del chat de Telegram.
     * @param {string} telegramData.text - Texto del mensaje.
     * @param {string} [telegramData.parse_mode] - Modo de parseo (ej. 'MarkdownV2').
     * @returns {Promise<Object>} La respuesta del servicio de notificaciones.
     */
    async sendTelegram({ chat_id, text, parse_mode }) {
        if (!this.baseURL) {
            console.error('NOTIFICATIONS_API_URL no está configurada, no se puede enviar Telegram.');
            throw new Error('Notification service URL is not configured.');
        }
        try {
            const response = await axios.post(`${this.baseURL}/telegram`, { chat_id, text, parse_mode });
            console.log('Mensaje de Telegram enviado con éxito:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al enviar mensaje de Telegram:', error.message);
            if (error.response) {
                console.error('Error de respuesta del servidor:', error.response.status, error.response.data);
                throw new Error(`Failed to send Telegram message: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
}

module.exports = new NotificationClient();