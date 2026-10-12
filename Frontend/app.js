/* FinanceApp - application logic */

const PREFIX = { accounts: 'acc', transactions: 'trx', categories: 'cat', budgets: 'bud', goals: 'goal' };
const THEME_KEY = 'financeApp_theme';

const CURRENCY_SYMBOLS = { IDR: 'Rp', USD: '$', EUR: '€', SGD: 'S$', MYR: 'RM' };
const CURRENCY_LOCALE = { IDR: 'id-ID', USD: 'en-US', EUR: 'de-DE', SGD: 'en-SG', MYR: 'ms-MY' };

const PAGE_META = {
    dashboard: { title: 'Dashboard', subtitle: 'Ringkasan keuangan Anda' },
    transactions: { title: 'Transaksi', subtitle: 'Semua catatan pemasukan dan pengeluaran' },
    calendar: { title: 'Kalender', subtitle: 'Pola belanja harian Anda' },
    budgets: { title: 'Anggaran', subtitle: 'Batas belanja per kategori' },
    goals: { title: 'Target', subtitle: 'Tujuan keuangan yang sedang dikejar' },
    accounts: { title: 'Akun', subtitle: 'Bank, tunai, dan e-wallet' },
    categories: { title: 'Kategori', subtitle: 'Label transaksi Anda' },
    reports: { title: 'Laporan', subtitle: 'Analisis mendalam keuangan' },
    settings: { title: 'Pengaturan', subtitle: 'Preferensi dan>data aplikasi' }
};

const ACCOUNT_TYPES = [
    { value: 'bank', label: 'Bank' },
    { value: 'cash', label: 'Tunai' },
    { value: 'ewallet', label: 'E-Wallet' },
    { value: 'credit', label: 'Kartu Kredit' }
];

const ACCOUNT_ICONS = [
    'fa-university', 'fa-money-bill-wave', 'fa-mobile-alt', 'fa-credit-card',
    'fa-wallet', 'fa-piggy-bank', 'fa-building-columns', 'fa-coins'
];

const CATEGORY_ICONS = [
    'fa-utensils', 'fa-bus', 'fa-shopping-bag', 'fa-file-invoice', 'fa-film',
    'fa-heartbeat', 'fa-graduation-cap', 'fa-piggy-bank', 'fa-briefcase',
    'fa-laptop-code', 'fa-gift', 'fa-chart-line', 'fa-house', 'fa-phone',
    'fa-plane', 'fa-dumbbell', 'fa-book', 'fa-coffee', 'fa-car', 'fa-gamepad',
    'fa-shirt', 'fa-baby', 'fa-gift', 'fa-ellipsis-h'
];

const PALETTE = [
    '#0ea5e9', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308',
    '#22c55e', '#14b8a6', '#6366f1', '#a855f7', '#ef4444', '#10b981'
];

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const state = {
    accounts: [],
    transactions: [],
    categories: [],
    budgets: [],
    goals: [],
    settings: { ...Api.DEFAULT_SETTINGS },
    currentPage: 'dashboard',
    ready: false,
    charts: {},
    ui: {
        trendMonths: 6,
        calendarMonth: new Date(),
        calendarDate: new Date().getDate(),
        searchOpen: false
    }
};

/* ---------- Helpers ------------------------------------------------------ */

