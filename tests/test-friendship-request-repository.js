const FriendshipRequestRepository = require("../src/repositories/FriendshipRequestRepository");
const Student = require("../src/models/Student");
const { v4: uuidv4 } = require("uuid");

describe("FriendshipRequestRepository", () => {
  let student1Id, student2Id;

  beforeEach(async () => {
    // Crear estudiantes de prueba
    student1Id = uuidv4();
    student2Id = uuidv4();
    
    await Student.create({
      id: student1Id,
      name: "Test Student 1",
      email: "test1@uptc.edu.co"
    });
    
    await Student.create({
      id: student2Id,
      name: "Test Student 2",
      email: "test2@uptc.edu.co"
    });
  });

  test("should create a friendship request", async () => {
    const request = await FriendshipRequestRepository.createRequest(student1Id, student2Id);
    
    expect(request).toBeTruthy();
    expect(request.sender_id).toBe(student1Id);
    expect(request.receiver_id).toBe(student2Id);
    expect(request.status).toBe("pending");
  });

  test("should accept a friendship request", async () => {
    const request = await FriendshipRequestRepository.createRequest(student1Id, student2Id);
    const acceptedRequest = await FriendshipRequestRepository.acceptRequest(request.id);
    
    expect(acceptedRequest.status).toBe("accepted");
    expect(acceptedRequest.accepted_at).toBeTruthy();
  });

  test("should prevent duplicate requests", async () => {
    await FriendshipRequestRepository.createRequest(student1Id, student2Id);
    const duplicate = await FriendshipRequestRepository.createRequest(student1Id, student2Id);
    
    expect(duplicate).toBeNull();
  });
});