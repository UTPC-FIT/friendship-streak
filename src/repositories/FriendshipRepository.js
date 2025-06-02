const { getDriver } = require("../config/neo4j");
const { v4: uuidv4 } = require("uuid"); // Para generar IDs únicos
const neo4j = require("neo4j-driver"); // Para acceder a tipos como neo4j.types.Date

/**
 * @typedef {Object} Friendship
 * @property {string} id - ID único de la relación de amistad.
 * @property {string} student1_id - ID del primer estudiante.
 * @property {string} student2_id - ID del segundo estudiante.
 * @property {string} created_at - Fecha de creación de la amistad (ISO string).
 * @property {string | null} last_attendance_date - Última fecha de asistencia conjunta (YYYY-MM-DD).
 * @property {number} streak_count - Conteo actual de la racha.
 */

class FriendshipRepository {
  constructor() {
    this.driver = getDriver();
  }

  /**
   * Crea una nueva relación de amistad entre dos estudiantes y la inicializa.
   * @param {string} student1Id - ID del primer estudiante.
   * @param {string} student2Id - ID del segundo estudiante.
   * @returns {Promise<Friendship>} La relación de amistad creada.
   * @throws {Error} Si la relación ya existe o hay un error en la DB.
   */
  async createFriendship(student1Id, student2Id) {
    const session = this.driver.session();
    try {
      // Asegurarse de que los nodos de estudiantes existan (MERGE los crea si no existen)
      await session.run(`MERGE (:Student {id: $student1Id})`, { student1Id });
      await session.run(`MERGE (:Student {id: $student2Id})`, { student2Id });

      const result = await session.run(
        `MATCH (s1:Student {id: $student1Id}), (s2:Student {id: $student2Id})
                 MERGE (s1)-[f:FRIENDS_WITH]-(s2) // Usar MERGE para evitar duplicados si se llama dos veces
                 ON CREATE SET f.id = $friendshipId,
                               f.created_at = datetime(),
                               f.last_attendance_date = NULL, // O date() si quieres que el día de creación cuente como el primer día
                               f.streak_count = 0 // Inicializamos en 0, se incrementará con la primera asistencia conjunta
                 ON MATCH SET f.id = COALESCE(f.id, $friendshipId) // Asegura que el ID siempre exista si ya existe
                 RETURN f`,
        {
          student1Id,
          student2Id,
          friendshipId: uuidv4(),
        }
      );

      const record = result.records[0];
      if (!record) {
        throw new Error("No se pudo crear o encontrar la relación de amistad.");
      }

      const friendshipProps = record.get("f").properties;
      return this._mapFriendshipProps(friendshipProps, student1Id, student2Id);
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene una relación de amistad por sus IDs de estudiante.
   * @param {string} student1Id - ID del primer estudiante.
   * @param {string} student2Id - ID del segundo estudiante.
   * @returns {Promise<Friendship | null>} La relación de amistad o null si no se encuentra.
   */
  async getFriendshipByStudentIds(student1Id, student2Id) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (s1:Student {id: $student1Id})-[f:FRIENDS_WITH]-(s2:Student {id: $student2Id})
                 RETURN f`,
        { student1Id, student2Id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const friendshipProps = result.records[0].get("f").properties;
      return this._mapFriendshipProps(friendshipProps, student1Id, student2Id);
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene una relación de amistad por su ID.
   * @param {string} friendshipId - ID de la relación de amistad.
   * @returns {Promise<Friendship | null>} La relación de amistad o null si no se encuentra.
   */
  async getFriendshipById(friendshipId) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (s1:Student)-[f:FRIENDS_WITH {id: $friendshipId}]-(s2:Student)
                 RETURN f, s1.id AS student1_id, s2.id AS student2_id`,
        { friendshipId }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const friendshipProps = record.get("f").properties;
      const student1_id = record.get("student1_id");
      const student2_id = record.get("student2_id");

      return this._mapFriendshipProps(
        friendshipProps,
        student1_id,
        student2_id
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Elimina una relación de amistad por su ID.
   * @param {string} friendshipId - ID de la relación de amistad a eliminar.
   * @returns {Promise<boolean>} True si se eliminó, false si no se encontró.
   */
  async deleteFriendship(friendshipId) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH ()-[f:FRIENDS_WITH {id: $friendshipId}]-()
                 DELETE f`,
        { friendshipId }
      );
      return result.summary.counters.relationshipsDeleted > 0;
    } finally {
      await session.close();
    }
  }

  /**
   * Incrementa la racha de una amistad.
   * @param {string} friendshipId - ID de la relación de amistad.
   * @returns {Promise<Friendship | null>} La relación de amistad actualizada o null.
   */
  async incrementStreak(friendshipId) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (s1:Student)-[f:FRIENDS_WITH {id: $friendshipId}]-(s2:Student)
                 SET f.streak_count = COALESCE(f.streak_count, 0) + 1,
                     f.last_attendance_date = date()
                 RETURN f, s1.id AS student1_id, s2.id AS student2_id`,
        { friendshipId }
      );

      if (result.records.length === 0) {
        return null;
      }
      const record = result.records[0];
      const friendshipProps = record.get("f").properties;
      const student1_id = record.get("student1_id");
      const student2_id = record.get("student2_id");
      return this._mapFriendshipProps(
        friendshipProps,
        student1_id,
        student2_id
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Reinicia la racha de una amistad.
   * @param {string} friendshipId - ID de la relación de amistad.
   * @returns {Promise<Friendship | null>} La relación de amistad actualizada o null.
   */
  async resetStreak(friendshipId) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (s1:Student)-[f:FRIENDS_WITH {id: $friendshipId}]-(s2:Student)
                 SET f.streak_count = 1,
                     f.last_attendance_date = date()
                 RETURN f, s1.id AS student1_id, s2.id AS student2_id`,
        { friendshipId }
      );

      if (result.records.length === 0) {
        return null;
      }
      const record = result.records[0];
      const friendshipProps = record.get("f").properties;
      const student1_id = record.get("student1_id");
      const student2_id = record.get("student2_id");
      return this._mapFriendshipProps(
        friendshipProps,
        student1_id,
        student2_id
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Lista todos los amigos de un estudiante.
   * @param {string} studentId - ID del estudiante.
   * @returns {Promise<Array<Object>>} Lista de objetos de amigos (con id y propiedades de racha).
   */
  async getFriendsOfStudent(studentId) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (s:Student {id: $studentId})-[f:FRIENDS_WITH]-(friend:Student)
                 RETURN friend.id AS friend_id, f`,
        { studentId }
      );

      return result.records.map((record) => {
        const friend_id = record.get("friend_id");
        const friendshipProps = record.get("f").properties;
        return {
          friend_id: friend_id,
          friendship_id: friendshipProps.id,
          streak_count: friendshipProps.streak_count,
          last_attendance_date: this._convertNeo4jDateToString(
            friendshipProps.last_attendance_date
          ),
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene el historial de rachas para un estudiante.
   * @param {string} studentId - ID del estudiante.
   * @returns {Promise<Array<Object>>} Historial de rachas.
   */
  async getStudentStreakHistory(studentId) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (s:Student {id: $studentId})-[f:FRIENDS_WITH]-(friend:Student)
                 RETURN f.id AS friendship_id, friend.id AS friend_id, f.streak_count AS streak_count,
                        f.created_at AS start_date, f.last_attendance_date AS last_attendance_date`,
        { studentId }
      );

      return result.records.map((record) => {
        const data = record.toObject();
        // Convertir Neo4j Date/DateTime a string si es necesario
        data.start_date = this._convertNeo4jDateTimeToString(data.start_date);
        data.last_attendance_date = this._convertNeo4jDateToString(
          data.last_attendance_date
        );
        return data;
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene el ranking global de rachas.
   * @param {number} limit - Número máximo de resultados a devolver.
   * @returns {Promise<Array<Object>>} Ranking de rachas.
   */
  async getGlobalStreakRanking(limit = 10) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (s1:Student)-[f:FRIENDS_WITH]->(s2:Student)
                 RETURN f.id AS friendship_id, s1.id AS student1_id, s2.id AS student2_id, f.streak_count AS streak_count
                 ORDER BY f.streak_count DESC
                 LIMIT $limit`,
        { limit: neo4j.int(limit) } // Asegurarse de que el límite sea un entero de Neo4j
      );

      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  /**
   * Mapea las propiedades de una relación Neo4j a un objeto Friendship.
   * @param {Object} props - Propiedades de la relación de Neo4j.
   * @param {string} student1Id - ID del primer estudiante (para consistencia).
   * @param {string} student2Id - ID del segundo estudiante (para consistencia).
   * @returns {Friendship} Objeto Friendship mapeado.
   */
  _mapFriendshipProps(props, student1Id, student2Id) {
    return {
      id: props.id,
      student1_id: student1Id, // Aseguramos que estos IDs estén presentes
      student2_id: student2Id, // Aseguramos que estos IDs estén presentes
      created_at: this._convertNeo4jDateTimeToString(props.created_at),
      last_attendance_date: this._convertNeo4jDateToString(
        props.last_attendance_date
      ),
      streak_count: props.streak_count.toNumber
        ? props.streak_count.toNumber()
        : props.streak_count, // Manejar Neo4j Integer
    };
  }

  /**
   * Convierte un objeto Neo4j Date a una cadena YYYY-MM-DD.
   * @param {neo4j.types.Date | null} neo4jDate - Objeto de fecha de Neo4j.
   * @returns {string | null} Fecha en formato string o null.
   */
  _convertNeo4jDateToString(neo4jDate) {
    if (!neo4jDate) return null;
    // Neo4j Date tiene year, month, day
    return `${neo4jDate.year.low}-${String(neo4jDate.month.low).padStart(
      2,
      "0"
    )}-${String(neo4jDate.day.low).padStart(2, "0")}`;
  }

  /**
   * Convierte un objeto Neo4j DateTime a una cadena ISO.
   * @param {neo4j.types.DateTime | null} neo4jDateTime - Objeto de fecha y hora de Neo4j.
   * @returns {string | null} Fecha y hora en formato ISO string o null.
   */
  _convertNeo4jDateTimeToString(neo4jDateTime) {
    if (!neo4jDateTime) return null;
    // Neo4j DateTime tiene year, month, day, hour, minute, second, nanosecond, timeZoneOffsetSeconds, timeZoneId
    // Construimos una fecha JS a partir de los componentes y la convertimos a ISO
    const {
      year,
      month,
      day,
      hour,
      minute,
      second,
      nanosecond,
      timeZoneOffsetSeconds,
    } = neo4jDateTime;
    const date = new Date(
      year.low,
      month.low - 1, // Meses en JS son de 0-11
      day.low,
      hour.low,
      minute.low,
      second.low,
      nanosecond.low / 1_000_000 // Convertir nanosegundos a milisegundos
    );
    // Si hay un offset de zona horaria, ajustamos para que la fecha sea local o UTC según la necesidad
    // Para ISO string, es mejor trabajar en UTC si los datos son UTC en la DB.
    // Neo4j driver devuelve el DateTime con sus propios campos.
    // A menudo, se prefiere simplemente stringificar los campos de la relación si ya son strings en Cypher.
    // Pero si son objetos de fecha de Neo4j, esta conversión es necesaria.
    return date.toISOString();
  }
  // Dentro de la clase FriendshipRequestRepository
  /**
   * Busca una solicitud de amistad entre dos estudiantes con un estado específico.
   * @param {string} student1Id - ID del primer estudiante (remitente o receptor).
   * @param {string} student2Id - ID del segundo estudiante (remitente o receptor).
   * @param {string} status - Estado de la solicitud (ej. 'pending').
   * @returns {Promise<FriendshipRequest | null>} La solicitud encontrada o null.
   */
  async getRequestBetweenStudents(student1Id, student2Id, status) {
    const session = this.driver.session();
    try {
      // Se busca en ambas direcciones ya que un estudiante puede enviar o recibir la solicitud.
      const result = await session.run(
        `MATCH (s1:Student {id: $student1Id})-[req:SENT_REQUEST {status: $status}]->(s2:Student {id: $student2Id})
             RETURN req, s1.id AS sender_id, s2.id AS receiver_id
             UNION
             MATCH (s2:Student {id: $student2Id})-[req:SENT_REQUEST {status: $status}]->(s1:Student {id: $student1Id})
             RETURN req, s2.id AS sender_id, s1.id AS receiver_id`,
        { student1Id, student2Id, status }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const requestProps = record.get("req").properties;
      const sender_id = record.get("sender_id");
      const receiver_id = record.get("receiver_id");

      return this._mapRequestProps(requestProps, sender_id, receiver_id);
    } finally {
      await session.close();
    }
  }
}

module.exports = new FriendshipRepository();
