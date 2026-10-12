# FinanceApp - Manajemen Keuangan Mahasiswa

Aplikasi manajemen keuangan pribadi untuk mahasiswa, berbasis web.

## Menjalankan

**Dengan backend (data tersimpan di server):**

```bash
cd backend
npm install
npm start
```

Buka `http://localhost:3000` - backend sekaligus menyajikan halaman aplikasinya.

**Tanpa backend (data di browser):**

Buka `Frontend/index.html` langsung. Aplikasi mendeteksi backend tidak aktif lalu
berpindah ke mode lokal memakai `localStorage`. Ganti port server lewat
**Pengaturan > Data > Server** bila perlu.

## Fitur

- **Masuk / Daftar** - akun lokal di perangkat (tanpa server), plus mode tamu
- **Dashboard** - saldo, arus kas 6/12 bulan, komposisi pengeluaran, anggaran berjalan
- **Transaksi** - CRUD pemasukan, pengeluaran, transfer dengan filter lengkap
- **Kalender** - pola belanja harian, rincian per tanggal
- **Anggaran** - batas belanja per kategori dengan indikator aman/waspada/lebih
- **Target** - progres tabungan dengan donat ring dan hitung mundur tenggat
- **Akun** - bank, tunai, e-wallet, kartu kredit dengan saldo terhitung otomatis
- **Kategori** - label pemasukan dan pengeluaran yang dapat dikustomisasi
- **Laporan** - arus kas, komposisi kategori, per akun, plus tabel rincian
- **Data** - export/import JSON, export CSV, reset ke data demo
- **Tampilan** - light/dark mode, bottom navigation khusus mobile

## Teknologi

- HTML5 + CSS3 + Vanilla JavaScript (tanpa build step)
- Chart.js 4.4 untuk grafik, Font Awesome 6.5 untuk ikon, Inter untuk tipografi
- Backend: Express dengan penyimpanan JSON di `backend/data/store.json`
- Fallback otomatis ke `localStorage` bila backend tidak aktif

## Struktur

```
Frontend/
  auth.html      Halaman masuk / daftar
  index.html     Aplikasi utama
  session.js     Penyimpanan sesi dan akun lokal
  auth.js        Logika autentikasi
  api.js         Layer API + fallback localStorage
  app.js         State, render, dan seluruh interaksi
  styles.css     Design token + seluruh gaya
backend/
  server.js      REST API
  store.js       Penyimpanan JSON, seed, dan migrasi
  data/          store.json (dibuat otomatis)
```

## Catatan

- Login bersifat lokal, bukan keamanan sungguhan. Kata sandi di-hash SHA-256 bila
  browser mendukung secure context, jika tidak memakai hash cadangan ringan.
- Akun tidak membatasi data: semua pengguna di perangkat yang sama melihat data
  keuangan yang sama.