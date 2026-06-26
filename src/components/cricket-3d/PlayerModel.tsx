import { forwardRef } from 'react';
import { GlbPlayerModel, type GlbPlayerModelHandle } from './GlbPlayerModel';
import { getPlayerModelConfig, type PlayerRole } from '../../utils/playerModels';

export type PlayerModelHandle = GlbPlayerModelHandle;
export type { PlayerRole };

interface PlayerModelProps {
  role: PlayerRole;
  jerseyColor?: string;
  showCap?: boolean;
  showBat?: boolean;
  showPads?: boolean;
  showHelmet?: boolean;
  label?: string;
  modelUrl?: string;
}

/** Rigged cricket player GLB per role (see `npm run install:models`). */
export const PlayerModel = forwardRef<PlayerModelHandle, PlayerModelProps>(
  function PlayerModel({ role, jerseyColor, showCap, showBat, label, modelUrl }, ref) {
    const base = getPlayerModelConfig(role, modelUrl);
    const config = {
      ...base,
      ...(jerseyColor ? { color: jerseyColor } : {}),
      ...(showCap !== undefined ? { showCap } : {}),
    };

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
