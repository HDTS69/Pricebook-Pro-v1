/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Setup file for jest-dom
  moduleNameMapper: {
    // Handle module aliases (adjust based on your tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle CSS Modules or other assets if needed
    // '\\.(css|less|scss|sass)$": 'identity-obj-proxy',
  },
  transform: {
    // Use ts-jest for ts/tsx files
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json', // Ensure this points to your TS config
      },
    ],
  },
  // Ignore node_modules, except for specific ESM packages if needed later
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  // Add other Jest options here as needed
}; 