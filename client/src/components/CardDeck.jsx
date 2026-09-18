import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import Card from './Card';

export default function CardDeck({ cards, onSave, onBack }) {
  const [index, setIndex] = useState(0);

  const handlers = useSwipeable({
    onSwipedRight: () => handleSwipe('right'),
    onSwipedLeft: () => handleSwipe('left'),
    trackMouse: true
  });

  const handleSwipe = (direction) => {
    if (direction === 'right') {
      onSave(cards[index]);
    }
    if (index < cards.length - 1) {
      setIndex(index + 1);
    } else {
      onBack();
    }
  };

  const current = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="card-deck">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="card-container" {...handlers}>
        {current && <Card track={current} />}
      </div>

      <div className="controls">
        <button className="btn-skip" onClick={() => handleSwipe('left')}>
          ← Skip
        </button>
        <span className="counter">{index + 1} / {cards.length}</span>
        <button className="btn-save" onClick={() => handleSwipe('right')}>
          Save →
        </button>
      </div>
    </div>
  );
}
