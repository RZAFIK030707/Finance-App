const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const CSV_FILE = path.join(DATA_DIR, 'transactions.csv');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'id,date,type,category,description,amount\n');
}

function readCSV() {
    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = isNaN(vals[i]) ? (vals[i] || '') : Number(vals[i]);
        });
        return obj;
    });
}

function writeCSV(transactions) {
    const header = 'id,date,type,category,description,amount\n';
    const rows = transactions.map(t =>
        `${t.id},${t.date},${t.type},${t.category},"${t.description}",${t.amount}`
    ).join('\n');
    fs.writeFileSync(CSV_FILE, header + rows + (rows ? '\n' : ''));
}

app.get('/api/transactions', (req, res) => {
    res.json(readCSV());
});

app.post('/api/transactions', (req, res) => {
    const transactions = readCSV();
    const newTransaction = {
        id: Date.now().toString(),
        date: req.body.date,
        type: req.body.type,
        category: req.body.category,
        description: req.body.description,
        amount: Number(req.body.amount)
    };
    transactions.push(newTransaction);
    writeCSV(transactions);
    res.status(201).json(newTransaction);
});

app.put('/api/transactions/:id', (req, res) => {
    const transactions = readCSV();
    const idx = transactions.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    transactions[idx] = { ...transactions[idx], ...req.body, id: req.params.id, amount: Number(req.body.amount) };
    writeCSV(transactions);
    res.json(transactions[idx]);
});

app.delete('/api/transactions/:id', (req, res) => {
    let transactions = readCSV();
    transactions = transactions.filter(t => t.id !== req.params.id);
    writeCSV(transactions);
    res.json({ success: true });
});

app.delete('/api/transactions', (req, res) => {
    writeCSV([]);
    res.json({ success: true });
});

app.get('/api/summary', (req, res) => {
    const transactions = readCSV();
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    res.json({ totalIncome, totalExpense, balance: totalIncome - totalExpense, count: transactions.length });
});

app.post('/api/import', (req, res) => {
    const { transactions: imported } = req.body;
    if (!Array.isArray(imported)) return res.status(400).json({ error: 'Data tidak valid' });
    const transactions = readCSV();
    imported.forEach(t => {
        transactions.push({
            id: t.id || Date.now().toString() + Math.random().toString(36).slice(2),
            date: t.date,
            type: t.type,
            category: t.category,
            description: t.description,
            amount: Number(t.amount)
        });
    });
    writeCSV(transactions);
    res.json({ success: true, count: imported.length });
});

app.listen(PORT, () => {
    console.log(`Finance App backend berjalan di http://localhost:${PORT}`);
    console.log(`Data tersimpan di: ${CSV_FILE}`);
});
