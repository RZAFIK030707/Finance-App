const STORAGE_KEYS = {
    accounts: 'financeApp_accounts',
    transactions: 'financeApp_transactions',
    categories: 'financeApp_categories',
    budgets: 'financeApp_budgets',
    goals: 'financeApp_goals',
    settings: 'financeApp_settings',
    theme: 'financeApp_theme'
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

const DEFAULT_SETTINGS = {
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    language: 'id'
};

const CURRENCY_SYMBOLS = {
    IDR: 'Rp',
    USD: '$',
    EUR: '€',
    SGD: 'S$',
    MYR: 'RM'
};

let state = {
    accounts: [],
    transactions: [],
    categories: [],
    budgets: [],
    goals: [],
    settings: { ...DEFAULT_SETTINGS },
    currentPage: 'dashboard',
    charts: {}
};

function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function loadState() {
    try {
        const savedAccounts = localStorage.getItem(STORAGE_KEYS.accounts);
        const savedTransactions = localStorage.getItem(STORAGE_KEYS.transactions);
        const savedCategories = localStorage.getItem(STORAGE_KEYS.categories);
        const savedBudgets = localStorage.getItem(STORAGE_KEYS.budgets);
        const savedGoals = localStorage.getItem(STORAGE_KEYS.goals);
        const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);

        state.accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
        state.transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
        state.categories = savedCategories ? JSON.parse(savedCategories) : [...DEFAULT_CATEGORIES];
        state.budgets = savedBudgets ? JSON.parse(savedBudgets) : [];
        state.goals = savedGoals ? JSON.parse(savedGoals) : [];
        state.settings = savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : { ...DEFAULT_SETTINGS };

        if (!savedAccounts && !savedTransactions) {
            seedDemoData();
        }
    } catch (e) {
        console.error('Error loading state:', e);
        state.categories = [...DEFAULT_CATEGORIES];
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(state.accounts));
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(state.transactions));
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(state.categories));
    localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(state.budgets));
    localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(state.goals));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
}

function seedDemoData() {
    const acc1 = { id: generateId(), name: 'BCA', type: 'bank', balance: 5000000, currency: 'IDR', color: '#2196F3', icon: 'fa-university', createdAt: new Date().toISOString() };
    const acc2 = { id: generateId(), name: 'GoPay', type: 'ewallet', balance: 500000, currency: 'IDR', color: '#4CAF50', icon: 'fa-mobile-alt', createdAt: new Date().toISOString() };
    const acc3 = { id: generateId(), name: 'Tunai', type: 'cash', balance: 300000, currency: 'IDR', color: '#FF9800', icon: 'fa-money-bill-wave', createdAt: new Date().toISOString() };
    state.accounts = [acc1, acc2, acc3];

    const now = new Date();
    const demoTransactions = [
        { id: generateId(), type: 'income', amount: 2500000, categoryId: 'cat-1', accountId: acc1.id, toAccountId: null, date: formatDateISO(now), note: 'Gaji bulanan', isRecurring: false, recurringId: null, createdAt: now.toISOString() },
        { id: generateId(), type: 'expense', amount: 150000, categoryId: 'cat-5', accountId: acc2.id, toAccountId: null, date: formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)), note: 'Makan siang', isRecurring: false, recurringId: null, createdAt: now.toISOString() },
        { id: generateId(), type: 'expense', amount: 50000, categoryId: 'cat-6', accountId: acc2.id, toAccountId: null, date: formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)), note: 'Gojek ke kampus', isRecurring: false, recurringId: null, createdAt: now.toISOString() },
        { id: generateId(), type: 'expense', amount: 200000, categoryId: 'cat-7', accountId: acc1.id, toAccountId: null, date: formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)), note: 'Belanja bulanan', isRecurring: false, recurringId: null, createdAt: now.toISOString() },
        { id: generateId(), type: 'expense', amount: 100000, categoryId: 'cat-8', accountId: acc1.id, toAccountId: null, date: formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4)), note: 'Tagihan listrik', isRecurring: false, recurringId: null, createdAt: now.toISOString() },
        { id: generateId(), type: 'expense', amount: 75000, categoryId: 'cat-9', accountId: acc3.id, toAccountId: null, date: formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5)), note: 'Nonton bioskop', isRecurring: false, recurringId: null, createdAt: now.toISOString() },
        { id: generateId(), type: 'transfer', amount: 500000, categoryId: null, accountId: acc1.id, toAccountId: acc2.id, date: formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)), note: 'Transfer ke GoPay', isRecurring: false, recurringId: null, createdAt: now.toISOString() },
        { id: generateId(), type: 'income', amount: 500000, categoryId: 'cat-2', accountId: acc1.id, toAccountId: null, date: formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)), note: 'Proyek desain logo', isRecurring: false, recurringId: null, createdAt: now.toISOString() },
        { id: generateId(), type: 'expense', amount: 300000, categoryId: 'cat-11', accountId: acc1.id, toAccountId: null, date: formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)), note: 'Buku kuliah', isRecurring: false, recurringId: null, createdAt: now.toISOString() },
        { id: generateId(), type: 'expense', amount: 50000, categoryId: 'cat-12', accountId: acc1.id, toAccountId: null, date: formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)), note: 'Tabungan bulanan', isRecurring: false, recurringId: null, createdAt: now.toISOString() }
    ];
    state.transactions = demoTransactions;

    state.budgets = [
        { id: generateId(), categoryId: 'cat-5', amount: 1500000, period: 'monthly', month: getMonthKey(now), createdAt: now.toISOString() },
        { id: generateId(), categoryId: 'cat-6', amount: 500000, period: 'monthly', month: getMonthKey(now), createdAt: now.toISOString() },
        { id: generateId(), categoryId: 'cat-7', amount: 1000000, period: 'monthly', month: getMonthKey(now), createdAt: now.toISOString() },
        { id: generateId(), categoryId: 'cat-9', amount: 300000, period: 'monthly', month: getMonthKey(now), createdAt: now.toISOString() }
    ];

    state.goals = [
        { id: generateId(), name: 'Laptop Baru', targetAmount: 15000000, currentAmount: 5000000, deadline: new Date(now.getFullYear(), now.getMonth() + 6, 0).toISOString().split('T')[0], color: '#2196F3', icon: 'fa-laptop', createdAt: now.toISOString() },
        { id: generateId(), name: 'Dana Darurat', targetAmount: 10000000, currentAmount: 3000000, deadline: new Date(now.getFullYear(), now.getMonth() + 12, 0).toISOString().split('T')[0], color: '#4CAF50', icon: 'fa-shield-alt', createdAt: now.toISOString() }
    ];

    saveState();
}

