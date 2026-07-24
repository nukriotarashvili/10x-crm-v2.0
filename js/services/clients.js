import { showSkeletonLoader, debounce } from '../utils/dom.js';
import { downloadClientsCsv } from '../utils/csv.js';
import { api } from '../api/supabase.js';
import { validateNewClientFields } from '../utils/validation.js';

let clientsState = [];
let pagination = { page: 1, limit: 10, hasMore: false };

export const CLIENTS_PAGE_SIZE = 10;
export const KANBAN_STATUSES = ['Lead', 'Contacted', 'Won', 'Lost'];

export const getClientsState = () => clientsState;

export const getHasMoreClients = () => pagination.hasMore;

export const loadClients = async (container, options = {}) => {
    const page = options.page ?? 1;
    const limit = options.limit ?? CLIENTS_PAGE_SIZE;
    const append = options.append ?? false;

    if (container && !append) {
        showSkeletonLoader(container);
    }

    try {
        const { clients, hasMore } = await api.getClients({ page, limit });

        if (append) {
            const existingIds = new Set(clientsState.map((c) => c.id.toString()));
            const uniqueNew = clients.filter((c) => !existingIds.has(c.id.toString()));
            clientsState = [...clientsState, ...uniqueNew];
        } else {
            clientsState = clients;
        }

        pagination = { page, limit, hasMore };
        return clientsState;
    } catch (error) {
        if (container && !append) {
            container.innerHTML =
                '<div class="error-state">Failed to load clients from database.</div>';
        }
        if (!append) {
            clientsState = [];
            pagination = { page: 1, limit, hasMore: false };
        }
        return [];
    }
};

export const loadMoreClients = async () => {
    if (!pagination.hasMore) {
        return { clients: clientsState, added: [] };
    }

    const nextPage = pagination.page + 1;
    const beforeCount = clientsState.length;
    await loadClients(null, {
        page: nextPage,
        limit: pagination.limit,
        append: true
    });
    const added = clientsState.slice(beforeCount);
    return { clients: clientsState, added };
};

export const ensureClientsLoaded = async () => {
    if (clientsState.length) {
        return clientsState;
    }
    return loadClients(null, { page: 1, limit: 200 });
};

export const addClientToState = async (newClientData) => {
    const savedClient = await api.addClient(newClientData);
    clientsState.unshift(savedClient);
    return savedClient;
};

export const deleteClientFromState = async (clientId) => {
    await api.deleteClient(clientId);
    clientsState = clientsState.filter((c) => c.id.toString() !== clientId.toString());
};

export const setClientStatusLocal = (clientId, newStatus) => {
    const client = clientsState.find((c) => c.id.toString() === clientId.toString());
    if (!client) {
        return null;
    }

    const previousStatus = client.status;
    if (previousStatus === newStatus) {
        return { client, previousStatus, changed: false };
    }

    client.status = newStatus;
    return { client, previousStatus, changed: true };
};

/** Persist status to Supabase (call after optimistic UI update). */
export const persistClientStatus = (clientId, newStatus) =>
    api.updateClient(clientId, { status: newStatus });

export const updateClientStatusInState = async (clientId, newStatus) => {
    const result = setClientStatusLocal(clientId, newStatus);
    if (!result || !result.changed) {
        return { ok: true, client: result?.client };
    }

    try {
        await api.updateClient(clientId, { status: newStatus });
        return { ok: true, client: result.client };
    } catch (error) {
        result.client.status = result.previousStatus;
        throw error;
    }
};

export const resetClientsData = async () => {
    const ids = clientsState.map((c) => c.id);
    for (const id of ids) {
        await api.deleteClient(id);
    }
    clientsState = [];
    pagination = { page: 1, limit: CLIENTS_PAGE_SIZE, hasMore: false };
};

export const exportClientsToCsv = (clients) => {
    downloadClientsCsv(clients);
};

/**
 * Debounced search wiring for the clients page (default 300ms).
 * Waits until the user pauses typing before running the filter callback.
 */
export const attachDebouncedClientSearch = (inputEl, onSearch, delayMs = 300) => {
    if (!inputEl) return;
    inputEl.addEventListener('input', debounce(onSearch, delayMs));
};

export const validateClientForm = (formData) =>
    validateNewClientFields({
        ...formData,
        existingEmails: clientsState.map((c) => c.email.toLowerCase())
    });

export const createClient = async (formData) => {
    const { name, email, phone, company, dealValue, status } = formData;
    const errors = validateClientForm({ name, email, phone, dealValue });

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    try {
        const client = await addClientToState({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            company: company.trim(),
            dealValue,
            status
        });
        return { ok: true, client };
    } catch (error) {
        const message = error?.message ?? '';
        if (/logged in/i.test(message)) {
            return { ok: false, message: 'შესვლა საჭიროა — გაიარე login და სცადე თავიდან.' };
        }
        return { ok: false, message: message || 'Could not save client to database' };
    }
};

export const removeClient = async (clientId) => {
    await deleteClientFromState(clientId);
};

export const filterAndSortClients = (clients, { searchTerm, activeFilter, sortValue }) => {
    let filtered = [...clients];

    if (activeFilter !== 'All') {
        filtered = filtered.filter((client) => client.status === activeFilter);
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
            (client) =>
                client.name.toLowerCase().includes(term) ||
                client.email.toLowerCase().includes(term) ||
                (client.company && client.company.toLowerCase().includes(term))
        );
    }

    if (sortValue === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortValue === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === 'value') {
        filtered.sort((a, b) => b.dealValue - a.dealValue);
    }

    return filtered;
};
