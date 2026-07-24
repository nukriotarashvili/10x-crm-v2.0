import {
    applyFieldErrors,
    attachLiveInputErrorClear,
    clearErrors,
    initPasswordStrengthMeter,
    showGenericFormError,
    showToast
} from './utils/dom.js';
import {
    checkAuth,
    initTheme,
    isLoginPath,
    isSignupPath,
    loginUser,
    registerUser,
    toggleTheme,
    validateLogin,
    validateSignup
} from './services/auth.js';
import { isValidPassword } from './utils/validation.js';

export function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm || loginForm.dataset.bound === 'true') return;
    loginForm.dataset.bound = 'true';

    attachLiveInputErrorClear(loginForm);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearErrors(loginForm);
        loginForm.querySelector('.generic-error')?.remove();

        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const errors = validateLogin({ email, password });

        if (Object.keys(errors).length > 0) {
            applyFieldErrors(errors);
            return;
        }

        const result = await loginUser({ email, password });
        if (result.ok) {
            window.location.href = 'dashboard.html';
        } else {
            showGenericFormError(loginForm, result.message || 'Invalid email or password');
        }
    });
}

export function initSignupPage() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm || signupForm.dataset.bound === 'true') return;
    signupForm.dataset.bound = 'true';

    const passwordInput = document.getElementById('signupPassword');
    const confirmInput = document.getElementById('signupConfirmPassword');
    const submitBtn = document.getElementById('signupSubmitBtn');
    const strengthRoot = document.getElementById('signupPasswordStrength');

    attachLiveInputErrorClear(signupForm);
    const refreshStrength = initPasswordStrengthMeter(passwordInput, strengthRoot);

    const updateSubmitState = () => {
        if (!submitBtn) return;
        const password = passwordInput?.value ?? '';
        const confirm = confirmInput?.value ?? '';
        submitBtn.disabled = !(
            isValidPassword(password) &&
            password.length > 0 &&
            password === confirm
        );
    };

    passwordInput?.addEventListener('input', () => {
        refreshStrength?.();
        updateSubmitState();
    });
    confirmInput?.addEventListener('input', updateSubmitState);
    updateSubmitState();

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearErrors(signupForm);
        signupForm.querySelector('.generic-error')?.remove();

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
            updateSubmitState();
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account…';
        }

        let result;
        try {
            result = await registerUser({
                fullName,
                email,
                company,
                password,
                confirmPassword
            });
        } catch (error) {
            console.error('Registration error:', error);
            showGenericFormError(signupForm, 'Registration failed. Please try again.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create account';
            }
            updateSubmitState();
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create account';
        }

        if (!result.ok) {
            if (result.errors) {
                applyFieldErrors(result.errors);
            }
            if (result.message) {
                showGenericFormError(signupForm, result.message);
            }
            updateSubmitState();
            return;
        }

        if (result.needsEmailConfirmation) {
            showToast('Account created! Confirm your email, then log in.', 'success');
        } else {
            showToast('Account created successfully! Please log in.', 'success');
        }

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    });
}

export async function bootAuthPages() {
    initTheme();

    if (isSignupPath()) {
        initSignupPage();
        document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
        return;
    }

    if (isLoginPath()) {
        initLoginPage();
        document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
        try {
            await checkAuth();
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
}

function start() {
    void bootAuthPages();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}

window.showToast = showToast;
