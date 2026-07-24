import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import {
    SUPABASE_URL as DEFAULT_SUPABASE_URL,
    SUPABASE_ANON_KEY as DEFAULT_SUPABASE_ANON_KEY
} from '../config.example.js';

/** Strip whitespace from pasted keys (common copy/paste issue). */
const normalizeSupabaseKey = (value) =>
    String(value ?? '')
        .trim()
        .replace(/\s+/g, '');

const normalizeSupabaseUrl = (value) => String(value ?? '').trim().replace(/\/+$/, '');

const projectRefFromUrl = (url) => {
    const match = normalizeSupabaseUrl(url).match(/^https:\/\/([^.]+)\.supabase\.co/i);
    return match?.[1] ?? null;
};

const projectRefFromJwt = (key) => {
    try {
        const segment = normalizeSupabaseKey(key).split('.')[1];
        if (!segment) return null;
        const json = atob(segment.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json).ref ?? null;
    } catch {
        return null;
    }
};

let resolvedUrl = DEFAULT_SUPABASE_URL;
let resolvedKey = DEFAULT_SUPABASE_ANON_KEY;
let loadedLocalConfig = false;

try {
    const localConfig = await import('../config.js');
    loadedLocalConfig = true;
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

export const SUPABASE_URL = normalizeSupabaseUrl(resolvedUrl);
export const SUPABASE_ANON_KEY = normalizeSupabaseKey(resolvedKey);

const urlRef = projectRefFromUrl(SUPABASE_URL);
const keyRef = projectRefFromJwt(SUPABASE_ANON_KEY);
if (urlRef && keyRef && urlRef !== keyRef) {
    console.warn(
        `[10X CRM] Supabase URL project (${urlRef}) does not match anon key project (${keyRef}). Check js/config.js.`
    );
}

export const isSupabaseConfigured = () =>
    Boolean(
        SUPABASE_URL &&
            SUPABASE_ANON_KEY &&
            !String(SUPABASE_ANON_KEY).includes('YOUR_SUPABASE') &&
            SUPABASE_ANON_KEY.startsWith('eyJ')
    );

/** User-facing hint when Supabase rejects the anon key or config is missing. */
export const getSupabaseConfigHint = () => {
    if (!loadedLocalConfig) {
        return 'შექმენით js/config.js (js/config.example.js-ის ასლი) და ჩასვით anon public გასაღები. .env.local ბრაუზერი არ კითხულობს — npm run config:sync თუ გასაღები .env.local-ში გაქვთ.';
    }
    if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
        return 'anon გასაღები უნდა იყოს JWT (Supabase → Settings → API → anon public).';
    }
    if (urlRef && keyRef && urlRef !== keyRef) {
        return `Dashboard → Settings → API: ერთი გვერდიდან დააკოპირეთ Project URL და anon public. URL არის «${urlRef}», გასაღები კი პროექტ «${keyRef}»-ისთვისაა — ჩასვით ორივე იმავე (რეალური) პროექტიდან.`;
    }
    return 'Supabase Dashboard → Settings → API → დააკოპირეთ თავიდან anon public გასაღები js/config.js-ში (ძველი გასაღები შეიძლება გაუქმებული იყოს).';
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

/** Creates or merges a row in public.profiles (trigger may be missing on older DBs). */
const syncProfileFromAuthUser = async (user) => {
    if (!user?.id || !user.email) {
        return;
    }

    const fullName =
        user.user_metadata?.full_name ?? user.user_metadata?.fullName ?? '';
    const company = user.user_metadata?.company ?? '';

    const { error } = await supabase.from('profiles').upsert(
        {
            id: user.id,
            email: user.email,
            full_name: fullName,
            company
        },
        { onConflict: 'id' }
    );

    if (error) {
        console.error('Could not save profile row:', error);
    }
};

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

        if (data.user && data.session) {
            await syncProfileFromAuthUser(data.user);
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

        if (data.user) {
            await syncProfileFromAuthUser(data.user);
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
            .upsert(
                {
                    id: user.id,
                    email: user.email,
                    full_name: fullName,
                    company
                },
                { onConflict: 'id' }
            )
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

    getClients: async ({ page = 1, limit = 10 } = {}) => {
        const ownerEmail = await getAuthUserEmail();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('clients')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (ownerEmail) {
            query = query.eq('owner_email', ownerEmail);
        }

        const { data, error, count } = await query.range(from, to);

        if (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }

        const clients = (data ?? []).map(mapClientRow);
        const loadedThrough = from + clients.length;
        const hasMore = typeof count === 'number' ? loadedThrough < count : clients.length === limit;

        return { clients, hasMore, page, limit };
    },

    updateClient: async (id, updates) => {
        const payload = {};
        if (updates.status !== undefined) {
            payload.status = updates.status;
        }

        const { data, error } = await supabase
            .from('clients')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating client:', error);
            throw error;
        }

        return mapClientRow(data);
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
