import type { RuntimeLabel } from './Label';

export type NodeKind = 'source' | 'map' | 'combine' | 'sink';

export interface FlowNodeData {
  title: string;
  value?: unknown;
  label: RuntimeLabel;
  note?: string;
  violation?: boolean;
}

export interface FlowNode {
  id: string;
  kind: NodeKind;
  data: FlowNodeData;
  position: { x: number; y: number };
}