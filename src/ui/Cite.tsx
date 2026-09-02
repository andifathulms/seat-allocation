import { useEffect, useId, useRef, useState } from 'react';
import type { RulesFile } from '../data/schema';
import './cite.css';

interface Props {
  rules: RulesFile;
  /** a rule id from rules-2024.json, or a figure id */
  of: string;
  label?: string;
}

/**
 * One component for both rule citations and figure citations. A quiet inline
 * marker that opens a popover — not a footnote at the bottom of the page, and
 * not a tooltip that vanishes on mouse-out, because people will want to read the
 * pasal text.
 */
export function Cite({ rules, of, label }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLSpanElement>(null);

  const rule = rules.rules.find((r) => r.id === of);
  const figure = rules.figures.find((f) => f.id === of);
  const documentId = rule?.document ?? figure?.document;
  const source = documentId ? rules.documents[documentId] : undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  if (!source) return null;

  return (
    <span className="cite" ref={wrapper}>
      <button
        type="button"
        className="cite__marker"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">§</span>
        <span className="visually-hidden">
          Sumber: {label ?? rule?.pasal ?? figure?.label ?? of}
        </span>
      </button>
      {open && (
        <span className="cite__popover" id={id} role="dialog" aria-label="Sumber">
          {rule && <span className="cite__pasal small">{rule.pasal}</span>}
          {rule && <q className="cite__law">{rule.text}</q>}
          {figure && (
            <span className="cite__pasal small">
              {figure.label}: {figure.value.toLocaleString('id-ID')}
            </span>
          )}
          <span className="cite__source small">
            {source.title}. {source.publisher}, {source.date}.
          </span>
          <a className="cite__link small" href={source.url} rel="noreferrer noopener">
            {source.url}
          </a>
        </span>
      )}
    </span>
  );
}
