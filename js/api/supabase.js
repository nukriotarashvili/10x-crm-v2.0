import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import {
    SUPABASE_URL as DEFAULT_SUPABASE_URL,
    SUPABASE_ANON_KEY as DEFAULT_SUPABASE_ANON_KEY
} from '../config.example.js';

let resolvedUrl = DEFAULT_SUPABASE_URL;
let resolvedKey = DEFAULT_SUPABASE_ANON_KEY;

try {
    const localConfig = await import('../config.js');
    if (localConfig.SUPABASE_URL) {
        resolvedUrl = localConfig.SUPABASE_URL;
    }
    if (
        localConfig.SUPABASE_ANON_KEY &&
        !String(localConfig.SUPABASE_ANON_KEY).includes('YOUR_SUPABASE')
    ) {
        resolvedKey = localConfig.SUPABASE_ANON_KEY;
    }
} catch {
    // js/config.js is optional (gitignored); fall back to config.example.js
}

export const SUPABASE_URL = resolvedUrl;
export const SUPABASE_ANON_KEY = resolvedKey;

export const isSupabaseConfigured = () =>
    Boolean(
        SUPABASE_URL &&
            SUPABASE_ANON_KEY &&
            !String(SUPABASE_ANON_KEY).includes('YOUR_SUPABASE')
    );

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const mapClientRow = (client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    status: client.status,
    dealValue: client.deal_value ?? client.dealValue,
    createdAt: client.created_at,
    image:
        client.image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random`
});

export const getAuthUserEmail = async () => {
    const {
        data: { session }
    } = await supabase.auth.getSession();
    return session?.user?.email?.toLowerCase() ?? null;
};

export const api = {
    signUp: async ({ email, password, fullName, company }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    company
                }
            }
        });

        if (error) {
            throw error;
        }

        return data;
    },

    signIn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        return data;
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
    },

    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error reading session:', error);
            return null;
        }
        return data.session;
    },

    getProfile: async () => {
        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return null;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, company, created_at')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) {
            console.error('Error loading profile:', profileError);
        }

        if (profile) {
            return {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                company: profile.company ?? '',
                createdAt: profile.created_at
            };
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name ?? '',
            company: user.user_metadata?.company ?? '',
            createdAt: user.created_at
        };
    },

    updateProfile: async ({ fullName, company }) => {
        const {
            data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Not authenticated');
        }

        const { data, error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                company
            })
            .eq('id', user.id)
            .select('id, email, full_name, company, created_at')
            .single();

        if (error) {
            throw error;
        }

        return {
            id: data.id,
            email: data.email,
            fullName: data.full_name,
            company: data.company ?? '',
            createdAt: data.created_at
        };
    },

    updatePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            throw error;
        }
    },

    getClients: async () => {
        const ownerEmail = await getAuthUserEmail();
        let query = supabase.from('clients').select('*').order('created_at', { ascending: false });

        if (ownerEmail) {
            query = query.eq('owner_email', ownerEmail);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }

        return (data ?? []).map(mapClientRow);
    },

    addClient: async (clientData) => {
        const ownerEmail = await getAuthUserEmail();
        if (!ownerEmail) {
            throw new Error('You must be logged in to add clients');
        }

        const { data, error } = await supabase
            .from('clients')
            .insert([
                {
                    owner_email: ownerEmail,
                    name: clientData.name,
                    email: clientData.email,
                    phone: clientData.phone,
                    company: clientData.company,
                    status: clientData.status,
                    deal_value: clientData.dealValue
                }
            ])
            .select();

        if (error) {
            console.error('Error adding client:', error);
            throw error;
        }

        return mapClientRow(data[0]);
    },

    deleteClient: async (id) => {
        const { error } = await supabase.from('clients').delete().eq('id', id);

        if (error) {
            console.error('Error deleting client:', error);
            throw error;
        }

        return true;
    }
};
