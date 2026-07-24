export const showToast = (message, type = 'success') => {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        document.body.appendChild(toast);
    }
    toast.className = `toast ${type} show`;
    toast.textContent = message;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

export const showError = (input, message) => {
    if (!input) return;
    input.classList.add('input-error');
    let errorDisplay = input.nextElementSibling;
    if (!errorDisplay || !errorDisplay.classList.contains('error-text')) {
        errorDisplay = document.createElement('span');
        errorDisplay.className = 'error-text';
        input.parentNode.insertBefore(errorDisplay, input.nextSibling);
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
            const next = this.nextElementSibling;
            if (next && next.classList.contains('error-text')) {
                next.remove();
            }
        });
    });
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

export const showSkeletonLoader = (container, count = 5) => {
    if (!container) return;
    container.innerHTML = Array(count)
        .fill(0)
        .map(
            () => `
        <div class="client-card skeleton-card" style="pointer-events: none;">
            <div class="skeleton" style="width: 50px; height: 50px; border-radius: 50%;"></div>
            <div class="info" style="width: 100%;">
                <div class="skeleton" style="height: 1.2rem; width: 40%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton" style="height: 0.9rem; width: 60%;"></div>
            </div>
        </div>
    `
        )
        .join('');
};
