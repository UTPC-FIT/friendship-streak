const axios = require('axios');

class TurnsManagementClient {
    constructor() {
        this.baseUrl = process.env.TURNS_MANAGEMENT_URL || 'http://localhost:3002';
        this.timeout = 5000;
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    
    async areStudentsInSameTurn(studentId1, studentId2, date = null) {
        try {
            // Por ahora, simulamos que siempre están en el mismo turno para pruebas
            console.log(`✅ Checking if ${studentId1} and ${studentId2} are in same turn`);
            return true;
        } catch (error) {
            console.warn('⚠️ Error checking turns:', error.message);
            return false;
        }
    }
    
    async getCurrentValidSchedule(studentId) {
        try {
            console.log(`📅 Getting schedule for student ${studentId}`);
            return { turnId: 'mock-turn-1', day: 'MONDAY', time: '08:00-10:00' }; // Simulado
        } catch (error) {
            console.warn('⚠️ Error getting schedule:', error.message);
            return null;
        }
    }
}

module.exports = new TurnsManagementClient();