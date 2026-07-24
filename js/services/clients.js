import { showSkeletonLoader } from '../utils/dom.js';
import { api } from '../api/supabase.js';
import { validateNewClientFields } from '../utils/validation.js';

let clientsState = [];

export const getClientsState = () => clientsState;

export const loadClients = async (container) => {
    if (container) {
        showSkeletonLoader(container);
    }

    try {
        clientsState = await api.getClients();
        return clientsState;
    } catch (error) {
        if (container) {
            container.innerHTML =
                '<div style="color: var(--error-color); text-align: center;">Failed to load clients from database.</div>';
        }
        clientsState = [];
        return [];
    }
};

export const ensureClientsLoaded = async () => {
    if (clientsState.length) {
        return clientsState;
    }
    return loadClients(null);
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

export const resetClientsData = async () => {
    const ids = clientsState.map((c) => c.id);
    for (const id of ids) {
        await api.deleteClient(id);
    }
    clientsState = [];
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
    } catch {
        return { ok: false };
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
