import { initClient } from '@ts-rest/core';
import { contract } from '@repo/contracts';

export const apiClient = initClient(contract, {
  baseUrl: 'http://localhost:3001',
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});
