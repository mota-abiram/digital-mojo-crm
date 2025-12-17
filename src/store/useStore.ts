import { create } from 'zustand';
import { Contact, Opportunity, Appointment, Conversation, Notification, Message, User } from '../types';
import { api } from '../services/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AppState {
    currentUser: User | null;
    isLoadingAuth: boolean;
    setCurrentUser: (user: User | null) => void;
    logout: () => Promise<void>;
    initializeAuthListener: () => void;

    contacts: Contact[];
    opportunities: Opportunity[];
    appointments: Appointment[];
    isLoading: boolean;
    lastContactDoc: any;
    hasMoreContacts: boolean;

    fetchContacts: () => Promise<void>;
    fetchContact: (id: string) => Promise<Contact | null>;
    searchContacts: (term: string) => Promise<void>;
    loadMoreContacts: () => Promise<void>;
    addContact: (contact: Omit<Contact, 'id'>) => Promise<Contact>;
    updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
    bulkDeleteContacts: (ids: string[]) => Promise<void>;


    stages: { id: string; title: string; color: string }[];
    stageCounts: Record<string, { count: number; value: number }>;
    fetchOpportunities: () => Promise<void>;
    lastOpportunityDoc: any;
    hasMoreOpportunities: boolean;
    loadMoreOpportunities: () => Promise<void>;
    addOpportunity: (opp: Omit<Opportunity, 'id'>) => Promise<void>;
    updateOpportunity: (id: string, opp: Partial<Opportunity>) => Promise<void>;
    deleteOpportunity: (id: string) => Promise<void>;
    bulkDeleteOpportunities: (ids: string[]) => Promise<void>;
    updateStages: (stages: { id: string; title: string; color: string }[]) => void;
    fetchStageCounts: () => Promise<void>;

    fetchAppointments: () => Promise<void>;
    addAppointment: (apt: Omit<Appointment, 'id'>) => Promise<void>;
    updateAppointment: (id: string, apt: Partial<Appointment>) => Promise<void>;
    deleteAppointment: (id: string) => Promise<void>;

    conversations: Conversation[];
    activeConversationId: string | null;
    setActiveConversation: (id: string) => void;
    fetchConversations: () => Promise<void>;
    sendMessage: (conversationId: string, text: string) => Promise<void>;
    createConversation: (contactId: string, contactName: string) => Promise<void>;

    notifications: Notification[];
    fetchNotifications: () => Promise<void>;

    // Google Integration
    googleToken: string | null;
    setGoogleToken: (token: string | null) => void;

    initializeListeners: () => void;
}

