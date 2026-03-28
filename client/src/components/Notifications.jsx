export function Notifications({ items }) {
  if (!items.length) return null;
  return (
    <div className="notifications">
      {items.map(n => (
        <div key={n.id} className={`notif notif-${n.type}`}>{n.text}</div>
      ))}
    </div>
  );
}
