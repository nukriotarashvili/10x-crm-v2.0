import { showToast, showError, clearErrors } from '../utils/dom.js';

export const initProfile = () => {
    const session = JSON.parse(localStorage.getItem('crm_session'));
    if (!session) return;

    let users = JSON.parse(localStorage.getItem('crm_users')) || [];
    let currentUser = users.find((u) => u.email === session.email);

    if (!currentUser) return;

    renderProfileInfo(currentUser);
    setupEditProfile(currentUser, users);
    setupChangePassword(currentUser, users);
    setupResetData();
};

const renderProfileInfo = (user) => {
    const profileInfoBlock = document.getElementById('profileInfoBlock');
    if (!profileInfoBlock) return;

    const initials = user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    profileInfoBlock.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1.5rem;">
            <div style="width: 60px; height: 60px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold;">
                ${initials}
            </div>
            <div>
                <h2>${user.fullName}</h2>
                <p style="color: var(--text-secondary);">${user.email} • ${user.company || ''}</p>
            </div>
        </div>
    `;
};

const setupEditProfile = (currentUser, users) => {
    const form = document.getElementById('editProfileForm');
    if (!form) return;

    document.getElementById('editName').value = currentUser.fullName;
    document.getElementById('editCompany').value = currentUser.company || '';

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(form);

        const nameInput = document.getElementById('editName');
        const companyInput = document.getElementById('editCompany');

        if (nameInput.value.trim().length < 3) {
            showError(nameInput, 'Full name must be at least 3 characters');
            return;
        }

        currentUser.fullName = nameInput.value.trim();
        currentUser.company = companyInput.value.trim();

        const userIndex = users.findIndex((u) => u.id === currentUser.id);
        users[userIndex] = currentUser;
        localStorage.setItem('crm_users', JSON.stringify(users));

        renderProfileInfo(currentUser);
        showToast('Profile updated ✓', 'success');
    });
};

const setupChangePassword = (currentUser, users) => {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(form);

        const currentInput = document.getElementById('currentPass');
        const newInput = document.getElementById('newPass');
        const confirmInput = document.getElementById('confirmNewPass');

        let isValid = true;

        if (currentInput.value !== currentUser.password) {
            showError(currentInput, 'Current password is incorrect');
            isValid = false;
        }

        const passRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
        if (!passRegex.test(newInput.value)) {
            showError(newInput, 'Password must be at least 8 characters and contain a letter and a number');
            isValid = false;
        }

        if (newInput.value !== confirmInput.value) {
            showError(confirmInput, 'Passwords do not match');
            isValid = false;
        }

        if (isValid) {
            currentUser.password = newInput.value;
            const userIndex = users.findIndex((u) => u.id === currentUser.id);
            users[userIndex] = currentUser;
            localStorage.setItem('crm_users', JSON.stringify(users));

            form.reset();
            showToast('Password changed ✓', 'success');
        }
    });
};

const setupResetData = () => {
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset CRM Data? This will clear all clients.')) {
                localStorage.removeItem('crm_clients');
                window.location.href = 'clients.html';
            }
        });
    }
};
