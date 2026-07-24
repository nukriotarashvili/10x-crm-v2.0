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

    if (path.endsWith('clients.html')) {
        const { loadClients, createClient, filterAndSortClients, getClientsState, removeClient } =
            await import('./services/clients.js');
        const container = document.getElementById('clientsContainer');
        if (container) {
            await initClientsPage(container, {
                loadClients,
                createClient,
                filterAndSortClients,
                getClientsState,
                removeClient
            });
        }
    } else if (path.endsWith('dashboard.html')) {
        const { loadClients } = await import('./services/clients.js');
        const { initDashboard } = await import('./services/dashboard.js');
        const dummyContainer = document.createElement('div');
        await loadClients(dummyContainer);
        await initDashboard();
    } else if (path.endsWith('profile.html')) {
        const { initProfile } = await import('./services/profile.js');
        await initProfile();
    }
}

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

async function initClientsPage(clientsContainer, clientsApi) {
    const {
        loadClients,
        createClient,
        filterAndSortClients,
        getClientsState,
        removeClient
    } = clientsApi;

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

function start() {
    void bootApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
