import { useEffect, useState } from 'react';
import { S } from './copy/strings.id';
import { loadDataset } from './data/load';
import { reproduce, type Reproduction } from './data/reproduction';
import type { Dataset } from './data/schema';
import { useAllocation } from './state/useAllocation';
import { count, decimal, percent } from './ui/format';
import { Archipelago } from './views/Archipelago/Archipelago';
import { Cascade } from './views/Cascade/Cascade';
import { Chamber } from './views/Chamber/Chamber';
import { Legend } from './ui/Legend';
import { MetricStrip } from './ui/MetricStrip';
import { TableView } from './ui/TableView';
import { Transport } from './ui/Transport';
import { Verification } from './ui/Verification';
import { Proportionality } from './views/Proportionality/Proportionality';
import { VoteBar } from './views/VoteBar/VoteBar';
import './app.css';

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
      <main className="page">
        <p className="verification verification--failed">
          {S.loadFailed} {error}
        </p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="page">
        <p className="small">{S.loading}</p>
      </main>
    );
  }
  return <Loaded data={data} />;
}

function Loaded({ data }: { data: Dataset }) {
  const [reproduction] = useState<Reproduction>(() => reproduce(data));
  const { rules, setRules, allocation } = useAllocation(data);

  /**
   * DESIGN.md §6.1. While the scrubber is under the pointer the chamber follows
   * it with no easing and no delay; a discrete rule change animates so the user
   * can see what moved. Getting this distinction right is most of what makes the
   * app feel like an instrument rather than a website.
   */
  const [scrubbing, setScrubbing] = useState(false);

  const averageMagnitude = data.official.totalSeats / data.dapil.dapil.length;
  const [selectedDapil, setSelectedDapil] = useState<string>(
    () => data.dapil.dapil[0]?.code ?? '',
  );

  return (
    <>
      <header className="page masthead">
        <h1 className="h1">{S.title}</h1>
        <p className="prose">{S.subtitle}</p>
        <Verification reproduction={reproduction} />
        <p className="prose masthead__intro">{S.intro}</p>
      </header>

      <main className={`page${reproduction.reproduced ? '' : ' page--unverified'}`}>
        <section className="section">
          <h2 className="h2">{S.chamber}</h2>
          <p className="prose small">{S.chamberNote}</p>
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
          <TableView
            caption={`${S.legend}. ${S.chamberNote}`}
            columns={[
              { key: 'party', label: S.party },
              { key: 'votes', label: S.votes, numeric: true },
              { key: 'voteShare', label: S.voteShare, numeric: true },
              { key: 'seats', label: S.seats, numeric: true },
              { key: 'seatShare', label: S.seatShare, numeric: true },
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
                baseline: reproduction.baseline.seatsByParty[p.id] ?? 0,
              }))}
          />
        </section>

        <section className="section">
          <h2 className="visually-hidden">{S.metrics}</h2>
          <MetricStrip
            metrics={allocation.metrics}
            baseline={reproduction.baseline.metrics}
            rules={data.rules}
            animate={!scrubbing}
          />
        </section>

        <section className="section">
          <h2 className="h2">{S.voteBar}</h2>
          <p className="prose small">{S.voteBarNote}</p>
          <VoteBar
            parties={data.parties.parties}
            seatsByParty={allocation.seatsByParty}
            totalValidVotes={data.parties.totalValidVotes}
            animate={!scrubbing}
          />
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
        </section>

        <section className="section">
          <h2 className="h2">{S.archipelago}</h2>
          <p className="prose small">{S.archipelagoNote}</p>
          <Archipelago
            parties={data.parties.parties}
            dapil={data.dapil.dapil}
            results={allocation.byDapil}
            baseline={reproduction.baseline.byDapil}
            selected={selectedDapil}
            onSelect={setSelectedDapil}
            animate={!scrubbing}
          />
          <TableView
            caption={S.archipelagoNote}
            columns={[
              { key: 'dapil', label: S.dapil },
              { key: 'magnitude', label: S.magnitude, numeric: true },
              { key: 'composition', label: S.legend },
              { key: 'changed', label: S.changedDapil },
            ]}
            rows={allocation.byDapil.map((result) => {
              const d = data.dapil.dapil.find((x) => x.code === result.dapil);
              const base = reproduction.baseline.byDapil.find((x) => x.dapil === result.dapil);
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
        </section>

        <section className="section">
          <h2 className="h2">{S.cascade}</h2>
          <p className="prose small">{S.cascadeNote}</p>
          <Cascade
            parties={data.parties.parties}
            dapil={data.dapil.dapil}
            code={selectedDapil}
            rules={rules}
            onSelect={setSelectedDapil}
          />
        </section>

        <section className="section">
          <h2 className="h2">{S.proportionality}</h2>
          <p className="prose small">{S.proportionalityNote}</p>
          <Proportionality
            parties={data.parties.parties}
            metrics={allocation.metrics}
            animate={!scrubbing}
          />
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
        </section>
      </main>

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
