# RPD - Aplikasi FinanceApp (Manajemen Keuangan Mahasiswa)

## 1. Pendahuluan

### 1.1 Latar Belakang
Mahasiswa sering kesulitan mengelola keuangan karena pendapatan terbatas (uang saku, beasiswa, atau penghasilan sampingan) namun pengeluaran bervariasi (kuliah, hidup, sosial). FinanceApp membantu mahasiswa mencatat, memantau, dan mengontrol keuangan secara efektif.

### 1.2 Tujuan
- Memudahkan mahasiswa mencatat pemasukan dan pengeluaran
- Memberikan visualisasi kondisi keuangan secara real-time
- Membantu mahasiswa membuat anggaran dan target tabungan
- Meningkatkan kesadaran finansial mahasiswa

### 1.3 Sasaran
- Aplikasi mudah digunakan oleh mahasiswa usia 17-25 tahun
- Data tersimpan aman secara lokal (localStorage)
- Aplikasi ringan dan dapat diakses via browser

---

## 2. Target Pengguna (User Persona)

### 2.1 Persona Utama: "Budi - Mahasiswa Aktif"
| Atribut | Keterangan |
|---------|------------|
| Usia | 20 tahun |
| Status | Mahasiswa semester 5 |
| Pendapatan | Rp 1.500.000 - Rp 3.000.000/bulan (uang saku + freelance) |
| Kebutuhan | Kontrol pengeluaran, tabungan untuk kebutuhan mendesak |
| Pain Points | Sering kehabisan uang di akhir bulan, tidak tahu uang habis di mana |
| Device | Laptop + Smartphone |

### 2.2 Persona Sekunder: "Sari - Mahasiswa Beasiswa"
| Atribut | Keterangan |
|---------|------------|
| Usia | 19 tahun |
| Status | Mahasiswa semester 3 |
| Pendapatan | Rp 2.000.000/bulan (beasiswa) |
| Kebutuhan | Alokasi dana untuk kuliah, hidup, dan tabungan |
| Pain Points | Harus hemat, perlu perencanaan ketat |

---

## 3. Ruang Lingkup

### 3.1 Fitur Utama
| No | Fitur | Deskripsi | Prioritas |
|----|-------|-----------|-----------|
| 1 | Dashboard | Ringkasan saldo, pemasukan, pengeluaran, grafik tren | Tinggi |
| 2 | Transaksi | CRUD transaksi (pemasukan, pengeluaran, transfer) | Tinggi |
| 3 | Multi-Akun | Manajemen beberapa akun (cash, bank, e-wallet) | Tinggi |
| 4 | Kategori | Kategori pemasukan & pengeluaran yang dapat dikustomisasi | Tinggi |
| 5 | Anggaran | Budget bulanan per kategori dengan progress bar | Tinggi |
| 6 | Target Tabungan | Goal keuangan dengan tracking progres | Sedang |
| 7 | Transaksi Berulang | Auto-generate transaksi recurring (bulanan, mingguan) | Sedang |
| 8 | Laporan | Grafik arus kas, distribusi kategori, per akun | Sedang |
| 9 | Export/Import | Backup dan restore data dalam format JSON | Rendah |
| 10 | Dark Mode | Tema gelap/terang | Rendah |

### 3.2 Fitur yang DIKECUALIKAN
- Multi-user / cloud sync (hanya single-device)
- Integrasi API bank
- AI/ML prediksi pengeluaran
- Multi-currency conversion real-time

---

## 4. Arsitektur Sistem

### 4.1 Teknologi
```
Frontend: HTML5 + CSS3 + Vanilla JavaScript
Charts: Chart.js 4.4
Storage: localStorage (browser)
Icons: Font Awesome 6.5
```

### 4.2 Struktur Data (localStorage Keys)
```
financeApp_accounts      -> Array of Account objects
financeApp_transactions  -> Array of Transaction objects
financeApp_categories    -> Array of Category objects
financeApp_budgets       -> Array of Budget objects
financeApp_goals         -> Array of Goal objects
financeApp_settings      -> Settings object
```

### 4.3 Schema Data

#### Account
```json
{
  "id": "uuid",
  "name": "BCA",
  "type": "bank | cash | ewallet | credit",
  "balance": 5000000,
  "currency": "IDR",
  "color": "#4CAF50",
  "icon": "fa-university",
  "createdAt": "2024-01-01"
}
```

