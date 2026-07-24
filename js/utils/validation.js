export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASS_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

export const isValidEmail = (email) => EMAIL_REGEX.test(email);

export const isValidPassword = (password) => PASS_REGEX.test(password);

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
        errors.signupPassword =
            'Password must be at least 8 characters and contain a letter and a number';
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
        errors.newPass = 'Password must be at least 8 characters and contain a letter and a number';
    } else if (newPassword === currentPassword) {
        errors.newPass = 'New password must be different from the current one';
    }
    if (newPassword !== confirmPassword) {
        errors.confirmNewPass = 'Passwords do not match';
    }

    return errors;
};
