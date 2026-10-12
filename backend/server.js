const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..', 'Frontend')));

function id(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function bad(res, message) {
    return res.status(400).json({ error: message });
}

function notFound(res, message = 'Data tidak ditemukan') {
    return res.status(404).json({ error: message });
}

const NUMERIC_FIELDS = {
    transactions: ['amount'],
    budgets: ['amount'],
    goals: ['targetAmount', 'currentAmount'],
    accounts: ['balance', 'openingBalance']
};

const VALIDATORS = {
    transactions: (body) => {
        if (!['income', 'expense', 'transfer'].includes(body.type)) return 'Tipe transaksi tidak valid';
        if (body.amount === undefined || body.amount === null || body.amount === '') return 'Jumlah wajib diisi';
        if (!(Number(body.amount) > 0)) return 'Jumlah harus lebih dari 0';
        if (!body.date || isNaN(Date.parse(body.date))) return 'Tanggal tidak valid';
        if (body.type === 'transfer' && !body.toAccountId) return 'Akun tujuan transfer wajib dipilih';
        if (body.type !== 'transfer' && !body.categoryId) return 'Kategori wajib dipilih';
        if (!body.accountId) return 'Akun sumber wajib dipilih';
        return null;
    },
    accounts: (body) => (body.name && body.name.trim() ? null : 'Nama akun wajib diisi'),
    categories: (body) => {
        if (!body.name || !body.name.trim()) return 'Nama kategori wajib diisi';
        if (!['income', 'expense'].includes(body.type)) return 'Tipe kategori tidak valid';
        return null;
    },
    budgets: (body) => {
        if (!body.categoryId) return 'Kategori wajib dipilih';
        if (!(Number(body.amount) > 0)) return 'Jumlah anggaran harus lebih dari 0';
        if (!/^\d{4}-\d{2}$/.test(body.month || '')) return 'Periode bulan tidak valid (YYYY-MM)';
        return null;
    },
    goals: (body) => {
        if (!body.name || !body.name.trim()) return 'Nama target wajib diisi';
        if (!(Number(body.targetAmount) > 0)) return 'Target jumlah harus lebih dari 0';
        return null;
    }
};

const PREFIX = {
    accounts: 'acc',
    transactions: 'trx',
    categories: 'cat',
    budgets: 'bud',
    goals: 'goal'
};

function sanitize(collection, body) {
    const out = { ...body };
    delete out.id;
    delete out.createdAt;

    (NUMERIC_FIELDS[collection] || []).forEach(field => {
        if (field in out) out[field] = Number(out[field]) || 0;
    });

    if (collection === 'goals' && !('currentAmount' in out)) out.currentAmount = 0;
    if (collection === 'goals') out.currentAmount = Math.min(Math.max(out.currentAmount, 0), out.targetAmount);
    if (collection === 'transactions') {
        out.isRecurring = !!out.isRecurring;
        if (!('recurringId' in out)) out.recurringId = null;
        if (out.type !== 'transfer') out.toAccountId = null;
        else if (!out.categoryId) out.categoryId = null;
    }
    if (collection === 'budgets' && !out.period) out.period = 'monthly';

    if (collection === 'accounts') {
        // saldo selalu dihitung ulang dari openingBalance + transaksi
        if (!('openingBalance' in out)) out.openingBalance = Number(body.balance) || 0;
        out.openingBalance = Math.max(Number(out.openingBalance) || 0, 0);
        delete out.balance;
    }

    return out;
}

function registerCollection(name) {
    const db = () => store.get();

    app.get(`/api/${name}`, (req, res) => {
        res.json(db()[name]);
    });

    app.post(`/api/${name}`, (req, res) => {
        const body = req.body || {};
        const validate = VALIDATORS[name];
        const error = validate ? validate(body) : null;
        if (error) return bad(res, error);

        const record = { id: id(PREFIX[name]), createdAt: new Date().toISOString(), ...sanitize(name, body) };
        db()[name].push(record);
        store.commit();
        res.status(201).json(record);
    });

    // merge: field yang tidak dikirim tetap dipertahankan
    app.put(`/api/${name}/:id`, (req, res) => {
        const list = db()[name];
        const idx = list.findIndex(item => String(item.id) === String(req.params.id));
        if (idx === -1) return notFound(res);

        const merged = { ...list[idx], ...(req.body || {}) };
        const validate = VALIDATORS[name];
        const error = validate ? validate(merged) : null;
        if (error) return bad(res, error);

        list[idx] = { ...list[idx], ...sanitize(name, merged) };
        store.commit();
        res.json(list[idx]);
    });

    app.delete(`/api/${name}/:id`, (req, res) => {
        const list = db()[name];
        const idx = list.findIndex(item => String(item.id) === String(req.params.id));
        if (idx === -1) return notFound(res);
        const [removed] = list.splice(idx, 1);
        store.commit();
        res.json({ success: true, data: removed });
    });

    app.delete(`/api/${name}`, (req, res) => {
        const removed = db()[name].length;
        db()[name] = [];
        store.commit();
        res.json({ success: true, count: removed });
    });
}

store.COLLECTIONS.forEach(registerCollection);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', store: path.basename(store.STORE_FILE), collections: store.COLLECTIONS });
});

