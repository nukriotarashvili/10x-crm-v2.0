import {
    getSession,
    getUsers,
    saveUsers,
    setSession
} from '../api/supabase.js';
import {
    validateLoginFields,
    validatePasswordChange,
    validateProfileName,
    validateSignupFields
} from '../utils/validation.js';

export const isPublicPage = (path) =>
    path.endsWith('index.html') ||
    path.endsWith('signup.html') ||
    path === '/' ||
    path.endsWith('10x-crm/');

export const checkAuth = () => {
    const session = localStorage.getItem('crm_session');
    const path = window.location.pathname;
    const publicPage = isPublicPage(path);

    if (!session && !publicPage) {
        window.location.href = 'index.html';
        return false;
    }
    if (session && publicPage) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
};

export const handleLogout = () => {
    localStorage.removeItem('crm_session');
    window.location.href = 'index.html';
};

export const logout = handleLogout;

export const initTheme = () => {
    const currentTheme = localStorage.getItem('crm_theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
};

export const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
    const newTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('crm_theme', newTheme);
};

export const registerUser = ({ fullName, email, company, password, confirmPassword }) => {
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const errors = validateSignupFields({
        name: fullName,
        email: normalizedEmail,
        password,
        confirmPassword,
        existingEmails: users.map((u) => u.email)
    });

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    const newUser = {
        id: Date.now(),
        fullName: fullName.trim(),
        email: normalizedEmail,
        company: company.trim(),
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    return { ok: true, user: newUser };
};

export const validateSignup = (formData) => {
    const users = getUsers();
    return validateSignupFields({
        ...formData,
        existingEmails: users.map((u) => u.email)
    });
};

export const validateLogin = (formData) => validateLoginFields(formData);

export const loginUser = ({ email, password }) => {
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email === normalizedEmail && u.password === password);

    if (!user) {
        return { ok: false };
    }

    setSession({
        userId: user.id,
        email: user.email,
        loginAt: new Date().toISOString()
    });

    return { ok: true, user };
};

export const getCurrentUser = () => {
    const session = getSession();
    if (!session) return null;
    const users = getUsers();
    return users.find((u) => u.email === session.email) ?? null;
};

export const updateUserProfile = ({ fullName, company }) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return { ok: false };

    const nameError = validateProfileName(fullName);
    if (nameError) {
        return { ok: false, errors: { editName: nameError } };
    }

    const users = getUsers();
    const updated = {
        ...currentUser,
        fullName: fullName.trim(),
        company: company.trim()
    };
    const index = users.findIndex((u) => u.id === currentUser.id);
    users[index] = updated;
    saveUsers(users);
    return { ok: true, user: updated };
};

export const changeUserPassword = ({ currentPassword, newPassword, confirmPassword }) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return { ok: false };

    const errors = validatePasswordChange({
        currentPassword,
        storedPassword: currentUser.password,
        newPassword,
        confirmPassword
    });

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    const users = getUsers();
    const updated = { ...currentUser, password: newPassword };
    const index = users.findIndex((u) => u.id === currentUser.id);
    users[index] = updated;
    saveUsers(users);
    return { ok: true };
};
