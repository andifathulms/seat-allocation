/**
 * Copy. DESIGN.md §7 and PRD §10.2: describe the arithmetic, never the outcome.
 * Sentence case, plain verbs, no exclamation marks, no adjectives about results.
 *
 * A second locale would be a sibling file of the same shape. Two locales do not
 * justify an i18n framework.
 */
export const S = {
  title: 'Suara ke Kursi',
  subtitle: 'Bagaimana suara Pemilu 2024 menjadi 580 kursi DPR',

  verified: (seats: number, seatsTotal: number, dapil: number, dapilTotal: number) =>
    `Hasil resmi 2024 direproduksi: ${seats} dari ${seatsTotal} kursi, ${dapil} dari ${dapilTotal} dapil.`,
  notVerified: 'Hasil resmi 2024 belum dapat direproduksi.',
  failed: 'Reproduksi hasil resmi 2024 gagal.',

  intro:
    'Delapan belas partai bertanding pada Pemilu 2024. Delapan melewati ambang batas ' +
    '4 persen suara sah nasional, dan hanya suara delapan partai itu yang dihitung ' +
    'menjadi kursi di 84 daerah pemilihan. Geser ambang batas di bawah untuk melihat ' +
    'susunan DPR dihitung ulang atas suara yang sama.',

  chamber: 'Ruang sidang',
  chamberNote:
    'Setiap lingkaran satu kursi. Partai diurutkan menurut jumlah kursi, terbesar di ' +
    'kiri; urutan ini tidak menyatakan posisi politik.',

  legend: 'Kursi per partai',
  legendZero: 'Partai tanpa kursi',
  seats: 'kursi',
  votes: 'suara',
  ofVotes: 'suara sah nasional',

  metrics: 'Angka ringkas',
  unconverted: 'Suara yang tidak menjadi kursi',
  unconvertedDef:
    'Jumlah suara sah untuk partai yang tidak memperoleh satu kursi pun.',
  gallagher: 'Indeks Gallagher',
  gallagherDef:
    'Jarak kuadrat terkecil antara pangsa suara dan pangsa kursi, dalam poin persen. ' +
    'Semakin kecil, semakin dekat pangsa kursi pada pangsa suara.',
  loosemoreHanby: 'Indeks Loosemore–Hanby',
  loosemoreHanbyDef:
    'Setengah dari jumlah selisih mutlak antara pangsa suara dan pangsa kursi tiap ' +
    'partai, dalam poin persen.',
  enp: 'Jumlah partai efektif',
  enpDef:
    'Ukuran Laakso–Taagepera, dihitung dua kali: atas pangsa suara dan atas pangsa ' +
    'kursi. Jarak antara keduanya adalah pemampatan yang dilakukan sistem pemilu.',
  votesToSeats: 'suara → kursi',
  under2024: 'aturan 2024',

  controls: 'Aturan',
  moreRules: 'Aturan lain',
  threshold: 'Ambang batas',
  thresholdScope: 'Cakupan ambang batas',
  scopeNational: 'nasional',
  scopeDapil: 'per dapil',
  scopeNone: 'tanpa ambang batas',
  divisor: 'Metode pembagi',
  divisorSainteLague: 'Sainte-Laguë',
  divisorDhondt: "D'Hondt",
  divisorModified: 'Sainte-Laguë modifikasi',
  divisorHare: 'Kuota Hare',
  geography: 'Daerah pemilihan',
  geographyDapil: '84 dapil sebagaimana ditetapkan',
  geographyNational: 'satu dapil nasional',
  geographyNationalNote:
    'Tolok ukur, bukan usulan. Menghitung seluruh kursi dari satu kumpulan nasional ' +
    'memisahkan pengaruh besaran dapil dari pengaruh ambang batas.',
  reset: 'Setel ulang ke aturan 2024',

  /** PRD §10.1. Visible whenever any knob is off its 2024 default. */
  counterfactual:
    'Angka di bawah aturan yang diubah adalah hitungan ulang atas suara Pemilu 2024 ' +
    'yang tetap, bukan ramalan. Pemilih dan partai berperilaku strategis: sebagian ' +
    'orang tidak memilih partai kecil justru karena memperkirakan partai itu tidak ' +
    'lolos, dan sebagian partai akan berkampanye lain jika aturannya lain.',

  voteBar: 'Suara sah nasional',
  voteBarNote:
    'Satu batang untuk seluruh suara sah. Bagian kiri menjadi kursi, bagian kanan ' +
    'tidak. Batas di antaranya bergerak mengikuti ambang batas.',
  converted: 'menjadi kursi',
  notConverted: 'tidak menjadi kursi',

  archipelago: 'Delapan puluh empat dapil',
  archipelagoNote:
    'Setiap sel satu dapil, disusun kira-kira dari barat ke timur. Segitiga di sudut ' +
    'kiri atas menandai dapil yang susunan kursinya berbeda dari hasil 2024.',
  changedDapil: 'dapil berubah dari hasil 2024',

  cascade: 'Pembagian kursi langkah demi langkah',
  cascadeNote:
    'Suara tiap partai di dapil ini dibagi 1, 3, 5, 7, dan seterusnya. Kursi jatuh ' +
    'pada hasil bagi terbesar, satu per satu.',
  step: 'Langkah',
  play: 'Jalankan',
  pause: 'Jeda',
  stepBack: 'Mundur satu kursi',
  stepForward: 'Maju satu kursi',
  eliminated: 'Tidak diikutkan dalam penentuan kursi',
  chooseDapil: 'Pilih dapil',

  proportionality: 'Pangsa suara dan pangsa kursi',
  proportionalityNote:
    'Satu titik per partai. Garis 45 derajat adalah proporsionalitas sempurna: titik ' +
    'di atasnya memperoleh pangsa kursi lebih besar dari pangsa suaranya, titik di ' +
    'bawahnya lebih kecil.',
  voteShare: 'pangsa suara',
  seatShare: 'pangsa kursi',

  table: 'Tabel',
  showTable: 'Tampilkan tabel',
  hideTable: 'Sembunyikan tabel',
  party: 'Partai',
  dapil: 'Dapil',
  magnitude: 'Kursi',

  context: 'Latar hukum',
  contextNote:
    'Mahkamah Konstitusi menyatakan ambang batas 4 persen berlaku untuk Pemilu 2024 ' +
    'dan mewajibkan pembentuk undang-undang merumuskan ulang angkanya sebelum tahapan ' +
    'Pemilu 2029 dimulai. Kutipan berikut adalah apa yang diwajibkan Mahkamah, bukan ' +
    'pendapat aplikasi ini.',

  sources: 'Sumber data',
  provenanceCertified: 'Angka bersertifikat KPU.',
  provenanceSynthetic:
    'Berkas dapil-2024.json pada versi ini adalah placeholder, bukan rekapitulasi ' +
    'bersertifikat. Total suara nasional tiap partai dan total 580 kursi pada 84 dapil ' +
    'sesuai angka resmi; angka suara per dapil tidak. Karena itu baris verifikasi di ' +
    'atas menyatakan hasil resmi belum dapat direproduksi.',

  source: 'Sumber',
  tie: 'Hasil bagi seri',
  loading: 'Memuat data…',
  loadFailed: 'Data gagal dimuat.',
} as const;
