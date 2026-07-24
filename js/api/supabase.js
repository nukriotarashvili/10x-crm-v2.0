// js/api/supabase.js

// სატესტო პერიოდში DummyJSON-ს ვტოვებთ, მაგრამ სტრუქტურა მზადაა Supabase REST API-სთვის
const BASE_URL = 'https://dummyjson.com'; 

/**
 * უნივერსალური fetch ფუნქცია შეცდომების მართვით
 */
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Network or Parse Error:', error);
        throw error;
    }
}

export const api = {
    // კლიენტების წამოღება
    getClients: async () => {
        const data = await fetchAPI('/users?limit=30');
        // ვაფორმატებთ მონაცემებს ჩვენი CRM-ის სტრუქტურაზე
        return data.users.map((user) => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone,
            company: user.company?.name ?? '',
            image: user.image,
            status: 'Lead',
            dealValue: Math.floor(Math.random() * 9500) + 500,
            notes: [],
            createdAt: new Date().toISOString()
        }));
    },

    // კლიენტის დამატება
    addClient: async (clientData) => {
        return await fetchAPI('/users/add', {
            method: 'POST',
            body: JSON.stringify(clientData)
        });
    },

    // კლიენტის წაშლა
    deleteClient: async (id) => {
        return await fetchAPI(`/users/${id}`, {
            method: 'DELETE'
        });
    }
    
    // მომავალში აქ დაემატება logAuditAction ფუნქცია
};

const USERS_KEY = 'crm_users';
const SESSION_KEY = 'crm_session';
const CLIENTS_KEY = 'crm_clients';

const readJson = (key, fallback) => {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const getUsers = () => readJson(USERS_KEY, []);

export const saveUsers = (users) => writeJson(USERS_KEY, users);

export const getSession = () => readJson(SESSION_KEY, null);

export const setSession = (session) => writeJson(SESSION_KEY, session);

export const clearSession = () => localStorage.removeItem(SESSION_KEY);

export const getClients = () => readJson(CLIENTS_KEY, null);

export const saveClients = (clients) => writeJson(CLIENTS_KEY, clients);

export const clearClients = () => localStorage.removeItem(CLIENTS_KEY);

export const mapRemoteUserToClient = (user) => ({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    phone: user.phone,
    email: user.email,
    company: user.company?.name ?? '',
    image: user.image,
    status: 'Lead',
    dealValue: Math.floor(Math.random() * 9500) + 500,
    notes: [],
    createdAt: new Date().toISOString()
});

export const fetchRemoteClients = async (limit = 30) => {
    const data = await fetchAPI(`/users?limit=${limit}`);
    return data.users.map(mapRemoteUserToClient);
};

export const postRemoteClient = (clientPayload) => api.addClient(clientPayload);

export const deleteRemoteClient = (id) => api.deleteClient(id);