export type FieldPositionPreset =
  | 'slip'
  | 'gully'
  | 'point'
  | 'cover'
  | 'midOff'
  | 'midOn'
  | 'squareLeg'
  | 'fineLeg'
  | 'thirdMan';

export type UmpireFacingPreset = 'squareLeg';

export interface FielderConfig {
  name: string;
  position: FieldPositionPreset | string;
  x?: number;
  z?: number;
  facing?: number;
}

export interface TeamAConfig {
  name: string;
  kitColor: string;
  bowler: { name: string; showCap?: boolean };
  keeper: { name: string };
  fielders: FielderConfig[];
}

export interface TeamBConfig {
  name: string;
  kitColor: string;
  batsman: { name: string };
  nonStriker: { name: string };
}

export interface UmpireConfig {
  name: string;
  position: { x: number; y: number; z: number };
  facing: UmpireFacingPreset;
}

export interface MatchConfig {
  teams: {
    teamA: TeamAConfig;
    teamB: TeamBConfig;
  };
  umpire: UmpireConfig;
}

export type TeamId = 'teamA' | 'teamB';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const FIELDER_PRESETS: FieldPositionPreset[] = [
  'slip',
  'gully',
  'point',
  'cover',
  'midOff',
  'midOn',
  'squareLeg',
  'fineLeg',
  'thirdMan',
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function requireString(obj: Record<string, unknown>, key: string, path: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Match config: ${path}.${key} must be a non-empty string`);
  }
  return v;
}

function requireHexColor(obj: Record<string, unknown>, key: string, path: string): string {
  const v = requireString(obj, key, path);
  if (!HEX_COLOR.test(v)) {
    throw new Error(`Match config: ${path}.${key} must be a hex color (e.g. #dc2626)`);
  }
  return v;
}

function validateFielder(raw: unknown, index: number): FielderConfig {
  if (!isRecord(raw)) {
    throw new Error(`Match config: teams.teamA.fielders[${index}] must be an object`);
  }
  const name = requireString(raw, 'name', `teams.teamA.fielders[${index}]`);
  const position = requireString(raw, 'position', `teams.teamA.fielders[${index}]`);
  const entry: FielderConfig = { name, position };
  if (raw.x !== undefined) {
    if (typeof raw.x !== 'number') throw new Error(`Match config: fielders[${index}].x must be a number`);
    entry.x = raw.x;
  }
  if (raw.z !== undefined) {
    if (typeof raw.z !== 'number') throw new Error(`Match config: fielders[${index}].z must be a number`);
    entry.z = raw.z;
  }
  if (raw.facing !== undefined) {
    if (typeof raw.facing !== 'number') {
      throw new Error(`Match config: fielders[${index}].facing must be a number`);
    }
    entry.facing = raw.facing;
  }
  return entry;
}

export function validateMatchConfig(raw: unknown): MatchConfig {
  if (!isRecord(raw)) throw new Error('Match config: root must be an object');
  if (!isRecord(raw.teams)) throw new Error('Match config: teams is required');

  const teamA = raw.teams.teamA;
  const teamB = raw.teams.teamB;
  if (!isRecord(teamA)) throw new Error('Match config: teams.teamA is required');
  if (!isRecord(teamB)) throw new Error('Match config: teams.teamB is required');

  if (!isRecord(teamA.bowler)) throw new Error('Match config: teams.teamA.bowler is required');
  if (!isRecord(teamA.keeper)) throw new Error('Match config: teams.teamA.keeper is required');
  if (!Array.isArray(teamA.fielders)) throw new Error('Match config: teams.teamA.fielders must be an array');
  if (teamA.fielders.length !== 9) {
    throw new Error(`Match config: teams.teamA.fielders must have exactly 9 entries (got ${teamA.fielders.length})`);
  }

  if (!isRecord(teamB.batsman)) throw new Error('Match config: teams.teamB.batsman is required');
  if (!isRecord(teamB.nonStriker)) throw new Error('Match config: teams.teamB.nonStriker is required');
  if (!isRecord(raw.umpire)) throw new Error('Match config: umpire is required');

  const umpirePos = raw.umpire.position;
  if (!isRecord(umpirePos)) throw new Error('Match config: umpire.position is required');

  const config: MatchConfig = {
    teams: {
      teamA: {
        name: requireString(teamA, 'name', 'teams.teamA'),
        kitColor: requireHexColor(teamA, 'kitColor', 'teams.teamA'),
        bowler: {
          name: requireString(teamA.bowler, 'name', 'teams.teamA.bowler'),
          showCap: teamA.bowler.showCap === true,
        },
        keeper: {
          name: requireString(teamA.keeper, 'name', 'teams.teamA.keeper'),
        },
        fielders: teamA.fielders.map((f, i) => validateFielder(f, i)),
      },
      teamB: {
        name: requireString(teamB, 'name', 'teams.teamB'),
        kitColor: requireHexColor(teamB, 'kitColor', 'teams.teamB'),
        batsman: {
          name: requireString(teamB.batsman, 'name', 'teams.teamB.batsman'),
        },
        nonStriker: {
          name: requireString(teamB.nonStriker, 'name', 'teams.teamB.nonStriker'),
        },
      },
    },
    umpire: {
      name: requireString(raw.umpire, 'name', 'umpire'),
      position: {
        x: typeof umpirePos.x === 'number' ? umpirePos.x : 8,
        y: typeof umpirePos.y === 'number' ? umpirePos.y : 0,
        z: typeof umpirePos.z === 'number' ? umpirePos.z : -3.4,
      },
      facing: 'squareLeg',
    },
  };

  return config;
}

export function isFieldPositionPreset(value: string): value is FieldPositionPreset {
  return (FIELDER_PRESETS as string[]).includes(value);
}