function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(amount) {
    const symbol = CURRENCY_SYMBOLS[state.settings.currency] || 'Rp';
    const formatted = Math.abs(amount).toLocaleString('id-ID');
    return `${symbol} ${formatted}`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch (state.settings.dateFormat) {
        case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
        default: return `${day}/${month}/${year}`;
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle' };
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span class="toast-message">${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openModal(title, bodyHTML, footerButtons) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    const footer = document.getElementById('modalFooter');
    footer.innerHTML = '';
    footerButtons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `btn ${btn.class || 'btn-outline'}`;
        button.textContent = btn.text;
        button.onclick = btn.onClick;
        footer.appendChild(button);
    });
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function navigateTo(page) {
    state.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        transactions: 'Transaksi',
        accounts: 'Akun',
        budgets: 'Anggaran',
        goals: 'Target Keuangan',
        reports: 'Laporan',
        settings: 'Pengaturan'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

    if (window.innerWidth < 992) {
        document.getElementById('sidebar').classList.remove('open');
    }

    renderPage(page);
}

function renderPage(page) {
    switch (page) {
        case 'dashboard': renderDashboard(); break;
        case 'transactions': renderTransactions(); break;
        case 'accounts': renderAccounts(); break;
        case 'budgets': renderBudgets(); break;
        case 'goals': renderGoals(); break;
        case 'reports': renderReports(); break;
        case 'settings': renderSettings(); break;
    }
}

function renderDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = state.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = state.accounts.reduce((sum, a) => sum + a.balance, 0);
    const savings = income - expense;

    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthlyExpense').textContent = formatCurrency(expense);
    document.getElementById('monthlyIncome').textContent = formatCurrency(income);
    document.getElementById('monthlySavings').textContent = formatCurrency(savings);

    renderTrendChart();
    renderCategoryChart();
    renderRecentTransactions();
}

function renderTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    if (state.charts.trend) state.charts.trend.destroy();

    const months = [];
    const incomeData = [];
    const expenseData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
        months.push(monthName);

        const monthTransactions = state.transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        });

        incomeData.push(monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
        expenseData.push(monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
    }

    state.charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } } },
            scales: {
                x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, grid: { color: getComputedStyle(document.body).getPropertyValue('--border') } },
                y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, grid: { color: getComputedStyle(document.body).getPropertyValue('--border') } }
            }
        }
    });
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (state.charts.category) state.charts.category.destroy();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenseTransactions = state.transactions.filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const categoryTotals = {};
    expenseTransactions.forEach(t => {
        const cat = state.categories.find(c => c.id === t.categoryId);
        if (cat) {
            categoryTotals[cat.name] = (categoryTotals[cat.name] || 0) + t.amount;
        }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = labels.map((_, i) => {
        const palette = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'];
        return palette[i % palette.length];
    });

    state.charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Belum ada data'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: data.length ? colors : ['#9E9E9E'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary'), padding: 15 } }
            }
        }
    });
}

function renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    const recent = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (!recent.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>Belum ada transaksi</p></div>';
        return;
    }

    container.innerHTML = recent.map(t => {
        const cat = state.categories.find(c => c.id === t.categoryId);
        const acc = state.accounts.find(a => a.id === t.accountId);
        const icon = cat ? cat.icon : 'fa-exchange-alt';
        const color = cat ? cat.color : '#2196F3';
        const typeClass = t.type === 'income' ? 'income' : t.type === 'expense' ? 'expense' : 'transfer';
        const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '';

        return `
            <div class="transaction-item">
                <div class="transaction-icon" style="background: ${color}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="transaction-info">
                    <div class="transaction-note">${t.note || (cat ? cat.name : 'Transfer')}</div>
                    <div class="transaction-meta">${formatDate(t.date)} • ${acc ? acc.name : '-'}</div>
                </div>
                <div class="transaction-amount ${typeClass}">${sign}${formatCurrency(t.amount)}</div>
            </div>
        `;
    }).join('');
}

function renderTransactions() {
    populateFilterOptions();
    applyFilters();
}

