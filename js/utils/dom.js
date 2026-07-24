import { getPasswordRuleStates, getPasswordStrengthPercent } from './validation.js';

export const showToast = (message, type = 'success') => {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        document.body.appendChild(toast);
    }
    toast.classList.remove('hide', 'show');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
    }, 3000);
};

export const showError = (input, message) => {
    if (!input) return;
    input.classList.add('input-error');
    const group = input.closest('.form-group');
    let errorDisplay = group
        ? group.querySelector(':scope > .error-text')
        : null;

    if (!errorDisplay) {
        errorDisplay = document.createElement('span');
        errorDisplay.className = 'error-text';
        if (group) {
            group.appendChild(errorDisplay);
        } else {
            input.parentNode.insertBefore(errorDisplay, input.nextSibling);
        }
    }
    errorDisplay.textContent = message;
};

export const clearErrors = (form) => {
    if (!form) return;
    form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
    form.querySelectorAll('.error-text').forEach((el) => el.remove());
};

export const applyFieldErrors = (errors) => {
    Object.entries(errors).forEach(([inputId, message]) => {
        showError(document.getElementById(inputId), message);
    });
};

export const attachLiveInputErrorClear = (root = document) => {
    root.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', function () {
            this.classList.remove('input-error');
            const group = this.closest('.form-group');
            const errorEl = group
                ? group.querySelector(':scope > .error-text')
                : this.nextElementSibling;
            if (errorEl && errorEl.classList.contains('error-text')) {
                errorEl.remove();
            }
        });
    });
};

export const initPasswordStrengthMeter = (passwordInput, meterRoot) => {
    if (!passwordInput || !meterRoot) return () => {};

    const fill = meterRoot.querySelector('.password-strength__fill');
    const label = meterRoot.querySelector('.password-strength__label');
    const ruleItems = meterRoot.querySelectorAll('[data-rule]');

    const update = () => {
        const password = passwordInput.value;
        const percent = getPasswordStrengthPercent(password);
        const rules = getPasswordRuleStates(password);

        if (fill) {
            fill.style.width = `${percent}%`;
            fill.dataset.level =
                percent === 100 ? 'strong' : percent >= 34 ? 'medium' : percent > 0 ? 'weak' : 'empty';
        }

        if (label) {
            if (percent === 0) {
                label.textContent = 'Password strength';
            } else if (percent < 100) {
                label.textContent = `Password strength · ${percent}%`;
            } else {
                label.textContent = 'Password strength · Strong';
            }
        }

        const track = meterRoot.querySelector('.password-strength__track');
        if (track) {
            track.setAttribute('aria-valuenow', String(percent));
        }

        ruleItems.forEach((item) => {
            const ruleId = item.getAttribute('data-rule');
            const met = rules.find((rule) => rule.id === ruleId)?.met;
            item.classList.toggle('is-met', Boolean(met));
        });

        meterRoot.classList.toggle('is-active', password.length > 0);
    };

    passwordInput.addEventListener('input', update);
    update();

    return update;
};

export const showGenericFormError = (form, message) => {
    if (!form) return;
    let genError = form.querySelector('.generic-error');
    if (!genError) {
        genError = document.createElement('div');
        genError.className = 'error-text generic-error';
        genError.style.textAlign = 'center';
        genError.style.marginBottom = '15px';
        form.insertBefore(genError, form.querySelector('button'));
    }
    genError.textContent = message;
};

/**
 * Debounce utility — delays `fn` until `wait` ms pass without another invocation.
 * Used on client search so filtering runs after the user pauses typing, not every keypress.
 */
export const debounce = (fn, wait = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn(...args);
        }, wait);
    };
};

export const showSkeletonLoader = (container, count = 5) => {
    if (!container) return;
    container.innerHTML = Array(count)
        .fill(0)
        .map(
            () => `
        <div class="client-card skeleton-card" aria-hidden="true">
            <div class="skeleton skeleton-card__avatar"></div>
            <div class="info">
                <div class="skeleton skeleton-card__line skeleton-card__line--title"></div>
                <div class="skeleton skeleton-card__line skeleton-card__line--subtitle"></div>
                <div class="skeleton skeleton-card__line skeleton-card__line--meta"></div>
            </div>
            <div class="skeleton skeleton-card__badge"></div>
        </div>
    `
        )
        .join('');
};
