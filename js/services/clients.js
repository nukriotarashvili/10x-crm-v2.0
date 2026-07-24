import { showSkeletonLoader } from '../utils/dom.js';
import { api } from '../api/supabase.js';
import { validateNewClientFields } from '../utils/validation.js';

let clientsState = [];

export const getClientsState = () => clientsState;

const saveState = () => {
    localStorage.setItem('crm_clients', JSON.stringify(clientsState));
};

export const loadClients = async (container) => {
    if (container) {
        showSkeletonLoader(container);
    }

    const storedClients = localStorage.getItem('crm_clients');
    if (storedClients) {
        clientsState = JSON.parse(storedClients);
        return clientsState;
    }

    try {
        clientsState = await api.getClients();
        saveState();
        return clientsState;
    } catch {
        if (container) {
            container.innerHTML =
                '<div class="error-state">Failed to load clients. Check your connection and try again.</div>';
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

export const addClientToState = (newClient) => {
    clientsState.unshift(newClient);
    saveState();
};

export const deleteClientFromState = (clientId) => {
    clientsState = clientsState.filter((c) => c.id.toString() !== clientId.toString());
    saveState();
};

export const resetClientsData = () => {
    localStorage.removeItem('crm_clients');
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

    const newClient = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim(),
        dealValue,
        status,
        notes: [],
        createdAt: new Date().toISOString(),
        image: 'https://dummyjson.com/icon/new/128'
    };

    const data = await api.addClient(newClient);
    newClient.id = data.id || Date.now();

    return { ok: true, client: newClient };
};

export const removeClient = async (clientId) => {
    await api.deleteClient(clientId);
    deleteClientFromState(clientId);
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
