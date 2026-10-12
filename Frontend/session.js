/* FinanceApp - session & user lokal (dipakai bersama oleh auth.js dan app.js) */

const Auth = (() => {
    const USERS_KEY = 'financeApp_users';
    const SESSION_KEY = 'financeApp_session';

    const emailOf = (email) => String(email || '').trim().toLowerCase();

    function readJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Gagal menyimpan ke localStorage', e);
            return false;
        }
    }

    function allUsers() {
        const list = readJSON(USERS_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    function session() {
        const data = readJSON(SESSION_KEY, null);
        if (!data || !data.userId) return null;
        return data;
    }

    function isSignedIn() {
        return !!session();
    }

    function displayName() {
        const s = session();
        return s && s.name ? s.name : 'Tamu';
    }

    function initials(name) {
        const parts = String(name || 'T').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'T';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function signIn({ id, name, email, isRegistered = true }) {
        return writeJSON(SESSION_KEY, {
            userId: id,
            name,
            email: email || null,
            isGuest: !email,
            isRegistered: !!isRegistered,
            signedInAt: new Date().toISOString()
        });
    }

    function signOut() {
        localStorage.removeItem(SESSION_KEY);
    }

    function isRegisteredUser() {
        const s = session();
        return !!(s && !s.isGuest);
    }

    return {
        USERS_KEY,
        SESSION_KEY,
        emailOf,
        readJSON,
        writeJSON,
        allUsers,
        session,
        isSignedIn,
        displayName,
        initials,
        signIn,
        signOut,
        isRegisteredUser
    };
})();