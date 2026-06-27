import { Environment } from '@react-three/drei';
import { OvalStadium } from './stadium/OvalStadium';

export function StadiumEnvironment() {
  return (
    <>
      <Environment preset="park" environmentIntensity={0.3} />
      <OvalStadium />
    </>
  );
}
