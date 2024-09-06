export default {
  preset: "ts-jest",
  testEnvironment: "node", // Set test environment to Node.js
  moduleFileExtensions: ["ts", "js"],
  testMatch: ["**/*.test.ts"], // Looks for test files with the `.test.ts` extension
  transform: {
    "^.+\\.ts$": "ts-jest", // Use ts-jest to transpile TypeScript
  },
};
