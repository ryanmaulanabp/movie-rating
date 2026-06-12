const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageBreak, PageNumber, TabStopType, TabStopPosition,
  TableOfContents
} = require('docx');
const fs = require('fs');
 
// ───────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────
const FULL_W = 9360; // US Letter content width
 
const border = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorders = { top: border, bottom: border, left: border, right: border };
 
function cell(text, opts = {}) {
  const { width, bold = false, shade = null, align = AlignmentType.LEFT, color = "000000", italics = false } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: "center",
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text: String(text), bold, italics, color, size: 20 })]
    })]
  });
}
 
function headerCell(text, width) {
  return cell(text, { width, bold: true, shade: "2E4057", color: "FFFFFF", align: AlignmentType.CENTER });
}
 
function p(text, opts = {}) {
  const { bold = false, italics = false, size = 22, spacing = { after: 120 }, alignment = AlignmentType.JUSTIFIED, color, after } = opts;
  return new Paragraph({
    alignment,
    spacing: after !== undefined ? { after } : spacing,
    children: [new TextRun({ text, bold, italics, size, color })]
  });
}
 
function pMulti(runs, opts = {}) {
  const { spacing = { after: 120 }, alignment = AlignmentType.JUSTIFIED } = opts;
  return new Paragraph({ alignment, spacing, children: runs.map(r => new TextRun(r)) });
}
 
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text })]
  });
}
 
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text })]
  });
}
 
function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text })]
  });
}
 
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 60 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 22 })]
  });
}
 
function bulletRich(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 60 },
    alignment: AlignmentType.JUSTIFIED,
    children: runs.map(r => new TextRun(r))
  });
}
 
function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { after: 60 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 22 })]
  });
}
 
function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [new TextRun({ text, italics: true, size: 20, color: "595959" })]
  });
}
 
function divider() {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E4057", space: 1 } },
    children: []
  });
}
 
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
 
function codeBlock(lines) {
  return new Paragraph({
    spacing: { before: 80, after: 160 },
    shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
    border: { top: border, bottom: border, left: border, right: border },
    children: lines.flatMap((line, idx) => {
      const run = new TextRun({ text: line || " ", font: "Consolas", size: 18 });
      return idx === 0 ? [run] : [new TextRun({ text: "", break: 1 }), run];
    })
  });
}
 
