/**
 * Returns a Map<"r,c", {shipId, seg: 'head'|'mid'|'tail', horizontal}>
 * Used to render ships as shaped submarines.
 */
export function computeSegmentMap(placements) {
  const map = new Map();
  for (const p of placements) {
    const size = p.size;
    for (let i = 0; i < size; i++) {
      const r = p.horizontal ? p.row : p.row + i;
      const c = p.horizontal ? p.col + i : p.col;
      const seg = i === 0 ? 'head' : i === size - 1 ? 'tail' : 'mid';
      map.set(`${r},${c}`, { shipId: p.shipId, seg, horizontal: p.horizontal });
    }
  }
  return map;
}
