import type { ReactNode } from 'react';
import './section.css';

interface Props {
  id: string;
  /** the section's place in the reading order, printed in the spine */
  index: string;
  title: string;
  note: string;
  /** controls belonging to the instrument, set at the right of the head */
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * One instrument. The numbered spine down the left is the page's structure made
 * visible: this document is five instruments read in order, and on a page this
 * tall the reader needs to know which one they are in without scrolling back.
 * DESIGN.md §4.1.
 */
export function Section({ id, index, title, note, aside, children }: Props) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <div className="page section__head">
        <p className="section__index micro" aria-hidden="true">
          {index}
        </p>
        <div className="section__heading">
          <h2 className="h2" id={`${id}-title`}>
            {title}
          </h2>
          <p className="prose small section__note">{note}</p>
        </div>
        {aside && <div className="section__aside">{aside}</div>}
      </div>
      <div className="section__body">{children}</div>
    </section>
  );
}
