import {
    applyFieldErrors,
    attachLiveInputErrorClear,
    clearErrors,
    showToast
} from './utils/dom.js';
import {
    checkAuth,
    handleLogout,
    initTheme,
    toggleTheme
} from './services/auth.js';
import { initClientsPage } from './pages/clients-page.js';

window.showToast = showToast;
initTheme();

async function bootApp() {
    try {
        const allowed = await checkAuth();
        if (!allowed) {
            return;
        }
    } catch (error) {
        console.error('Auth guard error:', error);
        return;
    }

    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        void handleLogout();
    });
    document.getElementById('logoBrand')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    const path = window.location.pathname.toLowerCase();

    if (path.endsWith('clients.html') || path.endsWith('/clients')) {
        await initClientsPage();
    } else if (path.endsWith('dashboard.html') || path.endsWith('/dashboard')) {
        const { loadClients } = await import('./services/clients.js');
        const { initDashboard } = await import('./services/dashboard.js');
        const dummyContainer = document.createElement('div');
        await loadClients(dummyContainer, { page: 1, limit: 200 });
        await initDashboard();
    } else if (path.endsWith('profile.html')) {
        const { initProfile } = await import('./services/profile.js');
        await initProfile();
    }
}

function start() {
    void bootApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
