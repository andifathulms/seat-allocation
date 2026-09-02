/**
 * Engine types. This module — and every module under src/engine — imports
 * nothing. No React, no D3, no DOM, no Date, no Math.random.
 */

export type PartyId = string;

export interface Party {
  id: PartyId;
  /** nomor urut, 1..18 */
  ballotNumber: number;
  shortName: string;
  fullName: string;
  /** hex, owned by the data rather than by CSS */
  color: string;
  nationalVotes: number;
}

export interface Dapil {
  /** e.g. "JABAR-1" */
  code: string;
  /** e.g. "Jawa Barat I" */
  name: string;
  province: string;
  /** seats, 3..10 */
  magnitude: number;
  votes: Record<PartyId, number>;
}

export type DivisorRule =
  | 'sainte-lague'
  | 'dhondt'
  | 'modified-sainte-lague'
  | 'hare-quota';

export type ThresholdScope = 'national' | 'dapil' | 'none';

export type Geography = 'dapil' | 'national-pool';

export interface RuleSet {
  /** fraction, not percent: 0..0.10 */
  threshold: number;
  thresholdScope: ThresholdScope;
  divisor: DivisorRule;
  geography: Geography;
}

export interface QuotientCell {
  party: PartyId;
  quotient: number;
  divisor: number;
}

export interface SeatAward {
  /** 1..magnitude, the order in which the seat was claimed */
  ordinal: number;
  winner: PartyId;
  quotient: number;
  /** complete quotient state at the moment this seat was awarded */
  table: QuotientCell[];
  /** parties that shared the winning quotient exactly, winner included */
  tied: PartyId[] | null;
  /**
   * Divisor rules produce one phase. Hare quota produces two: seats from the
   * whole part of each party's quota, then seats from the largest remainders.
   */
  phase: 'divisor' | 'quota' | 'remainder';
}

export interface DapilResult {
  dapil: string;
  seats: Record<PartyId, number>;
  trace: SeatAward[];
  /** parties removed here by the threshold, whatever their vote in this dapil */
  eliminated: PartyId[];
}

export interface Metrics {
  totalSeats: number;
  totalValidVotes: number;
  /** valid votes cast for parties holding zero seats */
  unconvertedVotes: number;
  unconvertedShare: number;
  gallagher: number;
  loosemoreHanby: number;
  enpVotes: number;
  enpSeats: number;
  /** share of the vote and of the chamber, per party */
  shares: Record<PartyId, { voteShare: number; seatShare: number }>;
}

export interface Allocation {
  qualifying: PartyId[];
  eliminated: PartyId[];
  byDapil: DapilResult[];
  seatsByParty: Record<PartyId, number>;
  metrics: Metrics;
  /** every dapil in which an exact quotient tie had to be resolved */
  ties: Array<{ dapil: string; ordinal: number; parties: PartyId[] }>;
}

export interface AllocateOptions {
  /**
   * Retaining the full quotient table for every seat costs roughly 15,000 small
   * objects. The Cascade view needs it; a slider drag does not.
   */
  trace?: boolean;
}
