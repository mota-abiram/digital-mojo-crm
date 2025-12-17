import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, arrayUnion, query, orderBy, onSnapshot, where, startAfter, limit } from 'firebase/firestore';
import { Contact, Opportunity, Appointment, Conversation, Message, Notification } from '../types';

export const api = {
    contacts: {
        // SHARED: Contacts are visible to ALL logged-in users (no userId filter)
        getAll: async (userId?: string, lastDoc?: any, limitCount = 20) => {
            try {
                const constraints: any[] = [];
                // NO userId filtering - contacts shared across all accounts
                constraints.push(orderBy('createdAt', 'desc'));
                if (lastDoc) constraints.push(startAfter(lastDoc));
                constraints.push(limit(limitCount));

                const q = query(collection(db, 'contacts'), ...constraints);
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
                return { data, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
            } catch (error: any) {
                console.warn("Index query failed, falling back to simple query:", error);

                const constraints: any[] = [];
                // NO userId filtering - contacts shared across all accounts
                if (lastDoc) constraints.push(startAfter(lastDoc));
                constraints.push(limit(limitCount));

                const q = query(collection(db, 'contacts'), ...constraints);
                const querySnapshot = await getDocs(q);
                let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));

                // Client-side sort
                data = data.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });

                return { data, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
            }
        },
        get: async (id: string) => {
            const docRef = doc(db, 'contacts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Contact;
            }
            return null;
        },
        // SHARED: Search across ALL contacts (no userId filter)
        // Fetches all contacts and performs client-side search for comprehensive matching
        search: async (userId: string | undefined, term: string) => {
            // Fetch ALL contacts from the database to perform comprehensive search
            const q = query(collection(db, 'contacts'));
            const querySnapshot = await getDocs(q);
            const allContacts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));

            // Perform case-insensitive search across multiple fields
            const searchTermLower = term.toLowerCase().trim();

            return allContacts.filter(contact => {
                const nameMatch = contact.name?.toLowerCase().includes(searchTermLower);
                const emailMatch = contact.email?.toLowerCase().includes(searchTermLower);
                const phoneMatch = contact.phone?.toLowerCase().includes(searchTermLower);
                const companyMatch = contact.companyName?.toLowerCase().includes(searchTermLower);

                return nameMatch || emailMatch || phoneMatch || companyMatch;
            });
        },
        // SHARED: Subscribe to ALL contacts (no userId filter)
        subscribe: (callback: (data: Contact[]) => void, userId?: string) => {
            // Contacts are shared across all accounts
            const q = query(collection(db, 'contacts'), limit(100));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
                callback(data);
            });
        },
        create: async (contact: Omit<Contact, 'id'>) => {
            contact.createdAt = new Date().toISOString();
            const docRef = await addDoc(collection(db, 'contacts'), contact);
            return { id: docRef.id, ...contact } as Contact;
        },
        update: async (id: string, contact: Partial<Contact>) => {
            const docRef = doc(db, 'contacts', id);
            await updateDoc(docRef, contact);
        },
        delete: async (id: string) => {
            const docRef = doc(db, 'contacts', id);
            await deleteDoc(docRef);
        },
        bulkDelete: async (ids: string[]) => {
            const promises = ids.map(id => deleteDoc(doc(db, 'contacts', id)));
            await Promise.all(promises);
        },
        bulkAddTags: async (ids: string[], tags: string[]) => {
            const promises = ids.map(id => updateDoc(doc(db, 'contacts', id), {
                tags: arrayUnion(...tags)
            }));
            await Promise.all(promises);
        }
    },
    opportunities: {
        // SHARED: Opportunities are visible to ALL logged-in users (no userId filter)
        getAll: async (userId?: string, lastDoc?: any, limitCount: number = 20) => {
            try {
                const constraints: any[] = [];
                // NO userId filtering - opportunities shared across all accounts
                constraints.push(orderBy('createdAt', 'desc'));

                if (lastDoc) {
                    constraints.push(startAfter(lastDoc));
                }

                constraints.push(limit(limitCount));

                const q = query(collection(db, 'opportunities'), ...constraints);

                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));
                return { data, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
            } catch (error) {
                console.warn("Index query failed for opportunities, falling back:", error);

                const constraints: any[] = [];
                // NO userId filtering - opportunities shared across all accounts
                if (lastDoc) constraints.push(startAfter(lastDoc));
                constraints.push(limit(limitCount));

                const q = query(collection(db, 'opportunities'), ...constraints);
                const querySnapshot = await getDocs(q);
                let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));

                // Client-side sort
                data = data.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });

                return { data, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
            }
        },
        // SHARED: Subscribe to ALL opportunities (no userId filter)
        subscribe: (callback: (data: Opportunity[]) => void, userId?: string) => {
            // Opportunities are shared across all accounts
            const q = query(collection(db, 'opportunities'));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opportunity));
                callback(data);
            });
        },
        create: async (opp: Omit<Opportunity, 'id'>) => {
            const docRef = await addDoc(collection(db, 'opportunities'), {
                ...opp,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...opp };
        },
        update: async (id: string, opp: Partial<Opportunity>) => {
            await updateDoc(doc(db, 'opportunities', id), opp);
        },
        delete: async (id: string) => {
            await deleteDoc(doc(db, 'opportunities', id));
        },
        bulkDelete: async (ids: string[]) => {
            const promises = ids.map(id => deleteDoc(doc(db, 'opportunities', id)));
            await Promise.all(promises);
        },
        // Get total counts and values per stage
        getStageCounts: async () => {
            const q = query(collection(db, 'opportunities'));
            const querySnapshot = await getDocs(q);
            const counts: Record<string, { count: number; value: number }> = {};

            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const stage = data.stage || 'Unknown';
                const value = Number(data.value) || 0;

                if (!counts[stage]) {
                    counts[stage] = { count: 0, value: 0 };
                }
                counts[stage].count += 1;
                counts[stage].value += value;
            });

            return counts;
        }
    },
    appointments: {
        getAll: async (userId?: string) => {
            let q = query(collection(db, 'appointments'));
            if (userId) {
                q = query(collection(db, 'appointments'), where('assignedTo', '==', userId));
            }
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        },
        subscribe: (callback: (data: Appointment[]) => void, userId?: string) => {
            let q = query(collection(db, 'appointments'));
            if (userId) {
                q = query(collection(db, 'appointments'), where('assignedTo', '==', userId));
            }
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
                callback(data);
            });
        },
        create: async (apt: Omit<Appointment, 'id'>) => {
            const docRef = await addDoc(collection(db, 'appointments'), {
                ...apt,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...apt };
        },
        update: async (id: string, apt: Partial<Appointment>) => {
            await updateDoc(doc(db, 'appointments', id), apt);
        },
        delete: async (id: string) => {
            await deleteDoc(doc(db, 'appointments', id));
        }
    },
    conversations: {
        // SHARED: Conversations are visible to ALL logged-in users (no userId filter)
        getAll: async (userId?: string) => {
            const q = query(collection(db, 'conversations'), orderBy('time', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
        },
        // SHARED: Subscribe to ALL conversations (no userId filter)
        subscribe: (callback: (data: Conversation[]) => void, userId?: string) => {
            const q = query(collection(db, 'conversations'), orderBy('time', 'desc'));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
                callback(data);
            });
        },
        sendMessage: async (conversationId: string, message: Message) => {
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (conversationDoc.exists()) {
                await updateDoc(conversationRef, {
                    messages: arrayUnion(message),
                    lastMessage: message.message,
                    time: 'Just now'
                });
            }
        },
        create: async (conversation: Omit<Conversation, 'id'>) => {
            const docRef = await addDoc(collection(db, 'conversations'), conversation);
            return { id: docRef.id, ...conversation };
        }
    },
    notifications: {
        getAll: async () => {
            return [] as Notification[];
        }
    }
};
