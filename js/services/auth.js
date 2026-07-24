import {
    isValidPassword,
    validateLoginFields,
    validateProfileName,
    validateSignupFields,
    getPasswordValidationMessage
} from '../utils/validation.js';

let apiModulePromise;

const getApiModule = () => {
    if (!apiModulePromise) {
        apiModulePromise = import('../api/supabase.js');
    }
    return apiModulePromise;
};

const isAuthRateLimited = (error) =>
    error?.status === 429 ||
    /too many requests|rate limit|over_request_rate_limit/i.test(String(error?.message ?? ''));

const rateLimitMessage =
    'ძალიან ბევრი მცდელობა (Supabase rate limit). დაელოდე 1–2 წუთს და სცადე თავიდან — ნუ დააჭერ ღილაკს რამდენჯერმე.';

/** Maps Supabase Auth errors (400 on /token?grant_type=password) to clear UI text. */
const mapLoginAuthError = (error) => {
    const message = String(error?.message ?? '');
    const code = String(error?.code ?? '');

    if (/invalid api key/i.test(message)) {
        return null;
    }
    if (isAuthRateLimited(error)) {
        return rateLimitMessage;
    }
    if (
        code === 'email_not_confirmed' ||
        /email not confirmed|confirm your email/i.test(message)
    ) {
        return 'ელფოსტა ჯერ არ არის დადასტურებული. გახსენი confirmation link ფოსტიდან, ან dev-ისთვის: Supabase → Authentication → Providers → Email → გამორთე «Confirm email».';
    }
    if (
        code === 'invalid_credentials' ||
        /invalid login credentials|invalid grant|wrong password/i.test(message)
    ) {
        return 'ელფოსტა ან პაროლი არასწორია. გამოიყენე იგივე პაროლი, რაც Sign up-ზე შეგიყვანია.';
    }
    if (/user banned|ban/i.test(message)) {
        return 'ეს ანგარიში დაბლოკილია.';
    }

    return message || 'შესვლა ვერ მოხერხდა. შეამოწმე ელფოსტა და პაროლი.';
};

export const isPublicPage = (path) => {
    const normalized = path.toLowerCase();
    const file = normalized.split('/').pop() || '';
    return (
        file === '' ||
        file === 'index.html' ||
        file === 'signup.html' ||
        normalized === '/' ||
        normalized.endsWith('/10x-crm/') ||
        normalized.endsWith('/10x-crm-v2.0/')
    );
};

export const isSignupPath = (path = window.location.pathname) => {
    const normalized = path.toLowerCase();
    const file = normalized.split('/').pop() || '';
    return file === 'signup.html' || file === 'signup' || normalized.includes('signup');
};

export const isLoginPath = (path = window.location.pathname) => {
    const file = path.toLowerCase().split('/').pop() || '';
    return file === '' || file === 'index.html';
};

export const checkAuth = async () => {
    if (isSignupPath()) {
        return true;
    }

    const { isSupabaseConfigured, api } = await getApiModule();

    if (!isSupabaseConfigured()) {
        return true;
    }

    const path = window.location.pathname;
    const publicPage = isPublicPage(path);

    let session = null;
    try {
        session = await api.getSession();
    } catch (error) {
        console.error('Session check failed:', error);
        return publicPage;
    }

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

export const handleLogout = async () => {
    const { isSupabaseConfigured, api } = await getApiModule();
    if (isSupabaseConfigured()) {
        await api.signOut();
    }
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

export const registerUser = async ({
    fullName,
    email,
    company,
    password,
    confirmPassword
}) => {
    const normalizedEmail = email.trim().toLowerCase();
    const errors = validateSignupFields({
        name: fullName,
        email: normalizedEmail,
        password,
        confirmPassword,
        existingEmails: []
    });

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    const { isSupabaseConfigured, api } = await getApiModule();

    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            message: 'Supabase is not configured. Copy js/config.example.js to js/config.js and set your anon key.'
        };
    }

    try {
        const data = await api.signUp({
            email: normalizedEmail,
            password,
            fullName: fullName.trim(),
            company: company.trim()
        });

        return {
            ok: true,
            user: data.user,
            session: data.session ?? null,
            needsEmailConfirmation: Boolean(data.user && !data.session)
        };
    } catch (error) {
        const message = error?.message ?? 'Registration failed';

        if (/already registered|already exists/i.test(message)) {
            return {
                ok: false,
                errors: { signupEmail: 'An account with this email already exists' }
            };
        }

        if (/invalid api key/i.test(message)) {
            const { getSupabaseConfigHint } = await getApiModule();
            return {
                ok: false,
                message: `Invalid API key — ${getSupabaseConfigHint()}`
            };
        }

        if (isAuthRateLimited(error)) {
            return { ok: false, message: rateLimitMessage };
        }

        return { ok: false, message };
    }
};

export const validateSignup = (formData) =>
    validateSignupFields({
        ...formData,
        existingEmails: []
    });

export const validateLogin = (formData) => validateLoginFields(formData);

export const loginUser = async ({ email, password }) => {
    const { isSupabaseConfigured, api } = await getApiModule();

    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            message: 'Supabase is not configured. Copy js/config.example.js to js/config.js and set your anon key.'
        };
    }

    try {
        await api.signIn({
            email: email.trim().toLowerCase(),
            password
        });
        return { ok: true };
    } catch (error) {
        if (/invalid api key/i.test(error?.message ?? '')) {
            const { getSupabaseConfigHint } = await getApiModule();
            return {
                ok: false,
                message: `Invalid API key — ${getSupabaseConfigHint()}`
            };
        }

        return {
            ok: false,
            message: mapLoginAuthError(error)
        };
    }
};

export const getCurrentUser = async () => {
    const { isSupabaseConfigured, api } = await getApiModule();
    if (!isSupabaseConfigured()) {
        return null;
    }
    return api.getProfile();
};

export const updateUserProfile = async ({ fullName, company }) => {
    const nameError = validateProfileName(fullName);
    if (nameError) {
        return { ok: false, errors: { editName: nameError } };
    }

    const { api } = await getApiModule();

    try {
        const user = await api.updateProfile({
            fullName: fullName.trim(),
            company: company.trim()
        });
        return { ok: true, user };
    } catch (error) {
        console.error('Profile update failed:', error);
        return {
            ok: false,
            message: error?.message ?? 'Could not save profile'
        };
    }
};

export const changeUserPassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    const user = await getCurrentUser();
    if (!user) {
        return { ok: false };
    }

    const errors = {};

    if (!isValidPassword(newPassword)) {
        errors.newPass = getPasswordValidationMessage();
    } else if (newPassword === currentPassword) {
        errors.newPass = 'New password must be different from the current one';
    }
    if (newPassword !== confirmPassword) {
        errors.confirmNewPass = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    const { api } = await getApiModule();

    try {
        await api.signIn({ email: user.email, password: currentPassword });
        await api.updatePassword(newPassword);
        return { ok: true };
    } catch {
        return {
            ok: false,
            errors: { currentPass: 'Current password is incorrect' }
        };
    }
};
