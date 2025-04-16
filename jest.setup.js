// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Add any additional global setup needed for tests here
// For example, mocking global APIs like fetch, localStorage etc.

// Example: Mock Supabase client globally for tests
// This is a simple mock, you might need to adapt it for your specific needs
global.mockSupabaseClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((callback) => Promise.resolve(callback({ data: null, error: null }))),
  }),
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn(),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'test-url' } }),
  },
  functions: {
    invoke: jest.fn(),
  },
};

// Example: Mock Supabase client globally if needed for most tests
// jest.mock('@/lib/supabase', () => ({
//   supabase: {
//     auth: {
//       getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'mock_token' } }, error: null }),
//       // ... other mock functions ...
//     },
//     functions: {
//       invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
//       // ... other mock functions ...
//     },
//     // ... other mock properties/methods ...
//   },
// })); 