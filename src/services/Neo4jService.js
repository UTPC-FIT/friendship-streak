const { getSession } = require('../config/neo4j');

class Neo4jService {
    
    async createFriendship(userId1, userId2) {
        const session = getSession();
        try {
            const query = `
                MATCH (u1:Student {id: $userId1}), (u2:Student {id: $userId2})
                MERGE (u1)-[f:FRIENDSHIP {
                    status: 'active',
                    createdAt: datetime(),
                    updatedAt: datetime()
                }]->(u2)
                MERGE (u2)-[f2:FRIENDSHIP {
                    status: 'active',
                    createdAt: datetime(),
                    updatedAt: datetime()
                }]->(u1)
                RETURN f, f2
            `;
            
            const result = await session.run(query, { userId1, userId2 });
            return result.records.length > 0;
        } finally {
            await session.close();
        }
    }
    
    async getUserFriendships(userId) {
        const session = getSession();
        try {
            const query = `
                MATCH (u:Student {id: $userId})-[f:FRIENDSHIP]->(friend:Student)
                RETURN friend.id as friendId, friend.name as friendName, 
                       friend.email as friendEmail, f.status as status,
                       f.createdAt as createdAt
                ORDER BY f.createdAt DESC
            `;
            
            const result = await session.run(query, { userId });
            return result.records.map(record => ({
                friendId: record.get('friendId'),
                friendName: record.get('friendName'),
                friendEmail: record.get('friendEmail'),
                status: record.get('status'),
                createdAt: record.get('createdAt')
            }));
        } finally {
            await session.close();
        }
    }
    
    async updateFriendshipStatus(userId1, userId2, status) {
        const session = getSession();
        try {
            const query = `
                MATCH (u1:Student {id: $userId1})-[f:FRIENDSHIP]->(u2:Student {id: $userId2})
                SET f.status = $status, f.updatedAt = datetime()
                RETURN f
            `;
            
            const result = await session.run(query, { userId1, userId2, status });
            return result.records.length > 0;
        } finally {
            await session.close();
        }
    }
    
    async updateStreak(userId1, userId2, date) {
        const session = getSession();
        try {
            const query = `
                MATCH (u1:Student {id: $userId1}), (u2:Student {id: $userId2})
                MERGE (u1)-[s:STREAK_ENCOUNTER {date: date($date)}]->(u2)
                MERGE (u2)-[s2:STREAK_ENCOUNTER {date: date($date)}]->(u1)
                SET s.timestamp = datetime(), s2.timestamp = datetime()
                RETURN s, s2
            `;
            
            const result = await session.run(query, { userId1, userId2, date });
            return result.records.length > 0;
        } finally {
            await session.close();
        }
    }
    
    async getStreak(userId1, userId2) {
        const session = getSession();
        try {
            const query = `
                MATCH (u1:Student {id: $userId1})-[s:STREAK_ENCOUNTER]->(u2:Student {id: $userId2})
                RETURN s.date as date
                ORDER BY s.date DESC
            `;
            
            const result = await session.run(query, { userId1, userId2 });
            const dates = result.records.map(record => record.get('date'));
            
            // Calcular racha consecutiva
            let streak = 0;
            const today = new Date();
            
            for (let i = 0; i < dates.length; i++) {
                const encounterDate = new Date(dates[i]);
                const daysDiff = Math.floor((today - encounterDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff === streak) {
                    streak++;
                } else {
                    break;
                }
            }
            
            return {
                currentStreak: streak,
                totalEncounters: dates.length,
                lastEncounter: dates[0] || null,
                encounters: dates
            };
        } finally {
            await session.close();
        }
    }
}

module.exports = new Neo4jService();