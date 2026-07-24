import {
    applyFieldErrors,
    attachLiveInputErrorClear,
    clearErrors,
    showGenericFormError,
    showToast
} from './utils/dom.js';
import {
    checkAuth,
    handleLogout,
    initTheme,
    loginUser,
    registerUser,
    toggleTheme,
    validateLogin,
    validateSignup
} from './services/auth.js';
import {
    createClient,
    filterAndSortClients,
    getClientsState,
    loadClients,
    removeClient
} from './services/clients.js';
import { initDashboard } from './services/dashboard.js';
import { initProfile } from './services/profile.js';

window.showToast = showToast;

checkAuth();
initTheme();

document.addEventListener('DOMContentLoaded', async () => {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const logoBrand = document.getElementById('logoBrand');
    if (logoBrand) {
        logoBrand.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    const path = window.location.pathname;

    if (path.endsWith('index.html') || path === '/') {
        initLoginPage();
    } else if (path.endsWith('signup.html')) {
        initSignupPage();
    } else if (path.endsWith('clients.html')) {
        const container = document.getElementById('clientsContainer');
        if (container) {
            await initClientsPage(container);
        }
    } else if (path.endsWith('dashboard.html')) {
        const dummyContainer = document.createElement('div');
        await loadClients(dummyContainer);
        initDashboard();
    } else if (path.endsWith('profile.html')) {
        initProfile();
    }
});

function renderClientsUI(clientsArray, container) {
    container.innerHTML = '';

    if (clientsArray.length === 0) {
        container.innerHTML = '<div class="loading-state">No clients found.</div>';
        return;
    }

    clientsArray.forEach((client) => {
        const card = document.createElement('div');
        const statusClass = client.status.toLowerCase();
        card.className = `client-card status-${statusClass}`;
        card.setAttribute('data-id', client.id);

        const formattedValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(client.dealValue);

        card.innerHTML = `
            <img src="${client.image || 'https://dummyjson.com/icon/default/128'}" alt="${client.name}">
            <div class="info">
                <h3>${client.name}</h3>
                <p>${client.company || 'No Company'} • ${client.email}</p>
                <p class="deal-value">${formattedValue}</p>
            </div>
            <div>
                <span class="badge ${statusClass}">${client.status}</span>
            </div>
            <button type="button" class="delete-btn" data-id="${client.id}">Delete</button>
        `;

        container.appendChild(card);
    });
}

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    attachLiveInputErrorClear(loginForm);

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(loginForm);
        loginForm.querySelector('.generic-error')?.remove();

        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const errors = validateLogin({ email, password });

        if (Object.keys(errors).length > 0) {
            applyFieldErrors(errors);
            return;
        }

        const result = loginUser({ email, password });
        if (result.ok) {
            window.location.href = 'dashboard.html';
        } else {
            showGenericFormError(loginForm, 'Invalid email or password');
        }
    });
}

function initSignupPage() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    attachLiveInputErrorClear(signupForm);

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(signupForm);

        const fullName = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const company = document.getElementById('signupCompany').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        const errors = validateSignup({
            name: fullName,
            email,
            password,
            confirmPassword
        });

        if (Object.keys(errors).length > 0) {
            applyFieldErrors(errors);
            return;
        }

        registerUser({ fullName, email, company, password, confirmPassword });
        showToast('Account created successfully! Please log in.', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    });
}

async function initClientsPage(clientsContainer) {
    let activeFilter = 'All';

    const addClientBtn = document.getElementById('addClientBtn');
    const addClientModal = document.getElementById('addClientModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addClientForm = document.getElementById('addClientForm');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    const applyFiltersAndRender = () => {
        const filtered = filterAndSortClients(getClientsState(), {
            searchTerm: searchInput.value.trim(),
            activeFilter,
            sortValue: sortSelect.value
        });
        renderClientsUI(filtered, clientsContainer);
    };

    await loadClients(clientsContainer);
    if (clientsContainer.querySelector('.error-state')) {
        return;
    }

    clientsContainer.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('delete-btn')) return;

        e.stopPropagation();
        const clientId = e.target.getAttribute('data-id');

        if (!confirm('Delete this client? This cannot be undone.')) return;

        try {
            await removeClient(clientId);
            applyFiltersAndRender();
            showToast('Client deleted ✓', 'success');
        } catch {
            showToast('Error deleting client', 'error');
        }
    });

    addClientBtn?.addEventListener('click', () => {
        addClientModal.style.display = 'flex';
    });

    const closeModal = () => {
        addClientModal.style.display = 'none';
        addClientForm.reset();
        clearErrors(addClientForm);
    };

    closeModalBtn?.addEventListener('click', closeModal);
    addClientModal?.addEventListener('click', (e) => {
        if (e.target === addClientModal) closeModal();
    });

    attachLiveInputErrorClear(addClientForm);

    addClientForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(addClientForm);

        const formData = {
            name: document.getElementById('clientName').value.trim(),
            email: document.getElementById('clientEmail').value.trim(),
            phone: document.getElementById('clientPhone').value.trim(),
            company: document.getElementById('clientCompany').value.trim(),
            dealValue: parseFloat(document.getElementById('clientDealValue').value),
            status: document.getElementById('clientStatus').value
        };

        try {
            const result = await createClient(formData);
            if (!result.ok) {
                applyFieldErrors(result.errors);
                return;
            }

            applyFiltersAndRender();
            closeModal();
            showToast('Client added ✓', 'success');
        } catch {
            showToast('Error adding client', 'error');
        }
    });

    searchInput?.addEventListener('input', applyFiltersAndRender);
    sortSelect?.addEventListener('change', applyFiltersAndRender);

    document.querySelectorAll('.filters .chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filters .chip').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.dataset.status;
            applyFiltersAndRender();
        });
    });

    applyFiltersAndRender();
}
