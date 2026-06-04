// Global test setup — runs before every test file.
// Keep this minimal; heavy mocks go in each test file via vi.mock().

// Silence console.error in tests unless TEST_VERBOSE=1 is set.
if (!process.env.TEST_VERBOSE) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
}
