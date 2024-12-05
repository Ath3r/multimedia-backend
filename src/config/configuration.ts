export default () => ({
  PORT: parseInt(process.env.PORT, 10) || 3000,
  JWT: {
    ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET,
  },
  DB: {
    HOST: process.env.DATABASE_HOST,
    PORT: parseInt(process.env.DATABASE_PORT, 10),
    USERNAME: process.env.DATABASE_USERNAME,
    PASSWORD: process.env.DATABASE_PASSWORD,
    NAME: process.env.DATABASE_NAME,
  },
});
