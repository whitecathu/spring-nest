import { useUser } from '../../contexts/UserContext';
import { BrickBreakerView } from './brickBreaker/BrickBreakerView';
import { useBrickBreakerGame } from './brickBreaker/useBrickBreakerGame';

export default function BrickBreaker({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const game = useBrickBreakerGame();

  return <BrickBreakerView game={game} onBack={onBack} t={t} />;
}
