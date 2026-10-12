const API_BASE = (() => {
    const stored = localStorage.getItem('financeApp_apiBase');
    if (stored) return stored.replace(/\/$/, '');
    if (window.location.protocol === 'file:') return 'http://localhost:3000';
    return '';
})();

const COLLECTIONS = ['accounts', 'transactions', 'categories', 'budgets', 'goals'];
const LS_PREFIX = 'financeApp_';
const LS_KEYS = {
    accounts: `${LS_PREFIX}accounts`,
    transactions: `${LS_PREFIX}transactions`,
    categories: `${LS_PREFIX}categories`,
    budgets: `${LS_PREFIX}budgets`,
    goals: `${LS_PREFIX}goals`,
    settings: `${LS_PREFIX}settings`,
    seeded: `${LS_PREFIX}seeded`
};

const DEFAULT_SETTINGS = {
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    language: 'id',
    firstDayOfWeek: 1,
    compactNumbers: false
};

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

let mode = 'unknown';
const listeners = new Set();

function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readLocal(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function writeLocal(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('Gagal menyimpan ke localStorage', e);
    }
}

function recomputeLocalBalances(accounts, transactions) {
    accounts.forEach(acc => { acc.balance = Number(acc.openingBalance) || 0; });
    transactions.forEach(t => {
        const amount = Number(t.amount) || 0;
        const from = accounts.find(a => a.id === t.accountId);
        const to = accounts.find(a => a.id === t.toAccountId);
        if (t.type === 'income' && from) from.balance += amount;
        if (t.type === 'expense' && from) from.balance -= amount;
        if (t.type === 'transfer') {
            if (from) from.balance -= amount;
            if (to) to.balance += amount;
        }
    });
}