export const useStore = create<AppState>((set, get) => ({
    currentUser: null,
    isLoadingAuth: true,
    setCurrentUser: (user) => set({ currentUser: user }),
    logout: async () => {
        await signOut(auth);
        set({
            currentUser: null,
            contacts: [],
            opportunities: [],
            appointments: [],
            conversations: [],
            notifications: [],
            googleToken: null
        });
    },
    initializeAuthListener: () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                set({
                    currentUser: {
                        id: user.uid,
                        name: user.displayName || user.email?.split('@')[0] || 'User',
                        email: user.email || '',
                        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`
                    },
                    isLoadingAuth: false
                });
                get().initializeListeners();
            } else {
                set({
                    currentUser: null,
                    isLoadingAuth: false,
                    contacts: [],
                    opportunities: [],
                    appointments: [],
                    conversations: []
                });
            }
        });
    },

    contacts: [],
    opportunities: [],
    stages: [
        { id: '0', title: '0 - Junk', color: '#808080' },
        { id: '10', title: '10 - Closed', color: '#1ea34f' },
        { id: '16', title: '16 - Yet to contact', color: '#f0bc00' },
        { id: '17', title: '17 - Follow Later', color: '#754c9b' },
        { id: '18', title: '18 - Luke Warm', color: '#ff8c00' },
        { id: '19', title: '19 - Warm', color: '#ffa500' },
        { id: '20', title: '20 - Hot', color: '#ff4500' },
        { id: '20.5', title: '20.5 - Negotiations', color: '#06aed7' },
        { id: '21', title: '21 - Cheque Ready', color: '#006400' },
    ],
    stageCounts: {},
    updateStages: (stages) => set({ stages }),
    fetchStageCounts: async () => {
        const counts = await api.opportunities.getStageCounts();
        set({ stageCounts: counts });
    },
    appointments: [],
    conversations: [],
    activeConversationId: null,
    notifications: [],

    googleToken: null,
    setGoogleToken: (token) => set({ googleToken: token }),

    isLoading: false,
    lastContactDoc: null,
    hasMoreContacts: false,

    fetchContacts: async () => {
        set({ isLoading: true });
        const userId = get().currentUser?.id;
        const { data, lastDoc } = await api.contacts.getAll(userId, null, 20);
        set({
            contacts: data,
            lastContactDoc: lastDoc,
            hasMoreContacts: data.length === 20,
            isLoading: false
        });
    },
    fetchContact: async (id: string) => {
        const contact = await api.contacts.get(id);
        if (contact) {
            set((state) => {
                if (state.contacts.some(c => c.id === contact.id)) {
                    return { contacts: state.contacts.map(c => c.id === contact.id ? contact : c) };
                }
                return { contacts: [contact, ...state.contacts] };
            });
            return contact;
        }
        return null;
    },
    searchContacts: async (term: string) => {
        set({ isLoading: true });
        const userId = get().currentUser?.id;
        if (!term) {
            // If search is cleared, fetch initial page again
            const { data, lastDoc } = await api.contacts.getAll(userId, null, 20);
            set({
                contacts: data,
                lastContactDoc: lastDoc,
                hasMoreContacts: data.length === 20,
                isLoading: false
            });
            return;
        }

        try {
            const results = await api.contacts.search(userId, term);
            set({
                contacts: results,
                hasMoreContacts: false, // Search results are not paginated for now
                isLoading: false
            });
        } catch (error) {
            console.error("Search failed", error);
            // Fallback to client-side filter if index is missing
            const allContacts = get().contacts;
            const filtered = allContacts.filter(c => c.name.toLowerCase().includes(term.toLowerCase()));
            set({ contacts: filtered, isLoading: false });
        }
    },
    loadMoreContacts: async () => {
        const { lastContactDoc, contacts, currentUser, hasMoreContacts } = get();
        if (!hasMoreContacts || !lastContactDoc) return;

        const { data, lastDoc } = await api.contacts.getAll(currentUser?.id, lastContactDoc, 20);
        set({
            contacts: [...contacts, ...data],
            lastContactDoc: lastDoc,
            hasMoreContacts: data.length === 20
        });
    },
    addContact: async (contact) => {
        const newContact = await api.contacts.create(contact);
        set((state) => {
            // Check if contact already exists in state to prevent duplicates
            if (state.contacts.some(c => c.id === newContact.id)) {
                return { contacts: state.contacts };
            }
            return { contacts: [newContact, ...state.contacts] };
        });
        return newContact;
    },
    updateContact: async (id, contact) => {
        await api.contacts.update(id, contact);
        set((state) => ({
            contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...contact } : c)),
        }));
    },
    deleteContact: async (id) => {
        await api.contacts.delete(id);
        set((state) => ({
            contacts: state.contacts.filter((c) => c.id !== id),
        }));
    },
    bulkDeleteContacts: async (ids: string[]) => {
        await api.contacts.bulkDelete(ids);
        set((state) => ({
            contacts: state.contacts.filter((c) => !ids.includes(c.id)),
        }));
    },


    lastOpportunityDoc: null,
    hasMoreOpportunities: false,

    fetchOpportunities: async () => {
        set({ isLoading: true });
        const userId = get().currentUser?.id;
        const { data, lastDoc } = await api.opportunities.getAll(userId, null, 20);
        set({
            opportunities: data,
            lastOpportunityDoc: lastDoc,
            hasMoreOpportunities: data.length === 20,
            isLoading: false
        });
    },
    loadMoreOpportunities: async () => {
        const { lastOpportunityDoc, opportunities, currentUser, hasMoreOpportunities } = get();
        if (!hasMoreOpportunities || !lastOpportunityDoc) return;

        const { data, lastDoc } = await api.opportunities.getAll(currentUser?.id, lastOpportunityDoc, 20);
        set({
            opportunities: [...opportunities, ...data],
            lastOpportunityDoc: lastDoc,
            hasMoreOpportunities: data.length === 20
        });
    },
    addOpportunity: async (opp) => {
        const newOpp = await api.opportunities.create(opp);
        set((state) => {
            // Check if opportunity already exists in state to prevent duplicates
            if (state.opportunities.some(o => o.id === newOpp.id)) {
                return { opportunities: state.opportunities };
            }
            return { opportunities: [...state.opportunities, newOpp] };
        });
        // Refresh stage counts after adding
        get().fetchStageCounts();
    },
    updateOpportunity: async (id, opp) => {
        await api.opportunities.update(id, opp);
        set((state) => ({
            opportunities: state.opportunities.map((o) => (o.id === id ? { ...o, ...opp } : o)),
        }));
        // Refresh stage counts if stage or value might have changed
        if (opp.stage !== undefined || opp.value !== undefined) {
            get().fetchStageCounts();
        }
    },
    deleteOpportunity: async (id) => {
        const opp = get().opportunities.find((o) => o.id === id);
        if (opp?.contactId) {
            await api.contacts.delete(opp.contactId);
            set((state) => ({
                contacts: state.contacts.filter((c) => c.id !== opp.contactId),
            }));
        }
        await api.opportunities.delete(id);
        set((state) => ({
            opportunities: state.opportunities.filter((o) => o.id !== id),
        }));
        // Refresh stage counts after deletion
        get().fetchStageCounts();
    },
    bulkDeleteOpportunities: async (ids: string[]) => {
        const opps = get().opportunities.filter((o) => ids.includes(o.id));
        const contactIds = opps.map((o) => o.contactId).filter((id): id is string => !!id);

        if (contactIds.length > 0) {
            await api.contacts.bulkDelete(contactIds);
            set((state) => ({
                contacts: state.contacts.filter((c) => !contactIds.includes(c.id)),
            }));
        }

        await api.opportunities.bulkDelete(ids);
        set((state) => ({
            opportunities: state.opportunities.filter((o) => !ids.includes(o.id)),
        }));
        // Refresh stage counts after bulk deletion
        get().fetchStageCounts();
    },

    fetchAppointments: async () => {
        const userId = get().currentUser?.id;
        if (!userId) {
            set({ appointments: [] });
            return;
        }
        const appointments = await api.appointments.getAll(userId);
        set({ appointments });
    },
    addAppointment: async (apt) => {
        const newApt = await api.appointments.create(apt);
        set((state) => {
            if (state.appointments.some(a => a.id === newApt.id)) {
                return { appointments: state.appointments };
            }
            return { appointments: [...state.appointments, newApt] };
        });
    },
    updateAppointment: async (id, apt) => {
        await api.appointments.update(id, apt);
        set((state) => ({
            appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...apt } : a)),
        }));
    },
    deleteAppointment: async (id) => {
        await api.appointments.delete(id);
        set((state) => ({
            appointments: state.appointments.filter((a) => a.id !== id),
        }));
    },

    // Conversations
    setActiveConversation: (id) => set({ activeConversationId: id }),
    createConversation: async (contactId, contactName) => {
        const userId = get().currentUser?.id;
        if (!userId) return;

        // Check if conversation already exists
        const existing = get().conversations.find(c => c.contactId === contactId);
        if (existing) {
            set({ activeConversationId: existing.id });
            return;
        }

        const newConv = await api.conversations.create({
            contactId,
            contactName,
            lastMessage: '',
            time: new Date().toISOString(),
            unread: false,
            messages: [],
            owner: userId
        });

        set(state => ({
            conversations: [newConv, ...state.conversations],
            activeConversationId: newConv.id
        }));
    },

    fetchConversations: async () => {
        const userId = get().currentUser?.id;
        const conversations = await api.conversations.getAll(userId);
        set({ conversations });
    },

    sendMessage: async (conversationId, text) => {
        const userId = get().currentUser?.id;
        if (!userId) return;

        const message: Message = {
            id: Date.now().toString(),
            sender: 'me',
            message: text,
            timestamp: new Date().toISOString()
        };

        await api.conversations.sendMessage(conversationId, message);
    },

    fetchNotifications: async () => {
        // Mock notifications for now
        set({ notifications: [] });
    },

    initializeListeners: () => {
        const userId = get().currentUser?.id;
        if (!userId) return;

        // Fetch initial data
        get().fetchContacts();
        get().fetchOpportunities();
        get().fetchAppointments();
        get().fetchConversations();
        get().fetchNotifications();

        // Subscribe to real-time updates
        // Note: We are using fetch instead of subscribe for heavy filtered lists to avoid excessive reads/complexity
        // but if we were to subscribe, we MUST pass userId.

        const unsubscribeApps = api.appointments.subscribe((data) => {
            set({ appointments: data });
        }, userId);

        const unsubConvs = api.conversations.subscribe((data) => {
            set({ conversations: data });
        }, userId);

        // Store unsubscribe functions if needed for cleanup
    }
}));
