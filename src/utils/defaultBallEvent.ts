import type { CricketBallEvent } from '../types/cricket-ball-event';
import type { MatchConfig } from '../types/match-config';

const BASE_EVENT: Omit<CricketBallEvent, 'bowler' | 'striker' | 'non_striker' | 'keeper'> = {
  match_id: 'eng_vs_nz_001',
  status: 'live',
  over: 97,
  ball: 1,
  delivery: {
    line: 'outside_off',
    length: 'good_length',
    bounce: 'normal',
    speed: 134,
  },
  result: {
    runs: 6,
    type: 'six',
    is_wicket: false,
    commentary: 'T Blundell smashes it over long-on!',
  },
};

export function buildDefaultBallEvent(config: MatchConfig): CricketBallEvent {
  const batsman = config.teams.teamB.batsman.name;
  return {
    ...BASE_EVENT,
    bowler: {
      name: config.teams.teamA.bowler.name,
      hand: 'right',
      type: 'medium_fast',
      speed: 134,
    },
    striker: {
      name: batsman,
      hand: 'right',
    },
    non_striker: {
      name: config.teams.teamB.nonStriker.name,
    },
    keeper: {
      name: config.teams.teamA.keeper.name,
    },
    result: {
      ...BASE_EVENT.result,
      commentary: `${batsman} smashes it over long-on!`,
    },
  };
}

/** @deprecated Use buildDefaultBallEvent(loadMatchConfig()) */
export const defaultBallEvent: CricketBallEvent = {
  ...BASE_EVENT,
  bowler: {
    name: 'B Stokes',
    hand: 'right',
    type: 'medium_fast',
    speed: 134,
  },
  striker: {
    name: 'T Blundell',
    hand: 'right',
  },
  non_striker: {
    name: "W O'Rourke",
  },
  keeper: {
    name: 'J Smith',
  },
};
