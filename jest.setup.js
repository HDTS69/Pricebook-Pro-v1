// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Add any other global setup needed for your tests here
// For example, mocking global APIs like fetch, localStorage, etc.

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