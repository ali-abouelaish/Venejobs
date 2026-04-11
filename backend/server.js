const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const { execSync } = require("child_process");
const { sequelize } = require("./models");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/job.routes");
const lookupRoutes = require("./routes/lookup.routes");
const projectOptionsRoutes = require("./routes/projectOptions.routes");
const budgetRoutes = require("./routes/budget_types.routes");
const freelancerRoutes = require("./routes/freelancer.routes");
const skillRoutes = require("./routes/skill.routes");
const proposalRoutes = require("./routes/proposal.routes");
const orderRoutes = require("./routes/order.routes");

const {
  getCurrentEnvironment,
  getEnvironmentConfig,
} = require("./config/environments");

const createOrUpdateAdmin = require("./utils/createAdmin");
const initializeProjectOptions = require("./utils/initializeProjectOptions");
const logger = require("./utils/logger");

const app = express();
const config = getEnvironmentConfig();
const PORT = config.app.port;

/* =====================================================
   CORS CONFIG (EXPRESS 5 – FINAL & SAFE)
===================================================== */
const allowedOrigins = [
  "https://venejob.com",
  "https://www.venejob.com",
  "https://app.venejob.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {

      // allow Postman / server-to-server
      if (!origin) return callback(null, true);

      // exact domains
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // allow all vercel previews
      if (typeof origin === "string" && origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(null, false);
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =====================================================
   MIDDLEWARES
===================================================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan(getCurrentEnvironment() === "development" ? "dev" : "combined")
);

app.use("/uploads", express.static("uploads"));

/* =====================================================
   ROUTES
===================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/lookup", lookupRoutes);
app.use("/api/lookup/project-options", projectOptionsRoutes);
app.use("/api/lookup/budget-types", budgetRoutes);
app.use("/api/freelancer", freelancerRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/orders", orderRoutes);

/* =====================================================
   DEFAULT ROUTE
===================================================== */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Venejob Backend API",
    version: "1.0.0",
    status: "operational",
  });
});

/* =====================================================
   SERVER START + DB SETUP
===================================================== */

(async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connected");

    const env = getCurrentEnvironment();

    // ======================
    // DEVELOPMENT
    // ======================
    if (env === "development") {
      logger.info("Running migrations (development)");
      execSync("npx sequelize-cli db:migrate", { stdio: "inherit" });

      if (process.env.RUN_SEEDS === "true") {
        logger.info("Running seeds (development)");
        execSync("npx sequelize-cli db:seed:all", { stdio: "inherit" });
      }
    }

    // ======================
    // TEST
    // ======================
    if (env === "test") {
      logger.info("Running migrations & seeds (test)");
      execSync("npx sequelize-cli db:migrate --env test", { stdio: "inherit" });
      execSync("npx sequelize-cli db:seed:all --env test", {
        stdio: "inherit",
      });
    }

    // ======================
    // PRODUCTION SAFE INIT
    // ======================
    await createOrUpdateAdmin();
    await initializeProjectOptions();

    app.listen(PORT, () => {
      logger.info("Venejob Backend Server started", {
        environment: env,
        port: PORT,
      });
    });
  } catch (err) {
    logger.error("Startup error", err);
    process.exit(1);
  }
})();

