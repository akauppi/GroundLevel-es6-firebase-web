// jest.config.cjs

module.exports = {
  globalSetup: "./setup.jest.js",

  // needed, otherwise bad things happen -> https://github.com/facebook/jest/issues/7780
  //
  // may also help with speed (2x) -> https://itnext.io/how-to-make-your-sluggish-jest-v23-tests-go-faster-1d4f3388bcdd
  //
  testEnvironment: 'node',

  // Default is 5000. None of our tests take that long; fail fast.
  testTimeout: 2000
};