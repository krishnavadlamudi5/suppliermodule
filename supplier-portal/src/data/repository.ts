import type { PortalCommand } from '../domain/commands';
import type { PortalData } from '../domain/types';

/**
 * Where portal data comes from and where changes go.
 *
 * Today: `createMockRepository()` (sample data, in memory).
 * Later: an HTTP implementation with the same two methods — `load` maps to a
 * GET of the programme, `execute` maps each command type to its endpoint.
 * Screens never talk to the repository directly; they go through the store.
 */
export interface PortalRepository {
  load(): Promise<PortalData>;
  execute(command: PortalCommand): Promise<void>;
}
