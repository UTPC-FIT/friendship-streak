require("dotenv").config({ path: "../../.env" });

const BASE_URL = "http://localhost:3001/api/streak";

// Token de prueba (necesitarás uno válido de Keycloak)
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || "your-test-token-here";

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${TEST_TOKEN}`
};

async function testEndpoint(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    console.log(`\n🔍 Testing ${method} ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success (${response.status}):`, JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ Error (${response.status}):`, JSON.stringify(result, null, 2));
    }
    
    return result;
  } catch (error) {
    console.log(`❌ Request failed:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log("🧪 Iniciando pruebas de endpoints...\n");
  
  // Test Health Check
  await testEndpoint("GET", "/health");
  
  // Test Friendships
  await testEndpoint("GET", "/friendships/student-001");
  
  // Test Create Friendship
  await testEndpoint("POST", "/friendships", {
    userId1: "student-003",
    userId2: "student-004"
  });
  
  // Test Streaks
  await testEndpoint("GET", "/streaks/student-001/student-002");
  
  // Test Analytics
  await testEndpoint("GET", "/analytics/student-001");
  
  // Test Update Streak
  await testEndpoint("POST", "/streaks/update", {
    userId1: "student-001",
    userId2: "student-002",
    date: new Date().toISOString().split("T")[0]
  });
  
  console.log("\n🎯 Pruebas completadas!");
}

runTests();