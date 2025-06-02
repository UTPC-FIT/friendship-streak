const { driver } = require("../config/neo4j");
const { v4: uuidv4 } = require("uuid");

class FriendshipRequest {
  static async create(fromStudentId, toStudentId) {
    const session = driver.session();
    try {
      const requestId = uuidv4();
      const result = await session.run(
        `MATCH (from:Student {id: $fromStudentId}), (to:Student {id: $toStudentId})
                 CREATE (req:FriendshipRequest {
                     id: $requestId,
                     status: 'pending',
                     created_at: datetime()
                 })
                 CREATE (from)-[:SENT_REQUEST {id: $requestId, status: 'pending'}]->(to)
                 RETURN req`,
        { fromStudentId, toStudentId, requestId }
      );
      return result.records[0].get("req").properties;
    } finally {
      await session.close();
    }
  }

  static async accept(requestId, acceptedById) {
    const session = driver.session();
    try {
      const friendshipId = uuidv4();
      const result = await session.run(
        `MATCH (req:FriendshipRequest {id: $requestId})
         MATCH (from)-[sent:SENT_REQUEST {id: $requestId}]->(to)
         SET req.status = 'accepted',
             req.accepted_at = datetime(),
             sent.status = 'accepted'
         CREATE (from)-[:FRIENDS_WITH {
             id: $friendshipId,
             created_at: datetime(),
             streak_count: 0
         }]->(to)
         CREATE (to)-[:FRIENDS_WITH {
             id: $friendshipId,
             created_at: datetime(),
             streak_count: 0
         }]->(from)
         RETURN req`,
        { requestId, friendshipId }
      );
      return result.records[0].get("req").properties;
    } finally {
      await session.close();
    }
  }

  static async acceptFriendRequest(requestId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (s1:Student)-[r:FRIEND_REQUEST]->(s2:Student)
         WHERE r.id = $requestId AND r.status = 'pending'
         SET r.status = 'accepted'
         CREATE (s1)-[:FRIEND]->(s2)
         CREATE (s2)-[:FRIEND]->(s1)
         RETURN r`,
        { requestId }
      );

      if (result.records.length === 0) {
        throw new Error("Solicitud de amistad no encontrada o ya procesada");
      }

      return result.records[0].get("r").properties;
    } finally {
      await session.close();
    }
  }

  // Correcto - buscar solicitudes RECIBIDAS por el estudiante
  static async getPendingRequests(studentId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (from:Student)-[sent:SENT_REQUEST]->(to:Student {id: $studentId})
         WHERE sent.status = 'pending'
         MATCH (req:FriendshipRequest {id: sent.id})
         RETURN req, from`,
        { studentId }
      );
      return result.records.map((record) => ({
        ...record.get("req").properties,
        fromStudent: record.get("from").properties,
      }));
    } finally {
      await session.close();
    }
  }
}

module.exports = FriendshipRequest;
