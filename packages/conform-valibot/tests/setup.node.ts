// Node loads the global `FormData` lazily, and the first access is slow. Vitest
// gives every test file a fresh environment, so without this the cost lands on
// the first test of each file and counts against its timeout.
void FormData;
