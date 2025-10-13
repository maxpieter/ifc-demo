/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RuntimeLabel } from './models/Label';
import type { Lattice } from './models/Lattice';
import { join as rtJoin, leq as rtLeq } from './models/Lattice';

// Import everything from ifc-ts (names may vary by version)
// Quickstart shows `label` + `type Label` exist. We defensively probe.
import * as IFC from 'ifc-ts';

// Nominal types used throughout UI
export type IfcLabel = any; // from IFC, but dynamic in UI
export interface LIO<A = unknown> { __ifc: true; label: IfcLabel; value: A }

// --- Constructors ------------------------------------------------------------

const withRuntimeMetadata = (label: IfcLabel, id: string, name: string): IfcLabel => {
  if (label && typeof label === 'object') {
    Object.assign(label as Record<string, unknown>, { ifc: true, id, name });
    return label;
  }
  return { ifc: true, id, name };
};

export const mkIfcLabel = (name: string, id?: string): IfcLabel => {
  const actualId = id ?? name.toLowerCase().replace(/\s+/g, '-');
  if ((IFC as any).label) {
    try {
      const lbl = (IFC as any).label(name);
      return withRuntimeMetadata(lbl, actualId, name);
    } catch { /* fall through */ }
  }
  return { ifc: true, id: actualId, name };
};

export const pure = <A>(label: IfcLabel, value: A): LIO<A> => {
  // if ifc-ts provides a labeled 'pure', delegate; otherwise, LIO wrapper.
  const hasPure = (IFC as any).pure || (IFC as any).of || (IFC as any).return;
  if (hasPure) {
    try {
      const p = (hasPure as any)(label, value);
      return { __ifc: true, label, value } as LIO<A>;
    } catch { /* fall through */ }
  }
  return { __ifc: true, label, value };
};

// --- Combinators -------------------------------------------------------------

export const map = <A, B>(
  fa: LIO<A>,
  f: (a: A) => B,
  // label remains the same for map (no new sources)
): LIO<B> => {
  const hasMap = (IFC as any).map;
  if (hasMap) {
    try { return { __ifc: true, label: fa.label, value: f(fa.value) }; } catch {}
  }
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

  const hasBind = (IFC as any).bind || (IFC as any).chain || (IFC as any).flatMap;
  if (hasBind) {
    try { /* would use IFC combinator if exposed; we keep wrapper consistent */ } catch {}
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
  const hasLeq = (IFC as any).leq || (IFC as any).le;
  if (hasLeq) {
    try { return (hasLeq as any)(a, b); } catch { /* fall back */ }
  }
  const aId = toRuntimeId(a); const bId = toRuntimeId(b);
  if (!aId || !bId) return false;
  return rtLeq(lat, aId, bId);
};

export const join = (
  lat: Lattice,
  a: IfcLabel,
  b: IfcLabel,
  toRuntimeId: (lbl: IfcLabel) => string | undefined
): IfcLabel | undefined => {
  const computeFallback = () => {
    const aId = toRuntimeId(a);
    const bId = toRuntimeId(b);
    if (!aId || !bId) return undefined;
    const j = rtJoin(lat, aId, bId);
    if (!j) return undefined;
    const rt = lat.labels[j];
    return rt ? mkIfcLabel(rt.name, rt.id) : undefined;
  };

  const fallbackLabel = computeFallback();

// IFC builds the lattice at compile time. LUB<"Alice","Bob"> is a type alias for "Alice" | "Bob"; 
// the compiler treats that union as “Alice ≤ Alice|Bob” and “Bob ≤ Alice|Bob”. That’s perfect when 
// you know every principal and relationship while writing code, because TypeScript can enforce the lattice statically.

// Our demo, though, lets users add labels and edges on the fly. There’s no way to feed those 
// runtime edits back into TypeScript’s type system—it’s already compiled. The runtime ifc-ts 
// helpers (e.g. lub) just return the left operand and don’t maintain any dynamic graph, so they 
// can’t “learn” about new edges. That’s why we still rely on the runtime Lattice model and compute 
// joins ourselves: the type-level approach can’t adapt after compilation.

  const hasJoin = (IFC as any).join || (IFC as any).lub;
  if (hasJoin) {
    try {
      const result = (hasJoin as any)(a, b);
      if (fallbackLabel) return fallbackLabel;

      const resId = toRuntimeId(result);
      if (resId) {
        const rt = lat.labels[resId];
        if (rt) return mkIfcLabel(rt.name, rt.id);
      }
      return result;
    } catch { /* fall through to fallback */ }
  }

  return fallbackLabel;
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
