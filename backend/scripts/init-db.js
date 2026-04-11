require("dotenv").config();
const { Client } = require("pg");
const { execSync } = require("child_process");
const logger = require("../utils/logger");

async function initializeDatabase(env = "development") {
  logger.info("Initializing database", { environment: env });

  const config = getConfig(env);

  try {
    // Connect to default postgres database
    const client = new Client({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: "postgres",
    });

    await client.connect();
    logger.info("Connected to postgres default database");

    // Check if database exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [config.db.database]
    );

    if (dbCheck.rows.length === 0) {
      await client.query(`CREATE DATABASE ${config.db.database}`);
      logger.info("Database created", {
        database: config.db.database,
      });
    } else {
      logger.info("Database already exists", {
        database: config.db.database,
      });
    }

    await client.end();

    // Run migrations
    logger.info("Running migrations", { environment: env });
    execSync(`npx sequelize-cli db:migrate --env ${env}`, {
      stdio: "inherit",
    });

    // Run seeders
    try {
      logger.info("Running seeders", { environment: env });
      execSync(`npx sequelize-cli db:seed:all --env ${env}`, {
        stdio: "inherit",
      });
    } catch {
      logger.warn("No seeders found");
    }

    logger.info("Database setup completed", { environment: env });

  } catch (err) {
    logger.error("Database setup failed", {
      environment: env,
      error: err.message,
    });
  }
}


function getConfig(env) {
  const configs = {
    development: {
      db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      },
    },
    production: {
      db: {
        host: process.env.PROD_DB_HOST,
        port: process.env.PROD_DB_PORT,
        database: process.env.PROD_DB_NAME,
        user: process.env.PROD_DB_USER,
        password: process.env.PROD_DB_PASSWORD,
      },
    },
    test: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
  };

  return configs[env];
}

// CLI support
if (require.main === module) {
  const env = process.argv[2] || "development";
  initializeDatabase(env);
}

module.exports = initializeDatabase;
