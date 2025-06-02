require("dotenv").config({ path: "../../.env" });
const { getSession, closeDriver } = require("../config/neo4j");

async function checkDuplicates() {
  const session = getSession();
  try {
    console.log("🔍 Verificando duplicados...");

    // Verificar constraints existentes
    const constraintsResult = await session.run("SHOW CONSTRAINTS");
    console.log("📋 Constraints activas:");
    constraintsResult.records.forEach((record) => {
      console.log(`  - ${record.get("name")}`);
    });

    // Buscar estudiantes con nombres duplicados
    const result = await session.run(`
      MATCH (s:Student)
      WITH s.name as name, collect(s) as students
      WHERE size(students) > 1
      RETURN name, size(students) as count
      ORDER BY count DESC
    `);

    if (result.records.length > 0) {
      console.log("⚠️  Estudiantes duplicados encontrados:");
      result.records.forEach((record) => {
        console.log(
          `  - ${record.get("name")}: ${record.get("count")} duplicados`
        );
      });
    } else {
      console.log("✅ No se encontraron duplicados");
    }
  } catch (error) {
    console.error("❌ Error verificando duplicados:", error);
  } finally {
    await session.close();
    await closeDriver();
  }
}

checkDuplicates();
