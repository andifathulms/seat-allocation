import { useEffect, useState } from 'react';
import { S } from './copy/strings.id';
import { loadDataset } from './data/load';
import { reproduce, type Reproduction } from './data/reproduction';
import type { Dataset } from './data/schema';
import { useAllocation } from './state/useAllocation';
import { Archipelago } from './views/Archipelago/Archipelago';
import { Cascade } from './views/Cascade/Cascade';
import { Chamber } from './views/Chamber/Chamber';
import { Legend } from './ui/Legend';
import { MetricStrip } from './ui/MetricStrip';
import { Transport } from './ui/Transport';
import { Verification } from './ui/Verification';
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
      </main>

      <Transport
        rules={rules}
        onChange={setRules}
        onScrub={setScrubbing}
        averageMagnitude={averageMagnitude}
      />
    </>
  );
}
