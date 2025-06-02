require("dotenv").config({ path: "../../.env" });
const { getSession, closeDriver } = require("../config/neo4j");

async function clearDatabase() {
  const session = getSession();
  try {
    console.log("🧹 Limpiando toda la base de datos...");

    // Eliminar todas las relaciones y nodos
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("✅ Base de datos completamente limpiada");
  } catch (error) {
    console.error("❌ Error limpiando la base de datos:", error);
  } finally {
    await session.close();
    await closeDriver();
  }
}

clearDatabase();