function esc(value) {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function iconClass(name) {
    return `fas ${name || 'fa-ellipsis-h'}`;
}

function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseDate(value) {
    if (!value) return null;
    const [y, m, d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMoney(amount, opts = {}) {
    const { sign = false, compact = null, code = false } = opts;
    const currency = state.settings.currency || 'IDR';
    const symbol = CURRENCY_SYMBOLS[currency] || 'Rp';
    const locale = CURRENCY_LOCALE[currency] || 'id-ID';
    const value = Number(amount) || 0;
    const abs = Math.abs(value);
    const useCompact = compact === null ? !!state.settings.compactNumbers : compact;

    let text;
    if (useCompact && abs >= 1000000) {
        text = `${(abs / 1000000).toFixed(abs >= 10000000 ? 0 : 1).replace('.', ',')}jt`;
    } else if (useCompact && abs >= 1000) {
        text = `${(abs / 1000).toFixed(abs >= 100000 ? 0 : 1).replace('.', ',')}rb`;
    } else {
        text = abs.toLocaleString(locale);
    }

    const prefix = sign && value > 0 ? '+' : value < 0 ? '-' : '';
    const suffix = code ? ` ${currency}` : '';
    return `${prefix}${symbol} ${text}${suffix}`;
}

function formatNumber(amount) {
    return (Number(amount) || 0).toLocaleString(CURRENCY_LOCALE[state.settings.currency] || 'id-ID');
}

function formatDate(value) {
    const date = parseDate(value);
    if (!date) return '-';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    switch (state.settings.dateFormat) {
        case 'MM/DD/YYYY': return `${m}/${d}/${y}`;
        case 'YYYY-MM-DD': return `${y}-${m}-${d}`;
        default: return `${d}/${m}/${y}`;
    }
}

function formatDateLong(value) {
    const date = parseDate(value);
    if (!date) return '-';
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatMonthShort(value) {
    const date = typeof value === 'string' ? parseDate(`${value}-01`) : value;
    if (!date) return '-';
    return `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${String(date.getFullYear()).slice(2)}`;
}

function relativeDay(value) {
    const date = parseDate(value);
    if (!date) return '-';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((date - today) / 86400000);
    if (diff === 0) return 'Hari ini';
    if (diff === -1) return 'Kemarin';
    if (diff === 1) return 'Besok';
    return formatDateLong(value);
}

function categoryOf(id) {
    return state.categories.find(c => c.id === id) || null;
}

function accountOf(id) {
    return state.accounts.find(a => a.id === id) || null;
}

function sum(list, fn) {
    return list.reduce((total, item) => total + (fn ? fn(item) : item) || 0, 0);
}

function emptyState(icon, title, text, action) {
    return `
        <div class="empty">
            <div class="empty__icon"><i class="fas ${icon}"></i></div>
            <p class="empty__title">${esc(title)}</p>
            <p class="empty__text">${esc(text)}</p>
            ${action ? `<button class="btn btn-primary" data-action="${action.id}">${action.label}</button>` : ''}
        </div>`;
}

function chartTheme() {
    const styles = getComputedStyle(document.documentElement);
    const value = (name) => styles.getPropertyValue(name).trim();
    return {
        text: value('--text-secondary'),
        muted: value('--text-muted'),
        border: value('--border'),
        surface: value('--surface'),
        income: value('--income'),
        expense: value('--expense'),
        transfer: value('--transfer')
    };
}

function destroyChart(key) {
    if (state.charts[key]) {
        state.charts[key].destroy();
        delete state.charts[key];
    }
}

/* ---------- Toast -------------------------------------------------------- */

const TOAST_ICONS = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
};

function toast(message, type = 'success') {
    const stack = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast is-${type}`;
    el.innerHTML = `<i class="fas ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i><span>${esc(message)}</span>`;
    stack.appendChild(el);

    const remove = () => {
        el.classList.add('is-leaving');
        setTimeout(() => el.remove(), 200);
    };
    setTimeout(remove, 3200);
    el.addEventListener('click', remove);
}

function confirmAction(message) {
    return window.confirm(message);
}

/* ---------- Modal -------------------------------------------------------- */

let modalSubmitHandler = null;

function openModal(title, bodyHTML, buttons = [], opts = {}) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    const modal = document.getElementById('modal');
    modal.classList.toggle('modal--wide', !!opts.wide);

    const foot = document.getElementById('modalFooter');
    foot.innerHTML = '';
    modalSubmitHandler = null;

    buttons.forEach(cfg => {
        const btn = document.createElement('button');
        btn.className = `btn ${cfg.class || 'btn-secondary'}`;
        btn.innerHTML = cfg.icon ? `<i class="fas ${cfg.icon}"></i> ${esc(cfg.text)}` : esc(cfg.text);

        btn.addEventListener('click', () => {
            if (!cfg.onClick) {
                closeModal();
                return;
            }
            // keepOpen handlers async: mereka menutup modal sendiri setelah sukses
            if (!cfg.keepOpen) closeModal();
            cfg.onClick();
        });

        if (cfg.keepOpen) modalSubmitHandler = cfg.onClick;
        foot.appendChild(btn);
    });

    document.getElementById('modalOverlay').classList.add('is-open');
    const focusTarget = modal.querySelector('input:not([type="hidden"]), select');
    if (focusTarget) setTimeout(() => focusTarget.focus(), 60);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('is-open');
    document.getElementById('modalBody').innerHTML = '';
}

/* ---------- Theme -------------------------------------------------------- */

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    localStorage.setItem(THEME_KEY, theme);

    const hadCharts = Object.keys(state.charts).length > 0;
    Object.keys(state.charts).forEach(destroyChart);
    if (hadCharts && state.ready) renderCurrentPage();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(preferred);
}

/* ---------- Data layer --------------------------------------------------- */

async function loadState() {
    const data = await Api.loadState();
    state.accounts = data.accounts || [];
    state.transactions = data.transactions || [];
    state.categories = (data.categories && data.categories.length) ? data.categories : Api.DEFAULT_CATEGORIES.map(c => ({ ...c }));
    state.budgets = data.budgets || [];
    state.goals = data.goals || [];
    state.settings = { ...Api.DEFAULT_SETTINGS, ...(data.settings || {}) };
}

function syncLocalCache() {
    if (Api.isRemote) {
        Api.saveLocal({
            accounts: state.accounts,
            transactions: state.transactions,
            categories: state.categories,
            budgets: state.budgets,
            goals: state.goals,
            settings: state.settings
        });
    }
}

async function persistAll() {
    await Api.saveAll({
        accounts: state.accounts,
        transactions: state.transactions,
        categories: state.categories,
        budgets: state.budgets,
        goals: state.goals,
        settings: state.settings
    });
    syncLocalCache();
}

async function refreshFromSource() {
    await loadState();
    renderCurrentPage();
}

async function createRecord(collection, payload) {
    const created = await Api.create(collection, payload);
    await refreshFromSource();
    return created;
}

async function updateRecord(collection, id, payload) {
    const updated = await Api.update(collection, id, payload);
    await refreshFromSource();
    return updated;
}

async function deleteRecord(collection, id) {
    await Api.remove(collection, id);
    await refreshFromSource();
}

function updateConnectionBadge() {
    const badge = document.getElementById('connectionBadge');
    const label = badge.querySelector('.connection__label');
    const remote = Api.isRemote;
    badge.classList.toggle('is-remote', remote);
    badge.classList.toggle('is-local', !remote);
    label.textContent = remote ? 'Tersinkron dengan server' : 'Mode lokal (browser)';

    const aboutMode = document.getElementById('aboutMode');
    if (aboutMode) aboutMode.textContent = remote ? 'Server (port 3000)' : 'Lokal (localStorage)';
}

/* ---------- Navigation --------------------------------------------------- */

function navigateTo(page, options = {}) {
    state.currentPage = page;

    document.querySelectorAll('.page').forEach(el => el.classList.toggle('is-active', el.id === `page-${page}`));
    document.querySelectorAll('.nav-link[data-page]').forEach(el => el.classList.toggle('is-active', el.dataset.page === page));

    const meta = PAGE_META[page] || PAGE_META.dashboard;
    document.getElementById('pageTitle').textContent = meta.title;
    document.getElementById('pageSubtitle').textContent = meta.subtitle;

    closeSidebar();

    // navigasi saat data belum siap: tampilan berubah, render ditunda
    if (state.ready) renderCurrentPage();
    if (options.scroll !== false) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentPage() {
    const renderers = {
        dashboard: renderDashboard,
        transactions: renderTransactions,
        calendar: renderCalendar,
        budgets: renderBudgets,
        goals: renderGoals,
        accounts: renderAccounts,
        categories: renderCategories,
        reports: renderReports,
        settings: renderSettings
    };
    (renderers[state.currentPage] || renderDashboard)();
}

function openSidebar() {
    document.getElementById('sidebar').classList.add('is-open');
    document.getElementById('sidebarBackdrop').classList.add('is-open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('is-open');
    document.getElementById('sidebarBackdrop').classList.remove('is-open');
}

/* ---------- Dashboard ---------------------------------------------------- */

function monthlyStats(date = new Date()) {
    const key = monthKey(date);
    const list = state.transactions.filter(t => monthKey(parseDate(t.date) || new Date()) === key);
    const income = sum(list.filter(t => t.type === 'income'), t => Number(t.amount));
    const expense = sum(list.filter(t => t.type === 'expense'), t => Number(t.amount));
    return { income, expense, net: income - expense, list };
}

function renderDashboard() {
    const stats = monthlyStats();
    const totalBalance = sum(state.accounts, a => Number(a.balance));
    const expenseRatio = stats.income > 0 ? Math.round((stats.expense / stats.income) * 100) : 0;

    document.getElementById('totalBalance').textContent = formatMoney(totalBalance);
    document.getElementById('monthlyIncome').textContent = formatMoney(stats.income);
    document.getElementById('monthlyExpense').textContent = formatMoney(stats.expense);
    document.getElementById('monthlySavings').textContent = formatMoney(stats.net);
    document.getElementById('monthlySavings').className = `hero-meta__value ${stats.net >= 0 ? 'is-income' : 'is-expense'}`;

    const trendBadge = document.getElementById('balanceTrend');
    if (stats.income > 0) {
        const healthy = expenseRatio <= 80;
        trendBadge.className = `badge ${healthy ? 'is-income' : 'is-expense'}`;
        trendBadge.innerHTML = `<i class="fas ${healthy ? 'fa-arrow-down' : 'fa-arrow-up'}"></i> ${expenseRatio}% pengeluaran`;
    } else {
        trendBadge.className = 'badge';
        trendBadge.textContent = 'Belum ada pemasukan';
    }

    renderStatCards();
    renderTrendChart();
    renderCategoryChart();
    renderRecentTransactions();
    renderBudgetMini();
}

function renderStatCards() {
    const stats = monthlyStats();
    const previous = monthlyStats(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
    const currentKey = monthKey(new Date());

    const budgets = state.budgets.filter(b => b.month === currentKey);
    const budgetTotal = sum(budgets, b => Number(b.amount));
    const budgetSpent = sum(budgets, b => sumByCategory(b.categoryId, currentKey));

    const accountsWithCredit = state.accounts.filter(a => a.type === 'credit');
    const creditUsed = sum(accountsWithCredit, a => Math.abs(Math.min(0, Number(a.balance))));

    const savingsRate = stats.income > 0 ? Math.round((stats.net / stats.income) * 100) : 0;
    const expenseRatio = stats.income > 0 ? Math.round((stats.expense / stats.income) * 100) : 0;
    const trendDelta = previous.income > 0
        ? Math.round(((stats.income - previous.income) / previous.income) * 100)
        : null;

    const cards = [
        {
            icon: 'fa-arrow-down',
            label: 'Pemasukan',
            value: formatMoney(stats.income, { compact: true }),
            foot: trendDelta === null ? 'Bulan ini' : `${trendDelta >= 0 ? '+' : ''}${trendDelta}% dari bulan lalu`,
            tone: 'is-income'
        },
        {
            icon: 'fa-arrow-up',
            label: 'Pengeluaran',
            value: formatMoney(stats.expense, { compact: true }),
            foot: stats.income > 0 ? `${expenseRatio}% dari pemasukan` : 'Bulan ini',
            tone: 'is-expense'
        },
        {
            icon: 'fa-scale-balanced',
            label: 'Tingkat Tabung',
            value: `${savingsRate}%`,
            foot: stats.net >= 0 ? 'Bagus, lanjutkan' : 'Pengeluaran melebihi',
            tone: stats.net >= 0 ? 'is-income' : 'is-expense'
        },
        {
            icon: 'fa-building-columns',
            label: 'Total Akun',
            value: formatNumber(state.accounts.length),
            foot: creditUsed > 0 ? `Kredit terpakai ${formatMoney(creditUsed, { compact: true })}` : `${formatNumber(state.accounts.length)} akun aktif`,
            tone: ''
        }
    ];

    const budgetCard = budgetTotal > 0 ? {
        icon: 'fa-chart-simple',
        label: 'Pakai Anggaran',
        value: `${Math.round((budgetSpent / budgetTotal) * 100)}%`,
        foot: `${formatMoney(budgetTotal - budgetSpent, { compact: true })} tersisa`,
        tone: budgetSpent > budgetTotal ? 'is-expense' : ''
    } : null;

    const list = budgetCard ? [...cards.slice(0, 3), budgetCard] : cards;

    document.getElementById('statRow').innerHTML = list.map(card => `
        <article class="stat-card">
            <div class="stat-card__top">
                <span class="stat-card__label">${esc(card.label)}</span>
                <i class="fas ${card.icon} ${card.tone}" style="font-size:13px"></i>
            </div>
            <span class="stat-card__value">${esc(card.value)}</span>
            <span class="stat-card__foot">${esc(card.foot)}</span>
        </article>
    `).join('');
}

function sumByCategory(categoryId, key) {
    return sum(
        state.transactions.filter(t =>
            t.type === 'expense' &&
            t.categoryId === categoryId &&
            monthKey(parseDate(t.date) || new Date()) === key
        ),
        t => Number(t.amount)
    );
}

function renderTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('trend');

    const theme = chartTheme();
    const months = [];
    const incomeData = [];
    const expenseData = [];
    const now = new Date();
    const count = state.ui.trendMonths;

    for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = monthKey(date);
        const list = state.transactions.filter(t => monthKey(parseDate(t.date) || new Date()) === key);
        months.push(MONTH_NAMES[date.getMonth()].slice(0, 3));
        incomeData.push(sum(list.filter(t => t.type === 'income'), t => Number(t.amount)));
        expenseData.push(sum(list.filter(t => t.type === 'expense'), t => Number(t.amount)));
    }

    state.charts.trend = new Chart(canvas, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    borderColor: theme.income,
                    backgroundColor: hexToRgba(theme.income, 0.08),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBorderWidth: 2
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    borderColor: theme.expense,
                    backgroundColor: hexToRgba(theme.expense, 0.08),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBorderWidth: 2
                }
            ]
        },
        options: baseChartOptions(theme, {
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: { color: theme.text, boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${formatMoney(ctx.parsed.y, { compact: true })}`
                    }
                }
            },
            scales: {
                x: { ticks: { color: theme.muted, font: { size: 11 } }, grid: { display: false }, border: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: theme.muted,
                        font: { size: 11 },
                        callback: (v) => formatMoney(v, { compact: true })
                    },
                    grid: { color: theme.border },
                    border: { display: false }
                }
            }
        })
    });
}

function renderCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('category');

    const theme = chartTheme();
    const key = monthKey(new Date());
    const totals = expenseByCategory(key);

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const hasData = entries.length > 0;

    state.charts.category = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: hasData ? entries.map(e => e[0]) : ['Belum ada data'],
            datasets: [{
                data: hasData ? entries.map(e => e[1]) : [1],
                backgroundColor: hasData ? entries.map((_, i) => PALETTE[i % PALETTE.length]) : theme.border,
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: baseChartOptions(theme, {
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: theme.text, boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', padding: 14, font: { size: 11.5 } }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
                            const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                            return ` ${ctx.label}: ${formatMoney(ctx.parsed, { compact: true })} (${pct}%)`;
                        }
                    }
                }
            }
        })
    });
}

function expenseByCategory(key) {
    const totals = {};
    state.transactions
        .filter(t => t.type === 'expense' && monthKey(parseDate(t.date) || new Date()) === key)
        .forEach(t => {
            const cat = categoryOf(t.categoryId);
            if (!cat) return;
            totals[cat.name] = (totals[cat.name] || 0) + Number(t.amount);
        });
    return totals;
}

function baseChartOptions(theme, extra = {}) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        ...extra
    };
}

function hexToRgba(hex, alpha) {
    const clean = String(hex || '').replace('#', '');
    if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    const recent = [...state.transactions]
        .sort((a, b) => (parseDate(b.date) - parseDate(a.date)) || (b.createdAt > a.createdAt ? 1 : -1))
        .slice(0, 5);

    if (!recent.length) {
        container.innerHTML = emptyState('fa-receipt', 'Belum ada transaksi', 'Mulai catat pengeluaran harianmu untuk melihat ringkasan di sini.');
        return;
    }

    container.innerHTML = recent.map(t => transactionRowHTML(t)).join('');
}

function transactionRowHTML(t) {
    const cat = categoryOf(t.categoryId);
    const account = accountOf(t.accountId);
    const target = accountOf(t.toAccountId);
    const color = cat ? cat.color : PALETTE[8];
    const icon = cat ? cat.icon : 'fa-arrow-right-arrow-left';
    const meta = target
        ? `${relativeDay(t.date)} · ${esc(account ? account.name : '-')} → ${esc(target.name)}`
        : `${relativeDay(t.date)} · ${esc(account ? account.name : '-')}`;

    return `
        <button class="tx-item" data-edit-tx="${esc(t.id)}">
            <span class="icon-dot" style="background:${esc(color)}"><i class="fas ${esc(icon)}"></i></span>
            <span class="tx-item__body">
                <span class="tx-item__title">${esc(t.note || (cat ? cat.name : 'Transfer'))}</span>
                <span class="tx-item__meta">${meta}</span>
            </span>
            <span class="tx-item__amount ${t.type === 'income' ? 'is-income' : t.type === 'expense' ? 'is-expense' : 'is-transfer'}">
                ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${formatMoney(t.amount)}
            </span>
        </button>`;
}

/* ---------- Transactions -------------------------------------------------- */

function renderTransactions() {
    populateFilterOptions();
    applyFilters();
}

function populateFilterOptions() {
    const accountSelect = document.getElementById('filterAccount');
    const categorySelect = document.getElementById('filterCategory');
    const currentAccount = accountSelect.value;
    const currentCategory = categorySelect.value;

    accountSelect.innerHTML = '<option value="">Semua akun</option>' +
        state.accounts.map(a => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');

    categorySelect.innerHTML = '<option value="">Semua kategori</option>' +
        state.categories.map(c => `<option value="${esc(c.id)}">${esc(c.name)} (${c.type === 'income' ? 'masuk' : 'keluar'})</option>`).join('');

    accountSelect.value = currentAccount;
    categorySelect.value = currentCategory;
}

function currentFilters() {
    return {
        query: document.getElementById('txSearch').value.trim().toLowerCase(),
        type: document.getElementById('filterType').value,
        accountId: document.getElementById('filterAccount').value,
        categoryId: document.getElementById('filterCategory').value,
        from: document.getElementById('filterDateFrom').value,
        to: document.getElementById('filterDateTo').value
    };
}

function filteredTransactions() {
    const f = currentFilters();

    return [...state.transactions]
        .filter(t => {
            if (f.type && t.type !== f.type) return false;
            if (f.accountId && t.accountId !== f.accountId && t.toAccountId !== f.accountId) return false;
            if (f.categoryId && t.categoryId !== f.categoryId) return false;
            if (f.from && t.date < f.from) return false;
            if (f.to && t.date > f.to) return false;
            if (f.query) {
                const cat = categoryOf(t.categoryId);
                const account = accountOf(t.accountId);
                const haystack = [
                    t.note || '',
                    cat ? cat.name : '',
                    account ? account.name : '',
                    formatMoney(t.amount)
                ].join(' ').toLowerCase();
                if (!haystack.includes(f.query)) return false;
            }
            return true;
        })
        .sort((a, b) => (parseDate(b.date) - parseDate(a.date)) || (b.createdAt > a.createdAt ? 1 : -1));
}

function applyFilters() {
    const rows = filteredTransactions();
    const tbody = document.getElementById('transactionsTableBody');
    const countEl = document.getElementById('txCount');

    const income = sum(rows.filter(t => t.type === 'income'), t => Number(t.amount));
    const expense = sum(rows.filter(t => t.type === 'expense'), t => Number(t.amount));
    countEl.textContent = `${formatNumber(rows.length)} transaksi · masuk ${formatMoney(income, { compact: true })} · keluar ${formatMoney(expense, { compact: true })}`;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6">${emptyState('fa-magnifying-glass', 'Tidak ada transaksi', 'Coba ubah kata kunci atau filter yang dipilih.')}</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(t => {
        const cat = categoryOf(t.categoryId);
        const account = accountOf(t.accountId);
        const target = accountOf(t.toAccountId);

        const categoryCell = cat
            ? `<span class="table__cat"><span class="table__cat-dot" style="background:${esc(cat.color)}"></span>${esc(cat.name)}</span>`
            : `<span class="badge is-transfer">Transfer</span>`;

        const accountCell = target
            ? `${esc(account ? account.name : '-')} <span class="table__muted">→ ${esc(target.name)}</span>`
            : esc(account ? account.name : '-');

        const amountClass = t.type === 'income' ? 'is-income' : t.type === 'expense' ? 'is-expense' : 'is-transfer';
        const prefix = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '';

        return `
            <tr>
                <td class="table__muted" style="white-space:nowrap">${formatDate(t.date)}</td>
                <td>
                    <button class="link-btn" data-edit-tx="${esc(t.id)}" style="color:var(--text);font-weight:500">
                        ${esc(t.note || (cat ? cat.name : 'Transfer'))}
                    </button>
                </td>
                <td class="table__hide-sm">${categoryCell}</td>
                <td class="table__hide-sm table__muted">${accountCell}</td>
                <td class="is-right table__cell--amount ${amountClass}">${prefix}${formatMoney(t.amount)}</td>
                <td>
                    <div class="table__actions">
                        <button class="icon-btn icon-btn--sm" data-edit-tx="${esc(t.id)}" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="icon-btn icon-btn--sm is-danger" data-delete-tx="${esc(t.id)}" title="Hapus"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function resetFilters() {
    document.getElementById('txSearch').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterAccount').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    applyFilters();
}

/* ---------- Calendar ----------------------------------------------------- */

function renderCalendar() {
    const month = state.ui.calendarMonth;
    const year = month.getFullYear();
    const mIndex = month.getMonth();

    document.getElementById('calLabel').textContent = `${MONTH_NAMES[mIndex]} ${year}`;
    document.getElementById('calTitle').textContent = `${MONTH_NAMES[mIndex]} ${year}`;

    const key = `${year}-${String(mIndex + 1).padStart(2, '0')}`;
    const dailyTotals = {};
    state.transactions
        .filter(t => t.type === 'expense' && String(t.date).startsWith(key))
        .forEach(t => {
            const day = String(t.date).slice(8, 10);
            dailyTotals[Number(day)] = (dailyTotals[Number(day)] || 0) + Number(t.amount);
        });

    const firstDay = new Date(year, mIndex, 1).getDay();
    const daysInMonth = new Date(year, mIndex + 1, 0).getDate();
    const todayStr = toISODate(new Date());

    const cells = [];
    DAY_NAMES.forEach(name => cells.push(`<div class="calendar__head">${name}</div>`));
    for (let i = 0; i < firstDay; i++) cells.push('<div class="calendar__day is-empty"></div>');

    for (let day = 1; day <= daysInMonth; day++) {
        const total = dailyTotals[day] || 0;
        const dateStr = `${key}-${String(day).padStart(2, '0')}`;
        const classes = ['calendar__day'];
        if (dateStr === todayStr) classes.push('is-today');
        if (day === state.ui.calendarDate) classes.push('is-selected');

        cells.push(`
            <button class="${classes.join(' ')}" data-cal-day="${day}" data-cal-month="${key}">
                <span class="calendar__num">${day}</span>
                ${total > 0 ? `<span class="calendar__amount">${formatMoney(total, { compact: true })}</span>` : ''}
            </button>`);
    }

    document.getElementById('calendarGrid').innerHTML = cells.join('');

    renderCalendarDay();
}

function renderCalendarDay() {
    const month = state.ui.calendarMonth;
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${key}-${String(state.ui.calendarDate).padStart(2, '0')}`;

    const dayList = state.transactions
        .filter(t => t.date === dateStr)
        .sort((a, b) => Number(b.amount) - Number(a.amount));

    const income = sum(dayList.filter(t => t.type === 'income'), t => Number(t.amount));
    const expense = sum(dayList.filter(t => t.type === 'expense'), t => Number(t.amount));

    document.getElementById('calDayTitle').textContent = formatDateLong(dateStr);
    document.getElementById('calDaySummary').textContent = dayList.length
        ? `Masuk ${formatMoney(income, { compact: true })} · Keluar ${formatMoney(expense, { compact: true })}`
        : 'Tidak ada transaksi';

    const container = document.getElementById('calDayList');
    if (!dayList.length) {
        container.innerHTML = emptyState('fa-calendar-day', 'Hari tanpa transaksi', 'Belum ada catatan untuk tanggal ini.');
        return;
    }
    container.innerHTML = dayList.map(t => transactionRowHTML(t)).join('');
}

function shiftCalendarMonth(delta) {
    const month = state.ui.calendarMonth;
    state.ui.calendarMonth = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    state.ui.calendarDate = 1;
    renderCalendar();
}

/* ---------- Budgets ------------------------------------------------------ */

function renderBudgets() {
    const container = document.getElementById('budgetsList');
    const key = monthKey(new Date());
    const budgets = state.budgets.filter(b => b.month === key);

    if (!budgets.length) {
        container.innerHTML = emptyState('fa-chart-simple', 'Belum ada anggaran', 'Tetapkan batas belanja per kategori agar pengeluaran lebih terkendali.', { id: 'addBudget', label: 'Tambah Anggaran' });
        return;
    }

    container.innerHTML = budgets.map(budget => {
        const cat = categoryOf(budget.categoryId);
        if (!cat) return '';

        const spent = sumByCategory(budget.categoryId, key);
        const limit = Number(budget.amount);
        const percent = Math.min(Math.round((spent / limit) * 100), 100);
        const remaining = limit - spent;
        const tone = percent >= 100 ? 'is-danger' : percent >= 75 ? 'is-warning' : 'is-safe';

        return `
            <article class="budget-card">
                <div class="budget-card__head">
                    <div style="display:flex;align-items:center;gap:10px">
                        <span class="icon-dot" style="background:${esc(cat.color)}"><i class="fas ${esc(cat.icon)}"></i></span>
                        <div>
                            <div class="budget-card__name">${esc(cat.name)}</div>
                            <div class="budget-card__sub">${formatMonthShort(key)}</div>
                        </div>
                    </div>
                    <div class="row-actions" style="margin:0">
                        <button class="icon-btn icon-btn--sm" data-edit-budget="${esc(budget.id)}" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="icon-btn icon-btn--sm is-danger" data-delete-budget="${esc(budget.id)}" title="Hapus"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div>
                    <div class="budget-card__values">
                        <span class="budget-card__spent">${formatMoney(spent)}</span>
                        <span class="budget-card__limit">dari ${formatMoney(limit)}</span>
                    </div>
                    <div class="progress">
                        <div class="progress__fill ${tone}" style="width:${percent}%"></div>
                    </div>
                    <div class="budget-card__foot">
                        <span>${percent}% terpakai</span>
                        <span class="badge ${remaining >= 0 ? 'is-income' : 'is-expense'}">
                            ${remaining >= 0 ? `${formatMoney(remaining)} tersisa` : `Lebih ${formatMoney(Math.abs(remaining))}`}
                        </span>
                    </div>
                </div>
            </article>`;
    }).join('');
}

function renderBudgetMini() {
    const container = document.getElementById('budgetMiniList');
    const key = monthKey(new Date());
    const budgets = state.budgets.filter(b => b.month === key).slice(0, 4);

    if (!budgets.length) {
        container.innerHTML = `<p class="empty__text" style="margin:0">Belum ada anggaran aktif bulan ini.</p>`;
        return;
    }

    container.innerHTML = budgets.map(budget => {
        const cat = categoryOf(budget.categoryId);
        if (!cat) return '';
        const spent = sumByCategory(budget.categoryId, key);
        const percent = Math.min(Math.round((spent / Number(budget.amount)) * 100), 100);
        const tone = percent >= 100 ? 'is-danger' : percent >= 75 ? 'is-warning' : 'is-safe';

        return `
            <div>
                <div class="budget-mini__top">
                    <span class="budget-mini__name">
                        <span class="table__cat-dot" style="background:${esc(cat.color)}"></span>
                        ${esc(cat.name)}
                    </span>
                    <span class="budget-mini__amount">${formatMoney(spent, { compact: true })} / ${formatMoney(budget.amount, { compact: true })}</span>
                </div>
                <div class="progress">
                    <div class="progress__fill ${tone}" style="width:${percent}%"></div>
                </div>
            </div>`;
    }).join('');
}

/* ---------- Goals -------------------------------------------------------- */

function renderGoals() {
    const grid = document.getElementById('goalsGrid');

    if (!state.goals.length) {
        grid.innerHTML = emptyState('fa-bullseye', 'Belum ada target', 'Tetapkan target keuangan agar Savingmu lebih terarah.', { id: 'addGoal', label: 'Tambah Target' });
        return;
    }

    grid.innerHTML = state.goals.map(goal => {
        const target = Number(goal.targetAmount);
        const current = Number(goal.currentAmount);
        const percent = Math.min(Math.round((current / target) * 100), 100);
        const deadline = parseDate(goal.deadline);
        const daysLeft = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;

        const deadlineText = daysLeft === null
            ? 'Tanpa tenggat'
            : daysLeft < 0
                ? `Lewat ${Math.abs(daysLeft)} hari`
                : `${daysLeft} hari lagi`;

        return `
            <article class="goal-card">
                <div class="goal-card__head">
                    <span class="icon-dot" style="background:${esc(goal.color || PALETTE[0])};width:38px;height:38px">
                        <i class="fas ${iconClass(goal.icon)}"></i>
                    </span>
                    <div style="flex:1;min-width:0">
                        <div class="goal-card__name">${esc(goal.name)}</div>
                        <div class="goal-card__deadline">${esc(deadlineText)}</div>
                    </div>
                </div>

                <div class="goal-card__ring">
                    <div class="ring" style="background:conic-gradient(${esc(goal.color || PALETTE[0])} ${percent}%, var(--surface-alt) 0)">
                        <div class="ring__inner">${percent}%</div>
                    </div>
                    <div class="goal-card__amounts">
                        <div class="goal-card__current">${formatMoney(current)}</div>
                        <div class="goal-card__of">dari ${formatMoney(target)}</div>
                        <div class="progress" style="margin-top:8px">
                            <div class="progress__fill is-safe" style="width:${percent}%"></div>
                        </div>
                    </div>
                </div>

                <div class="goal-card__actions">
                    <button class="btn btn-secondary btn-sm" data-contribute-goal="${esc(goal.id)}"><i class="fas fa-plus"></i> Tambah</button>
                    <button class="btn btn-ghost btn-sm" data-edit-goal="${esc(goal.id)}"><i class="fas fa-pen"></i></button>
                    <button class="btn btn-ghost btn-sm" data-delete-goal="${esc(goal.id)}"><i class="fas fa-trash"></i></button>
                </div>
            </article>`;
    }).join('');
}

/* ---------- Accounts ----------------------------------------------------- */

function renderAccounts() {
    const grid = document.getElementById('accountsGrid');

    if (!state.accounts.length) {
        grid.innerHTML = emptyState('fa-building-columns', 'Belum ada akun', 'Tambahkan rekening bank, dompet tunai, atau e-wallet pertama Anda.', { id: 'addAccount', label: 'Tambah Akun' });
        return;
    }

    grid.innerHTML = state.accounts.map(acc => {
        const typeLabel = (ACCOUNT_TYPES.find(t => t.value === acc.type) || { label: acc.type }).label;
        const expense = sum(state.transactions.filter(t => t.type === 'expense' && t.accountId === acc.id), t => Number(t.amount));
        const isNegative = Number(acc.balance) < 0;

        return `
            <article class="account-card">
                <div class="account-card__head">
                    <span class="icon-dot" style="background:${esc(acc.color || PALETTE[0])};width:38px;height:38px">
                        <i class="fas ${iconClass(acc.icon)}"></i>
                    </span>
                    <div style="flex:1;min-width:0">
                        <div class="account-card__name">${esc(acc.name)}</div>
                        <div class="account-card__type">${esc(typeLabel)}</div>
                    </div>
                </div>
                <div>
                    <div class="account-card__balance ${isNegative ? 'is-expense' : ''}">${formatMoney(acc.balance)}</div>
                    <div class="stat-card__foot">${formatMoney(expense, { compact: true })} pengeluaran tercatat</div>
                </div>
                <div class="account-card__actions">
                    <button class="btn btn-secondary btn-sm" data-edit-account="${esc(acc.id)}"><i class="fas fa-pen"></i> Edit</button>
                    <button class="btn btn-ghost btn-sm" data-delete-account="${esc(acc.id)}"><i class="fas fa-trash"></i></button>
                </div>
            </article>`;
    }).join('');
}

/* ---------- Categories --------------------------------------------------- */

function renderCategories() {
    renderCategoryGroup('expense', 'expenseCategories', 'expenseCatCount');
    renderCategoryGroup('income', 'incomeCategories', 'incomeCatCount');
}

function renderCategoryGroup(type, containerId, countId) {
    const container = document.getElementById(containerId);
    const list = state.categories.filter(c => c.type === type);

    document.getElementById(countId).textContent = `${formatNumber(list.length)} kategori`;

    if (!list.length) {
        container.innerHTML = emptyState('fa-tags', 'Belum ada kategori', 'Tambahkan label untuk mengelompokkan transaksi.');
        return;
    }

    container.innerHTML = list.map(cat => {
        const used = state.transactions.filter(t => t.categoryId === cat.id).length;
        return `
            <div class="chip-item">
                <span class="icon-dot" style="background:${esc(cat.color || PALETTE[0])};width:30px;height:30px;font-size:11px">
                    <i class="fas ${esc(cat.icon || 'fa-tag')}"></i>
                </span>
                <span class="chip-item__body">
                    <span class="chip-item__name">${esc(cat.name)}</span>
                    <span class="chip-item__meta">${formatNumber(used)} transaksi${cat.isDefault ? ' · bawaan' : ''}</span>
                </span>
                <span class="chip-item__actions">
                    <button class="icon-btn icon-btn--sm" data-edit-category="${esc(cat.id)}" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="icon-btn icon-btn--sm is-danger" data-delete-category="${esc(cat.id)}" title="Hapus"><i class="fas fa-trash"></i></button>
                </span>
            </div>`;
    }).join('');
}

/* ---------- Reports ------------------------------------------------------ */

function reportMonths() {
    const period = document.getElementById('reportPeriod').value;
    const now = new Date();

    if (period === 'year') {
        return Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), i, 1));
    }
    const count = parseInt(period, 10);
    return Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1));
}

function renderReports() {
    renderReportChart();
    renderReportSummary();
    renderReportCategoryTable();
}

function renderReportChart() {
    const canvas = document.getElementById('reportChart');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('report');

    const theme = chartTheme();
    const type = document.getElementById('reportType').value;
    const months = reportMonths();
    const labels = months.map(d => MONTH_NAMES[d.getMonth()].slice(0, 3));

    const axisScales = {
        x: { ticks: { color: theme.muted, font: { size: 11 } }, grid: { display: false }, border: { display: false } },
        y: {
            beginAtZero: true,
            ticks: { color: theme.muted, font: { size: 11 }, callback: v => formatMoney(v, { compact: true }) },
            grid: { color: theme.border },
            border: { display: false }
        }
    };

    const legend = {
        position: 'top',
        align: 'end',
        labels: { color: theme.text, boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } }
    };

    if (type === 'cashflow') {
        const income = months.map(d => sumInMonth(monthKey(d), 'income'));
        const expense = months.map(d => sumInMonth(monthKey(d), 'expense'));

        document.getElementById('reportChartHint').textContent = 'Pemasukan vs pengeluaran per bulan';

        state.charts.report = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Pemasukan', data: income, backgroundColor: theme.income, borderRadius: 4, maxBarThickness: 22 },
                    { label: 'Pengeluaran', data: expense, backgroundColor: theme.expense, borderRadius: 4, maxBarThickness: 22 }
                ]
            },
            options: baseChartOptions(theme, {
                plugins: {
                    legend,
                    tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatMoney(ctx.parsed.y, { compact: true })}` } }
                },
                scales: axisScales
            })
        });
        return;
    }

    if (type === 'category') {
        const totals = {};
        months.forEach(d => {
            Object.entries(expenseByCategory(monthKey(d))).forEach(([name, value]) => {
                totals[name] = (totals[name] || 0) + value;
            });
        });

        const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 8);
        document.getElementById('reportChartHint').textContent = 'Komposisi pengeluaran pada periode terpilih';

        state.charts.report = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: entries.length ? entries.map(e => e[0]) : ['Belum ada data'],
                datasets: [{
                    data: entries.length ? entries.map(e => e[1]) : [1],
                    backgroundColor: entries.length ? entries.map((_, i) => PALETTE[i % PALETTE.length]) : theme.border,
                    borderWidth: 0
                }]
            },
            options: baseChartOptions(theme, {
                plugins: {
                    legend: { ...legend, position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: ctx => {
                                const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
                                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                                return ` ${ctx.label}: ${formatMoney(ctx.parsed, { compact: true })} (${pct}%)`;
                            }
                        }
                    }
                }
            })
        });
        return;
    }

    const data = state.accounts.map(acc => sum(
        state.transactions.filter(t => t.type === 'expense' && t.accountId === acc.id && months.some(m => monthKey(parseDate(t.date) || new Date()) === monthKey(m))),
        t => Number(t.amount)
    ));

    document.getElementById('reportChartHint').textContent = 'Pengeluaran per akun';

    state.charts.report = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: state.accounts.map(a => a.name),
            datasets: [{
                label: 'Total Pengeluaran',
                data,
                backgroundColor: state.accounts.map(a => a.color || PALETTE[0]),
                borderRadius: 4,
                maxBarThickness: 40
            }]
        },
        options: baseChartOptions(theme, {
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${formatMoney(ctx.parsed.x, { compact: true })}` } }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: theme.muted, font: { size: 11 }, callback: v => formatMoney(v, { compact: true }) },
                    grid: { color: theme.border },
                    border: { display: false }
                },
                y: { ticks: { color: theme.muted, font: { size: 11 } }, grid: { display: false }, border: { display: false } }
            }
        })
    });
}

function sumInMonth(key, type) {
    return sum(
        state.transactions.filter(t => t.type === type && monthKey(parseDate(t.date) || new Date()) === key),
        t => Number(t.amount)
    );
}

function renderReportSummary() {
    const months = reportMonths();
    const keys = months.map(monthKey);

    const inRange = state.transactions.filter(t => keys.includes(monthKey(parseDate(t.date) || new Date())));
    const income = sum(inRange.filter(t => t.type === 'income'), t => Number(t.amount));
    const expense = sum(inRange.filter(t => t.type === 'expense'), t => Number(t.amount));
    const net = income - expense;
    const avgExpense = months.length ? expense / months.length : 0;
    const savingRate = income > 0 ? Math.round((net / income) * 100) : 0;

    const items = [
        { label: 'Total Pemasukan', value: formatMoney(income, { compact: true }), tone: 'is-income' },
        { label: 'Total Pengeluaran', value: formatMoney(expense, { compact: true }), tone: 'is-expense' },
        { label: 'Arus Kas Bersih', value: formatMoney(net, { compact: true }), tone: net >= 0 ? 'is-income' : 'is-expense' },
        { label: 'Rata-rata / Bulan', value: formatMoney(avgExpense, { compact: true }), tone: '' },
        { label: 'Tingkat Tabung', value: `${savingRate}%`, tone: savingRate >= 0 ? 'is-income' : 'is-expense' }
    ];

    document.getElementById('reportStats').innerHTML = items.map(item => `
        <article class="stat-card">
            <span class="stat-card__label">${esc(item.label)}</span>
            <span class="stat-card__value ${item.tone}">${esc(item.value)}</span>
        </article>
    `).join('');
}

function renderReportCategoryTable() {
    const keys = reportMonths().map(monthKey);
    const totals = {};

    state.transactions
        .filter(t => t.type === 'expense' && keys.includes(monthKey(parseDate(t.date) || new Date())))
        .forEach(t => {
            const cat = categoryOf(t.categoryId);
            if (!cat) return;
            if (!totals[cat.id]) totals[cat.id] = { name: cat.name, color: cat.color, icon: cat.icon, total: 0, count: 0 };
            totals[cat.id].total += Number(t.amount);
            totals[cat.id].count += 1;
        });

    const rows = Object.values(totals).sort((a, b) => b.total - a.total);
    const body = document.getElementById('reportCategoryBody');
    const grandTotal = sum(rows, r => r.total);

    if (!rows.length) {
        body.innerHTML = `<tr><td colspan="4">${emptyState('fa-chart-pie', 'Belum ada data', 'Tidak ada pengeluaran pada periode yang dipilih.')}</td></tr>`;
        return;
    }

    body.innerHTML = rows.map(row => {
        const pct = grandTotal > 0 ? Math.round((row.total / grandTotal) * 100) : 0;
        return `
            <tr>
                <td>
                    <span class="table__cat">
                        <span class="table__cat-dot" style="background:${esc(row.color)}"></span>
                        ${esc(row.name)}
                    </span>
                </td>
                <td class="is-right table__muted">${formatNumber(row.count)}</td>
                <td class="is-right table__cell--amount">${formatMoney(row.total)}</td>
                <td>
                    <div class="share-cell">
                        <span class="table__muted" style="font-size:12px;width:34px;text-align:right">${pct}%</span>
                        <span class="share-cell__track">
                            <span class="share-cell__fill" style="width:${pct}%;background:${esc(row.color)}"></span>
                        </span>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

/* ---------- Settings ----------------------------------------------------- */

function renderSettings() {
    document.getElementById('currencySelect').value = state.settings.currency;
    document.getElementById('dateFormatSelect').value = state.settings.dateFormat;
    document.getElementById('languageSelect').value = state.settings.language;
    document.getElementById('compactNumbers').checked = !!state.settings.compactNumbers;
    document.getElementById('apiBaseInput').value = localStorage.getItem('financeApp_apiBase') || '';
    document.getElementById('aboutCount').textContent = formatNumber(state.transactions.length);
    updateConnectionBadge();
}

/* ---------- Transaction modal -------------------------------------------- */

function transactionFormHTML(tx = null) {
    const type = tx ? tx.type : 'expense';
    const accounts = state.accounts;
    const accountOptions = accounts.map(a => `<option value="${esc(a.id)}" ${tx && tx.accountId === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
    const targetOptions = accounts.map(a => `<option value="${esc(a.id)}" ${tx && tx.toAccountId === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');

    return `
        <div class="amount-input-wrap">
            <span class="amount-input-wrap__symbol">${CURRENCY_SYMBOLS[state.settings.currency] || 'Rp'}</span>
            <input type="number" class="input amount-input" id="trxAmount" value="${tx ? Number(tx.amount) : ''}" placeholder="0" min="0" step="1000" inputmode="numeric">
        </div>

        <div class="type-toggle" id="trxTypeToggle">
            <button class="type-toggle__item ${type === 'expense' ? 'is-active' : ''}" data-type="expense">Pengeluaran</button>
            <button class="type-toggle__item ${type === 'income' ? 'is-active' : ''}" data-type="income">Pemasukan</button>
            <button class="type-toggle__item ${type === 'transfer' ? 'is-active' : ''}" data-type="transfer">Transfer</button>
        </div>

        <div class="field" id="trxCategoryField">
            <label class="field__label" for="trxCategory">Kategori</label>
            <select class="select" id="trxCategory"></select>
        </div>

        <div class="form-grid">
            <div class="field" id="trxAccountField">
                <label class="field__label" for="trxAccount" id="trxAccountLabel">Dari Akun</label>
                <select class="select" id="trxAccount">${accountOptions || '<option value="">Belum ada akun</option>'}</select>
            </div>
            <div class="field" id="trxTargetField" hidden>
                <label class="field__label" for="trxTarget">Ke Akun</label>
                <select class="select" id="trxTarget">${targetOptions || '<option value="">Belum ada akun</option>'}</select>
            </div>
        </div>

        <div class="field">
            <label class="field__label" for="trxDate">Tanggal</label>
            <input type="date" class="input" id="trxDate" value="${esc(tx ? tx.date : toISODate(new Date()))}">
        </div>

        <div class="field">
            <label class="field__label" for="trxNote">Catatan</label>
            <input type="text" class="input" id="trxNote" value="${esc(tx ? tx.note : '')}" placeholder="Contoh: Makan siang">
        </div>`;
}

function currentTrxType() {
    const active = document.querySelector('#trxTypeToggle .is-active');
    return active ? active.dataset.type : 'expense';
}

function refreshTrxForm(type) {
    const categories = state.categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));
    const select = document.getElementById('trxCategory');
    const previous = select.value;

    select.innerHTML = categories
        .map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`)
        .join('');

    if (categories.some(c => c.id === previous)) select.value = previous;

    document.getElementById('trxCategoryField').hidden = type === 'transfer';
    document.getElementById('trxTargetField').hidden = type !== 'transfer';
    document.getElementById('trxAccountLabel').textContent = type === 'income' ? 'Ke Akun' : 'Dari Akun';
}

function openTransactionModal(tx = null) {
    if (!state.accounts.length) {
        toast('Tambahkan akun terlebih dahulu', 'warning');
        navigateTo('accounts');
        openAccountModal();
        return;
    }

    openModal(tx ? 'Edit Transaksi' : 'Transaksi Baru', transactionFormHTML(tx), [
        { text: 'Batal' },
        {
            text: tx ? 'Simpan' : 'Tambah',
            class: 'btn-primary',
            icon: 'fa-check',
            keepOpen: true,
            onClick: async () => {
                const payload = collectTransactionPayload();
                if (!payload) return false;
                try {
                    if (tx) await updateRecord('transactions', tx.id, payload);
                    else await createRecord('transactions', payload);
                    closeModal();
                    toast(tx ? 'Transaksi diperbarui' : 'Transaksi ditambahkan');
                } catch (err) {
                    toast(err.message, 'error');
                }
            }
        }
    ]);

    refreshTrxForm(tx ? tx.type : 'expense');
}

function collectTransactionPayload() {
    const type = currentTrxType();
    const amount = parseFloat(document.getElementById('trxAmount').value);
    const accountId = document.getElementById('trxAccount').value;
    const date = document.getElementById('trxDate').value;
    const note = document.getElementById('trxNote').value.trim();

    if (!amount || amount <= 0) { toast('Jumlah harus lebih dari 0', 'error'); return null; }
    if (!accountId) { toast('Pilih akun terlebih dahulu', 'error'); return null; }
    if (!date) { toast('Pilih tanggal transaksi', 'error'); return null; }

    const categoryId = type === 'transfer' ? null : document.getElementById('trxCategory').value;
    const toAccountId = type === 'transfer' ? document.getElementById('trxTarget').value : null;

    if (type === 'transfer') {
        if (!toAccountId) { toast('Pilih akun tujuan transfer', 'error'); return null; }
        if (toAccountId === accountId) { toast('Akun tujuan harus berbeda', 'error'); return null; }
    }

    return { type, amount, categoryId, accountId, toAccountId, date, note, isRecurring: false, recurringId: null };
}

/* ---------- Account modal ------------------------------------------------ */

function accountFormHTML(account = null) {
    return `
        <div class="field">
            <label class="field__label" for="accName">Nama Akun</label>
            <input type="text" class="input" id="accName" value="${esc(account ? account.name : '')}" placeholder="Contoh: BCA, GoPay, Dompet">
        </div>
        <div class="field">
            <label class="field__label" for="accType">Tipe</label>
            <select class="select" id="accType">
                ${ACCOUNT_TYPES.map(t => `<option value="${t.value}" ${account && account.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
            </select>
        </div>
        ${account ? '' : `
        <div class="field">
            <label class="field__label" for="accBalance">Saldo Awal</label>
            <input type="number" class="input" id="accBalance" placeholder="0" min="0" step="1000">
        </div>`}
        <div class="field">
            <label class="field__label" for="accColor">Warna</label>
            <input type="color" class="color-input" id="accColor" value="${esc(account ? account.color : PALETTE[0])}">
        </div>
        <div class="field">
            <label class="field__label">Ikon</label>
            <div class="icon-picker" id="accIconPicker">
                ${ACCOUNT_ICONS.map(ic => `<button class="icon-picker__item ${account && account.icon === ic ? 'is-active' : ''}" data-icon="${ic}"><i class="fas ${ic}"></i></button>`).join('')}
            </div>
        </div>
        ${account ? `<p class="field__hint">Saldo dihitung dari saldo awal ditambah seluruh transaksi akun ini.</p>` : ''}`;
}

function openAccountModal(account = null) {
    openModal(account ? 'Edit Akun' : 'Tambah Akun', accountFormHTML(account), [
        { text: 'Batal' },
        {
            text: account ? 'Simpan' : 'Tambah',
            class: 'btn-primary',
            icon: 'fa-check',
            keepOpen: true,
            onClick: async () => {
                const name = document.getElementById('accName').value.trim();
                if (!name) { toast('Nama akun wajib diisi', 'error'); return false; }

                const payload = {
                    name,
                    type: document.getElementById('accType').value,
                    color: document.getElementById('accColor').value,
                    icon: selectedIcon('accIconPicker') || 'fa-wallet',
                    currency: state.settings.currency
                };

                if (account) {
                    payload.openingBalance = Number(account.openingBalance) || 0;
                } else {
                    payload.openingBalance = Math.max(parseFloat(document.getElementById('accBalance').value) || 0, 0);
                }

                try {
                    if (account) await updateRecord('accounts', account.id, payload);
                    else await createRecord('accounts', payload);
                    closeModal();
                    toast(account ? 'Akun diperbarui' : 'Akun ditambahkan');
                } catch (err) {
                    toast(err.message, 'error');
                }
            }
        }
    ]);
}

function selectedIcon(pickerId) {
    const active = document.querySelector(`#${pickerId} .is-active`);
    return active ? active.dataset.icon : null;
}

/* ---------- Category modal ----------------------------------------------- */

function categoryFormHTML(category = null) {
    const type = category ? category.type : 'expense';
    const color = category ? category.color : PALETTE[4];
    const icon = category ? category.icon : 'fa-tag';

    return `
        <div class="field">
            <label class="field__label" for="catName">Nama Kategori</label>
            <input type="text" class="input" id="catName" value="${esc(category ? category.name : '')}" placeholder="Contoh: Makanan">
        </div>
        <div class="field">
            <label class="field__label">Tipe</label>
            <div class="type-toggle" id="catTypeToggle">
                <button class="type-toggle__item ${type === 'expense' ? 'is-active' : ''}" data-type="expense">Pengeluaran</button>
                <button class="type-toggle__item ${type === 'income' ? 'is-active' : ''}" data-type="income">Pemasukan</button>
            </div>
        </div>
        <div class="field">
            <label class="field__label" for="catColor">Warna</label>
            <input type="color" class="color-input" id="catColor" value="${esc(color)}">
        </div>
        <div class="field">
            <label class="field__label">Ikon</label>
            <div class="icon-picker" id="catIconPicker">
                ${[...new Set(CATEGORY_ICONS)].map(ic => `<button class="icon-picker__item ${icon === ic ? 'is-active' : ''}" data-icon="${ic}"><i class="fas ${ic}"></i></button>`).join('')}
            </div>
        </div>`;
}

function openCategoryModal(category = null) {
    openModal(category ? 'Edit Kategori' : 'Tambah Kategori', categoryFormHTML(category), [
        { text: 'Batal' },
        {
            text: category ? 'Simpan' : 'Tambah',
            class: 'btn-primary',
            icon: 'fa-check',
            keepOpen: true,
            onClick: async () => {
                const name = document.getElementById('catName').value.trim();
                if (!name) { toast('Nama kategori wajib diisi', 'error'); return false; }

                const type = (document.querySelector('#catTypeToggle .is-active') || { dataset: { type: 'expense' } }).dataset.type;
                const payload = {
                    name,
                    type,
                    color: document.getElementById('catColor').value,
                    icon: selectedIcon('catIconPicker') || 'fa-tag',
                    isDefault: category ? !!category.isDefault : false
                };

                try {
                    if (category) await updateRecord('categories', category.id, payload);
                    else await createRecord('categories', payload);
                    closeModal();
                    toast(category ? 'Kategori diperbarui' : 'Kategori ditambahkan');
                } catch (err) {
                    toast(err.message, 'error');
                }
            }
        }
    ]);
}

/* ---------- Budget modal ------------------------------------------------- */

function budgetFormHTML(budget = null) {
    const key = monthKey(new Date());
    const categories = state.categories.filter(c => c.type === 'expense');

    if (!categories.length) {
        return `<p class="about-text">Tambahkan kategori pengeluaran terlebih dahulu.</p>`;
    }

    return `
        <div class="field">
            <label class="field__label" for="budgetCategory">Kategori</label>
            <select class="select" id="budgetCategory">
                ${categories.map(c => `<option value="${esc(c.id)}" ${budget && budget.categoryId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
            </select>
        </div>
        <div class="field">
            <label class="field__label" for="budgetAmount">Batas Anggaran</label>
            <input type="number" class="input" id="budgetAmount" value="${budget ? Number(budget.amount) : ''}" placeholder="500000" min="0" step="10000">
        </div>
        <p class="field__hint">Anggaran berlaku untuk bulan berjalan (${formatMonthShort(key)}).</p>`;
}

function openBudgetModal(budget = null) {
    if (!state.categories.filter(c => c.type === 'expense').length) {
        toast('Tambahkan kategori pengeluaran dulu', 'warning');
        navigateTo('categories');
        return;
    }

    openModal(budget ? 'Edit Anggaran' : 'Tambah Anggaran', budgetFormHTML(budget), [
        { text: 'Batal' },
        {
            text: budget ? 'Simpan' : 'Tambah',
            class: 'btn-primary',
            icon: 'fa-check',
            keepOpen: true,
            onClick: async () => {
                const amount = parseFloat(document.getElementById('budgetAmount').value);
                if (!amount || amount <= 0) { toast('Jumlah anggaran harus lebih dari 0', 'error'); return false; }

                const categoryId = document.getElementById('budgetCategory').value;
                const key = monthKey(new Date());
                const existing = state.budgets.find(b => b.categoryId === categoryId && b.month === key && (!budget || b.id !== budget.id));

                const payload = { categoryId, amount, period: 'monthly', month: key };

                try {
                    if (budget) await updateRecord('budgets', budget.id, payload);
                    else if (existing) await updateRecord('budgets', existing.id, { amount });
                    else await createRecord('budgets', payload);
                    closeModal();
                    toast(existing && !budget ? 'Anggaran diperbarui' : budget ? 'Anggaran diperbarui' : 'Anggaran ditambahkan');
                } catch (err) {
                    toast(err.message, 'error');
                }
            }
        }
    ]);
}

/* ---------- Goal modal --------------------------------------------------- */

function goalFormHTML(goal = null) {
    return `
        <div class="field">
            <label class="field__label" for="goalName">Nama Target</label>
            <input type="text" class="input" id="goalName" value="${esc(goal ? goal.name : '')}" placeholder="Contoh: Laptop Baru">
        </div>
        <div class="form-grid">
            <div class="field">
                <label class="field__label" for="goalTarget">Target Jumlah</label>
                <input type="number" class="input" id="goalTarget" value="${goal ? Number(goal.targetAmount) : ''}" placeholder="15000000" min="0" step="10000">
            </div>
            <div class="field">
                <label class="field__label" for="goalCurrent">Terkumpul</label>
                <input type="number" class="input" id="goalCurrent" value="${goal ? Number(goal.currentAmount) : ''}" placeholder="0" min="0" step="10000">
            </div>
        </div>
        <div class="field">
            <label class="field__label" for="goalDeadline">Tenggat</label>
            <input type="date" class="input" id="goalDeadline" value="${esc(goal ? goal.deadline : '')}">
        </div>
        <div class="form-grid">
            <div class="field">
                <label class="field__label" for="goalColor">Warna</label>
                <input type="color" class="color-input" id="goalColor" value="${esc(goal ? goal.color : PALETTE[0])}">
            </div>
            <div class="field">
                <label class="field__label">Ikon</label>
                <div class="icon-picker" id="goalIconPicker" style="grid-template-columns:repeat(5,1fr)">
                    ${['fa-bullseye', 'fa-laptop', 'fa-car', 'fa-house', 'fa-plane', 'fa-graduation-cap', 'fa-shield-alt', 'fa-ring', 'fa-piggy-bank', 'fa-mobile-alt']
                        .map(ic => `<button class="icon-picker__item ${goal && goal.icon === ic ? 'is-active' : ''}" data-icon="${ic}"><i class="fas ${ic}"></i></button>`).join('')}
                </div>
            </div>
        </div>`;
}

function openGoalModal(goal = null) {
    openModal(goal ? 'Edit Target' : 'Tambah Target', goalFormHTML(goal), [
        { text: 'Batal' },
        {
            text: goal ? 'Simpan' : 'Tambah',
            class: 'btn-primary',
            icon: 'fa-check',
            keepOpen: true,
            onClick: async () => {
                const name = document.getElementById('goalName').value.trim();
                const targetAmount = parseFloat(document.getElementById('goalTarget').value);
                const currentAmount = parseFloat(document.getElementById('goalCurrent').value) || 0;

                if (!name) { toast('Nama target wajib diisi', 'error'); return false; }
                if (!targetAmount || targetAmount <= 0) { toast('Target jumlah harus lebih dari 0', 'error'); return false; }

                const payload = {
                    name,
                    targetAmount,
                    currentAmount: Math.min(currentAmount, targetAmount),
                    deadline: document.getElementById('goalDeadline').value,
                    color: document.getElementById('goalColor').value,
                    icon: selectedIcon('goalIconPicker') || 'fa-bullseye'
                };

                try {
                    if (goal) await updateRecord('goals', goal.id, payload);
                    else await createRecord('goals', payload);
                    closeModal();
                    toast(goal ? 'Target diperbarui' : 'Target ditambahkan');
                } catch (err) {
                    toast(err.message, 'error');
                }
            }
        }
    ]);
}

function openContributeModal(goalId) {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    const remaining = Math.max(Number(goal.targetAmount) - Number(goal.currentAmount), 0);

    openModal('Tambah Kontribusi', `
        <div class="amount-input-wrap">
            <span class="amount-input-wrap__symbol">${CURRENCY_SYMBOLS[state.settings.currency] || 'Rp'}</span>
            <input type="number" class="input amount-input" id="contributeAmount" placeholder="0" min="0" max="${remaining}" step="1000">
        </div>
        <p class="field__hint">Sisa target ${esc(goal.name)}: ${formatMoney(remaining)}</p>
    `, [
        { text: 'Batal' },
        {
            text: 'Tambah',
            class: 'btn-primary',
            icon: 'fa-check',
            keepOpen: true,
            onClick: async () => {
                const amount = parseFloat(document.getElementById('contributeAmount').value);
                if (!amount || amount <= 0) { toast('Jumlah harus lebih dari 0', 'error'); return false; }
                try {
                    await updateRecord('goals', goalId, { currentAmount: Number(goal.currentAmount) + amount });
                    closeModal();
                    toast('Kontribusi ditambahkan');
                } catch (err) {
                    toast(err.message, 'error');
                }
            }
        }
    ]);
}

/* ---------- Data transfer ------------------------------------------------ */

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function exportData() {
    downloadJSON({
        accounts: state.accounts,
        transactions: state.transactions,
        categories: state.categories,
        budgets: state.budgets,
        goals: state.goals,
        settings: state.settings,
        exportedAt: new Date().toISOString()
    }, `financeapp-backup-${toISODate(new Date())}.json`);
    toast('Data berhasil diekspor');
}

function exportCSV() {
    const header = 'tanggal,tipe,kategori,akun,keterangan,jumlah\n';
    const escape = (v) => {
        const s = v === undefined || v === null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = [...state.transactions]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(t => {
            const cat = categoryOf(t.categoryId);
            const acc = accountOf(t.accountId);
            return [
                t.date,
                t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
                cat ? cat.name : '',
                acc ? acc.name : '',
                t.note || '',
                Number(t.amount)
            ].map(escape).join(',');
        })
        .join('\n');

    const blob = new Blob([header + rows + (rows ? '\n' : '')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaksi-${toISODate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('CSV berhasil dibuat');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data || typeof data !== 'object') throw new Error('Format tidak dikenali');

            await Api.saveAll({
                accounts: data.accounts || state.accounts,
                transactions: data.transactions || state.transactions,
                categories: data.categories || state.categories,
                budgets: data.budgets || state.budgets,
                goals: data.goals || state.goals,
                settings: { ...state.settings, ...(data.settings || {}) }
            });

            await refreshFromSource();
            applyTheme(document.documentElement.getAttribute('data-theme'));
            toast('Data berhasil diimpor');
        } catch (err) {
            toast('File tidak valid: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

async function resetData() {
    if (!confirmAction('Hapus SEMUA data dan kembali ke data demo? Tindakan ini tidak dapat dibatalkan.')) return;

    try {
        await Api.resetAll();
        await loadState();
        applyTheme(document.documentElement.getAttribute('data-theme'));
        navigateTo('dashboard');
        toast('Data direset ke data demo');
    } catch (err) {
        toast('Gagal mereset data: ' + err.message, 'error');
    }
}

/* ---------- Global search ------------------------------------------------- */

function runSearch(query) {
    const box = document.getElementById('searchResults');
    const q = query.trim().toLowerCase();

    if (!q) {
        box.hidden = true;
        box.innerHTML = '';
        return;
    }

    const results = [];

    state.transactions.forEach(t => {
        const cat = categoryOf(t.categoryId);
        const haystack = `${t.note || ''} ${cat ? cat.name : ''} ${formatMoney(t.amount)}`.toLowerCase();
        if (haystack.includes(q)) {
            results.push({
                type: 'transaction',
                id: t.id,
                icon: cat ? cat.icon : 'fa-arrow-right-arrow-left',
                color: cat ? cat.color : PALETTE[8],
                title: t.note || (cat ? cat.name : 'Transfer'),
                sub: `${relativeDay(t.date)} · ${formatMoney(t.amount)}`,
                amount: t.amount
            });
        }
    });

    state.accounts.forEach(a => {
        if (`${a.name} ${a.type}`.toLowerCase().includes(q)) {
            results.push({ type: 'account', id: a.id, icon: a.icon || 'fa-wallet', color: a.color, title: a.name, sub: `Saldo ${formatMoney(a.balance)}` });
        }
    });

    state.categories.forEach(c => {
        if (`${c.name}`.toLowerCase().includes(q)) {
            results.push({ type: 'category', id: c.id, icon: c.icon || 'fa-tag', color: c.color, title: c.name, sub: c.type === 'income' ? 'Kategori pemasukan' : 'Kategori pengeluaran' });
        }
    });

    const limited = results.slice(0, 8);

    box.innerHTML = limited.length
        ? limited.map(item => `
            <button class="search-results__item" data-search-type="${item.type}" data-search-id="${esc(item.id)}">
                <span class="icon-dot" style="background:${esc(item.color)};width:28px;height:28px;font-size:11px">
                    <i class="fas ${iconClass(item.icon)}"></i>
                </span>
                <span class="search-results__meta">
                    <span class="search-results__title">${esc(item.title)}</span>
                    <span class="search-results__sub">${esc(item.sub)}</span>
                </span>
            </button>`).join('')
        : `<div class="search-results__empty">Tidak ada hasil untuk "${esc(query)}"</div>`;

    box.hidden = false;
}

function openSearchResult(type, id) {
    document.getElementById('searchResults').hidden = true;
    document.getElementById('globalSearch').value = '';

    if (type === 'transaction') {
        const tx = state.transactions.find(t => t.id === id);
        if (tx) openTransactionModal(tx);
        return;
    }
    if (type === 'account') {
        navigateTo('accounts');
        const acc = state.accounts.find(a => a.id === id);
        if (acc) setTimeout(() => openAccountModal(acc), 120);
        return;
    }
    if (type === 'category') {
        navigateTo('categories');
        const cat = state.categories.find(c => c.id === id);
        if (cat) setTimeout(() => openCategoryModal(cat), 120);
    }
}

/* ---------- Event wiring ------------------------------------------------- */

function bindEvents() {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });

    document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(el.dataset.goto);
        });
    });

    document.getElementById('menuBtn').addEventListener('click', openSidebar);
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('sidebarBackdrop').addEventListener('click', closeSidebar);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    document.getElementById('addTransactionBtn').addEventListener('click', () => openTransactionModal());
    document.getElementById('fabBtn').addEventListener('click', () => openTransactionModal());
    document.getElementById('addAccountBtn').addEventListener('click', () => openAccountModal());
    document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal());
    document.getElementById('addBudgetBtn').addEventListener('click', () => openBudgetModal());
    document.getElementById('addGoalBtn').addEventListener('click', () => openGoalModal());

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    ['filterType', 'filterAccount', 'filterCategory', 'filterDateFrom', 'filterDateTo'].forEach(id => {
        document.getElementById(id).addEventListener('change', applyFilters);
    });
    document.getElementById('txSearch').addEventListener('input', applyFilters);
    document.getElementById('resetFilter').addEventListener('click', resetFilters);

    document.getElementById('trendRange').addEventListener('click', (e) => {
        const btn = e.target.closest('.segmented__item');
        if (!btn) return;
        state.ui.trendMonths = Number(btn.dataset.months);
        document.querySelectorAll('#trendRange .segmented__item').forEach(b => b.classList.toggle('is-active', b === btn));
        renderTrendChart();
    });

    document.getElementById('calPrev').addEventListener('click', () => shiftCalendarMonth(-1));
    document.getElementById('calNext').addEventListener('click', () => shiftCalendarMonth(1));

    document.getElementById('reportPeriod').addEventListener('change', renderReports);
    document.getElementById('reportType').addEventListener('change', renderReportChart);

    const settings = [
        ['currencySelect', 'currency'],
        ['dateFormatSelect', 'dateFormat'],
        ['languageSelect', 'language']
    ];

    settings.forEach(([id, key]) => {
        document.getElementById(id).addEventListener('change', async (e) => {
            state.settings[key] = e.target.value;
            await persistAll();
            renderCurrentPage();
            toast('Preferensi disimpan');
        });
    });

    document.getElementById('compactNumbers').addEventListener('change', async (e) => {
        state.settings.compactNumbers = e.target.checked;
        await persistAll();
        renderCurrentPage();
    });

    document.getElementById('apiBaseSave').addEventListener('click', () => {
        const value = document.getElementById('apiBaseInput').value.trim();
        if (!value) {
            localStorage.removeItem('financeApp_apiBase');
            location.reload();
            return;
        }
        Api.setBase(value);
    });

    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', (e) => {
        if (e.target.files.length) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    });
    document.getElementById('clearDataBtn').addEventListener('click', resetData);

    const searchInput = document.getElementById('globalSearch');
    searchInput.addEventListener('input', (e) => runSearch(e.target.value));
    searchInput.addEventListener('focus', (e) => runSearch(e.target.value));

    document.getElementById('searchResults').addEventListener('click', (e) => {
        const item = e.target.closest('.search-results__item');
        if (!item) return;
        openSearchResult(item.dataset.searchType, item.dataset.searchId);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#searchWrap')) document.getElementById('searchResults').hidden = true;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.getElementById('modalOverlay').classList.contains('is-open')) closeModal();
            document.getElementById('searchResults').hidden = true;
            closeSidebar();
        }

        if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
            e.preventDefault();
            searchInput.focus();
        }

        const modalOpen = document.getElementById('modalOverlay').classList.contains('is-open');
        if (modalOpen && e.key === 'Enter' && modalSubmitHandler) {
            e.preventDefault();
            modalSubmitHandler();
        }
    });

    bindDynamicEvents();
}

function bindDynamicEvents() {
    document.getElementById('content').addEventListener('click', async (e) => {
        const target = e.target.closest('[data-action], [data-edit-tx], [data-delete-tx], [data-cal-day], [data-edit-account], [data-delete-account], [data-edit-category], [data-delete-category], [data-edit-budget], [data-delete-budget], [data-edit-goal], [data-delete-goal], [data-contribute-goal]');
        if (!target) return;

        const d = target.dataset;

        if (d.action === 'addBudget') return openBudgetModal();
        if (d.action === 'addGoal') return openGoalModal();
        if (d.action === 'addAccount') return openAccountModal();

        try {
            if (d.editTx) {
                const tx = state.transactions.find(t => t.id === d.editTx);
                if (tx) openTransactionModal(tx);
            }

            if (d.deleteTx) {
                if (!confirmAction('Hapus transaksi ini?')) return;
                await deleteRecord('transactions', d.deleteTx);
                toast('Transaksi dihapus');
            }

            if (d.calDay) {
                state.ui.calendarDate = Number(d.calDay);
                renderCalendar();
            }

            if (d.editAccount) {
                const acc = state.accounts.find(a => a.id === d.editAccount);
                if (acc) openAccountModal(acc);
            }

            if (d.deleteAccount) {
                const acc = state.accounts.find(a => a.id === d.deleteAccount);
                if (!confirmAction(`Hapus akun "${acc ? acc.name : ''}"? Transaksi terkait tetap tersimpan.`)) return;
                await deleteRecord('accounts', d.deleteAccount);
                toast('Akun dihapus');
            }

            if (d.editCategory) {
                const cat = state.categories.find(c => c.id === d.editCategory);
                if (cat) openCategoryModal(cat);
            }

            if (d.deleteCategory) {
                const cat = state.categories.find(c => c.id === d.deleteCategory);
                const used = state.transactions.filter(t => t.categoryId === d.deleteCategory).length;
                if (!confirmAction(`Hapus kategori "${cat ? cat.name : ''}"?${used ? ` ${used} transaksi akan kehilangan kategori ini.` : ''}`)) return;
                await deleteRecord('categories', d.deleteCategory);
                toast('Kategori dihapus');
            }

            if (d.editBudget) {
                const budget = state.budgets.find(b => b.id === d.editBudget);
                if (budget) openBudgetModal(budget);
            }

            if (d.deleteBudget) {
                if (!confirmAction('Hapus anggaran ini?')) return;
                await deleteRecord('budgets', d.deleteBudget);
                toast('Anggaran dihapus');
            }

            if (d.editGoal) {
                const goal = state.goals.find(g => g.id === d.editGoal);
                if (goal) openGoalModal(goal);
            }

            if (d.deleteGoal) {
                const goal = state.goals.find(g => g.id === d.deleteGoal);
                if (!confirmAction(`Hapus target "${goal ? goal.name : ''}"?`)) return;
                await deleteRecord('goals', d.deleteGoal);
                toast('Target dihapus');
            }

            if (d.contributeGoal) openContributeModal(d.contributeGoal);
        } catch (err) {
            toast(err.message || 'Terjadi kesalahan', 'error');
        }
    });

    document.getElementById('modalBody').addEventListener('click', (e) => {
        const typeBtn = e.target.closest('.type-toggle__item');
        if (typeBtn) {
            const toggle = typeBtn.closest('.type-toggle');
            toggle.querySelectorAll('.type-toggle__item').forEach(b => b.classList.toggle('is-active', b === typeBtn));
            if (toggle.id === 'trxTypeToggle') refreshTrxForm(typeBtn.dataset.type);
            return;
        }

        const iconBtn = e.target.closest('.icon-picker__item');
        if (iconBtn) {
            const picker = iconBtn.closest('.icon-picker');
            picker.querySelectorAll('.icon-picker__item').forEach(b => b.classList.toggle('is-active', b === iconBtn));
        }
    });
}

/* ---------- Boot --------------------------------------------------------- */

async function init() {
    initTheme();
    bindEvents();
    navigateTo('dashboard', { scroll: false });

    const mode = await Api.init();
    updateConnectionBadge();

    try {
        await loadState();
    } catch (err) {
        console.error(err);
        toast('Gagal memuat data: ' + err.message, 'error');
    }

    if (mode === 'local' && !state.transactions.length) {
        toast('Backend tidak aktif — memakai data lokal', 'warning');
    }

    syncLocalCache();
    state.ready = true;
    renderCurrentPage();
}

document.addEventListener('DOMContentLoaded', init);