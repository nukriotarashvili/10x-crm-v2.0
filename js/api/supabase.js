// js/api/supabase.js

// ვტვირთავთ Supabase-ის კლიენტს პირდაპირ CDN-დან ES6 მოდულის სახით
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const api = {
    // კლიენტების წამოღება ბაზიდან (უახლესები თავში)
    getClients: async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }
        
        // მონაცემების ფორმატირება ჩვენი State-ისთვის
        return data.map(client => ({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
            status: client.status,
            dealValue: client.deal_value ?? client.dealValue,
            createdAt: client.created_at,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random` // დინამიური ავატარი
        }));
    },

    // ახალი კლიენტის დამატება
    addClient: async (clientData) => {
        const { data, error } = await supabase
            .from('clients')
            .insert([{
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                company: clientData.company,
                status: clientData.status,
                deal_value: clientData.dealValue
            }])
            .select();
            
        if (error) {
            console.error('Error adding client:', error);
            throw error;
        }
        return data.map((client) => ({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
            status: client.status,
            dealValue: client.deal_value ?? client.dealValue,
            createdAt: client.created_at,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random`
        }))[0];
    },

    // კლიენტის წაშლა
    deleteClient: async (id) => {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);
            
        if (error) {
            console.error('Error deleting client:', error);
            throw error;
        }
        return true;
    }
};

const USERS_KEY = 'crm_users';
const SESSION_KEY = 'crm_session';

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