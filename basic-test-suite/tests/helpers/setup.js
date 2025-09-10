// Test setup and global configurations
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides
});

global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  };
  return res;
};

// Environment setup
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mock://test';
process.env.API_KEY = process.env.API_KEY || 'test-api-key';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';