#### Transaction
```json
{
  "id": "uuid",
  "type": "income | expense | transfer",
  "amount": 50000,
  "categoryId": "uuid",
  "accountId": "uuid",
  "toAccountId": "uuid (untuk transfer)",
  "date": "2024-01-15",
  "note": "Makan siang",
  "isRecurring": false,
  "recurringId": "uuid | null",
  "createdAt": "2024-01-15"
}
```

#### Category
```json
{
  "id": "uuid",
  "name": "Makanan",
  "type": "income | expense",
  "icon": "fa-utensils",
  "color": "#FF5722",
  "isDefault": true
}
```

#### Budget
```json
{
  "id": "uuid",
  "categoryId": "uuid",
  "amount": 1000000,
  "period": "monthly",
  "month": "2024-01",
  "createdAt": "2024-01-01"
}
```

#### Goal
```json
{
  "id": "uuid",
  "name": "Laptop Baru",
  "targetAmount": 15000000,
  "currentAmount": 5000000,
  "deadline": "2024-12-31",
  "color": "#2196F3",
  "icon": "fa-laptop",
  "createdAt": "2024-01-01"
}
```

---

## 5. Desain Antarmuka (UI/UX)

### 5.1 Layout
```
+------------------+-----------------------------------+
|   SIDEBAR        |         MAIN CONTENT              |
|                  |                                   |
|  - Logo          |  [Top Bar: Search + Add Button]   |
|  - Nav Menu      |                                   |
|  - Theme Toggle  |  [Dynamic Page Content]           |
|                  |                                   |
+------------------+-----------------------------------+
```

### 5.2 Halaman
1. **Dashboard** - Stats cards, grafik tren, transaksi terbaru
2. **Transaksi** - Tabel dengan filter (tipe, akun, kategori, tanggal)
3. **Akun** - Grid cards tiap akun dengan saldo
4. **Anggaran** - List budget dengan progress bar
5. **Target** - Grid goals dengan progress dan countdown
6. **Laporan** - Grafik interaktif dengan filter periode
7. **Pengaturan** - Form pengaturan, export/import, hapus data

### 5.3 Warna & Tema
| Elemen | Dark Mode | Light Mode |
|--------|-----------|------------|
| Background | #1a1a2e | #f5f5f5 |
| Card | #16213e | #ffffff |
| Primary | #4CAF50 | #4CAF50 |
| Income | #4CAF50 | #4CAF50 |
| Expense | #f44336 | #f44336 |
| Text | #ffffff | #333333 |

---

## 6. Rencana Pengembangan (Timeline)

### Fase 1: MVP (Minggu 1-2)
- [x] Setup project structure
- [ ] HTML layout & navigation
- [ ] CSS styling + dark mode
- [ ] Dashboard dengan statistik dasar
- [ ] CRUD Transaksi
- [ ] Manajemen Akun

### Fase 2: Fitur Inti (Minggu 3-4)
- [ ] Kategori (default + custom)
- [ ] Anggaran bulanan
- [ ] Filter & pencarian transaksi
- [ ] Chart.js integration

### Fase 3: Fitur Lanjutan (Minggu 5-6)
- [ ] Target tabungan
- [ ] Transaksi berulang
- [ ] Laporan detail
- [ ] Export/Import data

### Fase 4: Polish (Minggu 7)
- [ ] Responsive design
- [ ] Animasi & transisi
- [ ] Bug fixing
- [ ] Testing & optimasi

---

## 7. Kriteria Keberhasilan

| Metrik | Target |
|--------|--------|
| Jumlah fitur selesai | 10/10 fitur utama |
| Responsivitas | < 100ms interaksi |
| Ukuran bundle | < 500KB (tanpa CDN) |
| Browser support | Chrome, Firefox, Safari, Edge |
| User satisfaction | > 4/5 (survey mahasiswa) |

---

## 8. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Data hilang (localStorage cleared) | Tinggi | Fitur export/import JSON |
| Scope creep | Sedang | Prioritaskan MVP, fitur lain iterative |
| Chart.js performance | Rendah | Limit data points, lazy load |
| UI kompleksitas | Sedang | Gunakan design pattern sederhana |

---

## 9. Referensi
- Chart.js Documentation: https://www.chartjs.org/
- localStorage API: MDN Web Docs
- UI Inspiration: Mint, YNAB, PocketGuard
