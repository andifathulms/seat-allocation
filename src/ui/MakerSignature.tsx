import './maker-signature.css';

/**
 * A quiet author credit at the foot of the page. It is personal attribution,
 * not a source or a legal notice, so it sits in its own bottom bar below the
 * colophon's two columns rather than among the KPU documents.
 *
 * Every link this component renders is here.
 */
const MAKER = {
  name: 'Andi Fathul Mukminin',
  portfolio: 'https://andifathulms.github.io/en/',
  links: [
    { label: 'Portfolio', href: 'https://andifathulms.github.io/en/', icon: 'globe' },
    { label: 'GitHub', href: 'https://github.com/andifathulms', icon: 'github' },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/andifathulmukminin/',
      icon: 'linkedin',
    },
    { label: 'Instagram', href: 'https://www.instagram.com/andifathulms/', icon: 'instagram' },
  ],
} as const;

type IconName = (typeof MAKER.links)[number]['icon'];

/* 18px, drawn on a 24-unit grid. The globe is a stroke figure because it has to
   read as an outline next to three filled marks; the rest are the platforms'
   own glyphs. */
function Icon({ name }: { name: IconName }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', 'aria-hidden': true } as const;

  if (name === 'globe') {
    return (
      <svg
        {...common}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
      </svg>
    );
  }
  if (name === 'github') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12 2.2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10 10 0 0 0 12 2.2Z" />
      </svg>
    );
  }
  if (name === 'linkedin') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.1 21V9.5h3.76V21H3.1Zm6.14 0V9.5h3.6v1.57h.05c.5-.9 1.72-1.85 3.54-1.85 3.79 0 4.49 2.4 4.49 5.52V21h-3.75v-4.9c0-1.17-.02-2.67-1.66-2.67-1.67 0-1.92 1.27-1.92 2.59V21H9.24Z" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor">
      <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4C15.51 4.01 15.14 4 12 4Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.15-3.2a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
    </svg>
  );
}

export function MakerSignature() {
  const year = new Date().getFullYear();

  return (
    <div className="maker">
      <p className="maker__line small">
        Designed &amp; built by{' '}
        <a className="maker__name" href={MAKER.portfolio} target="_blank" rel="noopener noreferrer">
          {MAKER.name}
        </a>{' '}
        · <span className="maker__year">© {year}</span>
      </p>
      <ul className="maker__links">
        {MAKER.links.map((link) => (
          <li key={link.label}>
            <a
              className="maker__icon"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
            >
              <Icon name={link.icon} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
