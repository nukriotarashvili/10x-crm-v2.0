import {
    changeUserPassword,
    getCurrentUser,
    updateUserProfile
} from './auth.js';
import { resetClientsData } from './clients.js';
import { showToast, showError, clearErrors } from '../utils/dom.js';

export const initProfile = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    renderProfileInfo(currentUser);
    setupEditProfile(currentUser);
    setupChangePassword();
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

const setupEditProfile = (currentUser) => {
    const form = document.getElementById('editProfileForm');
    if (!form) return;

    document.getElementById('editName').value = currentUser.fullName;
    document.getElementById('editCompany').value = currentUser.company || '';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(form);

        const nameInput = document.getElementById('editName');
        const companyInput = document.getElementById('editCompany');

        const result = await updateUserProfile({
            fullName: nameInput.value,
            company: companyInput.value
        });

        if (!result.ok) {
            if (result.errors?.editName) {
                showError(nameInput, result.errors.editName);
            }
            return;
        }

        renderProfileInfo(result.user);
        showToast('Profile updated ✓', 'success');
    });
};

const setupChangePassword = () => {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(form);

        const currentInput = document.getElementById('currentPass');
        const newInput = document.getElementById('newPass');
        const confirmInput = document.getElementById('confirmNewPass');

        const result = await changeUserPassword({
            currentPassword: currentInput.value,
            newPassword: newInput.value,
            confirmPassword: confirmInput.value
        });

        if (!result.ok) {
            if (result.errors) {
                Object.entries(result.errors).forEach(([id, message]) => {
                    showError(document.getElementById(id), message);
                });
            }
            return;
        }

        form.reset();
        showToast('Password changed ✓', 'success');
    });
};

const setupResetData = () => {
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (confirm('Reset CRM Data? This will clear all clients.')) {
                await resetClientsData();
                window.location.href = 'clients.html';
            }
        });
    }
};
