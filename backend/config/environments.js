const environments = {
  development: {
    db: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    app: {
      port: process.env.PORT || 3000,
      env: 'development'
    }
  },
  test: {
    db: {
      url: process.env.DATABASE_URL
    },
    app: {
      port: process.env.PORT || 3001,
      env: 'test'
    }
  },
  production: {
    db: {
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT,
      database: process.env.PROD_DB_NAME,
      user: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
    },
    app: {
      port: process.env.PORT || 3000,
      env: 'production'
    }
  }
};

const getCurrentEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

const getEnvironmentConfig = () => {
  const currentEnv = getCurrentEnvironment();
  return environments[currentEnv];
};

module.exports = {
  getCurrentEnvironment,
  getEnvironmentConfig,
  environments
};