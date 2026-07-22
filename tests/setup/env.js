process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-jwt-signing";
process.env.JWT_EXPIRES_IN = "1h";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.CORS_ORIGIN = "http://localhost:5173";
