import type { PortalCommand } from '../domain/commands';
import type { PortalData } from '../domain/types';
import type { PortalRepository } from './repository';

/**
 * Repository backed by the portal API (server/index.ts → MongoDB).
 * In development Vite proxies /api to the API server, so the base URL is relative.
 */
export function createHttpRepository(baseUrl = '/api'): PortalRepository {
  const fail = async (res: Response, what: string) => {
    let detail = '';
    try {
      detail = (await res.json()).error ?? '';
    } catch {
      /* not JSON */
    }
    // 502-504 come from the dev proxy or a gateway when the API itself is down
    if (res.status >= 502 && res.status <= 504) throw new Error('The server could not be reached. Check your connection and try again.');
    throw new Error(`${what} failed${detail ? `: ${detail}` : ` (error ${res.status})`}`);
  };

  return {
    async load() {
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/programme`);
      } catch {
        throw new Error('Could not reach the portal API. Is the server running? (npm run dev)');
      }
      if (!res.ok) await fail(res, 'Loading the programme');
      return (await res.json()) as PortalData;
    },

    async execute(command: PortalCommand) {
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(command),
        });
      } catch {
        throw new Error('The server could not be reached. Check your connection and try again.');
      }
      if (!res.ok) await fail(res, 'Saving the change');
    },
  };
}
