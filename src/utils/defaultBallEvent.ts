import type { CricketBallEvent } from '../types/cricket-ball-event';

export const defaultBallEvent: CricketBallEvent = {
  match_id: 'eng_vs_nz_001',
  status: 'live',
  over: 97,
  ball: 1,
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