const Api = {
    COLLECTIONS,
    DEFAULT_CATEGORIES,
    DEFAULT_SETTINGS,

    get mode() {
        return mode;
    },

    get isRemote() {
        return mode === 'remote';
    },

    setBase(url) {
        const clean = url.replace(/\/$/, '');
        localStorage.setItem('financeApp_apiBase', clean);
        location.reload();
    },

    onModeChange(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },

    setMode(next) {
        if (mode === next) return;
        mode = next;
        listeners.forEach(fn => fn(next));
    },

    async request(path, options = {}) {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options
        });

        const text = await res.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            data = null;
        }

        if (!res.ok) {
            const err = new Error((data && data.error) || `HTTP ${res.status}`);
            err.status = res.status;
            throw err;
        }
        return data;
    },

    async probe() {
        try {
            const health = await Api.request('/api/health');
            return !!health;
        } catch (e) {
            return false;
        }
    },

    async init() {
        if (await Api.probe()) {
            Api.setMode('remote');
        } else {
            Api.setMode('local');
        }
        return mode;
    },

    async loadState() {
        if (Api.isRemote) return Api.request('/api/state');

        let db = Api.readLocalDb();
        if (!db.accounts.length && !db.transactions.length && !localStorage.getItem(LS_KEYS.seeded)) {
            db = Api.buildDemoDb();
            Api.writeLocalDb(db);
            localStorage.setItem(LS_KEYS.seeded, '1');
        }
        return db;
    },

    readLocalDb() {
        const db = {};
        COLLECTIONS.forEach(key => {
            db[key] = readLocal(LS_KEYS[key]) || (key === 'categories' ? DEFAULT_CATEGORIES.map(c => ({ ...c })) : []);
        });
        db.settings = { ...DEFAULT_SETTINGS, ...(readLocal(LS_KEYS.settings) || {}) };
        return db;
    },

    writeLocalDb(db) {
        COLLECTIONS.forEach(key => {
            if (Array.isArray(db[key])) writeLocal(LS_KEYS[key], db[key]);
        });
        if (db.settings) writeLocal(LS_KEYS.settings, db.settings);
        recomputeLocalBalances(db.accounts || [], db.transactions || []);
        writeLocal(LS_KEYS.accounts, db.accounts);
    },

    buildDemoDb() {
        const now = new Date();
        const stamp = now.toISOString();
        const day = (n) => {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const accounts = [
            { id: 'acc-1', name: 'BCA', type: 'bank', openingBalance: 5000000, balance: 0, currency: 'IDR', color: '#2196F3', icon: 'fa-university', createdAt: stamp },
            { id: 'acc-2', name: 'GoPay', type: 'ewallet', openingBalance: 500000, balance: 0, currency: 'IDR', color: '#4CAF50', icon: 'fa-mobile-alt', createdAt: stamp },
            { id: 'acc-3', name: 'Dompet Tunai', type: 'cash', openingBalance: 300000, balance: 0, currency: 'IDR', color: '#FF9800', icon: 'fa-money-bill-wave', createdAt: stamp }
        ];

        const tx = (n, type, amount, categoryId, accountId, note, toAccountId = null) => ({
            id: `trx-${n}`, type, amount, categoryId, accountId, toAccountId,
            date: day(0), note, isRecurring: false, recurringId: null, createdAt: stamp
        });

        const transactions = [
            tx(1, 'income', 2500000, 'cat-1', 'acc-1', 'Beasiswa semester'),
            tx(2, 'income', 750000, 'cat-2', 'acc-1', 'Proyek desain logo', null),
            tx(3, 'expense', 38500, 'cat-5', 'acc-2', 'Makan siang campus'),
            tx(4, 'expense', 24000, 'cat-5', 'acc-2', 'Kopi & snack'),
            tx(5, 'expense', 62000, 'cat-6', 'acc-2', 'Gojek ke kampus'),
            tx(6, 'expense', 249000, 'cat-7', 'acc-1', 'Belanja bulanan'),
            tx(7, 'expense', 385000, 'cat-11', 'acc-1', 'Buku kuliah'),
            tx(8, 'expense', 145000, 'cat-8', 'acc-1', 'Tagihan listrik & internet'),
            tx(9, 'expense', 90000, 'cat-9', 'acc-3', 'Nonton bioskop'),
            tx(10, 'expense', 175000, 'cat-10', 'acc-1', 'Obat & cek-up'),
            tx(11, 'transfer', 500000, null, 'acc-1', 'Isi saldo GoPay', 'acc-2'),
            tx(12, 'expense', 300000, 'cat-12', 'acc-1', 'Setoran tabungan bulanan'),
            { ...tx(13, 'income', 1200000, 'cat-1', 'acc-1', 'Beasiswa bulan lalu'), date: day(32) },
            { ...tx(14, 'expense', 1450000, 'cat-5', 'acc-1', 'Makan & coping bulan lalu'), date: day(34) },
            { ...tx(15, 'expense', 320000, 'cat-11', 'acc-1', 'Modul & printer'), date: day(33) },
            { ...tx(16, 'income', 2100000, 'cat-1', 'acc-1', 'Beasiswa 2 bulan lalu'), date: day(63) },
            { ...tx(17, 'expense', 1680000, 'cat-5', 'acc-1', 'Makan 2 bulan lalu'), date: day(65) },
            { ...tx(18, 'expense', 275000, 'cat-7', 'acc-1', 'Belanja 2 bulan lalu'), date: day(64) }
        ];

        const goals = [
            { id: 'goal-1', name: 'Laptop Baru', targetAmount: 15000000, currentAmount: 5000000, deadline: day(-180), color: '#2196F3', icon: 'fa-laptop', createdAt: stamp },
            { id: 'goal-2', name: 'Dana Darurat', targetAmount: 10000000, currentAmount: 3200000, deadline: day(-365), color: '#4CAF50', icon: 'fa-shield-alt', createdAt: stamp },
            { id: 'goal-3', name: 'Studi ke Luar Negeri', targetAmount: 40000000, currentAmount: 6000000, deadline: day(-800), color: '#9C27B0', icon: 'fa-plane', createdAt: stamp }
        ];

        const budgets = [
            { id: 'bud-1', categoryId: 'cat-5', amount: 1500000, period: 'monthly', month, createdAt: stamp },
            { id: 'bud-2', categoryId: 'cat-6', amount: 500000, period: 'monthly', month, createdAt: stamp },
            { id: 'bud-3', categoryId: 'cat-7', amount: 1000000, period: 'monthly', month, createdAt: stamp },
            { id: 'bud-4', categoryId: 'cat-9', amount: 300000, period: 'monthly', month, createdAt: stamp },
            { id: 'bud-5', categoryId: 'cat-11', amount: 800000, period: 'monthly', month, createdAt: stamp }
        ];

        return {
            accounts,
            transactions,
            categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
            budgets,
            goals,
            settings: { ...DEFAULT_SETTINGS }
        };
    },

    async saveAll(data) {
        if (Api.isRemote) {
            COLLECTIONS.forEach(key => {
                if (Array.isArray(data[key])) writeLocal(LS_KEYS[key], data[key]);
            });
            if (data.settings) writeLocal(LS_KEYS.settings, data.settings);
            return Api.request('/api/import', { method: 'POST', body: JSON.stringify({ data }) });
        }
        return Api.saveLocal(data);
    },

    saveLocal(data) {
        COLLECTIONS.forEach(key => {
            if (Array.isArray(data[key])) writeLocal(LS_KEYS[key], data[key]);
        });
        if (data.settings) writeLocal(LS_KEYS.settings, data.settings);
        return Promise.resolve({ success: true });
    },

    async list(collection) {
        if (Api.isRemote) return Api.request(`/api/${collection}`);
        return readLocal(LS_KEYS[collection]) || [];
    },

    async create(collection, payload) {
        if (Api.isRemote) {
            return Api.request(`/api/${collection}`, { method: 'POST', body: JSON.stringify(payload) });
        }
        const prefix = { accounts: 'acc', transactions: 'trx', categories: 'cat', budgets: 'bud', goals: 'goal' }[collection];
        const list = readLocal(LS_KEYS[collection]) || (collection === 'categories' ? DEFAULT_CATEGORIES.map(c => ({ ...c })) : []);
        const record = { id: makeId(prefix || 'item'), createdAt: new Date().toISOString(), ...payload };

        if (collection === 'accounts') {
            if (record.openingBalance === undefined) record.openingBalance = Number(record.balance) || 0;
            record.openingBalance = Math.max(Number(record.openingBalance) || 0, 0);
            delete record.balance;
        }
        if (collection === 'goals') record.currentAmount = Math.min(Number(record.currentAmount) || 0, Number(record.targetAmount));

        list.push(record);
        writeLocal(LS_KEYS[collection], list);
        if (collection === 'goals' || collection === 'accounts' || collection === 'transactions') Api.syncBalancesLocal();
        return record;
    },

    async update(collection, idValue, payload) {
        if (Api.isRemote) {
            return Api.request(`/api/${collection}/${idValue}`, { method: 'PUT', body: JSON.stringify(payload) });
        }
        const list = readLocal(LS_KEYS[collection]) || [];
        const idx = list.findIndex(item => item.id === idValue);
        if (idx === -1) throw new Error('Data tidak ditemukan');

        list[idx] = { ...list[idx], ...payload, id: idValue, createdAt: list[idx].createdAt };

        if (collection === 'goals') list[idx].currentAmount = Math.min(Number(list[idx].currentAmount) || 0, Number(list[idx].targetAmount));
        if (collection === 'accounts') {
            if (list[idx].openingBalance === undefined) list[idx].openingBalance = Number(list[idx].balance) || 0;
            list[idx].openingBalance = Math.max(Number(list[idx].openingBalance) || 0, 0);
            delete list[idx].balance;
        }

        writeLocal(LS_KEYS[collection], list);
        if (collection === 'goals' || collection === 'accounts' || collection === 'transactions') Api.syncBalancesLocal();
        return list[idx];
    },

    async remove(collection, idValue) {
        if (Api.isRemote) {
            return Api.request(`/api/${collection}/${idValue}`, { method: 'DELETE' });
        }
        const list = readLocal(LS_KEYS[collection]) || [];
        const idx = list.findIndex(item => item.id === idValue);
        if (idx === -1) throw new Error('Data tidak ditemukan');
        const [removed] = list.splice(idx, 1);
        writeLocal(LS_KEYS[collection], list);
        if (collection === 'goals' || collection === 'accounts' || collection === 'transactions') Api.syncBalancesLocal();
        return removed;
    },

    syncBalancesLocal() {
        const accounts = readLocal(LS_KEYS.accounts) || [];
        const transactions = readLocal(LS_KEYS.transactions) || [];
        recomputeLocalBalances(accounts, transactions);
        writeLocal(LS_KEYS.accounts, accounts);
    },

    async saveSettings(settings) {
        if (Api.isRemote) {
            return Api.request('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });
        }
        writeLocal(LS_KEYS.settings, settings);
        return settings;
    },

    async resetAll() {
        if (Api.isRemote) {
            await Api.request('/api/reset', { method: 'POST' });
        }
        Object.values(LS_KEYS).forEach(key => localStorage.removeItem(key));
        return Api.loadState();
    },

    async clearLocal() {
        Object.values(LS_KEYS).forEach(key => localStorage.removeItem(key));
    }
};

window.Api = Api;