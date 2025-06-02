require("dotenv").config({ path: "../../.env" });
const { getSession, closeDriver } = require("../config/neo4j");

async function initDatabase() {
  const session = getSession();
  try {
    console.log("🚀 Inicializando base de datos Neo4j...");

    // Crear constraint de unicidad para Student.name
    console.log("📋 Creando constraints...");

    try {
      await session.run(`
        CREATE CONSTRAINT student_name_unique IF NOT EXISTS
        FOR (s:Student) REQUIRE s.name IS UNIQUE
      `);
      console.log("✅ Constraint de unicidad para Student.name creado");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Constraint para Student.name ya existe");
      } else {
        throw error;
      }
    }

    // Crear constraint de unicidad para Student.id si existe
    try {
      await session.run(`
        CREATE CONSTRAINT student_id_unique IF NOT EXISTS
        FOR (s:Student) REQUIRE s.id IS UNIQUE
      `);
      console.log("✅ Constraint de unicidad para Student.id creado");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Constraint para Student.id ya existe");
      } else {
        throw error;
      }
    }

    // Listar todas las constraints creadas
    const constraintsResult = await session.run("SHOW CONSTRAINTS");
    console.log("📋 Constraints activas:");
    constraintsResult.records.forEach((record) => {
      const name = record.get("name");
      const type = record.get("type");
      const entityType = record.get("entityType");
      console.log(`  - ${name} (${type} en ${entityType})`);
    });
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
  } finally {
    await session.close();
    await closeDriver();
  }
}

initDatabase();
