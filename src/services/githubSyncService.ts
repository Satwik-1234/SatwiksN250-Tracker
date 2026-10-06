import { FuelLog, Trip, ServiceLog, AccessoryGear, ChainLubeRecord } from '@/types/fuel';

/**
 * Client wrapper for POST /api/sync/github — commits data/*.json + exports/*.csv
 * to the GitHub repo (server-side, GITHUB_TOKEN never reaches the browser).
 */

export interface GitHubSyncResult {
  success: boolean;
  message: string;
  url?: string;
  sha?: string;
  counts?: Record<string, number>;
}

export interface GitHubSyncEntities {
  fuelLogs: FuelLog[];
  trips: Trip[];
  services: ServiceLog[];
  accessories: AccessoryGear[];
  chainLube: ChainLubeRecord | null;
}

export async function pushLogsToGitHub(entities: GitHubSyncEntities): Promise<GitHubSyncResult> {
  try {
    const res = await fetch('/api/sync/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entities }),
    });

    const json = await res.json().catch(() => null);

    if (res.ok && json?.success) {
      const c = json.counts || {};
      return {
        success: true,
        message: `Committed ${c.fuelLogs ?? 0} fuels, ${c.trips ?? 0} trips, ${c.services ?? 0} services, ${c.accessories ?? 0} accessories to GitHub`,
        url: json.url,
        sha: json.sha,
        counts: json.counts,
      };
    }

    return {
      success: false,
      message: json?.error || `GitHub sync failed (HTTP ${res.status})`,
    };
  } catch (err) {
    return {
      success: false,
      message: 'GitHub sync failed: ' + (err instanceof Error ? err.message : String(err)),
    };
  }
}
