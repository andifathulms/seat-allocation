import { useEffect, useMemo, useState } from 'react';
import { S } from './copy/strings.id';
import { loadDataset } from './data/load';
import { pickDefaultDapil } from './data/defaultDapil';
import { reproduce, type Reproduction } from './data/reproduction';
import type { Dataset } from './data/schema';
import { isDefault, THRESHOLD_MAX } from './state/rules';
import { decompose } from './engine/decompose';
import { ledger } from './engine/transfers';
import { thresholdResponse } from './engine/response';
import { useAllocation } from './state/useAllocation';
import { count, decimal, percent } from './ui/format';
import { Archipelago } from './views/Archipelago/Archipelago';
import { Cascade } from './views/Cascade/Cascade';
import { Chamber } from './views/Chamber/Chamber';
import { Colophon } from './ui/Colophon';
import { Legend } from './ui/Legend';
import { Masthead } from './ui/Masthead';
import { Premise } from './ui/Premise';
import { Decomposition } from './ui/Decomposition';
import { Response } from './views/Response/Response';
import { MetricStrip } from './ui/MetricStrip';
import { Rail, type RailSection } from './ui/Rail';
import { Section } from './ui/Section';
import { TableView } from './ui/TableView';
import { Transport } from './ui/Transport';
import { Proportionality } from './views/Proportionality/Proportionality';
import { VoteBar } from './views/VoteBar/VoteBar';
import './app.css';

const SECTIONS: readonly RailSection[] = [
  { id: 'ruang-sidang', label: S.chamber },
  { id: 'angka-ringkas', label: S.metrics },
  { id: 'rentang', label: S.responseShort },
  { id: 'dua-aturan', label: S.decompositionShort },
  { id: 'suara-sah', label: S.voteBar },
  { id: 'dapil', label: S.archipelago },
  { id: 'langkah', label: S.cascadeShort },
  { id: 'pangsa', label: S.proportionalityShort },
];

export function App() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDataset(import.meta.env.BASE_URL)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) {
    return (
      <main className="page state">
        <p className="verification verification--failed">
          {S.loadFailed} {error}
        </p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="page state">
        <p className="small">{S.loading}</p>
      </main>
    );
  }
  return <Loaded data={data} />;
}

/** A party's short name by id, for tables that carry ids rather than parties. */
function short(parties: readonly Dataset['parties']['parties'][number][], id: string): string {
  return parties.find((p) => p.id === id)?.shortName ?? id;
}

