import { useEffect, useState } from 'react';
import { S } from '../copy/strings.id';
import { percent } from './format';
import './rail.css';

export interface RailSection {
  id: string;
  label: string;
}

interface Props {
  sections: readonly RailSection[];
  threshold: number;
  /** true when the rules are still the 2024 statutory ones */
  atDefault: boolean;
}

/**
 * The page is five instruments tall. The rail is how a reader knows which one
 * they are in and gets back to another without scrolling through the rest, and
 * it carries the one piece of state that changes the meaning of everything
 * below it — the threshold currently applied.
 *
 * It appears only after the masthead has left the viewport, so the opening of
 * the document is uninterrupted.
 */
export function Rail({ sections, threshold, atDefault }: Props) {
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const masthead = document.getElementById('masthead');
    if (!masthead) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShown(!entry?.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' },
    );
    observer.observe(masthead);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    // The section occupying the upper third of the viewport is the one being
    // read; a plain "most visible" test flickers between two tall instruments.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className={`rail${shown ? ' rail--shown' : ''}`} aria-label={S.contents}>
      <div className="rail__inner page">
        <p className="rail__mark small">
          <span className="rail__title">{S.title}</span>
          <span className="rail__state" aria-hidden="true">
            {percent(threshold, 1)}
            {atDefault ? '' : ' ·'}
            {atDefault ? '' : <span className="rail__changed"> {S.changed}</span>}
          </span>
        </p>
        <ul className="rail__list">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`rail__link small${active === section.id ? ' rail__link--on' : ''}`}
                aria-current={active === section.id ? 'true' : undefined}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
