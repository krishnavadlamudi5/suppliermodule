import { applyCommand } from '@shared/domain/commands';
import type { PortalCommand } from '@shared/domain/commands';
import type { PortalData } from '@shared/domain/types';
import { createSampleData } from '@shared/fixtures/sampleData';
import type { PortalRepository } from './repository';

interface MockOptions {
  /** Simulated network delay in ms (default 0) */
  latency?: number;
  /** Starting data (default: the prototype's sample data) */
  seed?: () => PortalData;
}

/**
 * In-memory repository. Holds its own copy of the data, as a server would,
 * and applies commands with the same reducer the store uses.
 * Data resets on page reload.
 */
export function createMockRepository({ latency = 0, seed = createSampleData }: MockOptions = {}): PortalRepository {
  let server = seed();
  const wait = () => (latency ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());

  return {
    async load() {
      await wait();
      return structuredClone(server);
    },
    async execute(command: PortalCommand) {
      await wait();
      server = applyCommand(server, command);
    },
  };
}