function populateFilterOptions() {
    const accountSelect = document.getElementById('filterAccount');
    const categorySelect = document.getElementById('filterCategory');

    accountSelect.innerHTML = '<option value="">Semua</option>' + state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    categorySelect.innerHTML = '<option value="">Semua</option>' + state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function applyFilters() {
    const type = document.getElementById('filterType').value;
    const accountId = document.getElementById('filterAccount').value;
    const categoryId = document.getElementById('filterCategory').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;

    let filtered = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (type) filtered = filtered.filter(t => t.type === type);
    if (accountId) filtered = filtered.filter(t => t.accountId === accountId || t.toAccountId === accountId);
    if (categoryId) filtered = filtered.filter(t => t.categoryId === categoryId);
    if (dateFrom) filtered = filtered.filter(t => t.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(t => t.date <= dateTo);

    const tbody = document.getElementById('transactionsTableBody');

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-receipt"></i><p>Tidak ada transaksi ditemukan</p></div></td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(t => {
        const cat = state.categories.find(c => c.id === t.categoryId);
        const acc = state.accounts.find(a => a.id === t.accountId);
        const toAcc = state.accounts.find(a => a.id === t.toAccountId);
        const typeClass = t.type === 'income' ? 'amount-income' : t.type === 'expense' ? 'amount-expense' : 'amount-transfer';
        const typeLabel = t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer';

        return `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td>${t.note || '-'}</td>
                <td>${cat ? cat.name : typeLabel}</td>
                <td>${acc ? acc.name : '-'}${toAcc ? ` → ${toAcc.name}` : ''}</td>
                <td class="${typeClass}">${formatCurrency(t.amount)}</td>
                <td>
                    <button class="btn-icon" onclick="editTransaction('${t.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon danger" onclick="deleteTransaction('${t.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderAccounts() {
    const grid = document.getElementById('accountsGrid');

    if (!state.accounts.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-university"></i><p>Belum ada akun. Tambahkan akun pertama Anda.</p></div>';
        return;
    }

    grid.innerHTML = state.accounts.map(acc => `
        <div class="account-card">
            <div class="account-header">
                <div class="account-icon" style="background: ${acc.color}">
                    <i class="fas ${acc.icon || 'fa-wallet'}"></i>
                </div>
                <div>
                    <div class="account-name">${acc.name}</div>
                    <div class="account-type">${acc.type}</div>
                </div>
            </div>
            <div class="account-balance">${formatCurrency(acc.balance)}</div>
            <div style="margin-top: 12px; display: flex; gap: 8px;">
                <button class="btn btn-outline btn-sm" onclick="editAccount('${acc.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-outline btn-sm" onclick="deleteAccount('${acc.id}')"><i class="fas fa-trash"></i> Hapus</button>
            </div>
        </div>
    `).join('');
}

function renderBudgets() {
    const container = document.getElementById('budgetsList');
    const now = new Date();
    const currentMonthKey = getMonthKey(now);

    const monthlyBudgets = state.budgets.filter(b => b.month === currentMonthKey);

    if (!monthlyBudgets.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-wallet"></i><p>Belum ada anggaran. Tambahkan anggaran bulanan Anda.</p></div>';
        return;
    }

    container.innerHTML = monthlyBudgets.map(budget => {
        const cat = state.categories.find(c => c.id === budget.categoryId);
        if (!cat) return '';

        const spent = state.transactions
            .filter(t => {
                const d = new Date(t.date);
                return t.type === 'expense' && t.categoryId === budget.categoryId && getMonthKey(d) === currentMonthKey;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const percent = Math.min((spent / budget.amount) * 100, 100);
        const remaining = budget.amount - spent;
        const progressClass = percent >= 100 ? 'danger' : percent >= 75 ? 'warning' : 'safe';

        return `
            <div class="budget-item">
                <div class="budget-header">
                    <div class="budget-category">
                        <i class="fas ${cat.icon}" style="background: ${cat.color}"></i>
                        <span>${cat.name}</span>
                    </div>
                    <div class="budget-amount">
                        <span class="spent">${formatCurrency(spent)}</span> / ${formatCurrency(budget.amount)}
                        (<span class="${remaining >= 0 ? 'remaining' : 'over'}">${remaining >= 0 ? formatCurrency(remaining) + ' tersisa' : 'Lebih ' + formatCurrency(Math.abs(remaining))}</span>)
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${percent}%"></div>
                </div>
                <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${percent.toFixed(1)}% terpakai</span>
                    <button class="btn-icon danger" onclick="deleteBudget('${budget.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function renderGoals() {
    const grid = document.getElementById('goalsGrid');

    if (!state.goals.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-bullseye"></i><p>Belum ada target. Tetapkan target keuangan Anda.</p></div>';
        return;
    }

    grid.innerHTML = state.goals.map(goal => {
        const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        const remaining = goal.targetAmount - goal.currentAmount;
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        return `
            <div class="goal-card">
                <div class="goal-header">
                    <div class="goal-icon" style="background: ${goal.color}">
                        <i class="fas ${goal.icon || 'fa-bullseye'}"></i>
                    </div>
                    <div>
                        <div class="goal-name">${goal.name}</div>
                        <div class="goal-deadline">${daysLeft > 0 ? `${daysLeft} hari lagi` : 'Tercapai!'}</div>
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="goal-amounts">
                        <span class="current">${formatCurrency(goal.currentAmount)}</span>
                        <span>dari ${formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill safe" style="width: ${percent}%"></div>
                    </div>
                    <div class="goal-percent">${percent.toFixed(1)}%</div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="btn btn-outline btn-sm" onclick="contributeGoal('${goal.id}')"><i class="fas fa-plus"></i> Tambah</button>
                    <button class="btn btn-outline btn-sm" onclick="editGoal('${goal.id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-outline btn-sm" onclick="deleteGoal('${goal.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function renderReports() {
    renderReportChart();
    renderReportSummary();
}

function renderReportChart() {
    const ctx = document.getElementById('reportChart');
    if (!ctx) return;

    if (state.charts.report) state.charts.report.destroy();

    const period = document.getElementById('reportPeriod').value;
    const type = document.getElementById('reportType').value;
    const now = new Date();
    let months = [];

    if (period === 'year') {
        for (let i = 0; i < 12; i++) {
            months.push(new Date(now.getFullYear(), i, 1));
        }
    } else {
        const count = parseInt(period);
        for (let i = count - 1; i >= 0; i--) {
            months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
        }
    }

    const labels = months.map(d => d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }));

    if (type === 'cashflow') {
        const incomeData = months.map(d => state.transactions.filter(t => {
            const td = new Date(t.date);
            return t.type === 'income' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        }).reduce((s, t) => s + t.amount, 0));

        const expenseData = months.map(d => state.transactions.filter(t => {
            const td = new Date(t.date);
            return t.type === 'expense' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        }).reduce((s, t) => s + t.amount, 0));

        state.charts.report = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Pemasukan', data: incomeData, backgroundColor: '#4CAF50' },
                    { label: 'Pengeluaran', data: expenseData, backgroundColor: '#f44336' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } } },
                scales: {
                    x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, grid: { color: getComputedStyle(document.body).getPropertyValue('--border') } },
                    y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, grid: { color: getComputedStyle(document.body).getPropertyValue('--border') } }
                }
            }
        });
    } else if (type === 'category') {
        const categoryTotals = {};
        const targetMonth = months[months.length - 1];

        state.transactions.filter(t => {
            const td = new Date(t.date);
            return t.type === 'expense' && td.getMonth() === targetMonth.getMonth() && td.getFullYear() === targetMonth.getFullYear();
        }).forEach(t => {
            const cat = state.categories.find(c => c.id === t.categoryId);
            if (cat) categoryTotals[cat.name] = (categoryTotals[cat.name] || 0) + t.amount;
        });

        const catLabels = Object.keys(categoryTotals);
        const catData = Object.values(categoryTotals);
        const catColors = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'];

        state.charts.report = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: catLabels.length ? catLabels : ['Belum ada data'],
                datasets: [{ data: catData.length ? catData : [1], backgroundColor: catColors, borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary'), padding: 15 } } }
            }
        });
    } else {
        const accountData = state.accounts.map(acc => {
            return state.transactions.filter(t => {
                return t.accountId === acc.id && t.type === 'expense';
            }).reduce((s, t) => s + t.amount, 0);
        });

        state.charts.report = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: state.accounts.map(a => a.name),
                datasets: [{ label: 'Total Pengeluaran', data: accountData, backgroundColor: state.accounts.map(a => a.color) }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } } },
                scales: {
                    x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, grid: { color: getComputedStyle(document.body).getPropertyValue('--border') } },
                    y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') }, grid: { color: getComputedStyle(document.body).getPropertyValue('--border') } }
                }
            }
        });
    }
}

function renderReportSummary() {
    const container = document.getElementById('reportSummary');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = state.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netCashflow = totalIncome - totalExpense;
    const transactionCount = monthlyTransactions.length;
    const avgPerTransaction = transactionCount > 0 ? (totalIncome + totalExpense) / transactionCount : 0;

    container.innerHTML = `
        <div class="summary-item">
            <div class="summary-label">Total Pemasukan</div>
            <div class="summary-value income">${formatCurrency(totalIncome)}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Total Pengeluaran</div>
            <div class="summary-value expense">${formatCurrency(totalExpense)}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Arus Kas Bersih</div>
            <div class="summary-value net">${formatCurrency(netCashflow)}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Jumlah Transaksi</div>
            <div class="summary-value">${transactionCount}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Rata-rata Transaksi</div>
            <div class="summary-value">${formatCurrency(avgPerTransaction)}</div>
        </div>
    `;
}

function renderSettings() {
    document.getElementById('currencySelect').value = state.settings.currency;
    document.getElementById('dateFormatSelect').value = state.settings.dateFormat;
    document.getElementById('languageSelect').value = state.settings.language;
}

function openTransactionModal(transaction = null) {
    const isEdit = !!transaction;
    const type = transaction?.type || 'expense';
    const amount = transaction?.amount || '';
    const note = transaction?.note || '';
    const date = transaction?.date || formatDateISO(new Date());
    const accountId = transaction?.accountId || (state.accounts[0]?.id || '');
    const toAccountId = transaction?.toAccountId || '';
    const categoryId = transaction?.categoryId || '';

    const accountOptions = state.accounts.map(a => `<option value="${a.id}" ${a.id === accountId ? 'selected' : ''}>${a.name}</option>`).join('');
    const toAccountOptions = state.accounts.map(a => `<option value="${a.id}" ${a.id === toAccountId ? 'selected' : ''}>${a.name}</option>`).join('');
    const categoryOptions = state.categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense')).map(c => `<option value="${c.id}" ${c.id === categoryId ? 'selected' : ''}>${c.name}</option>`).join('');

    const bodyHTML = `
        <div class="form-group">
            <label>Tipe Transaksi</label>
            <select id="trxType" onchange="updateTransactionForm()">
                <option value="expense" ${type === 'expense' ? 'selected' : ''}>Pengeluaran</option>
                <option value="income" ${type === 'income' ? 'selected' : ''}>Pemasukan</option>
                <option value="transfer" ${type === 'transfer' ? 'selected' : ''}>Transfer</option>
            </select>
        </div>
        <div class="form-group">
            <label>Jumlah</label>
            <input type="number" id="trxAmount" value="${amount}" placeholder="0" min="0" step="1000">
        </div>
        <div class="form-group" id="categoryGroup">
            <label>Kategori</label>
            <select id="trxCategory">${categoryOptions}</select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Dari Akun</label>
                <select id="trxAccount">${accountOptions}</select>
            </div>
            <div class="form-group" id="toAccountGroup" style="display: none;">
                <label>Ke Akun</label>
                <select id="trxToAccount">${toAccountOptions}</select>
            </div>
        </div>
        <div class="form-group">
            <label>Tanggal</label>
            <input type="date" id="trxDate" value="${date}">
        </div>
        <div class="form-group">
            <label>Catatan</label>
            <input type="text" id="trxNote" value="${note}" placeholder="Tambahkan catatan...">
        </div>
    `;

    const footerButtons = [
        { text: 'Batal', class: 'btn-outline', onClick: closeModal },
        { text: isEdit ? 'Simpan' : 'Tambah', class: 'btn-primary', onClick: () => isEdit ? saveTransactionEdit(transaction.id) : saveTransaction() }
    ];

    openModal(isEdit ? 'Edit Transaksi' : 'Tambah Transaksi', bodyHTML, footerButtons);
    updateTransactionForm();
}

function updateTransactionForm() {
    const type = document.getElementById('trxType').value;
    const categoryGroup = document.getElementById('categoryGroup');
    const toAccountGroup = document.getElementById('toAccountGroup');
    const categorySelect = document.getElementById('trxCategory');

    if (type === 'transfer') {
        categoryGroup.style.display = 'none';
        toAccountGroup.style.display = 'block';
    } else {
        categoryGroup.style.display = 'block';
        toAccountGroup.style.display = 'none';
        const categories = state.categories.filter(c => c.type === type);
        categorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
}

function saveTransaction() {
    const type = document.getElementById('trxType').value;
    const amount = parseFloat(document.getElementById('trxAmount').value);
    const date = document.getElementById('trxDate').value;
    const note = document.getElementById('trxNote').value;
    const accountId = document.getElementById('trxAccount').value;

    if (!amount || amount <= 0) { showToast('Jumlah harus lebih dari 0', 'error'); return; }
    if (!accountId) { showToast('Pilih akun terlebih dahulu', 'error'); return; }

    const transaction = {
        id: generateId(),
        type,
        amount,
        categoryId: type !== 'transfer' ? document.getElementById('trxCategory').value : null,
        accountId,
        toAccountId: type === 'transfer' ? document.getElementById('trxToAccount').value : null,
        date,
        note,
        isRecurring: false,
        recurringId: null,
        createdAt: new Date().toISOString()
    };

    if (type === 'transfer' && !transaction.toAccountId) {
        showToast('Pilih akun tujuan transfer', 'error');
        return;
    }

    state.transactions.push(transaction);
    updateAccountBalances();
    saveState();
    closeModal();
    renderPage(state.currentPage);
    showToast('Transaksi berhasil ditambahkan');
}

function saveTransactionEdit(id) {
    const transaction = state.transactions.find(t => t.id === id);
    if (!transaction) return;

    const type = document.getElementById('trxType').value;
    const amount = parseFloat(document.getElementById('trxAmount').value);
    const date = document.getElementById('trxDate').value;
    const note = document.getElementById('trxNote').value;
    const accountId = document.getElementById('trxAccount').value;

    if (!amount || amount <= 0) { showToast('Jumlah harus lebih dari 0', 'error'); return; }

    transaction.type = type;
    transaction.amount = amount;
    transaction.date = date;
    transaction.note = note;
    transaction.accountId = accountId;
    transaction.categoryId = type !== 'transfer' ? document.getElementById('trxCategory').value : null;
    transaction.toAccountId = type === 'transfer' ? document.getElementById('trxToAccount').value : null;

    updateAccountBalances();
    saveState();
    closeModal();
    renderPage(state.currentPage);
    showToast('Transaksi berhasil diperbarui');
}

function editTransaction(id) {
    const transaction = state.transactions.find(t => t.id === id);
    if (transaction) openTransactionModal(transaction);
}

function deleteTransaction(id) {
    if (!confirm('Hapus transaksi ini?')) return;
    state.transactions = state.transactions.filter(t => t.id !== id);
    updateAccountBalances();
    saveState();
    renderPage(state.currentPage);
    showToast('Transaksi dihapus');
}

function updateAccountBalances() {
    state.accounts.forEach(acc => { acc.balance = 0; });

    state.transactions.forEach(t => {
        if (t.type === 'income') {
            const acc = state.accounts.find(a => a.id === t.accountId);
            if (acc) acc.balance += t.amount;
        } else if (t.type === 'expense') {
            const acc = state.accounts.find(a => a.id === t.accountId);
            if (acc) acc.balance -= t.amount;
        } else if (t.type === 'transfer') {
            const fromAcc = state.accounts.find(a => a.id === t.accountId);
            const toAcc = state.accounts.find(a => a.id === t.toAccountId);
            if (fromAcc) fromAcc.balance -= t.amount;
            if (toAcc) toAcc.balance += t.amount;
        }
    });
}

function openAccountModal(account = null) {
    const isEdit = !!account;
    const name = account?.name || '';
    const type = account?.type || 'bank';
    const balance = account?.balance || '';
    const color = account?.color || '#2196F3';
    const icon = account?.icon || 'fa-university';

    const bodyHTML = `
        <div class="form-group">
            <label>Nama Akun</label>
            <input type="text" id="accName" value="${name}" placeholder="Contoh: BCA, GoPay, Tunai">
        </div>
        <div class="form-group">
            <label>Tipe Akun</label>
            <select id="accType">
                <option value="bank" ${type === 'bank' ? 'selected' : ''}>Bank</option>
                <option value="cash" ${type === 'cash' ? 'selected' : ''}>Tunai</option>
                <option value="ewallet" ${type === 'ewallet' ? 'selected' : ''}>E-Wallet</option>
                <option value="credit" ${type === 'credit' ? 'selected' : ''}>Kartu Kredit</option>
            </select>
        </div>
        <div class="form-group">
            <label>Saldo Awal</label>
            <input type="number" id="accBalance" value="${balance}" placeholder="0" min="0" step="1000">
        </div>
        <div class="form-group">
            <label>Warna</label>
            <input type="color" id="accColor" value="${color}" style="width: 100%; height: 40px; border: none; border-radius: 8px; cursor: pointer;">
        </div>
        <div class="form-group">
            <label>Icon</label>
            <select id="accIcon">
                <option value="fa-university" ${icon === 'fa-university' ? 'selected' : ''}><i class="fas fa-university"></i> Bank</option>
                <option value="fa-money-bill-wave" ${icon === 'fa-money-bill-wave' ? 'selected' : ''}>Tunai</option>
                <option value="fa-mobile-alt" ${icon === 'fa-mobile-alt' ? 'selected' : ''}>E-Wallet</option>
                <option value="fa-credit-card" ${icon === 'fa-credit-card' ? 'selected' : ''}>Kartu Kredit</option>
                <option value="fa-wallet" ${icon === 'fa-wallet' ? 'selected' : ''}>Dompet</option>
                <option value="fa-piggy-bank" ${icon === 'fa-piggy-bank' ? 'selected' : ''}>Celengan</option>
            </select>
        </div>
    `;

    const footerButtons = [
        { text: 'Batal', class: 'btn-outline', onClick: closeModal },
        { text: isEdit ? 'Simpan' : 'Tambah', class: 'btn-primary', onClick: () => isEdit ? saveAccountEdit(account.id) : saveAccount() }
    ];

    openModal(isEdit ? 'Edit Akun' : 'Tambah Akun', bodyHTML, footerButtons);
}

function saveAccount() {
    const name = document.getElementById('accName').value.trim();
    const type = document.getElementById('accType').value;
    const balance = parseFloat(document.getElementById('accBalance').value) || 0;
    const color = document.getElementById('accColor').value;
    const icon = document.getElementById('accIcon').value;

    if (!name) { showToast('Nama akun wajib diisi', 'error'); return; }

    state.accounts.push({
        id: generateId(),
        name,
        type,
        balance,
        currency: state.settings.currency,
        color,
        icon,
        createdAt: new Date().toISOString()
    });

    saveState();
    closeModal();
    renderPage(state.currentPage);
    showToast('Akun berhasil ditambahkan');
}

function saveAccountEdit(id) {
    const account = state.accounts.find(a => a.id === id);
    if (!account) return;

    account.name = document.getElementById('accName').value.trim();
    account.type = document.getElementById('accType').value;
    account.color = document.getElementById('accColor').value;
    account.icon = document.getElementById('accIcon').value;

    saveState();
    closeModal();
    renderPage(state.currentPage);
    showToast('Akun berhasil diperbarui');
}

function editAccount(id) {
    const account = state.accounts.find(a => a.id === id);
    if (account) openAccountModal(account);
}

function deleteAccount(id) {
    if (!confirm('Hapus akun ini? Terkait transaksi tidak akan dihapus.')) return;
    state.accounts = state.accounts.filter(a => a.id !== id);
    saveState();
    renderPage(state.currentPage);
    showToast('Akun dihapus');
}

function openBudgetModal() {
    const now = new Date();
    const currentMonthKey = getMonthKey(now);
    const expenseCategories = state.categories.filter(c => c.type === 'expense');

    const bodyHTML = `
        <div class="form-group">
            <label>Kategori</label>
            <select id="budgetCategory">
                ${expenseCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Anggaran Bulanan</label>
            <input type="number" id="budgetAmount" placeholder="0" min="0" step="10000">
        </div>
    `;

    const footerButtons = [
        { text: 'Batal', class: 'btn-outline', onClick: closeModal },
        { text: 'Tambah', class: 'btn-primary', onClick: saveBudget }
    ];

    openModal('Tambah Anggaran', bodyHTML, footerButtons);
}

function saveBudget() {
    const categoryId = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    const now = new Date();
    const monthKey = getMonthKey(now);

    if (!amount || amount <= 0) { showToast('Jumlah anggaran harus lebih dari 0', 'error'); return; }

    const existing = state.budgets.find(b => b.categoryId === categoryId && b.month === monthKey);
    if (existing) {
        existing.amount = amount;
    } else {
        state.budgets.push({
            id: generateId(),
            categoryId,
            amount,
            period: 'monthly',
            month: monthKey,
            createdAt: new Date().toISOString()
        });
    }

    saveState();
    closeModal();
    renderPage(state.currentPage);
    showToast('Anggaran berhasil disimpan');
}

function deleteBudget(id) {
    if (!confirm('Hapus anggaran ini?')) return;
    state.budgets = state.budgets.filter(b => b.id !== id);
    saveState();
    renderPage(state.currentPage);
    showToast('Anggaran dihapus');
}

function openGoalModal(goal = null) {
    const isEdit = !!goal;
    const name = goal?.name || '';
    const targetAmount = goal?.targetAmount || '';
    const currentAmount = goal?.currentAmount || '';
    const deadline = goal?.deadline || '';
    const color = goal?.color || '#2196F3';
    const icon = goal?.icon || 'fa-bullseye';

    const bodyHTML = `
        <div class="form-group">
            <label>Nama Target</label>
            <input type="text" id="goalName" value="${name}" placeholder="Contoh: Laptop Baru, Dana Darurat">
        </div>
        <div class="form-group">
            <label>Target Jumlah</label>
            <input type="number" id="goalTarget" value="${targetAmount}" placeholder="0" min="0" step="10000">
        </div>
        <div class="form-group">
            <label>Jumlah Saat Ini</label>
            <input type="number" id="goalCurrent" value="${currentAmount}" placeholder="0" min="0" step="10000">
        </div>
        <div class="form-group">
            <label>Tanggal Target</label>
            <input type="date" id="goalDeadline" value="${deadline}">
        </div>
        <div class="form-group">
            <label>Warna</label>
            <input type="color" id="goalColor" value="${color}" style="width: 100%; height: 40px; border: none; border-radius: 8px; cursor: pointer;">
        </div>
        <div class="form-group">
            <label>Icon</label>
            <select id="goalIcon">
                <option value="fa-bullseye" ${icon === 'fa-bullseye' ? 'selected' : ''}>Target</option>
                <option value="fa-laptop" ${icon === 'fa-laptop' ? 'selected' : ''}>Laptop</option>
                <option value="fa-car" ${icon === 'fa-car' ? 'selected' : ''}>Mobil</option>
                <option value="fa-home" ${icon === 'fa-home' ? 'selected' : ''}>Rumah</option>
                <option value="fa-plane" ${icon === 'fa-plane' ? 'selected' : ''}>Liburan</option>
                <option value="fa-graduation-cap" ${icon === 'fa-graduation-cap' ? 'selected' : ''}>Pendidikan</option>
                <option value="fa-shield-alt" ${icon === 'fa-shield-alt' ? 'selected' : ''}>Dana Darurat</option>
                <option value="fa-ring" ${icon === 'fa-ring' ? 'selected' : ''}>Pernikahan</option>
            </select>
        </div>
    `;

    const footerButtons = [
        { text: 'Batal', class: 'btn-outline', onClick: closeModal },
        { text: isEdit ? 'Simpan' : 'Tambah', class: 'btn-primary', onClick: () => isEdit ? saveGoalEdit(goal.id) : saveGoal() }
    ];

    openModal(isEdit ? 'Edit Target' : 'Tambah Target', bodyHTML, footerButtons);
}

function saveGoal() {
    const name = document.getElementById('goalName').value.trim();
    const targetAmount = parseFloat(document.getElementById('goalTarget').value);
    const currentAmount = parseFloat(document.getElementById('goalCurrent').value) || 0;
    const deadline = document.getElementById('goalDeadline').value;
    const color = document.getElementById('goalColor').value;
    const icon = document.getElementById('goalIcon').value;

    if (!name) { showToast('Nama target wajib diisi', 'error'); return; }
    if (!targetAmount || targetAmount <= 0) { showToast('Target jumlah harus lebih dari 0', 'error'); return; }

    state.goals.push({
        id: generateId(),
        name,
        targetAmount,
        currentAmount,
        deadline,
        color,
        icon,
        createdAt: new Date().toISOString()
    });

    saveState();
    closeModal();
    renderPage(state.currentPage);
    showToast('Target berhasil ditambahkan');
}

function saveGoalEdit(id) {
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;

    goal.name = document.getElementById('goalName').value.trim();
    goal.targetAmount = parseFloat(document.getElementById('goalTarget').value);
    goal.currentAmount = parseFloat(document.getElementById('goalCurrent').value) || 0;
    goal.deadline = document.getElementById('goalDeadline').value;
    goal.color = document.getElementById('goalColor').value;
    goal.icon = document.getElementById('goalIcon').value;

    saveState();
    closeModal();
    renderPage(state.currentPage);
    showToast('Target berhasil diperbarui');
}

function editGoal(id) {
    const goal = state.goals.find(g => g.id === id);
    if (goal) openGoalModal(goal);
}

function deleteGoal(id) {
    if (!confirm('Hapus target ini?')) return;
    state.goals = state.goals.filter(g => g.id !== id);
    saveState();
    renderPage(state.currentPage);
    showToast('Target dihapus');
}

function contributeGoal(id) {
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;

    const remaining = goal.targetAmount - goal.currentAmount;

    const bodyHTML = `
        <div class="form-group">
            <label>Jumlah Kontribusi</label>
            <input type="number" id="contributeAmount" placeholder="0" min="0" max="${remaining}" step="1000">
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Sisa target: ${formatCurrency(remaining)}</p>
    `;

    const footerButtons = [
        { text: 'Batal', class: 'btn-outline', onClick: closeModal },
        { text: 'Tambah', class: 'btn-primary', onClick: () => {
            const amount = parseFloat(document.getElementById('contributeAmount').value);
            if (!amount || amount <= 0) { showToast('Jumlah harus lebih dari 0', 'error'); return; }
            goal.currentAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
            saveState();
            closeModal();
            renderPage(state.currentPage);
            showToast('Kontribusi berhasil ditambahkan');
        }}
    ];

    openModal('Tambah Kontribusi', bodyHTML, footerButtons);
}

function exportData() {
    const data = {
        accounts: state.accounts,
        transactions: state.transactions,
        categories: state.categories,
        budgets: state.budgets,
        goals: state.goals,
        settings: state.settings,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeapp-backup-${formatDateISO(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil diexport');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.accounts) state.accounts = data.accounts;
            if (data.transactions) state.transactions = data.transactions;
            if (data.categories) state.categories = data.categories;
            if (data.budgets) state.budgets = data.budgets;
            if (data.goals) state.goals = data.goals;
            if (data.settings) state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
            saveState();
            renderPage(state.currentPage);
            showToast('Data berhasil diimport');
        } catch (err) {
            showToast('File tidak valid', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (!confirm('Hapus SEMUA data? Tindakan ini tidak dapat dibatalkan.')) return;
    if (!confirm('Apakah Anda yakin? Semua transaksi, akun, anggaran, dan target akan hilang.')) return;

    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    state = {
        accounts: [],
        transactions: [],
        categories: [...DEFAULT_CATEGORIES],
        budgets: [],
        goals: [],
        settings: { ...DEFAULT_SETTINGS },
        currentPage: 'dashboard',
        charts: {}
    };
    saveState();
    renderPage('dashboard');
    showToast('Semua data telah dihapus');
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEYS.theme, newTheme);

    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.innerHTML = newTheme === 'dark'
            ? '<i class="fas fa-moon"></i><span>Mode Gelap</span>'
            : '<i class="fas fa-sun"></i><span>Mode Terang</span>';
    }

    renderPage(state.currentPage);
}

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.innerHTML = savedTheme === 'dark'
            ? '<i class="fas fa-moon"></i><span>Mode Gelap</span>'
            : '<i class="fas fa-sun"></i><span>Mode Terang</span>';
    }
}

function initEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(el.dataset.goto);
        });
    });

    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });

    document.getElementById('menuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    document.getElementById('addTransactionBtn').addEventListener('click', () => openTransactionModal());
    document.getElementById('addAccountBtn').addEventListener('click', () => openAccountModal());
    document.getElementById('addBudgetBtn').addEventListener('click', openBudgetModal);
    document.getElementById('addGoalBtn').addEventListener('click', () => openGoalModal());

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('filterType').addEventListener('change', applyFilters);
    document.getElementById('filterAccount').addEventListener('change', applyFilters);
    document.getElementById('filterCategory').addEventListener('change', applyFilters);
    document.getElementById('filterDateFrom').addEventListener('change', applyFilters);
    document.getElementById('filterDateTo').addEventListener('change', applyFilters);

    document.getElementById('resetFilter').addEventListener('click', () => {
        document.getElementById('filterType').value = '';
        document.getElementById('filterAccount').value = '';
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        applyFilters();
    });

    document.getElementById('globalSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            if (state.currentPage === 'transactions') applyFilters();
            return;
        }

        const filtered = state.transactions.filter(t => {
            const cat = state.categories.find(c => c.id === t.categoryId);
            const acc = state.accounts.find(a => a.id === t.accountId);
            return (t.note && t.note.toLowerCase().includes(query)) ||
                   (cat && cat.name.toLowerCase().includes(query)) ||
                   (acc && acc.name.toLowerCase().includes(query));
        });

        if (state.currentPage === 'transactions') {
            const tbody = document.getElementById('transactionsTableBody');
            if (!filtered.length) {
                tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-search"></i><p>Tidak ditemukan</p></div></td></tr>';
                return;
            }
            tbody.innerHTML = filtered.map(t => {
                const cat = state.categories.find(c => c.id === t.categoryId);
                const acc = state.accounts.find(a => a.id === t.accountId);
                const toAcc = state.accounts.find(a => a.id === t.toAccountId);
                const typeClass = t.type === 'income' ? 'amount-income' : t.type === 'expense' ? 'amount-expense' : 'amount-transfer';
                const typeLabel = t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer';
                return `
                    <tr>
                        <td>${formatDate(t.date)}</td>
                        <td>${t.note || '-'}</td>
                        <td>${cat ? cat.name : typeLabel}</td>
                        <td>${acc ? acc.name : '-'}${toAcc ? ' → ' + toAcc.name : ''}</td>
                        <td class="${typeClass}">${formatCurrency(t.amount)}</td>
                        <td>
                            <button class="btn-icon" onclick="editTransaction('${t.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon danger" onclick="deleteTransaction('${t.id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    });

    document.getElementById('reportPeriod').addEventListener('change', renderReportChart);
    document.getElementById('reportType').addEventListener('change', renderReportChart);

    document.getElementById('currencySelect').addEventListener('change', (e) => {
        state.settings.currency = e.target.value;
        saveState();
        renderPage(state.currentPage);
        showToast('Mata uang diubah');
    });

    document.getElementById('dateFormatSelect').addEventListener('change', (e) => {
        state.settings.dateFormat = e.target.value;
        saveState();
        renderPage(state.currentPage);
        showToast('Format tanggal diubah');
    });

    document.getElementById('languageSelect').addEventListener('change', (e) => {
        state.settings.language = e.target.value;
        saveState();
        showToast('Bahasa diubah');
    });

    document.getElementById('exportBtn').addEventListener('click', exportData);

    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
        if (e.target.files.length) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    });

    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function init() {
    loadState();
    initTheme();
    initEventListeners();
    navigateTo('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
