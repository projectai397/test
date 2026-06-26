export type ConnectionStatus = 'live' | 'reconnecting' | 'offline';

export type AnimationState =
  | 'idle'
  | 'waiting_for_ball'
  | 'bowler_runup'
  | 'bowling_action'
  | 'ball_released'
  | 'batter_shot'
  | 'result_animation'
  | 'reset'
  | 'completed';

export type CameraMode =
  | 'broadcast'
  | 'track_bowler'
  | 'track_ball'
  | 'track_shot'
  | 'follow_six'
  | 'follow_four'
  | 'wicket_zoom'
  | 'reset';

export type DeliveryLine =
  | 'outside_off'
  | 'off_stump'
  | 'middle'
  | 'leg_stump'
  | 'wide';

export type DeliveryLength =
  | 'yorker'
  | 'full'
  | 'good_length'
  | 'short'
  | 'bouncer';

export type DeliveryBounce = 'normal' | 'low' | 'high';

export type BowlerType = 'fast' | 'medium_fast' | 'medium' | 'spin';

export type ResultType =
  | 'six'
  | 'four'
  | 'dot'
  | 'one'
  | 'two'
  | 'three'
  | 'wicket';

export interface PlayerInfo {
  name: string;
  hand?: 'left' | 'right';
}

export interface BowlerInfo extends PlayerInfo {
  hand: 'left' | 'right';
  type: BowlerType;
  speed: number;
}

export interface DeliveryInfo {
  line: DeliveryLine;
  length: DeliveryLength;
  bounce: DeliveryBounce;
  speed: number;
}

export interface ResultInfo {
  runs: number;
  type: ResultType;
  is_wicket: boolean;
  commentary?: string;
  dismissal?: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped';
}

export interface CricketBallEvent {
  match_id: string;
  status: string;
  over: number;
  ball: number;
  bowler: BowlerInfo;
  striker: PlayerInfo;
  non_striker: PlayerInfo;
  keeper: PlayerInfo;
  delivery: DeliveryInfo;
  result: ResultInfo;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TrajectoryPoint extends Vec3 {
  t: number;
}

export interface DeliveryAnimationParams {
  lineOffsetZ: number;
  bounceDistance: number;
  bounceHeight: number;
  flightDuration: number;
  swingAmount: number;
  releasePoint: Vec3;
  contactPoint: Vec3;
}

export interface ShotAnimationParams {
  resultType: ResultType;
  runs: number;
  isWicket: boolean;
  dismissal?: ResultInfo['dismissal'];
  postContactPoints: TrajectoryPoint[];
  contactTime: number;
}

export function getEventKey(event: CricketBallEvent): string {
  return `${event.match_id}:${event.over}:${event.ball}`;
}

export function normalizeResult(result?: Partial<ResultInfo> | null): ResultInfo {
  // v1: every delivery plays as a SIX
  return {
    runs: 6,
    type: 'six',
    is_wicket: false,
    commentary: result?.commentary ?? 'Huge six!',
  };
}
