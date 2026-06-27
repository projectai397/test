import rawConfig from '../../config.json';
import {
  validateMatchConfig,
  type MatchConfig,
  type TeamId,
} from '../types/match-config';

/** Re-read config.json each call so kit colours update on Vite HMR. */
export function loadMatchConfig(): MatchConfig {
  try {
    return validateMatchConfig(rawConfig);
  } catch (err) {
    console.error('[MatchConfig] Invalid config.json — using built-in defaults', err);
    return validateMatchConfig({
      teams: {
        teamA: {
          name: 'Team A',
          kitColor: '#dc2626',
          bowler: { name: 'B Stokes', showCap: true },
          keeper: { name: 'J Smith' },
          fielders: [
            { name: 'Slip', position: 'slip' },
            { name: 'Gully', position: 'gully' },
            { name: 'Point', position: 'point' },
            { name: 'Cover', position: 'cover' },
            { name: 'MidOff', position: 'midOff' },
            { name: 'MidOn', position: 'midOn' },
            { name: 'SquareLeg', position: 'squareLeg' },
            { name: 'FineLeg', position: 'fineLeg' },
            { name: 'ThirdMan', position: 'thirdMan' },
          ],
        },
        teamB: {
          name: 'Team B',
          kitColor: '#2563eb',
          batsman: { name: 'T Blundell' },
          nonStriker: { name: "W O'Rourke" },
        },
      },
      umpire: {
        name: 'Umpire',
        kitColor: '#ffffff',
        showCap: true,
      },
    });
  }
}

export function getTeamKitColor(teamId: TeamId): string {
  const config = loadMatchConfig();
  return config.teams[teamId].kitColor;
}

export type { MatchConfig, TeamId };
