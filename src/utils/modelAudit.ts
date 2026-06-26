import { MODEL_PATHS } from './playerModels';
import { isGlbAvailable } from './modelAvailability';
import { fetchGlbMeta, describeModelProblem } from './glbValidation';

export interface ModelAuditEntry {
  role: string;
  path: string;
  status: 'ok' | 'missing' | 'invalid';
  problem?: string;
}

const ROLES = [
  { role: 'bowler', path: MODEL_PATHS.cricketPlayer },
  { role: 'batter', path: MODEL_PATHS.cricketBatsman },
  { role: 'keeper', path: MODEL_PATHS.cricketKeeper },
];

export async function auditExpectedModels(): Promise<ModelAuditEntry[]> {
  const results: ModelAuditEntry[] = [];
  for (const entry of ROLES) {
    const ok = await isGlbAvailable(entry.path);
    if (!ok) {
      results.push({ ...entry, status: 'missing' });
      continue;
    }
    const meta = await fetchGlbMeta(entry.path);
    const problem = describeModelProblem(meta);
    results.push({
      ...entry,
      status: problem ? 'invalid' : 'ok',
      problem: problem ?? undefined,
    });
  }
  return results;
}

export function logModelAudit(entries: ModelAuditEntry[]) {
  const bad = entries.filter((e) => e.status !== 'ok');
  if (bad.length === 0) {
    console.info('[Cricket3D] Cricket models loaded.');
    return;
  }
  console.error('[Cricket3D] Cricket models invalid or missing.');
  for (const e of bad) {
    console.error(`  ✗ ${e.role}: ${e.path}${e.problem ? ` — ${e.problem}` : ''}`);
  }
  console.error('  → Add SKETCHFAB_API_TOKEN to .env and run: npm run install:models');
}

export function getModelInstallMessage(entries: ModelAuditEntry[]): string | null {
  const bad = entries.filter((e) => e.status !== 'ok');
  if (bad.length === 0) return null;
  const first = bad[0]!;
  return first.problem ?? `Missing model: ${first.path}. Run npm run install:models`;
}
