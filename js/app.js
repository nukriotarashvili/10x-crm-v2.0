import {
    applyFieldErrors,
    attachLiveInputErrorClear,
    clearErrors,
    showGenericFormError,
    showToast
} from './utils/dom.js';
import {
    changeUserPassword,
    checkAuth,
    getCurrentUser,
    handleLogout,
    initTheme,
    loginUser,
    registerUser,
    toggleTheme,
    updateUserProfile,
    validateLogin,
    validateSignup
} from './services/auth.js';
import {
    addClientToState,
    computeDashboardStats,
    createClient,
    ensureClientsLoaded,
    filterAndSortClients,
    getClientsState,
    loadClients,
    removeClient,
    resetClientsData
} from './services/clients.js';

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
    }
    if (path.endsWith('signup.html')) {
        initSignupPage();
    }
    if (path.endsWith('clients.html')) {
        await initClientsPage();
    }
    if (path.endsWith('dashboard.html')) {
        await initDashboardPage();
    }
    if (path.endsWith('profile.html')) {
        initProfilePage();
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

async function initClientsPage() {
    let activeFilter = 'All';

    const clientsContainer = document.getElementById('clientsContainer');
    const addClientBtn = document.getElementById('addClientBtn');
    const addClientModal = document.getElementById('addClientModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addClientForm = document.getElementById('addClientForm');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    if (!clientsContainer) return;

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

            addClientToState(result.client);
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

async function initDashboardPage() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const liveClock = document.getElementById('liveClock');
    const dashboardPanel = document.getElementById('dashboardContent');
    if (!dashboardPanel) return;

    const user = getCurrentUser();
    if (user && welcomeMessage) {
        const firstName = user.fullName.split(' ')[0];
        welcomeMessage.textContent = `Welcome back, ${firstName}!`;
    }

    if (liveClock) {
        const tick = () => {
            const now = new Date();
            liveClock.textContent = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        };
        tick();
        setInterval(tick, 1000);
    }

    try {
        const clients = await ensureClientsLoaded();
        const stats = computeDashboardStats(clients);
        const formattedRevenue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(stats.wonRevenue);

        dashboardPanel.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                <h4 style="color: var(--text-secondary);">Total Clients</h4>
                <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${stats.totalClients}</p>
            </div>
            <div style="padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                <h4 style="color: var(--text-secondary);">Active Deals</h4>
                <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${stats.activeDeals}</p>
            </div>
            <div style="padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                <h4 style="color: var(--text-secondary);">Won Revenue</h4>
                <p style="font-size: 1.5rem; font-weight: bold; color: var(--success-color);">${formattedRevenue}</p>
            </div>
            <div style="padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                <h4 style="color: var(--text-secondary);">New This Week</h4>
                <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${stats.newThisWeek}</p>
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3>Pipeline Overview</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                Lead: ${stats.pipeline.Lead} | Contacted: ${stats.pipeline.Contacted} | Won: ${stats.pipeline.Won} | Lost: ${stats.pipeline.Lost}
            </p>
        </div>

        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3>Recent Clients</h3>
                <a href="clients.html" style="font-size: 0.9rem;">View all clients &rarr;</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${
                    stats.recentClients.length > 0
                        ? stats.recentClients
                              .map(
                                  (c) => `
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 4px;">
                        <span><strong>${c.name}</strong> (${c.company || 'No Company'})</span>
                        <span><span style="font-size: 0.8rem; padding: 2px 6px; border-radius: 10px; background: #eee; margin-right: 10px;">${c.status}</span> ${new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                `
                              )
                              .join('')
                        : '<p>No clients yet.</p>'
                }
            </div>
        </div>
    `;
    } catch {
        dashboardPanel.innerHTML =
            '<div style="color: var(--error-color);">Failed to load stats.</div>';
    }
}

function initProfilePage() {
    let currentUser = getCurrentUser();
    if (!currentUser) return;

    const profileInfoBlock = document.getElementById('profileInfoBlock');
    const editProfilePanel = document.getElementById('editProfilePanel');
    const changePasswordPanel = document.getElementById('changePasswordPanel');

    const renderProfileHeader = () => {
        const initials = currentUser.fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        profileInfoBlock.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">${initials}</div>
                <div>
                    <h2>${currentUser.fullName}</h2>
                    <p class="profile-meta">${currentUser.email} • ${currentUser.company || ''}</p>
                    <p class="profile-since">Member since ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        `;
    };
    renderProfileHeader();

    editProfilePanel.innerHTML = `
        <h3>Edit Profile</h3>
        <form id="editProfileForm" class="profile-form" novalidate>
            <div class="form-group">
                <input type="text" id="editName" value="${currentUser.fullName}" placeholder="Full Name" required>
            </div>
            <div class="form-group">
                <input type="text" id="editCompany" value="${currentUser.company || ''}" placeholder="Company">
            </div>
            <button type="submit" class="btn-primary">Save Changes</button>
        </form>
    `;

    document.getElementById('editProfileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(e.target);

        const result = updateUserProfile({
            fullName: document.getElementById('editName').value,
            company: document.getElementById('editCompany').value
        });

        if (!result.ok) {
            applyFieldErrors(result.errors);
            return;
        }

        currentUser = result.user;
        renderProfileHeader();
        showToast('Profile updated ✓', 'success');
    });

    changePasswordPanel.innerHTML = `
        <h3>Change Password</h3>
        <form id="changePasswordForm" class="profile-form" novalidate>
            <div class="form-group">
                <input type="password" id="currentPass" placeholder="Current Password" required>
            </div>
            <div class="form-group">
                <input type="password" id="newPass" placeholder="New Password" required>
            </div>
            <div class="form-group">
                <input type="password" id="confirmNewPass" placeholder="Confirm New Password" required>
            </div>
            <button type="submit" class="btn-primary">Change Password</button>
        </form>
    `;

    document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(e.target);

        const result = changeUserPassword({
            currentPassword: document.getElementById('currentPass').value,
            newPassword: document.getElementById('newPass').value,
            confirmPassword: document.getElementById('confirmNewPass').value
        });

        if (!result.ok) {
            applyFieldErrors(result.errors);
            return;
        }

        currentUser = getCurrentUser();
        e.target.reset();
        showToast('Password changed ✓', 'success');
    });

    document.getElementById('resetDataBtn')?.addEventListener('click', () => {
        if (
            confirm(
                'Are you sure you want to reset all CRM data? This will clear all clients and reload the default API data.'
            )
        ) {
            resetClientsData();
            window.location.href = 'clients.html';
        }
    });
}