function Loaded({ data }: { data: Dataset }) {
  const [reproduction] = useState<Reproduction>(() => reproduce(data));
  const { rules, setRules, allocation } = useAllocation(data);

  /**
   * Four extra engine passes. They depend on the rules but not on the threshold
   * while it is being dragged past values that change nothing, so this is memo'd
   * on the rule set rather than recomputed per frame — the scrubber's budget in
   * PRD §6.5 covers one pass, not five.
   */
  const decomposition = useMemo(
    () => decompose(data.parties.parties, data.dapil.dapil, rules),
    [data, rules],
  );

  /**
   * One pass per band, memo'd on everything except the threshold itself: moving
   * the scrubber changes which band is current, never the bands.
   */
  const response = useMemo(
    () =>
      thresholdResponse(data.parties.parties, data.dapil.dapil, rules, THRESHOLD_MAX),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, rules.thresholdScope, rules.divisor, rules.geography],
  );

  /** What moved against 2024, itemised. Both allocations are already in hand. */
  const transfers = useMemo(
    () => ledger(allocation, reproduction.baseline, data.parties.parties, data.dapil.dapil),
    [allocation, reproduction, data],
  );

  /**
   * DESIGN.md §6.1. While the scrubber is under the pointer the chamber follows
   * it with no easing and no delay; a discrete rule change animates so the user
   * can see what moved. Getting this distinction right is most of what makes the
   * app feel like an instrument rather than a website.
   */
  const [scrubbing, setScrubbing] = useState(false);

  /* One national pool returns a single district, so the two per-dapil views and
     the archipelago's comparison column have nothing to say. */
  const pooled = rules.geography === 'national-pool';

  const averageMagnitude = data.official.totalSeats / data.dapil.dapil.length;
  const [selectedDapil, setSelectedDapil] = useState<string>(() =>
    pickDefaultDapil(data.parties.parties, data.dapil.dapil),
  );

  return (
    <>
      <a className="skip-link small" href="#ruang-sidang">
        {S.skipToInstruments}
      </a>

      <Rail sections={SECTIONS} threshold={rules.threshold} atDefault={isDefault(rules)} />

      <Masthead />

      <main>
        <Section
          id="ruang-sidang"
          index="01"
          title={S.chamber}
          note={S.chamberNote}
          aside={
            <TableView
              caption={`${S.legend}. ${S.chamberNote}`}
              columns={[
                { key: 'party', label: S.party },
                { key: 'votes', label: S.votes, numeric: true },
                { key: 'voteShare', label: S.voteShare, numeric: true },
                { key: 'seats', label: S.seats, numeric: true },
                { key: 'seatShare', label: S.seatShare, numeric: true },
                { key: 'perSeat', label: S.votesPerSeat, numeric: true },
                { key: 'baseline', label: S.under2024, numeric: true },
              ]}
              rows={[...data.parties.parties]
                .sort(
                  (a, b) =>
                    (allocation.seatsByParty[b.id] ?? 0) - (allocation.seatsByParty[a.id] ?? 0) ||
                    b.nationalVotes - a.nationalVotes,
                )
                .map((p) => ({
                  party: p.fullName,
                  votes: count(p.nationalVotes),
                  voteShare: percent(p.nationalVotes / data.parties.totalValidVotes, 2),
                  seats: allocation.seatsByParty[p.id] ?? 0,
                  seatShare: percent(allocation.metrics.shares[p.id]?.seatShare ?? 0, 2),
                  // The concrete reading of the same gap the Gallagher index
                  // states in the abstract. A party holding no seats has no
                  // quotient here — the votes are not expensive, they are
                  // unconverted, and a number would imply otherwise.
                  perSeat: (allocation.seatsByParty[p.id] ?? 0) > 0
                    ? count(Math.round(p.nationalVotes / (allocation.seatsByParty[p.id] as number)))
                    : S.votesPerSeatNone,
                  baseline: reproduction.baseline.seatsByParty[p.id] ?? 0,
                }))}
            />
          }
        >
          <div className="bleed">
            <div className="stage chamber-stage">
              <Chamber
                parties={data.parties.parties}
                seatsByParty={allocation.seatsByParty}
                total={data.official.totalSeats}
                animate={!scrubbing}
              />
              <Legend
                parties={data.parties.parties}
                seatsByParty={allocation.seatsByParty}
                baselineSeats={reproduction.baseline.seatsByParty}
                totalValidVotes={data.parties.totalValidVotes}
              />
            </div>
          </div>
        </Section>

        <Premise data={data} reproduction={reproduction} />

        <Section id="angka-ringkas" index="02" title={S.metrics} note={S.metricsNote}>
          <div className="page">
            <MetricStrip
              metrics={allocation.metrics}
              baseline={reproduction.baseline.metrics}
              rules={data.rules}
              animate={!scrubbing}
            />
          </div>
        </Section>

        <Section
          id="rentang"
          index="03"
          title={S.response}
          note={S.responseNote}
          aside={
            response && (
              <TableView
                caption={S.responseNote}
                columns={[
                  { key: 'band', label: S.responseBand },
                  { key: 'lost', label: S.responseLost },
                  { key: 'parties', label: S.partiesWithSeats, numeric: true },
                  { key: 'unconverted', label: S.unconverted, numeric: true },
                  { key: 'gallagher', label: S.gallagher, numeric: true },
                  { key: 'composition', label: S.responseComposition },
                ]}
                rows={response.regimes.map((r) => ({
                  band: `${percent(r.from, 2)} – ${percent(r.to, 2)}`,
                  lost: r.lostHere ? short(data.parties.parties, r.lostHere) : '—',
                  parties: r.partiesWithSeats,
                  unconverted: count(r.unconvertedVotes),
                  gallagher: decimal(r.gallagher, 2),
                  composition: data.parties.parties
                    .filter((p) => (r.seatsByParty[p.id] ?? 0) > 0)
                    .map((p) => `${p.shortName} ${r.seatsByParty[p.id]}`)
                    .join(', '),
                }))}
              />
            )
          }
        >
          <div className="bleed">
            {response ? (
              <Response
                parties={data.parties.parties}
                response={response}
                threshold={rules.threshold}
                onPick={(threshold) => setRules({ ...rules, threshold })}
              />
            ) : (
              <div className="page">
                <p className="prose small">{S.responseUnavailable}</p>
              </div>
            )}
          </div>
        </Section>

        <Section
          id="dua-aturan"
          index="04"
          title={S.decomposition}
          note={S.decompositionNote}
        >
          <div className="page">
            <Decomposition
              data={decomposition}
              totalValidVotes={data.parties.totalValidVotes}
            />
          </div>
        </Section>

        <Section
          id="suara-sah"
          index="05"
          title={S.voteBar}
          note={S.voteBarNote}
          aside={
            <TableView
              caption={S.voteBarNote}
              columns={[
                { key: 'party', label: S.party },
                { key: 'votes', label: S.votes, numeric: true },
                { key: 'share', label: S.voteShare, numeric: true },
                { key: 'state', label: S.seats },
              ]}
              rows={[...data.parties.parties]
                .sort((a, b) => b.nationalVotes - a.nationalVotes)
                .map((p) => ({
                  party: p.shortName,
                  votes: count(p.nationalVotes),
                  share: percent(p.nationalVotes / data.parties.totalValidVotes, 2),
                  state: (allocation.seatsByParty[p.id] ?? 0) > 0 ? S.converted : S.notConverted,
                }))}
            />
          }
        >
          <div className="bleed">
            <VoteBar
              parties={data.parties.parties}
              seatsByParty={allocation.seatsByParty}
              totalValidVotes={data.parties.totalValidVotes}
              animate={!scrubbing}
            />
          </div>
        </Section>

        <Section
          id="dapil"
          index="06"
          title={pooled ? S.geography : S.archipelago}
          note={pooled ? undefined : S.archipelagoNote}
          aside={
            <>
              <TableView
                caption={S.archipelagoNote}
                columns={[
                  { key: 'dapil', label: S.dapil },
                  { key: 'magnitude', label: S.magnitude, numeric: true },
                  { key: 'composition', label: S.legend },
                  ...(pooled ? [] : [{ key: 'changed', label: S.changedDapil }]),
                ]}
                rows={allocation.byDapil.map((result) => {
                  const d = data.dapil.dapil.find((x) => x.code === result.dapil);
                  const base = reproduction.baseline.byDapil.find(
                    (x) => x.dapil === result.dapil,
                  );
                  return {
                    dapil: d?.name ?? result.dapil,
                    magnitude: d?.magnitude ?? 0,
                    composition: data.parties.parties
                      .filter((p) => (result.seats[p.id] ?? 0) > 0)
                      .map((p) => `${p.shortName} ${result.seats[p.id]}`)
                      .join(', '),
                    changed: data.parties.parties.some(
                      (p) => (result.seats[p.id] ?? 0) !== (base?.seats[p.id] ?? 0),
                    )
                      ? 'ya'
                      : '',
                  };
                })}
              />
              {!pooled && (
                <TableView
                  label={S.transferLedger}
                  caption={S.transferNote}
                  empty={S.noTransfers}
                  columns={[
                    { key: 'dapil', label: S.dapil },
                    { key: 'from', label: S.transferFrom },
                    { key: 'to', label: S.transferTo },
                    { key: 'seats', label: S.seats, numeric: true },
                  ]}
                  rows={transfers.transfers.map((t) => ({
                    dapil: t.dapilName,
                    from: short(data.parties.parties, t.from),
                    to: short(data.parties.parties, t.to),
                    seats: t.seats,
                  }))}
                />
              )}
            </>
          }
        >
          <div className="bleed">
            <Archipelago
              parties={data.parties.parties}
              dapil={data.dapil.dapil}
              results={allocation.byDapil}
              baseline={reproduction.baseline.byDapil}
              selected={selectedDapil}
              onSelect={setSelectedDapil}
              animate={!scrubbing}
              seatsMoved={transfers.seatsMoved}
              pooled={pooled}
            />
          </div>
        </Section>

        <Section
          id="langkah"
          index="07"
          title={S.cascade}
          note={pooled ? undefined : S.cascadeNote}
        >
          <div className="bleed">
            <Cascade
              parties={data.parties.parties}
              dapil={data.dapil.dapil}
              code={selectedDapil}
              rules={rules}
              onSelect={setSelectedDapil}
              pooled={pooled}
            />
          </div>
        </Section>

        <Section
          id="pangsa"
          index="08"
          title={S.proportionality}
          note={S.proportionalityNote}
          aside={
            <TableView
              caption={S.proportionalityNote}
              columns={[
                { key: 'party', label: S.party },
                { key: 'voteShare', label: S.voteShare, numeric: true },
                { key: 'seatShare', label: S.seatShare, numeric: true },
                { key: 'gap', label: 'selisih', numeric: true },
              ]}
              rows={[...data.parties.parties]
                .sort(
                  (a, b) =>
                    (allocation.metrics.shares[b.id]?.voteShare ?? 0) -
                    (allocation.metrics.shares[a.id]?.voteShare ?? 0),
                )
                .map((p) => {
                  const share = allocation.metrics.shares[p.id] ?? { voteShare: 0, seatShare: 0 };
                  const gap = (share.seatShare - share.voteShare) * 100;
                  return {
                    party: p.shortName,
                    voteShare: percent(share.voteShare, 2),
                    seatShare: percent(share.seatShare, 2),
                    gap: `${gap > 0 ? '+' : gap < 0 ? '−' : ''}${decimal(Math.abs(gap), 2)}`,
                  };
                })}
            />
          }
        >
          <div className="bleed">
            <Proportionality
              parties={data.parties.parties}
              metrics={allocation.metrics}
              animate={!scrubbing}
            />
          </div>
        </Section>
      </main>

      <Colophon data={data} />

      <Transport
        rules={rules}
        onChange={setRules}
        onScrub={setScrubbing}
        averageMagnitude={averageMagnitude}
        citations={data.rules}
      />
    </>
  );
}
