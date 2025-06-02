const friendshipRepository = require('../repositories/FriendshipRepository');
const notificationClient = require('./NotificationClient');
const axios = require('axios'); // Si necesitas consultar el servicio de usuarios para nombres en el ranking/historial

class StreakService {

    /**
     * Actualiza la racha de una amistad.
     * @param {string} friendshipId - ID de la relación de amistad.
     * @param {'increment' | 'reset'} action - Acción a realizar ('increment' o 'reset').
     * @returns {Promise<Object>} La relación de amistad actualizada.
     * @throws {Error} Si la relación no existe o la acción es inválida.
     */
    async updateFriendshipStreak(friendshipId, action) {
        let updatedFriendship;
        if (action === 'increment') {
            updatedFriendship = await friendshipRepository.incrementStreak(friendshipId);
        } else if (action === 'reset') {
            updatedFriendship = await friendshipRepository.resetStreak(friendshipId);
        } else {
            throw new Error('Acción de racha inválida. Debe ser "increment" o "reset".');
        }

        if (!updatedFriendship) {
            throw new Error('Relación de amistad no encontrada para actualizar la racha.');
        }

        // Opcional: Notificar a los amigos sobre el cambio en la racha (ej. "¡Tu racha con X ha llegado a Y días!")
        // Para esto, necesitarías obtener los IDs de los estudiantes de la relación actualizada
        // y luego sus emails/chat_ids desde tu servicio de usuarios.
        // try {
        //     // Fetch student names/emails
        //     const student1Name = (await axios.get(`${process.env.USERS_API_URL}/profile/${updatedFriendship.student1_id}`))?.data?.name || `Estudiante ${updatedFriendship.student1_id}`;
        //     const student2Name = (await axios.get(`${process.env.USERS_API_URL}/profile/${updatedFriendship.student2_id}`))?.data?.name || `Estudiante ${updatedFriendship.student2_id}`;

        //     await notificationClient.sendEmail({
        //         to: `email_${updatedFriendship.student1_id}@example.com`,
        //         subject: `Actualización de racha con ${student2Name}`,
        //         body: `Tu racha con ${student2Name} es ahora de ${updatedFriendship.streak_count} días!`
        //     });
        //     await notificationClient.sendEmail({
        //         to: `email_${updatedFriendship.student2_id}@example.com`,
        //         subject: `Actualización de racha con ${student1Name}`,
        //         body: `Tu racha con ${student1Name} es ahora de ${updatedFriendship.streak_count} días!`
        //     });
        // } catch (notificationError) {
        //     console.error('Error al notificar sobre actualización de racha:', notificationError);
        // }

        return updatedFriendship;
    }

    /**
     * Obtiene el historial de rachas de un estudiante.
     * @param {string} studentId - ID del estudiante.
     * @returns {Promise<Array<Object>>} Historial de rachas, incluyendo el estado (activa/rota).
     * @throws {Error} Si hay un problema al consultar.
     */
    async getStudentStreakHistory(studentId) {
        const rawHistory = await friendshipRepository.getStudentStreakHistory(studentId);

        // Enriquecer con nombres de amigos y calcular estado de la racha
        const enrichedHistory = await Promise.all(rawHistory.map(async (entry) => {
            let friendName = `Amigo ${entry.friend_id}`; // Placeholder
            // --- OPCIONAL: Fetch de datos del usuario si el servicio de usuarios es externo ---
            // try {
            //     const friendProfile = await axios.get(`${process.env.USERS_API_URL}/profile/${entry.friend_id}`);
            //     friendName = friendProfile.data.name;
            // } catch (fetchError) {
            //     console.warn(`No se pudo obtener el nombre del amigo ${entry.friend_id}: ${fetchError.message}`);
            // }
            // ----------------------------------------------------------------------------------

            // Lógica para determinar si la racha está 'active' o 'broken'
            let status = 'active';
            if (entry.last_attendance_date) {
                const lastDate = new Date(entry.last_attendance_date);
                const today = new Date();
                // Calcula la diferencia en días, asegurándote de que la comparación sea solo por fecha
                const diffTime = Math.abs(today.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Según el requisito, la racha se rompe si la periodicidad (diaria) no se cumple
                // y han pasado 2 o más días desde la última asistencia conjunta.
                // Si hoy es Viernes y la última asistencia fue el Miércoles, diffDays es 2.
                // Si la última asistencia fue ayer, diffDays es 1.
                if (diffDays >= 2) { // Asumiendo que "dos 2 con respecto a hoy" significa dos días completos sin asistir
                    status = 'broken';
                }
            } else if (entry.streak_count === 0) {
                 status = 'new'; // Racha recién creada, sin asistencias conjuntas
            }

            return {
                friendship_id: entry.friendship_id,
                friend_id: entry.friend_id,
                friend_name: friendName, // Nombre del amigo
                streak_count: entry.streak_count,
                start_date: entry.start_date,
                last_attendance_date: entry.last_attendance_date,
                status: status
            };
        }));

        return enrichedHistory;
    }

    /**
     * Obtiene el ranking global de rachas.
     * @param {number} limit - Número máximo de resultados.
     * @returns {Promise<Array<Object>>} Ranking de rachas, con nombres de estudiantes.
     * @throws {Error} Si hay un problema al consultar.
     */
    async getGlobalStreakRanking(limit) {
        const rawRanking = await friendshipRepository.getGlobalStreakRanking(limit);

        // Enriquecer con nombres de estudiantes
        const enrichedRanking = await Promise.all(rawRanking.map(async (entry) => {
            let student1Name = `Estudiante ${entry.student1_id}`; // Placeholder
            let student2Name = `Estudiante ${entry.student2_id}`; // Placeholder

            // --- OPCIONAL: Fetch de datos de usuarios si el servicio de usuarios es externo ---
            // try {
            //     const [student1Profile, student2Profile] = await Promise.all([
            //         axios.get(`${process.env.USERS_API_URL}/profile/${entry.student1_id}`),
            //         axios.get(`${process.env.USERS_API_URL}/profile/${entry.student2_id}`)
            //     ]);
            //     student1Name = student1Profile.data.name;
            //     student2Name = student2Profile.data.name;
            // } catch (fetchError) {
            //     console.warn(`No se pudieron obtener nombres de estudiantes para ranking: ${fetchError.message}`);
            // }
            // ----------------------------------------------------------------------------------

            return {
                friendship_id: entry.friendship_id,
                student1_id: entry.student1_id,
                student1_name: student1Name,
                student2_id: entry.student2_id,
                student2_name: student2Name,
                streak_count: entry.streak_count
            };
        }));

        return enrichedRanking;
    }
}

module.exports = new StreakService();