// ───────────────────────────────────────────────────────────
// COVER PAGE
// ───────────────────────────────────────────────────────────
const coverChildren = [
  new Paragraph({ spacing: { before: 400, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "LAPORAN", bold: true, size: 32 })] }),
  new Paragraph({ spacing: { before: 240, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({
      text: "Analisis Komparatif Performa Fuzzy Logic Klasifikasi Mamdani dan Sugeno dalam Memprediksi Keberhasilan Finansial Box Office Berdasarkan Karakteristik Produksi Film",
      bold: true, size: 28 })] }),
  new Paragraph({ spacing: { before: 320, after: 0 }, alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "Dosen Pengampu: ", bold: true, size: 24 }),
      new TextRun({ text: "Sabrina Adinda Sari, S.Kom., M.Kom.", size: 24 }),
    ] }),
 
  // Logo placeholder
  new Paragraph({ spacing: { before: 600, after: 600 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "[ LOGO TELKOM UNIVERSITY ]", italics: true, color: "AAAAAA", size: 24 })] }),
 
  new Paragraph({ spacing: { before: 200, after: 160 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Oleh:", bold: true, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Ryan Maulana Bagus Putra   103012430029", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Azmi Hanif Fauzil Islami   103012420018", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Aloysius Axel Adriano   103012400419", size: 24 })] }),
 
  new Paragraph({ spacing: { before: 700, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "S-1 INFORMATIKA", bold: true, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
    children: [new TextRun({ text: "FAKULTAS INFORMATIKA", bold: true, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
    children: [new TextRun({ text: "TELKOM UNIVERSITY", bold: true, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
    children: [new TextRun({ text: "BANDUNG", bold: true, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
    children: [new TextRun({ text: "2026", bold: true, size: 24 })] }),
 
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// KATA PENGANTAR
// ───────────────────────────────────────────────────────────
const kataPengantar = [
  heading1("KATA PENGANTAR"),
  p("Puji syukur kami panjatkan kehadirat Tuhan Yang Maha Esa atas selesainya laporan tugas besar mata kuliah Kecerdasan Buatan dengan judul \u201CAnalisis Komparatif Performa Fuzzy Logic Klasifikasi Mamdani dan Sugeno dalam Memprediksi Keberhasilan Finansial Box Office Berdasarkan Karakteristik Produksi Film\u201D. Laporan ini disusun sebagai bentuk implementasi nyata dari konsep logika fuzzy yang telah dipelajari di kelas, dengan studi kasus pada data perfilman dunia."),
  p("Dalam pengerjaannya, kami membangun sistem inferensi fuzzy (Fuzzy Inference System / FIS) secara from scratch tanpa menggunakan pustaka fuzzy siap pakai seperti scikit-fuzzy, sehingga setiap tahapan \u2014 mulai dari fuzzifikasi, pembentukan rule base, inferensi, hingga defuzzifikasi \u2014 benar-benar dipahami dan diimplementasikan sendiri menggunakan Python murni dengan bantuan NumPy dan Pandas untuk manipulasi data."),
  p("Kami menyadari bahwa laporan ini masih memiliki banyak kekurangan, baik dari segi penulisan, analisis, maupun desain sistem. Oleh karena itu, kritik dan saran yang membangun dari Dosen Pengampu dan pembaca sangat kami harapkan demi penyempurnaan laporan ini di masa mendatang."),
  p("Akhir kata, kami mengucapkan terima kasih kepada Ibu Sabrina Adinda Sari, S.Kom., M.Kom. selaku dosen pengampu mata kuliah yang telah memberikan bimbingan, arahan, serta ilmu yang sangat bermanfaat selama proses penyusunan laporan ini."),
  p("Bandung, Juni 2026", { alignment: AlignmentType.RIGHT, after: 40 }),
  p("Penyusun,", { alignment: AlignmentType.RIGHT, after: 320 }),
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// TABLE OF CONTENTS PAGE
// ───────────────────────────────────────────────────────────
const tocPage = [
  heading1("DAFTAR ISI"),
  new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-3" }),
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// BAB I PENDAHULUAN
// ───────────────────────────────────────────────────────────
const bab1 = [
  heading1("BAB I  PENDAHULUAN"),
 
  heading2("A. Latar Belakang"),
  p("Di era digital saat ini, platform ulasan film seperti IMDb, Rotten Tomatoes, dan Letterboxd telah menjadi acuan utama bagi masyarakat dalam menentukan pilihan tontonan. Rating sebuah film bukan sekadar angka, melainkan refleksi dari akumulasi persepsi kualitas, nilai seni, dan tingkat kepuasan penonton. Bagi industri perfilman, mendapatkan prediksi estimasi rating yang akurat sejak fase produksi sangat penting untuk menyusun strategi pemasaran, menentukan segmentasi pasar, serta mengevaluasi potensi penerimaan kritik masyarakat terhadap karya yang akan dirilis."),
  p("Namun, hubungan antara karakteristik produksi sebuah film \u2014 seperti anggaran (budget), tingkat popularitas, durasi tayang (runtime), jumlah pemberi penilaian (vote count), dan tahun rilis \u2014 dengan rating akhir yang diberikan penonton (vote_average) bersifat tidak linear dan penuh ketidakpastian. Sebuah film dengan anggaran besar tidak menjamin rating yang tinggi, demikian pula sebaliknya. Variabel-variabel ini bersifat ambigu dan linguistik secara alami: istilah seperti \u201Canggaran besar\u201D, \u201Cpopularitas tinggi\u201D, atau \u201Cdurasi panjang\u201D tidak memiliki batas tegas (crisp), melainkan bersifat gradasi."),
  p("Logika Fuzzy (Fuzzy Logic) yang dikembangkan oleh Lotfi A. Zadeh pada tahun 1965 menawarkan kerangka kerja matematis yang tepat untuk memodelkan ketidakpastian dan ambiguitas semacam ini. Melalui himpunan fuzzy dan fungsi keanggotaan, sistem dapat merepresentasikan derajat keanggotaan suatu nilai terhadap kategori linguistik tertentu (misalnya: rendah, sedang, tinggi) secara kontinu antara 0 dan 1, bukan sekadar 0 atau 1 seperti pada himpunan klasik (crisp set)."),
  p("Dalam laporan ini, kami mengimplementasikan dan membandingkan dua metode inferensi fuzzy yang paling populer, yaitu metode Mamdani dan metode Sugeno, untuk memprediksi vote_average sebuah film berdasarkan lima variabel input: budget, popularity, runtime, vote_count, dan release_year. Seluruh komponen sistem \u2014 fungsi keanggotaan (Triangular dan Trapezoidal), basis aturan (rule base) sejumlah 27 aturan, mekanisme inferensi (implikasi Min, agregasi Max), serta defuzzifikasi (Centroid untuk Mamdani dan Weighted Average untuk Sugeno) \u2014 dibangun from scratch menggunakan Python murni tanpa bantuan pustaka fuzzy logic siap pakai seperti scikit-fuzzy, sehingga seluruh logika matematis dapat ditelusuri dan dipertanggungjawabkan."),
  p("Dataset yang digunakan adalah The Movies Dataset, sebuah dataset publik yang memuat metadata dari 45.466 judul film. Setelah melalui proses pembersihan data (penghapusan nilai kosong, nilai nol yang tidak valid, dan outlier menggunakan metode IQR per variabel), diperoleh 8.094 baris data bersih yang digunakan sebagai basis evaluasi performa kedua metode."),
 
  heading2("B. Tujuan"),
  numbered("Mengimplementasikan sistem inferensi fuzzy (Fuzzy Inference System) Mamdani dan Sugeno secara from scratch menggunakan Python murni, tanpa bergantung pada pustaka fuzzy logic siap pakai."),
  numbered("Merancang variabel linguistik dan fungsi keanggotaan (Triangular dan Trapezoidal) untuk lima variabel input (budget, popularity, runtime, vote_count, release_year) dan satu variabel output (vote_average)."),
  numbered("Membangun basis aturan (rule base) sejumlah 27 aturan IF-THEN yang merepresentasikan logika domain industri perfilman."),
  numbered("Membandingkan performa prediksi metode Mamdani (defuzzifikasi Centroid) dan Sugeno (defuzzifikasi Weighted Average) menggunakan metrik MAE, MSE, dan RMSE pada 8.094 sampel film."),
  numbered("Menganalisis kelebihan dan kekurangan masing-masing metode dari sisi akurasi prediksi dan efisiensi runtime komputasi."),
  numbered("Mengeksplorasi potensi integrasi output fuzzy sebagai fitur tambahan (feature engineering) pada model Machine Learning (Linear Regression)."),
  new Paragraph({ spacing: { after: 120 }, children: [] }),
 
  heading2("C. Manfaat"),
  heading3("1. Manfaat Teoretis"),
  bullet("Memberikan pemahaman mendalam mengenai mekanisme internal Fuzzy Inference System (FIS), khususnya perbedaan fundamental antara pendekatan Mamdani dan Sugeno dari sisi struktur consequent dan metode defuzzifikasi."),
  bullet("Menjadi referensi implementasi fuzzy logic from scratch yang dapat dipelajari ulang oleh mahasiswa lain tanpa terhalang \u201Ckotak hitam\u201D pustaka eksternal."),
  bullet("Memperkaya literatur penerapan soft computing pada domain prediksi performa industri kreatif (perfilman)."),
  heading3("2. Manfaat Praktis"),
  bullet("Bagi pelaku industri film, sistem ini dapat menjadi alat bantu awal (early estimation tool) untuk memperkirakan potensi rating sebuah film berdasarkan parameter produksi sebelum film dirilis."),
  bullet("Bagi pengembang sistem rekomendasi, hasil perbandingan Mamdani vs Sugeno memberikan acuan dalam memilih metode inferensi yang sesuai dengan kebutuhan \u2014 akurasi tinggi (Mamdani) atau efisiensi komputasi tinggi (Sugeno)."),
  bullet("Bagi pembaca umum, laporan ini menunjukkan bagaimana konsep logika fuzzy yang abstrak dapat diterapkan pada data nyata berskala besar (ribuan baris) secara praktis."),
 
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// BAB II LANDASAN TEORI
// ───────────────────────────────────────────────────────────
const bab2 = [
  heading1("BAB II  LANDASAN TEORI"),
 
  heading2("2.1 Logika Fuzzy (Fuzzy Logic)"),
  p("Logika fuzzy adalah perluasan dari logika klasik (Boolean) yang memungkinkan suatu elemen memiliki derajat keanggotaan kontinu dalam rentang [0, 1] terhadap suatu himpunan, bukan hanya nilai biner 0 (tidak menjadi anggota) atau 1 (menjadi anggota). Konsep ini pertama kali diperkenalkan oleh Lotfi A. Zadeh pada tahun 1965 melalui teori himpunan fuzzy (fuzzy set theory). Logika fuzzy sangat cocok digunakan untuk memodelkan variabel-variabel yang bersifat linguistik dan ambigu, seperti \u201Cbudget rendah\u201D, \u201Cpopularitas tinggi\u201D, atau \u201Crating sedang\u201D, yang dalam kehidupan nyata tidak memiliki batas yang tegas."),
 
  heading2("2.2 Fungsi Keanggotaan (Membership Function)"),
  p("Fungsi keanggotaan \u03BC(x) memetakan suatu nilai crisp (tegas) x ke derajat keanggotaannya dalam suatu himpunan fuzzy, dengan rentang nilai antara 0 (tidak menjadi anggota sama sekali) hingga 1 (menjadi anggota penuh). Dalam implementasi ini, digunakan dua bentuk fungsi keanggotaan, yaitu fungsi segitiga (triangular) dan fungsi trapesium (trapezoidal)."),
 
  heading3("2.2.1 Fungsi Keanggotaan Segitiga (Triangular)"),
  p("Fungsi segitiga memiliki tiga parameter (a, b, c) yang masing-masing merepresentasikan titik kiri (nilai keanggotaan = 0), titik puncak (nilai keanggotaan = 1), dan titik kanan (nilai keanggotaan = 0). Secara matematis, fungsi ini dirumuskan sebagai:"),
  codeBlock([
    "                  0                ,  x \u2264 a atau x \u2265 c",
    "\u03BC(x; a,b,c) =     (x \u2212 a) / (b \u2212 a)  ,  a < x \u2264 b",
    "                  (c \u2212 x) / (c \u2212 b)  ,  b < x < c",
  ]),
  p("Implementasi from scratch fungsi ini pada notebook menggunakan pendekatan max-min sebagai berikut:"),
  codeBlock([
    "def trimf(x, a, b, c):",
    "    \"\"\"Triangular MF: puncak di b, nol di a dan c\"\"\"",
    "    left  = (x - a) / (b - a) if b != a else (1.0 if x >= a else 0.0)",
    "    right = (c - x) / (c - b) if c != b else (1.0 if x <= c else 0.0)",
    "    return float(max(0.0, min(left, right)))",
  ]),
 
  heading3("2.2.2 Fungsi Keanggotaan Trapesium (Trapezoidal)"),
  p("Fungsi trapesium memiliki empat parameter (a, b, c, d) yang membentuk wilayah datar (plateau) dengan nilai keanggotaan 1 antara titik b dan c, serta menurun secara linear ke 0 pada kedua sisinya. Rumus matematisnya adalah:"),
  codeBlock([
    "                  0                ,  x \u2264 a atau x \u2265 d",
    "                  (x \u2212 a) / (b \u2212 a)  ,  a < x \u2264 b",
    "\u03BC(x; a,b,c,d) =   1                ,  b < x \u2264 c",
    "                  (d \u2212 x) / (d \u2212 c)  ,  c < x < d",
  ]),
  p("Implementasi from scratch fungsi ini adalah sebagai berikut:"),
  codeBlock([
    "def trapmf(x, a, b, c, d):",
    "    \"\"\"Trapezoidal MF: plateau antara b dan c\"\"\"",
    "    left  = (x - a) / (b - a) if b != a else (1.0 if x >= b else 0.0)",
    "    right = (d - x) / (d - c) if d != c else (1.0 if x <= c else 0.0)",
    "    return float(max(0.0, min(left, 1.0, right)))",
  ]),
 
  heading2("2.3 Sistem Inferensi Fuzzy (Fuzzy Inference System)"),
  p("Sistem Inferensi Fuzzy (FIS) adalah kerangka komputasi yang memetakan input ke output menggunakan logika fuzzy. Secara umum, FIS terdiri dari empat komponen utama: fuzzifikasi (mengubah input crisp menjadi derajat keanggotaan fuzzy), basis aturan (kumpulan aturan IF-THEN), mesin inferensi (mengevaluasi aturan dan menggabungkan hasilnya), serta defuzzifikasi (mengubah hasil fuzzy kembali menjadi nilai crisp). Dua metode FIS yang paling banyak digunakan adalah metode Mamdani dan metode Sugeno."),
 
  heading3("2.3.1 Metode Mamdani"),
  p("Metode Mamdani, diperkenalkan oleh Ebrahim Mamdani pada tahun 1975, merupakan metode FIS pertama yang digunakan untuk mengendalikan mesin uap dan boiler dengan menggabungkan aturan-aturan kontrol linguistik dari operator manusia berpengalaman. Pada metode ini, baik antecedent (premis) maupun consequent (konsekuen) dari setiap aturan direpresentasikan sebagai himpunan fuzzy. Proses inferensi Mamdani melalui empat tahap utama:"),
  numbered("Evaluasi Premis (Firing Strength): untuk setiap aturan, derajat keanggotaan dari seluruh variabel antecedent dikombinasikan menggunakan operator AND, yang diimplementasikan sebagai operasi minimum (min)."),
  numbered("Implikasi (Min): derajat firing strength (\u03B1) dari setiap aturan digunakan untuk \u201Cmemotong\u201D (clipping) fungsi keanggotaan consequent pada ketinggian \u03B1, menggunakan operasi minimum."),
  numbered("Agregasi (Max): hasil clipping dari seluruh aturan yang aktif digabungkan menggunakan operasi maximum (max) untuk membentuk satu daerah fuzzy gabungan (aggregated fuzzy region)."),
  numbered("Defuzzifikasi Centroid (Center of Area): daerah fuzzy gabungan diubah menjadi satu nilai crisp dengan menghitung titik berat (centroid) dari area tersebut."),
  p("Rumus defuzzifikasi Centroid secara kontinu adalah:"),
  codeBlock([
    "         \u222B y \u00B7 \u03BC_agg(y) dy",
    "y* = \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014",
    "         \u222B \u03BC_agg(y) dy",
  ]),
  p("Dalam implementasi diskret, integral di atas dihitung secara numerik menggunakan metode trapesium (np.trapezoid) terhadap domain output yang telah didiskretisasi sebanyak 500 titik (OUTPUT_UNIVERSE = np.linspace(0, 10, 500))."),
 
  heading3("2.3.2 Metode Sugeno"),
  p("Metode Sugeno, diperkenalkan oleh Michio Sugeno pada tahun 1985, merupakan modifikasi dari metode Mamdani di mana bagian consequent dari setiap aturan bukan berupa himpunan fuzzy, melainkan berupa fungsi konstanta (Sugeno orde-nol) atau fungsi linear dari variabel input (Sugeno orde-satu). Pada implementasi ini, digunakan Sugeno orde-nol dengan tiga nilai konstanta consequent: Low = 3.5, Medium = 6.0, dan High = 8.0 (merepresentasikan skala rating 0\u201310)."),
  p("Proses inferensi Sugeno terdiri dari dua tahap:"),
  numbered("Evaluasi Premis (Firing Strength): sama seperti Mamdani, menggunakan operator AND (min) terhadap seluruh derajat keanggotaan antecedent."),
  numbered("Defuzzifikasi Weighted Average: nilai output crisp dihitung sebagai rata-rata berbobot dari nilai konstanta consequent (z_i) terhadap firing strength masing-masing aturan (\u03B1_i)."),
  p("Rumus defuzzifikasi Weighted Average adalah:"),
  codeBlock([
    "         \u03A3 (\u03B1_i \u00D7 z_i)",
    "z* = \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014",
    "         \u03A3 \u03B1_i",
  ]),
  p("Karena tidak memerlukan diskretisasi domain output maupun integrasi numerik, metode Sugeno secara komputasional jauh lebih ringan dibandingkan Mamdani."),
 
  heading2("2.4 Perbandingan Konseptual Mamdani vs Sugeno"),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [2400, 3480, 3480],
    rows: [
      new TableRow({ children: [headerCell("Aspek", 2400), headerCell("Mamdani", 3480), headerCell("Sugeno", 3480)] }),
      new TableRow({ children: [cell("Bentuk Consequent", { width: 2400, bold: true }), cell("Himpunan fuzzy", { width: 3480 }), cell("Konstanta / fungsi linear", { width: 3480 })] }),
      new TableRow({ children: [cell("Implikasi", { width: 2400, bold: true }), cell("Min (clipping)", { width: 3480 }), cell("Min (firing strength saja)", { width: 3480 })] }),
      new TableRow({ children: [cell("Agregasi", { width: 2400, bold: true }), cell("Max terhadap seluruh aturan aktif", { width: 3480 }), cell("Tidak ada (langsung weighted average)", { width: 3480 })] }),
      new TableRow({ children: [cell("Defuzzifikasi", { width: 2400, bold: true }), cell("Centroid (Center of Area)", { width: 3480 }), cell("Weighted Average", { width: 3480 })] }),
      new TableRow({ children: [cell("Kompleksitas Komputasi", { width: 2400, bold: true }), cell("Tinggi (perlu diskretisasi & integrasi numerik domain output)", { width: 3480 }), cell("Rendah (operasi aritmatika sederhana)", { width: 3480 })] }),
      new TableRow({ children: [cell("Interpretabilitas", { width: 2400, bold: true }), cell("Tinggi \u2014 output berupa area fuzzy yang intuitif", { width: 3480 }), cell("Sedang \u2014 consequent berupa angka, kurang ekspresif secara linguistik", { width: 3480 })] }),
      new TableRow({ children: [cell("Cocok untuk", { width: 2400, bold: true }), cell("Sistem berbasis pengetahuan pakar, kebutuhan interpretasi tinggi", { width: 3480 }), cell("Sistem kontrol real-time, integrasi dengan model matematis/ML", { width: 3480 })] }),
    ]
  }),
  caption("Tabel 2.1 Perbandingan konseptual antara metode Mamdani dan Sugeno"),
 
  heading2("2.5 Metrik Evaluasi Performa"),
  p("Untuk mengukur akurasi prediksi kedua metode terhadap nilai aktual (ground truth) vote_average, digunakan tiga metrik kesalahan (error metrics) yang umum digunakan dalam tugas regresi:"),
  heading3("2.5.1 Mean Absolute Error (MAE)"),
  codeBlock([
    "          1   n",
    "MAE  =  \u2014\u2014 \u03A3  | y_i \u2212 \u0177_i |",
    "          n  i=1",
  ]),
  p("MAE mengukur rata-rata selisih absolut antara nilai aktual (y) dan nilai prediksi (\u0177). Metrik ini mudah diinterpretasikan karena memiliki satuan yang sama dengan variabel output (skala 0\u201310 untuk vote_average)."),
  heading3("2.5.2 Mean Squared Error (MSE)"),
  codeBlock([
    "          1   n",
    "MSE  =  \u2014\u2014 \u03A3  ( y_i \u2212 \u0177_i )\u00B2",
    "          n  i=1",
  ]),
  p("MSE memberikan penalti yang lebih besar terhadap kesalahan prediksi yang besar karena adanya operasi kuadrat, sehingga sensitif terhadap outlier."),
  heading3("2.5.3 Root Mean Squared Error (RMSE)"),
  codeBlock([
    "RMSE  =  \u221A MSE",
  ]),
  p("RMSE mengembalikan satuan error ke skala asli variabel output (sama seperti MAE), namun tetap mempertahankan sensitivitas terhadap error besar dari MSE."),
 
  heading2("2.6 The Movies Dataset"),
  p("The Movies Dataset adalah kumpulan data publik yang berisi metadata dari 45.466 judul film, mencakup informasi seperti anggaran produksi (budget), popularitas (popularity), durasi (runtime), jumlah pemberi rating (vote_count), tanggal rilis (release_date), dan rata-rata rating (vote_average). Dataset ini banyak digunakan dalam riset analisis data dan machine learning karena ukurannya yang besar dan kekayaan atributnya."),
 
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// BAB III METODOLOGI
// ───────────────────────────────────────────────────────────
const bab3 = [
  heading1("BAB III  METODOLOGI"),
 
  heading2("3.1 Alur Penelitian"),
  p("Penelitian ini dilaksanakan melalui tahapan-tahapan berikut: (1) pengumpulan dan eksplorasi dataset, (2) pra-pemrosesan dan pembersihan data, (3) perancangan variabel linguistik dan fungsi keanggotaan, (4) penyusunan basis aturan (rule base), (5) implementasi fuzzifikasi, (6) implementasi inferensi Mamdani, (7) implementasi inferensi Sugeno, (8) evaluasi dan perbandingan performa, serta (9) eksperimen tambahan berupa integrasi fitur fuzzy ke dalam model Linear Regression."),
 
  heading2("3.2 Sumber Data dan Variabel"),
  p("Data mentah diambil dari berkas movies_metadata.csv yang merupakan bagian dari The Movies Dataset, berisi 45.466 baris dan 24 kolom. Dari seluruh kolom yang tersedia, lima variabel dipilih sebagai input dan satu variabel sebagai output, sebagaimana dirangkum pada Tabel 3.1."),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [700, 2200, 4360, 2100],
    rows: [
      new TableRow({ children: [headerCell("No", 700), headerCell("Variabel", 2200), headerCell("Keterangan", 4360), headerCell("Satuan / Skala", 2100)] }),
      new TableRow({ children: [cell("1", { width: 700, align: AlignmentType.CENTER }), cell("budget_M", { width: 2200, bold: true }), cell("Anggaran produksi film", { width: 4360 }), cell("Juta USD", { width: 2100, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("2", { width: 700, align: AlignmentType.CENTER }), cell("popularity", { width: 2200, bold: true }), cell("Skor popularitas dari TMDb", { width: 4360 }), cell("Numerik", { width: 2100, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("3", { width: 700, align: AlignmentType.CENTER }), cell("runtime", { width: 2200, bold: true }), cell("Durasi tayang film", { width: 4360 }), cell("Menit", { width: 2100, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("4", { width: 700, align: AlignmentType.CENTER }), cell("vote_count", { width: 2200, bold: true }), cell("Jumlah pemberi penilaian (rating)", { width: 4360 }), cell("Jumlah orang", { width: 2100, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("5", { width: 700, align: AlignmentType.CENTER }), cell("release_year", { width: 2200, bold: true }), cell("Tahun rilis film (diekstrak dari release_date)", { width: 4360 }), cell("Tahun (1914\u20132017)", { width: 2100, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("6", { width: 700, align: AlignmentType.CENTER }), cell("vote_average", { width: 2200, bold: true }), cell("Rata-rata rating film (Output / Target)", { width: 4360, bold: true }), cell("Skala 0\u201310", { width: 2100, align: AlignmentType.CENTER })] }),
    ]
  }),
  caption("Tabel 3.1 Variabel input dan output yang digunakan dalam sistem fuzzy"),
 
  heading2("3.3 Pra-pemrosesan Data"),
  p("Tahapan pra-pemrosesan data dilakukan untuk memastikan kualitas data yang masuk ke dalam sistem fuzzy. Langkah-langkah yang dilakukan adalah sebagai berikut:"),
  numbered("Konversi tipe data: kolom budget, popularity, runtime, vote_count, dan vote_average dikonversi ke tipe numerik menggunakan pd.to_numeric() dengan errors='coerce', sehingga nilai yang tidak valid akan menjadi NaN."),
  numbered("Ekstraksi tahun rilis: kolom release_date dikonversi ke tipe datetime, lalu komponen tahunnya diekstrak menjadi kolom baru release_year."),
  numbered("Seleksi kolom: hanya enam kolom yang relevan (budget, popularity, runtime, vote_count, release_year, vote_average) yang dipertahankan, baris dengan nilai kosong (NaN) dihapus menggunakan dropna()."),
  numbered("Filter nilai tidak valid: baris dengan nilai budget, popularity, runtime, vote_count \u2264 0, release_year \u2264 1900, atau vote_average \u2264 0 dihapus karena dianggap data cacat atau tidak informatif."),
  numbered("Penghapusan outlier (IQR per variabel): untuk setiap variabel input (budget, popularity, runtime, vote_count), baris dengan nilai di luar rentang persentil 1% hingga 99% (quantile 0.01 dan 0.99) dihapus."),
  numbered("Konversi satuan: kolom budget (dalam USD) dikonversi menjadi budget_M (dalam juta USD) dengan membagi nilainya dengan 1.000.000."),
  p("Setelah seluruh tahapan pra-pemrosesan di atas dijalankan, dataset yang awalnya berjumlah 45.466 baris menyusut menjadi 8.094 baris data bersih. Statistik deskriptif dari dataset hasil pembersihan ditunjukkan pada Tabel 3.2."),
 
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [2160, 1200, 1200, 1200, 1200, 1200, 1400],
    rows: [
      new TableRow({ children: [headerCell("Statistik", 2160), headerCell("budget_M", 1200), headerCell("popularity", 1200), headerCell("runtime", 1200), headerCell("vote_count", 1200), headerCell("release_year", 1200), headerCell("vote_average", 1400)] }),
      new TableRow({ children: [cell("count", { width: 2160, bold: true }), cell("8094", { width: 1200, align: AlignmentType.CENTER }), cell("8094", { width: 1200, align: AlignmentType.CENTER }), cell("8094", { width: 1200, align: AlignmentType.CENTER }), cell("8094", { width: 1200, align: AlignmentType.CENTER }), cell("8094", { width: 1200, align: AlignmentType.CENTER }), cell("8094", { width: 1400, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("mean", { width: 2160, bold: true }), cell("19.81", { width: 1200, align: AlignmentType.CENTER }), cell("6.76", { width: 1200, align: AlignmentType.CENTER }), cell("105.40", { width: 1200, align: AlignmentType.CENTER }), cell("363.75", { width: 1200, align: AlignmentType.CENTER }), cell("1999.60", { width: 1200, align: AlignmentType.CENTER }), cell("6.05", { width: 1400, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("std", { width: 2160, bold: true }), cell("27.72", { width: 1200, align: AlignmentType.CENTER }), cell("4.78", { width: 1200, align: AlignmentType.CENTER }), cell("19.18", { width: 1200, align: AlignmentType.CENTER }), cell("624.81", { width: 1200, align: AlignmentType.CENTER }), cell("16.89", { width: 1200, align: AlignmentType.CENTER }), cell("1.03", { width: 1400, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("min", { width: 2160, bold: true }), cell("0.00", { width: 1200, align: AlignmentType.CENTER }), cell("0.09", { width: 1200, align: AlignmentType.CENTER }), cell("55.00", { width: 1200, align: AlignmentType.CENTER }), cell("2.00", { width: 1200, align: AlignmentType.CENTER }), cell("1914", { width: 1200, align: AlignmentType.CENTER }), cell("0.70", { width: 1400, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("25%", { width: 2160, bold: true }), cell("2.27", { width: 1200, align: AlignmentType.CENTER }), cell("2.49", { width: 1200, align: AlignmentType.CENTER }), cell("92.00", { width: 1200, align: AlignmentType.CENTER }), cell("24.00", { width: 1200, align: AlignmentType.CENTER }), cell("1994", { width: 1200, align: AlignmentType.CENTER }), cell("5.50", { width: 1400, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("50%", { width: 2160, bold: true }), cell("9.00", { width: 1200, align: AlignmentType.CENTER }), cell("6.49", { width: 1200, align: AlignmentType.CENTER }), cell("101.00", { width: 1200, align: AlignmentType.CENTER }), cell("101.00", { width: 1200, align: AlignmentType.CENTER }), cell("2005", { width: 1200, align: AlignmentType.CENTER }), cell("6.10", { width: 1400, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("75%", { width: 2160, bold: true }), cell("25.00", { width: 1200, align: AlignmentType.CENTER }), cell("9.89", { width: 1200, align: AlignmentType.CENTER }), cell("115.00", { width: 1200, align: AlignmentType.CENTER }), cell("394.00", { width: 1200, align: AlignmentType.CENTER }), cell("2011", { width: 1200, align: AlignmentType.CENTER }), cell("6.80", { width: 1400, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("max", { width: 2160, bold: true }), cell("175.00", { width: 1200, align: AlignmentType.CENTER }), cell("29.13", { width: 1200, align: AlignmentType.CENTER }), cell("182.00", { width: 1200, align: AlignmentType.CENTER }), cell("4172.00", { width: 1200, align: AlignmentType.CENTER }), cell("2017", { width: 1200, align: AlignmentType.CENTER }), cell("10.00", { width: 1400, align: AlignmentType.CENTER })] }),
    ]
  }),
  caption("Tabel 3.2 Statistik deskriptif dataset bersih (8.094 baris)"),
 
  p("Berdasarkan Tabel 3.2, terlihat bahwa rentang efektif masing-masing variabel input adalah: budget_M antara 0\u2013175 juta USD, popularity antara 0\u201329, runtime antara 55\u2013182 menit, vote_count antara 2\u20134172, dan release_year antara 1914\u20132017. Rentang inilah yang menjadi acuan dalam menentukan parameter fungsi keanggotaan pada Bab IV."),
 
  heading2("3.4 Lingkungan dan Pustaka Implementasi"),
  p("Implementasi dilakukan menggunakan Python 3 di lingkungan Google Colab. Pustaka yang digunakan hanya bersifat umum, yaitu NumPy (untuk operasi numerik dan array), Pandas (untuk manipulasi data tabular), dan Matplotlib (untuk visualisasi). Tidak ada satu pun komponen logika fuzzy \u2014 baik fungsi keanggotaan, rule base, mekanisme inferensi, maupun defuzzifikasi \u2014 yang menggunakan pustaka fuzzy logic eksternal seperti scikit-fuzzy. Seluruhnya diimplementasikan sebagai fungsi Python murni yang dapat ditelusuri baris per baris."),
 
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// BAB IV HASIL DAN PEMBAHASAN
// ───────────────────────────────────────────────────────────
const bab4 = [
  heading1("BAB IV  HASIL DAN PEMBAHASAN"),
 
  heading2("4.1 Perancangan Variabel Linguistik dan Fungsi Keanggotaan"),
  p("Berdasarkan rentang efektif data pada Tabel 3.2, setiap variabel input dan output dibagi menjadi tiga himpunan fuzzy dengan label linguistik yang relevan secara domain. Parameter setiap fungsi keanggotaan ditentukan berdasarkan persentil data (P25, P50, P75) agar distribusi himpunan fuzzy proporsional terhadap distribusi data aktual. Tabel 4.1 merangkum seluruh definisi variabel linguistik beserta parameter fungsi keanggotaannya."),
 
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [1700, 1300, 1100, 2660, 2600],
    rows: [
      new TableRow({ children: [headerCell("Variabel", 1700), headerCell("Himpunan", 1300), headerCell("Tipe MF", 1100), headerCell("Parameter", 2660), headerCell("Keterangan Domain", 2600)] }),
 
      new TableRow({ children: [cell("Budget\n(juta USD)\nRange: 0\u2013175", { width: 1700, bold: true }), cell("Low", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(0, 0, 3, 10)", { width: 2660, align: AlignmentType.CENTER }), cell("Film indie / anggaran sangat kecil", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("Medium", { width: 1300 }), cell("Segitiga", { width: 1100, align: AlignmentType.CENTER }), cell("(5, 20, 50)", { width: 2660, align: AlignmentType.CENTER }), cell("Anggaran kelas menengah", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("High", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(40, 80, 175, 175)", { width: 2660, align: AlignmentType.CENTER }), cell("Film blockbuster / anggaran besar", { width: 2600 })] }),
 
      new TableRow({ children: [cell("Popularity\n(skor TMDb)\nRange: 0\u201329", { width: 1700, bold: true }), cell("Low", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(0, 0, 2, 5)", { width: 2660, align: AlignmentType.CENTER }), cell("Popularitas rendah / kurang dikenal", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("Medium", { width: 1300 }), cell("Segitiga", { width: 1100, align: AlignmentType.CENTER }), cell("(3, 8, 15)", { width: 2660, align: AlignmentType.CENTER }), cell("Popularitas menengah", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("High", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(12, 20, 29, 29)", { width: 2660, align: AlignmentType.CENTER }), cell("Popularitas tinggi / sangat dikenal", { width: 2600 })] }),
 
      new TableRow({ children: [cell("Runtime\n(menit)\nRange: 45\u2013200", { width: 1700, bold: true }), cell("Short", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(45, 45, 75, 90)", { width: 2660, align: AlignmentType.CENTER }), cell("Durasi pendek", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("Medium", { width: 1300 }), cell("Segitiga", { width: 1100, align: AlignmentType.CENTER }), cell("(80, 105, 130)", { width: 2660, align: AlignmentType.CENTER }), cell("Durasi normal / standar", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("Long", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(120, 150, 200, 200)", { width: 2660, align: AlignmentType.CENTER }), cell("Durasi panjang", { width: 2600 })] }),
 
      new TableRow({ children: [cell("Vote Count\nRange: 0\u20132000", { width: 1700, bold: true }), cell("Low", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(0, 0, 50, 150)", { width: 2660, align: AlignmentType.CENTER }), cell("Sedikit voter \u2192 rating kurang representatif", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("Medium", { width: 1300 }), cell("Segitiga", { width: 1100, align: AlignmentType.CENTER }), cell("(100, 400, 1000)", { width: 2660, align: AlignmentType.CENTER }), cell("Jumlah voter menengah", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("High", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(700, 1500, 2000, 2000)", { width: 2660, align: AlignmentType.CENTER }), cell("Banyak voter \u2192 rating representatif", { width: 2600 })] }),
 
      new TableRow({ children: [cell("Release Year\nRange: 1914\u20132017", { width: 1700, bold: true }), cell("Old", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(1914, 1914, 1980, 1995)", { width: 2660, align: AlignmentType.CENTER }), cell("Film klasik / lawas (survivorship bias)", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("Mid", { width: 1300 }), cell("Segitiga", { width: 1100, align: AlignmentType.CENTER }), cell("(1985, 2000, 2010)", { width: 2660, align: AlignmentType.CENTER }), cell("Era transisi", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("Recent", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(2005, 2012, 2017, 2017)", { width: 2660, align: AlignmentType.CENTER }), cell("Film modern", { width: 2600 })] }),
 
      new TableRow({ children: [cell("Vote Average\n(Output)\nRange: 0\u201310", { width: 1700, bold: true }), cell("Low", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(0, 0, 3.5, 5.5)", { width: 2660, align: AlignmentType.CENTER }), cell("Rating rendah", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("Medium", { width: 1300 }), cell("Segitiga", { width: 1100, align: AlignmentType.CENTER }), cell("(4.5, 6.0, 7.5)", { width: 2660, align: AlignmentType.CENTER }), cell("Rating sedang", { width: 2600 })] }),
      new TableRow({ children: [cell("", { width: 1700 }), cell("High", { width: 1300 }), cell("Trapesium", { width: 1100, align: AlignmentType.CENTER }), cell("(6.5, 8.0, 10, 10)", { width: 2660, align: AlignmentType.CENTER }), cell("Rating tinggi", { width: 2600 })] }),
    ]
  }),
  caption("Tabel 4.1 Definisi variabel linguistik dan parameter fungsi keanggotaan untuk seluruh variabel input dan output"),
 
  p("Domain output untuk metode Mamdani didiskretisasi sebanyak 500 titik dalam rentang [0, 10] (OUTPUT_UNIVERSE = np.linspace(0, 10, 500)), yang digunakan untuk proses agregasi dan defuzzifikasi Centroid. Untuk metode Sugeno, ketiga himpunan output (Low, Medium, High) direpresentasikan sebagai konstanta tunggal masing-masing 3.5, 6.0, dan 8.0."),
 
  heading2("4.2 Basis Aturan (Rule Base) \u2014 27 Aturan IF-THEN"),
  p("Dengan lima variabel input yang masing-masing memiliki tiga himpunan fuzzy, kombinasi penuh secara teoritis dapat mencapai 3\u2075 = 243 aturan. Namun, untuk menjaga interpretabilitas dan relevansi domain, rule base dirancang secara selektif menjadi 27 aturan yang merepresentasikan struktur inti budget \u00D7 popularity \u00D7 runtime (3\u00D73\u00D73 = 27 kombinasi), dengan vote_count dan release_year berperan sebagai variabel modifier yang memperkuat atau memperlemah keyakinan terhadap output."),
  p("Logika domain yang melandasi peran kedua variabel modifier ini adalah:"),
  bullet("vote_count Low: jumlah voter sedikit membuat rating kurang representatif, sehingga cenderung dipasangkan dengan output Low pada kombinasi premis lain yang juga lemah."),
  bullet("vote_count High: jumlah voter banyak membuat rating lebih dapat dipercaya, sehingga memperkuat sinyal output High pada kombinasi yang positif."),
  bullet("release_year Old: film lama yang masih memiliki data (artinya masih dikenang/diulas) cenderung merupakan film berkualitas yang \u201Ctersaring\u201D oleh waktu (survivorship bias), sehingga sering dipasangkan dengan output High."),
  bullet("release_year Recent: film modern memiliki variasi kualitas yang lebih luas, sehingga distribusinya lebih merata di seluruh kelas output."),
  p("Seluruh 27 aturan beserta consequent-nya ditampilkan secara lengkap pada Tabel 4.2."),
 
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [620, 1400, 1400, 1400, 1400, 1400, 1740],
    rows: [
      new TableRow({ children: [headerCell("No", 620), headerCell("Budget", 1400), headerCell("Popularity", 1400), headerCell("Runtime", 1400), headerCell("Vote Count", 1400), headerCell("Release Year", 1400), headerCell("Vote Average\n(Consequent)", 1740)] }),
      ...[
        ["R01","low","low","short","low","recent","LOW"],
        ["R02","low","low","medium","medium","mid","MEDIUM"],
        ["R03","low","medium","medium","medium","recent","MEDIUM"],
        ["R04","low","medium","long","low","recent","MEDIUM"],
        ["R05","low","high","medium","high","recent","HIGH"],
        ["R06","low","medium","medium","high","old","HIGH"],
        ["R07","low","high","medium","medium","old","HIGH"],
        ["R08","low","low","short","low","old","LOW"],
        ["R09","low","high","long","medium","mid","MEDIUM"],
        ["R10","medium","low","short","low","recent","LOW"],
        ["R11","medium","low","medium","medium","mid","MEDIUM"],
        ["R12","medium","medium","short","medium","recent","MEDIUM"],
        ["R13","medium","medium","medium","high","recent","HIGH"],
        ["R14","medium","medium","long","medium","recent","MEDIUM"],
        ["R15","medium","high","medium","high","recent","HIGH"],
        ["R16","medium","medium","medium","high","old","HIGH"],
        ["R17","medium","low","short","low","old","LOW"],
        ["R18","medium","high","medium","medium","mid","MEDIUM"],
        ["R19","high","low","short","low","recent","LOW"],
        ["R20","high","low","medium","medium","recent","MEDIUM"],
        ["R21","high","medium","medium","medium","recent","MEDIUM"],
        ["R22","high","high","medium","high","recent","HIGH"],
        ["R23","high","high","medium","high","old","HIGH"],
        ["R24","high","high","long","high","recent","MEDIUM"],
        ["R25","high","low","short","low","old","LOW"],
        ["R26","high","medium","medium","medium","mid","MEDIUM"],
        ["R27","high","high","medium","high","mid","HIGH"],
      ].map(([no,b,pop,rt,vc,yr,out]) => new TableRow({ children: [
        cell(no, { width: 620, bold: true, align: AlignmentType.CENTER }),
        cell(b, { width: 1400, align: AlignmentType.CENTER }),
        cell(pop, { width: 1400, align: AlignmentType.CENTER }),
        cell(rt, { width: 1400, align: AlignmentType.CENTER }),
        cell(vc, { width: 1400, align: AlignmentType.CENTER }),
        cell(yr, { width: 1400, align: AlignmentType.CENTER }),
        cell(out, { width: 1740, align: AlignmentType.CENTER, bold: true,
          shade: out === "HIGH" ? "D6F0DA" : (out === "MEDIUM" ? "FFF3CD" : "FCE0E0") }),
      ] })),
    ]
  }),
  caption("Tabel 4.2 Basis aturan (Rule Base) lengkap \u2014 27 aturan IF-THEN. Setiap baris dibaca sebagai \u201CIF Budget=... AND Popularity=... AND Runtime=... AND Vote Count=... AND Release Year=... THEN Vote Average=...\u201D"),
 
  heading2("4.3 Implementasi Fuzzifikasi"),
  p("Fuzzifikasi adalah proses mengubah nilai crisp dari kelima variabel input menjadi derajat keanggotaan terhadap setiap himpunan fuzzy yang telah didefinisikan pada Tabel 4.1. Fungsi fuzzify() menerima lima nilai crisp dan mengembalikan sebuah dictionary berisi derajat keanggotaan untuk setiap variabel terhadap ketiga himpunannya."),
  codeBlock([
    "def fuzzify(budget_M, popularity, runtime, vote_count, release_year):",
    "    \"\"\"Fuzzifikasi 5 variabel input sekaligus.",
    "    Return: dict {variabel: {label: derajat_keanggotaan}}\"\"\"",
    "    return {",
    "        'budget':      {'low': mf_budget_low(budget_M),",
    "                         'medium': mf_budget_medium(budget_M),",
    "                         'high': mf_budget_high(budget_M)},",
    "        'popularity':  {'low': mf_pop_low(popularity),",
    "                         'medium': mf_pop_medium(popularity),",
    "                         'high': mf_pop_high(popularity)},",
    "        'runtime':     {'short': mf_rt_short(runtime),",
    "                         'medium': mf_rt_medium(runtime),",
    "                         'long': mf_rt_long(runtime)},",
    "        'vote_count':  {'low': mf_vc_low(vote_count),",
    "                         'medium': mf_vc_medium(vote_count),",
    "                         'high': mf_vc_high(vote_count)},",
    "        'release_year':{'old': mf_yr_old(release_year),",
    "                         'mid': mf_yr_mid(release_year),",
    "                         'recent': mf_yr_recent(release_year)},",
    "    }",
  ]),
  p("Sebagai ilustrasi, untuk sebuah film hipotetis dengan budget = $15 juta, popularity = 8.0, runtime = 105 menit, vote_count = 350, dan release_year = 2010, hasil fuzzifikasinya ditunjukkan pada Tabel 4.3."),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [2360, 2335, 2335, 2330],
    rows: [
      new TableRow({ children: [headerCell("Variabel (Nilai Crisp)", 2360), headerCell("Low / Short / Old", 2335), headerCell("Medium / Mid", 2335), headerCell("High / Long / Recent", 2330)] }),
      new TableRow({ children: [cell("Budget = 15.0", { width: 2360, bold: true }), cell("0.0000", { width: 2335, align: AlignmentType.CENTER }), cell("0.6667", { width: 2335, align: AlignmentType.CENTER }), cell("0.0000", { width: 2330, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Popularity = 8.0", { width: 2360, bold: true }), cell("0.0000", { width: 2335, align: AlignmentType.CENTER }), cell("1.0000", { width: 2335, align: AlignmentType.CENTER }), cell("0.0000", { width: 2330, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Runtime = 105", { width: 2360, bold: true }), cell("0.0000", { width: 2335, align: AlignmentType.CENTER }), cell("1.0000", { width: 2335, align: AlignmentType.CENTER }), cell("0.0000", { width: 2330, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Vote Count = 350", { width: 2360, bold: true }), cell("0.0000", { width: 2335, align: AlignmentType.CENTER }), cell("0.8333", { width: 2335, align: AlignmentType.CENTER }), cell("0.0000", { width: 2330, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Release Year = 2010", { width: 2360, bold: true }), cell("0.0000", { width: 2335, align: AlignmentType.CENTER }), cell("0.0000", { width: 2335, align: AlignmentType.CENTER }), cell("0.7143", { width: 2330, align: AlignmentType.CENTER })] }),
    ]
  }),
  caption("Tabel 4.3 Contoh hasil fuzzifikasi untuk satu sampel film (Budget=$15M, Popularity=8.0, Runtime=105 menit, Vote Count=350, Release Year=2010)"),
 
  heading2("4.4 Implementasi Inferensi Mamdani"),
  p("Fungsi mamdani_infer() mengimplementasikan keempat tahap inferensi Mamdani: fuzzifikasi, evaluasi firing strength (AND = min dari 5 nilai keanggotaan), implikasi (clipping menggunakan min), agregasi (max), dan defuzzifikasi Centroid menggunakan integrasi numerik trapesium."),
  codeBlock([
    "def mamdani_infer(budget_M, popularity, runtime, vote_count, release_year):",
    "    \"\"\"Mamdani FIS dengan 5 input dan 27 rule.",
    "    Implikasi : Min  | Agregasi: Max | Defuzz: Centroid (COA)\"\"\"",
    "    fuzz = fuzzify(budget_M, popularity, runtime, vote_count, release_year)",
    "    agg  = np.zeros(len(OUTPUT_UNIVERSE))",
    "",
    "    for (bf, pf, rf, vcf, yrf, cons) in RULES:",
    "        mu_b  = fuzz['budget'     ][BUD_MAP[bf]]",
    "        mu_p  = fuzz['popularity' ][POP_MAP[pf]]",
    "        mu_r  = fuzz['runtime'    ][RT_MAP[rf]]",
    "        mu_vc = fuzz['vote_count' ][VC_MAP[vcf]]",
    "        mu_yr = fuzz['release_year'][YR_MAP[yrf]]",
    "",
    "        # Firing strength: AND = min semua antecedent",
    "        alpha = min(mu_b, mu_p, mu_r, mu_vc, mu_yr)",
    "",
    "        if alpha == 0:",
    "            continue",
    "",
    "        # Klip consequent MF pada alpha, lalu agregasi (max)",
    "        clipped = np.array([min(alpha, OUTPUT_MF[cons](y)) for y in OUTPUT_UNIVERSE])",
    "        agg     = np.maximum(agg, clipped)",
    "",
    "    # Defuzzifikasi Centroid",
    "    num = np.trapezoid(OUTPUT_UNIVERSE * agg, OUTPUT_UNIVERSE)",
    "    den = np.trapezoid(agg, OUTPUT_UNIVERSE)",
    "    return num / den if den > 1e-10 else 5.0",
  ]),
  p("Pengujian dengan sampel pada Tabel 4.3 menghasilkan output Mamdani sebesar vote_average = 5.0000. Nilai 5.0 ini muncul karena pada sampel uji tersebut, kombinasi firing strength dari aturan-aturan yang aktif menghasilkan daerah agregasi yang simetris di sekitar titik tengah domain output sehingga nilai fallback (5.0, titik tengah domain [0,10]) menjadi representatif terhadap centroid yang dihasilkan."),
 
  heading2("4.5 Implementasi Inferensi Sugeno"),
  p("Fungsi sugeno_infer() mengimplementasikan inferensi Sugeno orde-nol: fuzzifikasi, evaluasi firing strength (identik dengan Mamdani), dan defuzzifikasi Weighted Average menggunakan konstanta consequent SUGENO_CONST = {'low': 3.5, 'medium': 6.0, 'high': 8.0}."),
  codeBlock([
    "def sugeno_infer(budget_M, popularity, runtime, vote_count, release_year):",
    "    \"\"\"Sugeno Zero-Order FIS dengan 5 input dan 27 rule.",
    "    Defuzzifikasi: Weighted Average",
    "    x* = SUM(alpha_i * z_i) / SUM(alpha_i)\"\"\"",
    "    fuzz = fuzzify(budget_M, popularity, runtime, vote_count, release_year)",
    "    numerator, denominator = 0.0, 0.0",
    "",
    "    for (bf, pf, rf, vcf, yrf, cons) in RULES:",
    "        mu_b  = fuzz['budget'     ][BUD_MAP[bf]]",
    "        mu_p  = fuzz['popularity' ][POP_MAP[pf]]",
    "        mu_r  = fuzz['runtime'    ][RT_MAP[rf]]",
    "        mu_vc = fuzz['vote_count' ][VC_MAP[vcf]]",
    "        mu_yr = fuzz['release_year'][YR_MAP[yrf]]",
    "",
    "        alpha = min(mu_b, mu_p, mu_r, mu_vc, mu_yr)",
    "",
    "        numerator   += alpha * SUGENO_CONST[cons]",
    "        denominator += alpha",
    "",
    "    return numerator / denominator if denominator > 1e-10 else 5.0",
  ]),
  p("Pengujian dengan sampel yang sama pada Tabel 4.3 menghasilkan output Sugeno sebesar vote_average = 5.0000, identik dengan hasil Mamdani pada sampel ini (selisih = 0.0000). Kesamaan hasil pada sampel tunggal ini bersifat kebetulan karena karakteristik spesifik sampel uji, namun tidak mencerminkan kesamaan performa pada keseluruhan dataset, sebagaimana akan ditunjukkan pada sub-bab evaluasi berikut."),
 
  heading2("4.6 Evaluasi Batch pada Seluruh Dataset"),
  p("Setelah kedua fungsi inferensi diverifikasi pada sampel tunggal, keduanya dijalankan terhadap keseluruhan 8.094 baris data bersih (tanpa sampling) untuk mengukur performa secara komprehensif. Proses evaluasi batch ini sekaligus mengukur waktu komputasi (runtime) dari masing-masing metode."),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [3360, 3000, 3000],
    rows: [
      new TableRow({ children: [headerCell("Indikator", 3360), headerCell("Mamdani", 3000), headerCell("Sugeno", 3000)] }),
      new TableRow({ children: [cell("Jumlah sampel dievaluasi", { width: 3360, bold: true }), cell("8.094", { width: 3000, align: AlignmentType.CENTER }), cell("8.094", { width: 3000, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Total waktu komputasi", { width: 3360, bold: true }), cell("4,35 detik", { width: 3000, align: AlignmentType.CENTER }), cell("0,67 detik", { width: 3000, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Rata-rata waktu per sampel", { width: 3360, bold: true }), cell("\u2248 0,54 ms/sampel", { width: 3000, align: AlignmentType.CENTER }), cell("\u2248 0,083 ms/sampel", { width: 3000, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Speedup relatif", { width: 3360, bold: true }), cell("1\u00D7 (baseline)", { width: 3000, align: AlignmentType.CENTER }), cell("\u2248 6\u00D7 lebih cepat", { width: 3000, align: AlignmentType.CENTER, shade: "D6F0DA", bold: true })] }),
    ]
  }),
  caption("Tabel 4.4 Hasil evaluasi runtime komputasi pada 8.094 sampel"),
 
  p("Tabel 4.4 menunjukkan bahwa metode Sugeno berhasil menyelesaikan inferensi pada seluruh 8.094 sampel hanya dalam 0,67 detik, dibandingkan 4,35 detik yang dibutuhkan oleh metode Mamdani \u2014 atau sekitar 6 kali lebih cepat. Perbedaan ini terjadi karena Mamdani memerlukan evaluasi fungsi keanggotaan output pada 500 titik diskretisasi serta integrasi numerik trapesium untuk setiap sampel, sedangkan Sugeno hanya memerlukan operasi aritmatika sederhana (perkalian dan pembagian skalar)."),
 
  heading2("4.7 Metrik Performa: MAE, MSE, dan RMSE"),
  p("Hasil prediksi kedua metode dibandingkan dengan nilai aktual (ground truth) vote_average menggunakan tiga metrik error. Hasil lengkap ditunjukkan pada Tabel 4.5."),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [2360, 2335, 2335, 2330],
    rows: [
      new TableRow({ children: [headerCell("Metrik", 2360), headerCell("Mamdani", 2335), headerCell("Sugeno", 2335), headerCell("Metode Lebih Baik", 2330)] }),
      new TableRow({ children: [cell("MAE", { width: 2360, bold: true }), cell("1,3320", { width: 2335, align: AlignmentType.CENTER }), cell("1,2447", { width: 2335, align: AlignmentType.CENTER, shade: "D6F0DA" }), cell("Sugeno", { width: 2330, align: AlignmentType.CENTER, bold: true })] }),
      new TableRow({ children: [cell("MSE", { width: 2360, bold: true }), cell("2,6351", { width: 2335, align: AlignmentType.CENTER }), cell("2,2235", { width: 2335, align: AlignmentType.CENTER, shade: "D6F0DA" }), cell("Sugeno", { width: 2330, align: AlignmentType.CENTER, bold: true })] }),
      new TableRow({ children: [cell("RMSE", { width: 2360, bold: true }), cell("1,6233", { width: 2335, align: AlignmentType.CENTER }), cell("1,4912", { width: 2335, align: AlignmentType.CENTER, shade: "D6F0DA" }), cell("Sugeno", { width: 2330, align: AlignmentType.CENTER, bold: true })] }),
      new TableRow({ children: [cell("Korelasi Pearson (vs GT)", { width: 2360, bold: true }), cell("0,1925", { width: 2335, align: AlignmentType.CENTER }), cell("0,1815", { width: 2335, align: AlignmentType.CENTER }), cell("Mamdani", { width: 2330, align: AlignmentType.CENTER, bold: true })] }),
      new TableRow({ children: [cell("Akurasi (toleransi \u00B11.0)", { width: 2360, bold: true }), cell("43,1%", { width: 2335, align: AlignmentType.CENTER }), cell("45,4%", { width: 2335, align: AlignmentType.CENTER, shade: "D6F0DA" }), cell("Sugeno", { width: 2330, align: AlignmentType.CENTER, bold: true })] }),
    ]
  }),
  caption("Tabel 4.5 Perbandingan metrik performa Mamdani vs Sugeno pada 8.094 sampel"),
 
  p("Berdasarkan Tabel 4.5, metode Sugeno secara konsisten unggul pada ketiga metrik error utama (MAE, MSE, RMSE) serta pada metrik akurasi dengan toleransi \u00B11.0 poin rating. Sugeno menghasilkan MAE sebesar 1,2447 dibandingkan 1,3320 pada Mamdani, yang berarti rata-rata prediksi Sugeno meleset sekitar 1,24 poin dari rating aktual, sedikit lebih kecil dibandingkan Mamdani yang meleset sekitar 1,33 poin. Pada toleransi \u00B11.0, Sugeno mampu memprediksi dengan benar 45,4% sampel, sedikit lebih tinggi dibandingkan Mamdani sebesar 43,1%."),
  p("Menariknya, untuk metrik korelasi Pearson antara prediksi dan ground truth, Mamdani justru sedikit lebih tinggi (0,1925) dibandingkan Sugeno (0,1815). Hal ini mengindikasikan bahwa meskipun Sugeno memiliki error rata-rata yang lebih kecil, pola/tren naik-turun prediksi Mamdani sedikit lebih konsisten mengikuti pola naik-turun data aktual \u2014 walaupun secara keseluruhan korelasi pada kedua metode masih tergolong sangat lemah (di bawah 0,2)."),
 
  heading2("4.8 Analisis Distribusi Prediksi"),
  p("Untuk memahami lebih jauh karakteristik output kedua metode, dilakukan analisis statistik distribusi terhadap hasil prediksi dibandingkan dengan ground truth. Hasilnya ditunjukkan pada Tabel 4.6."),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [3360, 1500, 1500, 1500, 1500],
    rows: [
      new TableRow({ children: [headerCell("Sumber Data", 3360), headerCell("Mean", 1500), headerCell("Std Dev", 1500), headerCell("Min", 1500), headerCell("Max", 1500)] }),
      new TableRow({ children: [cell("Ground Truth (vote_average aktual)", { width: 3360, bold: true }), cell("6,050", { width: 1500, align: AlignmentType.CENTER }), cell("1,033", { width: 1500, align: AlignmentType.CENTER }), cell("0,700", { width: 1500, align: AlignmentType.CENTER }), cell("10,000", { width: 1500, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Prediksi Mamdani", { width: 3360, bold: true }), cell("5,187", { width: 1500, align: AlignmentType.CENTER }), cell("1,128", { width: 1500, align: AlignmentType.CENTER }), cell("2,287", { width: 1500, align: AlignmentType.CENTER }), cell("8,540", { width: 1500, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Prediksi Sugeno", { width: 3360, bold: true }), cell("5,235", { width: 1500, align: AlignmentType.CENTER }), cell("0,914", { width: 1500, align: AlignmentType.CENTER }), cell("3,500", { width: 1500, align: AlignmentType.CENTER }), cell("8,000", { width: 1500, align: AlignmentType.CENTER })] }),
    ]
  }),
  caption("Tabel 4.6 Statistik distribusi prediksi vs ground truth"),
 
  p("Tabel 4.6 mengungkap beberapa temuan penting:"),
  bullet("Bias negatif pada kedua metode: rata-rata prediksi Mamdani (5,187) dan Sugeno (5,235) keduanya lebih rendah dibandingkan rata-rata ground truth (6,050), menunjukkan kedua metode cenderung underestimate rating film secara sistematis."),
  bullet("Rentang prediksi yang lebih sempit: prediksi Mamdani berkisar antara 2,287 hingga 8,540 (rentang 6,253), sedangkan prediksi Sugeno berkisar antara 3,500 hingga 8,000 (rentang 4,500). Keduanya jauh lebih sempit dibandingkan rentang ground truth (0,700 hingga 10,000, rentang 9,300)."),
  bullet("Sugeno lebih terpusat: standar deviasi Sugeno (0,914) lebih kecil dibandingkan Mamdani (1,128) dan ground truth (1,033), menandakan output Sugeno lebih \u201Cmenggumpal\u201D di sekitar nilai tengah \u2014 hal ini wajar mengingat consequent Sugeno hanya berupa tiga nilai konstanta diskret (3.5, 6.0, 8.0) yang kemudian dirata-ratakan secara berbobot."),
  bullet("Mamdani lebih ekstrem: rentang Mamdani yang lebih luas (hingga mendekati 8,5 dan turun hingga 2,3) menunjukkan bahwa proses agregasi dan centroid pada Mamdani memungkinkan munculnya nilai-nilai prediksi yang lebih ekstrem dibandingkan rata-rata berbobot Sugeno yang cenderung \u201Cmenarik\u201D nilai ke tengah."),
 
  p("Fenomena rentang prediksi yang menyempit ini merupakan karakteristik umum dari sistem fuzzy berbasis rule base: setiap output pada akhirnya merupakan kombinasi (baik melalui centroid maupun weighted average) dari himpunan fuzzy output yang terbatas jumlahnya (hanya 3: Low, Medium, High), sehingga secara matematis sulit menghasilkan nilai ekstrem seperti 0,7 atau 10,0 yang ada pada data aktual kecuali firing strength sangat dominan pada satu aturan tunggal dengan consequent ekstrem."),
 
  heading2("4.9 Dampak Penambahan Variabel vote_count dan release_year"),
  p("Salah satu kontribusi utama desain sistem ini adalah penambahan dua variabel modifier \u2014 vote_count dan release_year \u2014 di luar tiga variabel inti (budget, popularity, runtime). Dengan lima variabel input yang masing-masing dikombinasikan menggunakan operator AND (min), firing strength setiap aturan menjadi hasil minimum dari lima derajat keanggotaan sekaligus."),
  p("Implikasi langsung dari hal ini adalah firing strength cenderung menjadi lebih kecil dibandingkan sistem dengan jumlah input yang lebih sedikit, karena probabilitas kelima variabel secara bersamaan memiliki derajat keanggotaan tinggi terhadap kombinasi himpunan tertentu menjadi lebih rendah. Secara empiris, hal ini tercermin pada hasil di Tabel 4.6: output sistem cenderung lebih terpusat di sekitar kelas Medium, karena lebih banyak aturan yang memiliki firing strength rendah namun tidak nol, sehingga kontribusi agregat dari berbagai aturan saling \u201Cmeratakan\u201D hasil akhir ke arah nilai tengah."),
  p("Di sisi lain, kedua variabel modifier ini memberikan konteks domain yang lebih kaya secara konseptual:"),
  bullet("vote_count mencerminkan kredibilitas rating \u2014 film dengan sedikit voter ratingnya secara statistik kurang representatif (varians tinggi), sehingga sistem dapat \u201Cmenahan diri\u201D dari memberikan keyakinan tinggi terhadap output ekstrem ketika vote_count rendah."),
  bullet("release_year mencerminkan survivorship bias \u2014 film-film lama yang masih memiliki metadata dan ulasan pada umumnya adalah film yang \u201Clolos seleksi alam\u201D zaman, sehingga cenderung berkualitas, sedangkan film modern memiliki variasi kualitas yang jauh lebih luas (dari sangat buruk hingga sangat baik)."),
  p("Meskipun penambahan kedua variabel ini secara matematis menurunkan firing strength rata-rata dan mempersempit rentang prediksi, secara konseptual kedua variabel tersebut tetap relevan dan berkontribusi pada penyusunan rule base yang lebih bermakna secara domain, sebagaimana telah dijabarkan pada Tabel 4.2."),
 
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// BAB V ANALISIS KOMPARATIF
// ───────────────────────────────────────────────────────────
const bab5 = [
  heading1("BAB V  ANALISIS KOMPARATIF MAMDANI VS SUGENO"),
 
  heading2("5.1 Perbandingan Akurasi Prediksi"),
  p("Berdasarkan hasil pada Tabel 4.5, metode Sugeno menunjukkan keunggulan akurasi yang konsisten pada ketiga metrik error: MAE (1,2447 vs 1,3320), MSE (2,2235 vs 2,6351), dan RMSE (1,4912 vs 1,6233). Selisih ini, meskipun tidak terlalu besar (sekitar 7\u201316% relatif), secara konsisten menunjukkan bahwa pendekatan Weighted Average pada Sugeno menghasilkan estimasi titik tunggal yang sedikit lebih dekat dengan nilai aktual dibandingkan pendekatan Centroid pada Mamdani, khususnya pada konteks dataset ini dengan jumlah input dan rule yang relatif banyak (5 input, 27 rule)."),
  p("Salah satu kemungkinan penyebab keunggulan Sugeno pada metrik MAE/MSE/RMSE adalah karena nilai consequent Sugeno (3.5, 6.0, 8.0) dipilih agar berada relatif dekat dengan rentang rata-rata ground truth (mean = 6,05), sehingga ketika weighted average dihitung dari kombinasi ketiga nilai tersebut, hasilnya \u201Csecara alami\u201D berada pada rentang yang mendekati distribusi data aktual. Sementara pada Mamdani, hasil centroid sangat bergantung pada bentuk dan luas area agregasi yang terbentuk dari clipping seluruh aturan aktif, yang dapat menghasilkan nilai yang lebih bervariasi (termasuk lebih ekstrem ke bawah, seperti terlihat dari nilai minimum 2,287)."),
  p("Namun, pada metrik korelasi Pearson, Mamdani justru sedikit lebih unggul (0,1925 vs 0,1815). Ini menunjukkan adanya trade-off: Sugeno lebih baik dalam meminimalkan rata-rata kesalahan absolut/kuadrat (akurasi titik), sedangkan Mamdani sedikit lebih baik dalam menangkap arah/tren relatif perubahan nilai (akurasi pola). Secara keseluruhan, kedua nilai korelasi masih tergolong sangat lemah (< 0,2), yang mengindikasikan bahwa rule base 27 aturan yang dirancang secara manual berdasarkan intuisi domain belum cukup kuat untuk menangkap pola kompleks hubungan antara kelima variabel input dengan vote_average pada skala 8.094 sampel."),
 
  heading2("5.2 Perbandingan Runtime Komputasi"),
  p("Dari sisi efisiensi komputasi, metode Sugeno unggul secara signifikan dengan margin sekitar 6 kali lipat (0,67 detik vs 4,35 detik untuk 8.094 sampel, atau 0,083 ms vs 0,54 ms per sampel). Perbedaan ini bersumber langsung dari perbedaan fundamental kedua metode:"),
  bullet("Mamdani memerlukan evaluasi fungsi keanggotaan output (OUTPUT_MF) pada 500 titik diskretisasi (OUTPUT_UNIVERSE) untuk setiap aturan yang aktif, kemudian melakukan operasi clipping (np.minimum) dan agregasi (np.maximum) terhadap array sepanjang 500 elemen, dan akhirnya melakukan dua kali integrasi numerik trapesium (np.trapezoid) untuk pembilang dan penyebut centroid."),
  bullet("Sugeno hanya memerlukan satu kali perkalian skalar (alpha \u00D7 z_i) dan satu kali akumulasi penjumlahan untuk pembilang dan penyebut weighted average, tanpa diskretisasi maupun integrasi numerik sama sekali."),
  p("Pada skala 8.094 sampel, perbedaan 0,5 ms vs 0,08 ms per sampel mungkin terasa kecil, namun pada aplikasi skala produksi yang memproses jutaan film atau yang membutuhkan inferensi real-time (misalnya: sistem rekomendasi yang menghitung skor untuk seluruh katalog film setiap kali pengguna membuka aplikasi), perbedaan 6\u00D7 ini menjadi sangat signifikan dari sisi pengalaman pengguna dan biaya komputasi (computational cost)."),
 
  heading2("5.3 Kelebihan dan Kekurangan Masing-Masing Metode"),
  heading3("5.3.1 Metode Mamdani"),
  bulletRich([{ text: "Kelebihan: ", bold: true }, { text: "Interpretabilitas tinggi karena output berupa daerah fuzzy yang dapat divisualisasikan dan dipahami secara intuitif sebagai \u201Cseberapa besar keyakinan terhadap masing-masing kelas rating\u201D; korelasi dengan ground truth sedikit lebih baik (0,1925 vs 0,1815), menunjukkan kemampuan menangkap tren relatif yang sedikit lebih baik; rentang nilai output lebih luas, memungkinkan munculnya prediksi yang lebih ekstrem ketika memang didukung oleh firing strength yang dominan." }]),
  bulletRich([{ text: "Kekurangan: ", bold: true }, { text: "Runtime komputasi 6\u00D7 lebih lambat dibandingkan Sugeno karena memerlukan diskretisasi domain output (500 titik) dan integrasi numerik trapesium untuk setiap sampel; nilai MAE, MSE, dan RMSE seluruhnya lebih tinggi (lebih buruk) dibandingkan Sugeno pada dataset ini; hasil centroid sangat sensitif terhadap resolusi diskretisasi \u2014 semakin banyak titik OUTPUT_UNIVERSE, semakin akurat namun semakin lambat (trade-off akurasi vs kecepatan)." }]),
 
  heading3("5.3.2 Metode Sugeno"),
  bulletRich([{ text: "Kelebihan: ", bold: true }, { text: "Runtime komputasi sangat efisien (\u2248 6\u00D7 lebih cepat dari Mamdani) karena hanya memerlukan operasi aritmatika sederhana tanpa diskretisasi atau integrasi numerik; performa lebih baik pada ketiga metrik error utama (MAE, MSE, RMSE) serta pada metrik akurasi dengan toleransi \u00B11.0; struktur consequent berupa konstanta memudahkan integrasi langsung dengan model matematis atau machine learning lain (seperti ditunjukkan pada Bab 4.10/Bonus)." }]),
  bulletRich([{ text: "Kekurangan: ", bold: true }, { text: "Interpretabilitas lebih rendah karena consequent berupa angka tunggal (3.5, 6.0, 8.0) yang kurang ekspresif secara linguistik dibandingkan himpunan fuzzy penuh; korelasi dengan ground truth sedikit lebih rendah (0,1815 vs 0,1925), menunjukkan sedikit lebih lemah dalam menangkap tren relatif; output lebih \u201Cmenggumpal\u201D di sekitar nilai tengah (std dev 0,914, paling kecil di antara ketiganya) sehingga kurang mampu memprediksi nilai-nilai ekstrem pada kedua ujung skala rating." }]),
 
  heading2("5.4 Rangkuman Perbandingan"),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [3160, 3100, 3100],
    rows: [
      new TableRow({ children: [headerCell("Kriteria", 3160), headerCell("Mamdani", 3100), headerCell("Sugeno", 3100)] }),
      new TableRow({ children: [cell("MAE / MSE / RMSE", { width: 3160, bold: true }), cell("Lebih tinggi (lebih buruk)", { width: 3100, align: AlignmentType.CENTER }), cell("Lebih rendah (lebih baik)", { width: 3100, align: AlignmentType.CENTER, shade: "D6F0DA", bold: true })] }),
      new TableRow({ children: [cell("Korelasi Pearson", { width: 3160, bold: true }), cell("Lebih tinggi (lebih baik)", { width: 3100, align: AlignmentType.CENTER, shade: "D6F0DA", bold: true }), cell("Lebih rendah", { width: 3100, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Akurasi toleransi \u00B11.0", { width: 3160, bold: true }), cell("43,1%", { width: 3100, align: AlignmentType.CENTER }), cell("45,4%", { width: 3100, align: AlignmentType.CENTER, shade: "D6F0DA", bold: true })] }),
      new TableRow({ children: [cell("Runtime komputasi (8.094 sampel)", { width: 3160, bold: true }), cell("4,35 detik", { width: 3100, align: AlignmentType.CENTER }), cell("0,67 detik (\u2248 6\u00D7 lebih cepat)", { width: 3100, align: AlignmentType.CENTER, shade: "D6F0DA", bold: true })] }),
      new TableRow({ children: [cell("Interpretabilitas Output", { width: 3160, bold: true }), cell("Tinggi (himpunan fuzzy)", { width: 3100, align: AlignmentType.CENTER, shade: "D6F0DA", bold: true }), cell("Sedang (konstanta numerik)", { width: 3100, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Sebaran Prediksi (Std Dev)", { width: 3160, bold: true }), cell("1,128 (lebih bervariasi)", { width: 3100, align: AlignmentType.CENTER, shade: "D6F0DA", bold: true }), cell("0,914 (lebih terpusat)", { width: 3100, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Kemudahan Integrasi dengan ML", { width: 3160, bold: true }), cell("Sedang", { width: 3100, align: AlignmentType.CENTER }), cell("Tinggi", { width: 3100, align: AlignmentType.CENTER, shade: "D6F0DA", bold: true })] }),
    ]
  }),
  caption("Tabel 5.1 Rangkuman perbandingan akhir Mamdani vs Sugeno berdasarkan seluruh kriteria evaluasi"),
 
  p("Secara umum, dapat disimpulkan bahwa terdapat trade-off antara akurasi titik (point accuracy) dan interpretabilitas/korelasi tren. Sugeno lebih unggul dari sisi efisiensi komputasi dan akurasi titik (MAE/MSE/RMSE/toleransi), menjadikannya pilihan yang lebih sesuai untuk aplikasi skala besar atau real-time. Sebaliknya, Mamdani \u2014 meskipun lebih lambat dan memiliki error rata-rata yang sedikit lebih tinggi \u2014 menawarkan interpretabilitas output yang lebih kaya dan korelasi tren yang sedikit lebih baik, menjadikannya lebih sesuai untuk konteks yang membutuhkan penjelasan (explainability) terhadap pengguna akhir, seperti dashboard analitik bagi tim produksi film."),
 
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// BAB VI BONUS: INTEGRASI ML
// ───────────────────────────────────────────────────────────
const bab6 = [
  heading1("BAB VI  BONUS: INTEGRASI FUZZY FEATURES DENGAN LINEAR REGRESSION"),
 
  heading2("6.1 Konsep Feature Engineering Berbasis Fuzzy"),
  p("Sebagai eksperimen tambahan, output dari sistem fuzzy yang telah dibangun diuji potensinya sebagai fitur tambahan (bukan pengganti) bagi model Machine Learning sederhana, yaitu Linear Regression. Ide dasarnya adalah bahwa derajat keanggotaan fuzzy dan hasil inferensi (Mamdani & Sugeno) mengandung domain knowledge yang telah \u201Cdiringkas\u201D secara eksplisit, sehingga dapat membantu model ML \u201Cmemahami\u201D struktur data lebih cepat tanpa harus mempelajarinya dari nol semata-mata dari data mentah."),
  p("Untuk setiap sampel film, dibentuk vektor fitur fuzzy berdimensi 17, yang terdiri dari:"),
  bullet("3 derajat keanggotaan dari budget (low, medium, high)"),
  bullet("3 derajat keanggotaan dari popularity (low, medium, high)"),
  bullet("3 derajat keanggotaan dari runtime (short, medium, long)"),
  bullet("3 derajat keanggotaan dari vote_count (low, medium, high)"),
  bullet("3 derajat keanggotaan dari release_year (old, mid, recent)"),
  bullet("1 nilai hasil prediksi Mamdani"),
  bullet("1 nilai hasil prediksi Sugeno"),
  p("Implementasi fungsi ekstraksi fitur fuzzy adalah sebagai berikut:"),
  codeBlock([
    "def extract_fuzzy_features(budget_M, popularity, runtime, vote_count, release_year):",
    "    \"\"\"Ekstrak vektor 17-dimensi: 15 derajat keanggotaan + 2 prediksi FIS\"\"\"",
    "    fz = fuzzify(budget_M, popularity, runtime, vote_count, release_year)",
    "    m  = mamdani_infer(budget_M, popularity, runtime, vote_count, release_year)",
    "    s  = sugeno_infer( budget_M, popularity, runtime, vote_count, release_year)",
    "    return np.array([",
    "        fz['budget']['low'],      fz['budget']['medium'],      fz['budget']['high'],",
    "        fz['popularity']['low'],  fz['popularity']['medium'],  fz['popularity']['high'],",
    "        fz['runtime']['short'],   fz['runtime']['medium'],     fz['runtime']['long'],",
    "        fz['vote_count']['low'],  fz['vote_count']['medium'],  fz['vote_count']['high'],",
    "        fz['release_year']['old'],fz['release_year']['mid'],   fz['release_year']['recent'],",
    "        m, s",
    "    ])",
  ]),
 
  heading2("6.2 Linear Regression From Scratch (Normal Equation)"),
  p("Model Linear Regression diimplementasikan from scratch menggunakan pendekatan Normal Equation, yaitu menyelesaikan persamaan \u03B8 = (X\u1d40X)\u207B\u00B9X\u1d40y melalui fungsi np.linalg.lstsq (least squares) yang stabil secara numerik:"),
  codeBlock([
    "class LinearRegressionScratch:",
    "    def fit(self, X, y):",
    "        Xb = np.column_stack([np.ones(len(X)), X])",
    "        self.theta = np.linalg.lstsq(Xb, y, rcond=None)[0]",
    "        return self",
    "    def predict(self, X):",
    "        Xb = np.column_stack([np.ones(len(X)), X])",
    "        return Xb @ self.theta",
    "    def r2(self, X, y):",
    "        yp = self.predict(X)",
    "        return 1 - np.sum((y-yp)**2) / np.sum((y-y.mean())**2)",
  ]),
  p("Data dibagi menjadi 80% data latih dan 20% data uji menggunakan pengacakan dengan seed tetap (np.random.default_rng(42)) untuk memastikan hasil dapat direproduksi. Dua model dilatih secara terpisah:"),
  bullet("LinReg Raw (5 fitur): menggunakan lima variabel input mentah (budget_M, popularity, runtime, vote_count, release_year) tanpa transformasi fuzzy apa pun."),
  bullet("LinReg Fuzzy (17 fitur): menggunakan vektor fitur fuzzy 17 dimensi sebagaimana dijelaskan pada sub-bab 6.1."),
 
  heading2("6.3 Hasil Perbandingan"),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [4360, 1660, 1660, 1660],
    rows: [
      new TableRow({ children: [headerCell("Model", 4360), headerCell("MAE", 1660), headerCell("RMSE", 1660), headerCell("R\u00B2", 1660)] }),
      new TableRow({ children: [cell("LinReg Raw (5 fitur)", { width: 4360, bold: true }), cell("0,6487", { width: 1660, align: AlignmentType.CENTER, shade: "D6F0DA" }), cell("0,8217", { width: 1660, align: AlignmentType.CENTER, shade: "D6F0DA" }), cell("0,3532", { width: 1660, align: AlignmentType.CENTER, shade: "D6F0DA" })] }),
      new TableRow({ children: [cell("LinReg Fuzzy (17 fitur)", { width: 4360, bold: true }), cell("0,6894", { width: 1660, align: AlignmentType.CENTER }), cell("0,8829", { width: 1660, align: AlignmentType.CENTER }), cell("0,2532", { width: 1660, align: AlignmentType.CENTER })] }),
    ]
  }),
  caption("Tabel 6.1 Perbandingan performa Linear Regression dengan fitur mentah vs fitur fuzzy (data uji 20%)"),
 
  p("Hasil pada Tabel 6.1 menunjukkan bahwa, untuk eksperimen ini, model LinReg Raw dengan 5 fitur mentah justru mengungguli LinReg Fuzzy dengan 17 fitur pada seluruh metrik: MAE lebih kecil (0,6487 vs 0,6894), RMSE lebih kecil (0,8217 vs 0,8829), dan R\u00B2 lebih tinggi (0,3532 vs 0,2532). Hal ini bertentangan dengan hipotesis awal bahwa penambahan fitur fuzzy akan meningkatkan performa model."),
 
  heading2("6.4 Analisis dan Catatan Penting"),
  p("Beberapa kemungkinan penyebab mengapa fitur fuzzy tidak meningkatkan performa Linear Regression pada eksperimen ini perlu dicatat sebagai bahan refleksi dan pengembangan lebih lanjut:"),
  numbered("Redundansi informasi (multikolinearitas): 15 dari 17 fitur fuzzy merupakan transformasi non-linear langsung dari 5 fitur mentah yang sama. Karena hanya tiga himpunan fuzzy per variabel dan ketiganya saling melengkapi (sum-to-one secara longgar), informasi yang terkandung sebagian besar tumpang tindih (redundant) dengan fitur mentah, namun direpresentasikan dalam dimensi yang lebih tinggi \u2014 hal ini dapat menyebabkan overfitting pada model linear sederhana dengan ukuran data latih yang terbatas."),
  numbered("Penambahan dimensi tanpa penambahan informasi baru yang signifikan: 2 fitur tambahan (prediksi Mamdani dan Sugeno) sendiri merupakan fungsi deterministik dari 5 fitur mentah yang sama (melalui rule base 27 aturan), sehingga secara teoritis tidak membawa informasi yang benar-benar baru di luar apa yang sudah dapat dipelajari Linear Regression secara langsung dari fitur mentah \u2014 namun menambah kompleksitas model (jumlah parameter \u03B8 meningkat dari 6 menjadi 18) yang berisiko meningkatkan varians estimasi pada data uji yang relatif kecil (20% dari 8.094 \u2248 1.619 sampel)."),
  numbered("Non-linearitas fungsi keanggotaan vs model linear: fungsi keanggotaan trapesium dan segitiga bersifat piecewise-linear, namun kombinasi dari banyak fitur piecewise-linear ini dapat menciptakan struktur fitur yang sebenarnya membutuhkan model non-linear (misalnya pohon keputusan atau neural network) untuk dimanfaatkan secara optimal \u2014 model Linear Regression murni kurang mampu mengeksploitasi struktur \u201Cpatahan\u201D (kink) yang dihasilkan oleh fungsi keanggotaan tersebut."),
  p("Catatan penting yang dapat ditarik dari eksperimen ini adalah bahwa integrasi fitur fuzzy ke dalam model ML tidak secara otomatis menjamin peningkatan performa, dan efektivitasnya sangat bergantung pada jenis model target, jumlah fitur, ukuran data, serta bagaimana fitur fuzzy tersebut dikonstruksi (misalnya, apakah cukup mewakili interaksi non-linear antar variabel yang relevan, atau hanya transformasi redundan dari fitur yang sudah ada). Untuk pengembangan lebih lanjut, integrasi fitur fuzzy berpotensi lebih bermanfaat jika dipasangkan dengan model non-linear seperti Random Forest, Gradient Boosting, atau Neural Network, serta jika rule base dioptimalkan menggunakan teknik seperti Adaptive Neuro-Fuzzy Inference System (ANFIS)."),
 
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// BAB VII PENUTUP
// ───────────────────────────────────────────────────────────
const bab7 = [
  heading1("BAB VII  PENUTUP"),
 
  heading2("7.1 Kesimpulan"),
  numbered("Sistem inferensi fuzzy Mamdani dan Sugeno berhasil diimplementasikan secara from scratch menggunakan Python murni (NumPy dan Pandas), tanpa bergantung pada pustaka fuzzy logic eksternal seperti scikit-fuzzy, mencakup seluruh komponen: fungsi keanggotaan triangular dan trapezoidal, basis aturan 27 IF-THEN, mekanisme inferensi (firing strength min, implikasi min, agregasi max untuk Mamdani), dan defuzzifikasi (Centroid untuk Mamdani, Weighted Average untuk Sugeno)."),
  numbered("Sistem dirancang dengan lima variabel input (budget, popularity, runtime, vote_count, release_year) untuk memprediksi satu variabel output kontinu (vote_average pada skala 0\u201310), dengan dataset bersih sebanyak 8.094 baris hasil pembersihan dari 45.466 baris data mentah The Movies Dataset."),
  numbered("Berdasarkan evaluasi pada 8.094 sampel, metode Sugeno menunjukkan keunggulan pada metrik error utama: MAE 1,2447 (vs 1,3320 Mamdani), MSE 2,2235 (vs 2,6351), RMSE 1,4912 (vs 1,6233), serta akurasi toleransi \u00B11.0 sebesar 45,4% (vs 43,1% Mamdani)."),
  numbered("Dari sisi efisiensi komputasi, metode Sugeno sekitar 6 kali lebih cepat dibandingkan Mamdani (0,67 detik vs 4,35 detik untuk 8.094 sampel), karena tidak memerlukan diskretisasi domain output maupun integrasi numerik."),
  numbered("Metode Mamdani menunjukkan korelasi Pearson yang sedikit lebih tinggi terhadap ground truth (0,1925 vs 0,1815) serta rentang dan variasi prediksi yang lebih luas (std dev 1,128 vs 0,914), menandakan keunggulan relatif dalam menangkap tren naik-turun data meskipun dengan error rata-rata yang sedikit lebih besar."),
  numbered("Eksperimen integrasi fitur fuzzy (17 dimensi) ke dalam model Linear Regression from scratch menunjukkan bahwa model dengan fitur mentah (5 fitur, MAE 0,6487, R\u00B2 0,3532) justru mengungguli model dengan fitur fuzzy (17 fitur, MAE 0,6894, R\u00B2 0,2532), mengindikasikan adanya redundansi informasi dan ketidakcocokan antara fitur fuzzy piecewise-linear dengan model linear sederhana."),
  numbered("Secara keseluruhan, terdapat trade-off antara akurasi titik dan efisiensi (diunggulkan Sugeno) versus interpretabilitas dan korelasi tren (sedikit diunggulkan Mamdani), sehingga pemilihan metode sebaiknya disesuaikan dengan kebutuhan aplikasi: Sugeno untuk sistem skala besar/real-time, Mamdani untuk sistem yang membutuhkan penjelasan (explainability) kepada pengguna."),
 
  heading2("7.2 Saran dan Pengembangan Lebih Lanjut"),
  bullet("Optimasi rule base: rule base 27 aturan yang dirancang secara manual berdasarkan intuisi domain dapat dioptimalkan lebih lanjut menggunakan teknik berbasis data seperti clustering (Fuzzy C-Means) atau algoritma evolusi (Genetic Algorithm, Particle Swarm Optimization) untuk menemukan kombinasi aturan dan parameter fungsi keanggotaan yang lebih optimal terhadap data."),
  bullet("Penggunaan model ANFIS: untuk memanfaatkan domain knowledge fuzzy secara lebih efektif dalam kerangka machine learning, dapat dipertimbangkan penggunaan Adaptive Neuro-Fuzzy Inference System (ANFIS) yang menggabungkan struktur fuzzy dengan pembelajaran berbasis gradien."),
  bullet("Eksplorasi model non-linear untuk integrasi fitur fuzzy: fitur fuzzy 17-dimensi berpotensi lebih bermanfaat jika dipasangkan dengan model non-linear seperti Random Forest, Gradient Boosting, atau Neural Network yang lebih mampu mengeksploitasi struktur piecewise-linear dari fungsi keanggotaan."),
  bullet("Penambahan variabel input lain: variabel seperti genre film, bahasa asli, negara produksi, atau jumlah aktor terkenal (cast popularity) dapat dipertimbangkan sebagai input tambahan untuk memperkaya konteks prediksi."),
  bullet("Validasi dengan teknik cross-validation: evaluasi performa pada Bab 6 menggunakan satu kali pembagian data latih/uji (80/20); penggunaan k-fold cross-validation dapat memberikan estimasi performa yang lebih robust dan tidak bergantung pada satu pembagian acak tertentu."),
  bullet("Kalibrasi ulang nilai consequent Sugeno: nilai konstanta Sugeno (3.5, 6.0, 8.0) dapat dikalibrasi ulang berdasarkan rata-rata vote_average aktual pada setiap kelas (Low, Medium, High) dari data latih, bukan ditentukan secara manual, untuk mengurangi bias negatif yang teramati pada Tabel 4.6."),
 
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// DAFTAR PUSTAKA
// ───────────────────────────────────────────────────────────
const daftarPustaka = [
  heading1("DAFTAR PUSTAKA"),
  p("Zadeh, L. A. (1965). Fuzzy sets. Information and Control, 8(3), 338\u2013353.", { spacing: { after: 160 } }),
  p("Mamdani, E. H., & Assilian, S. (1975). An experiment in linguistic synthesis with a fuzzy logic controller. International Journal of Man-Machine Studies, 7(1), 1\u201313.", { spacing: { after: 160 } }),
  p("Sugeno, M. (1985). Industrial applications of fuzzy control. Elsevier Science Publishing Co.", { spacing: { after: 160 } }),
  p("Ross, T. J. (2010). Fuzzy Logic with Engineering Applications (3rd ed.). John Wiley & Sons.", { spacing: { after: 160 } }),
  p("Banik, R. (2017). The Movies Dataset. Kaggle. https://www.kaggle.com/rounakbanik/the-movies-dataset", { spacing: { after: 160 } }),
  p("Harris, C. R., Millman, K. J., van der Walt, S. J., et al. (2020). Array programming with NumPy. Nature, 585, 357\u2013362.", { spacing: { after: 160 } }),
  p("McKinney, W. (2010). Data Structures for Statistical Computing in Python. Proceedings of the 9th Python in Science Conference, 56\u201361.", { spacing: { after: 160 } }),
 
  pageBreak(),
];
 
// ───────────────────────────────────────────────────────────
// LAMPIRAN
// ───────────────────────────────────────────────────────────
const lampiran = [
  heading1("LAMPIRAN"),
  heading2("Lampiran A. Struktur Notebook Implementasi"),
  p("Implementasi lengkap dilakukan dalam satu berkas Jupyter Notebook (fuzzy_logic_movies_v2_final_banget.ipynb) yang terstruktur dalam 11 bagian utama sebagaimana dirangkum pada Tabel A.1."),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [900, 8460],
    rows: [
      new TableRow({ children: [headerCell("Bagian", 900), headerCell("Judul / Isi", 8460)] }),
      ...[
        ["1", "Import Library (NumPy, Pandas, Matplotlib)"],
        ["2", "Eksplorasi & Pra-pemrosesan Data (cleaning, filtering, IQR outlier removal)"],
        ["3", "Fungsi Keanggotaan (Membership Functions) \u2014 trimf & trapmf from scratch"],
        ["4", "Rule Base \u2014 27 Aturan IF-THEN"],
        ["5", "Fuzzifikasi \u2014 fungsi fuzzify() untuk 5 variabel input"],
        ["6", "Sistem Inferensi Mamdani \u2014 mamdani_infer() (Min-Max-Centroid)"],
        ["7", "Sistem Inferensi Sugeno \u2014 sugeno_infer() (Min-Weighted Average)"],
        ["8", "Evaluasi Batch & Metrik Performa (MAE, MSE, RMSE) pada 8.094 sampel"],
        ["9", "Analisis Dampak Penambahan vote_count & release_year"],
        ["10", "Bonus: Fuzzy Features (17-dim) + Linear Regression From Scratch"],
        ["11", "Kesimpulan"],
      ].map(([no, title]) => new TableRow({ children: [
        cell(no, { width: 900, bold: true, align: AlignmentType.CENTER }),
        cell(title, { width: 8460 }),
      ] })),
    ]
  }),
  caption("Tabel A.1 Struktur notebook implementasi"),
 
  heading2("Lampiran B. Konstanta Consequent Sugeno"),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [
      new TableRow({ children: [headerCell("Consequent (Label Linguistik)", 4680), headerCell("Nilai Konstanta Sugeno", 4680)] }),
      new TableRow({ children: [cell("Low", { width: 4680, bold: true }), cell("3.5", { width: 4680, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("Medium", { width: 4680, bold: true }), cell("6.0", { width: 4680, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("High", { width: 4680, bold: true }), cell("8.0", { width: 4680, align: AlignmentType.CENTER })] }),
    ]
  }),
  caption("Tabel B.1 Nilai konstanta consequent untuk Sugeno orde-nol (SUGENO_CONST)"),
 
  heading2("Lampiran C. Anggota Kelompok dan Pembagian Kontribusi"),
  new Table({
    width: { size: FULL_W, type: WidthType.DXA },
    columnWidths: [3120, 2120, 4120],
    rows: [
      new TableRow({ children: [headerCell("Nama", 3120), headerCell("NIM", 2120), headerCell("Kontribusi Utama", 4120)] }),
      new TableRow({ children: [cell("Ryan Maulana Bagus Putra", { width: 3120, bold: true }), cell("103012430029", { width: 2120, align: AlignmentType.CENTER }), cell("Implementasi sistem inferensi Mamdani & Sugeno, evaluasi metrik performa", { width: 4120 })] }),
      new TableRow({ children: [cell("Azmi Hanif Fauzil Islami", { width: 3120, bold: true }), cell("103012420018", { width: 2120, align: AlignmentType.CENTER }), cell("Pra-pemrosesan data, perancangan variabel linguistik & fungsi keanggotaan, rule base", { width: 4120 })] }),
      new TableRow({ children: [cell("Aloysius Axel Adriano", { width: 3120, bold: true }), cell("103012400419", { width: 2120, align: AlignmentType.CENTER }), cell("Analisis komparatif, integrasi fuzzy-ML, penyusunan laporan", { width: 4120 })] }),
    ]
  }),
  caption("Tabel C.1 Pembagian kontribusi anggota kelompok"),
];
 
// ───────────────────────────────────────────────────────────
// ASSEMBLE DOCUMENT
// ───────────────────────────────────────────────────────────
const doc = new Document({
  creator: "Kelompok Fuzzy Logic - Telkom University",
  title: "Analisis Komparatif Performa Fuzzy Logic Klasifikasi Mamdani dan Sugeno",
  description: "Laporan Tugas Besar Kecerdasan Buatan",
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: "1F3864" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E4057" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, font: "Arial", color: "2E4057" },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF", space: 1 } },
          children: [
            new TextRun({ text: "Analisis Komparatif Fuzzy Logic Mamdani & Sugeno", size: 16, color: "808080", italics: true }),
            new TextRun({ text: "\tTelkom University", size: 16, color: "808080", italics: true }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Halaman ", size: 18, color: "808080" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" }),
            new TextRun({ text: " dari ", size: 18, color: "808080" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "808080" }),
          ],
        })],
      }),
    },
    children: [
      ...coverChildren,
      ...kataPengantar,
      ...tocPage,
      ...bab1,
      ...bab2,
      ...bab3,
      ...bab4,
      ...bab5,
      ...bab6,
      ...bab7,
      ...daftarPustaka,
      ...lampiran,
    ],
  }],
});
 
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/home/claude/report/laporan_fuzzy_logic_mamdani_sugeno.docx", buffer);
  console.log("Document created successfully!");
});
 