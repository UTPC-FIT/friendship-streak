require("dotenv").config({ path: "../../.env" });
const Student = require("../models/Student");
const FriendshipService = require("../services/FriendshipService");
const { getSession, closeDriver } = require("../config/neo4j");

async function clearDatabase() {
  const session = getSession();
  try {
    console.log("🧹 Limpiando base de datos Neo4j...");
    await session.run("MATCH (n) DETACH DELETE n");
    console.log("✅ Base de datos Neo4j limpiada");
  } finally {
    await session.close();
  }
}

async function seedDatabase() {
  try {
    // Limpiar antes de crear
    await clearDatabase();

    console.log("🌱 Creando datos de prueba...");

    // Crear estudiantes
    const students = [
      { 
        id: "student-001",
        name: "Ana López", 
        email: "ana@uptc.edu.co",
        code: "201910001"
      },
      { 
        id: "student-002",
        name: "Carlos Martín", 
        email: "carlos@uptc.edu.co",
        code: "201910002"
      },
      { 
        id: "student-003",
        name: "Laura Torres", 
        email: "laura@uptc.edu.co",
        code: "201910003"
      }
    ];

    // Crear estudiantes en Neo4j
    for (const student of students) {
      await Student.create(student);
      console.log(`✅ Estudiante creado: ${student.name} (${student.id})`);
    }

    // Crear amistades
    console.log("👥 Creando amistades...");
    
    try {
      // Ana y Carlos
      const requestId1 = await FriendshipService.sendFriendRequest(
        students[0].id,
        students[1].id
      );
      await FriendshipService.acceptFriendRequest(requestId1);
      console.log(`✅ Amistad creada: ${students[0].name} ↔ ${students[1].name}`);

      // Ana y Laura
      const requestId2 = await FriendshipService.sendFriendRequest(
        students[0].id,
        students[2].id
      );
      await FriendshipService.acceptFriendRequest(requestId2);
      console.log(`✅ Amistad creada: ${students[0].name} ↔ ${students[2].name}`);

    } catch (error) {
      console.warn("⚠️ Error creando algunas amistades:", error.message);
    }

    // Simular rachas
    console.log(" Simulando rachas...");
    try {
      await FriendshipService.updateStreak(students[0].id, students[1].id);
      await FriendshipService.updateStreak(students[0].id, students[2].id);
      console.log("✅ Rachas simuladas");
    } catch (error) {
      console.warn("⚠️ Error simulando rachas:", error.message);
    }

    console.log("\n🎉 Datos de prueba creados exitosamente!");
    console.log(`   👥 ${students.length} estudiantes creados`);
    console.log("   🤝 Amistades establecidas");
    console.log("   🔥 Rachas iniciadas");
    
  } catch (error) {
    console.error("❌ Error creando datos de prueba:", error);
  } finally {
    await closeDriver();
  }
}

// Ejecutar
seedDatabase();