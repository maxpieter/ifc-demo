/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RuntimeLabel } from './models/Label';
import type { Lattice } from './models/Lattice';
import { join as rtJoin, leq as rtLeq } from './models/Lattice';

// Nominal types used throughout UI
export type IfcLabel = {
  ifc: true;
  id: string;
  name: string;
  [extra: string]: unknown;
};
export interface LIO<A = unknown> {
  __ifc: true;
  label: IfcLabel;
  value: A;
}

// IFC builds the lattice at compile time. LUB<"Alice","Bob"> is a type alias for "Alice" | "Bob";
// the compiler treats that union as “Alice ≤ Alice|Bob” and “Bob ≤ Alice|Bob”. That’s perfect when
// you know every principal and relationship while writing code, because TypeScript can enforce the lattice statically.

// Our demo, though, lets users add labels and edges on the fly. There’s no way to feed those
// runtime edits back into TypeScript’s type system—it’s already compiled. The runtime ifc-ts
// helpers (e.g. lub) just return the left operand and don’t maintain any dynamic graph, so they
// can’t “learn” about new edges. That’s why we still rely on the runtime Lattice model and compute
// joins ourselves: the type-level approach can’t adapt after compilation.

// --- Constructors ------------------------------------------------------------

export const mkIfcLabel = (name: string, id?: string): IfcLabel => {
  const actualId = id ?? name.toLowerCase().replace(/\s+/g, '-');
  return { ifc: true, id: actualId, name };
};

export const pure = <A>(label: IfcLabel, value: A): LIO<A> => {
  // if ifc-ts provides a labeled 'pure', delegate; otherwise, LIO wrapper.
  return { __ifc: true, label, value };
};

// --- Combinators -------------------------------------------------------------

export const map = <A, B>(
  fa: LIO<A>,
  f: (a: A) => B
  // label remains the same for map (no new sources)
): LIO<B> => {
  return { __ifc: true, label: fa.label, value: f(fa.value) };
};

export const bind = <A, B>(
  fa: LIO<A>,
  f: (a: A) => LIO<B>,
  // label should join fa.label with the result label
  lat: Lattice,
  toRuntimeId: (lbl: IfcLabel) => string | undefined
): LIO<B> => {
  const fb = f(fa.value);
  const aId = toRuntimeId(fa.label);
  const bId = toRuntimeId(fb.label);
  let outLabel = fb.label;

  if (aId && bId) {
    // runtime fallback join
    const j = rtJoin(lat, aId, bId);
    if (j) {
      const rt = lat.labels[j];
      if (rt) outLabel = mkIfcLabel(rt.name, rt.id);
    }
  }
  return { __ifc: true, label: outLabel, value: fb.value };
};

// --- Lattice operations ------------------------------------------------------

// Prefer ifc-ts if available; else runtime lattice
export const leq = (
  lat: Lattice,
  a: IfcLabel,
  b: IfcLabel,
  toRuntimeId: (lbl: IfcLabel) => string | undefined
): boolean => {
  const aId = toRuntimeId(a);
  const bId = toRuntimeId(b);
  if (!aId || !bId) return false;
  return rtLeq(lat, aId, bId);
};

export const join = (
  lat: Lattice,
  a: IfcLabel,
  b: IfcLabel,
  toRuntimeId: (lbl: IfcLabel) => string | undefined
): IfcLabel | undefined => {
  const aId = toRuntimeId(a);
  const bId = toRuntimeId(b);
  if (!aId || !bId) return undefined;
  const j = rtJoin(lat, aId, bId);
  if (!j) return undefined;
  const rt = lat.labels[j];
  return rt ? mkIfcLabel(rt.name, rt.id) : undefined;
};

// Bridge between runtime labels and ifc labels (for UI → IFC interop)
export const toIfcLabel = (rt: RuntimeLabel): IfcLabel => {
  return mkIfcLabel(rt.name, rt.id);
};
export const fromIfcLabel = (lbl: IfcLabel): string | undefined => {
  if (!lbl) return undefined;
  if (typeof lbl === 'string') return lbl;
  if ('id' in lbl) return (lbl as any).id;
  if ('name' in lbl) {
    return (lbl as any).name.toLowerCase().replace(/\s+/g, '-');
  }
  return undefined;
};
