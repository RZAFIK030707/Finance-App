const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const COLLECTIONS = ['accounts', 'transactions', 'categories', 'budgets', 'goals'];

const DEFAULT_CATEGORIES = [
    { id: 'cat-1', name: 'Gaji', type: 'income', icon: 'fa-briefcase', color: '#4CAF50', isDefault: true },
    { id: 'cat-2', name: 'Freelance', type: 'income', icon: 'fa-laptop-code', color: '#2196F3', isDefault: true },
    { id: 'cat-3', name: 'Hadiah', type: 'income', icon: 'fa-gift', color: '#9C27B0', isDefault: true },
    { id: 'cat-4', name: 'Investasi', type: 'income', icon: 'fa-chart-line', color: '#FF9800', isDefault: true },
    { id: 'cat-5', name: 'Makanan', type: 'expense', icon: 'fa-utensils', color: '#f44336', isDefault: true },
    { id: 'cat-6', name: 'Transportasi', type: 'expense', icon: 'fa-bus', color: '#E91E63', isDefault: true },
    { id: 'cat-7', name: 'Belanja', type: 'expense', icon: 'fa-shopping-bag', color: '#FF5722', isDefault: true },
    { id: 'cat-8', name: 'Tagihan', type: 'expense', icon: 'fa-file-invoice', color: '#795548', isDefault: true },
    { id: 'cat-9', name: 'Hiburan', type: 'expense', icon: 'fa-film', color: '#607D8B', isDefault: true },
    { id: 'cat-10', name: 'Kesehatan', type: 'expense', icon: 'fa-heartbeat', color: '#F44336', isDefault: true },
    { id: 'cat-11', name: 'Pendidikan', type: 'expense', icon: 'fa-graduation-cap', color: '#3F51B5', isDefault: true },
    { id: 'cat-12', name: 'Tabungan', type: 'expense', icon: 'fa-piggy-bank', color: '#009688', isDefault: true },
    { id: 'cat-13', name: 'Lainnya', type: 'expense', icon: 'fa-ellipsis-h', color: '#9E9E9E', isDefault: true },
    { id: 'cat-14', name: 'Lainnya', type: 'income', icon: 'fa-ellipsis-h', color: '#9E9E9E', isDefault: true }
];

const DEFAULT_SETTINGS = {
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    language: 'id',
    firstDayOfWeek: 1,
    compactNumbers: false
};

function isoDate(date) {
    return date.toISOString().split('T')[0];
}

function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildSeed() {
    const now = new Date();
    const stamp = now.toISOString();

    const accounts = [
        { id: 'acc-1', name: 'BCA', type: 'bank', openingBalance: 5000000, balance: 0, currency: 'IDR', color: '#2196F3', icon: 'fa-university', createdAt: stamp },
        { id: 'acc-2', name: 'GoPay', type: 'ewallet', openingBalance: 500000, balance: 0, currency: 'IDR', color: '#4CAF50', icon: 'fa-mobile-alt', createdAt: stamp },
        { id: 'acc-3', name: 'Dompet Tunai', type: 'cash', openingBalance: 300000, balance: 0, currency: 'IDR', color: '#FF9800', icon: 'fa-money-bill-wave', createdAt: stamp }
    ];

    const daysAgo = (n) => isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n));

    const transactions = [
        { id: 'trx-1', type: 'income', amount: 2500000, categoryId: 'cat-1', accountId: 'acc-1', toAccountId: null, date: daysAgo(1), note: 'Beasiswa semester', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-2', type: 'income', amount: 750000, categoryId: 'cat-2', accountId: 'acc-1', toAccountId: null, date: daysAgo(4), note: 'Proyek desain logo', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-3', type: 'expense', amount: 38500, categoryId: 'cat-5', accountId: 'acc-2', toAccountId: null, date: daysAgo(0), note: 'Makan siang campus', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-4', type: 'expense', amount: 24000, categoryId: 'cat-5', accountId: 'acc-2', toAccountId: null, date: daysAgo(1), note: 'Kopi & snack', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-5', type: 'expense', amount: 62000, categoryId: 'cat-6', accountId: 'acc-2', toAccountId: null, date: daysAgo(1), note: 'Gojek ke kampus', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-6', type: 'expense', amount: 249000, categoryId: 'cat-7', accountId: 'acc-1', toAccountId: null, date: daysAgo(2), note: 'Belanja bulanan', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-7', type: 'expense', amount: 385000, categoryId: 'cat-11', accountId: 'acc-1', toAccountId: null, date: daysAgo(3), note: 'Buku kuliah', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-8', type: 'expense', amount: 145000, categoryId: 'cat-8', accountId: 'acc-1', toAccountId: null, date: daysAgo(5), note: 'Tagihan listrik & internet', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-9', type: 'expense', amount: 90000, categoryId: 'cat-9', accountId: 'acc-3', toAccountId: null, date: daysAgo(6), note: 'Nonton bioskop', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-10', type: 'expense', amount: 175000, categoryId: 'cat-10', accountId: 'acc-1', toAccountId: null, date: daysAgo(8), note: 'Obat & cek-up', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-11', type: 'transfer', amount: 500000, categoryId: null, accountId: 'acc-1', toAccountId: 'acc-2', date: daysAgo(1), note: 'Isi saldo GoPay', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-12', type: 'expense', amount: 300000, categoryId: 'cat-12', accountId: 'acc-1', toAccountId: null, date: daysAgo(7), note: 'Setoran tabungan bulanan', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-13', type: 'income', amount: 1200000, categoryId: 'cat-1', accountId: 'acc-1', toAccountId: null, date: daysAgo(32), note: 'Beasiswa bulan lalu', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-14', type: 'expense', amount: 1450000, categoryId: 'cat-5', accountId: 'acc-1', toAccountId: null, date: daysAgo(34), note: 'Makan & coping bulan lalu', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-15', type: 'expense', amount: 320000, categoryId: 'cat-11', accountId: 'acc-1', toAccountId: null, date: daysAgo(33), note: 'Modul & printer', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-16', type: 'income', amount: 2100000, categoryId: 'cat-1', accountId: 'acc-1', toAccountId: null, date: daysAgo(63), note: 'Beasiswa 2 bulan lalu', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-17', type: 'expense', amount: 1680000, categoryId: 'cat-5', accountId: 'acc-1', toAccountId: null, date: daysAgo(65), note: 'Makan 2 bulan lalu', isRecurring: false, recurringId: null, createdAt: stamp },
        { id: 'trx-18', type: 'expense', amount: 275000, categoryId: 'cat-7', accountId: 'acc-1', toAccountId: null, date: daysAgo(64), note: 'Belanja 2 bulan lalu', isRecurring: false, recurringId: null, createdAt: stamp }
    ];

    const budgets = [
        { id: 'bud-1', categoryId: 'cat-5', amount: 1500000, period: 'monthly', month: monthKey(now), createdAt: stamp },
        { id: 'bud-2', categoryId: 'cat-6', amount: 500000, period: 'monthly', month: monthKey(now), createdAt: stamp },
        { id: 'bud-3', categoryId: 'cat-7', amount: 1000000, period: 'monthly', month: monthKey(now), createdAt: stamp },
        { id: 'bud-4', categoryId: 'cat-9', amount: 300000, period: 'monthly', month: monthKey(now), createdAt: stamp },
        { id: 'bud-5', categoryId: 'cat-11', amount: 800000, period: 'monthly', month: monthKey(now), createdAt: stamp }
    ];

    const goals = [
        { id: 'goal-1', name: 'Laptop Baru', targetAmount: 15000000, currentAmount: 5000000, deadline: isoDate(new Date(now.getFullYear(), now.getMonth() + 6, 0)), color: '#2196F3', icon: 'fa-laptop', createdAt: stamp },
        { id: 'goal-2', name: 'Dana Darurat', targetAmount: 10000000, currentAmount: 3200000, deadline: isoDate(new Date(now.getFullYear(), now.getMonth() + 12, 0)), color: '#4CAF50', icon: 'fa-shield-alt', createdAt: stamp },
        { id: 'goal-3', name: 'Studi ke Luar Negeri', targetAmount: 40000000, currentAmount: 6000000, deadline: isoDate(new Date(now.getFullYear() + 2, now.getMonth() + 2, 0)), color: '#9C27B0', icon: 'fa-plane', createdAt: stamp }
    ];

    return {
        accounts,
        transactions,
        categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
        budgets,
        goals,
        settings: { ...DEFAULT_SETTINGS }
    };
}

