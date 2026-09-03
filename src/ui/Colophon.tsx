import type { Dataset } from '../data/schema';
import { S } from '../copy/strings.id';
import { Cite } from './Cite';
import { MakerSignature } from './MakerSignature';
import './colophon.css';

/**
 * PRD §10.2: the Court's conditions may be quoted because they are the legal
 * standard the calculation serves. They are presented as what the Court
 * required, not as what the app endorses, and the app recommends no threshold.
 */
export function Colophon({ data }: { data: Dataset }) {
  const putusan = data.rules.rules.find((r) => r.id === 'putusan-syarat');
  const synthetic = data.dapil.provenance !== 'certified';

  return (
    <footer className="colophon">
      <div className="page colophon__inner">
      <section className="colophon__legal">
        <h2 className="h3">{S.context}</h2>
        <p className="prose small">{S.contextNote}</p>
        {putusan && (
          <blockquote className="colophon__quote">
            <q>{putusan.text}</q>
            <p className="small colophon__attribution">
              {data.rules.documents[putusan.document]?.title}
              <Cite rules={data.rules} of="putusan-syarat" />
            </p>
          </blockquote>
        )}
      </section>

      <section className="colophon__provenance">
        <h2 className="h3">{S.sources}</h2>
        <ul className="colophon__sources small">
          {Object.entries(data.rules.documents).map(([id, doc]) => (
            <li key={id}>
              <a href={doc.url} rel="noreferrer noopener">
                {doc.title}
              </a>
              <span className="colophon__meta micro">
                {doc.publisher} · {doc.date}
              </span>
            </li>
          ))}
        </ul>
        <p className={`prose small colophon__provenance-note${synthetic ? ' colophon__warn' : ''}`}>
          {synthetic ? S.provenanceSynthetic : S.provenanceCertified}
        </p>
      </section>

      <div className="colophon__bottom">
        <MakerSignature />
      </div>
      </div>
    </footer>
  );
}
