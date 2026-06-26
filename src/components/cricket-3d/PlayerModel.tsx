import { forwardRef } from 'react';
import { GlbPlayerModel, type GlbPlayerModelHandle } from './GlbPlayerModel';
import { getPlayerModelConfig, type PlayerRole } from '../../utils/playerModels';

export type PlayerModelHandle = GlbPlayerModelHandle;
export type { PlayerRole };

interface PlayerModelProps {
  role: PlayerRole;
  jerseyColor?: string;
  showBat?: boolean;
  showPads?: boolean;
  showHelmet?: boolean;
  label?: string;
  modelUrl?: string;
}

/** Fully rigged 3D GLB human (Mixamo Soldier + cricket kit). Pass modelUrl for a custom cricket GLB. */
export const PlayerModel = forwardRef<PlayerModelHandle, PlayerModelProps>(
  function PlayerModel({ role, jerseyColor, showBat, label, modelUrl }, ref) {
    const base = getPlayerModelConfig(role, modelUrl);
    const config = jerseyColor ? { ...base, color: jerseyColor } : base;

    return (
      <GlbPlayerModel
        ref={ref}
        role={role}
        label={label}
        showBat={showBat}
        config={config}
      />
    );
  },
);
