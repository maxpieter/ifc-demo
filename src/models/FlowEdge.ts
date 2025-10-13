export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  violation?: boolean;
}
