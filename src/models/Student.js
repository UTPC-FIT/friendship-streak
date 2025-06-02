const { getSession } = require('../config/neo4j');

class Student {
    
    static async create(studentData) {
        const session = getSession();
        try {
            const { id, name, email, code } = studentData;
            
            const query = `
                MERGE (s:Student {id: $id})
                SET s.name = $name,
                    s.email = $email,
                    s.code = $code,
                    s.createdAt = datetime(),
                    s.updatedAt = datetime()
                RETURN s
            `;
            
            const result = await session.run(query, { id, name, email, code });
            return result.records[0]?.get('s').properties;
        } finally {
            await session.close();
        }
    }
    
    static async findById(id) {
        const session = getSession();
        try {
            const query = `
                MATCH (s:Student {id: $id})
                RETURN s
            `;
            
            const result = await session.run(query, { id });
            return result.records[0]?.get('s').properties;
        } finally {
            await session.close();
        }
    }
    
    static async findAll() {
        const session = getSession();
        try {
            const query = `
                MATCH (s:Student)
                RETURN s
                ORDER BY s.name
            `;
            
            const result = await session.run(query);
            return result.records.map(record => record.get('s').properties);
        } finally {
            await session.close();
        }
    }
}

module.exports = Student;