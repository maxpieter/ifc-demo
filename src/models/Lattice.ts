import { RuntimeLabel, LabelId } from './Label';

/**
 * A finite, user-defined partial order on labels.
 * Edges are directed: low -> high meaning low ≤ high.
 */
export interface Lattice {
  labels: Record<LabelId, RuntimeLabel>;
  edges: Array<{ from: LabelId; to: LabelId }>;
}

export const emptyLattice = (): Lattice => ({ labels: {}, edges: [] });

export const addLabel = (lat: Lattice, label: RuntimeLabel): Lattice => {
  if (lat.labels[label.id]) return lat;
  return { ...lat, labels: { ...lat.labels, [label.id]: label } };
};

export const addLeq = (lat: Lattice, low: LabelId, high: LabelId): Lattice => {
  if (low === high) return lat;
  const exists = lat.edges.some((e) => e.from === low && e.to === high);
  if (exists) return lat;
  return { ...lat, edges: [...lat.edges, { from: low, to: high }] };
};

// reachability: is a ≤ b ?
export const leq = (lat: Lattice, a: LabelId, b: LabelId): boolean => {
  if (a === b) return true;
  const g: Record<LabelId, LabelId[]> = {};
  for (const id of Object.keys(lat.labels)) g[id] = [];
  for (const e of lat.edges) g[e.from]?.push(e.to);
  const q = [a];
  const seen = new Set<LabelId>([a]);
  while (q.length) {
    const x = q.shift()!;
    for (const y of g[x] || []) {
      if (y === b) return true;
      if (!seen.has(y)) {
        seen.add(y);
        q.push(y);
      }
    }
  }
  return false;
};

// least upper bound (join) if it exists
export const join = (lat: Lattice, a: LabelId, b: LabelId): LabelId | undefined => {
  // upper bounds are labels u s.t. a ≤ u and b ≤ u
  const all = Object.keys(lat.labels);
  const ubs = all.filter((u) => leq(lat, a, u) && leq(lat, b, u));
  // pick minimal among ubs: no v in ubs with v < u
  const minimal: LabelId[] = [];
  for (const u of ubs) {
    const smaller = ubs.some((v) => v !== u && leq(lat, v, u) && !leq(lat, u, v));
    if (!smaller) minimal.push(u);
  }
  // unique minimal upper bound
  if (minimal.length === 1) return minimal[0];
  return undefined; // join doesn't exist or not unique
};