app.get('/api/state', (req, res) => {
    res.json(store.snapshot());
});

app.put('/api/settings', (req, res) => {
    store.get().settings = { ...store.DEFAULT_SETTINGS, ...store.get().settings, ...(req.body || {}) };
    store.commit();
    res.json(store.get().settings);
});

app.get('/api/summary', (req, res) => {
    const db = store.get();
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const inMonth = db.transactions.filter(t => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key;
    });

    const sum = (list, type) => list.filter(t => t.type === type).reduce((s, t) => s + (Number(t.amount) || 0), 0);

    res.json({
        totalIncome: sum(inMonth, 'income'),
        totalExpense: sum(inMonth, 'expense'),
        balance: db.accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0),
        totalBalance: db.accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0),
        count: inMonth.length,
        allTime: {
            income: sum(db.transactions, 'income'),
            expense: sum(db.transactions, 'expense')
        }
    });
});

app.post('/api/reset', (req, res) => {
    store.reset();
    res.json({ success: true });
});

app.post('/api/import', (req, res) => {
    const incoming = req.body && req.body.data ? req.body.data : req.body;
    if (!incoming || typeof incoming !== 'object') return bad(res, 'Data tidak valid');

    const db = store.get();
    let imported = 0;

    store.COLLECTIONS.forEach(key => {
        if (Array.isArray(incoming[key])) {
            db[key] = incoming[key];
            imported += incoming[key].length;
        }
    });

    if (incoming.settings) db.settings = { ...store.DEFAULT_SETTINGS, ...incoming.settings };

    if (!db.categories.length) db.categories = store.DEFAULT_CATEGORIES.map(c => ({ ...c }));

    store.commit();
    res.json({ success: true, count: imported });
});

app.get('/api/export', (req, res) => {
    res.setHeader('Content-Disposition', `attachment; filename="financeapp-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json({ ...store.snapshot(), exportedAt: new Date().toISOString() });
});

app.get('/api/transactions.csv', (req, res) => {
    const rows = store.get().transactions;
    const escape = (v) => {
        const s = v === undefined || v === null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = 'id,date,type,category,description,amount\n';
    const body = rows.map(t => {
        const cat = store.get().categories.find(c => c.id === t.categoryId);
        return [t.id, t.date, t.type, cat ? cat.name : '', t.note || '', t.amount].map(escape).join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(header + (body ? body + '\n' : ''));
});

app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`FinanceApp backend berjalan di http://localhost:${PORT}`);
        console.log(`Data tersimpan di: ${store.STORE_FILE}`);
    });
}

module.exports = app;