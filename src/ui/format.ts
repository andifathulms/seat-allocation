/** DESIGN.md §7 and CLAUDE.md: Indonesian number formatting throughout. */

export function count(n: number): string {
  return n.toLocaleString('id-ID');
}

export function percent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function decimal(n: number, digits = 2): string {
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Deltas are direction and sign in --ink, never colour. DESIGN.md §2.3. */
export function delta(current: number, baseline: number, digits = 2): string | null {
  const d = current - baseline;
  if (Math.abs(d) < 10 ** -digits / 2) return null;
  return `${d > 0 ? '↑' : '↓'} ${decimal(Math.abs(d), digits)}`;
}

export function deltaCount(current: number, baseline: number): string | null {
  const d = current - baseline;
  if (d === 0) return null;
  return `${d > 0 ? '↑' : '↓'} ${count(Math.abs(d))}`;
}
