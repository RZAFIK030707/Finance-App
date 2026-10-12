/* FinanceApp - auth lokal (tanpa server) */

const THEME_KEY = 'financeApp_theme';
const APP_URL = 'index.html';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const state = { mode: 'login', users: [] };

/* ---------- Password hashing ---------------------------------------------
   Auth lokal sepenuhnya, jadi ini hanya obfuscation ringan - bukan keamanan
   sungguhan. Tetap dipakai supaya password tidak terbaca polos di
   localStorage, dan memakai SHA-256 bila browser mendukungnya (butuh secure
   context: https / localhost). Fallback dipakai saat crypto.subtle tidak ada,
   misal ketika halaman dibuka lewat file://.
   -------------------------------------------------------------------------- */

function fallbackHash(input) {
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < input.length; i++) {
        const c = input.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
        h2 = Math.imul(h2 + c + i, 2246822519) >>> 0;
    }
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

async function hashPassword(password, salt) {
    const raw = `${salt}:${password}`;

    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
        try {
            const bytes = new TextEncoder().encode(raw);
            const digest = await window.crypto.subtle.digest('SHA-256', bytes);
            return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            /* jatuh ke fallback */
        }
    }
    return fallbackHash(raw);
}

function makeId() {
    return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------- Toast -------------------------------------------------------- */

function toast(message, type = 'success') {
    const stack = document.getElementById('toastContainer');
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `toast is-${type}`;
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
    stack.appendChild(el);

    setTimeout(() => {
        el.classList.add('is-leaving');
        setTimeout(() => el.remove(), 200);
    }, 3000);
}

function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ---------- UI state ----------------------------------------------------- */

function setMode(mode) {
    state.mode = mode;
    const isRegister = mode === 'register';

    document.querySelectorAll('.auth__tab').forEach(tab => {
        tab.classList.toggle('is-active', tab.dataset.mode === mode);
    });

    document.getElementById('nameField').hidden = !isRegister;
    document.getElementById('confirmField').hidden = !isRegister;
    document.getElementById('authTitle').textContent = isRegister ? 'Buat akun kamu' : 'Selamat datang kembali';
    document.getElementById('authHint').textContent = isRegister ? 'Daftar sekali, kelola keuangan kapan saja.' : 'Masuk untuk melanjutkan.';
    document.getElementById('authSubmitLabel').textContent = isRegister ? 'Daftar Sekarang' : 'Masuk';
    document.getElementById('authPassword').setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');

    hideError();
    document.getElementById('authPassword').value = '';
    document.getElementById('authConfirm').value = '';
}

function showError(message) {
    const el = document.getElementById('authError');
    el.textContent = message;
    el.hidden = false;
}

function hideError() {
    document.getElementById('authError').hidden = true;
}

function setSubmitting(isSubmitting) {
    const btn = document.getElementById('authSubmit');
    btn.disabled = isSubmitting;
    btn.querySelector('span').textContent = isSubmitting ? 'Tunggu sebentar...' : (state.mode === 'register' ? 'Daftar Sekarang' : 'Masuk');
}

function goToApp() {
    location.replace(APP_URL);
}

/* ---------- Actions ------------------------------------------------------ */

async function handleSubmit(event) {
    event.preventDefault();
    hideError();

    const email = Auth.emailOf(document.getElementById('authEmail').value);
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value.trim();

    if (state.mode === 'register' && name.length < 2) {
        showError('Nama minimal 2 karakter');
        return;
    }
    if (!EMAIL_RE.test(email)) {
        showError('Format email belum benar');
        return;
    }
    if (password.length < 6) {
        showError('Kata sandi minimal 6 karakter');
        return;
    }
    if (state.mode === 'register' && password !== document.getElementById('authConfirm').value) {
        showError('Kata sandi belum sama');
        return;
    }

    setSubmitting(true);

    try {
        if (state.mode === 'register') {
            if (state.users.some(u => u.email === email)) {
                showError('Email ini sudah terdaftar. Coba masuk saja.');
                setSubmitting(false);
                return;
            }

            const salt = Math.random().toString(36).slice(2, 10);
            const user = {
                id: makeId(),
                name,
                email,
                salt,
                hash: await hashPassword(password, salt),
                createdAt: new Date().toISOString()
            };

            state.users.push(user);
            if (!Auth.writeJSON(Auth.USERS_KEY, state.users)) {
                showError('Penyimpanan browser penuh, tidak bisa menyimpan akun');
                setSubmitting(false);
                return;
            }

            Auth.signIn({ id: user.id, name: user.name, email: user.email, isRegistered: true });
            toast('Akun berhasil dibuat');
        } else {
            const user = state.users.find(u => u.email === email);
            const hash = user ? await hashPassword(password, user.salt) : null;

            if (!user || hash !== user.hash) {
                showError('Email atau kata sandi salah');
                setSubmitting(false);
                return;
            }

            Auth.signIn({ id: user.id, name: user.name, email: user.email, isRegistered: true });
            toast('Selamat datang kembali');
        }

        setTimeout(goToApp, 500);
    } catch (err) {
        showError('Terjadi kesalahan. Coba lagi.');
        setSubmitting(false);
    }
}

function continueAsGuest() {
    Auth.signIn({ id: 'guest', name: 'Tamu', email: null, isRegistered: false });
    toast('Mode tamu aktif');
    setTimeout(goToApp, 400);
}

/* ---------- Theme -------------------------------------------------------- */

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    localStorage.setItem(THEME_KEY, theme);
}

/* ---------- Boot --------------------------------------------------------- */

function init() {
    state.users = Auth.allUsers();

    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

    if (Auth.isSignedIn()) {
        goToApp();
        return;
    }

    document.querySelectorAll('.auth__tab').forEach(tab => {
        tab.addEventListener('click', () => setMode(tab.dataset.mode));
    });

    document.getElementById('authForm').addEventListener('submit', handleSubmit);
    document.getElementById('guestBtn').addEventListener('click', continueAsGuest);
    document.getElementById('themeToggle').addEventListener('click', () => {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    document.getElementById('togglePassword').addEventListener('click', () => {
        const input = document.getElementById('authPassword');
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        document.querySelector('#togglePassword i').className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
    });

    document.querySelectorAll('.auth__tab')[0].focus();
}

document.addEventListener('DOMContentLoaded', init);