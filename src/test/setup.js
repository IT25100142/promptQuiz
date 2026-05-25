import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically clean up DOM trees after each test case
afterEach(() => {
  cleanup();
});
