export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_SYMBOL_REGEX = /[!@#$%&*]/;

export const PASSWORD_RULES = [
    {
        id: 'length',
        label: 'At least 8 characters',
        test: (password) => password.length >= 8
    },
    {
        id: 'uppercase',
        label: 'At least one uppercase letter (A–Z)',
        test: (password) => /[A-Z]/.test(password)
    },
    {
        id: 'symbol',
        label: 'At least one symbol (!@#$%&*)',
        test: (password) => PASSWORD_SYMBOL_REGEX.test(password)
    }
];

export const getPasswordRuleStates = (password) =>
    PASSWORD_RULES.map((rule) => ({
        ...rule,
        met: rule.test(password)
    }));

export const getPasswordStrengthPercent = (password) => {
    if (!password) return 0;
    const metCount = getPasswordRuleStates(password).filter((rule) => rule.met).length;
    return Math.round((metCount / PASSWORD_RULES.length) * 100);
};

export const isValidEmail = (email) => EMAIL_REGEX.test(email);

export const isValidPassword = (password) =>
    getPasswordRuleStates(password).every((rule) => rule.met);

export const getPasswordValidationMessage = () =>
    'Password must be at least 8 characters, include an uppercase letter, and a symbol (!@#$%&*).';

export const hasMinLength = (value, min) => value.trim().length >= min;

export const validateSignupFields = ({ name, email, password, confirmPassword, existingEmails }) => {
    const errors = {};

    if (!hasMinLength(name, 3)) {
        errors.signupName = 'Full name must be at least 3 characters';
    }
    if (!isValidEmail(email)) {
        errors.signupEmail = 'Please enter a valid email address';
    } else if (existingEmails.includes(email)) {
        errors.signupEmail = 'An account with this email already exists';
    }
    if (!isValidPassword(password)) {
        errors.signupPassword = getPasswordValidationMessage();
    }
    if (password !== confirmPassword || password === '') {
        errors.signupConfirmPassword = 'Passwords do not match';
    }

    return errors;
};

export const validateLoginFields = ({ email, password }) => {
    const errors = {};
    if (!email) errors.loginEmail = 'Email is required';
    if (!password) errors.loginPassword = 'Password is required';
    return errors;
};

export const validateNewClientFields = ({ name, email, phone, dealValue, existingEmails }) => {
    const errors = {};

    if (!hasMinLength(name, 3)) {
        errors.clientName = 'Name must be at least 3 characters';
    }
    if (!isValidEmail(email)) {
        errors.clientEmail = 'Please enter a valid email address';
    } else if (existingEmails.includes(email.toLowerCase())) {
        errors.clientEmail = 'A client with this email already exists';
    }
    if (phone.length > 0 && phone.length < 6) {
        errors.clientPhone = 'Phone number looks too short';
    }
    if (Number.isNaN(dealValue) || dealValue <= 0) {
        errors.clientDealValue = 'Deal value must be a positive number';
    }

    return errors;
};

export const validateProfileName = (name) =>
    hasMinLength(name, 3) ? null : 'Full name must be at least 3 characters';

export const validatePasswordChange = ({ currentPassword, storedPassword, newPassword, confirmPassword }) => {
    const errors = {};

    if (currentPassword !== storedPassword) {
        errors.currentPass = 'Current password is incorrect';
    }
    if (!isValidPassword(newPassword)) {
        errors.newPass = getPasswordValidationMessage();
    } else if (newPassword === currentPassword) {
        errors.newPass = 'New password must be different from the current one';
    }
    if (newPassword !== confirmPassword) {
        errors.confirmNewPass = 'Passwords do not match';
    }

    return errors;
};
