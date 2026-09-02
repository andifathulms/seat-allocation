import type { Dapil, Party } from '../engine/types';

export type Provenance = 'certified' | 'synthetic';

export interface SourceRef {
  title: string;
  publisher: string;
  date: string;
  url: string;
  note?: string;
}

export interface PartiesFile {
  election: string;
  provenance: Provenance;
  totalValidVotes: number;
  source: SourceRef;
  parties: Party[];
}

export interface DapilFile {
  election: string;
  provenance: Provenance;
  provenanceNote?: string;
  totalSeats: number;
  dapil: Dapil[];
}

export interface OfficialFile {
  election: string;
  provenance: Provenance;
  totalSeats: number;
  source: SourceRef;
  seatsByParty: Record<string, number>;
  /** null until the certified per-dapil allocation has been extracted */
  byDapil: Record<string, Record<string, number>> | null;
  byDapilNote?: string;
}

export interface RuleCitation {
  id: string;
  document: string;
  pasal: string;
  text: string;
  summary: string;
}

export interface FigureCitation {
  id: string;
  document: string;
  label: string;
  value: number;
}

export interface RulesFile {
  election: string;
  provenance: Provenance;
  documents: Record<string, SourceRef>;
  rules: RuleCitation[];
  figures: FigureCitation[];
}

export interface Dataset {
  parties: PartiesFile;
  dapil: DapilFile;
  official: OfficialFile;
  rules: RulesFile;
}
