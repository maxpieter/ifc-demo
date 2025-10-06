export type LabelId = string;

export interface RuntimeLabel {
  id: LabelId;
  name: string;
}

export const makeLabel = (name: string): RuntimeLabel => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name
});