/** AI-generated bowling delivery (Artificial Studio Hunyuan Motion → FBX). */
export const BOWLING_DELIVERY_FBX = '/models/bowling-delivery.fbx';

/**
 * Disabled: Hunyuan FBX includes its own brown mannequin mesh — swapping it in
 * replaces the cricket kit player and looks broken. Use procedural delivery on the GLB instead.
 */
export const USE_AI_BOWLING_FBX = false;

/** Normalized fraction of clip duration when the ball is released (FBX path only). */
export const BOWLING_RELEASE_FRACTION = 0.52;

/** Meshy baseball_pitching (~4s clip) — release at this point in the clip (seconds). */
export const MESHY_BOWL_RELEASE_CLIP_SEC = 0.55;

/** Fallback if clip duration is unknown. */
export const MESHY_BOWL_RELEASE_FRACTION = 0.14;

/** No fade-in on delivery — avoids delaying visible motion. */
export const MESHY_BOWL_FADE_SEC = 0;
