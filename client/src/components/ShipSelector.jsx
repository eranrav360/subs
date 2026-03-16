export function ShipSelector({ ships, placedIds, selected, onSelect }) {
  return (
    <div className="ship-selector">
      <h3>בחר ספינה להצבה</h3>
      {ships.map(ship => {
        const placed = placedIds.includes(ship.id);
        const isSelected = selected?.id === ship.id;
        return (
          <div
            key={ship.id}
            className={`ship-item ${placed ? 'ship-placed' : ''} ${isSelected ? 'ship-selected' : ''}`}
            onClick={() => !placed && onSelect(ship)}
          >
            <span className="ship-name">{ship.name}</span>
            <span className="ship-blocks">
              {Array.from({ length: ship.size }, (_, i) => (
                <span key={i} className="ship-block" />
              ))}
            </span>
            {placed && <span className="ship-check">✓</span>}
          </div>
        );
      })}
    </div>
  );
}
