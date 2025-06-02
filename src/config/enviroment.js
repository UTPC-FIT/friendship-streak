import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database configuration
  neo4j: {
    uri: process.env.NEO4J_URI || "bolt://localhost:7687",
    username: process.env.NEO4J_USERNAME || "neo4j",
    password: process.env.NEO4J_PASSWORD || "password",
  },

  // External services
  services: {
    turnsManagement: {
      baseUrl: process.env.TURNS_MANAGEMENT_URL || "http://localhost:3002",
      timeout: 5000,
    },
    userValidation: {
      baseUrl: process.env.USER_VALIDATION_URL || "http://localhost:3003",
      timeout: 3000,
    },
  },

  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },
};

export default config;
