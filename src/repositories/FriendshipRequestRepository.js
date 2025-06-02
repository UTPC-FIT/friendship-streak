
const { getDriver } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} FriendshipRequest
 * @property {string} id - ID único de la solicitud de amistad.
 * @property {string} sender_id - ID del estudiante que envía la solicitud.
 * @property {string} receiver_id - ID del estudiante que recibe la solicitud.
 * @property {string} status - Estado de la solicitud ('pending', 'accepted', 'rejected').
 * @property {string} created_at - Fecha de creación de la solicitud (ISO string).
 * @property {string | null} accepted_at - Fecha de aceptación (ISO string).
 * @property {string | null} rejected_at - Fecha de rechazo (ISO string).
 */

class FriendshipRequestRepository {
    constructor() {
        this.driver = getDriver();
    }

    /**
     * Crea una nueva solicitud de amistad.
     * @param {string} senderId - ID del estudiante que envía.
     * @param {string} receiverId - ID del estudiante que recibe.
     * @returns {Promise<FriendshipRequest>} La solicitud de amistad creada.
     * @throws {Error} Si ya existe una solicitud pendiente o son amigos.
     */
    async createRequest(senderId, receiverId) {
        const session = this.driver.session();
        try {
            // Asegurarse de que los nodos de estudiantes existan
            await session.run(`MERGE (:Student {id: $senderId})`, { senderId });
            await session.run(`MERGE (:Student {id: $receiverId})`, { receiverId });

            const result = await session.run(
                `MATCH (s:Student {id: $senderId}), (r:Student {id: $receiverId})
                 // Verificar si ya son amigos
                 OPTIONAL MATCH (s)-[f:FRIENDS_WITH]-(r)
                 // Verificar si ya existe una solicitud pendiente
                 OPTIONAL MATCH (s)-[req:SENT_REQUEST {status: 'pending'}]->(r)
                 WITH s, r, f, req
                 WHERE f IS NULL AND req IS NULL // Solo crear si no hay amistad o solicitud pendiente
                 CREATE (s)-[newReq:SENT_REQUEST {
                     id: $requestId,
                     status: 'pending',
                     created_at: datetime()
                 }]->(r)
                 RETURN newReq`,
                {
                    senderId,
                    receiverId,
                    requestId: uuidv4()
                }
            );

            if (result.records.length === 0) {
                // Esto podría significar que ya existe una relación o solicitud.
                // Es mejor que la lógica de negocio (en el service layer) lo maneje.
                // Aquí solo devolvemos null si no se creó nada.
                return null;
            }

            return this._mapRequestProps(result.records[0].get('newReq').properties, senderId, receiverId);

        } finally {
            await session.close();
        }
    }

    /**
     * Obtiene una solicitud de amistad por su ID.
     * @param {string} requestId - ID de la solicitud.
     * @returns {Promise<FriendshipRequest | null>} La solicitud o null.
     */
    async getRequestById(requestId) {
        const session = this.driver.session();
        try {
            const result = await session.run(
                `MATCH (s:Student)-[req:SENT_REQUEST {id: $requestId}]->(r:Student)
                 RETURN req, s.id AS sender_id, r.id AS receiver_id`,
                { requestId }
            );

            if (result.records.length === 0) {
                return null;
            }

            const record = result.records[0];
            const requestProps = record.get('req').properties;
            const sender_id = record.get('sender_id');
            const receiver_id = record.get('receiver_id');

            return this._mapRequestProps(requestProps, sender_id, receiver_id);
        } finally {
            await session.close();
        }
    }

    /**
     * Actualiza el estado de una solicitud de amistad a 'accepted'.
     * @param {string} requestId - ID de la solicitud.
     * @returns {Promise<FriendshipRequest | null>} La solicitud actualizada o null.
     */
    async acceptRequest(requestId) {
        const session = this.driver.session();
        try {
            const result = await session.run(
                `MATCH (s:Student)-[req:SENT_REQUEST {id: $requestId, status: 'pending'}]->(r:Student)
                 SET req.status = 'accepted',
                     req.accepted_at = datetime()
                 RETURN req, s.id AS sender_id, r.id AS receiver_id`,
                { requestId }
            );

            if (result.records.length === 0) {
                return null; // No se encontró o no estaba pendiente
            }

            const record = result.records[0];
            const requestProps = record.get('req').properties;
            const sender_id = record.get('sender_id');
            const receiver_id = record.get('receiver_id');

            return this._mapRequestProps(requestProps, sender_id, receiver_id);
        } finally {
            await session.close();
        }
    }

    /**
     * Actualiza el estado de una solicitud de amistad a 'rejected'.
     * @param {string} requestId - ID de la solicitud.
     * @returns {Promise<FriendshipRequest | null>} La solicitud actualizada o null.
     */
    async rejectRequest(requestId) {
        const session = this.driver.session();
        try {
            const result = await session.run(
                `MATCH (s:Student)-[req:SENT_REQUEST {id: $requestId, status: 'pending'}]->(r:Student)
                 SET req.status = 'rejected',
                     req.rejected_at = datetime()
                 RETURN req, s.id AS sender_id, r.id AS receiver_id`,
                { requestId }
            );

            if (result.records.length === 0) {
                return null; // No se encontró o no estaba pendiente
            }

            const record = result.records[0];
            const requestProps = record.get('req').properties;
            const sender_id = record.get('sender_id');
            const receiver_id = record.get('receiver_id');

            return this._mapRequestProps(requestProps, sender_id, receiver_id);
        } finally {
            await session.close();
        }
    }

    /**
     * Mapea las propiedades de una relación de solicitud de Neo4j a un objeto FriendshipRequest.
     * @param {Object} props - Propiedades de la relación de Neo4j.
     * @param {string} senderId - ID del estudiante que envía.
     * @param {string} receiverId - ID del estudiante que recibe.
     * @returns {FriendshipRequest} Objeto FriendshipRequest mapeado.
     */
    _mapRequestProps(props, senderId, receiverId) {
        // Helper para convertir Neo4j DateTime a ISO string
        const convertDateTime = (dt) => dt ? new Date(
            dt.year.low, dt.month.low - 1, dt.day.low, dt.hour.low, dt.minute.low, dt.second.low, dt.nanosecond.low / 1_000_000
        ).toISOString() : null;

        return {
            id: props.id,
            sender_id: senderId,
            receiver_id: receiverId,
            status: props.status,
            created_at: convertDateTime(props.created_at),
            accepted_at: convertDateTime(props.accepted_at),
            rejected_at: convertDateTime(props.rejected_at),
        };
    }
}

module.exports = new FriendshipRequestRepository();