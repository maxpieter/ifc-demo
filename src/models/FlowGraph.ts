import { FlowNode } from './FlowNode';
import { FlowEdge } from './FlowEdge';

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
export const emptyGraph = (): FlowGraph => ({ nodes: [], edges: [] });