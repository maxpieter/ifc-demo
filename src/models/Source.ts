import { RuntimeLabel } from './Label';
export interface Source<T = unknown> {
  id: string;
  value: T;
  label: RuntimeLabel;
}