import neo4j from "neo4j-driver";
import config from "./enviroment.js";

const { uri, username, password } = config.neo4j;

let driver;

const initDriver = () => {
  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    console.log("✅ Neo4j driver initialized");
  }
  return driver;
};

const getSession = () => {
  if (!driver) {
    initDriver();
  }
  return driver.session();
};

const closeDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
    console.log("✅ Neo4j driver closed");
  }
};

// Test de conexión
const testConnection = async () => {
  const session = getSession();
  try {
    await session.run("RETURN 1");
    console.log("✅ Neo4j connection successful");
  } catch (error) {
    console.error("❌ Neo4j connection failed:", error.message);
    throw error;
  } finally {
    await session.close();
  }
};

export { initDriver, getSession, closeDriver, testConnection };
