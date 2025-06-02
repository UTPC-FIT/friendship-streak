const Student = require("../src/models/Student");
const FriendshipService = require("../src/services/FriendshipService");
const { v4: uuidv4 } = require("uuid");

async function testFriendshipSystem() {
  try {
    console.log("🚀 Iniciando pruebas del sistema de amistad...");

    // 1. Crear estudiantes de prueba
    const student1Id = uuidv4();
    const student2Id = uuidv4();

    await Student.create({
      id: student1Id,
      name: "Juan Pérez",
      email: "juan@ejemplo.com",
    });

    await Student.create({
      id: student2Id,
      name: "María García",
      email: "maria@ejemplo.com",
    });

    console.log("✅ Estudiantes creados");

    // 2. Enviar solicitud de amistad
    const requestId = await FriendshipService.sendFriendRequest(
      student1Id,
      student2Id
    );
    console.log("✅ Solicitud de amistad enviada:", requestId);

    // 3. Verificar solicitudes pendientes
    const pendingRequests = await FriendshipService.getPendingRequests(
      student2Id
    );
    console.log("✅ Solicitudes pendientes:", pendingRequests.length);

    // Validar que hay solicitudes pendientes
    if (pendingRequests.length === 0) {
      throw new Error("❌ Error: No se encontraron solicitudes pendientes");
    }

    // 4. Aceptar solicitud
    await FriendshipService.acceptFriendRequest(requestId.id || requestId);
    console.log("✅ Solicitud aceptada");

    // 5. Verificar que son amigos
    const areFriends = await FriendshipService.areFriends(
      student1Id,
      student2Id
    );
    console.log("✅ Son amigos:", areFriends);

    // Validar que son amigos
    if (!areFriends) {
      throw new Error(
        "❌ Error: Los estudiantes no son amigos después de aceptar la solicitud"
      );
    }

    // 6. Actualizar racha
    const today = new Date().toISOString().split("T")[0];
    const streakResult = await FriendshipService.updateStreak(
      student1Id,
      student2Id,
      today
    );
    console.log("✅ Racha actualizada:", streakResult);

    // Validar que la racha se actualizó
    if (!streakResult) {
      throw new Error("❌ Error: La racha no se actualizó correctamente");
    }

    // 7. Obtener amistades
    const friendships = await FriendshipService.getFriendships(student1Id);
    console.log("✅ Amistades obtenidas:", friendships.length);

    // Validar que hay amistades
    if (friendships.length === 0) {
      throw new Error("❌ Error: No se encontraron amistades");
    }

    console.log("🎉 Todas las pruebas pasaron exitosamente!");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error);
  }
}

// Ejecutar las pruebas
testFriendshipSystem();
