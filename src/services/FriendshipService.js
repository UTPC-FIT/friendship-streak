const neo4jService = require('./Neo4jService.js');
const turnsClient = require('./turnsManagementClient');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

class FriendshipService {
    
    async sendFriendRequest(userId1, userId2) {
        try {
            // Verificar que los usuarios estén en el mismo turno
            const areInSameTurn = await turnsClient.areStudentsInSameTurn(userId1, userId2);
            
            if (!areInSameTurn) {
                throw new Error('Users must be in the same turn to create friendship');
            }
            
            // Crear relación de amistad en Neo4j
            const result = await neo4jService.createFriendship(userId1, userId2);
            
            const requestId = uuidv4();
            logger.info(`Friendship request sent: ${userId1} -> ${userId2} (${requestId})`);
            
            return requestId;
        } catch (error) {
            logger.error('Error sending friend request:', error.message);
            throw error;
        }
    }
    
    async acceptFriendRequest(requestId) {
        try {
            // En un caso real, aquí buscarías la solicitud por ID
            // Por simplicidad, asumimos que se acepta
            logger.info(`Friendship request accepted: ${requestId}`);
            return { status: 'accepted', requestId };
        } catch (error) {
            logger.error('Error accepting friend request:', error.message);
            throw error;
        }
    }
    
    async createFriendship(userId1, userId2) {
        try {
            // Verificar que los usuarios estén en el mismo turno
            const areInSameTurn = await turnsClient.areStudentsInSameTurn(userId1, userId2);
            
            if (!areInSameTurn) {
                throw new Error('Users must be in the same turn to create friendship');
            }
            
            // Crear relación de amistad en Neo4j
            const result = await neo4jService.createFriendship(userId1, userId2);
            
            logger.info(`Friendship created between users ${userId1} and ${userId2}`);
            return result;
        } catch (error) {
            logger.error('Error creating friendship:', error.message);
            throw error;
        }
    }
    
    async getFriendships(userId) {
        try {
            const friendships = await neo4jService.getUserFriendships(userId);
            
            // Enriquecer con información de turnos actuales
            const enrichedFriendships = await Promise.all(
                friendships.map(async (friendship) => {
                    try {
                        const friendSchedule = await turnsClient.getCurrentValidSchedule(friendship.friendId);
                        return {
                            ...friendship,
                            currentTurn: friendSchedule || null
                        };
                    } catch (error) {
                        return {
                            ...friendship,
                            currentTurn: null
                        };
                    }
                })
            );
            
            return enrichedFriendships;
        } catch (error) {
            logger.error('Error getting friendships:', error.message);
            throw error;
        }
    }
    
    async updateFriendshipStatus(userId1, userId2, status) {
        try {
            const result = await neo4jService.updateFriendshipStatus(userId1, userId2, status);
            logger.info(`Friendship status updated between ${userId1} and ${userId2}: ${status}`);
            return result;
        } catch (error) {
            logger.error('Error updating friendship status:', error.message);
            throw error;
        }
    }
    
    async updateStreak(userId1, userId2, date = null) {
        try {
            const encounterDate = date || new Date().toISOString().split('T')[0];
            const result = await neo4jService.updateStreak(userId1, userId2, encounterDate);
            logger.info(`Streak updated between ${userId1} and ${userId2} for date ${encounterDate}`);
            return result;
        } catch (error) {
            logger.error('Error updating streak:', error.message);
            throw error;
        }
    }
    
    async getStreak(userId1, userId2) {
        try {
            return await neo4jService.getStreak(userId1, userId2);
        } catch (error) {
            logger.error('Error getting streak:', error.message);
            throw error;
        }
    }
}

module.exports = new FriendshipService();