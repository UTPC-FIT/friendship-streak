const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

// Importar configuraciones
const logger = require("./config/logger");


// Importar rutas modulares
const friendshipRoutes = require("./routes/friendshipRoutes");
const streakRoutes = require("./routes/streakRoutes");

const app = express();

// Middleware básico
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Rate limiting
// Crear router base para agrupar rutas
const apiRouter = express.Router();

// Aplicar rate limiting solo a las rutas de streak
apiRouter.use(limiter);

// Montar las rutas específicas
apiRouter.use(streakRoutes);

// Montar el router bajo el prefijo común
app.use("/api/streak", apiRouter);

// Montar rutas de amistad
// Handle 404
app.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    timestamp: new Date().toISOString(),
  });
});



// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
