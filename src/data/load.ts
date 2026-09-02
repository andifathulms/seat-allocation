import type { Dataset } from './schema';

/**
 * Parses and validates the four JSON files at boot and fails loudly. There is no
 * origin here but the app's own static files: CLAUDE.md non-negotiable 3.
 */
async function readJson(base: string, name: string): Promise<unknown> {
  const response = await fetch(`${base}data/${name}`);
  if (!response.ok) {
    throw new Error(`${name}: HTTP ${response.status}`);
  }
  return response.json();
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function loadDataset(base: string): Promise<Dataset> {
  const [parties, dapil, official, rules] = (await Promise.all([
    readJson(base, 'parties-2024.json'),
    readJson(base, 'dapil-2024.json'),
    readJson(base, 'official-2024.json'),
    readJson(base, 'rules-2024.json'),
  ])) as Dataset[keyof Dataset][];

  const data = { parties, dapil, official, rules } as Dataset;

  assert(Array.isArray(data.parties.parties), 'parties-2024.json: parties is not an array');
  assert(data.parties.parties.length > 0, 'parties-2024.json: no parties');
  assert(Array.isArray(data.dapil.dapil), 'dapil-2024.json: dapil is not an array');
  assert(data.dapil.dapil.length > 0, 'dapil-2024.json: no dapil');
  assert(
    typeof data.parties.totalValidVotes === 'number',
    'parties-2024.json: totalValidVotes is missing',
  );

  for (const p of data.parties.parties) {
    assert(typeof p.id === 'string' && p.id.length > 0, 'a party has no id');
    assert(/^#[0-9A-Fa-f]{6}$/.test(p.color), `${p.id}: color is not a hex triplet`);
    assert(Number.isFinite(p.nationalVotes), `${p.id}: nationalVotes is not a number`);
  }

  const ids = new Set(data.parties.parties.map((p) => p.id));
  for (const d of data.dapil.dapil) {
    assert(typeof d.code === 'string' && d.code.length > 0, 'a dapil has no code');
    assert(Number.isInteger(d.magnitude) && d.magnitude > 0, `${d.code}: bad magnitude`);
    for (const id of ids) {
      assert(Number.isFinite(d.votes[id] ?? 0), `${d.code}: ${id} has a non-numeric vote`);
    }
  }

  assert(Array.isArray(data.rules.rules), 'rules-2024.json: rules is not an array');

  return data;
}