function recomputeBalances(db) {
    db.accounts.forEach(acc => { acc.balance = Number(acc.openingBalance) || 0; });
    db.transactions.forEach(t => {
        const amount = Number(t.amount) || 0;
        if (t.type === 'income') {
            const acc = db.accounts.find(a => a.id === t.accountId);
            if (acc) acc.balance += amount;
        } else if (t.type === 'expense') {
            const acc = db.accounts.find(a => a.id === t.accountId);
            if (acc) acc.balance -= amount;
        } else if (t.type === 'transfer') {
            const from = db.accounts.find(a => a.id === t.accountId);
            const to = db.accounts.find(a => a.id === t.toAccountId);
            if (from) from.balance -= amount;
            if (to) to.balance += amount;
        }
    });
    return db;
}

function ensureFiles() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function emptyDb() {
    const db = { settings: { ...DEFAULT_SETTINGS } };
    COLLECTIONS.forEach(c => { db[c] = []; });
    return db;
}

function normalizeDb(raw) {
    const db = emptyDb();
    if (!raw || typeof raw !== 'object') return db;
    COLLECTIONS.forEach(key => {
        if (Array.isArray(raw[key])) db[key] = raw[key];
    });
    db.settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };

    // akun lama belum punya openingBalance: pakai saldo saat ini sebagai modal awal
    db.accounts.forEach(acc => {
        if (acc.openingBalance === undefined || acc.openingBalance === null) {
            acc.openingBalance = Number(acc.balance) || 0;
        }
    });

    return db;
}

function load() {
    ensureFiles();
    if (!fs.existsSync(STORE_FILE)) {
        const seeded = recomputeBalances(buildSeed());
        persist(seeded);
        return seeded;
    }
    try {
        const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
        return normalizeDb(parsed);
    } catch (err) {
        const fallbackFile = path.join(BACKUP_DIR, `corrupt-${Date.now()}.json`);
        try { fs.copyFileSync(STORE_FILE, fallbackFile); } catch (e) { /* ignore */ }
        console.error(`store.json rusak, dicadangkan ke ${fallbackFile}`);
        const seeded = recomputeBalances(buildSeed());
        persist(seeded);
        return seeded;
    }
}

let cache = null;

function get() {
    if (!cache) cache = load();
    return cache;
}

function persist(db) {
    ensureFiles();
    const tmp = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmp, STORE_FILE);
}

function commit() {
    recomputeBalances(cache);
    persist(cache);
    return cache;
}

function snapshot() {
    return JSON.parse(JSON.stringify(get()));
}

function reset() {
    cache = recomputeBalances(buildSeed());
    persist(cache);
    return cache;
}

module.exports = {
    COLLECTIONS,
    DEFAULT_CATEGORIES,
    DEFAULT_SETTINGS,
    DATA_DIR,
    STORE_FILE,
    get,
    commit,
    snapshot,
    reset,
    recomputeBalances
};