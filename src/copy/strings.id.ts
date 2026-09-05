/**
 * Copy. DESIGN.md §7 and PRD §10.2: describe the arithmetic, never the outcome.
 * Sentence case, plain verbs, no exclamation marks, no adjectives about results.
 *
 * A second locale would be a sibling file of the same shape. Two locales do not
 * justify an i18n framework.
 */
export const S = {
  title: 'Suara ke Kursi',
  /*
   * A promise with a verb, not a topic. The old subtitle named a subject —
   * how votes became seats — and left a reader to discover from the third
   * clause of a sixty-word paragraph that anything on the page could be moved.
   *
   * Stated as what the app does rather than as an instruction to the reader:
   * the house rule in CLAUDE.md forbids second-person exhortation, and an
   * affordance survives being described.
   */
  subtitle:
    'Menghitung ulang 580 kursi DPR atas suara Pemilu 2024, pada ambang batas ' +
    'dan metode pembagi mana pun.',
  /** What it is not, before the first figure is read. PRD §10.1. */
  lead: 'Hitung ulang atas suara yang sudah tetap, bukan ramalan.',

  contents: 'Isi halaman',
  changed: 'aturan diubah',

  verifiedHead: 'Hasil resmi 2024 direproduksi.',
  verifiedDetail: (seats: number, seatsTotal: number, dapil: number, dapilTotal: number) =>
    `${seats} dari ${seatsTotal} kursi cocok, ${dapil} dari ${dapilTotal} dapil cocok.`,
  /*
   * Leads with what is certified rather than with what failed. Both sentences
   * were already true; the old order put an unqualified failure above every
   * working output on the page, which invited a reader to discount figures that
   * are in fact the official ones.
   */
  notVerified: 'Angka nasional sesuai hasil resmi KPU.',
  failed: 'Reproduksi hasil resmi 2024 gagal.',
  failedDetail:
    'Alokasi yang dihitung berbeda dari alokasi resmi. Rincian per pemeriksaan ada di bawah.',
  checkDetail: 'Rincian pemeriksaan',

  officialResult: 'Hasil resmi Pemilu 2024',
  seatsInPlay: 'kursi DPR',
  contesting: 'partai peserta',
  qualified: 'partai melewati ambang batas',

  intro:
    'Delapan belas partai bertanding pada Pemilu 2024. Delapan melewati ambang batas ' +
    '4 persen suara sah nasional, dan hanya suara delapan partai itu yang dihitung ' +
    'menjadi kursi di 84 daerah pemilihan. Geser ambang batas di bawah untuk melihat ' +
    'susunan DPR dihitung ulang atas suara yang sama.',

  chamber: 'Ruang sidang',
  chamberNote:
    'Setiap lingkaran satu kursi. Partai diurutkan menurut jumlah kursi, terbesar di ' +
    'kiri; urutan ini tidak menyatakan posisi politik.',

  legend: 'Memperoleh kursi',
  legendZero: 'Tanpa kursi',
  seats: 'kursi',
  votes: 'suara',
  ofVotes: 'suara sah nasional',

  metrics: 'Angka ringkas',
  metricsNote:
    'Empat ukuran sebaran suara dan kursi. Masing-masing ditampilkan bersama nilainya ' +
    'di bawah aturan 2024, sehingga selisihnya selalu terlihat.',
  skipToInstruments: 'Lewati ke instrumen',
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

  response: 'Seluruh rentang ambang batas',
  responseShort: 'Rentang',
  responseNote:
    'Susunan 580 kursi pada setiap nilai ambang batas dari 0 sampai 10 persen. ' +
    'Susunan hanya berubah ketika ambang batas melewati pangsa suara nasional ' +
    'sebuah partai, sehingga rentangnya terbagi menjadi beberapa dataran ' +
    'dengan susunan yang sama persis di sepanjang masing-masing.',
  responseAria:
    'Susunan kursi per partai pada setiap nilai ambang batas dari 0 sampai 10 persen.',
  responseReading: (parties: number, from: string, to: string) =>
    `Pada setelan sekarang, ${parties} partai memperoleh kursi. Susunan yang sama ` +
    `berlaku di seluruh rentang di atas ${from} sampai ${to}.`,
  responseUnavailable:
    'Rentang hanya dapat dihitung untuk ambang batas nasional. Pada cakupan per ' +
    'dapil batasnya adalah pangsa suara di tiap dapil, bukan satu deret nasional.',
  responseJumps: 'Lompat ke batas',
  wsTitle: 'Lembar hitung',
  wsProvenance: 'Status reproduksi',
  wsCounterfactual: 'Catatan',
  wsOrdinal: 'Kursi ke',
  wsVotes: 'Suara',
  wsDivisor: 'Pembagi',
  wsQuotient: 'Hasil bagi',
  wsAwarded: 'Kursi jatuh',
  wsYes: 'ya',
  wsDownload: 'Unduh lembar hitung (CSV)',
  responseBand: 'Rentang ambang batas',
  responseLost: 'Partai yang gugur di batas ini',
  responseComposition: 'Susunan kursi',
  decomposition: 'Dua aturan, diukur terpisah',
  decompositionShort: 'Dua aturan',
  decompositionNote:
    'Indeks Gallagher pada empat gabungan aturan: ambang batas seperti yang ' +
    'disetel dan tanpa ambang batas, masing-masing di 84 dapil dan di satu ' +
    'kumpulan nasional. Membandingkan baris memberi pengaruh ambang batas; ' +
    'membandingkan kolom memberi pengaruh besaran dapil.',
  decompositionCaveat:
    'Kedua aturan saling memengaruhi, sehingga selisihnya tidak dijumlahkan ' +
    'menjadi satu angka. Empat pengukuran ditampilkan sebagai empat pengukuran.',
  withThreshold: 'ambang batas disetel',
  withoutThreshold: 'tanpa ambang batas',
  geo84: '84 dapil',
  geoPool: 'satu dapil nasional',
  partiesWithSeats: 'partai memperoleh kursi',
  votesPerSeat: 'Suara per kursi',
  votesPerSeatNone: 'tanpa kursi',

  controls: 'Aturan',
  /*
   * The console names its own effect. Until this revision the only statement
   * that the threshold could be moved sat in clause three of the masthead
   * paragraph, which a reader reaches — if at all — long after meeting the
   * control itself.
   */
  transportHint: 'Menggeser ambang batas menghitung ulang seluruh 580 kursi.',
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
  unconvertedBreakdown: 'Bagian kanan, per partai',
  converted: 'menjadi kursi',
  notConverted: 'tidak menjadi kursi',

  archipelago: 'Delapan puluh empat dapil',
  archipelagoNote:
    'Setiap sel satu dapil, disusun kira-kira dari barat ke timur. Segitiga di sudut ' +
    'kiri atas menandai dapil yang susunan kursinya berbeda dari hasil 2024.',
  changedDapil: 'dapil berubah dari hasil 2024',
  seatsMoved: 'kursi berpindah',
  transferLedger: 'Kursi yang berpindah',
  transferNote:
    'Perbandingan susunan kursi pada aturan yang disetel dengan susunan pada ' +
    'aturan 2024, dapil demi dapil. Pasangan partai disusun dari selisih ' +
    'terbesar; pembagi tertinggi tidak mengenal kursi yang dimiliki lalu ' +
    'diambil, jadi angka yang dikutip adalah jumlah kursi berpindah, bukan ' +
    'pasangannya.',
  transferFrom: 'Berkurang',
  transferTo: 'Bertambah',
  transferNet: 'Selisih bersih per partai',
  noTransfers: 'Tidak ada kursi yang berpindah dari hasil 2024.',

  cascade: 'Pembagian kursi langkah demi langkah',
  cascadeShort: 'Langkah demi langkah',
  cascadeNote:
    'Suara tiap partai di dapil ini dibagi 1, 3, 5, 7, dan seterusnya. Kursi jatuh ' +
    'pada hasil bagi terbesar, satu per satu.',
  cascadePrompt:
    'Tekan jalankan, panah, atau geser langkah untuk membagikan kursi satu per satu.',
  step: 'Langkah',
  play: 'Jalankan',
  pause: 'Jeda',
  stepBack: 'Mundur satu kursi',
  stepForward: 'Maju satu kursi',
  eliminated: 'Tidak diikutkan dalam penentuan kursi',
  chooseDapil: 'Pilih dapil',

  proportionality: 'Pangsa suara dan pangsa kursi',
  proportionalityShort: 'Pangsa',
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
