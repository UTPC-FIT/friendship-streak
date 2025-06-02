require("dotenv").config({ path: "../../.env" });
const { getSession, closeDriver } = require("../config/neo4j");
const FriendshipService = require("../services/FriendshipService");

async function queryData() {
  const session = getSession();
  try {
    console.log("📊 Consultando datos de la base de datos...\n");

    // 1. Ver todos los estudiantes
    const studentsResult = await session.run("MATCH (s:Student) RETURN s");
    console.log("👥 Estudiantes:");
    studentsResult.records.forEach((record) => {
      const student = record.get("s").properties;
      console.log(`  - ${student.name} (${student.email})`);
    });

    // 2. Ver todas las amistades
    const friendshipsResult = await session.run(`
            MATCH (s1:Student)-[f:FRIENDS_WITH]->(s2:Student) 
            RETURN s1.name as student1, s2.name as student2, f.streak_count, f.last_attendance_date
            ORDER BY f.streak_count DESC
        `);
    console.log("\n🤝 Amistades:");
    friendshipsResult.records.forEach((record) => {
      console.log(
        `  - ${record.get("student1")} ↔ ${record.get(
          "student2"
        )} | Racha: ${record.get("f.streak_count")} días`
      );
    });

    // 3. Ver solicitudes
    const requestsResult = await session.run(`
            MATCH (req:FriendshipRequest) 
            RETURN req.status, count(*) as total
        `);
    console.log("\n📋 Solicitudes de amistad:");
    requestsResult.records.forEach((record) => {
      console.log(
        `  - ${record.get("req.status")}: ${record.get("total")} solicitudes`
      );
    });

    console.log("\n✅ Consulta completada");
  } catch (error) {
    console.error("❌ Error consultando datos:", error);
  } finally {
    await session.close();
    await closeDriver();
  }
}

queryData();
